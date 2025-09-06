import express from "express";
import multer from "multer";
import { analyzeWithGPT4, analyzeWithGPT5 } from "../llm/azureClient.js";
import { performComprehensiveScan } from "../services/securityApis.js";

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// Handle multiple screenshots
router.post("/", upload.array('screenshots', 5), async (req, res) => {
  try {
    const { question, detailedAnalysis } = req.body || {};
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: "error",
        reasons: ["No screenshots provided"]
      });
    }

    if (req.files.length === 1) {
      // Single screenshot analysis
      const analysis = await analyzeSingleScreenshot(req.files[0], question, detailedAnalysis === 'true');
      res.json(analysis);
    } else {
      // Multiple screenshots analysis
      const analysis = await analyzeMultipleScreenshots(req.files, question, detailedAnalysis === 'true');
      res.json(analysis);
    }
    
  } catch (err) {
    console.error("Screenshot analysis error:", err);
    res.status(500).json({
      status: "error", 
      reasons: ["Screenshot analysis failed", err.message]
    });
  }
});

async function analyzeSingleScreenshot(file, userQuestion, useDetailedAnalysis) {
  try {
    // Convert image to base64 for analysis
    const base64Image = file.buffer.toString('base64');
    
    const prompt = `Analyze this screenshot for cybersecurity threats and suspicious content.

Image Analysis Required:
1. PHISHING DETECTION: Look for fake login pages, suspicious forms, or brand impersonation
2. MALICIOUS CONTENT: Identify suspicious downloads, pop-ups, or social engineering attempts  
3. URL ANALYSIS: Examine any visible URLs for legitimacy
4. VISUAL INDICATORS: Check for spelling errors, poor design, or other red flags
5. USER INTERFACE: Assess if the interface matches legitimate applications/websites

${userQuestion ? `User Question: "${userQuestion}"` : ''}

Provide assessment in this format:
THREAT_LEVEL: [SAFE/WARN/BLOCK]
CONFIDENCE: [0-100]
FINDINGS: [List specific observations from the image]
RECOMMENDATIONS: [Actionable advice]
${userQuestion ? 'ANSWER: [Direct response to user question]' : ''}

Analyze the visual content carefully and provide specific details about what you observe.`;

    const aiResponse = useDetailedAnalysis 
      ? await analyzeWithGPT5(prompt, { image_analysis: true })
      : await analyzeWithGPT4(prompt, { image_analysis: true });

    // Extract URLs from the analysis for external verification
    const urlMatches = aiResponse.answer.match(/https?:\/\/[^\s<>"]+/g) || [];
    const externalScans = await Promise.all(
      urlMatches.slice(0, 2).map(url => performComprehensiveScan(url).catch(() => null))
    );

    return parseScreenshotAnalysis(aiResponse, externalScans.filter(Boolean), userQuestion, 1);
    
  } catch (error) {
    console.error("Single screenshot analysis failed:", error);
    throw error;
  }
}

async function analyzeMultipleScreenshots(files, userQuestion, useDetailedAnalysis) {
  try {
    const imageDescriptions = files.map((file, index) => {
      const base64Image = file.buffer.toString('base64');
      return `Screenshot ${index + 1}: ${file.originalname || `image_${index + 1}`}`;
    }).join('\n');

    const prompt = `Analyze these ${files.length} screenshots collectively for cybersecurity threats and patterns.

Screenshots to analyze:
${imageDescriptions}

Comprehensive Analysis Required:
1. CROSS-REFERENCE ANALYSIS: Look for patterns across multiple screenshots
2. PHISHING CAMPAIGNS: Identify if screenshots show coordinated phishing attempts
3. PROGRESSION ANALYSIS: Analyze if screenshots show steps in a scam process
4. CONSISTENCY CHECK: Verify if interfaces are consistent with legitimate services
5. THREAT CORRELATION: Identify relationships between different screenshots

${userQuestion ? `User Question: "${userQuestion}"` : ''}

Provide comprehensive assessment:
OVERALL_THREAT_LEVEL: [SAFE/WARN/BLOCK]
CONFIDENCE: [0-100]
INDIVIDUAL_FINDINGS: [Analysis of each screenshot]
COLLECTIVE_FINDINGS: [Patterns across screenshots]
RECOMMENDATIONS: [Comprehensive guidance]
${userQuestion ? 'ANSWER: [Response considering all screenshots]' : ''}

Provide detailed analysis considering all screenshots together.`;

    const aiResponse = useDetailedAnalysis 
      ? await analyzeWithGPT5(prompt, { multi_image_analysis: true })
      : await analyzeWithGPT4(prompt, { multi_image_analysis: true });

    return parseMultipleScreenshotAnalysis(aiResponse, userQuestion, files.length);
    
  } catch (error) {
    console.error("Multiple screenshot analysis failed:", error);
    throw error;
  }
}

function parseScreenshotAnalysis(aiResponse, externalScans, userQuestion, screenshotCount) {
  const text = aiResponse.answer;
  
  const threatMatch = text.match(/THREAT_LEVEL:\s*(SAFE|WARN|BLOCK)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
  const findingsMatch = text.match(/FINDINGS:\s*(.*?)(?=RECOMMENDATIONS:|ANSWER:|$)/is);
  const recommendationsMatch = text.match(/RECOMMENDATIONS:\s*(.*?)(?=ANSWER:|$)/is);
  const answerMatch = text.match(/ANSWER:\s*(.*?)$/is);

  let status = threatMatch ? threatMatch[1].toLowerCase() : "safe";
  let confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
  
  const findings = findingsMatch ? 
    findingsMatch[1].split(/\n|;|-/).filter(f => f.trim().length > 5).map(f => f.trim()) : 
    ["Screenshot content analyzed"];
    
  const recommendations = recommendationsMatch ?
    recommendationsMatch[1].split(/\n|;|-/).filter(r => r.trim().length > 5).map(r => r.trim()) :
    ["Continue with normal security practices"];

  // Add external scan results
  const externalFindings = [];
  if (externalScans.length > 0) {
    externalScans.forEach((scan) => {
      if (scan.virusTotal && scan.virusTotal.malicious > 0) {
        externalFindings.push(`VirusTotal: ${scan.virusTotal.malicious} engines flagged URLs as malicious`);
        if (status === "safe") status = "block";
        confidence = Math.min(confidence, 25);
      }
      if (scan.googleSafeBrowsing === true) {
        externalFindings.push("Google Safe Browsing: URLs flagged as unsafe");
        if (status === "safe") status = "block";
        confidence = Math.min(confidence, 20);
      }
    });
  }

  const result = {
    status,
    confidence,
    model_used: aiResponse.model,
    findings: [...findings, ...externalFindings],
    recommendations,
    external_verification: externalScans.length > 0,
    analysis_type: `screenshot_analysis_${screenshotCount}_image${screenshotCount > 1 ? 's' : ''}`,
    screenshots_analyzed: screenshotCount
  };

  if (userQuestion && answerMatch) {
    result.user_answer = answerMatch[1].trim();
  }

  return result;
}

function parseMultipleScreenshotAnalysis(aiResponse, userQuestion, screenshotCount) {
  const text = aiResponse.answer;
  
  const threatMatch = text.match(/OVERALL_THREAT_LEVEL:\s*(SAFE|WARN|BLOCK)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
  const individualMatch = text.match(/INDIVIDUAL_FINDINGS:\s*(.*?)(?=COLLECTIVE_FINDINGS:|RECOMMENDATIONS:|ANSWER:|$)/is);
  const collectiveMatch = text.match(/COLLECTIVE_FINDINGS:\s*(.*?)(?=RECOMMENDATIONS:|ANSWER:|$)/is);
  const recommendationsMatch = text.match(/RECOMMENDATIONS:\s*(.*?)(?=ANSWER:|$)/is);
  const answerMatch = text.match(/ANSWER:\s*(.*?)$/is);

  let status = threatMatch ? threatMatch[1].toLowerCase() : "safe";
  let confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;
  
  const findings = [];
  
  if (individualMatch) {
    findings.push("Individual Screenshot Analysis:");
    const individual = individualMatch[1].split(/\n/).filter(f => f.trim().length > 5);
    findings.push(...individual.map(f => "  " + f.trim()));
  }
  
  if (collectiveMatch) {
    findings.push("Collective Pattern Analysis:");
    const collective = collectiveMatch[1].split(/\n/).filter(f => f.trim().length > 5);
    findings.push(...collective.map(f => "  " + f.trim()));
  }

  const recommendations = recommendationsMatch ?
    recommendationsMatch[1].split(/\n|;/).filter(r => r.trim().length > 5).map(r => r.trim()) :
    ["Review all screenshots for consistency with legitimate services"];

  const result = {
    status,
    confidence,
    model_used: aiResponse.model,
    findings: findings.length > 0 ? findings : ["Multiple screenshots analyzed collectively"],
    recommendations,
    external_verification: false,
    analysis_type: `multi_screenshot_analysis`,
    screenshots_analyzed: screenshotCount
  };

  if (userQuestion && answerMatch) {
    result.user_answer = answerMatch[1].trim();
  }

  return result;
}

export default router;

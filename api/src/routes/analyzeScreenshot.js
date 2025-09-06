import express from "express";
import multer from "multer";
import { analyzeWithGPT4, analyzeWithGPT5 } from "../llm/azureClient.js";

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith('image/'));
  }
});

router.post("/", upload.single('screenshot'), async (req, res) => {
  try {
    const { question, detailedAnalysis } = req.body || {};
    
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        reasons: ["No screenshot provided"]
      });
    }

    const analysis = await analyzeScreenshot(req.file, question, detailedAnalysis === 'true');
    res.json(analysis);
    
  } catch (err) {
    console.error("Screenshot analysis error:", err);
    res.status(500).json({
      status: "error", 
      reasons: ["Screenshot analysis failed"]
    });
  }
});

async function analyzeScreenshot(file, userQuestion, useDetailedAnalysis) {
  const prompt = `Analyze this screenshot for cybersecurity threats.

Look for:
1. Phishing attempts (fake login pages, brand impersonation)
2. Suspicious pop-ups or downloads
3. Poor design quality or spelling errors
4. Suspicious URLs or forms

${userQuestion ? `User Question: "${userQuestion}"` : ''}

Provide:
THREAT_LEVEL: [SAFE/WARN/BLOCK]
CONFIDENCE: [0-100]
FINDINGS: [What you observe]
${userQuestion ? 'ANSWER: [Response to question]' : ''}`;

  const aiResponse = useDetailedAnalysis 
    ? await analyzeWithGPT5(prompt)
    : await analyzeWithGPT4(prompt);

  return parseScreenshotResponse(aiResponse, userQuestion);
}

function parseScreenshotResponse(aiResponse, userQuestion) {
  const text = aiResponse.answer;
  
  const threatMatch = text.match(/THREAT_LEVEL:\s*(SAFE|WARN|BLOCK)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(\d+)/i);
  const findingsMatch = text.match(/FINDINGS:\s*(.*?)(?=ANSWER:|$)/is);
  const answerMatch = text.match(/ANSWER:\s*(.*?)$/is);

  const result = {
    status: threatMatch ? threatMatch[1].toLowerCase() : "safe",
    confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75,
    model_used: aiResponse.model,
    findings: findingsMatch ? 
      findingsMatch[1].split(/\n|;/).filter(f => f.trim().length > 5).map(f => f.trim()) : 
      ["Screenshot analyzed"],
    analysis_type: "screenshot"
  };

  if (userQuestion && answerMatch) {
    result.user_answer = answerMatch[1].trim();
  }

  return result;
}

export default router;

import axios from "axios";

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const GOOGLE_SAFE_BROWSING_KEY = process.env.GOOGLE_SAFE_BROWSING_KEY;
const PHISHTANK_API_KEY = process.env.PHISHTANK_API_KEY;

export async function checkVirusTotal(url) {
  if (!VIRUSTOTAL_API_KEY) return null;
  try {
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '');
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      { headers: { 'x-apikey': VIRUSTOTAL_API_KEY }, timeout: 10000 }
    );
    const stats = response.data.data.attributes.last_analysis_stats;
    return {
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      clean: stats.harmless || 0,
      total_scans: stats.malicious + stats.suspicious + stats.harmless + stats.undetected
    };
  } catch (error) {
    console.error("VirusTotal API error:", error.message);
    return null;
  }
}

export async function checkGoogleSafeBrowsing(url) {
  if (!GOOGLE_SAFE_BROWSING_KEY) return null;
  try {
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_KEY}`,
      {
        client: { clientId: "elara-security", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }]
        }
      },
      { timeout: 8000 }
    );
    return response.data.matches ? response.data.matches.length > 0 : false;
  } catch (error) {
    console.error("Google Safe Browsing API error:", error.message);
    return null;
  }
}

export async function performComprehensiveScan(url) {
  const results = await Promise.allSettled([
    checkVirusTotal(url),
    checkGoogleSafeBrowsing(url)
  ]);
  return {
    virusTotal: results[0].status === 'fulfilled' ? results[0].value : null,
    googleSafeBrowsing: results[1].status === 'fulfilled' ? results[1].value : null,
    timestamp: new Date().toISOString()
  };
}

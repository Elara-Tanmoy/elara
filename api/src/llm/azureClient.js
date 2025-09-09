import axios from "axios";

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const API_KEY = process.env.AZURE_OPENAI_API_KEY;
const DEPLOYMENT_41 = process.env.AZURE_OPENAI_DEPLOYMENT_41_MINI || "gpt-4.1-mini-ESCALATION";
const VERSION_41 = process.env.AZURE_OPENAI_API_VERSION_41 || "2025-01-01-preview";

if (!ENDPOINT || !API_KEY) {
  console.warn("Azure OpenAI configuration incomplete");
}

const http = axios.create({
  baseURL: ENDPOINT,
  headers: { 
    "api-key": API_KEY,
    "Content-Type": "application/json" 
  },
  timeout: 30000,
});

export async function askElaraScamExplain(question, context = {}) {
  if (!API_KEY) {
    throw new Error("Azure OpenAI API key not available");
  }
  
  const messages = [
    {
      role: "system",
      content: "You are Elara, an expert cybersecurity AI. Analyze threats accurately and provide clear assessments."
    },
    {
      role: "user",
      content: question
    }
  ];

  try {
    const url = `/openai/deployments/${DEPLOYMENT_41}/chat/completions?api-version=${VERSION_41}`;
    const body = { 
      messages, 
      temperature: 0.1, 
      max_tokens: 500 
    };
    
    const { data } = await http.post(url, body);
    return {
      model: "gpt-4.1-mini",
      confidence: 0.95,
      answer: data?.choices?.[0]?.message?.content || "No response generated"
    };
  } catch (error) {
    console.error("AI analysis failed:", error.response?.data || error.message);
    throw new Error("AI analysis service temporarily unavailable");
  }
}

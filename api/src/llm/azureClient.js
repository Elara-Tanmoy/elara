import axios from "axios";

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://tanmo-mekhv7ql-eastus2.cognitiveservices.azure.com";
const API_KEY = process.env.AZURE_OPENAI_API_KEY;

const DEPLOYMENT_41 = process.env.AZURE_OPENAI_DEPLOYMENT_41_MINI || "gpt-4.1-mini-ESCALATION";
const VERSION_41 = process.env.AZURE_OPENAI_API_VERSION_41 || "2025-01-01-preview";

if (!API_KEY) {
  console.warn("AZURE_OPENAI_API_KEY not set - using fallback analysis");
}

const http = axios.create({
  baseURL: ENDPOINT,
  headers: { "api-key": API_KEY || "not-set", "Content-Type": "application/json" },
  timeout: 30000,
});

export async function chat41Mini(messages, { maxTokens = 400, temperature = 0.1 } = {}) {
  if (!API_KEY) throw new Error("Azure OpenAI API key not configured");
  
  const url = `/openai/deployments/${DEPLOYMENT_41}/chat/completions?api-version=${VERSION_41}`;
  const body = { messages, temperature, max_tokens: maxTokens };
  const { data } = await http.post(url, body);
  return data?.choices?.[0]?.message?.content || "No response";
}

export async function askElaraScamExplain(question, context = {}) {
  const messages = [
    {
      role: "system",
      content: "You are Elara, an expert cybersecurity AI. Analyze URLs and messages for threats with high accuracy. Respond with clear risk assessment and specific reasons."
    },
    {
      role: "user",
      content: question
    }
  ];

  try {
    const answer = await chat41Mini(messages, { maxTokens: 500, temperature: 0.1 });
    return {
      model: "gpt-4.1-mini",
      confidence: 0.95,
      answer: answer
    };
  } catch (error) {
    console.error("LLM error:", error);
    throw new Error("AI analysis service unavailable");
  }
}

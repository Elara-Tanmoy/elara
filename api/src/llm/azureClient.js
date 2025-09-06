import axios from "axios";

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://tanmo-mekhv7ql-eastus2.cognitiveservices.azure.com";
const API_KEY = process.env.AZURE_OPENAI_API_KEY;
const DEPLOYMENT_41 = process.env.AZURE_OPENAI_DEPLOYMENT_41_MINI || "gpt-4.1-mini-ESCALATION";
const VERSION_41 = process.env.AZURE_OPENAI_API_VERSION_41 || "2025-01-01-preview";
const DEPLOYMENT_5 = process.env.AZURE_OPENAI_MODEL_5_MINI || "gpt-5-mini";
const VERSION_5 = process.env.AZURE_OPENAI_API_VERSION_5 || "2025-04-01-preview";

if (!API_KEY) {
  console.warn("AZURE_OPENAI_API_KEY not set");
}

const http = axios.create({
  baseURL: ENDPOINT,
  headers: { "api-key": API_KEY || "not-set", "Content-Type": "application/json" },
  timeout: 60000,
});

export async function chat41Mini(messages, options = {}) {
  if (!API_KEY) throw new Error("Azure OpenAI API key not configured");
  const { maxTokens = 800, temperature = 0.1 } = options;
  const url = `/openai/deployments/${DEPLOYMENT_41}/chat/completions?api-version=${VERSION_41}`;
  const body = { messages, temperature, max_tokens: maxTokens };
  const { data } = await http.post(url, body);
  return data?.choices?.[0]?.message?.content || "No response";
}

export async function chat5Mini(messages, options = {}) {
  if (!API_KEY) throw new Error("Azure OpenAI API key not configured");
  const { maxTokens = 1200, temperature = 0.05 } = options;
  const url = `/openai/deployments/${DEPLOYMENT_5}/chat/completions?api-version=${VERSION_5}`;
  const body = { messages, temperature, max_tokens: maxTokens };
  const { data } = await http.post(url, body);
  return data?.choices?.[0]?.message?.content || "No response";
}

export async function analyzeWithGPT4(prompt, context = {}) {
  const messages = [
    { role: "system", content: "You are Elara, a cybersecurity expert. Provide clear, actionable security analysis." },
    { role: "user", content: prompt }
  ];
  try {
    const answer = await chat41Mini(messages, { maxTokens: 600 });
    return { model: "gpt-4.1-mini", answer, confidence: 0.9 };
  } catch (error) {
    console.error("GPT-4 analysis failed:", error);
    throw error;
  }
}

export async function analyzeWithGPT5(prompt, context = {}) {
  const messages = [
    { role: "system", content: "You are Elara, an advanced cybersecurity AI. Provide comprehensive threat analysis with detailed explanations." },
    { role: "user", content: prompt }
  ];
  try {
    const answer = await chat5Mini(messages, { maxTokens: 1200 });
    return { model: "gpt-5-mini", answer, confidence: 0.95 };
  } catch (error) {
    console.error("GPT-5 analysis failed:", error);
    throw error;
  }
}

export async function askElaraScamExplain(question, context = {}) {
  return analyzeWithGPT4(question, context);
}

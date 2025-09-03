import axios from "axios";

// ---- Hard-wired to your environment; env vars override if set ----
const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT
  || "https://tanmo-mekhv7ql-eastus2.cognitiveservices.azure.com";
const API_KEY  = process.env.AZURE_OPENAI_API_KEY;

// Default (4.1 mini via Chat Completions)
const DEPLOYMENT_41 = process.env.AZURE_OPENAI_DEPLOYMENT_41_MINI
  || "gpt-4.1-mini-ESCALATION";
const VERSION_41    = process.env.AZURE_OPENAI_API_VERSION_41
  || "2025-01-01-preview";

// Escalation (5 mini via Responses API)
const MODEL_5   = process.env.AZURE_OPENAI_MODEL_5_MINI || "gpt-5-mini";
const VERSION_5 = process.env.AZURE_OPENAI_API_VERSION_5 || "2025-04-01-preview";

if (!ENDPOINT) throw new Error("Missing AZURE_OPENAI_ENDPOINT.");
if (!API_KEY)  throw new Error("Missing AZURE_OPENAI_API_KEY (Key Vault reference).");

const http = axios.create({
  baseURL: ENDPOINT,
  headers: { "api-key": API_KEY, "Content-Type": "application/json" },
  timeout: 20000
});

export async function chat41Mini(messages, { maxTokens = 250, temperature = 0.2 } = {}) {
  const url = `/openai/deployments/${DEPLOYMENT_41}/chat/completions?api-version=${VERSION_41}`;
  const body = { messages, temperature, max_tokens: maxTokens };
  const { data } = await http.post(url, body);
  const text = data?.choices?.[0]?.message?.content ?? "";
  return { text, raw: data };
}

export async function respond5Mini(messages, { maxTokens = 300, temperature = 0.2 } = {}) {
  const url  = `/openai/responses?api-version=${VERSION_5}`;
  const body = { model: MODEL_5, input: messages, temperature, max_output_tokens: maxTokens };
  const { data } = await http.post(url, body);

  let text = data?.output_text;
  if (!text && Array.isArray(data?.output)) {
    const c = data.output[0]?.content?.[0];
    if (c?.type === "output_text" && typeof c.text === "string") text = c.text;
  }
  if (!text) text = JSON.stringify(data);
  return { text, raw: data };
}

function parseJsonBlock(s) {
  try {
    const m = s.match(/\{[\s\S]*\}$/);
    if (!m) return null;
    const obj = JSON.parse(m[0]);
    if (typeof obj.answer === "string" && typeof obj.confidence === "number") return obj;
    return null;
  } catch { return null; }
}

export async function askElaraScamExplain(userPrompt, context = {}) {
  const system = {
    role: "system",
    content:
      "You are Elara, a scam-prevention assistant. Be concise. " +
      "NEVER include live/clickable links. " +
      "Return STRICT JSON: {\"answer\":\"<plain text>\",\"confidence\":<0..1>} only."
  };

  const user = {
    role: "user",
    content:
      `Task: Explain scam risk in 3 bullets and 2 safe next steps.\n\n` +
      `Question: ${userPrompt}\n` +
      (context?.url ? `URL: ${context.url}\n` : "") +
      (context?.observations ? `Observations: ${context.observations}\n` : "") +
      `Constraints: No links.`
  };

  // Try 4.1-mini first
  const { text: firstText } = await chat41Mini([system, user]);
  const firstJson = parseJsonBlock(firstText);
  if (firstJson && firstJson.confidence >= 0.65) {
    return { model: "gpt-4.1-mini", ...firstJson };
  }

  // Escalate to 5-mini
  const escSys  = { role: "system", content: "You are Elara (escalation). Output STRICT JSON {\"answer\":\"...\",\"confidence\":<0..1>}." };
  const escUser = { role: "user",   content: `Prior answer:\n${firstText}\n\nRe-answer clearly for a layperson.` };
  const { text: escText } = await respond5Mini([escSys, escUser]);
  const escJson = parseJsonBlock(escText);
  if (escJson) return { model: "gpt-5-mini", ...escJson };

  return { model: "gpt-5-mini", answer: escText || firstText || "Unable to generate an answer.", confidence: 0.5 };
}

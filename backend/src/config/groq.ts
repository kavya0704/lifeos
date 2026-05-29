import Groq from "groq-sdk";

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";

export { groqClient };

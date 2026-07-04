import OpenAI from "openai"
import { config, hasModel } from "../config"

let client: OpenAI | null = null

export function getClient(): OpenAI {
  if (!hasModel()) {
    throw new Error("LLM_API_KEY is not configured. Set it in .env")
  }
  if (!client) {
    client = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseUrl,
    })
  }
  return client
}

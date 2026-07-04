process.loadEnvFile()

export const config = {
  llm: {
    apiKey: process.env.LLM_API_KEY ?? "",
    baseUrl: process.env.LLM_BASE_URL ?? "https://api.deepseek.com",
    textModel: process.env.LLM_TEXT_MODEL ?? "deepseek-chat",
    imageModel: process.env.LLM_IMAGE_MODEL || "",
  },
} as const

export function hasModel(): boolean {
  return config.llm.apiKey.length > 0
}

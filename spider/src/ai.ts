import fs from "node:fs/promises"
import { generateText } from "ai"
import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

const provider = createOpenAICompatible({
  name: "Custom",
  apiKey: process.env.PROVIDER_API_KEY,
  baseURL: process.env.PROVIDER_BASE_URL || "",
})

export class AI {
  private promptTemplate: string

  constructor() {
    this.promptTemplate = ""
  }

  async init() {
    try {
      this.promptTemplate = await fs.readFile("spider/prompt.md", "utf-8")
    } catch (error) {
      console.error("Error reading prompt template:", error)
      throw error
    }
  }

  async analyze(
    tool: { name: string; description: string; website: string; snapshot: string },
    article: { title: string; content: string }
  ) {
    try {
      const prompt = this.promptTemplate.replace(
        "[工具网页内容]",
        JSON.stringify(
          {
            ...tool,
            ...article,
            modelId: process.env.PROVIDER_MODEL_ID || "",
          },
          null,
          2
        )
      )

      const response = await generateText({
        model: provider(process.env.PROVIDER_MODEL_ID || ""),
        prompt,
      })

      return response.text
    } catch (error) {
      console.error("Error analyzing content:", error)
      throw error
    }
  }
}

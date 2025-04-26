import { Readability } from "@mozilla/readability"
import { JSDOM } from "jsdom"
import fs from "node:fs/promises"
import path from "node:path"
import { AI } from "./ai"
import type { ParsedArticle, Tool } from "./types"

const PROGRESSED_FILE_PATH = "spider/src/progressed.txt"
// const TOOL_RESOURCE_PATH = "spider/toolify-top-revenue.json"
const TOOL_RESOURCE_PATH = "spider/test.json"
const TOOLS_JSON_PATH = "docs/tools.json"

export class Crawler {
  private processedUrls: Set<string>
  private readonly processedFilePath: string
  private readonly toolsFilePath: string
  private readonly toolsJsonPath: string
  private readonly delay: number
  private readonly ai: AI
  private readonly maxRetries: number = 3
  private readonly retryDelay: number = 2000

  constructor() {
    this.processedUrls = new Set<string>()
    this.processedFilePath = PROGRESSED_FILE_PATH
    this.toolsFilePath = TOOL_RESOURCE_PATH
    this.toolsJsonPath = TOOLS_JSON_PATH
    this.delay = Math.max(1000, 500) // 确保最小延迟
    this.ai = new AI()
  }

  /**
   * 初始化爬虫，加载已处理的 URL 列表
   * @throws Error 当文件操作失败时
   */
  async init(): Promise<void> {
    try {
      await this.ensureDirectoryExists(path.dirname(this.processedFilePath))
      const content = await fs.readFile(this.processedFilePath, "utf-8")
      this.processedUrls = new Set(content.split("\n").filter(Boolean))
      await this.ai.init()
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.writeFile(this.processedFilePath, "", "utf-8")
      } else {
        throw new Error(`Failed to initialize crawler: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * 确保目录存在
   * @param dirPath 目录路径
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error) {
      throw new Error(
        `Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 获取工具列表
   * @returns Promise<Tool[]> 工具列表
   * @throws Error 当读取或解析失败时
   */
  async getTools(): Promise<Tool[]> {
    try {
      const content = await fs.readFile(this.toolsFilePath, "utf-8")
      const tools = JSON.parse(content) as Tool[]
      this.validateTools(tools)
      return tools
    } catch (error) {
      throw new Error(`Failed to get tools: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private validateTools(tools: Tool[]): void {
    if (!Array.isArray(tools)) {
      throw new Error("Tools must be an array")
    }
    tools.forEach((tool, index) => {
      if (!tool.website || !tool.detail_url || !tool.name) {
        throw new Error(`Invalid tool at index ${index}: missing required properties`)
      }
    })
  }

  /**
   * 解析单个工具页面，支持重试机制
   * @param tool 要解析的工具
   */
  async parseTool(tool: Tool): Promise<void> {
    if (this.processedUrls.has(tool.website)) {
      console.log(`Skipping ${tool.website} - already processed`)
      return
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.sleep(this.delay + Math.random() * 1000)
        await this.parseToolAttempt(tool)
        return
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.error(`Failed to parse ${tool.website} after ${this.maxRetries} attempts:`, error)
          throw error
        }
        console.warn(`Attempt ${attempt} failed for ${tool.website}, retrying...`)
        await this.sleep(this.retryDelay * attempt)
      }
    }
  }

  private async gitCommitAndPush(tool: Tool): Promise<void> {
    try {
      const slug = tool.detail_url.split("/").at(-1)
      const commitMessage = `feat: add analysis for ${slug}`

      // Check if we're in a GitHub Action environment
      const isGitHubAction = process.env.GITHUB_ACTIONS === "true"

      if (isGitHubAction) {
        // In GitHub Actions, we need to configure Git
        await this.runGitCommand('config --global user.name "GitHub Action"')
        await this.runGitCommand('config --global user.email "action@github.com"')
      }

      // Add all changed files
      await this.runGitCommand("add .")
      // Commit changes
      await this.runGitCommand(`commit -m "${commitMessage}"`)
      // Push to master branch
      await this.runGitCommand("push origin master")

      console.log("Successfully committed and pushed changes to master")
    } catch (error) {
      console.error(`Failed to commit and push changes: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  private async runGitCommand(command: string): Promise<void> {
    const { exec } = require("child_process")
    return new Promise((resolve, reject) => {
      exec(`git ${command}`, (error: Error | null) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  private async parseToolAttempt(tool: Tool): Promise<void> {
    try {
      console.log(`Fetching content from ${tool.detail_url}...`)
      const response = await this.fetchWithTimeout(tool.detail_url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log(`Parsing article content...`)
      const html = await response.text()
      const article = await this.parseArticle(html, tool.detail_url)

      console.log(`Analyzing content...`)
      const analysis = await this.analyzeContent(tool, article)

      console.log(`Saving analysis...`)
      await this.saveAnalysis(tool, analysis)

      console.log(`Marking as processed...`)
      await this.markAsProcessed(tool.website)

      console.log(`Updating tools.json...`)
      await this.updateToolsJson(tool)

      console.log(`Committing and pushing changes...`)
      await this.gitCommitAndPush(tool)

      console.log(`Successfully completed all steps for ${tool.website}`)
    } catch (error) {
      console.error(`Error in parseToolAttempt: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  private async fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(id)
      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
  }

  private async parseArticle(html: string, url: string): Promise<ParsedArticle> {
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()
    if (!article?.title || !article?.content) {
      throw new Error("Failed to parse article: missing title or content")
    }

    return {
      title: article.title,
      content: article.content,
      textContent: article.textContent || "",
      length: article.length || 0,
      excerpt: article.excerpt || "",
      byline: article.byline || "",
      dir: article.dir || "ltr",
      siteName: article.siteName || "",
      lang: article.lang || "en",
      publishedTime: article.publishedTime || null,
    }
  }

  private async analyzeContent(tool: Tool, article: ParsedArticle): Promise<string> {
    const analysis = await this.ai.analyze(tool, {
      title: article.title,
      content: article.textContent,
    })
    if (!analysis) {
      throw new Error("Failed to analyze content")
    }
    return analysis
  }

  private async saveAnalysis(tool: Tool, analysis: string): Promise<void> {
    const slug = tool.detail_url.split("/").at(-1)
    const docPath = path.join("docs", "tool", `${slug}.md`)
    await this.ensureDirectoryExists(path.dirname(docPath))
    await fs.writeFile(docPath, analysis, "utf-8")
    console.log(`Saved analysis for ${slug} to ${docPath}`)
  }

  /**
   * 标记 URL 为已处理
   */
  private async markAsProcessed(url: string): Promise<void> {
    this.processedUrls.add(url)
    await fs.appendFile(this.processedFilePath, `${url}\n`, "utf-8")
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 批量处理工具列表
   */
  async processTools(): Promise<void> {
    const tools = await this.getTools()
    console.log(`Found ${tools.length} tools to process`)

    for (const tool of tools) {
      console.log(`Processing ${tool.website}...`)
      try {
        await this.parseTool(tool)
      } catch (error) {
        console.error(`Failed to process ${tool.website}:`, error)
        // 如果达到最大重试次数后失败，直接退出进程
        process.exit(1)
      }
    }
  }

  /**
   * 更新 tools.json 文件
   */
  private async updateToolsJson(tool: Tool): Promise<void> {
    try {
      // 确保目录存在
      await this.ensureDirectoryExists(path.dirname(this.toolsJsonPath))

      // 读取现有内容或创建新的数组
      let content: any[] = []
      try {
        const contentString = await fs.readFile(this.toolsJsonPath, "utf-8")
        content = JSON.parse(contentString)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          // 如果文件不存在，使用空数组
          content = []
        } else {
          throw error
        }
      }

      const slug = tool.detail_url.split("/").at(-1)

      // 检查是否已存在
      const existingIndex = content.findIndex((t) => t.slug === slug)
      if (existingIndex !== -1) {
        content[existingIndex] = { slug, ...tool }
      } else {
        content.push({ slug, ...tool })
      }

      await fs.writeFile(this.toolsJsonPath, JSON.stringify(content, null, 2), "utf-8")
      console.log(`Successfully updated ${this.toolsJsonPath}`)
    } catch (error) {
      throw new Error(`Failed to update tools.json: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

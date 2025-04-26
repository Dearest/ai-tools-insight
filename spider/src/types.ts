export interface Tool {
  detail_url: string
  name: string
  website: string
  snapshot: string
  description: string
  rank: string
}

export interface parsedHTML<T> {
  /** article title */
  title: string | null | undefined

  /** HTML string of processed article content */
  content: T | null | undefined

  /** text content of the article, with all the HTML tags removed */
  textContent: string | null | undefined

  /** length of an article, in characters */
  length: number | null | undefined

  /** article description, or short excerpt from the content */
  excerpt: string | null | undefined

  /** author metadata */
  byline: string | null | undefined

  /** content direction */
  dir: string | null | undefined

  /** name of the site */
  siteName: string | null | undefined

  /** content language */
  lang: string | null | undefined

  /** published time */
  publishedTime: string | null | undefined
}

// 定义解析结果接口
export interface ParsedArticle {
  title: string
  content: string
  textContent: string
  length: number
  excerpt: string
  byline: string
  dir: string
  siteName: string
  lang: string
  publishedTime: string | null
}

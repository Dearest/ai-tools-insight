import { Crawler } from "./crawler"

async function main() {
  try {
    const crawler = new Crawler()
    await crawler.init()
    await crawler.processTools()
    console.log("Processing completed!")
  } catch (error) {
    console.error("Error in main process:", error)
    process.exit(1)
  }
}

main()

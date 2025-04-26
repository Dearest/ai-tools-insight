# AI Tools Insight

Get deep business insights on AI tools. Automatically.

This project uses web scraping and large language models (LLMs) to analyze popular AI tools and generate commercial insights. It then builds a handy VitePress documentation site for you to browse the results.

## What it does

- Grabs a list of AI tools from `spider/toolify-top-revenue.json`.
- Crawls the detail page for each tool.
- Cleans up the webpage content so the AI can understand it better.
- Uses an AI model (like GPT via the Vercel AI SDK) with prompts from `spider/prompt.md` to analyze the tool's business potential.
- Writes the analysis into Markdown files inside the `docs/` folder.
- Builds a VitePress site so you can easily read the analysis.
- Keeps track of processed tools in `progressed.txt` so you can stop and restart.

## Who is this for?

- AI startup folks & product managers
- Indie developers looking for ideas
- AI researchers & analysts
- Anyone curious about the business side of AI tools

## Prerequisites

- **Bun:** This project runs on Bun. You'll need it installed. See [Bun's website](https://bun.sh) for installation instructions.
- **AI Model API Key:** You need an API key from an AI provider supported by the Vercel AI SDK (like OpenAI, Anthropic, etc.).

## Installation

Get the necessary packages installed using Bun:

```bash
bun install
```

## Configuration

1.  **API Key:** Create a file named `.env` in the root of the project. or copy .env.example and rename :

    ```.env
    PROVIDER_BASE_URL=your-provider-base-url
    PROVIDER_API_KEY=sk-your-key-here
    ```

    The script uses the Vercel AI SDK, which automatically looks for these environment variables.

2.  **Tool List (Optional):** The script reads tool URLs from `spider/toolify-top-revenue.json`. You can modify this file to analyze different tools. Make sure the JSON structure is maintained.

3.  **Analysis Prompt (Optional):** The AI analysis prompt is located in `spider/prompt.md`. Feel free to tweak this prompt to change the focus of the analysis.

## How to Use

1.  **Run the Analysis:** Start the process using Bun:

    ```bash
    bun run spider
    ```

    This will:

    - Read the tool list.
    - Crawl each tool's page (skipping ones already in `progressed.txt`).
    - Send content to the configured AI model for analysis.
    - Write the analysis results to `.md` files in the `docs/` directory.
    - Update `progressed.txt`.

2.  **View the Results:** Once the script finishes (or even while it's running, to see partial results), you can view the generated documentation site locally.

    - **Start the dev server:**

      ```bash
      bun run docs:dev
      ```

      This usually opens the site in your browser automatically, or gives you a local URL (like `http://localhost:5173`) to visit.

    - **Build the static site (for deployment):**

      ```bash
      bun run docs:build
      ```

      This creates a static version of the site in `docs/.vitepress/dist/`.

    - **Preview the static build:**
      ```bash
      bun run docs:preview
      ```
      This lets you test the static build locally before deploying it.

## Project Structure

Here's a quick look at important files and folders:

```
.
├── .env             # Your API keys (you need to create this)
├── docs/            # Generated Markdown analysis files & VitePress site config
│   ├── .vitepress/  # VitePress configuration and output
│   └── *.md         # Analysis output for each tool
├── spider/
│   └── toolify-top-revenue.json # List of AI tools to analyze
├── pspider/
│   └── prompt.md    # Prompt used for AI analysis
├── index.ts         # Main script to run the crawl/analysis process
├── package.json     # Project dependencies and scripts
├── progressed.txt   # Tracks which tool URLs have been processed
└── README.md        # This file
```

## Contributing

Want to help make this better? Pull requests are welcome. Check out the [PRD](./.ai/PRD.md) and [Technical Design](./.ai/TechnicalDesign.md) for more details on the project's goals and structure.

## License

(Consider adding a license file, e.g., MIT License)

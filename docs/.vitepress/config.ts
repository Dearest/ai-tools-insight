import { defineConfig } from "vitepress"
import tools from "../tools.json"

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/",
  title: "AI Tools Insight",
  description: "深入分析 AI 工具的商业洞察",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "AI 工具分析", link: "/tool/" },
    ],

    sidebar: {
      "/tool/": [
        {
          text: "AI 工具分析",
          items: [
            { text: "概述", link: "/tool/" },
            ...tools.map((tool) => ({
              text: `${tool.rank}. ${tool.name}`,
              link: `/tool/${tool.slug}`,
            })),
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/vuejs/vitepress" }],

    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
              },
              modal: {
                noResultsText: "无法找到相关结果",
                resetButtonTitle: "清除查询条件",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
        },
      },
    },
  },
})

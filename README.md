本Project是基于 lumen的Fork。

https://github.com/alxshelepenok/lumen

在原有Project的基础上,增加了从Notion导出Markdown的功能。

## 本地安装和运行

```bash
bun install
bun run start
```

## Notion 导出 Markdown

你需要取得 Notion 的 API Key 和数据库 ID，并置入环境变量的 `NOTION_API_KEY` 和 `NOTION_DATABASE_ID`。

```bash
cd scripts
node notion-to-markdown.js
```

## 使用Github Actions自动部署

参见文件 `.github/workflows/update-blog.yml`

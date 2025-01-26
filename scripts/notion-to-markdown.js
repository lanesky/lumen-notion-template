const fs = require('fs')
var http = require('https')
const { Client } = require('@notionhq/client')
const { NotionToMarkdown } = require('notion-to-md')

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const DB_ID = process.env.NOTION_DATABASE_ID

const n2m = new NotionToMarkdown({ notionClient: notion })

// Get all pages in the database
async function getPages() {
  const pages = await notion.databases.query({
    database_id: DB_ID,
    filter: {
      property: 'NotPublishing',
      checkbox: {
        equals: false,
      },
    },
  })
  return pages.results
}

const getBlocks = async blockId => {
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 50,
  })
  return response.results
}

const toKebabCase = (str) =>
{
  if (!str) {
    return "";
  }

  return str
    .toLowerCase()
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((word) => word.toLowerCase())
    .join("-") || "";
}

const download = (url, destination) => {
  const fileStream = fs.createWriteStream(destination)
  http.get(url, function (response) {
    response.pipe(fileStream)
    console.log('File downloaded', destination)
  })
}

const sanitizeFolderName = (name) => {
  return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '-');
};

;(async () => {
  fs.rmdirSync('../content/posts', { recursive: true })
  fs.mkdirSync('../content/posts')
  const pages = await getPages()

  console.log('pages: ', pages)

  for (const page of pages) {
    const fileName = page.url.replace('https://www.notion.so/', '')
    const title = page.properties.Name.title.map(t => t.plain_text).join()
    const category = page.properties.Category.select?.name || ''
    const description = page.properties.Description.rich_text.map(t => t.plain_text).join()
    const tags = page.properties.Tags.multi_select?.map(t => ` - "${t.name}"`).join('\n') || []
    const publishDate = page.properties.PublishDate.date?.start || page.created_time
    const slug = page.properties.Slug.rich_text?.map(t => t.plain_text).join() || ''
    
    const blocks = await getBlocks(page.id)
    let olCounter = 1
    
    const sanitizedTitle = sanitizeFolderName(title);
    const sanitizedSlug = toKebabCase(slug) || sanitizedTitle
    
    const folderName = `../content/posts/${new Date(publishDate).toISOString().split('T')[0]}---${sanitizedTitle}`
    fs.mkdirSync(folderName, { recursive: true })

    const cleanBlocks = blocks.map((block, i) => {
      if (block.type === 'image') {
        const imgFileName = `${fileName}-${i}.jpg`;
        const destination = `${folderName}/${imgFileName}`; 
        download(block.image.file.url, destination);
        block.image.file.url = `${imgFileName}`;
      } else if (block.type === 'numbered_list_item') {
        olCounter = blocks[i - 1]?.type === 'numbered_list_item' ? olCounter + 1 : 1;
        block.numbered_list_item.number = olCounter;
      }
      return block;
    })

    const mdblocks = await n2m.blocksToMarkdown(cleanBlocks)
    const mdString = n2m.toMarkdownString(mdblocks).parent
    const coverFileName = `${fileName}-cover.jpg`
    page.cover && download(page.cover.file.url, './content/posts/assets/' + coverFileName)

    const fileContent = `---
title: "${title}"
date: "${publishDate}"
template: "post"
draft: false
slug: "/posts/${sanitizedSlug}"
category: "${category}"
tags:
${tags}
description: "${description}"
${page.cover ? `cover: ./${folderName}/${coverFileName}` : ''}
---
${mdString}`;

    fs.writeFile(`${folderName}/index.md`, fileContent, () => {
      console.log(`File written: ${fileName}`);
    });
  }
})()
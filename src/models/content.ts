import { Q } from "./db";

export interface ContentBlock {
   id: number;
   article_id?: number;
   content: string;
}

// Создание статьи
export async function createArticle(
  url_name: string,
  title: string,
  content: string
): Promise<any> {
  const query = `INSERT INTO articles (url_name, title, content, date_updated) VALUES ('${url_name}', '${title}', '${content}', NOW()) RETURNING *;`;
  return await Q(query, true);
}

// Редактирование статьи
export async function updateArticle(
  id: number,
  url_name: string,
  title: string,
  content: string
): Promise<any> {
  const query = `UPDATE articles SET url_name = '${url_name}', title = '${title}', content = '${content}', date_updated = NOW() WHERE id = ${id} RETURNING *;`;
  return await Q(query, true);
}

export async function updateArticleByUrl(
  url_name: string,
  title?: string,
  content?: string
): Promise<any> {
  const updates = [];

  if (title !== undefined) {
    updates.push(`title = '${title}'`);
  }
  if (content !== undefined) {
    updates.push(`content = '${content}'`);
  }
  const query = `UPDATE articles 
    SET ${updates.join(', ')},
    date_updated = NOW()
    WHERE "url_name" = '${url_name}'
    RETURNING *;`;
  return await Q(query, true);
}

export async function deleteArticle(id: number): Promise<any> {
  const query = `DELETE FROM articles WHERE id = ${id} RETURNING *;`;
  return await Q(query, true);
}

export async function deleteArticleByUrl(url: string): Promise<any> {
  const query = `DELETE FROM articles WHERE "url_name" = '${url}' RETURNING *;`;
  return await Q(query, true);
}

// Привязка статьи к пункту меню
export async function linkArticleToMenu(
  menuItemId: number,
  articleUrlName: string
): Promise<any> {
  const updateMenuQuery = `UPDATE menu_items SET url = '/articles/${articleUrlName}' WHERE id = ${menuItemId} RETURNING *;`;
  return await Q(updateMenuQuery, true);
}

// Получение списка статей
export async function getArticles(): Promise<any> {
  const query = `SELECT * FROM articles;`;
  return await Q(query, true);
}

export async function getArticleIdByUrl(url: string): Promise<number | undefined> {
  const query = `SELECT id FROM articles WHERE "url_name" = $1;`;
  const result = await Q(query, true, [url]);
  return result && result.length > 0 ? result[0].id : undefined;
}

export async function getArticleByUrl(url: string): Promise<any[] | null> {
  const query = `SELECT * FROM articles WHERE "url_name" = '${url}';`;
  return await Q(query, true);
}


export async function getArticle(id: number): Promise<any[] | null> {
  const query = `SELECT * FROM articles WHERE "id" = $1;`;
  return await Q(query, true, [id]);
}

export async function getContentBlock (id: number): Promise<string | null> {
  const query = "SELECT content FROM ontent_blocks WHERE id = $1";
  const result = await Q(query, true, [id]);
  return result && result.length > 0 ? result[0].content : null
}

export async function getContentBlocksByUrl (url: string): Promise<ContentBlock[]> {
  const query = `
  SELECT id, content FROM ontent_blocks 
  WHERE article_id IN
  (SELECT id FROM articles WHERE url_name = $1);
  `;
  const result = await Q(query, true, [url]);
  return result || []
}

export async function createContentBlock (data: ContentBlock): Promise<number> {
  const query = `
  INSERT INTO content_blocks (article_id, content)
  VALUES ($1, $2) RETURNING id;
  `;
  const result = await Q(query, true, [data.article_id, data.content]);
  return result && result.length > 0 ? result[0].id : 0
}

export async function updateContentBlock (data: ContentBlock): Promise<boolean> {
  const query = `
  UPDATE content_blocks SET content = $2 WHERE id = $1;
  `;
  const result = await Q(query, false, [data.id, data.content]);
  return !!result
}

export async function deleteContentBlock (id: number): Promise<string | null> {
  const query = "DELETE FROM content_blocks WHERE id = $1";
  const result = await Q(query, true, [id]);
  return result && result.length > 0 ? result[0].content : null
}



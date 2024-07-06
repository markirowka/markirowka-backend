import { Q } from "./db";

// Создание статьи
export async function createArticle(
  url_name: string,
  title: string,
  content: string
): Promise<any> {
  const query = `INSERT INTO articles (url_name, title, content) VALUES ('${url_name}', '${title}', '${content}') RETURNING *;`;
  return await Q(query, true);
}

// Редактирование статьи
export async function updateArticle(
  id: number,
  url_name: string,
  title: string,
  content: string
): Promise<any> {
  const query = `UPDATE articles SET url_name = '${url_name}', title = '${title}', content = '${content}' WHERE id = ${id} RETURNING *;`;
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
    SET ${updates.join(', ')} 
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

export async function getArticleByUrl(url: string): Promise<any[] | null> {
  const query = `SELECT * FROM articles WHERE "url_name" = '${url}';`;
  return await Q(query, true);
}


export async function getArticle(id: number): Promise<any[] | null> {
  const query = `SELECT * FROM articles WHERE "id" = ${id};`;
  return await Q(query, true);
}


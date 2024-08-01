import { Q } from "./db";

export interface MenuItem {
  id: number;
  name: string;
  url: string;
  sort_index?: number;
}

export async function createMenuItem(name: string, url: string, sort_index?: number): Promise<any> {
  const query = `INSERT INTO menu_items (name, url, sort_index) VALUES ('${name}', '${url}', ${sort_index || 0}) RETURNING *;`;
  return await Q(query, true);
}

export async function updateMenuItem(
  id: number,
  name: string,
  url: string,
  sort_index?: number
): Promise<any> {
  const query = `UPDATE menu_items SET name = '${name}', url = '${url}', sort_index = ${sort_index || 0} WHERE id = ${id} RETURNING *;`;
  return await Q(query, true);
}

export async function deleteMenuItems(ids: number[]): Promise<any> {
  const query = `DELETE FROM menu_items WHERE id = ANY('{${ids.join(
    ","
  )}}') RETURNING *;`;
  return await Q(query, true);
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const query = `SELECT * FROM menu_items;`;
  return await Q(query, true) || [];
}

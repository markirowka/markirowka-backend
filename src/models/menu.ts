import { Q } from "./db";

export interface MenuItem {
  id: number;
  name: string;
  url: string;
}

export async function createMenuItem(name: string, url: string): Promise<any> {
  const query = `INSERT INTO menu_items (name, url) VALUES ('${name}', '${url}') RETURNING *;`;
  return await Q(query, true);
}

export async function updateMenuItem(
  id: number,
  name: string,
  url: string
): Promise<any> {
  const query = `UPDATE menu_items SET name = '${name}', url = '${url}' WHERE id = ${id} RETURNING *;`;
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

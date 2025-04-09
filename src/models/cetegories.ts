import { Q } from "./db";

/* 
CREATE TABLE IF NOT EXISTS good_categories (
   id serial PRIMARY KEY,
   name varchar(64)
);
*/

export interface LibItem {
    id: number;
    name: string;
}

export async function getCategories (): Promise<LibItem[]> {
   const query = "SELECT * FROM good_categories;";
   const result = await Q(query, true);
   return result || [];
}

export async function addCategory (name: string): Promise<number | null> {
   const query = "INSERT INTO good_categories (name) VALUES ($1) RETURNING id;";
   const result = await Q(query, true, [name]);   
   return result && result.length > 0 ? result[0].id : null;
}

export async function deleteCategory (id: number): Promise<boolean> {
   const query = "DELETE FROM good_categories WHERE id = $1;";
   const result = await Q(query, false, [id]);  
   return !!result;
}
import { Q } from "./db";

export interface CatItem {
    id: number;
    name: string;
    metrik: string | null;
    okei_code: string | null;
}

export async function getCategories(): Promise<CatItem[]> {
    const query = "SELECT id, name, metrik, okei_code FROM good_categories;";
    const result = await Q(query, true);
    return result || [];
}

export async function getCategoryByName(name: string): Promise<CatItem | null> {
    const query = "SELECT id, name, metrik, okei_code FROM good_categories WHERE name = $1 LIMIT 1;";
    const result = await Q(query, true, [name]);
    return result && result.length > 0 ? result[0] : null;
}

export async function addCategory(
    name: string,
    metrik: string | null = null,
    okei_code: string | null = null
): Promise<number | null> {
    const query = `
        INSERT INTO good_categories (name, metrik, okei_code) 
        VALUES ($1, $2, $3) 
        RETURNING id;
    `;
    const result = await Q(query, true, [name, metrik, okei_code]);
    return result && result.length > 0 ? result[0].id : null;
}

export async function updateCategory(
    id: number,
    name: string,
    metrik: string | null = null,
    okei_code: string | null = null
): Promise<boolean> {
    const query = `
        UPDATE good_categories 
        SET name = $1, metrik = $2, okei_code = $3 
        WHERE id = $4;
    `;
    const result = await Q(query, false, [name, metrik, okei_code, id]);
    return !!result;
}

export async function deleteCategory(id: number): Promise<boolean> {
    const query = "DELETE FROM good_categories WHERE id = $1;";
    const result = await Q(query, false, [id]);
    return !!result;
}
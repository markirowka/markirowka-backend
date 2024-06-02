import pool from "./db";

export interface User {
  id?: number;
  email: string;
  password_hash?: string;
  isConfirmed?: boolean;
  full_name: string;
  ceo?: string;
  ceo_full?: string;
  ceo_genitive?: string;
  law_address?: string;
  inn: number;
  cargo_recevier?: string;
  cargo_city?: string;
  user_role?: string;
}

export interface userEditRequest {
  userId: number;
  paramsToEdit: {
    param: keyof User;
    value: string | number
  }[]
}

export interface userFiles {
  id: number;
  owner_id: number;
  file_name: string;
  file_type: string;
}

export interface userConfirmTokenData {
  date: number;
  inn: number;
  email: string;
}

export interface userValidateTokenData extends userConfirmTokenData {
  token: string;
}

export async function GetUsersByParam(
  param: keyof User,
  value: string | number | boolean
): Promise<User[]> {
  const query = `SELECT * FROM "app_users" WHERE "${param}" = ${value};`;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (e: any) {
    console.log(e.message);
    return [];
  }
}

export async function GetUserById(
  id: number,
): Promise<User | null> {
  const query = `SELECT * FROM "app_users" WHERE "id" = ${id} LIMIT 1;`;
  try {
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (e: any) {
    console.log(e.message);
    return null;
  }
}

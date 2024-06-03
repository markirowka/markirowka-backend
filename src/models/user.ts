import { GeneratePasswordHash } from "../utils";
import pool from "./db";

export interface User {
  id?: number;
  email: string;
  password?: string;
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

export interface paramEditData {
  key: keyof User;
  value: any
}

export interface userEditRequest {
  userId?: number;
  paramsToEdit: paramEditData[]
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

export const forbiddenToEditParams = ['id', 'isconfirmed', 'isConfirmed', 'user_role']
export const forbiddenToEditParamsAdmin = ['id']

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

export async function EditUserParams (
  params: paramEditData[],
  userId: number 
) {

  const setClauses = params.map((param, index) => `${param.key.toLowerCase()} = $${index + 1}`);

  const query = `
      UPDATE app_users
      SET ${setClauses.join(', ')}
      WHERE id = ${userId}
    `;

  const values = params.map(param => { 
    const newValue = param.key.toLowerCase() === 'password' ? GeneratePasswordHash (param.value) : param.value
    return newValue
  });
  // values.push(userId);
  console.log("Query: ", query, "Values: ", values);
  await pool.query(query, values);
}

export async function DeleteUser (userId: number) {
  const query = `DELETE FROM "app_users" WHERE "id" = ${userId};`;

  try {
    await pool.query(query);
    return true;
  } catch (e: any) {
    console.log(e.message);
    return false;
  }
}

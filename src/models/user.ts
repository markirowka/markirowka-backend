import bcrypt from "bcryptjs";
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
  ceo_base?: string;
  ceo_genitive?: string;
  law_address?: string;
  inn: number;
  bank_account?: string;
  corr_account?: string;
  bank_code?: string;
  bank_name?: string;
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

export async function CreateUser (userData: User) {
  const {
    email,
    password,
    full_name,
    ceo,
    ceo_full,
    ceo_genitive,
    law_address,
    inn,
    cargo_recevier,
    cargo_city,
    bank_account,
    corr_account,
    bank_code,
    bank_name,
    ceo_base
  } = userData;
  if (!password || !email) {
    return null;
  }
  const password_hash = await bcrypt.hash(password, 10);
  
  try {
    const result = await pool.query(
      `INSERT INTO app_users 
      ( email,
        password,
        full_name,
        ceo,
        ceo_full,
        ceo_genitive,
        law_address,
        inn,
        cargo_recevier,
        cargo_city,
        isconfirmed,
        user_role,
        bank_account,
        corr_account,
        bank_code,
        bank_name,
        ceo_base ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [email, 
        password_hash, 
        full_name || "", 
        ceo || "", 
        ceo_full || "", 
        ceo_genitive || "", 
        law_address || "",
        inn,
        cargo_recevier || "",
        cargo_city || "",
        false, 
        "USER",
        bank_account?.toString(),
        corr_account?.toString(),
        bank_code?.toString(),
        bank_name,
        ceo_base
        ]
    );
    const user: User = result.rows[0];
    return user
  } catch (e: any) {
    console.log(e.message);
    return null;
  }

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

import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, 
    port: Number(process.env.DB_PORT)
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

export async function Q(query: string, withReturn?: boolean): Promise<any[] | null> {
  try {
    const result = await pool.query(query);
    return withReturn ? result.rows : null
  } catch (e: any) {
    console.log(e.message);
    console.log(query);
    return  withReturn ? [] : null
  }
}

export default pool;
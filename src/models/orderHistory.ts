import { arrayToPostgresArrayString } from "../utils";
import pool from "./db";

export async function WriteOrder(documentIds: number[], status = 'new', date?: number) {
    const orderDate = date || Math.round(new Date().getTime() / 1000);

    const query = `
      INSERT INTO order_history (order_date, order_status, document_ids)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const values = [orderDate, status, arrayToPostgresArrayString(documentIds)];
    
    try {
      const result = await pool.query(query, values);
      return true;
    } catch (e: any) {
      console.log(e.message);
      return false;
    }
  }
  
  // Удаление записи
export async function deleteOrder(id: number) {
    const query = `
      DELETE FROM order_history
      WHERE id = $1
      RETURNING id;
    `;
    const values = [id];
    
    try {
      const result = await pool.query(query, values);
      return { id: result.rows[0].id };
    } catch (e: any) {
      console.log(e.message);
      return { id: 0 };
    }
  }
  
  // Обновление статуса заказа
export async function updateOrderStatus(id: number, newStatus: string) {
    const query = `
      UPDATE order_history
      SET order_status = $1
      WHERE id = $2
      RETURNING id;
    `;
    const values = [newStatus, id];
    
    try {
      const result = await pool.query(query, values);
      return { id: result.rows[0].id };
    } catch (e: any) {
      console.log(e.message);
      return { id: 0 };
    }
  }
  
  // Получение списка записей
export async function getOrderList() {
    const query = `
      SELECT * FROM order_history;
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (e: any) {
      console.log(e.message);
      return [];
    }
  }
  
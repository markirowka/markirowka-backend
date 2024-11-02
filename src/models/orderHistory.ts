import { amount_perpage } from "../config";
import { arrayToPostgresArrayString } from "../utils";
import pool, { Q } from "./db";

export const orderStatusValues = ["new", "pay_messaged", "paid"];

export const orderSatusList = {
  new: "new",
  messaged: "pay_messaged",
  paid: "paid",
};

export async function writeOrder(
  documentIds: number[],
  user_id: number,
  status = "new",
  date?: number
) {
  const orderDate = date || Math.round(new Date().getTime() / 1000);

  const query = `
      INSERT INTO order_history (order_date, user_id, order_status, document_ids)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
  const values = [
    orderDate,
    user_id,
    status,
    arrayToPostgresArrayString(documentIds),
  ];

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
export async function getOrderList(page: number = 1) {
  const offset = (page - 1) * amount_perpage;
  const query = `
      SELECT * FROM "order_history"
      ORDER BY "id" DESC
      OFFSET $1
      LIMIT $2;
    `;

  try {
    const result = await pool.query(query, [offset, amount_perpage]);
    return result.rows;
  } catch (e: any) {
    console.log(e.message);
    return [];
  }
}

export async function getUserOrderList(user_id: number, page: number = 1) {
  const idStart = (page - 1) * amount_perpage;
  // const idEnd = idStart + amount_perpage;
  const query = `
      WITH ordered_orders AS (
        SELECT * FROM order_history WHERE "user_id" = $1 ORDER BY "id"
      )
      SELECT * FROM order_history  WHERE "user_id" = $1 
      OFFSET $2 LIMIT $3;
    `;

  return await Q(query, true, [user_id, idStart, amount_perpage]);
}

export async function getUserOrderCount(user_id: number) {
  const query = `SELECT COUNT(*) FROM  order_history WHERE "user_id" = ${user_id};`;

  const result = await Q(query, true);
  return result && result.length > 0 ? result[0].count : 0;
}

export async function getTotalOrderCount() {
  const query = `SELECT COUNT(*) FROM  order_history;`;

  const result = await Q(query, true);
  return result && result.length > 0 ? result[0].count : 0;
}

export async function getOrderById(id: number) {
  const query = `SELECT * FROM  order_history WHERE id = $1;`;
  const result = await Q(query, true, [id]);
  return result || null;
}

export async function massUpdateOrderStatus(
  ids: number[],
  newStatus: string,
  userId: number,
  fromAdmin = false
): Promise<number[]> {
  const query = `
    UPDATE order_history
    SET order_status = $1
    WHERE id = ANY($2)
    ${fromAdmin ? "" : " AND user_id = $3"}
    RETURNING id;
  `;

  const values = fromAdmin ? [newStatus, ids] : [newStatus, ids, userId];

  try {
    const result = await Q(query, true, values);
    return result ? result.map((row) => row.id) : [];
  } catch (e: any) {
    console.log(e.message);
    return [];
  }
}

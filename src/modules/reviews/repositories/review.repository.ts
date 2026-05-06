import { pool } from "../../../db.config.js";

export const findStoreById = async (storeId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM stores WHERE id = ?",
      [storeId]
    );

    return rows[0] || null;
  } catch (err) {
    throw new Error(`가게 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const addReview = async (data: {
  storeId: number;
  rating: number;
  content: string;
}) => {
  const conn = await pool.getConnection();

  try {
    const [result]: any = await conn.query(
      `INSERT INTO reviews
      (store_id, rating, content)
      VALUES (?, ?, ?)`,
      [data.storeId, data.rating, data.content]
    );

    return result.insertId;
  } catch (err) {
    throw new Error(`리뷰 추가 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const findReviewById = async (reviewId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM reviews WHERE id = ?",
      [reviewId]
    );

    return rows[0] || null;
  } catch (err) {
    throw new Error(`리뷰 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};
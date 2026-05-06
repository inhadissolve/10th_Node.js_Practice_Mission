import { pool } from "../../../db.config.js";

export const findRegionById = async (regionId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM regions WHERE id = ?",
      [regionId]
    );

    return rows[0] || null;
  } catch (err) {
    throw new Error(`지역 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const addStore = async (data: {
  regionId: number;
  name: string;
  address: string;
}) => {
  const conn = await pool.getConnection();

  try {
    const [result]: any = await conn.query(
      `INSERT INTO stores
      (region_id, name, address)
      VALUES (?, ?, ?)`,
      [data.regionId, data.name, data.address]
    );

    return result.insertId;
  } catch (err) {
    throw new Error(`가게 추가 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

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
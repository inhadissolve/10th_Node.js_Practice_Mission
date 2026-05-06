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

export const addMission = async (data: {
  storeId: number;
  title: string;
  description: string;
  rewardPoint: number;
}) => {
  const conn = await pool.getConnection();

  try {
    const [result]: any = await conn.query(
      `INSERT INTO missions
      (store_id, title, description, reward_point)
      VALUES (?, ?, ?, ?)`,
      [data.storeId, data.title, data.description, data.rewardPoint]
    );

    return result.insertId;
  } catch (err) {
    throw new Error(`미션 추가 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const findMissionById = async (missionId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM missions WHERE id = ?",
      [missionId]
    );

    return rows[0] || null;
  } catch (err) {
    throw new Error(`미션 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const findUserById = async (userId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM user WHERE id = ?",
      [userId]
    );

    return rows[0] || null;
  } catch (err) {
    throw new Error(`사용자 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const findUserMission = async (
  userId: number,
  missionId: number
) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      `SELECT * FROM user_missions
       WHERE user_id = ? AND mission_id = ? AND status = 'IN_PROGRESS'`,
      [userId, missionId]
    );

    return rows[0] || null;
  } catch (err) {
    throw new Error(`도전 중인 미션 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const addUserMission = async (data: {
  userId: number;
  missionId: number;
}) => {
  const conn = await pool.getConnection();

  try {
    const [result]: any = await conn.query(
      `INSERT INTO user_missions
      (user_id, mission_id, status)
      VALUES (?, ?, 'IN_PROGRESS')`,
      [data.userId, data.missionId]
    );

    return result.insertId;
  } catch (err) {
    throw new Error(`미션 도전 추가 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const findUserMissionById = async (userMissionId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM user_missions WHERE id = ?",
      [userMissionId]
    );

    return rows[0] || null;
  } catch (err) {
    throw new Error(`도전 미션 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};
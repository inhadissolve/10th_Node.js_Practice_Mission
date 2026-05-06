import { pool } from "../../../db.config.js";

export const addUser = async (data: {
  email: string;
  password: string;
  name: string;
  gender: string;
  birth: Date;
  address: string;
  detailAddress: string;
  phoneNumber: string;
}) => {
  const conn = await pool.getConnection();

  try {
    const [confirm]: any = await conn.query(
      "SELECT * FROM user WHERE email = ?",
      [data.email]
    );

    if (Array.isArray(confirm) && confirm.length > 0) {
      return null;
    }

    const [result]: any = await conn.query(
  `INSERT INTO user
  (email, password, name, gender, birth, address, detail_address, phone_number)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    data.email,
    data.password,
    data.name,
    data.gender,
    data.birth,
    data.address,
    data.detailAddress,
    data.phoneNumber,
  ]
);

    return result.insertId;
  } catch (err) {
    throw new Error(`사용자 추가 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const setPreference = async (
  userId: number,
  foodCategoryId: number
) => {
  const conn = await pool.getConnection();

  try {
    await conn.query(
      `INSERT INTO user_favor_category
      (user_id, food_category_id)
      VALUES (?, ?)`,
      [userId, foodCategoryId]
    );
  } catch (err) {
    throw new Error(`선호 카테고리 추가 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const getUser = async (userId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      "SELECT * FROM user WHERE id = ?",
      [userId]
    );

    return rows[0];
  } catch (err) {
    throw new Error(`사용자 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};

export const getUserPreferencesByUserId = async (userId: number) => {
  const conn = await pool.getConnection();

  try {
    const [rows]: any = await conn.query(
      `SELECT fc.id, fc.name
       FROM user_favor_category ufc
       JOIN food_category fc ON ufc.food_category_id = fc.id
       WHERE ufc.user_id = ?`,
      [userId]
    );

    return rows;
  } catch (err) {
    throw new Error(`선호 카테고리 조회 중 오류가 발생했습니다: ${err}`);
  } finally {
    conn.release();
  }
};
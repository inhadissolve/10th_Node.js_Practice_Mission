import {
  addUser,
  getUser,
  getUserPreferencesByUserId,
  setPreference,
} from "../repositories/user.repository.js";
import { responseFromUser } from "../dtos/user.dto.js";
import bcrypt from "bcrypt";

export const userSignUp = async (data: {
  email: string;
  password: string;
  name: string;
  gender: string;
  birth: Date;
  address: string;
  detailAddress: string;
  phoneNumber: string;
  preferences: number[];
}) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const joinUserId = await addUser({
    email: data.email,
    password: hashedPassword,
    name: data.name,
    gender: data.gender,
    birth: data.birth,
    address: data.address,
    detailAddress: data.detailAddress,
    phoneNumber: data.phoneNumber,
  });

  if (joinUserId === null) {
    throw new Error("이미 존재하는 이메일입니다.");
  }

  for (const preference of data.preferences) {
    await setPreference(joinUserId, preference);
  }

  const user = await getUser(joinUserId);
  const preferences = await getUserPreferencesByUserId(joinUserId);

  return responseFromUser({ user, preferences });
};
import { prisma } from "../../../db.config.js";

export const addUser = async (data: {
  email: string;
  password?: string;
  name: string;
  gender: string;
  birth: Date;
  address: string;
  detailAddress: string;
  phoneNumber: string;
}) => {
  // 1. 이미 존재하는 이메일인지 확인
  const user = await prisma.user.findFirst({
    where: {
      email: data.email,
    },
  });

  if (user) {
    return null;
  }

  // 2. 새로운 사용자 생성
  const createdUser = await prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      name: data.name,
      gender: data.gender,
      birth: data.birth,
      address: data.address,
      detailAddress: data.detailAddress,
      phoneNumber: data.phoneNumber,
    },
  });

  return createdUser.id;
};

export const setPreference = async (
  userId: number,
  foodCategoryId: number
) => {
  await prisma.userFavorCategory.create({
    data: {
      userId,
      foodCategoryId,
    },
  });
};

export const getUser = async (userId: number) => {
  return await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
  });
};

export const getUserPreferencesByUserId = async (userId: number) => {
  return await prisma.userFavorCategory.findMany({
    where: {
      userId,
    },
    include: {
      foodCategory: true,
    },
    orderBy: {
      foodCategoryId: "asc",
    },
  });
};
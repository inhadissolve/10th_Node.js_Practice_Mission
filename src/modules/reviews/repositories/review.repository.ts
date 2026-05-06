import { prisma } from "../../../db.config.js";

export const findStoreById = async (storeId: number) => {
  return await prisma.store.findFirst({
    where: {
      id: storeId,
    },
  });
};

export const addReview = async (data: {
  storeId: number;
  rating: number;
  content: string;
  userId?: number;
}) => {
  const createdReview = await prisma.review.create({
    data: {
      storeId: data.storeId,

      // 기존 5주차 리뷰 API는 userId를 받지 않았기 때문에
      // 임시로 userId가 없으면 1번 사용자를 사용하도록 처리
      userId: data.userId ?? 1,

      rating: data.rating,
      content: data.content,
    },
  });

  return createdReview.id;
};

export const findReviewById = async (reviewId: number) => {
  return await prisma.review.findFirst({
    where: {
      id: reviewId,
    },
  });
};

export const getReviewsByUserId = async (
  userId: number,
  cursor: number
) => {
  return await prisma.review.findMany({
    where: {
      userId,

      // cursor보다 큰 id를 가진 리뷰만 조회
      id: {
        gt: cursor,
      },
    },

    select: {
      id: true,
      rating: true,
      content: true,
      createdAt: true,

      // 리뷰가 작성된 가게 정보도 함께 가져옴
      store: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },

    // id가 작은 순서대로 조회
    orderBy: {
      id: "asc",
    },

    // 한 번에 5개만 조회
    take: 5,
  });
};
import {
  addReview,
  findReviewById,
  findStoreById,
} from "../repositories/review.repository.js";
import { responseFromReview } from "../dtos/review.dto.js";

export const createReview = async (data: {
  storeId: number;
  rating: number;
  content: string;
}) => {
  const store = await findStoreById(data.storeId);

  if (!store) {
    throw new Error("존재하지 않는 가게입니다.");
  }

  if (data.rating < 1 || data.rating > 5) {
    throw new Error("평점은 1점부터 5점 사이여야 합니다.");
  }

  const reviewId = await addReview(data);

  const review = await findReviewById(reviewId);

  return responseFromReview(review);
};
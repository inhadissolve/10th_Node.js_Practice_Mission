import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { bodyToReview } from "../dtos/review.dto.js";
import {
  createReview,
  listMyReviews,
} from "../services/review.service.js";

export const handleCreateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("리뷰 추가를 요청했습니다.");
    console.log("params:", req.params);
    console.log("body:", req.body);

    const storeId = Number(req.params.storeId);

    if (Number.isNaN(storeId)) {
      throw new Error("storeId는 숫자여야 합니다.");
    }

    const review = await createReview(bodyToReview(req.body, storeId));

    res.status(StatusCodes.CREATED).json({
      result: review,
    });
  } catch (error) {
    next(error);
  }
};

export const handleListMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId);

    const cursor =
      typeof req.query.cursor === "string"
        ? Number(req.query.cursor)
        : 0;

    if (Number.isNaN(userId)) {
      throw new Error("userId는 숫자여야 합니다.");
    }

    if (Number.isNaN(cursor)) {
      throw new Error("cursor는 숫자여야 합니다.");
    }

    const reviews = await listMyReviews(userId, cursor);

    res.status(StatusCodes.OK).json(reviews);
  } catch (error) {
    next(error);
  }
};
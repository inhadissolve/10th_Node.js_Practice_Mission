import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { bodyToReview } from "../dtos/review.dto.js";
import { createReview } from "../services/review.service.js";

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
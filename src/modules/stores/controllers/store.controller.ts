import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { bodyToStore } from "../dtos/store.dto.js";
import { createStore } from "../services/store.service.js";

export const handleCreateStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("가게 추가를 요청했습니다.");
    console.log("params:", req.params);
    console.log("body:", req.body);

    const regionId = Number(req.params.regionId);

    if (Number.isNaN(regionId)) {
      throw new Error("regionId는 숫자여야 합니다.");
    }

    const store = await createStore(bodyToStore(req.body, regionId));

    res.status(StatusCodes.CREATED).json({
      result: store,
    });
  } catch (error) {
    next(error);
  }
};
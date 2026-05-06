import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import {
  bodyToMission,
  bodyToMissionChallenge,
} from "../dtos/mission.dto.js";

import {
  createMission,
  challengeMission,
} from "../services/mission.service.js";

export const handleCreateMission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("미션 추가를 요청했습니다.");
    console.log("params:", req.params);
    console.log("body:", req.body);

    const storeId = Number(req.params.storeId);

    if (Number.isNaN(storeId)) {
      throw new Error("storeId는 숫자여야 합니다.");
    }

    const mission = await createMission(bodyToMission(req.body, storeId));

    res.status(StatusCodes.CREATED).json({
      result: mission,
    });
  } catch (error) {
    next(error);
  }
};

export const handleChallengeMission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("미션 도전을 요청했습니다.");
    console.log("params:", req.params);
    console.log("body:", req.body);

    const missionId = Number(req.params.missionId);

    if (Number.isNaN(missionId)) {
      throw new Error("missionId는 숫자여야 합니다.");
    }

    const userMission = await challengeMission(
      bodyToMissionChallenge(req.body, missionId)
    );

    res.status(StatusCodes.CREATED).json({
      result: userMission,
    });
  } catch (error) {
    next(error);
  }
};
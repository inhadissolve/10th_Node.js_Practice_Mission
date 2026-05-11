import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import {
  bodyToMission,
  bodyToMissionChallenge,
} from "../dtos/mission.dto.js";

import {
  createMission,
  challengeMission,
  listStoreMissions,
  listInProgressMissions,
  completeMission,
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

export const handleListStoreMissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId = Number(req.params.storeId);

    const cursor =
      typeof req.query.cursor === "string"
        ? Number(req.query.cursor)
        : 0;

    if (Number.isNaN(storeId)) {
      throw new Error("storeId는 숫자여야 합니다.");
    }

    if (Number.isNaN(cursor)) {
      throw new Error("cursor는 숫자여야 합니다.");
    }

    const missions = await listStoreMissions(storeId, cursor);

    res.status(StatusCodes.OK).json(missions);
  } catch (error) {
    next(error);
  }
};

export const handleListInProgressMissions = async (
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

    const missions = await listInProgressMissions(userId, cursor);

    res.status(StatusCodes.OK).json(missions);
  } catch (error) {
    next(error);
  }
};

export const handleCompleteMission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = Number(req.params.userId);
    const missionId = Number(req.params.missionId);

    if (Number.isNaN(userId)) {
      throw new Error("userId는 숫자여야 합니다.");
    }

    if (Number.isNaN(missionId)) {
      throw new Error("missionId는 숫자여야 합니다.");
    }

    const result = await completeMission(userId, missionId);

    res.status(StatusCodes.OK).json({
      result,
    });
  } catch (error) {
    next(error);
  }
};
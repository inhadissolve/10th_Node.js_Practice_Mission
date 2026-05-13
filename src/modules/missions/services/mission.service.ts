import {
  addMission,
  addUserMission,
  findMissionById,
  findStoreById,
  findUserById,
  findUserMission,
  findUserMissionById,
  getMissionsByStoreId,
  getInProgressMissionsByUserId,
  findInProgressUserMission,
  completeUserMission,
} from "../repositories/mission.repository.js";
import {
  responseFromMission,
  responseFromUserMission,
  responseFromStoreMissions,
  responseFromInProgressMissions,
  responseFromCompletedMission,
} from "../dtos/mission.dto.js";

export const createMission = async (data: {
  storeId: number;
  title: string;
  description: string;
  rewardPoint: number;
}) => {
  const store = await findStoreById(data.storeId);

  if (!store) {
    throw new Error("존재하지 않는 가게입니다.");
  }

  if (data.rewardPoint < 0) {
    throw new Error("보상 포인트는 0 이상이어야 합니다.");
  }

  const missionId = await addMission(data);

  const mission = await findMissionById(missionId);

  return responseFromMission(mission);
};

export const challengeMission = async (data: {
  userId: number;
  missionId: number;
}) => {
  const user = await findUserById(data.userId);

  if (!user) {
    throw new Error("존재하지 않는 사용자입니다.");
  }

  const mission = await findMissionById(data.missionId);

  if (!mission) {
    throw new Error("존재하지 않는 미션입니다.");
  }

  const alreadyChallenged = await findUserMission(
    data.userId,
    data.missionId
  );

  if (alreadyChallenged) {
    throw new Error("이미 도전 중인 미션입니다.");
  }

  const userMissionId = await addUserMission(data);

  const userMission = await findUserMissionById(userMissionId);

  return responseFromUserMission(userMission);
};

export const listStoreMissions = async (
  storeId: number,
  cursor: number
) => {
  const store = await findStoreById(storeId);

  if (!store) {
    throw new Error("존재하지 않는 가게입니다.");
  }

  const missions = await getMissionsByStoreId(storeId, cursor);

  return responseFromStoreMissions(missions);
};

export const listInProgressMissions = async (
  userId: number,
  cursor: number
) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("존재하지 않는 사용자입니다.");
  }

  const missions = await getInProgressMissionsByUserId(userId, cursor);

  return responseFromInProgressMissions(missions);
};

export const completeMission = async (
  userId: number,
  missionId: number
) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("존재하지 않는 사용자입니다.");
  }

  const mission = await findMissionById(missionId);

  if (!mission) {
    throw new Error("존재하지 않는 미션입니다.");
  }

  const userMission = await findInProgressUserMission(userId, missionId);

  if (!userMission) {
    throw new Error("진행 중인 미션이 아닙니다.");
  }

  const completedMission = await completeUserMission(userMission.id);

  return responseFromCompletedMission(completedMission);
};
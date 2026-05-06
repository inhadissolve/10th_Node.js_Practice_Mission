import {
  addMission,
  addUserMission,
  findMissionById,
  findStoreById,
  findUserById,
  findUserMission,
  findUserMissionById,
} from "../repositories/mission.repository.js";
import {
  responseFromMission,
  responseFromUserMission,
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


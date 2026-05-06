export interface MissionCreateRequest {
  title: string;
  description: string;
  rewardPoint: number;
}

export const bodyToMission = (
  body: MissionCreateRequest,
  storeId: number
) => {
  return {
    storeId,
    title: body.title,
    description: body.description,
    rewardPoint: body.rewardPoint,
  };
};

export const responseFromMission = (mission: any) => {
  return {
    missionId: mission.id,
    storeId: mission.store_id,
    title: mission.title,
    description: mission.description,
    rewardPoint: mission.reward_point,
  };
};

export interface MissionChallengeRequest {
  userId: number;
}

export const bodyToMissionChallenge = (
  body: MissionChallengeRequest,
  missionId: number
) => {
  return {
    userId: body.userId,
    missionId,
  };
};

export const responseFromUserMission = (userMission: any) => {
  return {
    userMissionId: userMission.id,
    userId: userMission.user_id,
    missionId: userMission.mission_id,
    status: userMission.status,
  };
};
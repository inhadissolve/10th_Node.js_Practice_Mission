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

export const responseFromStoreMissions = (missions: any[]) => {
  const lastMission = missions[missions.length - 1];

  return {
    data: missions.map((mission) => ({
      missionId: mission.id,
      title: mission.title,
      description: mission.description,
      rewardPoint: mission.rewardPoint,
      createdAt: mission.createdAt,
      store: {
        storeId: mission.store.id,
        name: mission.store.name,
        address: mission.store.address,
      },
    })),
    pagination: {
      cursor: lastMission ? lastMission.id : null,
    },
  };
};
export const responseFromInProgressMissions = (userMissions: any[]) => {
  const lastUserMission = userMissions[userMissions.length - 1];

  return {
    data: userMissions.map((userMission) => ({
      userMissionId: userMission.id,
      status: userMission.status,
      startedAt: userMission.startedAt,
      mission: {
        missionId: userMission.mission.id,
        title: userMission.mission.title,
        description: userMission.mission.description,
        rewardPoint: userMission.mission.rewardPoint,
        store: {
          storeId: userMission.mission.store.id,
          name: userMission.mission.store.name,
          address: userMission.mission.store.address,
        },
      },
    })),
    pagination: {
      cursor: lastUserMission ? lastUserMission.id : null,
    },
  };
};

export const responseFromCompletedMission = (userMission: any) => {
  return {
    userMissionId: userMission.id,
    userId: userMission.userId,
    missionId: userMission.missionId,
    status: userMission.status,
    startedAt: userMission.startedAt,
    completedAt: userMission.completedAt,
  };
};
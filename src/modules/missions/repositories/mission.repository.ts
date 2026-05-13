import { prisma } from "../../../db.config.js";

export const findStoreById = async (storeId: number) => {
  return await prisma.store.findFirst({
    where: {
      id: storeId,
    },
  });
};

export const addMission = async (data: {
  storeId: number;
  title: string;
  description: string;
  rewardPoint: number;
}) => {
  const createdMission = await prisma.mission.create({
    data: {
      storeId: data.storeId,
      title: data.title,
      description: data.description,
      rewardPoint: data.rewardPoint,
    },
  });

  return createdMission.id;
};

export const findMissionById = async (missionId: number) => {
  return await prisma.mission.findFirst({
    where: {
      id: missionId,
    },
  });
};

export const findUserById = async (userId: number) => {
  return await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });
};

export const findUserMission = async (
  userId: number,
  missionId: number
) => {
  return await prisma.userMission.findFirst({
    where: {
      userId,
      missionId,
      status: "IN_PROGRESS",
    },
  });
};

export const addUserMission = async (data: {
  userId: number;
  missionId: number;
}) => {
  const createdUserMission = await prisma.userMission.create({
    data: {
      userId: data.userId,
      missionId: data.missionId,
      status: "IN_PROGRESS",
    },
  });

  return createdUserMission.id;
};

export const findUserMissionById = async (userMissionId: number) => {
  return await prisma.userMission.findFirst({
    where: {
      id: userMissionId,
    },
  });
};

export const getMissionsByStoreId = async (
  storeId: number,
  cursor: number
) => {
  return await prisma.mission.findMany({
    where: {
      storeId,
      id: {
        gt: cursor,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      rewardPoint: true,
      createdAt: true,
      store: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
    take: 5,
  });
};
export const getInProgressMissionsByUserId = async (
  userId: number,
  cursor: number
) => {
  return await prisma.userMission.findMany({
    where: {
      userId,
      status: "IN_PROGRESS",
      id: {
        gt: cursor,
      },
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      mission: {
        select: {
          id: true,
          title: true,
          description: true,
          rewardPoint: true,
          store: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "asc",
    },
    take: 5,
  });
};

export const findInProgressUserMission = async (
  userId: number,
  missionId: number
) => {
  return await prisma.userMission.findFirst({
    where: {
      userId,
      missionId,
      status: "IN_PROGRESS",
    },
  });
};

export const completeUserMission = async (userMissionId: number) => {
  return await prisma.userMission.update({
    where: {
      id: userMissionId,
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      updatedAt: new Date(),
    },
  });
};
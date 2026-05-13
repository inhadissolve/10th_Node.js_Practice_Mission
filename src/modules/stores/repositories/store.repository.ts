import { prisma } from "../../../db.config.js";

export const findRegionById = async (regionId: number) => {
  return await prisma.region.findFirst({
    where: {
      id: regionId,
    },
  });
};

export const addStore = async (data: {
  regionId: number;
  name: string;
  address: string;
}) => {
  const createdStore = await prisma.store.create({
    data: {
      regionId: data.regionId,
      name: data.name,
      address: data.address,
    },
  });

  return createdStore.id;
};

export const findStoreById = async (storeId: number) => {
  return await prisma.store.findFirst({
    where: {
      id: storeId,
    },
  });
};
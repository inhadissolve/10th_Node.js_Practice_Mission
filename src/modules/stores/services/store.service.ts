import {
  addStore,
  findRegionById,
  findStoreById,
} from "../repositories/store.repository.js";
import { responseFromStore } from "../dtos/store.dto.js";

export const createStore = async (data: {
  regionId: number;
  name: string;
  address: string;
}) => {
  const region = await findRegionById(data.regionId);

  if (!region) {
    throw new Error("존재하지 않는 지역입니다.");
  }

  const storeId = await addStore(data);

  const store = await findStoreById(storeId);

  return responseFromStore(store);
};
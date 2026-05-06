export interface StoreCreateRequest {
  name: string;
  address: string;
}

export const bodyToStore = (body: StoreCreateRequest, regionId: number) => {
  return {
    regionId,
    name: body.name,
    address: body.address,
  };
};

export const responseFromStore = (store: any) => {
  return {
    storeId: store.id,
    regionId: store.region_id,
    name: store.name,
    address: store.address,
  };
};
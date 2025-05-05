export let SHOP_ID: string | null = null;

export function setShopId(id: string) {
  SHOP_ID = id;
}

export function getShopId(): string | null {
  return SHOP_ID;
}

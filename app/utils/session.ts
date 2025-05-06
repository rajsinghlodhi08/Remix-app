import shopify from "../shopify.server";

export async function getOfflineSession(shop: string) {
  const offlineSessionId = shopify.api.session.getOfflineId(shop);
  return await shopify.sessionStorage.loadSession(offlineSessionId);
}

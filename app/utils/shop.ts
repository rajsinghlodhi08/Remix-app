import { authenticate } from "../shopify.server";

export async function getShopDetails(request: Request) {
  const { admin } = await authenticate.admin(request);

  if (!admin) {
    throw new Error("Admin session is not available");
  }

  const response = await admin.graphql(`
    query {
      shop {
        id
        name
        email
        primaryDomain {
          url
        }
      }
    }
  `);

  if (!response) {
    throw new Error("Failed to fetch shop details");
  }
  const result = await response.json();
    if (!result) {
        throw new Error("Failed to parse shop details response");
    }
    
  return result?.data?.shop || null;
}

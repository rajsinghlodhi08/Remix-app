import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { setShopId } from "./../config/shopify";

export async function loader({ request }: any) {
  const { admin, session } = await authenticate.admin(request);

  if (!admin) {
    return json({ success: false, error: "Admin session is not available" }, { status: 401 });
  }

  const response = await admin.graphql(`
    query {
      shop {
        id
      }
    }
  `);

if (!response) {
    return json({ success: false, error: "Shop ID not found" }, { status: 404 });
  }
  const result = await response.json();
  const shopId = result.data.shop.id; // Adjust this line to match your response structure
  console.log(shopId,'shopId from Loader');
  setShopId(shopId); // ✅ Set shopId globally

  return json({ success: true, shopId });
}

import { json } from "@remix-run/node";
import fs from 'fs/promises';
import path from 'path';

import { authenticate } from "../shopify.server";
import { getShopDetails } from "../utils/shop";
export async function action({ request }:any) {

  const { admin, session } = await authenticate.admin(request);
  if (!admin) {
    return json({ success: false, error: "Admin session is not available" }, { status: 401 });
  }
 
  const body = await request.json();
// Ensure `min`, `max`, and `percentage` are numbers
 const formattedDiscounts = {
  discounts: body.discounts.map((d:any) => ({
    min: Number(d.min), 
    max: Number(d.max), 
    percentage: Number(d.discount) // Change key from `discount` to `percentage`
  }))
};
// Convert the object to a JSON string
const shopData = await getShopDetails(request);

const value = JSON.stringify(formattedDiscounts);
try {
    const response = await admin.graphql(
      `mutation SetGlobalTieredDiscounts($ownerId: ID!, $value: String!) {
        metafieldsSet(metafields: [
          {
            namespace: "custom.tiered_discounts",
            key: "discount_rules",
            type: "json",
            ownerId: $ownerId, 
            value: $value
          }
        ]) {
          metafields {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          ownerId: `${shopData.id}`, // ✅ Pass as variable
          value,  // Ensure `value` is a properly formatted JSON string
        },
      }
    );

    const discountFilePath = path.resolve(
      process.cwd(),
      'extensions/product-discount/src/discount.json'
    );

    // Write the formatted discounts directly to the JSON file
    await fs.writeFile(
      discountFilePath,
      JSON.stringify(formattedDiscounts, null, 2),
      'utf8'
    );

    return json({ 
      success: true, 
      response: value,
      message: "Discounts updated successfully in both metafield and local file"
    }, { status: 200 });

  }catch (error: unknown) {
  let errorMessage = "An unknown error occurred";

  if (error instanceof Error) {
    errorMessage = error.message;
  }

  return json({ success: false, error: errorMessage }, { status: 500 });
}
}

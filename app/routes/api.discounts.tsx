import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

interface Discount {
  min: number;
  max: number;
  percentage: number;
}

export async function loader({ request }: any) {
  const { admin } = await authenticate.public.appProxy(request);

  if (!admin) {
    return json({ error: "Admin API context is undefined." }, { status: 401 });
  }

  try {
    const response = await admin.graphql(
      `#graphql
      query getDiscountMetafield {
        shop {
          id
          metafield(namespace: "custom.tiered_discounts", key: "discount_rules") {
            id
            value
            type
          }
        }
      }`
    );

    const result = await response.json();
    const metafield = result?.data?.shop?.metafield;

    if (!metafield?.value) {
      return json({ success: false, error: "No discount metafield found" }, { status: 404 });
    }

    const discounts = JSON.parse(metafield.value || "[]");

    const newDiscounts: Discount[] = (discounts as any)?.discounts ?? [];

    return json({ success: true, discounts:newDiscounts }, { status: 200 });

  } catch (error: unknown) {
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

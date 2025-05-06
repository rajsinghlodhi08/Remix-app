import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getShopDetails } from "../utils/shop";
import { parse } from "querystring";

// Define expected data types
interface Discount {
  min: number;
  max: number;
  percentage: number;
}

interface LoaderData {
  success: boolean;
  discounts?: Discount[];
  error?: string;
}

  export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session?.shop;

  if (!admin) {
    return Response.json({ success: false, error: "Admin session is not available" }, { status: 401 });
  }
  const shopData = await getShopDetails(request);

  try {
    const response: any = await admin.graphql(`
      query {
        shop {
          id
          metafield(namespace: "custom.tiered_discounts", key: "discount_rules") {
            id
            value
            type
          }
        }
      }
    `);
    const result = await response.json();
    const metafield = result?.data?.shop?.metafield;
    if (!metafield?.value) {
      return Response.json({ success: false, error: "No discount metafield found" });
    }
     const discounts= JSON.parse(metafield.value || "[]") //metafield.value;
    
    return Response.json({ success: true, discounts }, { status: 200 });
  } catch (error: unknown) {  
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};
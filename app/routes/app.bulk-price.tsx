import { useState, useEffect ,useCallback } from "react";
import {Page,Card,Form,FormLayout,TextField,Button,Grid,Toast,Frame} from "@shopify/polaris";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

interface Discount {
  min: string;
  max: string;
  discount: string;
}

interface LoaderData {
  success: boolean;
  discountslist?: Discount[];
  error?: string;
}

// Loader to fetch metafield data
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  if (!admin) {
    return json({ success: false, error: "Admin session is not available" }, { status: 401 });
  }

  try {
    const response: any = await admin.graphql(`
      query {
        shop {
          metafield(namespace: "custom.tiered_discounts", key: "discount_rules") {
            value
          }
        }
      }
    `);
    const result = await response.json();

    const metafield = result?.data?.shop?.metafield;
    const discounts = metafield?.value ? JSON.parse(metafield.value) : [];
    const rawDiscounts: any[] = discounts?.discounts ?? [];

    // Transform each discount to use the "discount" key rather than "percentage"
    const discountslist: Discount[] = rawDiscounts.map((d) => ({
      min: d.min,
      max: d.max,
      discount: d.percentage, // Mapping Shopify's "percentage" to our "discount"
    }));
    
    return json({ success: true, discountslist });
  } catch (error: unknown) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Component
export default function BulkDiscountForm() {

  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toggleToast = useCallback(() => setToastActive((prev) => !prev), []);

  const { success, discountslist, error } = useLoaderData<LoaderData>();
  const [discounts, setDiscounts] = useState<Discount[]>([
    { min: "", max: "", discount: "" },
  ]);

  // Load discounts into form on mount
  useEffect(() => {
    if (success && discountslist && discountslist.length > 0) {
      setDiscounts(discountslist);
    }
  }, [success, discountslist]);

  const handleChange = (index: number, field: keyof Discount, value: string) => {
    const updated = [...discounts];
    updated[index][field] = value;
    setDiscounts(updated);
  };

  const addRow = () => {
    setDiscounts([...discounts, { min: "", max: "", discount: "" }]);
  };

  const removeRow = (index: number) => {
    setDiscounts(discounts.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const filteredDiscounts = discounts.filter(
      (d) =>
        String(d.min).trim() !== "" &&
        String(d.max).trim() !== "" &&
        String(d.discount).trim() !== ""
    );
    setIsLoading(true);


    const response = await fetch("/api/bulk-discount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ discounts : filteredDiscounts }),
    });

    const result = await response.json();
    if (result.success) {
      setToastMessage("Discounts saved successfully!");
    } else {
      setToastMessage("Error saving discounts: " + result.error);
    }
    setToastActive(true);
    setIsLoading(false);
  };

  return (
    <Frame>
    <Page title="Set Bulk Discounts" fullWidth>
            {toastActive && (
        <Toast content={toastMessage} onDismiss={toggleToast} duration={5000} />
      )}
      <Card>
        <p>
          Set bulk discounts for your products. Discounts are applied based on
          the quantity purchased.
        </p>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            {discounts.map((tier, index) => (
              <Grid key={index}>
                <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <TextField
                    type="number"
                    label="Min Qty"
                    value={tier.min}
                    onChange={(value) => handleChange(index, "min", value)}
                    autoComplete="off"
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <TextField
                    type="number"
                    label="Max Qty"
                    value={tier.max}
                    onChange={(value) => handleChange(index, "max", value)}
                    autoComplete="off"
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <TextField
                    type="number"
                    label="Discount %"
                    value={tier.discount}
                    onChange={(value) => handleChange(index, "discount", value)}
                    autoComplete="off"
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  {discounts.length > 1 && (
                    <Button style={{ display: "flex", alignItems: "center" }} onClick={() => removeRow(index)}>Remove</Button>
                  )}
                </Grid.Cell>
              </Grid>
            ))}
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <Button onClick={addRow} >+ Add More</Button>
                </div>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button submit variant="primary" fullWidth   loading={isLoading}
                  >Save Discounts</Button>
                </div>
              </Grid.Cell>
            </Grid>
          </FormLayout>
        </Form>
      </Card>
    </Page>
    </Frame>
  );
}

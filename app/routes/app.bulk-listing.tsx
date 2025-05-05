import {Page, IndexTable,  useIndexResourceState, useBreakpoints, Text, Card ,Layout,LegacyCard,TextContainer,SkeletonPage,SkeletonBodyText,SkeletonDisplayText,} from "@shopify/polaris";
import { json } from "@remix-run/node";
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { useEffect, useState} from "react";

import { getShopDetails } from "../utils/shop";


// Define expected data types
interface Discount extends Record<string, unknown> {
  min: string;
  max: string;
  percentage: string;
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
      return json({ success: false, error: "No discount metafield found" });
    }
     const discounts= JSON.parse(metafield.value || "[]") //metafield.value;
    
    return json({ success: true, discounts }, { status: 200 });
    
  } catch (error: unknown) {  
    return json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};

// React Component: Display Discount Table
export default function DiscountTable() {

  const { success, discounts, error } = useLoaderData<LoaderData>();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Simulate loading delay, or just hide loader once data is loaded
    if (success !== undefined) {
      setIsLoading(false);
    }
  }, [success]);

  const newDiscounts: Discount[] = (discounts as any)?.discounts ?? [];
  // console.log(newDiscounts,'discounts from Loader');
  const resourceName = {
    singular: 'quotes',
    plural: 'quotes',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} = useIndexResourceState(newDiscounts);  
  const rowMarkup = newDiscounts.map((
    { min,max,percentage},
    index,
  ) => (
    <IndexTable.Row
      id={String(index)}
      key={index}
      selected={selectedResources.includes(String(index))}
      position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {min}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
          {max}
      </IndexTable.Cell>  
      <IndexTable.Cell>
          {percentage}
      </IndexTable.Cell>
    </IndexTable.Row>
  ),
);
  return (
    <Page title="Bulk discounts percentage wise" fullWidth> 
   { isLoading ? (
        <SkeletonPage primaryAction>
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned>
              <SkeletonBodyText />
            </LegacyCard>
            <LegacyCard sectioned>
              <TextContainer>
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText />
              </TextContainer>
            </LegacyCard>
            <LegacyCard sectioned>
              <TextContainer>
                <SkeletonDisplayText size="small" />
                <SkeletonBodyText />
              </TextContainer>
            </LegacyCard>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <LegacyCard>
              <LegacyCard.Section>
                <TextContainer>
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={2} />
                </TextContainer>
              </LegacyCard.Section>
              <LegacyCard.Section>
                <SkeletonBodyText lines={1} />
              </LegacyCard.Section>
            </LegacyCard>
            <LegacyCard subdued>
              <LegacyCard.Section>
                <TextContainer>
                  <SkeletonDisplayText size="small" />
                  <SkeletonBodyText lines={2} />
                </TextContainer>
              </LegacyCard.Section>
              <LegacyCard.Section>
                <SkeletonBodyText lines={2} />
              </LegacyCard.Section>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </SkeletonPage>
   ):  success ? (
    <Card>
    <IndexTable
        // condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={newDiscounts.length}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          {title: 'MIN Quantity'},
          {title: 'MAX Quantity'},
          {title: 'Discount (%)'}
        ]}
        selectable={false}
        pagination={{}}>

        {rowMarkup}
      </IndexTable>
    </Card>
    ) : (
      <LegacyCard sectioned>
        <Text as="h2" variant="headingLg" fontWeight="bold">
          {error || "Something went wrong while fetching data."}
        </Text>
      </LegacyCard>
    )}

  </Page>
  );
}

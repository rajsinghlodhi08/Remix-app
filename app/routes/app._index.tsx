import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs ,} from "@remix-run/node";
import { json, useFetcher ,redirect } from "@remix-run/react";
import { useLoaderData, Form } from "@remix-run/react";
import {Page, IndexTable,  useIndexResourceState, useBreakpoints, Text, Card} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import db  from "../db.server";
import { useSearchParams } from "@remix-run/react";

interface Quote {
  id: any;
  fullName: string; // or name: string;
  company: string;
  product: string;
  quantity: string;
  email: string;
  telephone: string;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // Fetch all quotes from the database
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const pageSize = 10; // Number of items per page

  const quotes: Quote[] = await db.quote.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const totalQuotes = await db.quote.count();
  const hasNextPage = page * pageSize < totalQuotes;

  return json({ quotes, hasNextPage, page });
};

export default function Index() {

  const { quotes, hasNextPage, page } = useLoaderData<{ quotes: Quote[], hasNextPage: boolean, page: number }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const handleNextPage = () => {
    const nextPage = Number(page) + 1;
    setSearchParams({ page: nextPage.toString() });
  };

  const handlePreviousPage = () => {
    const prevPage = Number(page) - 1;
    setSearchParams({ page: prevPage.toString() });
  };

  const resourceName = {
    singular: 'quotes',
    plural: 'quotes',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(quotes);

  const rowMarkup = quotes.map((
      {id, fullName,company,product,quantity,email,telephone},
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {fullName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
            {company}
        </IndexTable.Cell>  
        <IndexTable.Cell>
            {product}

        </IndexTable.Cell>
        <IndexTable.Cell>
            {quantity}
        </IndexTable.Cell>
        <IndexTable.Cell> 
            {email}
        </IndexTable.Cell>    
        <IndexTable.Cell>
            {telephone}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page title="quotes" fullWidth> 
    <Card>
      <IndexTable
        condensed={useBreakpoints().smDown}
        resourceName={resourceName}
        itemCount={quotes.length}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        headings={[
          {title: 'Full Name'},
          {title: 'Company'},
          {title: 'Product'}, 
          {title: 'Quantity'},
          {title: 'Email'},
          {title: 'Telephone'},
        ]}
        pagination={{
            hasNext: hasNextPage,
            onNext: handleNextPage,
            hasPrevious: page > 1,
            onPrevious: handlePreviousPage,
        }}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
    </Page>
  );
}

import { Hono } from "https://deno.land/x/hono@v3.10.4/mod.ts";

const app = new Hono();
const baseurl = "https://www.rentomojo.com";

app.get("/api/productInventory", async (c) => {
  const token = c.req.query("token");
  const operation = c.req.query("operation");
  
  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  if (!operation) {
    return c.json({ error: "Operation is required" }, 400);
  }

  try {
    switch (operation) {
      case "getActiveProductList":
        return await getActiveProductList(c, token);
      case "showActiveProducts":
        return await showActiveProducts(c, token);
      default:
        return c.json({ error: "Invalid operation" }, 400);
    }
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

async function getActiveProductList(c: any, token: string) {
  const response = await fetch(
    baseurl + "/api/Dashboards/activeProductList",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en;q=0.9",
        authorization: token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch active product list: ${response.statusText}`);
  }

  const data = await response.json();
  return c.json({ type: "ActiveProductList", data: data });
}

async function showActiveProducts(c: any, token: string) {
  // This function will use the same endpoint as getActiveProductList,
  // but will format the data differently for display purposes
  const response = await fetch(
    baseurl + "/api/Dashboards/activeProductList",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en;q=0.9",
        authorization: token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch active products: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Format the data for display
  const formattedData = data.map((product: any) => ({
    id: product.id,
    name: product.productName,
    category: product.category,
    rentAmount: product.rentAmount,
    tenure: product.tenure,
    status: product.status
  }));

  return c.json({ 
    type: "FormattedActiveProducts", 
    data: formattedData,
    message: "These are your active rented products.",
    instruction: "Swipe or scroll to view all your active products."
  });
}

export default app;

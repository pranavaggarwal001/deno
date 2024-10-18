import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";

const app = new Hono();
const baseurl = "https://www.rentomojo.com";

app.get("/api/billingAndPayments", async (c) => {
  const token = c.req.query("token");
  const userId = c.req.query("userId");
  const invoiceId = c.req.query("invoiceId");

  if (!token) {
    return c.json({ error: "Token is required" }, 400);
  }

  try {
    // GetRentalDue
    if (!userId && !invoiceId) {
      const response = await fetch(baseurl + "/api/Dashboards/dashboardData", {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: token,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rental due data: ${response.statusText}`);
      }

      const data = await response.json();
      return c.json({
        type: "RentalDue",
        data: {
          pendingDuesText: data.pendingDuesText,
          totalPendingRentalDueAmount: data.totalPendingRentalDueAmount,
          totalPayableAmount: data.totalPayableAmount,
          pendingLateFeeAmount: data.pendingLateFeeAmount,
          rentoMoney: data.rentoMoney,
        },
      });
    }

    // GetPendingDues
    if (userId && !invoiceId) {
      const response = await fetch(
        baseurl + `/api/RMUsers/getPendingRentalItemsBreakUp?userId=${userId}`,
        {
          headers: {
            "accept-language": "en-GB,en;q=0.9",
            authorization: token,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pending dues: ${response.statusText}`);
      }

      const data = await response.json();
      return c.json({
        type: "PendingDues",
        data: data,
      });
    }

    // GetInvoices
    if (!userId && !invoiceId) {
      const response = await fetch(baseurl + `/api/Dashboards/getLedgersData`, {
        headers: {
          authorization: token,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.statusText}`);
      }

      const data = await response.json();
      const formattedData = data.invoices.map((invoice) => ({
        id: invoice.id,
        createdAt: invoice.createdAt,
        invoiceMonth: invoice.invoiceMonth,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        paymentStatus: invoice.paymentStatus === 20 ? "Paid" : "Unpaid",
        invoicePaidDate: invoice.invoicePaidDate,
      }));

      return c.json({
        type: "Invoices",
        data: { invoices: formattedData },
      });
    }

    // GetUserInvoice
    if (userId && invoiceId) {
      const response = await fetch(
        baseurl +
          `/api/RMUsers/${userId}/getUserLedgerInvoice?invoiceId=${invoiceId}&discardGstInvoiceDateCheck=true`,
        {
          headers: {
            authorization: token,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user invoice: ${response.statusText}`);
      }

      const data = await response.json();
      const formattedData = {
        id: data.id,
        invoiceDate: data.invoiceDate,
        userId: data.userId,
        invoiceNumber: data.invoiceNumber,
        address: data.address,
        rentAmount: data.rentAmount,
        paymentStatus: data.paymentStatus === 20 ? "Paid" : "Unpaid",
        invoiceUrl: `${baseurl}/dashboard/my-subscriptions/${data.id}/rental-invoice`,
        orderItemRents: data.orderItemRents.map((orderItemRent) => ({
          rentAmount: orderItemRent.rentAmount,
          billingCycleStartDate: orderItemRent.billingCycleStartDate,
          billingCycleEndDate: orderItemRent.billingCycleEndDate,
          dueDate: orderItemRent.dueDate,
          rentalMonth: orderItemRent.rentalMonth,
          productName: orderItemRent.orderItem.product.name,
          orderUniqueId: orderItemRent.orderItem.order.uniqueId,
        })),
      };

      return c.json({
        type: "UserInvoice",
        data: formattedData,
      });
    }

    return c.json({ error: "Invalid combination of parameters" }, 400);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

export default app;

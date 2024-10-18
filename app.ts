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
    let response;
    let data;

    // GetRentalDue
    if (!userId && !invoiceId) {
      response = await fetch(baseurl + "/api/Dashboards/dashboardData", {
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: token,
        },
      });
      data = await response.json();
      return c.json({
        pendingDuesText: data.pendingDuesText,
        totalPendingRentalDueAmount: data.totalPendingRentalDueAmount,
        totalPayableAmount: data.totalPayableAmount,
        pendingLateFeeAmount: data.pendingLateFeeAmount,
        rentoMoney: data.rentoMoney,
      });
    }

    // GetPendingDues
    if (userId && !invoiceId) {
      response = await fetch(
        baseurl + `/api/RMUsers/getPendingRentalItemsBreakUp?userId=${userId}`,
        {
          headers: {
            "accept-language": "en-GB,en;q=0.9",
            authorization: token,
          },
        }
      );
      data = await response.json();
      return c.json({ results: data });
    }

    // GetInvoices
    if (!userId && !invoiceId) {
      response = await fetch(baseurl + `/api/Dashboards/getLedgersData`, {
        headers: {
          authorization: token,
        },
      });
      data = await response.json();
      const formattedData = data.invoices.map((invoice) => ({
        id: invoice.id,
        createdAt: invoice.createdAt,
        invoiceMonth: invoice.invoiceMonth,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        paymentStatus: invoice.paymentStatus === 20 ? "Paid" : "Unpaid",
        invoicePaidDate: invoice.invoicePaidDate,
      }));
      return c.json({ invoices: formattedData });
    }

    // GetUserInvoice
    if (userId && invoiceId) {
      response = await fetch(
        baseurl +
          `/api/RMUsers/${userId}/getUserLedgerInvoice?invoiceId=${invoiceId}&discardGstInvoiceDateCheck=true`,
        {
          headers: {
            authorization: token,
          },
        }
      );
      data = await response.json();
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
      return c.json(formattedData);
    }

    return c.json({ error: "Invalid combination of parameters" }, 400);
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

export default app;

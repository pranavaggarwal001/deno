import { Hono } from "https://deno.land/x/hono@v3.10.4/mod.ts";

const app = new Hono();
const baseurl = "https://www.rentomojo.com";

app.get("/api/orderServiceManagement", async (c) => {
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
      case "getServiceRequests":
        return await getServiceRequests(c, token);
      case "showServiceRequests":
        return await showServiceRequests(c, token);
      case "getDeliverySlots":
        return await getDeliverySlots(c, token);
      default:
        return c.json({ error: "Invalid operation" }, 400);
    }
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

app.post("/api/orderServiceManagement", async (c) => {
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
      case "bookCssSlot":
        return await bookCssSlot(c, token);
      case "rescheduleRequest":
        return await rescheduleRequest(c, token);
      case "createRepairTicket":
        return await createRepairTicket(c, token);
      case "cancelServiceRequest":
        return await cancelServiceRequest(c, token);
      default:
        return c.json({ error: "Invalid operation" }, 400);
    }
  } catch (error) {
    console.error("Request failed:", error.message);
    return c.json({ error: "Request failed", details: error.message }, 500);
  }
});

async function getServiceRequests(c: any, token: string) {
  const response = await fetch(
    baseurl +
      "/api/Dashboards/getServiceRequest?query=%7B%22page%22:1,%22size%22:100%7D&activeStatus=active",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        authorization: token,
        "chat-app": "bot9",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch service requests: ${response.statusText}`);
  }

  const data = await response.json();
  return c.json({ type: "ServiceRequests", data: data.results });
}

async function showServiceRequests(c: any, token: string) {
  // This function might be similar to getServiceRequests, but with different formatting
  // For this example, we'll use the same endpoint but format the data differently
  const response = await fetch(
    baseurl +
      "/api/Dashboards/getServiceRequest?query=%7B%22page%22:1,%22size%22:100%7D&activeStatus=active",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        authorization: token,
        "chat-app": "bot9",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch service requests: ${response.statusText}`);
  }

  const data = await response.json();
  const formattedData = data.results.map((request: any) => ({
    id: request.serviceRequestId,
    type: request.requestType.label,
    status: request.requestStatus.label,
    createdAt: request.createdAt,
  }));

  return c.json({ type: "FormattedServiceRequests", data: formattedData });
}

async function getDeliverySlots(c: any, token: string) {
  const { orderUniqueId, requestType } = await c.req.json();

  if (!orderUniqueId || !requestType) {
    return c.json({ error: "orderUniqueId and requestType are required" }, 400);
  }

  const response = await fetch(baseurl + "/api/ServiceRequests/getCssSlots", {
    method: "POST",
    headers: {
      authorization: token,
      "Content-Type": "application/json",
      "chat-app": "bot9",
    },
    body: JSON.stringify({
      data: {
        orderUniqueId: orderUniqueId,
        requestType: requestType,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch delivery slots: ${response.statusText}`);
  }

  const data = await response.json();
  return c.json({ type: "DeliverySlots", data: data });
}

async function bookCssSlot(c: any, token: string) {
  const { serviceRequestId, taskDateTime } = await c.req.json();

  if (!serviceRequestId || !taskDateTime) {
    return c.json({ error: "serviceRequestId and taskDateTime are required" }, 400);
  }

  const response = await fetch(baseurl + "/api/ServiceRequests/bookCssSlot", {
    method: "POST",
    headers: {
      authorization: token,
      "Content-Type": "application/json",
      "chat-app": "bot9",
    },
    body: JSON.stringify({
      data: {
        serviceRequestId: serviceRequestId,
        taskDateTime: taskDateTime,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to book CSS slot: ${response.statusText}`);
  }

  const data = await response.json();
  return c.json({ type: "BookedCssSlot", data: data });
}

async function rescheduleRequest(c: any, token: string) {
  const { serviceRequestId, preferredDate } = await c.req.json();

  if (!serviceRequestId || !preferredDate) {
    return c.json({ error: "serviceRequestId and preferredDate are required" }, 400);
  }

  const response = await fetch(baseurl + "/api/ServiceRequests/cssRescheduleTicket", {
    method: "POST",
    headers: {
      authorization: token,
      "Content-Type": "application/json",
      "chat-app": "bot9",
    },
    body: JSON.stringify({
      data: {
        serviceRequestId: serviceRequestId,
        preferredDate: preferredDate,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reschedule request: ${response.statusText}`);
  }

  const data = await response.json();
  return c.json({ type: "RescheduledRequest", data: data });
}

async function createRepairTicket(c: any, token: string) {
  const { media1, media2, media3, media4, description, orderId } = await c.req.json();

  const mediaUrls = [media1, media2, media3, media4].filter(Boolean);

  if (mediaUrls.length === 0) {
    return c.json({ error: "At least one image URL is required" }, 400);
  }

  // Upload images
  const uploadResponse = await fetch(baseurl + "/api/ServiceRequestImages/urlUpload", {
    method: "POST",
    headers: {
      accept: "*/*",
      authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrls: mediaUrls }),
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload images: ${uploadResponse.statusText}`);
  }

  const uploadedImages = await uploadResponse.json();

  // Create ticket
  const ticketResponse = await fetch(baseurl + "/api/Dashboards/createNewTickets", {
    method: "POST",
    headers: {
      authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        requestType: 20,
        images: uploadedImages,
        orderItemId: parseInt(orderId),
        message: description,
      }],
    }),
  });

  if (!ticketResponse.ok) {
    throw new Error(`Failed to create repair ticket: ${ticketResponse.statusText}`);
  }

  const ticketData = await ticketResponse.json();
  return c.json({ type: "CreatedRepairTicket", data: ticketData });
}

async function cancelServiceRequest(c: any, token: string) {
  const { serviceRequestId } = await c.req.json();

  if (!serviceRequestId) {
    return c.json({ error: "serviceRequestId is required" }, 400);
  }

  const response = await fetch(baseurl + "/api/ServiceRequests/cancelRequest", {
    method: "POST",
    headers: {
      authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ serviceRequestId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel service request: ${response.statusText}`);
  }

  const data = await response.json();
  return c.json({ type: "CancelledServiceRequest", data: data });
}

export default app;

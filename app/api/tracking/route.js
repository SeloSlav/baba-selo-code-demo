import { NextResponse } from 'next/server';
import { getAuth } from "firebase-admin/auth";
import admin from "firebase-admin";

// Firebase init
if (!admin.apps.length) {
  // NOTE: Consider explicit credential handling for production
  admin.initializeApp(); 
}

// Rate limit memory store - Note: This resets on each serverless invocation
const rateLimitStore = new Map();
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;

// ---- TEST FLAG ----
// Set to true to use the hardcoded test email below
const USE_TEST_EMAIL = true; 
const TEST_EMAIL = 'charles.hofner@gmail.com';
// -----------------

// Log environment variables to verify they are loaded
console.log("SHOPIFY_ADMIN_API_TOKEN loaded:", !!process.env.SHOPIFY_ADMIN_API_TOKEN);
console.log("SHOPIFY_API_VERSION loaded:", !!process.env.SHOPIFY_API_VERSION);
console.log("SHOPIFY_SHOP loaded:", !!process.env.SHOPIFY_SHOP);

// Define required Shopify details from environment variables
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

// Function to construct the REST API URL
const getShopifyRestUrl = (path) => {
  if (!SHOPIFY_SHOP) throw new Error('Missing SHOPIFY_SHOP environment variable');
  return `https://${SHOPIFY_SHOP}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/${path}`;
};

export async function GET(request) { 
  // Basic validation for required env vars
  if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_API_TOKEN) {
    console.error("Missing Shopify configuration environment variables");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.split("Bearer ")[1];

  if (!token) { 
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  let uid, email;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    uid = decoded.uid;
    // Use test email if flag is set, otherwise use authenticated email
    email = USE_TEST_EMAIL ? TEST_EMAIL : decoded.email;
    
    if (USE_TEST_EMAIL) {
      console.warn(`***** USING TEST EMAIL: ${TEST_EMAIL} *****`);
    } else if (!email) {
      console.warn(`User ${uid} authenticated but has no email in token.`);
      return NextResponse.json({ error: "Email not found in authentication token" }, { status: 400 });
    }
    
  } catch (err) {
    // Allow proceeding with test email even if auth fails during testing
    if (USE_TEST_EMAIL) {
      console.warn(`***** AUTH FAILED (Token: ${token ? 'present' : 'missing'}), BUT USING TEST EMAIL: ${TEST_EMAIL} *****`);
      email = TEST_EMAIL;
      uid = 'test-user'; // Assign a dummy UID for rate limiting
    } else {
      console.error("Auth error:", err);
      return NextResponse.json({ error: "Invalid or expired auth token" }, { status: 401 });
    }
  }

  // Rate limiting
  const now = Date.now();
  const userActivity = rateLimitStore.get(uid) || [];
  const recent = userActivity.filter(ts => now - ts < WINDOW_MS);

  if (recent.length >= RATE_LIMIT) {
    return NextResponse.json({
      error: "Rate limit exceeded",
      message: "Whoa there! You've made too many requests. Please try again in a minute.",
    }, { status: 429 });
  }

  recent.push(now);
  rateLimitStore.set(uid, recent);

  try {
    console.log(`Fetching orders via REST for email: ${email}`);

    // Fetch recent orders, add line_items to fields
    const fields = 'id,name,email,created_at,fulfillment_status,fulfillments,line_items';
    const ordersUrl = getShopifyRestUrl(`orders.json?email=${encodeURIComponent(email)}&status=any&limit=10&order=created_at+desc&fields=${fields}`);
    
    const response = await fetch(ordersUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Shopify REST API error (${response.status}):`, errorBody);
      throw new Error(`Shopify API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.orders)) {
      console.error('Unexpected Shopify REST response structure:', data);
      throw new Error('Invalid response structure from Shopify');
    }
    
    console.log(`Received ${data.orders.length} orders from Shopify REST API.`);

    const fulfilledOrdersWithTracking = [];
    const pendingOrders = []; 
    const processedOrderIds = new Set();

    for (const order of data.orders) {
      // Extract line item details
      const items = order.line_items.map(item => ({ 
        title: item.title, 
        quantity: item.quantity 
      }));

      let foundTracking = false;
      if (order.fulfillments && order.fulfillments.length > 0) {
        for (const fulfillment of order.fulfillments) {
          if (fulfillment.tracking_url && fulfillment.tracking_number) {
            fulfilledOrdersWithTracking.push({
              orderName: order.name, 
              trackingNumber: fulfillment.tracking_number,
              trackingUrl: fulfillment.tracking_url,
              carrier: fulfillment.tracking_company || 'Unknown Carrier',
              items: items // Add items here
            });
            foundTracking = true;
            processedOrderIds.add(order.id); 
          }
        }
      }

      // If the order is not fulfilled or partially fulfilled AND hasn't been added to tracking list
      if ((order.fulfillment_status === null || order.fulfillment_status === 'partial') && !processedOrderIds.has(order.id)) {
         pendingOrders.push({
             orderName: order.name,
             createdAt: order.created_at,
             items: items // Add items here
         });
      }
    }
    
    console.log(`Found ${fulfilledOrdersWithTracking.length} tracking links.`);
    console.log(`Found ${pendingOrders.length} pending orders.`);

    const hasFulfilled = fulfilledOrdersWithTracking.length > 0;
    const hasPending = pendingOrders.length > 0;

    let message = "Order information retrieved.";
    if (!hasFulfilled && !hasPending) {
        message = "No recent orders found for this email.";
    } else if (hasFulfilled && !hasPending) {
        message = "Found shipped orders.";
    } else if (!hasFulfilled && hasPending) {
        message = "Found pending orders awaiting shipment.";
    } else {
        message = "Found shipped and pending orders.";
    }

    // Always return 200 OK if the API call itself succeeded
    return NextResponse.json({ 
      fulfilledOrdersWithTracking,
      pendingOrders,
      message
    }, { status: 200 }); // Explicitly set status 200

  } catch (err) {
    // Genuine errors (network, auth, Shopify 5xx) still return 500
    console.error("Tracking route internal error (REST):", err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: "Server error fetching tracking info", details: errorMessage }, { status: 500 });
  }
}
import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  bookIndiaPostCodParcel,
  generateIndiaPostLabel,
  isIndiaPostDeliveryPincode,
  trackIndiaPostBarcode,
} from "./indiaPost.js";

const originalFetch = globalThis.fetch;
const originalEnvironment = { ...process.env };
const requests: Array<{ url: URL; init: RequestInit }> = [];
const barcode = "ET21433001XIN";
let bookingStatus = 200;
let rejectFirstPincodeRequest = true;

process.env["INDIA_POST_API_BASE_URL"] = "https://test.cept.gov.in/beextcustomer";
process.env["INDIA_POST_USERNAME"] = "test-user";
process.env["INDIA_POST_PASSWORD"] = "test-password";
process.env["INDIA_POST_CUSTOMER_ID"] = "1234567890";
process.env["INDIA_POST_CUSTOM_ID"] = "1234567890";
process.env["INDIA_POST_CONTRACT_ID"] = "12345678";
process.env["INDIA_POST_SOURCE_OFFICE_ID"] = "12345678";
process.env["INDIA_POST_SOURCE_PINCODE"] = "560001";
process.env["INDIA_POST_SENDER_NAME"] = "Test Sender";
process.env["INDIA_POST_SENDER_COMPANY"] = "Test Company";
process.env["INDIA_POST_SENDER_ADDRESS_LINE_1"] = "1 Test Street";
process.env["INDIA_POST_SENDER_CITY"] = "Bengaluru";
process.env["INDIA_POST_SENDER_STATE"] = "Karnataka";
process.env["INDIA_POST_SENDER_PHONE"] = "9876543210";

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(input.toString());
  requests.push({ url, init });
  if (url.pathname.endsWith("/v1/access/login")) {
    return Response.json({
      success: true,
      data: {
        access_token: "unit-test-token",
        refresh_token: "unit-test-refresh-token",
        id_token: "unit-test-id-token",
        expires_in: 900,
      },
    });
  }
  if (url.pathname.endsWith("/v1/access/TokenWithRtoken")) {
    assert.deepEqual(JSON.parse(String(init.body)), { refresh_token: "unit-test-refresh-token" });
    return Response.json({
      success: true,
      data: {
        access_token: "unit-test-refreshed-token",
        refresh_token: "unit-test-rotated-refresh-token",
        id_token: "unit-test-refreshed-id-token",
        expires_in: 900,
      },
    });
  }
  if (url.pathname.endsWith("/v1/pincode-search")) {
    if (rejectFirstPincodeRequest) {
      rejectFirstPincodeRequest = false;
      return Response.json({ success: false }, { status: 401 });
    }
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer unit-test-refreshed-token");
    const offices = url.searchParams.get("pincode") === "560001"
      ? [{ office_id: "12345678", office_name: "Test Office", delivery_office_flag: true, office_type_code: "HPO" }]
      : [{ delivery_office_flag: false, office_type_code: "BPO" }];
    return Response.json(offices);
  }
  if (url.pathname.endsWith("/process-articles/1234567890")) {
    if (bookingStatus !== 200) return Response.json({ success: false }, { status: bookingStatus });
    const body = JSON.parse(String(init.body)) as {
      articles: Array<{ barcode_no: string; value_for_codr_cod: number; codr_cod: string }>;
    };
    return Response.json({
      success: true,
      batch_id: "batch-test",
      valid_articles: [{ barcode_no: body.articles[0]?.barcode_no, calculated_tariff: 54.25 }],
    });
  }
  if (url.pathname.endsWith("/v1/tracking/bulk")) {
    return Response.json({
      success: true,
      data: [{
        booking_details: { article_number: barcode },
        tracking_details: [{ event: "Item Dispatched", date: "2026-11-05T10:00:00Z" }],
      }],
    });
  }
  if (url.pathname.endsWith("/v1/label/create/domestic")) {
    return new Response(new Uint8Array([37, 80, 68, 70]), {
      headers: { "Content-Type": "application/pdf" },
    });
  }
  return new Response("Unexpected test request", { status: 404 });
};

after(() => {
  globalThis.fetch = originalFetch;
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  Object.assign(process.env, originalEnvironment);
});

test("uses India Post auth for serviceability, COD booking, and tracking", async () => {
  assert.equal(await isIndiaPostDeliveryPincode("560001"), true);
  assert.equal(await isIndiaPostDeliveryPincode("000000"), false);
  await assert.rejects(() => isIndiaPostDeliveryPincode("1"), /6-digit/);

  const booking = await bookIndiaPostCodParcel({
    barcode,
    physicalWeight: 700,
    length: 20,
    breadth: 15,
    height: 10,
    shape: "NROL",
    orderNumber: "DHV-TEST-1",
    total: 725.5,
    recipientName: "Test Recipient",
    recipientPhone: "9876543210",
    recipientEmail: "recipient@example.test",
    addressLine1: "2 Test Road",
    addressLine2: null,
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  });
  assert.deepEqual(booking, { bookingReference: "batch-test", tariff: 54.25 });

  const bookingRequest = requests.find(({ url }) => url.pathname.endsWith("/process-articles/1234567890"));
  assert.ok(bookingRequest);
  const bookingBody = JSON.parse(String(bookingRequest.init.body)) as {
    articles: Array<{ barcode_no: string; value_for_codr_cod: number; codr_cod: string; article_type: string }>;
  };
  assert.deepEqual(bookingBody.articles[0], {
    bulk_customer_id: "1234567890",
    contract_id: "12345678",
    barcode_no: barcode,
    pickup_or_dropoff: "DROPOFF",
    pickup_dropoff_office_id: 12345678,
    article_type: "BUSINESS_PARCEL",
    physical_weight: 700,
    shape_of_article: "NROL",
    length: 20,
    breadth_diameter: 15,
    height: 10,
    sender_name: "Test Sender",
    sender_company: "Test Company",
    sender_add_line_1: "1 Test Street",
    sender_add_line_2: "",
    sender_add_line_3: "",
    sender_city: "Bengaluru",
    sender_state: "Karnataka",
    sender_pincode: "560001",
    sender_emailid: "",
    sender_mobile_no: "9876543210",
    receiver_name: "Test Recipient",
    receiver_company: "INDIVIDUAL",
    receiver_add_line_1: "2 Test Road",
    receiver_add_line_2: "",
    receiver_add_line_3: "",
    receiver_city: "Bengaluru",
    receiver_state: "Karnataka",
    receiver_pincode: "560001",
    receiver_emailid: "recipient@example.test",
    receiver_mobile_no: "9876543210",
    alt_address_flag: false,
    pickup_address_flag: false,
    drop_off_pincode: "560001",
    prepayment_code: "",
    value_of_prepayment: 0,
    codr_cod: "COD",
    value_for_codr_cod: 725.5,
    insurance_type: "",
    value_of_insurance: 0,
    ack: false,
    reg: false,
    otp: false,
    bulk_reference: "DHV-TEST-1",
  });
  assert.equal(new Headers(bookingRequest.init.headers).get("Authorization"), "Bearer unit-test-refreshed-token");
  assert.deepEqual(await trackIndiaPostBarcode(barcode), {
    booking_details: { article_number: barcode },
    tracking_details: [{ event: "Item Dispatched", date: "2026-11-05T10:00:00Z" }],
  });
  const label = await generateIndiaPostLabel({
    barcode,
    physicalWeight: 700,
    length: 20,
    breadth: 15,
    height: 10,
    shape: "NROL",
    orderNumber: "DHV-TEST-1",
    total: 725.5,
    postageAmount: 54.25,
    recipientName: "Test Recipient",
    recipientPhone: "9876543210",
    recipientEmail: "recipient@example.test",
    addressLine1: "2 Test Road",
    addressLine2: null,
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  });
  assert.deepEqual(label, Buffer.from([37, 80, 68, 70]));
  bookingStatus = 503;
  await assert.rejects(
    () => bookIndiaPostCodParcel({
      barcode,
      physicalWeight: 700,
      length: 20,
      breadth: 15,
      height: 10,
      shape: "NROL",
      orderNumber: "DHV-TEST-2",
      total: 725.5,
      recipientName: "Test Recipient",
      recipientPhone: "9876543210",
      recipientEmail: "recipient@example.test",
      addressLine1: "2 Test Road",
      addressLine2: null,
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    }),
    (error: unknown) =>
      error instanceof Error &&
      "outcomeUnknown" in error &&
      error.outcomeUnknown === true,
  );
  assert.equal(requests.filter(({ url }) => url.pathname.endsWith("/v1/access/login")).length, 1);
  assert.equal(requests.filter(({ url }) => url.pathname.endsWith("/v1/access/TokenWithRtoken")).length, 1);
});

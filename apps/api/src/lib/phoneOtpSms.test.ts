import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { sendVerificationSms } from "./phoneOtp.js";

const smsEnvironmentKeys = [
  "TEXTBEE_API_KEY",
  "TEXTBEE_BASE_URL",
  "TEXTBEE_DEVICE_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
] as const;

const originalEnvironment = new Map(
  smsEnvironmentKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  mock.restoreAll();
  for (const key of smsEnvironmentKeys) {
    const value = originalEnvironment.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function configureProviders(): void {
  process.env["TEXTBEE_API_KEY"] = "test-textbee-key";
  process.env["TEXTBEE_BASE_URL"] = "https://api.textbee.dev/api/v1";
  process.env["TEXTBEE_DEVICE_ID"] = "test-device";
  process.env["TWILIO_ACCOUNT_SID"] = "test-account-sid";
  process.env["TWILIO_AUTH_TOKEN"] = "test-auth-token";
  process.env["TWILIO_FROM_NUMBER"] = "+15555550100";
}

test("TextBee sends the OTP to the configured device and does not call Twilio", async () => {
  configureProviders();
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(null, { status: 200 });
    },
  );

  await sendVerificationSms("9876543210", "1234");

  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(requestUrl, "https://api.textbee.dev/api/v1/gateway/send-sms");
  assert.equal(new Headers(requestInit?.headers).get("x-api-key"), "test-textbee-key");
  assert.deepEqual(JSON.parse(String(requestInit?.body)), {
    message: "Your Dhanvantari verification code is 1234. It expires in 5 minutes.",
    recipients: ["+919876543210"],
    deviceId: "test-device",
  });
});

test("TextBee rejection falls back to Twilio", async () => {
  configureProviders();
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
      requests.push({ url: String(input), init });
      return new Response(null, { status: requests.length === 1 ? 429 : 201 });
    },
  );

  await sendVerificationSms("9876543210", "1234");

  assert.equal(requests.length, 2);
  assert.equal(requests[1]?.url, "https://api.twilio.com/2010-04-01/Accounts/test-account-sid/Messages.json");
  assert.equal(
    new Headers(requests[1]?.init?.headers).get("authorization"),
    `Basic ${Buffer.from("test-account-sid:test-auth-token").toString("base64")}`,
  );
  const twilioBody = new URLSearchParams(String(requests[1]?.init?.body));
  assert.equal(twilioBody.get("To"), "+919876543210");
  assert.match(twilioBody.get("Body") ?? "", /1234/);
});

test("TextBee server errors do not fall back to Twilio", async () => {
  configureProviders();
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 500 }),
  );

  await assert.rejects(sendVerificationSms("9876543210", "1234"), {
    message: "Could not send the verification SMS. Please try again.",
  });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("ambiguous TextBee network failures do not fall back to Twilio", async () => {
  configureProviders();
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    throw new TypeError("fetch failed");
  });

  await assert.rejects(sendVerificationSms("9876543210", "1234"), {
    message: "Could not send the verification SMS. Please try again.",
  });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("missing TextBee configuration falls back to Twilio", async () => {
  process.env["TEXTBEE_API_KEY"] = "";
  process.env["TWILIO_ACCOUNT_SID"] = "test-account-sid";
  process.env["TWILIO_AUTH_TOKEN"] = "test-auth-token";
  process.env["TWILIO_FROM_NUMBER"] = "+15555550100";
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 201 }),
  );

  await sendVerificationSms("9876543210", "1234");

  assert.equal(fetchMock.mock.callCount(), 1);
  assert.match(
    String(fetchMock.mock.calls[0]?.arguments[0]),
    /^https:\/\/api\.twilio\.com\//,
  );
});

import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { addressSchema, createOrderSchema, passwordResetOtpSchema, registerSchema } from "@dhanvantari/validation";
import { isOtpMatch } from "./phoneOtpCrypto.js";

process.env["OTP_HMAC_SECRET"] = "test-only-otp-secret";

test("phone registration requires a mobile number and allows no email", () => {
  const account = { name: "Test Buyer", phone: "9876543210", password: "StrongPass1" };
  assert.equal(registerSchema.safeParse(account).success, true);
  assert.equal(registerSchema.safeParse({ name: account.name, password: account.password }).success, false);
});

test("checkout orders require a delivery address and support COD only", () => {
  const order = {
    addressId: "00000000-0000-4000-8000-000000000001",
    paymentMethod: "COD",
  };
  assert.equal(createOrderSchema.safeParse(order).success, true);
  assert.equal(createOrderSchema.safeParse({ ...order, paymentMethod: "RAZORPAY" }).success, false);
});

test("delivery addresses require a valid phone number", () => {
  const address = {
    name: "Test Buyer",
    phone: "9876543210",
    line1: "123 Main Street",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  };
  assert.equal(addressSchema.safeParse(address).success, true);
  assert.equal(addressSchema.safeParse({ ...address, phone: "" }).success, false);
});

test("phone OTPs accept four digits and compare hashed values safely", () => {
  const code = "1234";
  const codeHash = crypto.createHmac("sha256", process.env["OTP_HMAC_SECRET"]!).update(code).digest("hex");
  assert.equal(isOtpMatch(code, codeHash), true);
  assert.equal(isOtpMatch("1235", codeHash), false);
  assert.equal(passwordResetOtpSchema.safeParse({ phone: "9876543210", code, password: "StrongPass1" }).success, true);
  assert.equal(passwordResetOtpSchema.safeParse({ phone: "9876543210", code: "123", password: "StrongPass1" }).success, false);
});

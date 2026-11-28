import assert from "node:assert/strict";
import test from "node:test";
import { getShippingCharge } from "./shipping.js";

test("applies a flat ₹50 charge to every non-empty cart", () => {
  assert.equal(getShippingCharge(1), 50);
  assert.equal(getShippingCharge(4), 50);
});

test("does not charge shipping for an empty cart", () => {
  assert.equal(getShippingCharge(0), 0);
});

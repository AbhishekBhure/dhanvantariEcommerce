# India Post COD integration

## What this integration does

- Hides the Razorpay option in storefront checkout; Razorpay backend code and routes remain enabled.
- Checks the selected delivery pincode with India Post CEPT before allowing COD checkout. A delivery office must be present, marked as a delivery office, and not be a BPO.
- Leaves COD payment pending when the order is placed.
- Lets an admin book a packed order as a Business Parcel COD article, using an India Post barcode allocated to the account.
- Stores the booking result, parcel measurements, tariff and barcode; provides India Post label generation and an admin-triggered tracking refresh.
- Advances shipment/order delivery status from the tracking API. Tracking or delivery alone never marks COD as paid.
- Lets an admin record the exact COD amount only after India Post tracking confirms delivery. The admin must separately verify the remittance.

The supplied CEPT document describes pincode delivery-office lookup, not a pincode-level COD capability check. Confirm with India Post that Business Parcel COD is enabled on the account/contract. India Post's acceptance of a COD booking is authoritative.

## Get API access from India Post

1. Sign in to the [India Post Developer Portal](https://app.indiapost.gov.in/developer-portal/apidoc). If the account does not yet have API access, use **Register Yourself** and follow the portal's registration process. The API documentation link may redirect to login.
2. Contact the integration support address in the account's CEPT onboarding document: `integrations.cept@indiapost.gov.in`. Ask for **REST API integration for Business Parcel COD**, not just portal or SFTP access.
3. Ask India Post to confirm/provide:
   - UAT credentials for the CEPT access-token API and the UAT API base URL.
   - Production credentials, production API base URL, activation/sign-off requirements, and the static outbound IP allowlist process.
   - The bulk customer ID, API booking custom ID, Business Parcel contract ID, and permitted COD amount/fee rules.
   - The barcode/ article-number series allocated to this account and the required allocation/generation rules. Never reuse a barcode.
   - The permitted drop-off office ID and pincode, sender profile required in booking payloads, and whether pickup is enabled for the contract.
   - Confirmation that the account/contract supports COD and whether API responses include a complete COD/tariff breakdown.
   - Confirmation of the label API response format and any booking, tracking, and COD remittance restrictions.
4. Configure the API server's fixed outbound IP and have India Post whitelist it before production activation. Do not expose the API from the browser.
5. Start with the UAT base URL and UAT credentials. Complete the scenarios below with barcode values specifically allocated for UAT. Get India Post sign-off before switching credentials or base URL to production.
6. Store credentials in the API deployment's secret manager or an untracked `apps/api/.env`. Never put credentials in the storefront, commit them, or paste them into support tickets/chat.

The integration document supplied with this project specifies these UAT paths under `https://test.cept.gov.in/beextcustomer`:

- `POST /v1/access/login`
- `GET /v1/pincode-search?pincode=...&office-type=post`
- `POST /process-articles/{customId}`
- `POST /v1/label/create/domestic`
- `POST /v1/tracking/bulk`

The access token is sent as a Bearer token. The document says access tokens last 15 minutes; the API client caches them briefly, renews on expiry/401, and never returns them to the browser. Confirm these details and the production host with India Post because the supplied document is an onboarding/UAT contract, not production credentials or a production endpoint.

## API environment configuration

The client uses the refresh token returned at login with `POST /v1/access/TokenWithRtoken` when the access token expires or India Post returns 401. It falls back to credential login if the refresh token is rejected with 401/403. The ID token is not used by current API calls.

Copy the `INDIA_POST_*` placeholders from [apps/api/.env.example](../apps/api/.env.example) into the API runtime's secret configuration. Set the sender values to the exact registered business address. Keep the UAT base URL until India Post has approved production access.

Required at checkout:

- `INDIA_POST_USERNAME`, `INDIA_POST_PASSWORD`
- `INDIA_POST_API_BASE_URL`

Required for booking and labels:

- `INDIA_POST_CUSTOMER_ID`, `INDIA_POST_CUSTOM_ID`, `INDIA_POST_CONTRACT_ID`
- `INDIA_POST_SOURCE_OFFICE_ID`, `INDIA_POST_SOURCE_PINCODE`
- `INDIA_POST_SENDER_NAME`, `INDIA_POST_SENDER_COMPANY`
- `INDIA_POST_SENDER_ADDRESS_LINE_1`, `INDIA_POST_SENDER_CITY`, `INDIA_POST_SENDER_STATE`, `INDIA_POST_SENDER_PHONE`
- Optional sender address line 2 and sender email

Do not copy example IDs or test barcode values into production. The application currently books **drop-off** consignments. The admin must enter a barcode from the account's allocated range and the final packed parcel's measured weight and dimensions.

After updating [apps/api/prisma/schema.prisma](../apps/api/prisma/schema.prisma), apply schema changes using this repository's current Prisma workflow (`pnpm --filter @dhanvantari/api db:push`) and generate the client (`pnpm --filter @dhanvantari/api db:generate`) before deploying the API and admin.

## Fulfilment workflow

1. Customer chooses an India Post-serviceable address and places a COD order. The API validates serviceability again and records the payment as pending.
2. Admin advances the order to **Processing**, packs it, then advances it to **Packed**.
3. Admin enters the India Post-allocated barcode and final package measurements, then books the parcel.
4. If the provider confirms the booking, admin can download the label. An ambiguous timeout is recorded as **UNKNOWN**; do not retry that barcode until India Post confirms whether the booking succeeded. Check the tracking API and reconcile with India Post.
5. Admin refreshes tracking from the order detail page. India Post tracking events update shipment/order status; they do not capture or settle payment.
6. When tracking confirms delivery, verify the COD remittance from India Post. Only then record the exact collected amount and optional reference in the admin order detail page.

The supplied document does not define a signed real-time webhook or a COD settlement API. Tracking refresh is therefore an explicit admin action, and COD payment settlement is a separately verified admin action. A tracking delivery event by itself is not proof of remittance.

## Test scenarios and expected results

### Storefront and serviceability

1. Checkout displays COD and does not display Razorpay. Razorpay code/routes remain in the repository as requested.
2. Select a saved address with a delivery office: the page shows India Post availability and enables Place COD order.
3. Select an address with no delivery office, a non-delivery office, or only BPO offices: COD is shown unavailable and checkout cannot submit.
4. Enter an invalid-length/nonnumeric pincode through the serviceability API: receive validation error; India Post is not called.
5. India Post authentication rejected, API timeout, non-JSON response, or 5xx: show a serviceability error; do not treat the pincode as serviceable or create an order.
6. Change the selected address while serviceability is pending: the earlier response must not overwrite the current address's result.
7. Force a client request past the disabled UI and submit COD for an unserviceable pin: the API rejects it before stock/order changes.
8. Submit COD with an India Post-serviceable address: totals are backend-calculated, order is confirmed, cart is cleared, and payment remains `PENDING`.
9. Verify the order confirmation email labels the amount as due on delivery rather than paid.

### API credentials and pincode lookup

10. Use valid UAT credentials: token login succeeds and subsequent calls use the Bearer token.
11. Make several API calls before token expiry: only one login is needed per API process.
12. Simulate an expired token/401: the client obtains a new token and retries once.
13. Invalid/missing credentials or missing required configuration: API reports an explicit configuration/auth error; no secret/token appears in responses or logs.
14. Check a pincode with a delivery office and a non-BPO office: serviceability is true.
15. Check offices with no delivery flag, BPO-only offices, or an empty result: serviceability is false.

### Booking and label

16. Non-COD order, order not yet Packed, invalid barcode, invalid weight/dimensions, or unconfigured account details: reject without provider booking.
17. Valid packed COD order with a unique allocated barcode: booking payload contains the right bulk customer ID, contract ID, sender/receiver addresses, parcel measurements, `COD`, and exact order total; accepted response stores the barcode/reference/tariff and `BOOKED` state.
18. Attempt a barcode already assigned to another order: reject before calling India Post.
19. Submit two booking attempts concurrently: only one is allowed to reach India Post.
20. Provider returns a definite validation/rejection error for the barcode: state becomes `FAILED`; admin may correct the data or retry with an unused allocated barcode.
21. Provider times out, returns 408/5xx, or a successful response cannot be parsed: state becomes `UNKNOWN`; automatic/repeated booking is blocked. Reconcile with India Post before retrying.
22. Provider returns a success batch but the barcode is absent from `valid_articles`: do not mark it booked.
23. Booked article label request returns a PDF: browser downloads it with the booked barcode in the filename.
24. Label API fails after booking: booking stays `BOOKED`; label can be requested again without creating another consignment.
25. Attempt generic shipment edits or cancellation after booking: prevent overwriting/cancelling the India Post shipment through the unrelated manual workflow.

### Tracking, delivery, and COD collection

26. Refresh a booked barcode: request uses the authenticated bulk tracking API and persists the latest event/time.
27. Transit/dispatch event: shipment status advances and order status moves to Shipped where applicable.
28. Out-for-delivery event: order advances to Out for Delivery.
29. Delivery confirmation: shipment and order become Delivered, but payment remains pending.
30. Hold/unknown event: retain the last meaningful status; do not label it delivered.
31. Return-to-sender event: shipment/order show the return state; payment remains pending.
32. Refresh the same event repeatedly: do not create duplicate order status history entries for unchanged order status.
33. Try to record COD collection before India Post confirms delivery, for a non-COD order, with the wrong amount, or as a non-admin: reject.
34. Record the exact amount after delivered status and independently verified remittance: payment becomes `SUCCESS`, collection time/admin/reference are recorded, and a payment receipt email is sent.
35. Repeat collection confirmation or submit two concurrently: only one succeeds.
36. Verify that delivery status alone, booking status alone, and tracking API responses never mark the COD payment successful.

### Regression and operations

37. Existing Razorpay backend order/verification/webhook routes remain unchanged; Razorpay option alone is hidden in checkout.
38. Failed serviceability/booking leaves stock/order state consistent; provider booking errors do not silently create a second order or consignment.
39. Customer order details show tracking number and shipment status but do not expose India Post credentials or internal booking payloads.
40. UAT barcode allocation is not reused; production uses its own allocated range and production endpoint/credentials only after India Post sign-off and IP allowlisting.

Automated client tests can be run with `pnpm --filter @dhanvantari/api test`. Database-backed route/UAT scenarios require a configured test database and CEPT UAT account.

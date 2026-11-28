# Phone verification and account setup

Customer registration requires a unique Indian mobile number and email address.
Registration and password recovery codes are sent to the email address through
Resend and are also attempted through TextBee, with Twilio retained as a
synchronous fallback. Email OTP verification activates the account and supports
email sign-in; it does not mark the phone number as verified. Phone sign-in
continues to require phone verification. At checkout, the delivery address
requires a valid phone number, but no additional OTP is required.

Configure these API environment variables before enabling registration:

- `OTP_HMAC_SECRET`: a long, random secret used to hash codes at rest.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `RESEND_FROM_NAME`: Resend credentials
  and a sender address on a verified domain. OTP emails fail explicitly if
  Resend is unavailable.
- `TEXTBEE_API_KEY`: a server-side TextBee API key. Keep the registered Android
  gateway phone online with SMS permission and an active SMS-capable SIM.
- `TEXTBEE_DEVICE_ID` (optional): send through a specific registered device.
- `TEXTBEE_BASE_URL` (optional): defaults to `https://api.textbee.dev/api/v1`.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`: Twilio
  credentials and an SMS-enabled sender authorized to message Indian numbers.
  Twilio is used if TextBee is not configured or returns a definitive rejection
  (`400`, `401`, or `429`). It is not used after a TextBee timeout or server
  error because TextBee may have accepted the message, which could otherwise
  result in duplicate OTPs.

Email is the required OTP channel; SMS is best-effort so an SMS failure does
not block account creation or email password recovery. Email and SMS use
separate codes so email verification cannot mark the phone as verified.
TextBee returning a successful response means the SMS was queued, not
necessarily delivered. Check TextBee's message history for delivery status.
Keep all provider credentials in the API deployment environment, never in the
storefront.

Codes contain four digits, expire after five minutes, allow five attempts, and
can be resent once per minute. Email addresses are required for new registrations;
the database email column remains nullable for legacy accounts.

Apply the Prisma schema changes to the intended database with
`pnpm --filter @dhanvantari/api db:push`. Existing accounts keep their email and
phone data; the database allows email and legacy phone values to be null, while
new registrations require a phone number. The unique phone constraint requires
existing non-null phone numbers to be unique before the schema update.

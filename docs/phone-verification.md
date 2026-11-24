# Phone verification and account setup

Customer registration uses a unique Indian mobile number as the primary sign-in
identifier. Email is optional. Registration and phone-based password recovery
codes are sent through Twilio. At checkout, the delivery address requires a
valid phone number, but no additional OTP is required.

Configure these API environment variables before enabling registration:

- `OTP_HMAC_SECRET`: a long, random secret used to hash codes at rest.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`: Twilio
  credentials and an SMS-enabled sender authorized to message Indian numbers.

Codes contain four digits, expire after five minutes, allow five attempts, and
can be resent once per minute. Codes are never returned by the API.

Apply the Prisma schema changes to the intended database with
`pnpm --filter @dhanvantari/api db:push`. Existing accounts keep their email and
phone data; the database allows email and legacy phone values to be null, while
new registrations require a phone number. The unique phone constraint requires
existing non-null phone numbers to be unique before the schema update.

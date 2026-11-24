import { AppError } from "../middleware/errorHandler.js";

const DEFAULT_BASE_URL = "https://test.cept.gov.in/beextcustomer";
const REQUEST_TIMEOUT_MS = 15000;
const TOKEN_EXPIRY_BUFFER_MS = 30000;

type IndiaPostTokenResponse = {
  success: boolean;
  data?: {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  };
};

type IndiaPostOffice = {
  office_id: string | number;
  office_name?: string;
  office_type_code: string;
  delivery_office_flag: boolean;
  is_rolled_out?: boolean;
};

type IndiaPostBookingResponse = {
  success: boolean;
  message?: string;
  batch_id?: string;
  mail_booking_dom_id?: string | number;
  correlation_id?: string;
  valid_articles?: Array<{
    barcode_no: string;
    calculated_tariff?: number;
  }>;
  error_articles?: Array<{
    barcode_no: string;
    errors?: string[];
  }>;
};

export type IndiaPostTrackingItem = {
  booking_details?: {
    article_number?: string;
    delivery_confirmed_on?: string | null;
  };
  tracking_details?: Array<{
    date?: string;
    event?: string;
    remarks?: string;
    rts?: boolean;
  }>;
  del_status?: {
    del_status?: string;
  };
};

type IndiaPostTrackingResponse = {
  success: boolean;
  data?: IndiaPostTrackingItem[];
};

type TokenCache = {
  value: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;
let tokenRequest: Promise<TokenCache> | null = null;

export class IndiaPostRequestError extends AppError {
  constructor(
    message: string,
    public readonly outcomeUnknown = false,
    public readonly providerStatus?: number,
  ) {
    super(message, 502, "INDIA_POST_ERROR");
  }
}

function baseUrl(): string {
  const configured = process.env["INDIA_POST_API_BASE_URL"]?.trim() || DEFAULT_BASE_URL;
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new AppError("India Post API base URL is invalid.", 503, "INDIA_POST_NOT_CONFIGURED");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new AppError("India Post API base URL must be a clean HTTPS URL.", 503, "INDIA_POST_NOT_CONFIGURED");
  }
  return url.toString().replace(/\/$/, "");
}

function requiredSetting(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AppError(`India Post is not configured: ${name} is required.`, 503, "INDIA_POST_NOT_CONFIGURED");
  }
  return value;
}

function credentials(): { username: string; password: string } {
  return {
    username: requiredSetting("INDIA_POST_USERNAME"),
    password: requiredSetting("INDIA_POST_PASSWORD"),
  };
}

function bookingSettings() {
  const settings = {
    customerId: requiredSetting("INDIA_POST_CUSTOMER_ID"),
    customId: requiredSetting("INDIA_POST_CUSTOM_ID"),
    contractId: requiredSetting("INDIA_POST_CONTRACT_ID"),
    sourceOfficeId: requiredSetting("INDIA_POST_SOURCE_OFFICE_ID"),
    sourcePincode: requiredSetting("INDIA_POST_SOURCE_PINCODE"),
    senderName: requiredSetting("INDIA_POST_SENDER_NAME"),
    senderCompany: requiredSetting("INDIA_POST_SENDER_COMPANY"),
    senderAddressLine1: requiredSetting("INDIA_POST_SENDER_ADDRESS_LINE_1"),
    senderAddressLine2: process.env["INDIA_POST_SENDER_ADDRESS_LINE_2"]?.trim() ?? "",
    senderCity: requiredSetting("INDIA_POST_SENDER_CITY"),
    senderState: requiredSetting("INDIA_POST_SENDER_STATE"),
    senderPhone: requiredSetting("INDIA_POST_SENDER_PHONE"),
    senderEmail: process.env["INDIA_POST_SENDER_EMAIL"]?.trim() ?? "",
  };
  if (!/^\d{10}$/.test(settings.customerId) || !/^\d{8}$/.test(settings.contractId) ||
      !/^\d{8}$/.test(settings.sourceOfficeId) || !/^\d{6}$/.test(settings.sourcePincode) ||
      !/^[6-9]\d{9}$/.test(settings.senderPhone)) {
    throw new AppError("India Post customer, contract, office, pincode, or sender phone configuration is invalid.", 503, "INDIA_POST_NOT_CONFIGURED");
  }
  return settings;
}

async function requestToken(
  path: string,
  body: Record<string, string>,
  errorLabel: string,
  refreshToken?: string,
): Promise<TokenCache> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new IndiaPostRequestError(`Could not connect to India Post ${errorLabel}.`);
  }

  if (!response.ok) {
    throw new IndiaPostRequestError(`India Post ${errorLabel} failed (${response.status}).`, false, response.status);
  }

  let result: IndiaPostTokenResponse;
  try {
    result = await response.json() as IndiaPostTokenResponse;
  } catch {
    throw new IndiaPostRequestError(`India Post ${errorLabel} returned an invalid response.`);
  }
  const accessToken = result.data?.access_token;
  if (!result.success || !accessToken) {
    throw new IndiaPostRequestError(`India Post ${errorLabel} was rejected.`);
  }

  const expiresIn = Math.max(60, result.data?.expires_in ?? 900);
  return {
    value: accessToken,
    refreshToken: result.data?.refresh_token ?? refreshToken,
    idToken: result.data?.id_token,
    expiresAt: Date.now() + expiresIn * 1000 - TOKEN_EXPIRY_BUFFER_MS,
  };
}

async function login(): Promise<TokenCache> {
  const { username, password } = credentials();
  return requestToken("/v1/access/login", { username, password }, "authentication");
}

async function refreshAccessToken(refreshToken: string): Promise<TokenCache> {
  try {
    return await requestToken(
      "/v1/access/TokenWithRtoken",
      { refresh_token: refreshToken },
      "token refresh",
      refreshToken,
    );
  } catch (error) {
    if (
      error instanceof IndiaPostRequestError &&
      (error.providerStatus === 401 || error.providerStatus === 403)
    ) {
      return login();
    }
    throw error;
  }
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.value;
  if (!tokenRequest) {
    const currentRefreshToken = tokenCache?.refreshToken;
    tokenRequest = (currentRefreshToken ? refreshAccessToken(currentRefreshToken) : login()).finally(() => {
      tokenRequest = null;
    });
  }
  tokenCache = await tokenRequest;
  return tokenCache.value;
}

async function authorizedRequest<T>(
  path: string,
  init: RequestInit,
  retryUnauthorized = true,
): Promise<T> {
  const token = await getAccessToken();
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${token}`);
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new IndiaPostRequestError("Could not connect to India Post.", true);
  }

  if (response.status === 401 && retryUnauthorized) {
    if (tokenCache?.value === token) tokenCache.expiresAt = 0;
    return authorizedRequest<T>(path, init, false);
  }
  if (!response.ok) {
    throw new IndiaPostRequestError(
      `India Post request failed (${response.status}).`,
      response.status >= 500 || response.status === 408,
      response.status,
    );
  }
  try {
    return await response.json() as T;
  } catch {
    throw new IndiaPostRequestError("India Post returned an invalid response.", true);
  }
}

export async function isIndiaPostDeliveryPincode(pincode: string): Promise<boolean> {
  if (!/^\d{6}$/.test(pincode)) {
    throw new AppError("Enter a valid 6-digit delivery pincode.", 400, "INVALID_PINCODE");
  }
  const offices = await searchOffices(pincode);
  return offices.some((office) =>
    office.delivery_office_flag === true && office.office_type_code !== "BPO",
  );
}

async function searchOffices(pincode: string): Promise<IndiaPostOffice[]> {
  const query = new URLSearchParams({ pincode, "office-type": "post" });
  const offices = await authorizedRequest<IndiaPostOffice[]>(
    `/v1/pincode-search?${query.toString()}`,
    { method: "GET" },
  );
  if (!Array.isArray(offices)) {
    throw new IndiaPostRequestError("India Post returned an invalid pincode response.");
  }
  return offices;
}

function addressLines(value: string): [string, string, string] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > 240) {
    throw new AppError("The delivery address must contain 1 to 240 characters for India Post.", 400, "INVALID_ADDRESS");
  }
  const lines: string[] = [];
  let current = "";
  for (const word of normalized.split(" ")) {
    if (word.length > 80) {
      throw new AppError("Each address word must fit within India Post's 80-character line limit.", 400, "INVALID_ADDRESS");
    }
    if (current && `${current} ${word}`.length > 80) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return [lines[0] ?? "", lines[1] ?? "", lines[2] ?? ""];
}

function tenDigitMobile(value: string, field: string): string {
  const mobile = value.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw new AppError(`${field} must be a valid Indian mobile number.`, 400, "INVALID_PHONE");
  }
  return mobile;
}

export type CodParcelBookingInput = {
  barcode: string;
  physicalWeight: number;
  length: number;
  breadth: number;
  height: number;
  shape: "NROL" | "ROLL";
  orderNumber: string;
  total: number;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
};

export async function bookIndiaPostCodParcel(input: CodParcelBookingInput): Promise<{
  bookingReference: string | null;
  tariff: number | null;
}> {
  const settings = bookingSettings();
  const [address1, address2, address3] = addressLines(
    [input.addressLine1, input.addressLine2].filter(Boolean).join(", "),
  );
  const [senderAddress1, senderAddress2, senderAddress3] = addressLines(
    [settings.senderAddressLine1, settings.senderAddressLine2].filter(Boolean).join(", "),
  );
  const payload = {
    articles: [{
      bulk_customer_id: settings.customerId,
      contract_id: settings.contractId,
      barcode_no: input.barcode,
      pickup_or_dropoff: "DROPOFF",
      pickup_dropoff_office_id: Number(settings.sourceOfficeId),
      article_type: "BUSINESS_PARCEL",
      physical_weight: input.physicalWeight,
      shape_of_article: input.shape,
      length: input.length,
      breadth_diameter: input.breadth,
      height: input.height,
      sender_name: settings.senderName,
      sender_company: settings.senderCompany,
      sender_add_line_1: senderAddress1,
      sender_add_line_2: senderAddress2,
      sender_add_line_3: senderAddress3,
      sender_city: settings.senderCity,
      sender_state: settings.senderState,
      sender_pincode: settings.sourcePincode,
      sender_emailid: settings.senderEmail,
      sender_mobile_no: settings.senderPhone,
      receiver_name: input.recipientName,
      receiver_company: "INDIVIDUAL",
      receiver_add_line_1: address1,
      receiver_add_line_2: address2,
      receiver_add_line_3: address3,
      receiver_city: input.city,
      receiver_state: input.state,
      receiver_pincode: input.pincode,
      receiver_emailid: input.recipientEmail,
      receiver_mobile_no: tenDigitMobile(input.recipientPhone, "Recipient phone"),
      alt_address_flag: false,
      pickup_address_flag: false,
      drop_off_pincode: settings.sourcePincode,
      prepayment_code: "",
      value_of_prepayment: 0,
      codr_cod: "COD",
      value_for_codr_cod: Number(input.total.toFixed(2)),
      insurance_type: "",
      value_of_insurance: 0,
      ack: false,
      reg: false,
      otp: false,
      bulk_reference: input.orderNumber,
    }],
  };

  let response: IndiaPostBookingResponse;
  try {
    response = await authorizedRequest<IndiaPostBookingResponse>(
      `/process-articles/${encodeURIComponent(settings.customId)}`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  } catch (error) {
    if (error instanceof IndiaPostRequestError && error.providerStatus !== undefined &&
        error.providerStatus >= 400 && error.providerStatus < 500 && !error.outcomeUnknown) {
      throw error;
    }
    if (error instanceof IndiaPostRequestError && !error.outcomeUnknown) {
      throw error;
    }
    throw new IndiaPostRequestError("India Post booking outcome is unknown. Reconcile this barcode with India Post before retrying.", true);
  }

  const acceptedArticle = response.valid_articles?.find((article) => article.barcode_no === input.barcode);
  const articleErrors = response.error_articles?.find((article) => article.barcode_no === input.barcode)?.errors;
  if (!response.success || !acceptedArticle) {
    throw new IndiaPostRequestError(
      articleErrors?.length ? `India Post rejected the article: ${articleErrors.join("; ")}` : response.message || "India Post did not confirm the parcel booking.",
    );
  }

  return {
    bookingReference: response.mail_booking_dom_id?.toString() ?? response.batch_id ?? response.correlation_id ?? null,
    tariff: typeof acceptedArticle.calculated_tariff === "number" ? acceptedArticle.calculated_tariff : null,
  };
}

export async function trackIndiaPostBarcode(barcode: string): Promise<IndiaPostTrackingItem | null> {
  const response = await authorizedRequest<IndiaPostTrackingResponse>(
    "/v1/tracking/bulk",
    { method: "POST", body: JSON.stringify({ bulk: [barcode] }) },
  );
  if (!response.success || !Array.isArray(response.data)) {
    throw new IndiaPostRequestError("India Post could not retrieve tracking information.");
  }
  return response.data.find((item) => item.booking_details?.article_number === barcode) ?? null;
}

async function authorizedBinaryRequest(path: string, body: unknown): Promise<Buffer> {
  const token = await getAccessToken();
  let response: Response;
  try {
    const headers = new Headers();
    headers.set("Accept", "application/pdf, application/octet-stream");
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", `Bearer ${token}`);
    response = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new IndiaPostRequestError("Could not connect to India Post label service.");
  }
  if (!response.ok) {
    throw new IndiaPostRequestError(`India Post label request failed (${response.status}).`, response.status >= 500, response.status);
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/pdf") && !contentType.includes("application/octet-stream")) {
    throw new IndiaPostRequestError("India Post did not return a PDF label.");
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new IndiaPostRequestError("India Post returned an empty label.");
  return bytes;
}

export async function generateIndiaPostLabel(
  input: CodParcelBookingInput & { postageAmount: number },
): Promise<Buffer> {
  const settings = bookingSettings();
  const [senderOffices, receiverOffices] = await Promise.all([
    searchOffices(settings.sourcePincode),
    searchOffices(input.pincode),
  ]);
  const bookingOffice = senderOffices.find(
    (office) => String(office.office_id) === settings.sourceOfficeId,
  );
  const deliveryOffice = receiverOffices.find(
    (office) => office.delivery_office_flag === true && office.office_type_code !== "BPO",
  );
  if (!bookingOffice?.office_name || !deliveryOffice?.office_name) {
    throw new AppError("India Post could not resolve the booking and delivery offices for this label.", 400, "INDIA_POST_OFFICE_NOT_FOUND");
  }
  const [recipientLine1, recipientLine2, recipientLine3] = addressLines(
    [input.addressLine1, input.addressLine2].filter(Boolean).join(", "),
  );
  const [senderLine1, senderLine2, senderLine3] = addressLines(
    [settings.senderAddressLine1, settings.senderAddressLine2].filter(Boolean).join(", "),
  );
  const payload = [{
    customer_id: Number(settings.customerId),
    delivery_office_name: deliveryOffice.office_name,
    destination_pin: input.pincode,
    channel_type: "E",
    user_type: "R",
    user_id: Number(settings.customerId),
    barcode_no: input.barcode,
    service_type: "BP",
    booking_type: "COMMERCIAL",
    article_length: String(input.length),
    article_breadth: String(input.breadth),
    article_height: String(input.height),
    charged_weight: input.physicalWeight,
    physical_weight: input.physicalWeight,
    insurance_flag: false,
    insurance_value: 0,
    recipient_name: input.recipientName,
    recipient_mobile: tenDigitMobile(input.recipientPhone, "Recipient phone"),
    recipient_addressl1: recipientLine1,
    recipient_addressl2: recipientLine2,
    recipient_addressl3: recipientLine3,
    recipient_city: input.city,
    recipient_pin: input.pincode,
    recipient_state: input.state,
    sender_name: settings.senderName,
    sender_mobile: settings.senderPhone,
    sender_addressl1: senderLine1,
    sender_addressl2: senderLine2,
    sender_addressl3: senderLine3,
    sender_city: settings.senderCity,
    sender_pin: settings.sourcePincode,
    sender_state: settings.senderState,
    transmission_mode: "S",
    payment_mode: "CO",
    booking_office_name: bookingOffice.office_name,
    booking_office_pin: settings.sourcePincode,
    size: "A6",
    total_amount: input.postageAmount,
    payment_status: "PC",
    value_added_services: "ND",
    identifier: "Domestic",
    bkg_ref_id: input.orderNumber,
    priority: false,
    registered_flag: false,
  }];
  return authorizedBinaryRequest("/v1/label/create/domestic", payload);
}

/**
 * ═══════════════════════════════════════════════════════════════
 * DHANVANTARI — Email Service (Resend)
 * All transactional email templates and send helpers
 * ═══════════════════════════════════════════════════════════════
 */

import { Resend } from "resend";
import logger from "./logger.js";

const resend = new Resend(process.env["RESEND_API_KEY"]);

const FROM_EMAIL = process.env["RESEND_FROM_EMAIL"] ?? "noreply@dhanvantari.in";
const FROM_NAME = process.env["RESEND_FROM_NAME"] ?? "Dhanvantari Ayurvedic Agencies";
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

const STOREFRONT_URL =
  process.env["STOREFRONT_URL"]
    ?.split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .find((url) => url.startsWith("https://")) ??
  process.env["STOREFRONT_URL"]?.split(",")[0]?.trim() ??
  "http://localhost:3000";

// ─── Shared Styles ────────────────────────────────────────────

const BRAND_GREEN = "#2d5a27";
const BRAND_GOLD = "#c9a227";

function baseTemplate(content: string, previewText = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dhanvantari Ayurvedic Agencies</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ""}
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f0;">
    <tr>
      <td align="center" style="padding:40px 12px;">
        <!-- Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_GREEN} 0%,#1a3a15 100%);padding:32px 40px 28px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:4px;">
                <span style="font-size:28px;">🌿</span>
                <span style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#ffffff;letter-spacing:-0.5px;">Dhanvantari</span>
              </div>
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:1.5px;text-transform:uppercase;">Ayurvedic Agencies</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f6;border-top:1px solid #e8e8e4;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#888;">Dhanvantari Ayurvedic Agencies — Pure Ayurveda, Modern Living</p>
              <p style="margin:0;font-size:12px;color:#aaa;">
                <a href="${STOREFRONT_URL}/shop" style="color:${BRAND_GREEN};text-decoration:none;">Shop</a> &nbsp;·&nbsp;
                <a href="${STOREFRONT_URL}/contact" style="color:${BRAND_GREEN};text-decoration:none;">Contact</a> &nbsp;·&nbsp;
                <a href="${STOREFRONT_URL}/account/orders" style="color:${BRAND_GREEN};text-decoration:none;">My Orders</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#ccc;">You're receiving this email because you have an account with us.</p>
            </td>
          </tr>
        </table>
        <!-- Bottom note -->
        <p style="margin:20px 0 0;font-size:11px;color:#aaa;text-align:center;">© ${new Date().getFullYear()} Dhanvantari Ayurvedic Agencies. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#1a1a1a;line-height:1.3;">${text}</h1>`;
}

function subheading(text: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;color:#666;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e8e8e4;margin:24px 0;"/>`;
}

function button(text: string, href: string, color = BRAND_GREEN): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;padding:14px 32px;background:${color};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">${text}</a>
  </div>`;
}

function statusBadge(text: string, color: string, bg: string): string {
  return `<span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;color:${color};background:${bg};letter-spacing:0.3px;">${text}</span>`;
}

function orderItemRow(name: string, qty: number, price: number): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0ec;font-size:14px;color:#333;">${name}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0ec;font-size:14px;color:#777;text-align:center;">×${qty}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f0f0ec;font-size:14px;color:#333;text-align:right;">₹${(price * qty).toLocaleString("en-IN")}</td>
  </tr>`;
}

// ─── Email Send Helper ────────────────────────────────────────

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env["RESEND_API_KEY"]) {
    logger.warn("RESEND_API_KEY not set — skipping email send");
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      logger.error({ error, to: opts.to, subject: opts.subject }, "Resend email error");
    } else {
      logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
    }
  } catch (err) {
    logger.error({ err, to: opts.to }, "Failed to send email via Resend");
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. WELCOME EMAIL (sent after registration)
// ═══════════════════════════════════════════════════════════════

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = baseTemplate(
    `
    ${heading(`Welcome to Dhanvantari, ${name}! 🌿`)}
    ${subheading("Thank you for joining us. Your journey to authentic Ayurvedic wellness begins here.")}
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 16px;">
      At Dhanvantari Ayurvedic Agencies, we are committed to bringing you classical Ayurvedic formulations crafted with the purest herbs, exactly as described in the ancient Charaka and Sushruta Samhitas.
    </p>
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">
      Explore our curated collection of hair care, skin care, and wellness products — all made with zero synthetic additives.
    </p>
    ${button("Explore Our Products", `${STOREFRONT_URL}/shop`)}
    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;margin:0;">
      🚚 Free shipping on orders over ₹499 &nbsp;·&nbsp; 🔒 100% Secure Checkout
    </p>
  `,
    `Welcome to Dhanvantari, ${name}! Your Ayurvedic wellness journey begins.`
  );

  await sendEmail({
    to,
    subject: `Welcome to Dhanvantari Ayurvedic Agencies, ${name}! 🌿`,
    html,
  });
}

export async function sendEmailVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string,
): Promise<void> {
  const html = baseTemplate(
    `
      ${heading("Verify your email address")}
      ${subheading(`Hi ${name}, confirm this email to activate your Dhanvantari account.`)}
      ${button("Verify email", verificationUrl)}
      ${divider()}
      <p style="font-size:13px;color:#888;text-align:center;">This verification link expires in 24 hours. If you did not create this account, you can ignore this message.</p>
    `,
    "Verify your email to activate your Dhanvantari account.",
  );
  await sendEmail({ to, subject: "Verify your Dhanvantari email address", html });
}

// ═══════════════════════════════════════════════════════════════
// 2. ORDER CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════════

export interface OrderEmailData {
  orderNumber: string;
  orderId: string;
  customerName: string;
  items: { productName: string; quantity: number; price: number; variantName?: string | null }[];
  subtotal: number;
  couponDiscount: number;
  shippingCharge: number;
  total: number;
  paymentMethod: string;
  addressName: string;
  addressLine1: string;
  addressLine2?: string | null;
  addressCity: string;
  addressState: string;
  addressPincode: string;
}

export async function sendOrderConfirmationEmail(
  to: string,
  data: OrderEmailData
): Promise<void> {
  const itemRows = data.items
    .map((item) =>
      orderItemRow(`${item.productName}${item.variantName ? ` (${item.variantName})` : ""}`, item.quantity, item.price)
    )
    .join("");

  const paymentLabel =
    data.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment (Razorpay)";

  const html = baseTemplate(
    `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">✅</div>
      ${heading("Order Confirmed!")}
      ${subheading(`Hi ${data.customerName}, your order has been placed successfully.`)}
      ${statusBadge("ORDER CONFIRMED", "#fff", BRAND_GREEN)}
    </div>

    <!-- Order Number Box -->
    <div style="background:#f0f7ee;border:1px solid #c8e0c4;border-radius:10px;padding:16px 20px;margin:0 0 28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:0;font-size:22px;font-weight:bold;color:${BRAND_GREEN};font-family:monospace;">${data.orderNumber}</p>
    </div>

    <!-- Items Table -->
    <h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:0.8px;">Order Summary</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <thead>
        <tr>
          <th style="text-align:left;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e8e8e4;">Product</th>
          <th style="text-align:center;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e8e8e4;">Qty</th>
          <th style="text-align:right;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;padding-bottom:8px;border-bottom:2px solid #e8e8e4;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
      <tr>
        <td style="font-size:14px;color:#666;padding:4px 0;">Subtotal</td>
        <td style="font-size:14px;color:#333;text-align:right;padding:4px 0;">₹${data.subtotal.toLocaleString("en-IN")}</td>
      </tr>
      ${data.couponDiscount > 0 ? `<tr>
        <td style="font-size:14px;color:#27a05a;padding:4px 0;">Coupon Discount</td>
        <td style="font-size:14px;color:#27a05a;text-align:right;padding:4px 0;">−₹${data.couponDiscount.toLocaleString("en-IN")}</td>
      </tr>` : ""}
      <tr>
        <td style="font-size:14px;color:#666;padding:4px 0;">Shipping</td>
        <td style="font-size:14px;color:#333;text-align:right;padding:4px 0;">${data.shippingCharge === 0 ? '<span style="color:#27a05a;font-weight:600;">FREE</span>' : `₹${data.shippingCharge}`}</td>
      </tr>
      <tr>
        <td style="font-size:16px;font-weight:700;color:#1a1a1a;padding:12px 0 4px;border-top:2px solid #e8e8e4;">${data.paymentMethod === "COD" ? "Total Due on Delivery" : "Total Paid"}</td>
        <td style="font-size:16px;font-weight:700;color:${BRAND_GREEN};text-align:right;padding:12px 0 4px;border-top:2px solid #e8e8e4;">₹${data.total.toLocaleString("en-IN")}</td>
      </tr>
    </table>

    ${divider()}

    <!-- Shipping & Payment -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td width="50%" style="vertical-align:top;padding-right:16px;">
          <h3 style="margin:0 0 8px;font-size:13px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:0.8px;">Shipping To</h3>
          <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
            <strong>${data.addressName}</strong><br/>
            ${data.addressLine1}${data.addressLine2 ? `, ${data.addressLine2}` : ""}<br/>
            ${data.addressCity}, ${data.addressState} — ${data.addressPincode}
          </p>
        </td>
        <td width="50%" style="vertical-align:top;padding-left:16px;">
          <h3 style="margin:0 0 8px;font-size:13px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:0.8px;">Payment</h3>
          <p style="margin:0;font-size:14px;color:#555;">${paymentLabel}</p>
        </td>
      </tr>
    </table>

    ${button("Track Your Order", `${STOREFRONT_URL}/account/orders/${data.orderId}`)}

    <p style="margin:0;font-size:13px;color:#888;text-align:center;">
      We'll send you another email when your order is shipped. Questions? <a href="${STOREFRONT_URL}/contact" style="color:${BRAND_GREEN};">Contact us</a>
    </p>
  `,
    `Your order ${data.orderNumber} has been confirmed!`
  );

  await sendEmail({
    to,
    subject: `Order Confirmed — ${data.orderNumber} 🌿`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════
// 3. PAYMENT SUCCESS EMAIL
// ═══════════════════════════════════════════════════════════════

export async function sendPaymentSuccessEmail(
  to: string,
  opts: {
    customerName: string;
    orderNumber: string;
    orderId: string;
    amount: number;
    paymentId: string;
    paymentLabel?: string;
  }
): Promise<void> {
  const html = baseTemplate(
    `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">💳</div>
      ${heading("Payment Successful!")}
      ${subheading(`Hi ${opts.customerName}, your payment has been received and confirmed.`)}
    </div>

    <div style="background:#f0faf5;border:1px solid #b8dfc8;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Order Number</td>
          <td style="font-size:14px;font-weight:700;color:#1a1a1a;text-align:right;">${opts.orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Amount Paid</td>
          <td style="font-size:14px;font-weight:700;color:${BRAND_GREEN};text-align:right;">₹${opts.amount.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">${opts.paymentLabel ?? "Payment ID"}</td>
          <td style="font-size:12px;color:#999;text-align:right;font-family:monospace;">${opts.paymentId}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Status</td>
          <td style="text-align:right;">${statusBadge("PAID", "#fff", "#27a05a")}</td>
        </tr>
      </table>
    </div>

    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;text-align:center;">
      Your order is now confirmed and will be processed shortly. We'll notify you as soon as it ships! 🚚
    </p>

    ${button("View Order Details", `${STOREFRONT_URL}/account/orders/${opts.orderId}`)}
  `,
    `Payment of ₹${opts.amount} confirmed for order ${opts.orderNumber}.`
  );

  await sendEmail({
    to,
    subject: `Payment Confirmed — ₹${opts.amount.toLocaleString("en-IN")} for ${opts.orderNumber}`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. PAYMENT FAILURE EMAIL
// ═══════════════════════════════════════════════════════════════

export async function sendPaymentFailureEmail(
  to: string,
  opts: { customerName: string; orderNumber: string; orderId: string; amount: number }
): Promise<void> {
  const html = baseTemplate(
    `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
      ${heading("Payment Failed")}
      ${subheading(`Hi ${opts.customerName}, unfortunately your payment could not be processed.`)}
    </div>

    <div style="background:#fff8f6;border:1px solid #fdd8d0;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Order Number</td>
          <td style="font-size:14px;font-weight:700;color:#1a1a1a;text-align:right;">${opts.orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Amount</td>
          <td style="font-size:14px;font-weight:700;color:#333;text-align:right;">₹${opts.amount.toLocaleString("en-IN")}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Status</td>
          <td style="text-align:right;">${statusBadge("PAYMENT FAILED", "#fff", "#e53935")}</td>
        </tr>
      </table>
    </div>

    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 8px;">
      This can happen due to:
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#666;line-height:1.8;">
      <li>Incorrect card details</li>
      <li>Insufficient funds</li>
      <li>Bank declined the transaction</li>
      <li>Network timeout</li>
    </ul>
    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">
      Don't worry — no amount has been charged. You can try placing the order again.
    </p>

    ${button("Try Again", `${STOREFRONT_URL}/shop`, "#e53935")}
    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;margin:0;">
      Need help? <a href="${STOREFRONT_URL}/contact" style="color:${BRAND_GREEN};">Contact our support team</a> and we'll assist you right away.
    </p>
  `,
    `Payment failed for your order ${opts.orderNumber}.`
  );

  await sendEmail({
    to,
    subject: `Payment Failed — Order ${opts.orderNumber}`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════
// 5. SHIPPING UPDATE EMAIL
// ═══════════════════════════════════════════════════════════════

export async function sendShippingUpdateEmail(
  to: string,
  opts: {
    customerName: string;
    orderNumber: string;
    orderId: string;
    status: string;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    carrier?: string | null;
    estimatedDelivery?: Date | string | null;
  }
): Promise<void> {
  const statusMessages: Record<string, { emoji: string; title: string; body: string }> = {
    CONFIRMED: {
      emoji: "✅",
      title: "Order Confirmed",
      body: "Your order has been confirmed and is being prepared.",
    },
    PROCESSING: {
      emoji: "🏭",
      title: "Order is Being Processed",
      body: "Our team is currently preparing your Ayurvedic products with care.",
    },
    PACKED: {
      emoji: "📦",
      title: "Order Packed & Ready",
      body: "Your order has been carefully packed and is ready to ship.",
    },
    SHIPPED: {
      emoji: "🚚",
      title: "Order Shipped!",
      body: "Great news! Your order is on its way to you.",
    },
    OUT_FOR_DELIVERY: {
      emoji: "🛵",
      title: "Out for Delivery",
      body: "Your order is out for delivery today! Please be available to receive it.",
    },
    DELIVERED: {
      emoji: "🎉",
      title: "Order Delivered!",
      body: "Your order has been delivered successfully. We hope you love your Ayurvedic products!",
    },
    RETURN_REQUESTED: {
      emoji: "↩️",
      title: "Return Requested",
      body: "Your return request has been received. Our team will reach out to guide you through the process.",
    },
    RETURNED: {
      emoji: "📬",
      title: "Return Confirmed",
      body: "Your return has been received and is being processed.",
    },
    REFUNDED: {
      emoji: "💰",
      title: "Refund Processed",
      body: "Your refund has been initiated and will be credited to your original payment method within 5–7 business days.",
    },
    CANCELLED: {
      emoji: "❌",
      title: "Order Cancelled",
      body: "Your order has been cancelled. If payment was made online, a refund will be initiated within 5–7 business days.",
    },
  };

  const info = statusMessages[opts.status] ?? {
    emoji: "📋",
    title: `Order Status: ${opts.status}`,
    body: "Your order status has been updated.",
  };

  const estimatedDeliveryStr = opts.estimatedDelivery
    ? new Date(opts.estimatedDelivery).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const html = baseTemplate(
    `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">${info.emoji}</div>
      ${heading(info.title)}
      ${subheading(`Hi ${opts.customerName}, here's an update on your order.`)}
    </div>

    <div style="background:#f8f8f5;border-radius:10px;padding:20px 24px;margin:0 0 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Order Number</td>
          <td style="font-size:14px;font-weight:700;color:#1a1a1a;text-align:right;">${opts.orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#666;padding:4px 0;">Status</td>
          <td style="text-align:right;">${statusBadge(opts.status.replace(/_/g, " "), BRAND_GREEN, "#e8f4e8")}</td>
        </tr>
        ${opts.carrier ? `<tr><td style="font-size:13px;color:#666;padding:4px 0;">Carrier</td><td style="font-size:14px;color:#333;text-align:right;">${opts.carrier}</td></tr>` : ""}
        ${opts.trackingNumber ? `<tr><td style="font-size:13px;color:#666;padding:4px 0;">Tracking #</td><td style="font-size:14px;font-weight:600;color:#333;text-align:right;font-family:monospace;">${opts.trackingNumber}</td></tr>` : ""}
        ${estimatedDeliveryStr ? `<tr><td style="font-size:13px;color:#666;padding:4px 0;">Estimated Delivery</td><td style="font-size:14px;color:#333;text-align:right;">${estimatedDeliveryStr}</td></tr>` : ""}
      </table>
    </div>

    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">${info.body}</p>

    ${opts.trackingUrl ? button("Track Shipment", opts.trackingUrl) : button("View Order", `${STOREFRONT_URL}/account/orders/${opts.orderId}`)}

    ${divider()}
    <p style="font-size:13px;color:#888;text-align:center;margin:0;">
      Questions? <a href="${STOREFRONT_URL}/contact" style="color:${BRAND_GREEN};">Contact us</a> and we'll be happy to help.
    </p>
  `,
    `${info.emoji} ${info.title} — Order ${opts.orderNumber}`
  );

  await sendEmail({
    to,
    subject: `${info.emoji} ${info.title} — ${opts.orderNumber}`,
    html,
  });
}

// ═══════════════════════════════════════════════════════════════
// 6. PASSWORD RESET EMAIL
// ═══════════════════════════════════════════════════════════════

export async function sendPasswordResetEmail(
  to: string,
  opts: { name: string; resetUrl: string }
): Promise<void> {
  const html = baseTemplate(
    `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">🔐</div>
      ${heading("Reset Your Password")}
      ${subheading(`Hi ${opts.name}, we received a request to reset your Dhanvantari account password.`)}
    </div>

    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">
      Click the button below to set a new password. This link is valid for <strong>30 minutes</strong>.
    </p>

    ${button("Reset My Password", opts.resetUrl)}

    ${divider()}

    <p style="font-size:13px;color:#888;margin:0;">
      <strong>Didn't request a password reset?</strong> You can safely ignore this email — your account remains secure. No changes will be made.
    </p>
    <p style="font-size:12px;color:#bbb;margin:12px 0 0;">
      For security, this link expires in 30 minutes and can only be used once.
    </p>
  `,
    "Reset your Dhanvantari account password."
  );

  await sendEmail({
    to,
    subject: "Reset Your Dhanvantari Password 🔐",
    html,
  });
}

// ═══════════════════════════════════════════════════════════════
// 7. PASSWORD CHANGED CONFIRMATION EMAIL
// ═══════════════════════════════════════════════════════════════

export async function sendPasswordChangedEmail(to: string, name: string): Promise<void> {
  const html = baseTemplate(
    `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:12px;">🛡️</div>
      ${heading("Password Changed Successfully")}
      ${subheading(`Hi ${name}, your Dhanvantari account password has been updated.`)}
    </div>

    <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 24px;">
      Your password was changed on <strong>${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>.
    </p>

    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;font-size:14px;color:#7a5c00;">
        ⚠️ If you did <strong>not</strong> make this change, please <a href="${STOREFRONT_URL}/contact" style="color:${BRAND_GREEN};font-weight:600;">contact our support team</a> immediately.
      </p>
    </div>

    ${button("Go to My Account", `${STOREFRONT_URL}/account`)}
  `,
    "Your Dhanvantari password was successfully changed."
  );

  await sendEmail({
    to,
    subject: "Your Dhanvantari Password Was Changed 🛡️",
    html,
  });
}

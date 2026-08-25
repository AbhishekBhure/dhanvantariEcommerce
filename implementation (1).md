# DHANVANTARI Ayurvedic Agencies — End-to-End E-Commerce Implementation Plan

> **Document Type:** AI Agent Implementation Specification
> **Project:** Dhanvantari D2C E-Commerce Platform
> **Version:** 1.0
> **Status:** Implementation Blueprint
> **Primary Goal:** Build and document a production-ready e-commerce website for Dhanvantari Ayurvedic Agencies.

---

## 0. Agent Operating Rules

This document is the source of truth for implementation. Must follow these rules throughout the project.

### 0.1 Build in phases

- Do not attempt the entire application in one pass.
- Complete one phase, validate it, and only then proceed to the next phase.
- Keep the application runnable after every phase.
- Do not introduce future-phase functionality into V1 unless explicitly approved.
- Maintain a clear list of completed, pending, blocked, and deferred items.

### 0.2 Do not invent business data

- Never invent product names, ingredients, benefits, prices, stock quantities, certifications, medical claims, company information, policies, addresses, contact details, or legal text.
- Use placeholders or clearly marked seed/demo data until real client data is provided.
- Ayurvedic product claims must be supplied/approved by the client. Do not independently create therapeutic or medical claims.

### 0.3 Production-quality expectations

The implementation must prioritize:

- Responsive UX
- Accessibility
- Security
- Maintainability
- SEO
- Performance
- Error handling
- Data integrity
- Auditability
- Good empty/loading/error states
- Mobile-first design

### 0.4 No hard-coded business logic

Business rules such as prices, discounts, stock, shipping charges, order statuses, coupons, categories, and product visibility must be data-driven wherever practical.

### 0.5 Preserve scope boundaries

V1 is a D2C e-commerce website and its required administration capabilities. Mobile apps, loyalty, subscriptions, advanced marketplace synchronization, B2B/distributor portals, and manufacturing/ERP modules are future phases unless explicitly promoted into V1.

---

# 1. Project Context

## 1.1 Business

Dhanvantari Ayurvedic Agencies manufactures Ayurvedic products and currently operates through:

- An offline retail shop
- Amazon
- Existing brand identity and product photography


## 1.2 Product Objective

Create Dhanvantari's official online storefront where customers can:

1. Discover the brand.
2. Browse selected products.
3. Search/filter products.
4. View complete product information.
5. Add products to cart.
6. Checkout.
7. Pay online or use COD where supported.
8. Receive order updates.
9. View and track orders from their account.

The Dhanvantari team must be able to operate the store through an admin interface.

## 1.3 Experience Direction

The website should feel like a modern premium Indian wellness/beauty e-commerce brand. References such as Pilgrim may be used for quality, merchandising, navigation, and UX inspiration, but the implementation must be original and aligned with Dhanvantari branding.

---

# 2. V1 Scope

## 2.1 Customer Website

- Homepage
- Header/navigation
- Footer
- Shop/all products
- Categories
- Product listing
- Product detail
- Search
- Filtering
- Sorting
- Cart
- Checkout
- Customer authentication
- Customer account
- Address management
- Order history
- Order detail
- Order tracking/status
- About page
- Contact page
- Shipping policy
- Return/refund policy
- Privacy policy
- Terms & conditions

## 2.2 Commerce

- Product catalogue
- Product variants where applicable
- Pricing
- MRP/discount display
- Stock availability
- Cart calculation
- Coupon/discount support
- Shipping calculation
- Online payment
- COD where supported
- Order creation
- Payment status
- Order status

## 2.3 Admin

- Admin authentication
- Dashboard
- Product management
- Category management
- Inventory management
- Order management
- Customer management
- Coupon/offer management
- Homepage/banner/content management
- Basic reports/metrics
- Admin roles/permissions if multiple admin users are required


---

### Content collection

Collect:

- Logo(add dummy for now)
- Brand assets(add dummy for now)
- Brand colors/fonts if available (modern and clean)
- Product photographs(use dummy images for now)
- Product names(use dummy data for now)
- Product descriptions(use dummy data for now)
- Ingredients/composition(use dummy data for now)
- Usage instructions(use dummy data for now)
- Sizes/variants(use dummy data for now)
- MRP(use dummy data for now)
- Selling price(use dummy data for now)
- Stock(use dummy data for now)
- Category(use dummy data for now)
- SKU if available(use dummy data for now)
- Shipping policy(use dummy data for now)
- Return/refund policy(use dummy data for now)
- Privacy policy(use dummy data for now)
- Terms and conditions(use dummy data for now)
- Company/contact information(use dummy data for now)
- Social links(use dummy data for now)

## Deliverables

- Approved scope
- Sitemap
- User journeys
- Feature list
- Content checklist
- Initial product data template
- Development backlog
- Definition of Done

## Exit criteria

No major V1 business requirement remains ambiguous.

---

# 5. Phase 1 — UX, Information Architecture & Design System

## Goal

Design the complete customer and admin experience before implementation.

## Customer screens

Design at minimum:

1. Home
2. Shop
3. Category listing
4. Search results
5. Product detail
6. Cart
7. Login
8. Registration
9. Forgot/reset password if applicable
10. Address management
11. Checkout
12. Payment state
13. Order confirmation
14. My account
15. Orders
16. Order detail/tracking
17. About
18. Contact
19. Policies
20. 404
21. Generic error page

## Admin screens

Design at minimum:

1. Admin login
2. Dashboard
3. Products
4. Product create/edit
5. Categories
6. Inventory
7. Orders
8. Order detail
9. Customers
10. Coupons
11. Homepage/banner/content management
12. Admin users/roles if required
13. Settings

## Design requirements

- Mobile-first.
- Desktop responsive.
- Tablet responsive.
- Consistent typography.
- Consistent spacing.
- Consistent buttons/forms/cards.
- Clear hierarchy.
- Accessible contrast.
- Keyboard-friendly controls.
- Visible focus states.
- Proper loading skeletons.
- Empty states.
- Error states.
- Success feedback.
- Confirmation dialogs for destructive actions.

## E-commerce UX requirements

- Product price must be visually clear.
- Discount/MRP must not be misleading.
- Stock status must be understandable.
- Cart totals must be transparent.
- Checkout must minimize unnecessary steps.
- Errors must explain how to fix them.
- Mobile checkout must be easy to use.

## Exit criteria

All V1 screens and flows are approved before full implementation.

---

# 6. Phase 2 — Application Foundation

## Goal

Create a stable production-grade application foundation.

## Tasks

- Set up frontend application.
- Set up backend/API application if applicable.
- Set up database.
- Set up migrations/schema management.
- Set up object/file storage strategy.
- Set up authentication foundation.
- Set up centralized configuration.
- Set up API error handling.
- Set up request validation.
- Set up logging.
- Set up linting.
- Set up type checking.

## Non-functional foundation

Implement reusable:

- Button
- Input
- Select
- Modal
- Drawer
- Toast/notification
- Table
- Pagination
- Empty state
- Loading state
- Error state
- Confirmation dialog
- Product card
- Price display
- Badge/status component

## Exit criteria

Application starts cleanly, builds successfully, passes lint/type checks, and has a documented environment setup.

---

# 7. Phase 3 — Data Model & Business Rules

## Goal

Define the data structure before implementing commerce workflows.

## Core entities

At minimum evaluate:

- User
- Role
- Address
- Product
- ProductVariant
- Category
- ProductImage
- Inventory
- Cart
- CartItem
- Wishlist/WishlistItem
- Coupon
- CouponRedemption
- Order
- OrderItem
- Payment
- Shipment
- Review
- Banner
- ContentPage
- AuditLog where useful

## Product rules

- Product can be published/unpublished.
- Product can belong to one or more categories if required.
- Product can have variants.
- Product has pricing data.
- Product has inventory.
- Product has images.
- Product has approved content.
- Product may be marked featured/bestseller/new.
- Unpublished products must not appear in public catalogue/search.

## Inventory rules

- Stock must not become negative through normal ordering.
- Inventory must be adjusted safely when an order is confirmed according to the chosen stock strategy.
- Failed/cancelled orders must not incorrectly reduce permanent stock.
- Returned items must follow an explicit restocking rule.

## Order rules

Define and document statuses before coding. Example:

`PENDING_PAYMENT → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED`

Exception states may include:

`PAYMENT_FAILED`, `CANCELLED`, `RETURN_REQUESTED`, `RETURNED`, `REFUNDED`

Only valid state transitions should be allowed.

## Pricing rules

Define precedence for:

1. Base price
2. MRP
3. Product discount
4. Coupon discount
5. Shipping charge
6. Taxes, if applicable
7. Final payable amount

Do not rely on frontend calculations as the source of truth for final order totals.

## Exit criteria

Database schema and critical business rules are documented and reviewed before commerce implementation.

---

# 8. Phase 4 — Authentication & Customer Accounts

## Goal

Implement secure customer identity and account management.

## Features

- Registration
- Login
- Logout
- Password reset if password auth is used
- Session/token management
- Profile
- Address CRUD
- Default address
- Order history
- Order details

## Security requirements

- Passwords must never be stored in plaintext.
- Sensitive tokens must not be exposed unnecessarily.
- Validate all inputs server-side.
- Rate-limit authentication endpoints.
- Prevent account enumeration where practical.
- Use secure cookie/session configuration where applicable.
- Enforce authorization on every protected backend operation.

## Exit criteria

A customer can securely create an account, log in, manage addresses, and view their own orders only.

---

# 9. Phase 5 — Product Catalogue & Storefront

## Goal

Build the public shopping experience.

## Homepage

Implement:

- Header/navigation
- Hero section
- Featured products
- Best sellers
- Categories
- Promotional section
- Brand story
- Why Dhanvantari
- Testimonials if approved
- Social links/content
- Footer

## Catalogue

Implement:

- All products
- Category pages
- Search
- Filtering
- Sorting
- Pagination/infinite loading as appropriate
- Product availability
- Published/unpublished handling

## Product page

Implement:

- Image gallery
- Product information
- Ingredients/composition
- Usage
- Size/variant selection
- Price/MRP/discount
- Stock
- Quantity
- Add to cart
- Related products
- Reviews if V1

## SEO

Every indexable product/category page must support unique:

- Title
- Meta description
- Canonical URL
- Open Graph metadata
- Structured data where appropriate

## Exit criteria

A customer can discover and understand any published product without admin intervention.

---

# 10. Phase 6 — Cart & Pricing Engine

## Goal

Implement reliable cart and pricing calculations.

## Features

- Add to cart
- Remove from cart
- Update quantity
- Persist cart appropriately
- Guest cart if required
- Logged-in cart
- Merge guest cart after login if supported
- Coupon application
- Coupon removal
- Shipping estimate
- Final totals

## Validation

Every cart action must validate:

- Product exists
- Product is published
- Product is purchasable
- Variant exists
- Quantity is valid
- Stock is sufficient
- Current price is used
- Coupon is valid

## Important

The backend must recalculate totals during checkout. Never trust totals sent by the browser.

## Exit criteria

Cart totals remain correct across refreshes, login, logout, quantity changes, coupon changes, and stock changes.

---

# 11. Phase 7 — Checkout, Payment & Order Creation

## Goal

Create a reliable and recoverable checkout process.

## Checkout

- Customer/address selection
- Shipping option
- Coupon
- Order summary
- Payment method
- Final amount
- Terms/consent where required
- Place order

## Payment

Integrate the selected payment gateway is Razor Pay dummy for now.

Handle:

- Payment success
- Payment failure
- Payment cancellation
- Duplicate callbacks
- Webhook verification
- Delayed payment confirmation
- Refund status where applicable

## Order creation

Do not create duplicate orders due to retries/webhooks.

Use idempotency mechanisms where applicable.

Order record must preserve:

- Customer
- Address snapshot
- Items
- Product/variant snapshot
- Price snapshot
- Discounts
- Shipping charge
- Tax amount if applicable
- Final amount
- Payment status
- Order status
- Timestamp

## COD

If COD is supported:

- Validate serviceability.
- Apply any COD rules.
- Record payment method as COD.
- Ensure COD order cannot be incorrectly marked as paid.

## Exit criteria

Successful and failed payment scenarios have been tested, including retries and duplicate callback protection.

---

# 12. Phase 8 — Order Management & Fulfilment

## Goal

Give the customer and admin a complete order lifecycle.

## Customer

- Order confirmation
- Order history
- Order detail
- Status timeline
- Shipment/tracking information
- Cancellation where allowed
- Return/refund request where supported by final policy

## Admin

- Order list
- Search/filter
- Order detail
- Payment status
- Fulfilment status
- Update status
- Shipment information
- Customer information
- Item information
- Cancellation/refund handling

## Status controls

Prevent invalid transitions.

Example:

`CONFIRMED → PROCESSING → PACKED → SHIPPED → DELIVERED`

Do not allow arbitrary status changes without appropriate permissions.

## Exit criteria

A complete order can be followed from creation through delivery, cancellation, return, or refund where applicable.

---

# 13. Phase 9 — Shipping & Logistics Integration

## Goal

Enable practical fulfilment of online orders.

## Tasks

- Select shipping provider based on business requirements.
- Configure credentials securely.
- Configure serviceability.
- Configure shipping charges.
- Create shipment where supported.
- Generate tracking/AWB where supported.
- Store shipment information.
- Fetch/update tracking status.
- Display tracking to customer.

## Failure handling

- Shipping API unavailable
- Shipment creation failure
- Invalid address
- Service unavailable for pincode
- Tracking unavailable
- Duplicate shipment creation

## Exit criteria

At least one complete test order can move through shipping/tracking successfully in the appropriate test environment.

---

# 14. Phase 10 — Admin Platform

## Goal

Enable Dhanvantari staff to operate the store independently for routine activities.

## Admin authentication

- Secure login
- Session management
- Logout
- Role/permission controls if multiple users are required

## Dashboard

Display useful, non-misleading metrics such as:

- Orders today
- Orders pending
- Revenue summary
- Top products
- Low stock
- Recent orders

## Product management

- Create
- Edit
- Publish/unpublish
- Delete/archive according to data rules
- Images
- Pricing
- Variants
- Inventory
- Categories
- Featured/bestseller flags

## Category management

- Create/edit
- Publish/unpublish
- Ordering/sorting
- SEO metadata

## Inventory

- Current stock
- Stock adjustments
- Low-stock indicator
- Inventory history where useful
- Reason for manual adjustments

## Order management

- Search
- Filter
- View
- Status updates
- Shipment information
- Payment information
- Customer information

## Customer management

- Search
- View profile
- View orders
- Basic customer status information

## Coupon management

- Code
- Type
- Amount/percentage
- Minimum order
- Maximum discount
- Validity
- Usage limit
- Product/category restrictions
- Active/inactive

## Content management

- Homepage banners
- Featured products
- Promotional sections
- Static pages

## Exit criteria

A non-technical authorized Dhanvantari user can perform normal store operations without developer involvement.

---

# 15. Phase 11 — Notifications & Communication

## Goal

Keep customers informed at important transaction stages.

## Transactional events

At minimum design for:

- Registration/account event where applicable
- Order placed
- Payment success
- Payment failure
- Order confirmed
- Order processing
- Order shipped
- Tracking available
- Out for delivery where supported
- Delivered
- Cancelled
- Refund initiated/completed where applicable


## Requirements

- Templates must be configurable where practical.
- Do not expose sensitive information unnecessarily.
- Failed notification delivery must not break order processing.
- Notification retries must not create duplicate customer-visible messages where avoidable.

---

# 16. Phase 12 — Reviews, Wishlist & Engagement

This phase is optional for V1 and should be promoted only after scope confirmation.

## Reviews

- Customer can review eligible purchased products.
- Rating validation.
- Review moderation.
- Admin approval/removal.
- Prevent obvious spam/duplicate abuse.

## Wishlist

- Add/remove product.
- Persist for authenticated customers.
- Move to cart.
- Handle unpublished/out-of-stock products gracefully.

If excluded from V1, keep the architecture extensible but do not build the feature.

---

# 17. Phase 13 — SEO, Analytics & Digital Growth Foundation

## SEO

Implement:

- Semantic HTML
- Correct headings
- Metadata
- Canonicals
- Sitemap
- Robots.txt
- Structured data where valid
- Clean URLs
- Product/category indexing rules
- 404 handling
- Redirect strategy when URLs change

## Performance

- Optimized images
- Lazy loading where appropriate
- Minimized client-side JavaScript
- Caching where appropriate
- Fast initial page load
- Avoid unnecessary API requests

## Analytics

Configure an agreed analytics solution.

Track important events such as:

- Product view
- Search
- Add to cart
- Begin checkout
- Coupon applied
- Payment attempt
- Purchase
- Sign up

Do not collect unnecessary sensitive personal data in analytics.

## Search Console

- Verify domain.
- Submit sitemap.
- Monitor indexing.

---

# 18. Phase 14 — Security & Privacy Hardening

## Application security

- Validate all input.
- Sanitize where necessary.
- Protect authentication endpoints.
- Implement authorization checks.
- Protect admin routes.
- Secure file uploads.
- Validate uploaded file type and size.
- Prevent unrestricted file execution.
- Use HTTPS in production.
- Keep secrets out of source control.
- Use environment variables/secrets management.
- Apply rate limiting to sensitive endpoints.
- Protect against common injection attacks.
- Protect against CSRF where applicable to the chosen authentication architecture.
- Configure secure cookies where used.
- Configure CORS deliberately.

## Payment security

- Never store raw card details (need dummy for now for testing).
- Use the payment provider's secure flow.
- Verify webhook signatures.
- Do not trust client-side payment status.

## Admin security

- Strong authentication.
- Role-based authorization if multiple admin roles exist.
- Audit sensitive actions where useful.
- Confirm destructive operations.

## Privacy

- Publish required privacy/terms documents supplied or approved by the client.
- Minimize personal data collection.
- Provide appropriate account/data handling mechanisms.

---



## Accessibility

Check:

- Keyboard navigation
- Focus states
- Form labels
- Alt text
- Color contrast
- Error messages
- Semantic structure

---


# 25. Recommended Repository/Project Organization

The exact technology may be selected separately, but the project should remain modular.

Conceptually:

```text
project/
├── apps/
│   ├── storefront/
│   ├── admin/
│   └── api/
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── ui/
│   └── config/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── business-rules/
│   ├── deployment/
│   └── uat/
├── scripts/
└── README.md
```

If a monorepo is not appropriate, keep equivalent logical separation within the chosen repository structure.


---

# 27. Data Seeding & Demo Data

Before real client data is available:

- Create clearly marked demo products.
- Use placeholder images only where necessary.
- Mark seed/demo records so they can be removed safely.

---

# 28. Error & Edge-Case Requirements

The agent must explicitly handle:

- Product deleted after being added to cart
- Product unpublished after being added to cart
- Price changed after cart creation
- Stock reduced after cart creation
- Out-of-stock checkout
- Invalid coupon
- Expired coupon
- Coupon usage limit reached
- Payment failed
- Payment succeeded but browser disconnected
- Duplicate payment callback
- Duplicate order submission
- Shipping API failure
- Invalid pincode
- Customer session expiry
- Unauthorized admin action
- Image upload failure
- Network interruption
- Empty search results
- Empty category
- Broken product image
- Missing optional product data
- Server error
- Maintenance mode if required

Every error must provide a user-friendly message and a safe recovery path where possible.

---

# 29. Performance Requirements

The implementation should aim for:

- Fast initial page rendering.
- Optimized images.
- Minimal unnecessary JavaScript.
- Efficient API queries.
- Pagination for large admin lists.
- Server-side validation.
- Appropriate caching.
- No obvious N+1 query patterns.
- No unnecessary repeated network calls.
- Responsive UI without layout-breaking shifts.

Measure performance rather than assuming it is good.

---

# 30. Accessibility Requirements

Target a strong baseline aligned with WCAG principles.

Required:

- Semantic HTML.
- Keyboard navigation.
- Visible focus.
- Form labels.
- Accessible validation messages.
- Alternative text for meaningful images.
- Decorative images correctly marked.
- Sufficient contrast.
- Accessible buttons/links.
- Dialog focus handling.
- Mobile touch targets of appropriate size.

---

# 31. Documentation Requirements

The agent must maintain:

### README

- Project overview
- Setup
- Environment variables
- Development commands
- Build commands
- Test commands

### Architecture documentation

- System overview
- Main modules
- Data flow
- Authentication flow
- Checkout flow
- Payment flow
- Order lifecycle
- Shipping flow

### Business rules

Document:

- Pricing
- Discounts
- Coupons
- Stock
- Order statuses
- Cancellation
- Returns/refunds
- Shipping



Never put secrets in documentation.

---

# 32. Definition of Done

A feature is not complete merely because the UI exists.

A feature is Done only when:

- UI is implemented.
- Responsive behavior is implemented.
- Loading state exists.
- Empty state exists where applicable.
- Error handling exists.
- Backend validation exists where applicable.
- Authorization exists where applicable.
- Database changes are migrated.
- Tests cover important behavior.
- Accessibility has been considered.
- Analytics events are added where relevant.
- SEO is handled where relevant.
- Documentation is updated where relevant.
- Code passes lint/type/build checks.
- Feature has been tested in staging.

---

# 33. Release Gates

## Gate 1 — Discovery complete

No major requirement ambiguity.

## Gate 2 — Design complete

V1 screens and flows approved.

## Gate 3 — Foundation complete

Application builds and runs reliably.

## Gate 4 — Commerce complete

Catalogue, cart, checkout, payment and order lifecycle work in staging.

## Gate 5 — Admin complete

Business team can operate the store.

---


# 34. Final V1 Acceptance Checklist

- [ ] Homepage complete
- [ ] Navigation complete
- [ ] Footer complete
- [ ] Product categories complete
- [ ] Product listing complete
- [ ] Product details complete
- [ ] Search complete
- [ ] Filters/sorting complete
- [ ] Cart complete
- [ ] Customer authentication complete
- [ ] Address management complete
- [ ] Checkout complete
- [ ] Online payment complete
- [ ] COD complete if approved
- [ ] Order creation complete
- [ ] Order history complete
- [ ] Order status/tracking complete
- [ ] Admin authentication complete
- [ ] Admin dashboard complete
- [ ] Product management complete
- [ ] Category management complete
- [ ] Inventory management complete
- [ ] Order management complete
- [ ] Customer management complete
- [ ] Coupon management complete
- [ ] Homepage/content management complete
- [ ] Shipping integration complete
- [ ] Transactional notifications complete
- [ ] SEO foundation complete
- [ ] Analytics complete
- [ ] Search Console complete
- [ ] Security review complete
- [ ] Backup strategy complete
- [ ] Documentation complete

---

# 35. Final Implementation Principle

Build the platform as a **real commerce product**, not as a demo website.

The initial release should be intentionally focused, but the foundation must be clean enough to support the future roadmap:


# 36 Tech Stack.
| Layer              | Technology                                      | Purpose                                          |
| ------------------ | ----------------------------------------------- | ------------------------------------------------ |
| Storefront         | **Next.js + TypeScript**                        | SEO-friendly e-commerce storefront               |
| UI                 | **Tailwind CSS + shadcn/ui**                    | Responsive, reusable UI system                   |
| State Management   | **Redux Toolkit and Redux Thunk**               | Cart, wishlist and client-side state             |                             |
| Backend            | **Node.js + TypeScript + Express.js**           | REST API and business logic                      |
| Database           | **PostgreSQL (via Supabase)**                   | Orders, products, customers, inventory, payments |
| Backend-as-a-Service | **Supabase**                                  | Managed PostgreSQL, auth support, storage, and realtime capabilities, Product images |
| ORM                | **Prisma ORM**                                  | Type-safe database access                        |
| Authentication     | **JWT + HTTP-only cookies**                     | Customer/admin authentication                    |
| Payments           | **Razorpay**                                    | UPI, cards, net banking, COD workflow support    |
| Shipping           | **Shiprocket API**                              | Shipment creation and tracking                   |
| Email              | **Resend**                                      | Transactional emails                             |
| Search             | **PostgreSQL search initially**                 | Product search                                   |
| Cache              | **Redis — future/when required**                | Sessions, caching, rate limiting                 |
| Admin              | **Next.js + TypeScript**                        | Product/order/customer management                |
| Hosting            | **Vercel**                                | Application hosting                              |
| Database Hosting   | **Supabase (Managed PostgreSQL)**               | Production database                              |
| Analytics          | **Google Analytics 4 + Search Console**         | Traffic and SEO analytics                        |


The AI agent should always prefer **correctness, maintainability, security, clear business behavior and controlled scope** over adding unnecessary features.

The final result must be a production-ready Dhanvantari e-commerce platform that can launch with the selected products and continue evolving as the business grows.

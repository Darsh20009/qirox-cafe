## Recent Changes (February 11, 2026)
- **Payment Gateway Management System**: Admin can select NeoLeap or Geidea as payment provider, enter encrypted credentials (masked in frontend), toggle payment methods (cash, POS, qahwa card, STC Pay, bank transfer). Setup instructions included for each provider. Connection testing button validates API credentials server-side. Config stored in BusinessConfig.paymentGateway.
- **Secure Online Payment Flow**: Checkout detects online payment methods (neoleap/geidea/apple_pay/bank_card), calls `/api/payments/init` for hosted redirect, stores sessionId, and on callback verifies payment server-side via `/api/payments/verify` before creating order. PCI compliant - no card data touches our servers.
- **Config-Driven Payment Methods**: `/api/payment-methods` endpoint returns enabled methods based on admin configuration. Customer checkout and payment components dynamically render only enabled methods. Admin toggles control visibility.
- **Loyalty Points Redemption Security**: Email verification codes (4-digit, 10-min expiry, 5-attempt limit) required before redeeming points. Server-side token validation on order creation.
- **Complete i18n Translation System**: All customer menu text now uses proper i18n translation keys for both Arabic and English. Added ~30 new translation keys covering categories (food, bakery, basic), banners (default + smart slides), offers, search placeholders, and section titles. Removed all hardcoded Arabic fallbacks and `|| "fallback"` patterns. Menu categories, banners, and UI labels switch fully between AR/EN.
- **Independent Food/Drinks Management**: Employee menu management page (`/employee/menu-management`) now filters items by type: drinks mode shows hot/cold/specialty/drinks categories; food mode (`?type=food`) shows food/bakery/desserts. Separate sidebar links, layout nav items, and home page quick access cards for each. Category selectors in add/edit dialogs adapt per mode.
- **Menu Categories Employee-Managed**: Moved category add/delete from customer menu to admin settings page. Categories now have a `department` field (drinks/food) so employees can assign subcategories to either "drinks management" or "food management". Customer menu auto-filters categories by active department in dual-mode.
- **ERP Accounting System Overhaul**: Fixed permissions (changed requireAdmin to requireManager for account creation, initialization, and expense approval). Added 4 new tabs: Journal Entries (القيود), Expenses (المصروفات), Vendors (الموردين), Balance Sheet (الميزانية). Added GET endpoints for journal entries and expenses. Journal entry creation uses account selector dropdown with accountId. Fixed cache invalidation for all report queries.
- **Account Creation Enhancement**: Added parent account selector dropdown to the account creation form, allowing nested account hierarchy.

## Previous Changes (February 05, 2026)
- **Enhanced Customer Profile Page**: Added profile editing functionality with ability to update name and email. Profile card now displays phone number and email with edit button. Phone number is read-only for security.
- **Fixed Inventory Deduction Bug**: Fixed critical bug where inventory was not being deducted when orders were placed. The `deductInventoryForOrder` function now properly calls `storage.deductInventoryForOrder()` and updates the order with `inventoryDeducted`, `costOfGoods`, and `inventoryDeductionDetails`.
- **Accounting Journal Entries for Purchases**: When inventory is received via `receivePurchaseInvoice`, the system now automatically creates double-entry accounting journal entries (Debit: Inventory 1130, Credit: Cash/Accounts Payable based on payment status).
- **Email Service for Render Deployment**: Fixed SMTP_PASSWORD/SMTP_PASS mismatch in render.yaml, added SMTP_PORT configuration, improved mail-service.ts with better logging, connection pooling, and health check functionality.
- **Dynamic Menu Categories**: Users can now create and manage custom menu categories/sections. Added MenuCategory model, API endpoints (CRUD with tenant scoping and Zod validation), and UI with add/delete functionality. System categories are protected from deletion.
- **Drink Grouping by First Arabic Word**: Menu now groups drinks by extracting the first word from Arabic names (e.g., "لاتيه حار" and "لاتيه بارد" grouped under "لاتيه"). Handles diacritics and missing names gracefully.
- **Drink Addon System**: Drinks can now be linked as addons with `isAddonDrink` and `linkedCoffeeItemId` fields. The add-to-cart modal displays drink addons with linked item images.
- **Cart Display Enhancement**: Cart badges now show linked drink names in parentheses with a Coffee icon for drink addons.
- **Schema Compatibility**: Extended `insertProductAddonSchema` to include legacy categories ('Flavor', 'Shot') and all optional fields for backward compatibility.
- Fixed critical loyalty card API mismatch where the frontend was calling incorrect endpoints. Added `/api/loyalty/transactions/customer/:customerId` backend route.
- Stabilized POS system (`/employee/pos`) by resolving variable reference order issues (`syncingOffline`, `isOffline`) and ensuring `OrderType` and `ORDER_TYPES` are correctly defined before use.
- Fixed translation bug in customer navigation where "nav.referrals" was showing a key instead of "كسب النقاط".
- Improved real-time order alerts in POS with WebSocket integration and persistent notification sound toggles.

# CLUNY CAFE – Digital Coffee Shop Management System

## Overview

CLUNY CAFE is a comprehensive digital management system designed to streamline operations for coffee shops. It caters to both customers through the CLUNY CAFE portal and employees via the CLUNY SYSTEMS portal. The system aims to modernize coffee shop management, enhance customer experience, and improve operational efficiency. Key capabilities include integrated ERP accounting, ZATCA-compliant invoicing, robust delivery management, employee shift and geofencing, and a customer loyalty program.

## User Preferences

- All texts are in Arabic with English support for data.
- The system fully supports RTL.
- Iterative development approach.
- Work in Fast mode with small, focused chunks.

## System Architecture

### Design System (CLUNY)

The system employs a modern, clean design inspired by Noon Food, featuring a vibrant teal green primary color (`#2D9B6E`) and ocean blue accent (`#2196F3`) against a pure white background. Typography uses Playfair Display for headings and Inter for body text, with Cairo as a fallback for Arabic.

**Core Design Elements:**
- **Color Palette:** Muted Sage (`#9FB2B3`), Rich Coffee Brown (`#B58B5A`).
- **Typography:** Playfair Display (headings), Inter (body), Tajawal/IBM Plex Sans Arabic (Arabic).
- **Layouts:** Four distinct role-based layouts (Customer, POS, Kitchen, Manager).
- **States:** Unified components for loading (skeletons), empty, and error states.

### Technical Implementations

- **POS Order Alerts & Management:** Real-time order alerts with notification sounds via WebSocket, sound/alert toggles with persistence, new orders badge counter, split-screen view toggle, enhanced live orders dialog with details panel, color-coded status borders, and order actions (start, ready, complete, cancel).
- **Business Mode System:** Supports configurable "cafe only," "restaurant only," or "both" modes, with dynamic menu filtering and real-time status indicators.
- **ERP Accounting System:** Features a professional Chart of Accounts following Saudi standards, double-entry bookkeeping, journal entry management, and financial reports (Trial Balance, Income Statement, Balance Sheet). Includes expense management with approval workflows and vendor management.
- **ZATCA Professional Invoicing:** Generates ZATCA-compliant invoices with TLV encoded QR codes containing mandatory fields, integrated into order creation and standalone invoice generation.
- **Financial Reports Dashboard:** Interactive visualizations for revenue vs. expenses, asset/liability distribution, and income statement breakdowns using `recharts`.
- **Kitchen Display System (KDS):** Enhanced with SLA status tracking, priority badges, station routing, allergen warnings, prep time countdowns, and estimated total prep times.
- **Loyalty Program:** Points-based system (10 points per drink, 100 points = 5 SAR). Tier progress visualization (Bronze, Silver, Gold, Platinum) with progress bars. Unified `useLoyaltyCard` hook with `pendingPoints` support for orders in progress. Profile page shows points balance and SAR value.
- **Personalized Offers:** Customer-specific offers page (`/my-offers`) with behavior-based discounts based on loyalty points, order history, and featured items. Banner link in menu page for authenticated users.
- **Referral System:** Registration supports referral codes (phone number). 50 bonus points for both referrer and new customer upon registration.
- **Menu Page Redesign:** Interactive menu with group filtering, search functionality, featured items slider, and PWA installation support. Products are now grouped by `groupId` for proper variant handling.
- **Promotional Offers System:** Bundle/combo offers with original and discounted pricing, displayed prominently in "عروضنا" section. Supports time-based activation with start/end dates.
- **Enhanced Addons System:** Supports both general addons (available for all products) and specific addons (linked to individual products via `CoffeeItemAddon`). The add-to-cart modal displays specific addons first, then general addons.
- **Table Reservation System:** Time-based table occupancy, with reservations activating 30 minutes before and expiring 5 minutes after scheduled time. Staff can extend reservations.
- **Checkout Page:** Includes discount code input, order confirmation dialog with accurate totals, and split payment options.
- **Delivery System:** Manages external delivery platform integrations, geospatial delivery zones (polygon/radius-based), driver tracking, and order status tracking with ETA.
- **Driver Portal & Tracking:** Driver login with phone-based authentication, order queue management, status updates, customer tracking page with real-time updates via WebSockets.
- **Branch Geofencing:** Configurable `geofenceRadius` and `geofenceBoundary` (polygon-based) for precise attendance and location-based management. Includes manager notifications for employee alerts.
- **Shift Management:** Supports flexible shift scheduling, including overnight shifts, and employee assignment to shifts.
- **Employee Permissions (RBAC):** Granular, page-level access control using `allowedPages` in employee profiles and a `PageGuard` component.
- **PWA Configuration:** Dynamic manifest switching between CLUNY CAFE (customer) and CLUNY SYSTEMS (employee) based on the route.

### Technical Stack

- **Backend:** Node.js, Express.js, MongoDB with Mongoose, Zod.
- **Frontend:** React, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind CSS, Wouter.
- **Security:** AuthGuard (role-based), PageGuard (page-level permissions), local storage for session management.

## External Dependencies

- **Database:** MongoDB Atlas (CLUNY-CAFE Project)
- **Mapping/Geospatial:** `turf.js` for polygon-based geofencing.
- **Charting:** `recharts` for financial dashboards.
- **Delivery Platforms (Integrations):** Noon Food, Hunger Station, Keeta, Marsool, Careem.
- **QR Code Generation:** `zatca-utils.ts` (custom utility module).
# RentHub Marketplace — System Flow & Architecture

This document serves as the comprehensive guide to how all functions and workflows operate within the RentHub Marketplace platform.

## 1. Authentication Flow (Custom MERN Auth)
The platform uses a custom JSON Web Token (JWT) based authentication system completely independent of third-party providers like Clerk.

- **Registration & Login:** Users create accounts via `AuthModal.jsx`. The frontend calls `POST /api/auth/register` or `POST /api/auth/login`. Passwords are encrypted using `bcrypt` and a JWT token is generated and stored in the browser's `localStorage` (`rh_token`).
- **Social Login:** Google and GitHub logins are handled via Passport.js on the backend. When a user authenticates, a JWT is generated and the user is redirected back to the frontend with the token in the URL (`?token=...`). The frontend `App.jsx` intercepts this and securely logs the user in.
- **Forgot/Reset Password:** Users can request a password reset from the Auth Modal. A secure, time-limited token is generated and emailed via Nodemailer. Clicking the link opens `ResetPasswordModal.jsx` where the user securely sets a new password.

## 2. Listing Lifecycle & Admin Approvals
To maintain marketplace quality, all new item listings must pass an Admin Approval workflow before becoming visible to buyers.

1. **Creation:** A seller fills out the `AddItemModal` (title, price, category, images uploaded to Cloudinary).
2. **Pending State:** The backend (`POST /api/listings`) creates the listing with `status: 'pending'`.
   - The listing is visible **only** in the Seller's Dashboard (with a yellow "Pending" badge).
   - It is **not** visible on the public marketplace.
3. **Admin Review:** The Admin logs in, opens the Admin Panel, and navigates to "Pending Approvals".
4. **Approval/Rejection:** The Admin reviews the item. If approved (`PATCH /api/admin/listings/:id/status`), the status changes to `approved` and it instantly becomes visible on the homepage and search results.

## 3. Escrow, Order Processing, and Payouts
RentHub uses a secure Escrow system to protect both buyers and sellers.

1. **Purchase/Rent:** A buyer finds an `approved` listing and completes the `CheckoutModal`.
2. **Escrow State:** An Order is generated with `status: 'escrow'`. The Listing is updated to `sold` or `rented`.
3. **Fulfillment (Seller):** The seller sees the order in their Dashboard and ships the item. They mark it as shipped (`PATCH /api/orders/:id/ship`), providing an optional tracking number. Order status changes to `shipped`.
4. **Delivery Confirmation (Buyer):** The buyer receives the item and clicks "Confirm Delivery". This releases the funds from escrow (`status: 'released'`).
5. **Review System:** Once the order is `released`, the buyer is prompted to leave a rating and review for the seller.
6. **Payout Request:** The seller sees the released funds in their "Available Balance" and requests a withdrawal (`status: 'payout_requested'`).
7. **Disbursement (Admin):** The Admin views requested payouts in the Admin Panel ledger and disburses the funds, moving the order to `status: 'paid'`.

## 4. Real-Time Chat (Socket.io)
RentHub includes a persistent, real-time messaging system allowing buyers and sellers to communicate securely.

- **Initialization:** When a user clicks "Message Seller" on a listing, a `ChatSession` is created linking the two users and the specific listing context.
- **Floating Chat:** The chat interface exists as a persistent, floating widget (`FloatingChat.jsx`) accessible from anywhere on the site.
- **Real-Time Delivery:** Messages are routed instantly through the Socket.io Node server (`server/index.ts`). Unread message counts are tracked and updated automatically.

## 5. In-App Notifications
RentHub features a real-time notification engine to keep users informed about their marketplace activities.
- **Triggers:** Notifications are automatically generated and saved to the database when:
  - An Admin approves a seller's pending listing.
  - A Buyer places an order (notifying the seller).
  - A Seller ships an order (notifying the buyer).
  - A Buyer confirms delivery (notifying the seller that funds are released).
- **Interface:** Users view their alerts via a dropdown Bell icon in the `Navbar`. The icon displays a red dot if unread notifications exist. Clicking a notification marks it as read in the database.

## 6. Seller Revenue Analytics
To empower sellers, RentHub provides visual data insights directly in the User Dashboard.
- **Data Processing:** The frontend dynamically parses the seller's order history (`orders` array), aggregates daily revenue, and deducts the appropriate platform fees (5% for Sales, 15% for Rentals).
- **Visualization:** Using the `recharts` library, the "Earnings" tab renders a fully interactive `AreaChart` that plots the seller's net revenue over the trailing 30 days.

## 7. Security & Roles
- **Role-Based Access:** The platform differentiates between standard `user` and `admin` roles. 
- **Admin Email:** The admin user is defined by the `VITE_ADMIN_EMAIL` environment variable. Logging in with this email grants access to the Admin Panel (Approvals, User Directory, Payout Ledger, Site Analytics).
- **Protected Routes:** Backend modifications (creating listings, modifying orders, updating profiles) require a valid `Bearer` token validated by the `verifyToken` middleware.

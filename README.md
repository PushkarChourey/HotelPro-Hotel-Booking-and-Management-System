# HotelPro — Complete Luxury Hotel Booking and Management System

[![Stack](https://img.shields.io/badge/Stack-MERN-amber.svg)](#technology-stack)
[![Node](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19.x-cyan.svg)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Local-emerald.svg)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-Apache--2.0-lightgrey.svg)](LICENSE)

**HotelPro** is a full-stack, enterprise-grade hospitality reservation and property management application built with the **MERN (MongoDB, Express, React, Node.js)** stack. Designed with a luxury aesthetic (deep midnight navy, warm champagne white, and muted gold accents), HotelPro delivers end-to-end guest reservation workflows, real-time suite inventory management, front-desk arrival check-in, automatic housekeeping turnover generation, manager revenue analytics, and administrative audit logging across 4 distinct role-based personas.

---

## Architecture Overview

```text
HotelPro/
├── client/ (or src/)
│   ├── assets/           # Photography & brand crest assets
│   ├── components/
│   │   ├── auth/         # Login, registration & demo persona switchers
│   │   ├── booking/      # Printable luxury invoice modal & date calculators
│   │   ├── common/       # Toast notification system
│   │   └── layout/       # Luxury Navbar with notifications & footer
│   ├── context/          # AuthContext (JWT & demo personas) & ToastContext
│   ├── pages/
│   │   ├── HomePage.tsx            # Cinematic hero, search bar & featured hotels
│   │   ├── HotelSearchPage.tsx     # Destination filters, price slider & ratings
│   │   ├── HotelDetailsPage.tsx    # Gallery, suites, live availability & reviews
│   │   ├── CheckoutPage.tsx        # Multi-step checkout & payment sandbox
│   │   └── dashboards/
│   │       ├── GuestDashboard.tsx   # Stays, printable receipts, service requests
│   │       ├── StaffDashboard.tsx   # Front desk check-in/out, housekeeping
│   │       ├── ManagerDashboard.tsx # Yield management, dynamic rates, refunds
│   │       └── AdminDashboard.tsx   # Recharts platform analytics, users & audit logs
│   ├── services/         # Axios client with JWT interceptor (/api/*)
│   └── utils/            # Pure logic engines: pricing, availability & state machines
├── server/
│   ├── src/
│   │   ├── config/       # MongoDB connection & reactive in-process seed store
│   │   ├── middleware/   # JWT verification & RBAC authorization guards
│   │   ├── models/       # Mongoose schemas (User, Hotel, Room, Booking, etc.)
│   │   ├── routes/       # REST API endpoints (/api/*)
│   │   ├── seed.ts       # Standalone MongoDB Atlas population script
│   │   └── types/        # Shared TypeScript data models
│   └── server.ts         # Fullstack Express entry point mounting Vite middlewares
├── .env.example          # Environment variable template
└── README.md             # Complete documentation & testing guide
```

---

## 4 Distinct Role-Based Personas

HotelPro features strict backend role enforcement via JWT middleware:

| Role | Demo Account | Default Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Guest** | `guest@hotelpro.com` | `Guest@1234` | Destination search, room availability checks, reservation booking, printable official invoices, stay cancellations, in-stay concierge requests, verified reviews. |
| **Hotel Staff** | `staff@hotelpro.com` | `Staff@1234` | Front-desk arrival verification, keycard issuance, departure checkout (auto-triggers housekeeping), room operational status updates, housekeeping task workflow board, concierge request fulfillment. |
| **Hotel Manager** | `manager@hotelpro.com` | `Manager@1234` | Property yield management, custom room categories, base rate & seasonal surge multipliers, staff task assignment, revenue KPIs (Occupancy %, ADR, RevPAR), refund approval/rejection. |
| **Super Admin** | `admin@hotelpro.com` | `Admin@1234` | Platform-wide analytics with Recharts (monthly revenue, room status breakdown), user role management (promote/suspend accounts), immutable audit security logs, database health monitoring. |

> **Tip:** You can switch instantly between all four demo personas at any time using the **Role Switcher** in the top navigation bar!

---

## Booking & Availability Engine

1. **Date Range Overlap Detection:**
   Hospitality-standard date boundary check prevents double-booking while cleanly permitting adjacent handoffs (same-day checkout at 11:00 AM and check-in at 3:00 PM):
   $$\text{Overlap} \iff (\text{bookingStart} < \text{newEnd}) \land (\text{bookingEnd} > \text{newStart})$$
2. **Atomic Availability Verification:** Re-verified on the server at submission time before reserving the room document.
3. **Transparent Price Calculation:**
   $$\text{Total} = (\text{Nights} \times \text{BaseRate} \times \text{SeasonalMultiplier}) + \text{Taxes (12\%)} + \text{Resort Fee} - \text{Promo Discount}$$
4. **Automated Housekeeping Turnover:** Checking out an occupant automatically transitions the room status to `Cleaning` and immediately enqueues a `Check-out Turnover` task for housekeeping staff. When completed, the room returns to `Available`.

---

## REST API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/login` — Authenticate user and receive JWT.
- `POST /api/auth/register` — Register a new guest account (admin accounts cannot be registered publicly).
- `GET /api/auth/me` — Retrieve currently authenticated user profile.

### Hotels & Room Inventory
- `GET /api/hotels` — Search hotels (supports `destination`, `minPrice`, `maxPrice`, `rating`, `amenity`).
- `GET /api/hotels/:id` — Hotel details with room categories, reviews, and room stats.
- `POST /api/hotels` — (Manager/Admin) Create new property listing.
- `GET /api/rooms` — Filter physical rooms by hotel, category, or operational status.
- `GET /api/rooms/categories` — List suite categories for a hotel.
- `POST /api/rooms/categories` — (Manager/Admin) Create category and auto-generate physical room numbers.
- `PUT /api/rooms/categories/:id` — (Manager/Admin) Update base price and seasonal yield multiplier.
- `GET /api/rooms/availability` — Check real-time date availability, conflict counts, and price quote.
- `PUT /api/rooms/:id/status` — (Staff/Manager/Admin) Update room operational status (`Available`, `Occupied`, `Cleaning`, `Maintenance`).

### Bookings & Operations
- `POST /api/bookings` — Create a reservation with server-authoritative pricing and conflict lock.
- `GET /api/bookings` — Role-scoped booking list (Guest sees own; Staff/Manager sees property; Admin sees all).
- `GET /api/bookings/:id` — Retrieve booking details and official invoice payload.
- `POST /api/bookings/:id/cancel` — Guest cancellation with automated refund request queue.
- `POST /api/bookings/:id/refund` — (Manager/Admin) Approve or reject refund decision.
- `POST /api/check-in` — (Staff/Manager/Admin) Check in guest, record timestamp, set room to Occupied.
- `POST /api/check-out` — (Staff/Manager/Admin) Check out guest, set room to Cleaning, auto-create Housekeeping task.

### Housekeeping & Concierge Services
- `GET /api/housekeeping` — List cleaning tasks by hotel and status.
- `PUT /api/housekeeping/:id/status` — Advance task status (`Pending` -> `In-Progress` -> `Inspected` -> `Completed`).
- `GET /api/services` — List guest service requests.
- `POST /api/services` — Create concierge request (e.g., extra linens, dining, wake-up call).
- `PUT /api/services/:id/status` — Advance service status to `Completed`.

### Admin & Analytics
- `GET /api/admin/analytics` — Platform KPI overview, monthly revenue, room status distribution.
- `GET /api/admin/logs` — Immutable audit security log trail.
- `GET /api/admin/users` — List platform users.
- `PUT /api/admin/users/:id/role` — Update user role or account status.
- `GET /api/health` — System health and database connection status.

---

## Local Development & Setup Instructions

### Prerequisites
- **Node.js**: v20 or later
- **npm**: v9 or later
- **MongoDB**: Local MongoDB community edition (`mongod`) OR a free cloud cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/your-username/HotelPro.git
cd HotelPro
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the configuration parameters as needed:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/hotelpro?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
```
> **Note:** If `MONGODB_URI` is left blank, HotelPro will automatically run in **Development Seed Mode**, serving all REST APIs with realistic pre-populated luxury records.

### 3. Database Seeding (Optional for MongoDB Atlas / Local MongoDB)
To populate a fresh MongoDB database with our 4 luxury hotels, rooms, categories, users, bookings, and tasks:
```bash
npm run seed
# Or directly with tsx:
MONGODB_URI="your_connection_string" npx tsx server/src/seed.ts
```

### 4. Running the Application
Start the full-stack development server:
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

---

## Automated Testing Suite

HotelPro includes unit tests covering pure business calculations (pricing breakdowns, date overlap detection, guest capacity limits, operational status state transitions, and RBAC rules):

Run tests using Node's built-in test runner:
```bash
npm test
# Or run directly:
npx tsx --test src/utils/hotelEngine.test.ts
```

All 7 test suites validate:
1. `calculateNights` accurately handles dates and month transitions.
2. `calculatePriceBreakdown` computes correct room charges, taxes, service fees, and promo discounts (`WELCOME10`).
3. `doDateRangesOverlap` verifies conflicts and permits standard checkout-day handoffs.
4. `validateBookingDates` rejects past dates and inverted dates.
5. `validateCapacity` rejects bookings exceeding suite limits.
6. `canTransitionRoomStatus` enforces room state machine transitions.
7. `rbacRules` enforces role-specific permissions.

---

## Postman API Testing Guide

1. **Importing into Postman:** Create a new collection named `HotelPro API`.
2. **Set Collection Variable:** `baseUrl` = `http://localhost:3000/api`.
3. **Authenticate:** Send a `POST {{baseUrl}}/auth/login` with:
   ```json
   {
     "email": "guest@hotelpro.com",
     "password": "Guest@1234"
   }
   ```
4. **Set Token:** Save the returned `token` into Postman's `Authorization: Bearer <token>`.
5. **Create a Reservation:**
   Send `POST {{baseUrl}}/bookings` with:
   ```json
   {
     "hotelId": "hotel-1",
     "roomCategoryId": "cat-1-1",
     "checkIn": "2026-12-01",
     "checkOut": "2026-12-05",
     "guests": 2,
     "promoCode": "WELCOME10"
   }
   ```
6. **Check In / Check Out:** Test front-desk operations with `POST {{baseUrl}}/check-in` using Staff credentials (`staff@hotelpro.com` / `Staff@1234`).

---

## Academic Demonstration Video Placeholder

> **Demo Walkthrough Video:**  
> A full 5-minute video walkthrough covering guest reservation, staff check-in, housekeeping task execution, manager yield rate management, and admin analytics can be added here after screen recording:  
> `[Link to Demo Video on YouTube / Vimeo / Loom]`

---

## License

This project is licensed under the Apache-2.0 License. Designed for academic portfolio presentation and production hotel deployment.

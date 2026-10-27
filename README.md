# EquiSplit — Intelligent Shared Expense Splitter & Debt Simplification Platform

> **End-Term Software Project Submission**  
> **Problem Domain:** Financial Collaboration, Debt Simplification & Shared Expense Management  
> **Tech Stack:** MERN Stack (React 19 + Vite, Node.js + Express, MongoDB + Mongoose, JWT Auth)

---

## 1. Problem Statement

When friends travel together, roommates manage a shared apartment, or project peers split collective bills, tracking shared costs quickly descends into a chaotic web of IOUs. 
Existing simple spreadsheet or CRUD approaches suffer from three critical flaws:
1. **Circular Debt:** If Alice pays ₹1,000 for Bob, Bob pays ₹800 for Charlie, and Charlie pays ₹600 for Alice, they end up making 3 back-and-forth bank transfers instead of a single net settlement.
2. **Penny & Remainder Inaccuracies:** Dividing bills like ₹1,000 across 3 people creates recurring decimals ($333.333...$), causing mathematical leaks where split shares fail to add up to the invoice total.
3. **Absence of Business Guards:** Basic CRUD systems allow users to delete records indiscriminately or remove members who still owe money, breaking ledger integrity.

---

## 2. Target Users

- **Travelers & Vacation Groups:** Friends managing villa bookings, meals, fuel, tolls, and activities with varying split shares.
- **Flatmates & Roommates:** People sharing monthly rent, Wi-Fi fiber, electricity, groceries, and maid charges.
- **Project Teams & Peer Circles:** Groups organizing collective events, dinners, or gifts.

---

## 3. The Solution: EquiSplit

**EquiSplit** is a full-featured web application with a custom mathematical ledger engine:
- **Min-Cash-Flow Greedy Algorithm:** Computes net balances for each person and collapses mutual debts into the absolute minimum number of payments (guaranteed $\le N - 1$ transfers).
- **Penny-Accurate Multi-Split System:** Supports **Equal** (with auto-paisa remainder distribution), **Exact Amounts**, **Percentages** (100% sum validation), and **Weighted Shares**.
- **Multi-Payer Support:** Handles expenses where multiple people contribute to the bill.
- **Natural Authorization & Safety Guards:** Group-isolated data, member-only access, payer/admin-only modification rights, and strict prevention of removing members who have unsettled balances.
- **One-Click Settle Up:** Direct settlement recording that updates the graph and triggers celebratory feedback.
- **Visual Analytics & Audit Trail:** Interactive category expenditure breakdowns, Paid vs. Consumed comparison, and an immutable activity audit stream.

---

## 4. Key Workflows & Engineering Depth

### Workflow 1: Group Creation & Frictionless Onboarding
- Authenticated users create groups categorized by context (Trip, Home, Couple, Project).
- Every group automatically receives a unique 6-character uppercase invite code (e.g., `GOA202`) and a shareable join link.
- New members join with one click or code entry; authorization ensures users can only inspect groups they belong to.

### Workflow 2: Expense Creation with Precision Split Engine
- Users input an expense with category, date, and notes.
- **Payer Modes:** Single payer or multiple payers (validated so $\sum \text{Paid} = \text{Total}$).
- **Split Modes:**
  - **Equal Split:** Evenly divides the total in paise/cents. If remainder cents exist (e.g. ₹100 split 3 ways), remainder cents are distributed to the first $R$ participants so $\sum \text{Splits} = \text{Total}$ exactly.
  - **Exact Amounts:** User enters arbitrary amounts; the system validates that the sum strictly matches the expense total.
  - **Percentages:** User inputs percentages; validated to sum to 100%, and rounding errors on cents are compensated on the largest share.
  - **Shares:** Users enter weights (e.g. 2 shares for couples, 1 for singles), calculating proportional ratios with zero penny leak.

### Workflow 3: Min-Cash-Flow Debt Simplification Algorithm
The algorithm simplifies debts in $O(N \log N)$ time:
1. Calculates net balance for every member:
   $$\text{NetBalance}_i = (\text{Total Paid}_i + \text{Settlements Sent}_i) - (\text{Total Share}_i + \text{Settlements Received}_i)$$
2. Divides members into two sorted priority lists:
   - **Debtors** ($\text{Balance} < -0.01$)
   - **Creditors** ($\text{Balance} > +0.01$)
3. Greedily matches the maximum debtor $D$ with the maximum creditor $C$:
   $$\text{TransferAmount} = \min(|D.\text{debt}|, C.\text{credit})$$
4. Records transaction $D \xrightarrow{\text{TransferAmount}} C$, adjusts remaining balances, and repeats until all balances reach zero.
5. Users can toggle between **Simplified Transfers** and **Raw Pairwise Debts** to see the exact number of payments saved!

### Workflow 4: One-Click Settle-Up & Live Balance Updates
- Users can click "Settle" directly on any simplified transfer card.
- The system pre-fills the debtor, creditor, and amount.
- Recording a settlement payment logs the payment, credits the payer, debits the recipient, re-evaluates the debt graph, and fires confetti.

### Workflow 5: Safety Guard & Audit Trail
- **Safe Member Removal:** Attempting to remove a member who has a non-zero balance is blocked with a descriptive error:  
  *`"Cannot remove member! This user still owes ₹1,200.00. Please settle all balances first."`*
- **Audit Trail:** Every addition, modification, deletion, and settlement is logged into `ActivityLog` with the actor, action type, timestamp, and details.

---

## 5. Technology Stack & Architectural Decisions

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Frontend** | React 19 + Vite | Fast HMR, reactive state management, and modern component lifecycle |
| **Icons & Effects** | Lucide-React, Canvas-Confetti | Lightweight modern iconography and celebration animations |
| **Styling** | Vanilla CSS Tokens & Glassmorphism | Custom design system with deep dark aesthetic, sleek badges, and responsive CSS grid/flex layouts |
| **Backend** | Node.js + Express | Lightweight, scalable REST API with modular controllers, middlewares, and services |
| **Auth & Security** | JWT + bcryptjs | Stateless token authentication with salted password hashing and protected routes |
| **Database** | MongoDB + Mongoose | Flexible document model for embedded payer arrays, split shares, and activity logs |
| **Zero-Config Engine** | `mongodb-memory-server` Fallback | If no external MongoDB daemon is active, automatically boots a fast in-memory database with pre-populated demo data so evaluators can run the app with 0 configuration! |

---

## 6. Project Architecture

```
end-term(project)/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # Database connection (Atlas, local, or automatic in-memory fallback)
│   │   ├── controllers/
│   │   │   ├── authController.js     # User registration, login, user search
│   │   │   ├── groupController.js    # Group CRUD, invite codes, safe member removal
│   │   │   ├── expenseController.js  # Add, update, delete with payer/admin auth
│   │   │   ├── settlementController.js# Record & fetch peer-to-peer payments
│   │   │   ├── analyticsController.js # Net balance ledger, category stats
│   │   │   └── activityController.js  # Group audit trail
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT verification & req.user attachment
│   │   │   └── errorHandler.js       # Centralized error handler & Mongoose validator
│   │   ├── models/
│   │   │   ├── User.js               # User credentials & password hashing
│   │   │   ├── Group.js              # Groups, members, roles, 6-char invite codes
│   │   │   ├── Expense.js            # Expenses with payers & multi-split schemas
│   │   │   ├── Settlement.js         # Direct settlement payments
│   │   │   └── ActivityLog.js        # Audit history
│   │   ├── services/
│   │   │   ├── debtSimplifier.js     # Min-Cash-Flow Greedy Algorithm
│   │   │   ├── splitCalculator.js    # Penny-accurate split math & validations
│   │   │   └── autoSeeder.js         # Auto-populates sample data if DB is empty
│   │   ├── routes/                   # REST API routes
│   │   ├── seed.js                   # Standalone seed script
│   │   └── server.js                 # Express server entry point
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Brand header, active group, user pill
│   │   │   ├── ExpenseModal.jsx      # Multi-split & multi-payer modal
│   │   │   ├── SettleModal.jsx       # Payment modal with confetti
│   │   │   ├── AddMemberModal.jsx    # Invite code & link sharing
│   │   │   ├── DebtSimplificationCard.jsx # Min-Cash-Flow visualization & savings
│   │   │   ├── BalancesLedger.jsx    # Member net balances & status pills
│   │   │   ├── ExpenseList.jsx       # Filterable expense list with actions
│   │   │   ├── CategoryBreakdown.jsx # Charts & spend vs share comparison
│   │   │   └── ActivityStream.jsx    # Audit trail timeline
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication state & JWT storage
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx          # Sign In / Register with quick demo accounts
│   │   │   ├── Dashboard.jsx         # Group directory & overall net balances
│   │   │   └── GroupDetail.jsx       # Group workspace with full tabbed workflows
│   │   ├── services/
│   │   │   └── api.js                # Central API fetch wrapper
│   │   ├── index.css                 # Modern CSS design system
│   │   ├── App.jsx                   # Application router
│   │   └── main.jsx
│   ├── vite.config.js                # Vite build & proxy config
│   └── package.json
├── package.json                      # Root workspace scripts (npm run dev, install:all)
└── README.md
```

---

## 7. Local Setup Instructions

### Prerequisites
- **Node.js**: v18 or later (Tested on Node v22.19.0)
- **npm**: v9 or later (Tested on npm 10.9.3)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd "end-term(project)"
   npm run install:all
   ```

2. **Run the Application:**
   ```bash
   npm run dev
   ```
   *This starts both the backend API server (`http://localhost:5000`) and the Vite frontend (`http://localhost:5173`) concurrently.*

3. **Open in Browser:**
   Navigate to [http://localhost:5173](http://localhost:5173).

> **Note on Database:**  
> The application automatically uses an embedded high-speed in-memory MongoDB instance with pre-populated demo data if no external MongoDB URI is set. **Zero installation or database configuration is required to test and evaluate the project!**  
> If you wish to connect to your own MongoDB Atlas cluster, simply provide `MONGODB_URI` in `server/.env`.

---

## 8. Demo Credentials

The login page features convenient **One-Click Demo Login** buttons:

| Name | Email | Password | Role in Demo |
|---|---|---|---|
| **Rahul Sharma** | `rahul@example.com` | `password123` | Goa Trip Admin, Beach Villa Payer |
| **Priya Patel** | `priya@example.com` | `password123` | Flat 402 Admin, Seafood Feast Payer |
| **Aman Verma** | `aman@example.com` | `password123` | Goa Trip Member, Fuel Payer |
| **Neha Gupta** | `neha@example.com` | `password123` | Goa Trip Member, Water Sports Payer |

You can also create brand-new user accounts anytime via the "Create Account" tab.

---

## 9. Environment Variables

Create a `server/.env` file (copied from `server/.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/equisplit
JWT_SECRET=equisplit_super_secret_jwt_key_2026_secure
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 10. Deployment Guide

### Deploy Backend (Render / Railway)
1. Push repository to GitHub.
2. In Render, create a new **Web Service** pointing to the `server/` directory.
3. Build Command: `npm install`
4. Start Command: `node src/server.js`
5. Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Random secure string
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: URL of your deployed frontend

### Deploy Frontend (Vercel)
1. In Vercel, import the repository and set Root Directory to `client`.
2. Framework Preset: `Vite`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Environment Variable:
   - `VITE_API_URL`: URL of your deployed backend service

---

## 11. Rubric Verification Checklist

- [x] **Product Understanding (10%):** Clearly defined problem, target users, and workflow design.
- [x] **Core Implementation (25%):** Group creation, invite links/codes, expense tracking, settle-up, and audit trail fully implemented.
- [x] **Engineering & Application Logic (20%):** Min-Cash-Flow Greedy Algorithm, penny-accurate split math (equal, exact, percentage, shares), multi-payer validation.
- [x] **Architecture & Technical Decisions (15%):** Clean MERN architecture, zero-friction in-memory DB fallback, normalized schemas, and RESTful API endpoints.
- [x] **User Experience & Reliability (10%):** Modern glassmorphism UI, confetti animations, live remaining balance indicators, loading & error states.
- [x] **Code Quality & Project Structure (10%):** Modular controllers, middleware, services, git version control, and clean separation of concerns.
- [x] **Deployment & Documentation (10%):** Comprehensive documentation with local setup, environment variables, demo accounts, and deployment guides.

## 12. Live video link:-
https://drive.google.com/file/d/1zcnmeQCPKiJRtjFbxMAIvPOi3oggFolu/view?usp=sharing

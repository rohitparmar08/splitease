# SplitEase — Production-Ready Split Expense Web Application

**SplitEase** is a full-stack, production-quality expense management application similar in concept to Splitwise, built with a modern React + Vite frontend, Python Django REST Framework backend, and PostgreSQL database.

It allows users to create groups, add expenses across four split methods, compute individual net balances, simplify multi-person debts using a minimum cash-flow graph reduction algorithm, record debt settlements with an immutable audit trail, and view rich financial analytics.

---

## 🌟 Key Features

1. **User Authentication & Profiles**:
   - Complete JWT registration, login, profile view/edit, and password change.
   - Private route protection across all private API endpoints and frontend views.

2. **Group Management**:
   - Create groups (e.g. Goa Trip, Flat Expenses, College Friends).
   - Add/remove registered members by username or email.
   - Object-level authorization enforcing group membership isolation.

3. **Authoritative Backend Financial Calculation Engine**:
   - All financial math uses Python `Decimal` type to eliminate floating-point precision errors.
   - **Equal Split**: Equal division with exact penny discrepancy allocation.
   - **Exact Split**: Validates exact user amounts sum strictly to expense total.
   - **Percentage Split**: Validates percentages sum to 100.00%.
   - **Shares Split**: Proportional distribution based on positive share counts.

4. **Greedy Debt Simplification Service**:
   - Centralized backend algorithm converting complex multi-person debts into the minimum required set of direct transfers (e.g., collapsing A → B ₹500 and B → C ₹500 into A → C ₹500).

5. **Settlement Management**:
   - Strict validation preventing zero/negative amounts, self-settlement, non-member settlement, and over-settlement.
   - Atomic database transactions (`@transaction.atomic`).

6. **Financial Analytics & History**:
   - Interactive Recharts category pie/donut charts and monthly spending trend bar charts.
   - Global expense search, group filter, category filter, date filter, and sort options.

7. **Interactive OpenAPI / Swagger Documentation**:
   - Auto-generated API documentation via `drf-spectacular` accessible at `http://127.0.0.1:8000/api/docs/`.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18, Vite
- **Styling**: Tailwind CSS v3 (Glassmorphism & Fintech Design System)
- **Routing**: React Router v6
- **HTTP Client**: Axios (with JWT bearer request/response refresh interceptor)
- **Icons**: Lucide React
- **Analytics Charts**: Recharts

### Backend
- **Framework**: Python 3.14, Django 5.2, Django REST Framework 3.18
- **Authentication**: JWT via `djangorestframework-simplejwt`
- **Database**: PostgreSQL (`splitease_db`)
- **API Documentation**: `drf-spectacular` (Swagger & Redoc)
- **Testing**: `pytest`, `pytest-django`

---

## 📐 Database Schema

```
Users (users_user)
  ├── id (PK)
  ├── email (Unique, Indexed)
  ├── username (Unique)
  ├── full_name
  └── avatar

Groups (groups_group)
  ├── id (PK)
  ├── name
  ├── description
  └── created_by (FK -> Users)

Group Members (groups_groupmember)
  ├── group (FK -> Groups)
  ├── user (FK -> Users)
  ├── role ('ADMIN', 'MEMBER')
  └── UniqueConstraint(group, user)

Expenses (expenses_expense)
  ├── id (PK)
  ├── group (FK -> Groups)
  ├── title
  ├── amount (Decimal 12,2)
  ├── paid_by (FK -> Users)
  ├── category
  ├── split_method ('EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES')
  └── created_by (FK -> Users)

Expense Shares (expenses_expenseshare)
  ├── expense (FK -> Expenses)
  ├── user (FK -> Users)
  ├── amount (Decimal 12,2)
  ├── percentage (Decimal 5,2)
  ├── shares (Decimal 8,2)
  └── UniqueConstraint(expense, user)

Settlements (settlements_settlement)
  ├── group (FK -> Groups)
  ├── payer (FK -> Users)
  ├── receiver (FK -> Users)
  └── amount (Decimal 12,2)

Notifications (notifications_notification)
  ├── user (FK -> Users)
  ├── message
  └── is_read (Boolean)
```

---

## 🧮 Financial Calculation & Debt Simplification Logic

### Net Balance Formula
For any member $i$ in a group:
$$\text{Net Balance}_i = (\sum \text{PaidBy}_i) - (\sum \text{OwedBy}_i) + (\sum \text{SettlementsReceived}_i) - (\sum \text{SettlementsPaid}_i)$$

- $\text{Net Balance}_i > 0$: User is a **creditor** (owed money by group).
- $\text{Net Balance}_i < 0$: User is a **debtor** (owes money to group).

### Debt Simplification Algorithm
Located in `backend/apps/groups/services.py`:
1. Calculate raw net balances for all members.
2. Separate into sorted `debtors` (most negative balance to least) and `creditors` (most positive balance to least).
3. Pair top debtor with top creditor:
   - $\text{Settle Amount} = \min(-\text{debtor\_balance}, \text{creditor\_balance})$
   - Record simplified transaction: `Debtor pays Creditor Settle Amount`
   - Update remaining balances and advance pointers when balance reaches zero.
4. Repeat until all balances are zero.

---

## 🚀 Installation & Running Locally

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ running locally on port 5432

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Configure environment variables (.env)
# DB_NAME=splitease_db
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_HOST=127.0.0.1
# DB_PORT=5432

# Run Migrations
python manage.py migrate

# Seed Realistic Demo Data
python manage.py seed_data

# Run Backend Server
python manage.py runserver 127.0.0.1:8000
```

### 3. Running Automated Tests
```bash
# Run pytest test suite
pytest
```

### 4. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite Development Server
npm run dev
```

The application will be accessible at:
- **Frontend UI**: `http://127.0.0.1:5173`
- **Backend API**: `http://127.0.0.1:8000/api/`
- **Swagger Documentation**: `http://127.0.0.1:8000/api/docs/`

---

## 🔐 Seed Data Demo Accounts

All demo accounts share the password: `Password123`

| Email | Username | Full Name | Group Roles |
|---|---|---|---|
| `rahul@example.com` | `rahul` | Rahul Sharma | Admin (Goa Trip, Flat 402) |
| `amit@example.com` | `amit` | Amit Patel | Member (Goa Trip, Flat 402) |
| `priya@example.com` | `priya` | Priya Singh | Member (Goa Trip, Flat 402) |
| `mohit@example.com` | `mohit` | Mohit Verma | Member (Goa Trip) |

---

## 🔮 Future Improvements
1. **Recurring Expense Scheduler**: Automated monthly recurring expenses for apartment rent & wifi bills.
2. **Multi-Currency Support**: Real-time currency conversions for international trips.
3. **Receipt OCR Scanner**: Automatic expense field extraction from uploaded receipt images.

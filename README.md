# SplitEase — Full-Stack Expense Management & Debt Simplification Platform

[![Backend](https://img.shields.io/badge/Backend-Django_REST_Framework-092E20?style=flat-square&logo=django)](https://www.django-rest-framework.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_|_Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Auth](https://img.shields.io/badge/Auth-JWT_SimpleJWT-black?style=flat-square&logo=json-web-tokens)](https://jwt.io/)
[![Testing](https://img.shields.io/badge/Testing-pytest--django-0A9EDC?style=flat-square&logo=pytest)](https://docs.pytest.org/)

**SplitEase** is a full-stack financial expense tracking and group debt simplification web platform. It enables users to track shared group expenses across multiple splitting models, maintain financial balance integrity, simplify complex multi-person debts using a graph reduction algorithm, and maintain an immutable record of settlements.

---

## 📌 Problem Statement

Managing group expenses (e.g., shared rent, group trips, household utilities) often leads to manual calculation errors, floating-point rounding discrepancies, and redundant payment transactions between multiple members. 

**SplitEase** resolves these problems by providing:
1. **Mathematical Financial Accuracy**: Eliminates floating-point error using Python `Decimal` fixed-point arithmetic.
2. **Optimal Debt Simplification**: Reduces $N$-person debt matrices to the minimal number of direct debt transfers.
3. **Transactional Integrity**: Uses PostgreSQL atomic transactions to guarantee consistency across settlements and balance updates.

---

## ✨ Key Features

- **User Authentication & Authorization**:
  - Secure JWT authentication (`djangorestframework-simplejwt`) with token refresh mechanisms.
  - Protected API routes and object-level permissions ensuring users access only their own groups and transactions.

- **Group & Member Management**:
  - Group creation and member invitation by username or email.
  - Role-based membership management (`ADMIN` and `MEMBER`).

- **Financial Calculation Engine**:
  - **Equal Split**: Evenly divides total expense among members with exact penny discrepancy resolution.
  - **Exact Split**: Enforces strict validation that individual dollar amounts sum precisely to total expense.
  - **Percentage Split**: Validates percentage allocations sum exactly to 100.00%.
  - **Shares Split**: Proportional distribution based on integer share ratios.

- **Greedy Debt Simplification Algorithm**:
  - Centralized graph reduction service converting multi-party debt obligations into minimal required direct payments.

- **Settlement & Audit Trail**:
  - Validates zero/negative amount prevention, self-settlement protection, and over-settlement boundaries.
  - Atomic transaction blocks (`@transaction.atomic`) for debt record creation.

- **Interactive Analytics & API Documentation**:
  - Visual category distribution (pie chart) and spending trend metrics (bar chart) using Recharts.
  - Interactive OpenAPI 3.0 / Swagger documentation powered by `drf-spectacular`.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React 18 + Vite                      │
│        (React Router, Axios Interceptors, Recharts)     │
└────────────────────────────┬────────────────────────────┘
                             │ REST API / JWT
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 Django REST Framework                   │
│  ┌───────────────┬───────────────────┬───────────────┐  │
│  │ Expense Engine│ Debt Simplifier   │  JWT Auth     │  │
│  │ (Decimal Math)│ (Min Cash Flow)   │ (Permissions) │  │
│  └───────────────┴───────────────────┴───────────────┘  │
└────────────────────────────┬────────────────────────────┘
                             │ PostgreSQL / Transactional
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                   │
│   (Users, Groups, Expenses, ExpenseShares, Settlements) │
└─────────────────────────────────────────────────────────┘
```

---

## 🧮 Debt Simplification Algorithm

Located in `backend/apps/groups/services.py`, SplitEase implements the **Greedy Minimum Cash Flow** algorithm:

1. **Calculate Net Balances**:
   $$\text{Net Balance}_i = (\sum \text{Paid}_i) - (\sum \text{Owed}_i) + (\sum \text{Received}_i) - (\sum \text{Settled}_i)$$
2. **Partition Members**:
   - Debtors ($\text{Net Balance} < 0$, sorted by highest debt magnitude).
   - Creditors ($\text{Net Balance} > 0$, sorted by highest credit magnitude).
3. **Greedy Settlement Match**:
   - Match max debtor with max creditor.
   - Transfer amount $T = \min(-\text{debtor\_balance}, \text{creditor\_balance})$.
   - Adjust remaining balances and repeat until all net balances equal zero.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons
- **Backend**: Python 3.10+, Django 5.2, Django REST Framework 3.18, SimpleJWT, DRF Spectacular
- **Database**: PostgreSQL
- **Testing**: pytest, pytest-django

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Environment Setup
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Run Migrations
python manage.py migrate

# Seed Seed Data (Creates Demo Accounts)
python manage.py seed_data

# Run Backend Development Server
python manage.py runserver 127.0.0.1:8000
```

### 2. Running Automated Tests
```bash
cd backend
pytest
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite server
npm run dev
```

The application will be accessible at:
- **Frontend App**: `http://127.0.0.1:5173`
- **Backend REST API**: `http://127.0.0.1:8000/api/`
- **Swagger Documentation**: `http://127.0.0.1:8000/api/docs/`

---

## 🔒 Seed Demo Accounts

> [!NOTE]
> All demo accounts share the password: `Password123`  
> *(Note: This password is used exclusively for local dummy seed testing data).*

| Email | Username | Role in Demo |
|---|---|---|
| `rahul@example.com` | `rahul` | Admin (Goa Trip, Flat 402) |
| `amit@example.com` | `amit` | Member (Goa Trip, Flat 402) |
| `priya@example.com` | `priya` | Member (Goa Trip, Flat 402) |
| `mohit@example.com` | `mohit` | Member (Goa Trip) |

---

## 🔮 Future Enhancements

- **Receipt OCR Integration**: Automated field extraction from uploaded expense receipts.
- **Recurring Expenses**: Automated monthly recurring schedule for apartment rent and utilities.
- **Multi-Currency Support**: Real-time currency exchange rates for multi-country travel expenses.

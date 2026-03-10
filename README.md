<div align="center">

# AI Finance

**AI-powered personal finance platform**

[![Django](https://img.shields.io/badge/Django_5.1-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com)

[Live Demo](https://ai-finance-delta.vercel.app) — login with `demo` / `demo123`, no sign up needed.

</div>

---

## Overview

AI Finance lets you track transactions, detect unusual spending, and predict next month's expenses — all backed by real scikit-learn ML models running server-side. No paid AI APIs.

Built with Django on the backend, Next.js on the frontend, and PostgreSQL on Neon for the database.

---

## Features

**Dashboard** — monthly spending summary, category breakdown (pie chart), monthly trend (bar chart), budget usage indicator.

**Transactions** — add transactions manually or bulk-import from a CSV. Supports both standard CSV and bank statement format with automatic column detection.

**Anomaly Detection** — Isolation Forest flags transactions that are statistically unusual compared to your spending history. A ₹9,000 charge when everything else is ₹200–500 gets caught automatically.

**Expense Prediction** — Linear Regression trains on your monthly totals and estimates next month's spending.

**Auto Category** — TF-IDF + Logistic Regression reads the transaction description and picks the right category automatically. Runs whenever category is left as "Other".

**Budget Alerts** — set a monthly budget, get a warning at 80% and an alert when you go over.

**Demo Account** — pre-loaded with 3 months of data and a built-in anomaly. Read-only so the data stays consistent for everyone.

**Dark Mode** — full dark/light toggle, saved to localStorage.

**Mobile Responsive** — slide-in sidebar, works on any screen size.

---

## Tech Stack

```
Frontend        Backend                 ML                      Database
────────        ───────                 ──                      ────────
Next.js 15      Django 5.1              Isolation Forest        PostgreSQL
TypeScript      Django REST Framework   Linear Regression       Neon (serverless)
TailwindCSS v4  SimpleJWT               TF-IDF + LogReg
Recharts        Gunicorn + Whitenoise   scikit-learn, pandas
```

---

## Architecture

```
Browser / Mobile
    Next.js 15 + TailwindCSS
         |
         |  HTTPS + JWT
         v
    Django REST API
    ┌─────────────────────────────────────────┐
    │  /transactions/     /anomalies/         │
    │  /upload-csv/       /predictions/       │
    │  /budget-alert/     /dashboard-summary/ │
    └────────────┬───────────────┬────────────┘
                 |               |
         PostgreSQL          scikit-learn
          (Neon)              Isolation Forest
                              Linear Regression
                              TF-IDF + Logistic Reg.
```

---

## ML Models

<details>
<summary>Anomaly Detection — Isolation Forest</summary>

<br>

Randomly partitions data points. Points that get isolated in fewer splits are flagged as outliers.

```
Transactions: ₹220  ₹180  ₹350  ₹300  ₹9200
                                        ↑
                              isolated quickly = anomaly
```

- Contamination: `0.2`
- Minimum 5 transactions required

</details>

<details>
<summary>Expense Prediction — Linear Regression</summary>

<br>

Sums transactions per month, fits a line through the monthly totals, extends it one step forward.

```
Jan ₹2,430  →
Feb ₹2,880  →  fit line  →  Apr estimate: ₹3,540
Mar ₹3,190  →
```

- Minimum 2 months of data required
- Falls back to last month's total if trend goes negative

</details>

<details>
<summary>Auto Categorization — TF-IDF + Logistic Regression</summary>

<br>

Converts the description to a TF-IDF vector, classifies it with Logistic Regression. Trained on common Indian transaction descriptions.

| Description | Category |
|---|---|
| Swiggy dinner order | Food |
| Uber ride to office | Transport |
| Amazon electronics | Shopping |
| Apollo pharmacy | Health |
| Electricity bill | Utilities |
| Netflix subscription | Entertainment |

</details>

---

## Project Structure

<details>
<summary>Expand</summary>

```
Ai-Finance/
├── backend/
│   ├── finance_ai/
│   │   ├── settings.py              # Django config, JWT, CORS, Whitenoise
│   │   └── urls.py
│   ├── transactions/
│   │   ├── models.py                # Transaction + Budget
│   │   ├── views.py                 # Auth, CRUD, budget alert
│   │   ├── serializers.py           # Validation (future date check etc.)
│   │   ├── csv_upload.py            # CSV + bank statement parser
│   │   └── management/commands/
│   │       └── create_demo_user.py  # Seeds demo account on every deploy
│   ├── ml_models/
│   │   ├── anomaly.py
│   │   ├── prediction.py
│   │   ├── category_classifier.py
│   │   └── views.py
│   ├── build.sh                     # Render: install → migrate → seed demo
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── dashboard/page.tsx
    │   ├── transactions/page.tsx
    │   ├── ai-insights/page.tsx
    │   ├── faq/page.tsx
    │   └── login/page.tsx
    ├── components/
    │   ├── Sidebar.tsx              # Responsive, mobile slide-in
    │   └── ThemeProvider.tsx
    └── services/api.ts              # Axios + JWT interceptors
```

</details>

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=finance_ai_db
DB_USER=finance_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Set up the database:

```sql
CREATE DATABASE finance_ai_db;
CREATE USER finance_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finance_ai_db TO finance_user;
```

```bash
python manage.py migrate
python manage.py create_demo_user
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

```bash
npm run dev
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| POST | `/api/register/` | | Create account |
| POST | `/api/login/` | | Login, returns JWT |
| GET | `/api/transactions/` | ✓ | List transactions |
| POST | `/api/transactions/` | ✓ | Add transaction |
| DELETE | `/api/transactions/<id>/` | ✓ | Delete transaction |
| POST | `/api/upload-csv/` | ✓ | Bulk import via CSV |
| GET | `/api/budget-alert/` | ✓ | Get budget and warning |
| POST | `/api/budget-alert/` | ✓ | Set monthly budget |
| GET | `/api/dashboard-summary/` | ✓ | This month's stats + prediction |
| GET | `/api/anomalies/` | ✓ | Flagged transactions |
| GET | `/api/predictions/` | ✓ | Monthly history + next month estimate |

---

## CSV Format

Standard:

```csv
amount,description,category,date
500,Grocery shopping,food,2026-03-01
1200,Electricity bill,utilities,2026-03-05
```

Bank statement (auto-detected when `date`, `details`, `debit` columns are present):

```csv
date,details,debit,credit,balance
01/03/2026,SWIGGY ORDER,350,,12500
03/03/2026,UBER TRIP,180,,12320
```

Future-dated rows are skipped. Invalid rows are reported in the response without stopping the import.

---

## Demo Account

Seeded automatically on every deploy via `python manage.py create_demo_user`.

| | |
|---|---|
| Username | `demo` |
| Password | `demo123` |
| Transactions | 23 across Jan–Mar 2026 |
| Categories | All 6 covered |
| Anomaly | ₹9,200 flight booking (flagged by Isolation Forest) |
| Budget | ₹5,000/month pre-set |

Read-only. Any write attempt returns: *"This is a demo account. Create your own account for real interactions."*

---

## Deployment

| | Platform | Notes |
|---|---|---|
| Backend | Render | Python 3.11 pinned via `.python-version`. `build.sh` handles install, migrate, and demo seed. |
| Database | Neon PostgreSQL | Free tier with no 90-day expiry. SSL enabled via `sslmode=require`. |
| Frontend | Vercel | Set `NEXT_PUBLIC_API_URL` to your Render backend URL in environment variables. |

---

## Roadmap

- [ ] SMS transaction parsing
- [ ] Recurring expense detection
- [ ] UPI transaction auto-import
- [ ] AI savings advisor

---

## License

MIT

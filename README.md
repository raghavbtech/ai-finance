# AI Finance — AI-Powered Personal Finance Platform

A full-stack personal finance management app with machine learning features: anomaly detection, expense prediction, and automatic transaction categorization.

The idea came from wanting to understand where my money actually goes each month, and whether any transaction looks suspicious compared to my usual spending patterns.

> **Try it instantly** — use `demo` / `demo123` on the login page. No sign up needed.

---

## Features

- **Dashboard** — monthly spending summary, category breakdown (pie chart), monthly trend (bar chart), budget alerts
- **Transactions** — add, delete, and manage transactions; CSV upload with bank statement auto-detection
- **AI Insights** — Isolation Forest anomaly detection + Linear Regression expense prediction
- **Auto Category** — TF-IDF + Logistic Regression classifies transactions from description automatically
- **Budget Alerts** — set a monthly budget, get warnings at 80% and 100% usage
- **Demo Account** — pre-loaded with 3 months of realistic data; read-only so the data stays intact for everyone
- **Dark Mode** — full dark/light theme toggle, persisted to localStorage
- **Mobile Responsive** — slide-in sidebar, responsive layouts for all screen sizes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS v4, Recharts |
| Backend | Django 5.1, Django REST Framework, SimpleJWT |
| Database | PostgreSQL (Neon — serverless, free forever) |
| ML | scikit-learn — Isolation Forest, Linear Regression, TF-IDF + Logistic Regression |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Project Structure

```
Ai-Finance/
├── backend/
│   ├── finance_ai/          # Django project config (settings, urls)
│   ├── transactions/        # Transaction & Budget models, API views, CSV upload
│   │   └── management/
│   │       └── commands/
│   │           └── create_demo_user.py   # Seeds demo account on deploy
│   ├── ml_models/           # Anomaly detection, expense prediction, category classifier
│   ├── build.sh             # Render build script (install, migrate, seed demo)
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── dashboard/       # Main dashboard with charts and budget
    │   ├── transactions/    # Transaction management + CSV upload
    │   ├── ai-insights/     # ML anomaly detection + prediction views
    │   ├── faq/             # FAQ accordion
    │   └── login/           # Auth page with one-click demo button
    ├── components/
    │   ├── Sidebar.tsx      # Responsive sidebar with mobile slide-in
    │   └── ThemeProvider.tsx
    └── services/
        └── api.ts           # Axios instance with JWT interceptors
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL

### 1. Clone the repo

```bash
git clone https://github.com/raghavbtech/ai-finance.git
cd ai-finance
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=finance_ai_db
DB_USER=finance_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Create the PostgreSQL database:

```sql
CREATE DATABASE finance_ai_db;
CREATE USER finance_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finance_ai_db TO finance_user;
```

Run migrations, seed the demo user, and start the server:

```bash
python manage.py migrate
python manage.py create_demo_user
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Demo Account

The demo account is automatically seeded on every deploy via the `create_demo_user` management command. It contains:

- 23 transactions across January–March 2026
- All 6 categories represented (Food, Transport, Shopping, Entertainment, Health, Utilities)
- One ₹9,200 anomaly (flight booking) that gets flagged by Isolation Forest
- A ₹5,000 monthly budget pre-configured

The demo account is **read-only**. Any attempt to add, delete, or upload transactions returns:
> *"This is a demo account. Create your own account for real interactions."*

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register/` | Create account |
| POST | `/api/login/` | Login, returns JWT token |
| GET/POST | `/api/transactions/` | List or add transactions |
| DELETE | `/api/transactions/<id>/` | Delete a transaction |
| POST | `/api/upload-csv/` | Bulk import via CSV |
| GET/POST | `/api/budget-alert/` | Get or set monthly budget |
| GET | `/api/dashboard-summary/` | Current month stats + prediction |
| GET | `/api/anomalies/` | Flagged unusual transactions |
| GET | `/api/predictions/` | Monthly history + next month estimate |

---

## CSV Format

Standard format:

```
amount,description,category,date
500,Grocery shopping,food,2026-03-01
1200,Electricity bill,utilities,2026-03-05
9000,New phone,shopping,2026-03-10
```

Bank statement format is also supported — if your CSV has `date`, `details`, `debit`, `credit`, `balance` columns, the app auto-detects it and imports only debit rows.

---

## How the ML Works

**Anomaly Detection** — Isolation Forest trained on the user's transaction amounts. Flags anything statistically unusual. A ₹9,000 transaction when everything else is ₹300–800 gets flagged. Requires at least 5 transactions.

**Expense Prediction** — Groups transactions by month, fits a Linear Regression model on the monthly totals, and extends the trend to predict next month. Requires data across at least 2 different months.

**Auto Category Detection** — TF-IDF vectorizer converts the transaction description to a numeric vector, then Logistic Regression classifies it. Trained on common Indian transaction descriptions like "Swiggy order" → Food, "Uber ride" → Transport, "Amazon purchase" → Shopping.

---

## Deployment

- **Backend** — Render Web Service, Python 3.11 (pinned via `.python-version`), `build.sh` runs install + migrate + demo seed
- **Database** — Neon PostgreSQL (free tier, no 90-day expiry)
- **Frontend** — Vercel, set `NEXT_PUBLIC_API_URL` environment variable to your Render backend URL

---

## Roadmap

- SMS transaction parsing
- Recurring expense detection
- UPI transaction auto-import
- AI savings advisor

---

## License

MIT

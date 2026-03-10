# AI Financial Intelligence Platform

A full-stack web app for managing personal finances with AI-powered insights.
Built with Django, Next.js, and scikit-learn.

The idea came from wanting to understand where my money actually goes each month,
and whether any transaction looks suspicious compared to my usual spending patterns.

---

## What it does

- Add transactions manually or upload a CSV from your bank
- Dashboard shows spending breakdowns and monthly trends
- AI detects unusual transactions (e.g. a ₹9000 purchase when you usually spend ₹300-800)
- Predicts next month's spending based on your history
- Set a monthly budget and get warned when you're close to hitting it
- Auto-detects transaction category from the description (e.g. "Swiggy order" → Food)

---

## Tech Stack

**Frontend** — Next.js, TailwindCSS, Recharts

**Backend** — Django, Django REST Framework, JWT authentication

**ML** — scikit-learn (Isolation Forest, Linear Regression, TF-IDF + Logistic Regression)

**Database** — PostgreSQL

---

## Project Structure

```
Ai-Finance/
├── backend/
│   ├── finance_ai/         # Django project config
│   ├── transactions/       # Transaction model, auth, CSV upload, budget
│   └── ml_models/          # Anomaly detection, prediction, category classifier
└── frontend/
    ├── app/                # Next.js pages (login, dashboard, transactions, ai-insights)
    ├── components/         # Navbar
    └── services/           # Axios API client
```

---

## Getting Started

### Prerequisites

- Python 3.10+
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

Create a `.env` file in the `backend/` folder:

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

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register/` | Create account |
| POST | `/api/login/` | Login, returns JWT token |
| GET/POST | `/api/transactions/` | List or add transactions |
| DELETE | `/api/transactions/<id>/` | Delete a transaction |
| POST | `/api/upload-csv/` | Bulk import via CSV |
| GET | `/api/anomalies/` | Get flagged transactions |
| GET | `/api/predictions/` | Get next month prediction |
| GET | `/api/dashboard-summary/` | Summary stats for dashboard |
| GET/POST | `/api/budget-alert/` | Get or set monthly budget |

---

## CSV Format

To upload transactions via CSV, the file must have these columns:

```
amount,description,category,date
500,Grocery shopping,food,2026-03-01
1200,Electricity bill,utilities,2026-03-05
9000,New phone,shopping,2026-03-10
```

Dates must not be in the future. Invalid rows are skipped and reported in the response.

---

## How the ML works

**Anomaly Detection**
Uses Isolation Forest from scikit-learn. It trains on the user's transaction amounts and flags anything that's statistically unusual. A ₹9000 transaction when everything else is ₹300-800 will get flagged.

**Expense Prediction**
Groups transactions by month, then fits a Linear Regression model on the monthly totals. Predicts the next month by extending the trend line.

**Auto Category Detection**
A TF-IDF vectorizer converts the transaction description into a numeric vector, then a Logistic Regression classifier predicts the category. Trained on common Indian transaction descriptions like "Swiggy order", "Uber ride", "Amazon purchase", etc.

---

## Screenshots

*(coming soon)*

---

## Roadmap

Things I want to add next:

- SMS transaction parsing
- Recurring expense detection
- UPI transaction auto-import
- AI savings advisor

---

## License

MIT

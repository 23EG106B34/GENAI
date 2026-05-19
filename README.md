# Expense Tracker

A full-stack expense tracking application with a **Node.js / Express** REST API backed by **MongoDB**, and a **React (Vite)** dashboard styled with **Tailwind CSS** and **Recharts**.

## Features

- **Dashboard** — total balance, income, and expenses at a glance
- **Transactions** — add income or expense entries with title, amount, category, and date
- **History** — recent transaction list with one-click delete
- **Charts** — responsive bar chart (income vs expenses) and pie chart (expenses by category)
- **Bill Upload (React)** — upload images or PDFs; OCR scans the bill, detects the type, and shows relevant details (nutrition for food, units/savings for utilities, fuel liters for transport, etc.)
- **API** — full CRUD with controller / model / route architecture and centralized error handling

## Project Structure

```
genai/
├── README.md
├── backend/
│   ├── config/db.js
│   ├── controllers/transactionController.js
│   ├── middleware/asyncHandler.js
│   ├── middleware/errorHandler.js
│   ├── models/Transaction.js
│   ├── routes/transactionRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/transactions.js
    │   ├── components/ (BillUpload, BillAnalysisResult, …)
    │   ├── utils/ (ocrService.js, billAnalyzer.js)
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string

## Installation

### 1. Clone or open the project

```bash
cd genai
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable     | Description                          | Example                                      |
|-------------|--------------------------------------|----------------------------------------------|
| `PORT`      | API server port                      | `5000`                                       |
| `MONGODB_URI` | MongoDB connection string          | `mongodb://127.0.0.1:27017/expense-tracker`  |
| `NODE_ENV`  | Environment (`development` / `production`) | `development`                            |
| `OPENAI_API_KEY` | Optional — improves receipt scan accuracy | — |
| `OPENAI_MODEL` | OpenAI model for receipt parsing | `gpt-4o-mini` |

Start the API:

```bash
npm run dev
```

The server runs at **http://localhost:5000**.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173**. Vite proxies `/api` requests to the backend automatically.

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/expense-tracker
NODE_ENV=development
```

For **MongoDB Atlas**, replace `MONGODB_URI` with your cluster URI:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/expense-tracker
```

### Frontend

No required env vars for local development. The Vite dev server proxies API calls to `http://localhost:5000`.

## Bill Upload & Auto-Save

The **Upload Bill / Receipt** section runs in React and **automatically saves** to your account:

1. Drop or browse an **image** (JPG, PNG, WebP) or **PDF** (max 10 MB).
2. **Tesseract.js** performs OCR in the browser to extract text.
3. **billAnalyzer** classifies the bill and parses type-specific fields.
4. **Auto-saves** a transaction (expense or income) and stores extracted details in MongoDB.
5. **Updates** balance, total income/salary, and total expenses on the dashboard instantly.
6. Shows **before → after** totals and all extracted file details.

**Salary slips / payslips** are detected as **income** and increase total income. All other bills are recorded as **expenses**.

You can **Undo** any applied bill from the upload card or the recent applied bills list.

| Bill type | Details extracted |
|-----------|-------------------|
| Food & Dining | Calories, protein, fat, carbs, fiber, sugar, total |
| Electricity / Water / Gas | Units (kWh), current bill, savings (₹), meter readings, due date |
| Transport & Fuel | Liters, rate per liter, vehicle no, total |
| Healthcare | Patient, doctor, medicines, total |
| Shopping / Others | Subtotal, tax, discount, total, invoice no |

### Receipt scan (auto-fill form)

Inside **Add Transaction**, drop a receipt image. The backend runs OCR and returns structured fields for you to review and save.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/receipts/scan` | Upload image (`receipt` field), returns vendor, amount, category, date |

**Response example:**
```json
{
  "vendorName": "KFC",
  "totalAmount": 450,
  "category": "Food",
  "date": "2026-05-19",
  "type": "expense",
  "confidence": "high"
}
```

Uses **Tesseract.js** on the server by default. Set `OPENAI_API_KEY` in `backend/.env` for smarter parsing via GPT-4o-mini.

### Bill API (auto-save)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bills/apply` | Save bill scan + create linked transaction |
| GET | `/api/bills` | List recent applied bills |
| DELETE | `/api/bills/:id` | Undo bill (removes transaction + scan record) |

> **Tip:** Use clear, well-lit photos. Packaged food labels show nutrition facts; restaurant receipts usually show totals only. OCR accuracy depends on image quality.

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/health`               | Health check             |
| GET    | `/api/transactions`         | List all transactions    |
| GET    | `/api/transactions/summary` | Balance, income, expenses |
| GET    | `/api/transactions/:id`     | Get one transaction      |
| POST   | `/api/transactions`         | Create transaction       |
| PUT    | `/api/transactions/:id`     | Update transaction       |
| DELETE | `/api/transactions/:id`     | Delete transaction       |

### Create transaction body

```json
{
  "title": "Grocery shopping",
  "amount": 85.50,
  "category": "Food",
  "type": "expense",
  "date": "2026-05-19"
}
```

`type` must be `"income"` or `"expense"`.

## Production Build

```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend
cd backend
npm start
```

Serve the frontend `dist/` folder with any static host, and point API requests to your deployed backend URL (update Vite proxy or use a reverse proxy in production).

## Tech Stack

| Layer    | Technologies                          |
|----------|---------------------------------------|
| Backend  | Node.js, Express, Mongoose, MongoDB   |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Tesseract.js, pdfjs-dist |
| Tooling  | ES Modules, async/await error handling |

## License

MIT

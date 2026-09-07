# ParseToLedger — Invoice-to-Accounting Sync

Automate invoice processing: upload a PDF invoice, extract structured accounting data using an LLM, and synchronize the result into Google Sheets.

## Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | React, Vite, JavaScript                          |
| Backend  | Node.js, Express, dotenv, CORS                   |
| Services | LLM API _(future)_, Google Sheets API _(future)_ |

## Project Structure

```
ParseToLedger/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js      # API service layer
│   │   ├── App.jsx          # Main application component
│   │   ├── App.css          # Application styles
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # Entry point
│   ├── .env.example
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js       # Environment configuration
│   │   ├── controllers/
│   │   │   └── healthController.js
│   │   ├── routes/
│   │   │   └── healthRoutes.js
│   │   ├── middleware/
│   │   │   └── errorMiddleware.js
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18+ and npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd ParseToLedger
   ```

2. **Install server dependencies**

   ```bash
   cd server
   cp .env.example .env
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd client
   cp .env.example .env
   npm install
   ```

### Environment Variables

#### Server (`server/.env`)

| Variable     | Default                 | Description              |
| ------------ | ----------------------- | ------------------------ |
| `PORT`       | `5000`                  | Server port              |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |

#### Client (`client/.env`)

| Variable       | Default                 | Description      |
| -------------- | ----------------------- | ---------------- |
| `VITE_API_URL` | `http://localhost:5000` | Backend base URL |

### Running the Application

**Start the backend:**

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`.

**Start the frontend** (in a separate terminal):

```bash
cd client
npm run dev
```

The app will open at `http://localhost:5173`.

## API Endpoints

### Health Check

```
GET /api/health
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice Accounting Sync API is running"
}
```

## Current Phase

**Phase 1 — Project Foundation** ✅

- Express backend with health endpoint
- React frontend with backend connection status
- Environment variable configuration
- Centralized error handling
- Modular project structure ready for extension

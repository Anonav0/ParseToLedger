# ParseToLedger — Invoice-to-Accounting Sync

Automate invoice processing: upload a PDF invoice, extract text, convert it to structured accounting data with Google Gemini AI, validate it using Zod and business math rules, and synchronize the verified result into Google Sheets ERP.

---

## Tech Stack

| Layer                | Technology                                                    |
| -------------------- | ------------------------------------------------------------- |
| **Frontend**         | React, Vite, JavaScript, CSS3                                 |
| **Backend**          | Node.js (ES Modules), Express, Multer, dotenv, CORS           |
| **PDF Extraction**   | `pdf-parse` (in-memory buffer parsing)                        |
| **AI / LLM**         | `@google/genai` (Google Gemini with structured output schema) |
| **Validation**       | `zod` (runtime schema) + Business arithmetic reconciliation   |
| **Accounting / ERP** | `googleapis` (Google Sheets v4 API with Service Account JWT)  |

---

## Project Structure

```text
ParseToLedger/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── InvoiceUploader.jsx
│   │   │   ├── InvoiceUploader.css
│   │   │   └── InvoiceResult.jsx
│   │   ├── services/
│   │   │   └── api.js          # API communication layer
│   │   ├── App.jsx             # Top-level shell
│   │   ├── App.css
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js          # Environment variable loading
│   │   │   └── google.js       # Google Sheets auth client
│   │   ├── controllers/
│   │   │   ├── healthController.js
│   │   │   └── invoiceController.js
│   │   ├── routes/
│   │   │   ├── healthRoutes.js
│   │   │   └── invoiceRoutes.js
│   │   ├── services/
│   │   │   ├── pdfService.js
│   │   │   ├── invoiceExtractionService.js
│   │   │   ├── invoiceValidationService.js
│   │   │   └── googleSheetsService.js
│   │   ├── schemas/
│   │   │   └── invoiceSchema.js # Zod and GenAI schemas
│   │   ├── middleware/
│   │   │   ├── uploadMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── .env.example
│   └── package.json
│
├── .docs/
│   └── walkthroughs/           # Comprehensive phase-by-phase walkthroughs
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **Google Gemini API Key** (from Google AI Studio)
- **Google Cloud Service Account** with Google Sheets API enabled

---

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
   cd ../client
   cp .env.example .env
   npm install
   ```

---

## Google Cloud Service Account Setup

To connect Google Sheets for automated accounting synchronization:

1. **Create or Select a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project (e.g. `parsetoledger-erp`) or select an existing one.

2. **Enable Google Sheets API**:
   - Navigate to **APIs & Services** > **Library**.
   - Search for **Google Sheets API** and click **Enable**.

3. **Create a Service Account**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **Service Account**.
   - Name it `parsetoledger-sync` and click **Done**.

4. **Generate JSON Key**:
   - Click on the newly created service account.
   - Go to the **Keys** tab, click **Add Key** > **Create new key**, and select **JSON**.
   - Download the file and open it.

5. **Share Your Google Sheet**:
   - Create a new Google Sheet (or open an existing one).
   - Click the **Share** button in Google Sheets.
   - Add the service account's email address (e.g. `parsetoledger-sync@your-project.iam.gserviceaccount.com`) with **Editor** role.
   - Note the spreadsheet ID from the URL:
     `https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID>`**`/edit`

6. **Configure `server/.env`**:
   Fill in the downloaded credentials into `server/.env`:

   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173
   MAX_FILE_SIZE_MB=10

   # AI / LLM Configuration
   LLM_API_KEY=your_gemini_api_key_here
   LLM_MODEL=gemini-2.5-flash

   # Google Sheets ERP Configuration
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_CLIENT_EMAIL=parsetoledger-sync@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvg...==\n-----END PRIVATE KEY-----\n"
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
   GOOGLE_SHEET_NAME=Sheet1
   ```

---

## Running the Application

1. **Start the backend:**

   ```bash
   cd server
   npm run dev
   ```

   The backend will start on `http://localhost:5000`.

2. **Start the frontend:**
   ```bash
   cd client
   npm run dev
   ```
   The application will open on `http://localhost:5173`.

---

## API Endpoints

### 1. Health Check

```http
GET /api/health
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice Accounting Sync API is running"
}
```

### 2. Process & Sync Invoice

```http
POST /api/invoices/process
Content-Type: multipart/form-data
Body: file=<invoice.pdf>
```

**Response:**

```json
{
  "success": true,
  "message": "Invoice processed and synced successfully",
  "invoice": {
    "vendor": "Acme Supplies Ltd",
    "invoiceNumber": "INV-1001",
    "invoiceDate": "2026-09-01",
    "currency": "USD",
    "lineItems": [
      {
        "description": "Widget A",
        "quantity": 2,
        "unitPrice": 500,
        "amount": 1000
      }
    ],
    "subtotal": 1000,
    "tax": 180,
    "totalAmount": 1180
  },
  "sync": {
    "status": "success",
    "destination": "Google Sheets",
    "processedAt": "2026-09-07T22:45:00.000Z"
  }
}
```

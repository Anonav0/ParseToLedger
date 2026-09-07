# ParseToLedger — Invoice-to-Accounting Sync

An AI-powered, full-stack invoice processing and accounting automation engine. **ParseToLedger** enables finance teams and businesses to upload PDF invoices, automatically extract structured accounting data using Google Gemini, rigorously validate line-item math and schemas using Zod, and synchronize verified ledgers into Google Sheets in real time.

---

## Architecture & Workflow

```text
       ┌────────────────────────┐
       │   React Dashboard UI   │ (Drag & drop PDF, 5-stage tracker)
       └───────────┬────────────┘
                   │  POST /api/invoices/process (multipart/form-data)
                   ▼
       ┌────────────────────────┐
       │     Express.js API     │ (CORS, Multer memory storage, request logger)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │       PDF Parser       │ (pdf-parse: In-memory text extraction)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │   Gemini LLM Engine    │ (@google/genai: Structured JSON extraction)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │   Invoice Validation   │ (Zod schema + Business arithmetic reconciliation)
       └───────────┬────────────┘
                   │  (CRITICAL: Invalid invoices NEVER reach Google Sheets)
                   ▼
       ┌────────────────────────┐
       │   Google Sheets Sync   │ (googleapis: Service Account JWT append)
       └───────────┬────────────┘
                   │
                   ▼
       ┌────────────────────────┐
       │   React Result View    │ (Checklist, Line items table, Prominent total)
       └────────────────────────┘
```

---

## Tech Stack

| Layer                | Technology                            | Purpose                                                                        |
| :------------------- | :------------------------------------ | :----------------------------------------------------------------------------- |
| **Frontend UI**      | React 19, Vite, JavaScript, CSS3      | Minimalist SaaS dashboard, drag-and-drop dropzone, live progress tracker       |
| **Backend API**      | Node.js (ES Modules), Express, Multer | RESTful API, memory storage, centralized error handling, structured logging    |
| **PDF Extraction**   | `pdf-parse`                           | In-memory text extraction with zero disk retention                             |
| **AI / LLM**         | `@google/genai` (Gemini 2.5 Flash)    | Structured JSON extraction with system instructions and strict schemas         |
| **Validation**       | `zod` + Custom Business Logic         | Two-tier validation: structural types + line-item & totals reconciliation math |
| **Accounting / ERP** | `googleapis` (Sheets API v4)          | Automated header provisioning, multi-line item cells, and atomic row appending |

---

## Project Structure

```text
ParseToLedger/
├── client/                             # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmptyState.jsx          # Drag-and-drop upload dropzone
│   │   │   ├── ProcessingSteps.jsx     # 5-stage sequential processing tracker
│   │   │   ├── InvoiceResult.jsx       # Structured invoice view & status checklist
│   │   │   ├── LineItemsTable.jsx      # Responsive line-items table with word wrap
│   │   │   ├── TotalSummary.jsx        # Subtotal, Tax, and prominent Grand Total
│   │   │   ├── SyncStatus.jsx          # Google Sheets synchronization banner
│   │   │   ├── ErrorState.jsx          # Dedicated error view with atomic retry
│   │   │   ├── InvoiceUploader.jsx     # Orchestrates UI states (EMPTY, SELECTED, etc.)
│   │   │   └── InvoiceUploader.css     # Clean SaaS design system
│   │   ├── services/
│   │   │   └── api.js                  # API client with HTTP status mapping
│   │   ├── App.jsx                     # Top-level shell with connection status pill
│   │   ├── App.css                     # App typography and responsive container
│   │   └── main.jsx                    # Application bootstrap
│   ├── .env.example                    # Client environment template
│   └── package.json
│
├── server/                             # Express backend API
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                  # Environment variable validation & loading
│   │   │   └── google.js               # Google Cloud service account JWT client
│   │   ├── controllers/
│   │   │   ├── healthController.js     # Health check endpoint controller
│   │   │   └── invoiceController.js    # End-to-end pipeline orchestrator
│   │   ├── routes/
│   │   │   ├── healthRoutes.js         # GET /api/health
│   │   │   └── invoiceRoutes.js        # POST /api/invoices/process
│   │   ├── services/
│   │   │   ├── pdfService.js           # PDF parsing with memory isolation
│   │   │   ├── invoiceExtractionService.js # Gemini extraction with 30s timeout
│   │   │   ├── invoiceValidationService.js # Zod and business math validator
│   │   │   └── googleSheetsService.js  # Sheets sync with 25s timeout & error mapping
│   │   ├── schemas/
│   │   │   └── invoiceSchema.js        # Zod schema and GenAI Type schema definitions
│   │   ├── middleware/
│   │   │   ├── uploadMiddleware.js     # Multer 10MB memory storage filter
│   │   │   ├── loggerMiddleware.js     # Lightweight operational request logger
│   │   │   └── errorMiddleware.js      # Centralized error handler & status mapper
│   │   ├── app.js                      # Express app setup & CORS policy
│   │   └── server.js                   # Server bootstrap & startup validation
│   ├── .env.example                    # Server environment template
│   └── package.json
│
├── .docs/
│   └── walkthroughs/                   # Detailed phase-by-phase architectural guides
├── .gitignore
├── .env.example                        # Root environment template
└── README.md                           # Project documentation
```

---

## Prerequisites

- **Node.js** v18 or later (tested on Node.js v24)
- **npm** v9 or later
- **Google Gemini API Key** (obtain free from [Google AI Studio](https://aistudio.google.com/))
- **Google Cloud Platform Project** with a Service Account and Google Sheets API enabled

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Anonav0/ParseToLedger.git
cd ParseToLedger
```

### 2. Configure Backend Environment

```bash
cd server
cp .env.example .env
npm install
```

Edit `server/.env` with your API keys and credentials:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
MAX_FILE_SIZE_MB=10

# AI / LLM Configuration
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash

# Google Sheets ERP Configuration
GOOGLE_PROJECT_ID=your_gcp_project_id
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkq...==\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_google_spreadsheet_id_here
GOOGLE_SHEET_NAME=Sheet1
```

### 3. Configure Frontend Environment

```bash
cd ../client
cp .env.example .env
npm install
```

Ensure `client/.env` points to the backend API:

```env
VITE_API_URL=http://localhost:5000
```

---

## Google Cloud Service Account Setup

To enable automated synchronization with Google Sheets:

1. **Create/Select a GCP Project**:
   - Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. **Enable Google Sheets API**:
   - Navigate to **APIs & Services $\rightarrow$ Library**, search for **Google Sheets API**, and click **Enable**.
3. **Create a Service Account**:
   - Navigate to **APIs & Services $\rightarrow$ Credentials $\rightarrow$ Create Credentials $\rightarrow$ Service Account**.
   - Name your service account (e.g., `invoice-sync-agent`).
4. **Generate Service Account Private Key**:
   - Click on the created service account $\rightarrow$ **Keys** tab $\rightarrow$ **Add Key $\rightarrow$ Create new key $\rightarrow$ JSON**.
   - Download the generated JSON key file.
5. **Configure `server/.env`**:
   - Set `GOOGLE_PROJECT_ID` from `project_id` in the JSON.
   - Set `GOOGLE_CLIENT_EMAIL` from `client_email` in the JSON.
   - Set `GOOGLE_PRIVATE_KEY` from `private_key` in the JSON (preserve `\n` characters enclosed in quotes).
6. **Create and Share Your Google Spreadsheet**:
   - Create a Google Sheet in Google Drive.
   - Copy the Spreadsheet ID from the browser URL:
     `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
   - Set `GOOGLE_SPREADSHEET_ID` in `server/.env`.
   - **Crucial**: Click **Share** in the Google Sheet and add the `GOOGLE_CLIENT_EMAIL` as an **Editor**.

---

## Running the Application

### Development Mode

Start the backend (Terminal 1):

```bash
cd server
npm run dev
```

Start the frontend (Terminal 2):

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

Build and test the frontend bundle:

```bash
cd client
npm run build
npm run preview
```

Run the backend in production mode:

```bash
cd server
NODE_ENV=production npm start
```

---

## Environment Variables Reference

| Variable                | Scope  | Required | Default                 | Description                                         |
| :---------------------- | :----: | :------: | :---------------------- | :-------------------------------------------------- |
| `PORT`                  | Server |    No    | `5000`                  | Port for Express HTTP server                        |
| `CLIENT_URL`            | Server |    No    | `http://localhost:5173` | Allowed frontend origin for CORS                    |
| `NODE_ENV`              | Server |    No    | `development`           | Runtime environment (`development` or `production`) |
| `MAX_FILE_SIZE_MB`      | Server |    No    | `10`                    | Maximum upload file size in megabytes               |
| `LLM_API_KEY`           | Server | **Yes**  | —                       | Google Gemini API Key from Google AI Studio         |
| `LLM_MODEL`             | Server |    No    | `gemini-2.5-flash`      | Gemini model name                                   |
| `GOOGLE_PROJECT_ID`     | Server |    No    | —                       | GCP project ID                                      |
| `GOOGLE_CLIENT_EMAIL`   | Server | **Yes**  | —                       | Service Account email address                       |
| `GOOGLE_PRIVATE_KEY`    | Server | **Yes**  | —                       | Service Account RSA private key                     |
| `GOOGLE_SPREADSHEET_ID` | Server | **Yes**  | —                       | Target Google Spreadsheet ID                        |
| `GOOGLE_SHEET_NAME`     | Server |    No    | `Sheet1`                | Worksheet tab name                                  |
| `VITE_API_URL`          | Client |    No    | `http://localhost:5000` | Backend API base URL                                |

---

## API Reference

### Health Check

```http
GET /api/health
```

**Response (`200 OK`)**:

```json
{
  "success": true,
  "message": "Invoice Accounting Sync API is running",
  "environment": "development",
  "timestamp": "2026-09-08T00:20:00.000Z"
}
```

---

### Process Invoice & Sync

```http
POST /api/invoices/process
Content-Type: multipart/form-data
```

**Request Parameters**:

- `file`: PDF document binary (multipart field name `file`, max 10 MB).

**Success Response (`200 OK`)**:

```json
{
  "success": true,
  "message": "Invoice processed and synced successfully",
  "invoice": {
    "vendor": "Acme Global Inc",
    "invoiceNumber": "INV-2026-001",
    "invoiceDate": "2026-09-01",
    "currency": "USD",
    "lineItems": [
      {
        "description": "Cloud Hosting Services",
        "quantity": 1,
        "unitPrice": 500,
        "amount": 500
      }
    ],
    "subtotal": 500,
    "tax": 0,
    "totalAmount": 500
  },
  "sync": {
    "status": "success",
    "destination": "Google Sheets",
    "processedAt": "2026-09-08T00:20:00.000Z"
  }
}
```

**Common Error Responses**:

| Status Code                     | Reason                         | Example Response                                                                                                                                                 |
| :------------------------------ | :----------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`400 Bad Request`**           | Missing or non-PDF file        | `{"success": false, "message": "Only PDF files are allowed", "errors": []}`                                                                                      |
| **`413 Payload Too Large`**     | File > 10 MB                   | `{"success": false, "message": "File size exceeds the 10 MB limit", "errors": []}`                                                                               |
| **`422 Unprocessable Entity`**  | Math/Schema validation error   | `{"success": false, "message": "Invoice data failed validation", "errors": [{"field": "totalAmount", "message": "Total amount does not match subtotal + tax"}]}` |
| **`502 Bad Gateway`**           | External LLM or Sheets failure | `{"success": false, "message": "Configured Google Spreadsheet could not be found"}`                                                                              |
| **`500 Internal Server Error`** | Unexpected server error        | `{"success": false, "message": "An unexpected server error occurred."}`                                                                                          |

---

## Security & Reliability Design

1. **Zero Permanent Storage**: Uploaded invoice PDFs are parsed directly from memory buffers using Multer and `pdf-parse`. Files are never written to disk or persisted beyond the request lifecycle.
2. **Strict Credential Isolation**: Google service account private keys and Gemini API keys reside exclusively on the server in `.env`. They are never passed to the browser or bundled with client code.
3. **No Credential or Stack Trace Leaks**: The centralized error middleware sanitizes error responses in production, stripping V8 stack traces and internal provider details.
4. **Two-Tier Accounting Validation**: The system uses Zod schema validation combined with business arithmetic reconciliation (`quantity × unitPrice ≈ amount`, `subtotal + tax ≈ totalAmount`). **Invalid invoices never reach Google Sheets.**
5. **Timeout & Rate-Limit Protection**: External calls are wrapped with strict timeouts (30 seconds for Gemini, 25 seconds for Google Sheets) to prevent server thread starvation and hanging requests.
6. **Graceful Partial Failure Recovery**: If Google Sheets sync encounters an external failure after extraction and validation pass, the API preserves and returns the validated invoice data so the user never loses their processed invoice.

---

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**. See the [`LICENSE.md`](file:///home/swarnavo/Desktop/PROJECTS/SyncThreshold/LICENSE.md) file for complete terms.

## Contact

For questions or support, please open an issue or contact the maintainer at: swarnavokhanra@gmail.com

## Author & Generation Statement

This project was authored and is maintained by **Swarnavo Khanra**. The documentation for this repository was generated using the **GPT-5 mini** LLM model and has been manually reviewed and verified.

---

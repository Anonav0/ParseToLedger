import { Router } from "express";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import { processInvoice } from "../controllers/invoiceController.js";

const router = Router();

/**
 * POST /api/invoices/process
 *
 * Upload middleware → Controller
 */
router.post("/invoices/process", uploadSingle, processInvoice);

export default router;

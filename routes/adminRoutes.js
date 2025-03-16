import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { promoteToAdmin,demoteToStudent } from "../controllers/adminController.js";

const router = express.Router();

// Only a developer can promote a user to admin
router.post("/promote", authMiddleware, promoteToAdmin);
router.post("/demote",authMiddleware,demoteToStudent);

export default router;

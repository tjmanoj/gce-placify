import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { promoteToAdmin,demoteToStudent, uploadStudentData } from "../controllers/adminController.js";
import multer from "multer";
const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Only a developer can promote a user to admin
router.post("/promote", authMiddleware, promoteToAdmin);
router.post("/demote",authMiddleware,demoteToStudent);
router.post("/upload-students", upload.single("file"), uploadStudentData);

export default router;

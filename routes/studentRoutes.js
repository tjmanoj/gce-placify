import express from "express";
import { updateStudentProfile, getStudentDetails } from "../controllers/studentController.js";
import authMiddleware,{ isStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getStudentDetails);
// Route for students to update their profile
router.put("/update-profile", authMiddleware, updateStudentProfile);

export default router;

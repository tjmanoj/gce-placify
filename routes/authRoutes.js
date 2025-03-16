import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { signUp, verifyOTP, login, logout, getUserProfile } from "../controllers/authController.js";
const router = express.Router();

router.post("/signup", signUp);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getUserProfile);

export default router;

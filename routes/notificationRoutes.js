import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import db from "../config/db.js";

const router = express.Router();

// POST /api/notifications/subscribe - Students subscribe to push notifications
router.post("/subscribe", authMiddleware, async (req, res) => {
    if (req.user.role !== "student") {
        return res.status(403).json({ message: "Access denied!" });
    }
    try {
        const { subscription } = req.body;
        await db.query(
            "INSERT INTO user_subscriptions (user_id, subscription) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET subscription = $2",
            [req.user.id, subscription]
        );

        res.status(201).json({ message: "Subscribed successfully!" });
    } catch (error) {
        console.error("Subscription error:", error);
        res.status(500).json({ message: "Error subscribing to notifications." });
    }
});

export default router;

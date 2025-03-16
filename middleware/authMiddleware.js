import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

export default function authMiddleware(req, res, next) {
    const authHeader = req.header("Authorization");

    if (!authHeader) return res.status(401).json({ message: "Access denied!" });

    const token = authHeader.split(" ")[1];  // Extract actual token
    console.log("Received Token:", token);  // Debugging

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Verified Payload:", verified);  // Debugging
        req.user = verified;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        res.status(400).json({ message: "Invalid token!" });
    }
}

export async function isStudent(req, res, next) {
    try {
        const userId = req.user.id;
        const userCheck = await db.query("SELECT role FROM users WHERE id = $1", [userId]);

        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== "student") {
            return res.status(403).json({ message: "Unauthorized! Only students can update their profile." });
        }

        next();
    } catch (error) {
        console.error("Error verifying student:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userCheck = await db.query("SELECT role FROM users WHERE id = $1", [userId]);

        if (userCheck.rows.length === 0 || userCheck.rows[0].role !== "admin") {
            return res.status(403).json({ message: "Unauthorized! Only admins can access this." });
        }

        next();
    } catch (error) {
        console.error("Error verifying admin:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

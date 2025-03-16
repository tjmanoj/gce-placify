import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const otpStore = {}; // Temporary store for OTP verification

export const signUp = async (req, res) => {
    const { name, email, password } = req.body;

    if (!email.endsWith("@gcetly.ac.in")) {
        return res.status(400).json({ message: "Only college emails are allowed!" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Signup",
        text: `Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: "OTP sending failed!" });
        }
        res.json({ message: "OTP sent to your email!" });
    });
};

export const verifyOTP = async (req, res) => {
    const { name, email, password, otp } = req.body;

    if (otpStore[email] !== parseInt(otp)) {
        return res.status(400).json({ message: "Invalid OTP!" });
    }

    delete otpStore[email];

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]
        );
        res.json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length === 0) return res.status(400).json({ message: "User not found!" });

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(400).json({ message: "Invalid credentials!" });

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token, role: user.rows[0].role });
    } catch (error) {
        res.status(500).json({ message: "Login failed" });
    }
};

// Logout API - Invalidate JWT (optional)
export const logout = async (req, res) => {
    try {
        // For JWT, logout is usually handled on the client side by removing the token
        // Optionally, store blacklisted tokens in DB/Redis for invalidation

        return res.status(200).json({ message: "Logged out successfully!" });
    } catch (error) {
        console.error("Logout error:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user details from database
        const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching user profile:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

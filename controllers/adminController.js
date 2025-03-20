import db from "../config/db.js";
import xlsx from "xlsx";
import pool from "../config/db.js";
// Promote a student to admin
export const promoteToAdmin = async (req, res) => {
    try {
        const { userId } = req.body;
        const developerId = req.user.id; // Extracted from authMiddleware

        // Check if the requesting user (developerId) is actually a developer
        const devCheck = await db.query("SELECT role FROM users WHERE id = $1", [developerId]);

        if (devCheck.rows.length === 0 || devCheck.rows[0].role !== "developer") {
            return res.status(403).json({ message: "Unauthorized! Only developers can promote admins." });
        }

        // Ensure the target user exists and is not already an admin
        const userCheck = await db.query("SELECT role FROM users WHERE id = $1", [userId]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        if (userCheck.rows[0].role === "admin") {
            return res.status(400).json({ message: "User is already an admin." });
        }

        // Update the user's role to admin
        await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);

        return res.status(200).json({ message: "User promoted to admin successfully!" });
    } catch (error) {
        console.error("Error promoting user:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const demoteToStudent = async (req, res) => {
    try {
        const { userId } = req.body;
        const developerId = req.user.id; // Extracted from authMiddleware

        // Check if the requesting user (developerId) is actually a developer
        const devCheck = await db.query("SELECT role FROM users WHERE id = $1", [developerId]);

        if (devCheck.rows.length === 0 || devCheck.rows[0].role !== "developer") {
            return res.status(403).json({ message: "Unauthorized! Only developers can demote admins." });
        }

        // Ensure the target user exists and is an admin
        const userCheck = await db.query("SELECT role FROM users WHERE id = $1", [userId]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        if (userCheck.rows[0].role !== "admin") {
            return res.status(400).json({ message: "User is not an admin." });
        }

        // Update the user's role to student
        await db.query("UPDATE users SET role = 'student' WHERE id = $1", [userId]);

        return res.status(200).json({ message: "User demoted to student successfully!" });
    } catch (error) {
        console.error("Error demoting user:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const uploadStudentData = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Parse the uploaded Excel file
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let updatedCount = 0;

        // Loop through each student record in Excel
        for (const row of sheetData) {
            const { roll_number, department, graduation_year, cgpa, history_of_arrear, standing_arrear, skills } = row;

            // Check if the student exists in the database
            const checkStudent = await pool.query(
                "SELECT * FROM users WHERE roll_number = $1",
                [roll_number]
            );

            if (checkStudent.rows.length > 0) {
                // Update student data
                await pool.query(
                    `UPDATE users 
                     SET department = $1, graduation_year = $2, cgpa = $3, 
                         history_of_arrear = $4, standing_arrear = $5, skills = $6 
                     WHERE roll_number = $7`,
                    [department, graduation_year, cgpa, history_of_arrear, standing_arrear, skills, roll_number]
                );
                updatedCount++;
            }
        }

        return res.status(200).json({ message: `${updatedCount} students updated successfully.` });

    } catch (error) {
        console.error("Error uploading student data:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
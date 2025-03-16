import db from "../config/db.js";

// Controller to get student details
export const getStudentDetails = async (req, res) => {
    try {
        const userId = req.user.id; // Get student ID from token

        // Fetch student details from the database
        const result = await db.query(
            `SELECT id, name, email, phone_number, roll_number, cgpa, 
                    graduation_year, resume_url, skills 
             FROM users 
             WHERE id = $1`,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Student not found!" });
        }

        res.status(200).json({ student: result.rows[0] });
    } catch (error) {
        console.error("Error fetching student details:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Controller to update student profile
export const updateStudentProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Get student ID from token
        const { name, email, phone_number, roll_number, cgpa, graduation_year, resume_url, skills } = req.body;

        // Validate input
        if (!name || !email || !phone_number) {
            return res.status(400).json({ message: "Full Name, Email, and Phone Number are required!" });
        }
        if (!email.endsWith("@gcetly.ac.in")) {
            return res.status(400).json({ message: "Only college emails are allowed!" });
        }
        // Update student details in the database
        const result = await db.query(
            `UPDATE users 
            SET name = $1, email = $2, phone_number = $3, roll_number= $4, cgpa = $5, 
                graduation_year = $6, resume_url = $7, skills = $8 
            WHERE id = $9 AND role = 'student' 
            RETURNING *`,
            [name, email, phone_number, roll_number, cgpa, graduation_year, resume_url, skills, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Student not found or unauthorized!" });
        }

        res.status(200).json({ message: "Profile updated successfully!", student: result.rows[0] });
    } catch (error) {
        console.error("Error updating student profile:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


import ExcelJS from "exceljs";
import db from "../config/db.js";
import { sendJobNotificationEmail, sendJobPushNotification } from "../services/notificationService.js";

// ✅ Helper function to set default values
const setDefaultValues = (jobData) => ({
    organisation_title: jobData.organisation_title || "Unknown Organization",
    organisation_logo_url: jobData.organisation_logo_url || "https://via.placeholder.com/150",
    job_title: jobData.job_title || "Software Engineer",
    locations: jobData.locations || "Remote",
    min_ctc: jobData.min_ctc || 300000, // 3 LPA
    max_ctc: jobData.max_ctc || 1200000, // 12 LPA
    no_of_positions_available: jobData.no_of_positions_available || 1,
    skills_required: jobData.skills_required || ["General Programming"],
    job_description: jobData.job_description || "No description provided.",
    eligibility_criteria: jobData.eligibility_criteria || "Open to all applicants.",
    job_state: "OPEN",
    job_type: jobData.job_type || "FULL_TIME",
    apply_by: jobData.apply_by || "2025-12-31",
    job_active_status: jobData.job_active_status !== undefined ? jobData.job_active_status : true,
});

// ✅ Add Job Posting (Admin Only)
export const addJob = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can post jobs!" });
        }

        const jobData = setDefaultValues(req.body);

        const insertQuery = `
            INSERT INTO jobs (
                organisation_title, organisation_logo_url, job_title, locations, min_ctc, max_ctc, no_of_positions_available, 
                skills_required, job_description, eligibility_criteria, job_state, job_type, apply_by, job_active_status,
                min_cgpa, max_history_of_arrear, max_standing_arrear, allowed_graduation_years, allowed_departments
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
            RETURNING *`;

        const values = [
            jobData.organisation_title,
            jobData.organisation_logo_url,
            jobData.job_title,
            jobData.locations,
            jobData.min_ctc,
            jobData.max_ctc,
            jobData.no_of_positions_available,
            jobData.skills_required,
            jobData.job_description,
            jobData.eligibility_criteria,
            jobData.job_state,
            jobData.job_type,
            jobData.apply_by,
            jobData.job_active_status,
            jobData.min_cgpa,
            jobData.max_history_of_arrear,
            jobData.max_standing_arrear,
            jobData.allowed_graduation_years,
            jobData.allowed_departments
        ];

        const newJob = await db.query(insertQuery, values);
        const savedJob = newJob.rows[0];

        // ✅ Send Email & Push Notifications
        await sendJobNotificationEmail(savedJob);
        await sendJobPushNotification(savedJob);

        res.status(201).json(savedJob);
    } catch (error) {
        console.error("Error adding job:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;

        // ✅ Fetch job details from the database
        const jobQuery = await db.query("SELECT * FROM jobs WHERE id = $1", [jobId]);

        if (jobQuery.rows.length === 0) {
            return res.status(404).json({ message: "Job not found!" });
        }

        res.status(200).json(jobQuery.rows[0]);
    } catch (error) {
        console.error("Error fetching job:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ✅ View All Job Posts (Admins & Students)
export const getAllJobs = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "student") {
            return res.status(403).json({ message: "Unauthorized access!" });
        }

        const page = parseInt(req.query.page) || 1;  // Get page number (default 1)
        const limit = 5;  // Jobs per page
        const offset = (page - 1) * limit;

        // ✅ Query to fetch jobs with pagination
        const jobQuery = await db.query(
            "SELECT * FROM jobs WHERE job_active_status = TRUE ORDER BY id DESC LIMIT $1 OFFSET $2",
            [limit, offset]
        );

        // ✅ Query to get total job count
        const countQuery = await db.query(
            "SELECT COUNT(*) FROM jobs WHERE job_active_status = TRUE"
        );
        const totalJobs = parseInt(countQuery.rows[0].count);
        const totalPages = Math.ceil(totalJobs / limit);  // Calculate total pages

        res.status(200).json({
            jobs: jobQuery.rows,
            currentPage: page,
            totalPages: totalPages,  // ✅ Added totalPages
        });
    } catch (error) {
        console.error("Error fetching jobs:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// ✅ Edit Job Post (Admin Only)
export const editJob = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can edit jobs!" });
        }

        const { job_id } = req.params;
        let jobData = req.body;

        // ✅ Convert string values to arrays
        jobData.allowed_graduation_years = Array.isArray(jobData.allowed_graduation_years)
            ? jobData.allowed_graduation_years
            : jobData.allowed_graduation_years?.split(",").map(year => parseInt(year.trim())) || [];

        jobData.allowed_departments = Array.isArray(jobData.allowed_departments)
            ? jobData.allowed_departments
            : jobData.allowed_departments?.split(",").map(dept => dept.trim()) || [];

        console.log("Final jobData to update:", jobData); // Debugging Output

        const updateQuery = `
            UPDATE jobs 
            SET organisation_title=$1, organisation_logo_url=$2, job_title=$3, locations=$4, 
                min_ctc=$5, max_ctc=$6, no_of_positions_available=$7, skills_required=$8, 
                job_description=$9, eligibility_criteria=$10, job_state=$11, job_type=$12, 
                apply_by=$13, job_active_status=$14, min_cgpa=$15, max_history_of_arrear=$16, 
                max_standing_arrear=$17, allowed_graduation_years=$18, allowed_departments=$19
            WHERE id=$20 RETURNING *`;

        const values = [
            jobData.organisation_title,
            jobData.organisation_logo_url,
            jobData.job_title,
            jobData.locations,
            jobData.min_ctc,
            jobData.max_ctc,
            jobData.no_of_positions_available,
            jobData.skills_required,
            jobData.job_description,
            jobData.eligibility_criteria,
            jobData.job_state,
            jobData.job_type,
            jobData.apply_by,
            jobData.job_active_status,
            jobData.min_cgpa || null,
            jobData.max_history_of_arrear || 0,
            jobData.max_standing_arrear || 0,
            jobData.allowed_graduation_years,
            jobData.allowed_departments,
            job_id
        ];

        const updatedJob = await db.query(updateQuery, values);
        if (updatedJob.rows.length === 0) {
            return res.status(404).json({ message: "Job not found!" });
        }

        res.status(200).json(updatedJob.rows[0]);
    } catch (error) {
        console.error("Error updating job:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



// ✅ Delete Job Post (Admin Only)
export const deleteJob = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can delete jobs!" });
        }

        const { job_id } = req.params;

        const deleteQuery = "DELETE FROM jobs WHERE id=$1 RETURNING *";
        const deletedJob = await db.query(deleteQuery, [job_id]);

        if (deletedJob.rows.length === 0) {
            return res.status(404).json({ message: "Job not found!" });
        }

        res.status(200).json({ message: "Job deleted successfully!" });
    } catch (error) {
        console.error("Error deleting job:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ✅ Apply for a Job (Student)
export const applyForJob = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can apply!" });
        }

        const { job_id } = req.params;
        const student_id = req.user.id;

        // Check if already applied
        const check = await db.query(
            "SELECT * FROM job_applications WHERE job_id = $1 AND student_id = $2",
            [job_id, student_id]
        );
        if (check.rows.length > 0) {
            return res.status(400).json({ message: "Already applied!" });
        }

        // Insert as pending approval
        await db.query(
            "INSERT INTO job_applications (job_id, student_id, status) VALUES ($1, $2, 'pending')",
            [job_id, student_id]
        );

        res.status(200).json({ message: "Application submitted. Awaiting approval." });
    } catch (error) {
        console.error("Error applying for job:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ✅ Approve Job Application (Admin)
export const approveJobApplication = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can approve applications!" });
        }

        const { job_id, student_id } = req.params;

        // Check if the application exists
        const check = await db.query(
            "SELECT * FROM job_applications WHERE job_id = $1 AND student_id = $2",
            [job_id, student_id]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: "Application not found!" });
        }

        // Update status to approved
        await db.query(
            "UPDATE job_applications SET status = 'approved' WHERE job_id = $1 AND student_id = $2",
            [job_id, student_id]
        );

        res.status(200).json({ message: "Application approved!" });
    } catch (error) {
        console.error("Error approving application:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const revokeApplication = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can revoke applications!" });
        }

        const { job_id } = req.params;
        const student_id = req.user.id;
        console.log(job_id);
        console.log(student_id);
        // ✅ Check if the application exists
        const check = await db.query(
            "SELECT * FROM job_applications WHERE job_id = $1 AND student_id = $2",
            [job_id, student_id]
        );

        if (check.rows.length === 0) {
            return res.status(400).json({ message: "You have not applied for this job!" });
        }

        // ✅ Delete the application from the database
        await db.query(
            "DELETE FROM job_applications WHERE job_id = $1 AND student_id = $2",
            [job_id, student_id]
        );

        res.status(200).json({ message: "Application revoked successfully." });
    } catch (error) {
        console.error("Error revoking application:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ✅ Disapprove Job Application (Admin)
export const disApproveJobApplication = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can approve applications!" });
        }

        const { job_id, student_id } = req.params;

        // Check if the application exists
        const check = await db.query(
            "SELECT * FROM job_applications WHERE job_id = $1 AND student_id = $2",
            [job_id, student_id]
        );
        if (check.rows.length === 0) {
            return res.status(404).json({ message: "Application not found!" });
        }

        // Reject the application
        await db.query(
            "DELETE from job_applications WHERE job_id = $1 AND student_id = $2",
            [job_id, student_id]
        );

        res.status(200).json({ message: "Application Rejected!" });
    } catch (error) {
        console.error("Error approving application:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// ✅ View Pending Approvals (Admin)
export const getPendingApprovals = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized!" });
        }

        const { job_id } = req.params;

        // ✅ Fetch pending applications along with student details
        const pendingApps = await db.query(
            `SELECT 
                ja.id AS application_id,
                ja.job_id,
                ja.student_id,
                ja.status,
                ja.applied_at,
                u.name AS student_name,
                u.email AS student_email,
                u.roll_number AS student_roll_number
            FROM job_applications ja
            JOIN users u ON ja.student_id = u.id
            WHERE ja.job_id = $1 AND ja.status = 'pending'`,
            [job_id]
        );

        res.status(200).json({ applications: pendingApps.rows });
    } catch (error) {
        console.error("Error fetching pending approvals:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ✅ View Applied Students (Admin)
export const getAppliedStudents = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized!" });
        }

        const { job_id } = req.params;

        const students = await db.query(
            "SELECT users.id, users.name, users.email,users.roll_number FROM job_applications " +
            "JOIN users ON job_applications.student_id = users.id " +
            "WHERE job_applications.job_id = $1 AND job_applications.status = 'approved'",
            [job_id]
        );

        res.status(200).json({ applied_students: students.rows });
    } catch (error) {
        console.error("Error fetching applied students:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// Controller to download applied students as an Excel file
export const downloadAppliedStudents = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Fetch job details
        const jobQuery = await db.query("SELECT job_title, organisation_title FROM jobs WHERE id = $1", [jobId]);

        if (jobQuery.rows.length === 0) {
            return res.status(404).json({ message: "Job post not found!" });
        }

        const jobTitle = jobQuery.rows[0].job_title;
        const companyName = jobQuery.rows[0].organisation_title;

        // Fetch applied students for the job
        const studentsQuery = await db.query(`
            SELECT 
                ja.id AS application_id,
                u.id AS student_id,
                u.name,
                u.email,
                u.phone_number,
                u.roll_number,
                u.cgpa,
                u.graduation_year,
                u.resume_url,
                u.skills,
                ja.status,
                ja.applied_at
            FROM job_applications ja
            JOIN users u ON ja.student_id = u.id
            WHERE ja.job_id = $1
        `, [jobId]);

        if (studentsQuery.rows.length === 0) {
            return res.status(404).json({ message: "No students have applied for this job." });
        }

        // Create an Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Applied Students");

        // Define columns
        worksheet.columns = [
            //{ header: "Application ID", key: "application_id", width: 15 },
            //{ header: "Student ID", key: "student_id", width: 15 },
            {header: "Roll Number", key: "roll_number", width: 15 },
            { header: "Full Name", key: "name", width: 20 },
            { header: "Email", key: "email", width: 25 },
            { header: "Phone Number", key: "phone_number", width: 15 },
            { header: "CGPA", key: "cgpa", width: 10 },
            { header: "Graduation Year", key: "graduation_year", width: 15 },
            { header: "Resume URL", key: "resume_url", width: 30 },
            { header: "Skills", key: "skills", width: 30 },
            { header: "Application Status", key: "status", width: 15 },
            { header: "Applied Date", key: "applied_at", width: 20 }
        ];

        // Add student data to the worksheet
        studentsQuery.rows.forEach(student => {
            worksheet.addRow(student);
        });

        // Set response headers for file download
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Applied_Students_${jobTitle}.xlsx"`
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        // Write to response stream
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generating Excel file:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// Approve all pending applications for a specific job
export const approveAllApplications = async (req, res) => {
    try {
        const { jobId } = req.params;

        // Check if job exists
        const jobCheck = await db.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        // Update all pending applications to 'approved'
        const result = await db.query(
            "UPDATE job_applications SET status = 'approved' WHERE job_id = $1 AND status = 'pending' RETURNING *",
            [jobId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "No pending applications found for this job" });
        }

        return res.status(200).json({
            message: "All pending applications approved successfully",
            approvedApplications: result.rows,
        });
    } catch (error) {
        console.error("Error approving applications:", error.message);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkApplicationStatus = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can check application status!" });
        }

        const { jobId } = req.params;
        const studentId = req.user.id;

        // ✅ Check if the student has applied for this job
        const checkQuery = await db.query(
            "SELECT * FROM job_applications WHERE job_id = $1 AND student_id = $2",
            [jobId, studentId]
        );

        const hasApplied = checkQuery.rows.length > 0;

        res.status(200).json({ applied: hasApplied });
    } catch (error) {
        console.error("Error checking application status:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkEligibilityStatus = async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can check eligibility status!" });
        }

        const { jobId } = req.params;
        const studentId = req.user.id;

        // ✅ Check if the student is eligible for this job
        const checkQuery = await db.query(
            `SELECT EXISTS (
                SELECT 1 FROM users u
                JOIN jobs j ON j.id = $2
                WHERE u.id = $1
                AND u.cgpa >= j.min_cgpa
                AND u.history_of_arrear <= j.max_history_of_arrear
                AND u.standing_arrear <= j.max_standing_arrear
                AND u.graduation_year = ANY (j.allowed_graduation_years)
                AND u.department = ANY (j.allowed_departments)
            ) AS eligible;`,
            [studentId, jobId]
        );

        const isEligible = checkQuery.rows[0].eligible;

        res.status(200).json({ eligible: isEligible });
    } catch (error) {
        console.error("Error checking eligibility status:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

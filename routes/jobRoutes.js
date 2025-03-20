import express from "express";
import { addJob, getJobById, getAllJobs, editJob, deleteJob,applyForJob, approveJobApplication, getPendingApprovals, getAppliedStudents, disApproveJobApplication, downloadAppliedStudents, approveAllApplications, checkApplicationStatus, checkEligibilityStatus, revokeApplication} from "../controllers/jobController.js";
import authMiddleware,{isAdmin} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addJob); // Admins can add jobs
router.get("/:jobId", authMiddleware, getJobById);
router.get("/",authMiddleware, getAllJobs); // Anyone can view paginated job posts
router.put("/:job_id", authMiddleware, editJob); // Admins can edit jobs
router.delete("/:job_id", authMiddleware, deleteJob); // Admins can delete jobs

router.post("/:job_id/apply", authMiddleware, applyForJob); // Students apply
router.put("/:job_id/approve/:student_id", authMiddleware, approveJobApplication); // Admin approves
router.delete("/:job_id/reject/:student_id", authMiddleware, disApproveJobApplication); // Admin rejects application
router.get("/:job_id/pending-approvals", authMiddleware, getPendingApprovals); // Admin views pending approvals
router.get("/:job_id/approved-students", authMiddleware, getAppliedStudents); // Admin views applied students
router.get("/download-applied/:jobId", authMiddleware, isAdmin, downloadAppliedStudents);
router.put("/:jobId/approve-all", authMiddleware, approveAllApplications);

router.get("/:jobId/application-status", authMiddleware, checkApplicationStatus);
router.get("/:jobId/check-eligibility", authMiddleware, checkEligibilityStatus);
router.delete("/:job_id/revoke-application",authMiddleware,revokeApplication);


export default router;

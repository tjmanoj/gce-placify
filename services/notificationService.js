import nodemailer from "nodemailer";
import webpush from "web-push";
import { getStudentEmails, getStudentSubscriptions } from "../models/userModel.js";

// Setup Nodemailer for Email Notifications
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send email notifications
export async function sendJobNotificationEmail(job) {
    const students = await getStudentEmails(); // Get student emails from DB
    console.log(job);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        subject: `New Job Posted: ${job.job_title}`,
        text: `A new job has been posted: ${job.job_title} at ${job.organisation_title}. Apply now!`,
    };

    for (const student of students) {
        try {
            await transporter.sendMail({ ...mailOptions, to: student.email });
            console.log(`Email sent to ${student.email}`);
        } catch (error) {
            console.error(`Error sending email to ${student.email}:`, error);
        }
    }
}

// Setup Web Push Notifications
webpush.setVapidDetails(
    "mailto:manojtofficial@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Function to send web push notifications
export async function sendJobPushNotification(job) {
    const subscriptions = await getStudentSubscriptions(); // Get push subscriptions from DB
    const payload = JSON.stringify({
        title: "New Job Alert!",
        body: `${job.job_title} at ${job.organisation_title} - Apply now!`,
        icon: "/icon.png",
    });

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(sub, payload);
            console.log("Push notification sent!");
        } catch (error) {
            console.error("Push notification error:", error);
        }
    }
}

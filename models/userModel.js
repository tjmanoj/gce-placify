import db from "../config/db.js";

// Fetch student emails for email notifications
export async function getStudentEmails() {
    const result = await db.query("SELECT email FROM users WHERE role = 'student'");
    return result.rows;
}

// Fetch student subscriptions for push notifications
export async function getStudentSubscriptions() {
    const result = await db.query("SELECT subscription FROM user_subscriptions");
    return result.rows.map(row => row.subscription);
}

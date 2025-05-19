import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();
interface EmailOptions {
  userType?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmailSengrid({ userType, to, subject, text, html }: EmailOptions) {
  const msg = {
    to: "rajsinghlodhi08@gmail.com", // ✅ receiver
    from: "rajendra.s@ultratend.com", // ✅ MUST BE VERIFIED in SendGrid
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent");
    return { success: true, messageId: "Email sent successfully" };
  } catch (error: any) {
    console.error("❌ Error sending email:", error?.response?.body || error);
    return {
      success: false,
      error: error?.response?.body?.errors?.[0]?.message || "Unknown error",
    };
  }
}

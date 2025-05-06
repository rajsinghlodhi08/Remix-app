import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import fs from "fs";
import path from "path";
import os from "os"; // Import os module

// Define a type for the email options
interface EmailOptions {
  userType?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({userType, to, subject, text, html }: EmailOptions) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",    //"smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.SMTP_USER ||  "889f63001@smtp-brevo.com", //"mtesting359@gmail.com",
        pass: process.env.SMTP_PASS ||  "T0Nf4h5dxB6GqazU", //"yeuj lqvc szqj wtiv",
      },
      tls: {
        rejectUnauthorized: false, // This can help avoid SSL/TLS issues
      },
    });

    const tempDir = os.tmpdir(); 
    const pdfPath = path.join(tempDir, "quote.pdf");  
    
    if (userType !== "admin") { // Only generate PDF for customers
        const doc = new PDFDocument();
        const pdfStream = fs.createWriteStream(pdfPath);
    
        doc.pipe(pdfStream);
        doc.fontSize(20).text("Shopify Product Quote", { align: "center" });
        doc.moveDown();
        doc.fontSize(16).text(`Product: Blue T-shirt`, { align: "left" });
        doc.fontSize(14).text(`Price: $5000`, { align: "left" });
        doc.end();
        await new Promise<void>((resolve) => {
          pdfStream.on("finish", () => resolve());
      });     
    }
    
    // Configure the email
    const mailOptions = {
        from: `"Your Business" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        ...(userType !== "admin" ? { // Attach PDF only if not admin
            attachments: [
                {
                    filename: "quote.pdf",
                    path: pdfPath,
                    contentType: "application/pdf",
                },
            ],
        } : {}),
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
  
    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.log("❌ Error sending email:", error);
    return { success: false, error: (error as Error).message };
  }
}

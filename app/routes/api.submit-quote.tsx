import { json } from "@remix-run/node";
import { withCors } from "../utils/cors.server";
import db from "../db.server"; // assuming this is your Prisma DB setup
import { sendEmail } from "../utils/sendEmail";
import { sendEmailSengrid } from "../utils/sendEmailSengrid";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import fs from "fs";
import path from "path";

export const loader = async ({ request }: any) => {
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }
  return withCors(new Response("Only POST allowed", { status: 405 }));
};

export const action = async ({ request }: any) => {
  const formData = await request.json();
  try {

  const saved = await db.quote.create({
    data: {
      shop: String(formData.shop_domain),
      fullName: String(formData.full_name),
      company: String(formData.company),
      message: String(formData.message),
      quantity: String(formData.quantity), // ensure it's an integer
      email: String(formData.email),
      telephone: String(formData.phone),
      product: String(formData.product_title),
      price: String(formData.product_price),
    },
  });
  console.log("Quote saved:", formData.product_image);
  
  // Send email to sendEmailSengrid
const adminEmailResponse = await sendEmailSengrid({
  userType: "admin",
  to: "rajsinghlodhi08@gmail.com", // Admin email
  subject: "New Quote Request",
  text: `New quote request from ${formData.full_name} (${formData.email}).\n\nProduct: ${formData.product_title}\nQuantity: ${formData.quantity}\nPrice: ${formData.product_price}\nCompany: ${formData.company}\nMessage: ${formData.message}`,
  html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 730px; margin: 0 auto; background: #fd650614; border-radius: 10px; padding: 20px;">
  <tr>
    <td align="center">
      <img src="https://promoforbusiness.com/cdn/shop/files/pfb_logo.png?v=1740660920&width=110px" width="110px">
    </td>
  </tr>
  <tr>
    <td>
      <hr>
      <h2>Hello<span style="color: #fd6506;">  ${formData.full_name},</span></h2>
    </td>
  </tr>
  <tr>
    <td>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="left" style="padding-right: 20px;">
            <h1>Thank you for requesting a quote.</h1>
            <p>We have received your request and will get back to you soon.</p>
          </td>
          <td align="right">
            <img src="https://promoforbusiness.com/cdn/shop/files/pfb_logo.png"  style="display: block; width: 330px; " />
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center">
      <p>01 APR 2025 10:50:30 AM PDT</p>
      <h1>Quote Request Received</h1>
    </td>
  </tr>
  <tr>
    <td>
      <hr>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <img src="https://promoforbusiness.com/cdn/shop/files/pfb_logo.png" alt="Product Image" width="200px" style="display: block;" />
          </td>
          <td>
            <p><strong>${formData.product_title}</strong></p>
            <p><b>Quantity:</b> ${formData.quantity}</p>
            <p><b>Price:</b> ${formData.product_price}</p>
          </td>
        </tr>
      </table>
      <hr>
    </td>
  </tr>
  <tr>
    <td>
    <p><b>Email:</b> ${formData.email}</p>
      <p><b>Company:</b> ${formData.company}</p>
      <p><b>Message:</b> ${formData.message}</p>
      <p>Best regards,<br>Your Company</p>
    </td>
  </tr>
</table>`,
});
if (!adminEmailResponse.success) {
  console.error("❌ Email failed to send:", adminEmailResponse.error);
  console.log("Image URL:", formData.product_image);
  return withCors(json({ success: false, error: "Failed to send email" }, { status: 500 }));
}
// Send email to User (confirmation email)
const userEmailResponse = await sendEmailSengrid({
  userType: "customer",
  to: 'mtesting359@gmail.com', //formData.email, // User's email
  subject: "Your Quote Request Received",
  text: `Hello ${formData.full_name},\n\nThank you for requesting a quote. We have received your request and will get back to you soon.\n\nProduct: ${formData.product_title}\nQuantity: ${formData.quantity}\nPrice: ${formData.product_price}\nCompany: ${formData.company}\nMessage: ${formData.message}\n\nBest regards,\nYour Company`,
  html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 730px; margin: 0 auto; background: #fd650614; border-radius: 10px; padding: 20px;">
  <tr>
    <td align="center">
      <img src="https://promoforbusiness.com/cdn/shop/files/pfb_logo.png?v=1740660920&width=110px" / width="110px">
    </td>
  </tr>
  <tr>
    <td>
      <hr>
      <h2>Hello<span style="color: #fd6506;">  ${formData.full_name},</span></h2>
    </td>
  </tr>
  <tr>
    <td>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="left" style="padding-right: 20px;">
            <h1>Thank you for requesting a quote.</h1>
            <p>We have received your request and will get back to you soon.</p>
          </td>
          <td align="right">
            <img src="https://promoforbusiness.com/cdn/shop/files/pfb_logo.png"  style="display: block; width: 330px; " />
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center">
      <p>01 APR 2025 10:50:30 AM PDT</p>
      <h1>Quote Request Received</h1>
    </td>
  </tr>
  <tr>
    <td>
      <hr>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <img src="https://promoforbusiness.com/cdn/shop/files/pfb_logo.png" alt="Product Image" width="200px" style="display: block;" />
          </td>
          <td>
            <p><strong>${formData.product_title}</strong></p>
            <p><b>Quantity:</b> ${formData.quantity}</p>
            <p><b>Price:</b> ${formData.product_price}</p>
          </td>
        </tr>
      </table>
      <hr>
    </td>
  </tr>
  <tr>
    <td>
      <p><b>Company:</b> ${formData.company}</p>
      <p><b>Message:</b> ${formData.message}</p>
      <p>Best regards,<br>Your Company</p>
    </td>
  </tr>
</table>

`,
});
  if (!userEmailResponse.success) {
    console.error("❌ Email failed to send:", userEmailResponse.error);
    return withCors(json({ success: false, error: "Failed to send email" }, { status: 500 }));
  }
  const response = json({ success: true, data: saved });
  return withCors(response);
} catch (error) {
  return withCors(
    json({ success: false, error: "Internal Server Error" }, { status: 500 })
  );
};
};

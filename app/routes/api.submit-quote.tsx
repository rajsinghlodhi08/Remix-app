import { json } from "@remix-run/node";
import { withCors } from "../utils/cors.server";
import db from "../db.server"; // assuming this is your Prisma DB setup
import { sendEmail } from "../utils/sendEmail";
import { sendEmailSengrid } from "../utils/sendEmailSengrid";
import discount from "../../extensions/product-discount/src/discount.json";
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
const imageUrl = `https:${formData.product_image}`;
const quantity = parseInt(formData.quantity, 10);
  const discountTier = discount.discounts.find(
    tier => quantity >= tier.min && quantity <= tier.max
  );
  
  const discountPercentage = discountTier ? discountTier.percentage : 0;
  const discountAmount = (parseFloat(formData.product_price) * discountPercentage) / 100;
  
  const totalPriceSum = parseFloat(formData.product_price) * quantity;
  // const totalPrice = totalPriceSum - discountAmount;
 
  const totalTax = (totalPriceSum * 0.20).toFixed(2); // Assuming a 5% tax rate
  
  const grandTotal = (totalPriceSum) - discountAmount + parseFloat(totalTax).toFixed(2);

  const taxVat = 20;
  // Send email to Admin
const adminEmailResponse = await sendEmailSengrid({
  userType: "admin",
  to : [
    "anamika.b@ultratend.com",
    "rajendra.s@ultratend.com",
  ],
  subject: "New Quote Request",
  text: `New quote request from ${formData.full_name} (${formData.email}).\n\nProduct: ${formData.product_title}\nQuantity: ${formData.quantity}\nPrice: ${formData.product_price}\nCompany: ${formData.company}\nMessage: ${formData.message}`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Quotation Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f6f6f6;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 700px;
      background: #fff;
      margin: 20px auto;
      /* padding: 20px; */
      border: 1px solid #ddd;
    }
    .banner-top {
      text-align: right;
      color: white;
      font-style: italic;
      font-weight: bold;
    }
    .banner-top1 {
      background-color: #f07f20;
      padding: 20px;
    }    
    .greeting {
      padding: 0px 0px 0px 20px;
      
    }
    .logo {
      text-align: center;
      margin: 20px 0;
    }
    .logo img {
      max-height: 50px;
    }
    .mid-banner img {
      width: 100%;
      border-radius: 4px;
    }
    .quote-box {
      padding: 20px;
    }
    .quote-box h2 {
      background-color: #00a4d6;
      color: white;
      padding: 10px;
      font-size: 18px;
    }
    .product-img {
      max-width: 100px;
      margin: 10px 0;
    }
    .quote-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .quote-table th, .quote-table td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
    }
    .quote-table th {
      background-color: #f07f20;
      color: white;
    }
    .totals {
      margin-top: 10px;
    }
    .terms {
      background-color: #f07f20;
      color: white;
      padding: 10px;
      font-weight: bold;
      margin-top: 20px;
    }
    .terms-text {
      padding: 10px 20px;
      font-size: 13px;
    }
    .header {
      background-color: #007ca3;
      color: white;
      text-align: center;
      padding: 10px 0;
      font-weight: bold;
      font-size: 18px;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    .meta div {
      width: 48%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #aaa;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #007ca3;
      color: white;
    }
    .subtotal-section {
      background-color: #d8ecf1;
      font-weight: bold;
    }
    .calc-box {
      margin-top: 20px;
      background-color: #007ca3;
      color: white;
      padding: 10px;
      font-weight: bold;
    }
    .calc-box + div {
      background-color: #f9f9f9;
      padding: 10px;
      font-size: 13px;
    }
    .name-heading {
      position: absolute;
      margin-top: -27px;
      padding: 0px 0px 0px 20px;
      color: black;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner-top1">
        
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;border: none;">
    <tr>
        <td style="padding: 0; width: 60%; vertical-align: middle;border: none">
        <p style="margin: 0; padding: 75px 20px 0px 20px; font-weight: bold; font-style: italic; color: black;">
            Dear ${formData.full_name}
        </p>
        </td>
        <td style="padding: 0; width: 40%; text-align: right;border: none">
        <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/know_your_qoute.png?v=1747661075" alt="Know Your Quote" style="max-width: 100%; height: auto;" />
        </td>
     </tr>
    </table>

    <div class="greeting">
      <p>Greetings!</p>
      <p>Thank you for reaching out to us regarding your service inquiry. We are pleased to provide you with the following quotation tailored to your needs.</p>
      <p>I'm excited to make this happen. Please feel free to reach out whenever you have further concerns.</p>
      <p>Best regards,<br><strong>Mr. Asim</strong><br>Product Advisor<br>Contact: (44) 20 3807 9480</p>
    </div>

    <div class="logo">
      <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/Logo_14235b7e-d36a-4a7a-b850-45c37d5c16a7.png?v=1747661075" alt="PromoForBusiness Logo" />
    </div>

    <div class="mid-banner">
      <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/upper-banner.png?v=1747661077" alt="Product Showcase" />
    </div>

    <div class="quote-box">
     <div class="header">QUOTE EVALUATION</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 10px;">
        <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>PREPARED FOR:</strong> ${formData.full_name}
            </td>
            <td style="padding: 8px 0; font-size: 14px;border:none;"> 
              <strong> DATE :</strong>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
            </td>
        </tr>
         <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>COMPANY :</strong> ${formData.company}
            </td>
            <td style="padding: 8px 0; font-size: 14px;border:none;"> 
              <strong>EMAIL : </strong>${formData.email} 
            </td>
        </tr>
         <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>PHONE NUMBER : </strong> ${formData.phone}
            </td>
            <td style="padding: 8px 0; font-size: 14px;border:none;"> 
              <strong>MESSAGE : </strong>${formData.message} 
            </td>
        </tr>
        <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>PREPARED BY:</strong> Mr. Asim
            </td>
            <td style="border:none; padding: 8px 0; font-size: 14px;">
                <a href="mailto:hello@promoforbusiness.com" style="color: #007ca3; text-decoration: none;">
                hello@promoforbusiness.com
                </a>
           </td>
        </tr>
        </table>
        <table border="1" cellpadding="8" cellspacing="0" style="margin-bottom: 30px;">
          <thead>
            <tr>
              <th colspan="2" style="text-align: left;">Services - ITEM ORDERED:</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${formData.product_title}</td>
              <td>
              <img src="${imageUrl}" alt="Product" class="product-image" style="width: 100px; height: 100px; margin-top: 5px;" />
            </tr>
          </tbody>
        </table>
        <div class="highlight-bar"></div>
        <table>
        <thead>
            <tr>
            <th>ITEM CODE</th>
            <th>UNIT PRICE</th>
            <th>QUANTITY</th>
            <th>SERVICE TOTAL PRICE</th>
            </tr>
        </thead>
        <tbody>
            <tr>
            <td>${formData.sku}</td>
            <td>$${formData.product_price}</td>
            <td>${formData.quantity}</td>
            <td>$${totalPriceSum}</td>
            </tr>
            <tr>
           
            </tr>
            <tr class="subtotal-section">
            <td colspan="3">SUBTOTAL</td>
            <td>$ ${totalPriceSum}</td>
            </tr>
            <tr class="subtotal-section">
            <td colspan="3">DISCOUNT</td>
            <td>${discountPercentage}%</td>
            </tr>
            <tr class="subtotal-section">
            <td colspan="3">TAX</td>
            <td>${taxVat}%</td>
            </tr>
            <tr class="subtotal-section" style="background-color:#007ca3; color:white;">
            <td colspan="3">GRAND SERVICE TOTAL PRICE</td>
            <td>$${grandTotal}</td>
            </tr>
        </tbody>
        </table>
        <div class="calc-box">CALCULATION</div>
        <div>
        UNIT PRICE * QUANTITY = SERVICE TOTAL PRICE<br>
        SUM OF ALL SERVICE PRICE – DISCOUNT + TAX = GRAND SERVICE TOTAL PRICE
        </div>
    </div>

    <div class="terms">TERMS AND CONDITIONS</div>
    <div class="terms-text">
      <div><strong>1. Quotation:</strong>
        <p> Orders are accepted subject to our right to adjust prices quoted to take account of any changes in the
            law or Government regulations requiring us to increase prices by way of direct taxation, import duties,
            customs and excise duties or otherwise. The prices are based on today's current costs of production
            and in the event of any increase in wages or costs of materials to us occurring after the confirmation
            or accepted contract, we shall be entitled to charge such increases to you. All quotations are valid at
            the time of quoting, error and omissions excluded.
        </p>
    </div>
      <div><strong>2. Price:</strong> 
        <p>Where applicable all prices are subject to VAT at the current rate. Prices quoted on this website are guide
        prices only subject to viewing final artwork. Once artwork and full specifications have been finalised, a
        quotation price will be confirmed. In most cases pricing is for non-branded items, without setup costs,
        printing costs, shipping and handling fees, and any other potential product specific costs. We aim to keep
        our pricing 100% accurate, however due to the fast-paced industry and nature of the online consumer
        product industry a small number of items on our website may be mis-priced due to updates. Whilst we aim
        to notify you at point of sale or enquiry, we reserve the right to alter our pricing without notice and refuse
        or cancel any orders placed on mis-priced product.</p>
     </div>
      <div><strong>3. Terms of Payment:</strong>
        <p> Payment shall be made in full within 30 days of receiving an invoice, unless we have agreed special settlement
            terms in writing. New Accounts - On all orders full payment is required on order placement. Credit is available
            subject to three positive payments on a pro-forma basis, alongside satisfactory credit checks.
            Pro forma invoices are due for payment immediately upon order placement. Production of orders will not
            begin until the invoice has been paid in full. Delay in payment can cause delay in the overall lead time for your
            order. EverythingBranded cannot be held responsible for failure to fulfil a delivery date as a result of late payment.
        </p>
      </div>
      <div><strong>4. Confidentiality:</strong>
        <p> All information in this quotation statement should always be kept confidential by both parties.</p>
      </div>
       <div><strong>5. Governing Law:</strong> 
        This quotation statement strictly observes all relevant industry standards and state laws. In circumstances of
        disputes, complications, or other forms of fraudulent activities, due process will take over.</p>
        </div>
    </div>
    <div class="">
        <div class="terms">CONTACT DETAILS </div>
        <div class="terms-text">
            <p><strong>Mr Asim</strong></p>
            <p>71-75 Shelton Street London, WC2H 9JQ, UK Call us at (44) 20 3807 9480 Email: hello@promoforbusiness.com</p>
        </div>
        <div class="logo">
            <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/Logo_14235b7e-d36a-4a7a-b850-45c37d5c16a7.png?v=1747661075" alt="PromoForBusiness Logo" />
        </div>
        <div class="mid-banner">
        <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/bottom-banner.png?v=1747661077" alt="Product Showcase" />
        </div>  
    </div>
  </div>
</body>
</html>`,
});
if (!adminEmailResponse.success) {
  console.error("❌ Email failed to send:", adminEmailResponse.error);
  console.log("Image URL:", formData.product_image);
  return withCors(json({ success: false, error: "Failed to send email" }, { status: 500 }));
}
// Send email to User (confirmation email)
const userEmailResponse = await sendEmailSengrid({
  userType: "customer",
  to: formData.email, //"rajsinghlodhi08@gmail.com", // Replace with formData.email for production
  subject: "Know Your Quote Evaluation",
  text: `Hello ${formData.full_name}`,
  html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Quotation Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f6f6f6;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 700px;
      background: #fff;
      margin: 20px auto;
      /* padding: 20px; */
      border: 1px solid #ddd;
    }
    .banner-top {
      text-align: right;
      color: white;
      font-style: italic;
      font-weight: bold;
    }
    .banner-top1 {
      background-color: #f07f20;
      padding: 20px;
    }    
    .greeting {
      padding: 0px 0px 0px 20px;
      
    }
    .logo {
      text-align: center;
      margin: 20px 0;
    }
    .logo img {
      max-height: 50px;
    }
    .mid-banner img {
      width: 100%;
      border-radius: 4px;
    }
    .quote-box {
      padding: 20px;
    }
    .quote-box h2 {
      background-color: #00a4d6;
      color: white;
      padding: 10px;
      font-size: 18px;
    }
    .product-img {
      max-width: 100px;
      margin: 10px 0;
    }
    .quote-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .quote-table th, .quote-table td {
      border: 1px solid #ccc;
      padding: 8px;
      text-align: left;
    }
    .quote-table th {
      background-color: #f07f20;
      color: white;
    }
    .totals {
      margin-top: 10px;
    }
    .terms {
      background-color: #f07f20;
      color: white;
      padding: 10px;
      font-weight: bold;
      margin-top: 20px;
    }
    .terms-text {
      padding: 10px 20px;
      font-size: 13px;
    }
    .header {
      background-color: #007ca3;
      color: white;
      text-align: center;
      padding: 10px 0;
      font-weight: bold;
      font-size: 18px;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    .meta div {
      width: 48%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #aaa;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #007ca3;
      color: white;
    }
    .subtotal-section {
      background-color: #d8ecf1;
      font-weight: bold;
    }
    .calc-box {
      margin-top: 20px;
      background-color: #007ca3;
      color: white;
      padding: 10px;
      font-weight: bold;
    }
    .calc-box + div {
      background-color: #f9f9f9;
      padding: 10px;
      font-size: 13px;
    }
    .name-heading {
      position: absolute;
      margin-top: -27px;
      padding: 0px 0px 0px 20px;
      color: black;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner-top1">
        
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;border: none;">
    <tr>
        <td style="padding: 0; width: 60%; vertical-align: middle;border: none">
        <p style="margin: 0; padding: 75px 20px 0px 20px; font-weight: bold; font-style: italic; color: black;">
            Dear ${formData.full_name}
        </p>
        </td>
        <td style="padding: 0; width: 40%; text-align: right;border: none">
        <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/know_your_qoute.png?v=1747661075" alt="Know Your Quote" style="max-width: 100%; height: auto;" />
        </td>
     </tr>
    </table>
    <div class="greeting">
      <p>Greetings!</p>
      <p>Thank you for reaching out to us regarding your service inquiry. We are pleased to provide you with the following quotation tailored to your needs.</p>
      <p>I'm excited to make this happen. Please feel free to reach out whenever you have further concerns.</p>
      <p>Best regards,<br><strong>Mr. Asim</strong><br>Product Advisor<br>Contact: (44) 20 3807 9480</p>
    </div>

    <div class="logo">
      <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/know_your_qoute.png?v=1747661075" alt="PromoForBusiness Logo" />
    </div>

    <div class="mid-banner">
      <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/upper-banner.png?v=1747661077" alt="Product Showcase" />
    </div>

    <div class="quote-box">
     <div class="header">QUOTE EVALUATION</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 10px;">
        <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>PREPARED FOR:</strong> ${formData.full_name}
            </td>
            <td style="padding: 8px 0; font-size: 14px;border:none;"> 
              <strong> DATE : </strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}    
            </td>
        </tr>
        <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>COMPANY : </strong> ${formData.company}
            </td>
            <td style="padding: 8px 0; font-size: 14px;border:none;"> 
              <strong>EMAIL : </strong>${formData.email} 
            </td>
        </tr>
         <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>PHONE NUMBER : </strong> ${formData.phone}
            </td>
            <td style="padding: 8px 0; font-size: 14px;border:none;"> 
              <strong>MESSAGE : </strong>${formData.message} 
            </td>
        </tr>
        <tr>
            <td colspan="2" style="padding: 8px 0; font-size: 14px;border:none;">
              <strong>PREPARED BY:</strong> Mr. Asim
            </td>
            <td style="border:none; padding: 8px 0; font-size: 14px;">
                <a href="mailto:hello@promoforbusiness.com" style="color: #007ca3; text-decoration: none;">
                hello@promoforbusiness.com
                </a>
           </td>
        </tr>
        </table>
        <table border="1" cellpadding="8" cellspacing="0" style="margin-bottom: 30px;">
          <thead>
            <tr>
              <th colspan="2" style="text-align: left;">Services - ITEM ORDERED:</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${formData.product_title}</td>
              <td>
                <img src="${imageUrl}" alt="Product" class="product-image" style="width: 100px; height: 100px; margin-top: 5px;" />
            </tr>
          </tbody>
        </table>
        <div class="highlight-bar"></div>
        <table>
        <thead>
            <tr>
            <th>ITEM CODE</th>
            <th>UNIT PRICE</th>
            <th>QUANTITY</th>
            <th>SERVICE TOTAL PRICE</th>
            </tr>
        </thead>
        <tbody>
            <tr>
            <td>${formData.sku}</td>
            <td>$ ${formData.product_price}</td>
            <td>${formData.quantity}</td>
            <td>$ ${totalPriceSum}</td>
            </tr>
            <tr>
            
            <tr class="subtotal-section">
            <td colspan="3">SUBTOTAL</td>
            <td>$ ${totalPriceSum}</td>
            </tr>
            <tr class="subtotal-section">
            <td colspan="3">DISCOUNT</td>
            <td>${discountPercentage}%</td>
            </tr>
            <tr class="subtotal-section">
            <td colspan="3">TAX</td>
            <td>${taxVat}%</td>
            </tr>
            <tr class="subtotal-section" style="background-color:#007ca3; color:white;">
            <td colspan="3">GRAND SERVICE TOTAL PRICE</td>
            <td>$ ${grandTotal}</td>
            </tr>
        </tbody>
        </table>
        <div class="calc-box">CALCULATION</div>
        <div>
        UNIT PRICE * QUANTITY = SERVICE TOTAL PRICE<br>
        SUM OF ALL SERVICE PRICE – DISCOUNT + TAX = GRAND SERVICE TOTAL PRICE
        </div>
    </div>

    <div class="terms">TERMS AND CONDITIONS</div>
    <div class="terms-text">
      <div><strong>1. Quotation:</strong>
        <p> Orders are accepted subject to our right to adjust prices quoted to take account of any changes in the
            law or Government regulations requiring us to increase prices by way of direct taxation, import duties,
            customs and excise duties or otherwise. The prices are based on today's current costs of production
            and in the event of any increase in wages or costs of materials to us occurring after the confirmation
            or accepted contract, we shall be entitled to charge such increases to you. All quotations are valid at
            the time of quoting, error and omissions excluded.
        </p>
    </div>
      <div><strong>2. Price:</strong> 
        <p>Where applicable all prices are subject to VAT at the current rate. Prices quoted on this website are guide
        prices only subject to viewing final artwork. Once artwork and full specifications have been finalised, a
        quotation price will be confirmed. In most cases pricing is for non-branded items, without setup costs,
        printing costs, shipping and handling fees, and any other potential product specific costs. We aim to keep
        our pricing 100% accurate, however due to the fast-paced industry and nature of the online consumer
        product industry a small number of items on our website may be mis-priced due to updates. Whilst we aim
        to notify you at point of sale or enquiry, we reserve the right to alter our pricing without notice and refuse
        or cancel any orders placed on mis-priced product.</p>
     </div>
      <div><strong>3. Terms of Payment:</strong>
        <p> Payment shall be made in full within 30 days of receiving an invoice, unless we have agreed special settlement
            terms in writing. New Accounts - On all orders full payment is required on order placement. Credit is available
            subject to three positive payments on a pro-forma basis, alongside satisfactory credit checks.
            Pro forma invoices are due for payment immediately upon order placement. Production of orders will not
            begin until the invoice has been paid in full. Delay in payment can cause delay in the overall lead time for your
            order. EverythingBranded cannot be held responsible for failure to fulfil a delivery date as a result of late payment.
        </p>
      </div>
      <div><strong>4. Confidentiality:</strong>
        <p> All information in this quotation statement should always be kept confidential by both parties.</p>
      </div>
       <div><strong>5. Governing Law:</strong> 
        This quotation statement strictly observes all relevant industry standards and state laws. In circumstances of
        disputes, complications, or other forms of fraudulent activities, due process will take over.</p>
        </div>
    </div>
    <div class="">
        <div class="terms">CONTACT DETAILS </div>
        <div class="terms-text">
            <p><strong>Mr Asim</strong></p>
            <p>71-75 Shelton Street London, WC2H 9JQ, UK Call us at (44) 20 3807 9480 Email: hello@promoforbusiness.com</p>
        </div>
        <div class="logo">
            <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/Logo_14235b7e-d36a-4a7a-b850-45c37d5c16a7.png?v=1747661075" alt="PromoForBusiness Logo" />
        </div>
        <div class="mid-banner">
        <img src="https://cdn.shopify.com/s/files/1/0867/2444/4507/files/bottom-banner.png?v=1747661077" alt="Product Showcase" />
        </div>  
    </div>
  </div>
</body>
</html>`,
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

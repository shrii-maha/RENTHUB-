import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function testEmail() {
  try {
    console.log(`Attempting to send test email from ${process.env.EMAIL_USER}...`);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "RentHub Test Email",
      text: "If you see this, your Gmail SMTP configuration is working correctly!"
    });
    console.log('✅ Test email sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send test email:', err);
  }
}

testEmail();

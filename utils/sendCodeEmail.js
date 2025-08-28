import nodemailer from "nodemailer";

export async function sendCodeEmail(email, code) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your Verification Code",
    html: `<p>Your verification code is:</p><h2>${code}</h2>`
  });
}

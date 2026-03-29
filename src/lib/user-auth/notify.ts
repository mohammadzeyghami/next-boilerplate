import "server-only";

/**
 * Send OTP via SMS. Wire your provider (Twilio, etc.) here.
 */
export async function sendOtpSms(phoneNumber: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[SMS OTP stub] ${phoneNumber} -> ${code}`);
  }
  // TODO: integrate SMS provider
}

/**
 * Send OTP via email using the same SMTP config as NextAuth Email provider when available.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.info(`[Email OTP stub] ${email} -> ${code}`);
  }
  const server = process.env.AUTH_EMAIL_SERVER;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!server || !from) {
    return;
  }
  const nodemailer = await import("nodemailer");
  const parsed = new URL(server);
  const transporter = nodemailer.createTransport({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 587,
    secure: parsed.protocol === "smtps:",
    auth: {
      user: decodeURIComponent(parsed.username),
      pass: decodeURIComponent(parsed.password),
    },
  });
  await transporter.sendMail({
    from,
    to: email,
    subject: "Your verification code",
    text: `Your code is: ${code}\nIt expires in 10 minutes.`,
  });
}

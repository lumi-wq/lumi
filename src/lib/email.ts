/**
 * Абстракція надсилання листів. У продакшені підключіть SMTP/Resend/SES.
 * У розробці код просто виводиться в консоль сервера.
 */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.SMTP_URL) {
    // TODO: інтеграція з реальним поштовим сервісом
    return;
  }
  console.log(`\n[LUMI OTP] Код для ${email}: ${code}\n`);
}

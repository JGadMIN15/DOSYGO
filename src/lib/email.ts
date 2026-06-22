import { Resend } from "resend";

/**
 * Send a 6-digit verification code by email via Resend.
 * Requires RESEND_API_KEY and a verified sender (EMAIL_FROM, on your domain).
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const from = process.env.EMAIL_FROM ?? "Dos&Go <verificacion@dosygo.es>";
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Tu código de verificación Dos&Go: ${code}`,
    text: `Tu código de verificación de Dos&Go es: ${code}\n\nCaduca en 10 minutos. Si no has sido tú, ignora este mensaje.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 8px">Dos&amp;Go</h2>
        <p style="color:#555;margin:0 0 16px">Tu código de verificación es:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f3f4f6;border-radius:12px;padding:16px;text-align:center;margin:0 0 16px">${code}</p>
        <p style="color:#888;font-size:13px">Caduca en 10 minutos. Si no has sido tú, ignora este mensaje.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${JSON.stringify(error)}`);
  }
}

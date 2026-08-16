import { Resend } from "resend";
import { env } from "../config/env.js";

// Mismo proveedor que usaba el backend Java (Resend HTTP API) — la API key
// filtrada en el repo viejo debe rotarse, ver plan sección 9.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(to: string, rawToken: string): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  if (!resend) {
    // En desarrollo sin RESEND_API_KEY configurada, no rompemos el flujo:
    // se loguea el link para poder probar manualmente.
    console.warn(`[email] RESEND_API_KEY no configurada. Link de reset: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: "Sentiment App <no-reply@sentiment-app.dev>",
    to,
    subject: "Recuperación de contraseña",
    html: `<p>Hacé clic para restablecer tu contraseña (válido 30 minutos):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

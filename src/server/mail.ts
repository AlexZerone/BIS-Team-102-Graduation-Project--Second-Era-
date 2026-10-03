/**
 * ponytail: development "mail" prints to the server log. To send real email, call a provider
 * (Resend, Brevo, SES) here; nothing else needs to change.
 */
export async function sendMail(msg: { to: string; subject: string; text: string }) {
  console.info(`\n--- email to ${msg.to} ---\nSubject: ${msg.subject}\n\n${msg.text}\n--- end email ---\n`);
}

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

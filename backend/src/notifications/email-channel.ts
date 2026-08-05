import { NotificationChannel } from './types';

/**
 * No SMTP provider is configured yet, so this logs what would be sent instead of
 * actually delivering it. Swap the body for a real transport (e.g. nodemailer +
 * SMTP env vars) once email delivery is needed for real — the interface won't change.
 */
export const emailChannel: NotificationChannel = {
  /** Logs the email that would be sent instead of delivering it (no SMTP provider configured yet). */
  async send({ news, destination, categoryName }): Promise<void> {
    console.log(`[email:stub] to=${destination} subject="[${categoryName}] ${news.title}" url=${news.url}`);
  },
};

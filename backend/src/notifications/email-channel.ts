import { News } from '@prisma/client';
import { mkdir, appendFile } from 'fs/promises';
import path from 'path';
import { NotificationChannel } from './types';

/** One news item plus the category it belongs to, as included in a digest email. */
export interface DigestItem {
  news: News;
  categoryName: string;
}

/** One file per recipient simulates that user's inbox; each send appends a message. */
const SIMULATION_DIR = path.join(__dirname, '..', '..', 'email-simulated');

async function appendToSimulatedInbox(destination: string, subject: string, body: string): Promise<void> {
  const line = `[${new Date().toISOString()}] subject="${subject}"\n${body}\n\n`;
  await mkdir(SIMULATION_DIR, { recursive: true });
  await appendFile(path.join(SIMULATION_DIR, `${destination}.log`), line, 'utf8');
}

/**
 * No SMTP provider is configured yet, so this logs what would be sent instead of
 * actually delivering it, and also appends it to `email-simulated/<destination>.log`
 * so a recipient's simulated inbox can be inspected. Swap the bodies for a real
 * transport (e.g. nodemailer + SMTP env vars) once email delivery is needed for
 * real — the interfaces won't change.
 */
export const emailChannel: NotificationChannel & {
  sendDigest(items: DigestItem[], destination: string): Promise<void>;
} = {
  /** Logs the email that would be sent instead of delivering it (no SMTP provider configured yet). */
  async send({ news, destination, categoryName }): Promise<void> {
    const subject = `[${categoryName}] ${news.title}`;
    console.log(`[email:stub] to=${destination} subject="${subject}" url=${news.url}`);
    await appendToSimulatedInbox(destination, subject, news.url);
  },

  /** Logs a single digest email covering every queued item for one user, instead of one email per item. */
  async sendDigest(items, destination): Promise<void> {
    const subject = items.length === 1 ? `[${items[0].categoryName}] ${items[0].news.title}` : `${items.length} new updates`;
    const body = items.map((item) => `[${item.categoryName}] ${item.news.title} — ${item.news.url}`).join('\n');
    console.log(`[email:stub] to=${destination} subject="${subject}"\n${body}`);
    await appendToSimulatedInbox(destination, subject, body);
  },
};

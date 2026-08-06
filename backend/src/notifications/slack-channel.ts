import { mkdir, appendFile } from 'fs/promises';
import path from 'path';
import { NotificationChannel } from './types';

/** One file per category simulates that category's Slack channel; each send appends a message. */
const SIMULATION_DIR = path.join(__dirname, '..', '..', 'slack-simulated');

/**
 * Posts to the category's real Slack webhook when `destination` is set. Categories without
 * a configured webhook fall back to simulated delivery: the formatted message is appended to
 * `slack-simulated/<categorySlug>.log` instead.
 */
export const slackChannel: NotificationChannel = {
  /** Sends the news item to the Slack webhook at `destination`, or the simulated channel file if none is configured. */
  async send({ news, destination, categoryName, categorySlug }): Promise<void> {
    const text = `*[${categoryName}]* <${news.url}|${news.title}>${news.summary ? `\n${news.summary}` : ''}`;

    if (destination) {
      const res = await fetch(destination, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`Slack webhook responded with ${res.status}: ${await res.text()}`);
      }
      return;
    }

    const line = `[${new Date().toISOString()}] ${text}\n`;
    await mkdir(SIMULATION_DIR, { recursive: true });
    await appendFile(path.join(SIMULATION_DIR, `${categorySlug}.log`), line, 'utf8');
  },
};

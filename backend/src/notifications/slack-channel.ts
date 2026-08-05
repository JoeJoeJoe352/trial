import { NotificationChannel } from './types';

/** Posts a formatted message to a Slack incoming webhook URL. */
export const slackChannel: NotificationChannel = {
  /** Sends the news item to the Slack webhook at `destination`, throwing if Slack rejects it. */
  async send({ news, destination, categoryName }): Promise<void> {
    const text = `*[${categoryName}]* <${news.url}|${news.title}>${news.summary ? `\n${news.summary}` : ''}`;

    const res = await fetch(destination, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`Slack webhook responded with ${res.status}: ${await res.text()}`);
    }
  },
};

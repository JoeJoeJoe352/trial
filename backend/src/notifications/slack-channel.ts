import { NotificationChannel } from './types';

export const slackChannel: NotificationChannel = {
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

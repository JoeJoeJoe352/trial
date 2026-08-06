import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { News } from '@prisma/client';
import { slackChannel } from './slack-channel';

const mkdirMock = vi.fn();
const appendFileMock = vi.fn();

vi.mock('fs/promises', () => ({
  mkdir: (...args: unknown[]) => mkdirMock(...args),
  appendFile: (...args: unknown[]) => appendFileMock(...args),
}));

function makeNews(overrides: Partial<News> = {}): News {
  return {
    id: 'news-1',
    externalId: 'ext-1',
    title: 'Test headline',
    summary: 'Test summary',
    url: 'https://example.com/story',
    publishedAt: new Date(),
    ingestedAt: new Date(),
    sourceId: 'source-1',
    ...overrides,
  } as News;
}

describe('slackChannel.send', () => {
  beforeEach(() => {
    mkdirMock.mockReset().mockResolvedValue(undefined);
    appendFileMock.mockReset().mockResolvedValue(undefined);
    vi.unstubAllGlobals();
  });

  it('posts to the real webhook when a destination is configured, and never touches the filesystem', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);

    const news = makeNews();
    await slackChannel.send({
      news,
      destination: 'https://hooks.slack.com/services/T000/B000/XXX',
      categoryName: 'Markets',
      categorySlug: 'markets',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://hooks.slack.com/services/T000/B000/XXX');
    expect(init).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const body = JSON.parse(init.body);
    expect(body.text).toContain('Markets');
    expect(body.text).toContain(news.title);
    expect(body.text).toContain(news.url);

    expect(mkdirMock).not.toHaveBeenCalled();
    expect(appendFileMock).not.toHaveBeenCalled();
  });

  it('throws when the webhook responds with a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' }));

    await expect(
      slackChannel.send({
        news: makeNews(),
        destination: 'https://hooks.slack.com/services/T000/B000/XXX',
        categoryName: 'Markets',
        categorySlug: 'markets',
      }),
    ).rejects.toThrow(/500/);
  });

  it('falls back to the simulated channel file when no webhook is configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const news = makeNews({ title: 'Breaking thing happened' });
    await slackChannel.send({
      news,
      destination: '',
      categoryName: 'Breaking News',
      categorySlug: 'breaking-news',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(appendFileMock).toHaveBeenCalledTimes(1);

    const [filePath, contents] = appendFileMock.mock.calls[0];
    expect(filePath.replace(/\\/g, '/')).toMatch(/slack-simulated\/breaking-news\.log$/);
    expect(contents).toContain('Breaking thing happened');
    expect(contents).toContain(news.url);
  });
});

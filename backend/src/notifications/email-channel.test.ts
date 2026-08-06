import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { News } from '@prisma/client';
import { emailChannel } from './email-channel';

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
    summary: null,
    url: 'https://example.com/story',
    publishedAt: new Date(),
    ingestedAt: new Date(),
    sourceId: 'source-1',
    ...overrides,
  } as News;
}

describe('emailChannel', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mkdirMock.mockReset().mockResolvedValue(undefined);
    appendFileMock.mockReset().mockResolvedValue(undefined);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('send', () => {
    it('logs the stub email and appends it to the recipient\'s simulated inbox file', async () => {
      const news = makeNews();
      await emailChannel.send({
        news,
        destination: 'user@example.com',
        categoryName: 'Markets',
        categorySlug: 'markets',
      });

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0][0]).toContain('user@example.com');
      expect(logSpy.mock.calls[0][0]).toContain('[Markets] Test headline');

      expect(mkdirMock).toHaveBeenCalledTimes(1);
      expect(appendFileMock).toHaveBeenCalledTimes(1);
      const [filePath, contents] = appendFileMock.mock.calls[0];
      expect(filePath.replace(/\\/g, '/')).toMatch(/email-simulated\/user@example\.com\.log$/);
      expect(contents).toContain('[Markets] Test headline');
      expect(contents).toContain(news.url);
    });
  });

  describe('sendDigest', () => {
    it('uses the news title as the subject for a single item', async () => {
      const items = [{ news: makeNews({ title: 'Only item' }), categoryName: 'Disasters' }];
      await emailChannel.sendDigest(items, 'user@example.com');

      expect(logSpy.mock.calls[0][0]).toContain('subject="[Disasters] Only item"');
      const [, contents] = appendFileMock.mock.calls[0];
      expect(contents).toContain('subject="[Disasters] Only item"');
    });

    it('summarizes multiple items under a generic subject and lists each one in the body', async () => {
      const items = [
        { news: makeNews({ id: 'n1', title: 'First' }), categoryName: 'Markets' },
        { news: makeNews({ id: 'n2', title: 'Second' }), categoryName: 'Disasters' },
      ];
      await emailChannel.sendDigest(items, 'user@example.com');

      const [, contents] = appendFileMock.mock.calls[0];
      expect(contents).toContain('subject="2 new updates"');
      expect(contents).toContain('[Markets] First');
      expect(contents).toContain('[Disasters] Second');
    });
  });
});

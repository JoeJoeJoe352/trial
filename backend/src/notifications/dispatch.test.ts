import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Prisma } from '@prisma/client';
import type { Category, News } from '@prisma/client';

const deliveryCreateMock = vi.fn();
vi.mock('../db', () => ({
  prisma: { delivery: { create: (...args: unknown[]) => deliveryCreateMock(...args) } },
}));

const slackSendMock = vi.fn();
vi.mock('./registry', () => ({
  notificationChannels: {
    SLACK: { send: (...args: unknown[]) => slackSendMock(...args) },
    EMAIL: { send: vi.fn() },
  },
}));

import { dispatchNewsToChannels } from './dispatch';

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

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Markets',
    slug: 'markets',
    slackWebhookUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Category;
}

function p2002(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '0.0.0' });
}

describe('dispatchNewsToChannels', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    deliveryCreateMock.mockReset();
    slackSendMock.mockReset();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('always attempts Slack for the category, even with zero subscribers', async () => {
    slackSendMock.mockResolvedValue(undefined);
    deliveryCreateMock.mockResolvedValue({});

    const news = makeNews();
    const category = makeCategory();
    await dispatchNewsToChannels(news, category, []);

    expect(slackSendMock).toHaveBeenCalledTimes(1);
    expect(slackSendMock).toHaveBeenCalledWith({
      news,
      destination: '',
      categoryName: 'Markets',
      categorySlug: 'markets',
    });
  });

  it('records a SENT delivery when the Slack send succeeds', async () => {
    slackSendMock.mockResolvedValue(undefined);
    deliveryCreateMock.mockResolvedValue({});

    await dispatchNewsToChannels(makeNews(), makeCategory(), []);

    expect(deliveryCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ newsId: 'news-1', channel: 'SLACK', categoryId: 'cat-1', status: 'SENT', error: undefined }),
    });
  });

  it('records a FAILED delivery (without throwing) when the Slack send rejects', async () => {
    slackSendMock.mockRejectedValue(new Error('webhook down'));
    deliveryCreateMock.mockResolvedValue({});

    await expect(dispatchNewsToChannels(makeNews(), makeCategory(), [])).resolves.toBeUndefined();

    expect(deliveryCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ channel: 'SLACK', status: 'FAILED', error: 'webhook down', sentAt: null }),
    });
  });

  it('swallows a duplicate-delivery (P2002) error when recording the Slack attempt', async () => {
    slackSendMock.mockResolvedValue(undefined);
    deliveryCreateMock.mockRejectedValue(p2002());

    await expect(dispatchNewsToChannels(makeNews(), makeCategory(), [])).resolves.toBeUndefined();
  });

  it('queues one PENDING email delivery per subscribed user', async () => {
    slackSendMock.mockResolvedValue(undefined);
    deliveryCreateMock.mockResolvedValue({});

    const users = [
      { id: 'user-1', email: 'a@example.com' },
      { id: 'user-2', email: 'b@example.com' },
    ];
    await dispatchNewsToChannels(makeNews(), makeCategory(), users);

    const emailCalls = deliveryCreateMock.mock.calls.filter(([arg]) => arg.data.channel === 'EMAIL');
    expect(emailCalls).toHaveLength(2);
    expect(emailCalls[0][0]).toEqual({ data: { newsId: 'news-1', channel: 'EMAIL', userId: 'user-1' } });
    expect(emailCalls[1][0]).toEqual({ data: { newsId: 'news-1', channel: 'EMAIL', userId: 'user-2' } });
  });

  it('swallows a duplicate (P2002) error when enqueuing an email', async () => {
    slackSendMock.mockResolvedValue(undefined);
    deliveryCreateMock.mockImplementation(({ data }: { data: { channel: string } }) =>
      data.channel === 'EMAIL' ? Promise.reject(p2002()) : Promise.resolve({}),
    );

    await expect(
      dispatchNewsToChannels(makeNews(), makeCategory(), [{ id: 'user-1', email: 'a@example.com' }]),
    ).resolves.toBeUndefined();
  });

  it('rethrows unexpected (non-P2002) errors from delivery creation', async () => {
    slackSendMock.mockResolvedValue(undefined);
    deliveryCreateMock.mockRejectedValue(new Error('db is down'));

    await expect(dispatchNewsToChannels(makeNews(), makeCategory(), [])).rejects.toThrow('db is down');
  });
});

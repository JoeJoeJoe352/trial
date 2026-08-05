/** A feed item normalized to a common shape regardless of which source adapter produced it. */
export interface NormalizedItem {
  externalId: string;
  title: string;
  summary?: string;
  url: string;
  publishedAt: Date;
}

/** A source that must be actively polled on an interval (e.g. RSS). */
export interface PollAdapter {
  kind: 'poll';
  fetch(sourceUrl: string): Promise<NormalizedItem[]>;
}

/** A source that pushes items over a persistent connection (e.g. a websocket feed). */
export interface StreamAdapter {
  kind: 'stream';
  connect(sourceUrl: string, onItem: (item: NormalizedItem) => void): () => void;
}

/** Any adapter that can supply items for a {@link Source}, whether polled or streamed. */
export type SourceAdapter = PollAdapter | StreamAdapter;

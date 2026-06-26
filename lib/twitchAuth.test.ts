import { beforeEach, describe, expect, afterEach, it, vi } from 'vitest';

const { invokeMock, listenMock, openUrlMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  listenMock: vi.fn(),
  openUrlMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: listenMock,
}));

vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: openUrlMock,
}));

import { loginWithTwitch } from './twitchAuth';

describe('loginWithTwitch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    invokeMock.mockReset();
    listenMock.mockReset();
    openUrlMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the token when the redirect contains an auth code', async () => {
    invokeMock.mockResolvedValueOnce(1234).mockResolvedValueOnce({ access_token: 'abc123' });

    let redirectHandler: ((event: { payload: string }) => void) | undefined;
    listenMock.mockImplementation(
      async (_channel: string, callback: (event: { payload: string }) => void) => {
        redirectHandler = callback;
        await Promise.resolve();
        return () => undefined;
      }
    );

    const promise = loginWithTwitch();

    await Promise.resolve();
    await Promise.resolve();
    expect(listenMock).toHaveBeenCalledOnce();

    redirectHandler?.({ payload: 'http://localhost:3333/?code=test-code' });

    await expect(promise).resolves.toBe('abc123');
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'exchange_twitch_code', {
      code: 'test-code',
      port: 1234,
    });
  });

  it('rejects when the redirect contains an error', async () => {
    invokeMock.mockResolvedValueOnce(3333);

    let redirectHandler: ((event: { payload: string }) => void) | undefined;
    listenMock.mockImplementation(
      async (_channel: string, callback: (event: { payload: string }) => void) => {
        redirectHandler = callback;
        await Promise.resolve();
        return () => undefined;
      }
    );

    const promise = loginWithTwitch();

    await Promise.resolve();
    redirectHandler?.({ payload: 'http://localhost:3333/?error=access_denied' });

    await expect(promise).rejects.toThrow('access_denied');
  });

  it('rejects on timeout', async () => {
    invokeMock.mockResolvedValueOnce(4444);
    listenMock.mockImplementation(() => () => undefined);
    await Promise.resolve();

    const promise = loginWithTwitch();

    await Promise.resolve();
    vi.advanceTimersByTime(5 * 60 * 1000);
    await Promise.resolve();

    await expect(promise).rejects.toThrow('OAuth timeout');
  });
});

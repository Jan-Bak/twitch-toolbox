import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveTwitchUserId } from './twitchChatService';

describe('resolveTwitchUserId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the Twitch users endpoint and returns the user id', async () => {
    const capturedRequests: Array<[string, RequestInit?]> = [];
    const fetchMock = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockImplementation((input: string, init?: RequestInit) => {
        capturedRequests.push([input, init]);

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ id: '123456' }] }),
        } as Response);
      });

    vi.stubGlobal('fetch', fetchMock);

    const userId = await resolveTwitchUserId('dayra1se', 'access-token');

    expect(userId).toBe('123456');

    const capturedRequest = capturedRequests[0] as [string, RequestInit?] | undefined;
    const url = capturedRequest?.[0];
    const requestOptions = capturedRequest?.[1];

    expect(url).toBe('https://api.twitch.tv/helix/users?login=dayra1se');

    const headers = requestOptions?.headers as Record<string, string> | undefined;
    expect(headers).toBeDefined();
    expect(headers?.['Authorization']).toBe('Bearer access-token');
    expect(headers?.['Client-ID']).toEqual(expect.any(String));
  });
});

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';

const CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID;

const SCOPES = ['user:read:email', 'channel:read:subscriptions'];

const loginWithTwitch = async (): Promise<string> => {
  if (!CLIENT_ID) {
    throw new Error('VITE_TWITCH_CLIENT_ID is not set');
  }

  const port = await invoke<number>('start_oauth_server');

  const redirectUri = `http://localhost:${port}`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
  });

  const authUrl = `https://id.twitch.tv/oauth2/authorize?${params}`;

  const token = await new Promise<string>((resolve, reject) => {
    let unlisten: (() => void) | undefined;

    let cleanup = () => {
      unlisten?.();
      unlisten = undefined;
    };

    const timeoutPromise = new Promise<never>((_, rejectTimeout) => {
      const timeoutId = window.setTimeout(
        () => {
          cleanup();
          rejectTimeout(new Error('OAuth timeout'));
        },
        5 * 60 * 1000
      );

      const originalCleanup = cleanup;
      cleanup = () => {
        window.clearTimeout(timeoutId);
        originalCleanup();
      };
    });

    const redirectPromise = new Promise<string>((resolveRedirect, rejectRedirect) => {
      const handleRedirect = async (event: { payload: string }) => {
        const url = new URL(event.payload);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error || !code) {
          cleanup();
          rejectRedirect(new Error(error ?? 'Missing auth code in redirect URL'));
          return;
        }

        try {
          const tokenData = await invoke<{ access_token: string }>('exchange_twitch_code', {
            code,
            port,
          });

          cleanup();
          resolveRedirect(tokenData.access_token);
        } catch (e) {
          cleanup();
          rejectRedirect(e instanceof Error ? e : new Error(String(e)));
        }
      };

      void (async () => {
        unlisten = await listen<string>('twitch-oauth-redirect', (event) => {
          void handleRedirect(event);
        });

        void openUrl(authUrl);
      })().catch((e) => {
        cleanup();
        rejectRedirect(e instanceof Error ? e : new Error(String(e)));
      });
    });

    void Promise.race([redirectPromise, timeoutPromise]).then(resolve, reject);
  });

  return token;
};

export { loginWithTwitch };

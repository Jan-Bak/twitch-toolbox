import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { openUrl } from '@tauri-apps/plugin-opener';
import useUser, { type UserProfile } from '@/stores/user';

const CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID;

const SCOPES = ['user:read:email', 'channel:read:subscriptions'];

type TwitchTokenData = {
  access_token: string;
  refresh_token?: string | null;
  expires_in?: number;
  token_type?: string;
};

type TwitchUser = {
  id?: string;
  login?: string;
  display_name?: string;
  email?: string;
  profile_image_url?: string;
};

type TwitchUserResponse = {
  data?: TwitchUser[];
};

const mapTwitchUserToProfile = (user: TwitchUser | null | undefined): UserProfile | null => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    login: user.login,
    display_name: user.display_name,
    email: user.email,
    profile_image_url: user.profile_image_url,
  };
};

const fetchTwitchUser = async (accessToken: string): Promise<UserProfile | null> => {
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-ID': CLIENT_ID ?? '',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Twitch user: ${response.status}`);
  }

  const payload = (await response.json()) as TwitchUserResponse;
  return mapTwitchUserToProfile(payload.data?.[0] ?? null);
};

const refreshAccessToken = async (refreshToken: string): Promise<TwitchTokenData> => {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID ?? '',
      client_secret: (import.meta.env.VITE_TWITCH_CLIENT_SECRET as string) ?? '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh Twitch token: ${response.status}`);
  }

  return (await response.json()) as TwitchTokenData;
};

const persistAuthState = async (
  token: string,
  user: UserProfile | null,
  refreshToken?: string | null
) => {
  const { setAuthState } = useUser.getState();
  await invoke('save_access_token', { token });
  if (refreshToken) {
    await invoke('save_refresh_token', { token: refreshToken });
  }
  setAuthState({ isAuthenticated: true, user, accessToken: token });
};

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
          const tokenData = await invoke<TwitchTokenData>('exchange_twitch_code', {
            code,
            port,
          });

          const token = tokenData.access_token;
          const refreshToken = tokenData.refresh_token ?? null;
          const userProfile = await fetchTwitchUser(token);

          await persistAuthState(token, userProfile, refreshToken);

          cleanup();
          resolveRedirect(token);
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

const restoreAuthSession = async () => {
  const { setAuthState } = useUser.getState();
  try {
    const token = await invoke<string | null>('get_access_token');
    const refreshToken = await invoke<string | null>('get_refresh_token');

    if (!token) {
      setAuthState({ isAuthenticated: false, accessToken: null });
      return null;
    }

    const user = await fetchTwitchUser(token);
    setAuthState({ isAuthenticated: true, user, accessToken: token });

    if (!refreshToken) {
      return token;
    }

    try {
      const refreshed = await refreshAccessToken(refreshToken);
      const refreshedToken = refreshed.access_token;
      const refreshedUser = await fetchTwitchUser(refreshedToken);
      await persistAuthState(
        refreshedToken,
        refreshedUser,
        refreshed.refresh_token ?? refreshToken
      );
      return refreshedToken;
    } catch {
      return token;
    }
  } catch {
    setAuthState({ isAuthenticated: false, accessToken: null });
    return null;
  }
};

export { loginWithTwitch, restoreAuthSession, refreshAccessToken, mapTwitchUserToProfile };

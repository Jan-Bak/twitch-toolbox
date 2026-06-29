import { beforeEach, describe, expect, it } from 'vitest';
import useUser from './user';

describe('useUser auth state', () => {
  beforeEach(() => {
    useUser.getState().clearAuth();
  });

  it('stores authentication status and user profile data', () => {
    const user = {
      id: '123',
      login: 'testuser',
      display_name: 'Test User',
      email: 'test@example.com',
      profile_image_url: 'https://example.com/avatar.png',
    };

    useUser.getState().setAuthState({ isAuthenticated: true, user });

    expect(useUser.getState().isAuthenticated).toBe(true);
    expect(useUser.getState().user).toEqual(user);
  });
});

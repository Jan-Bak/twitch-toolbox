import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@/components/theme-provider';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { invoke } from '@tauri-apps/api/core';
import { routeTree } from './routeTree.gen';
import useUser from '@/stores/user';

export type RouterContext = {
  auth: {
    isAuthenticated: boolean;
  };
};

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultStaleTime: 5000,
  scrollRestoration: true,
  context: {
    auth: undefined!,
  } satisfies RouterContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const RootComponent = () => {
  const { isAuthenticated, setAuthState } = useUser();

  useEffect(() => {
    void (async () => {
      try {
        const token = await invoke<string | null>('get_access_token');
        if (token) {
          setAuthState({ isAuthenticated: true, accessToken: token });
        }
      } catch {
        setAuthState({ isAuthenticated: false, accessToken: null });
      }
    })();
  }, [setAuthState]);

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <RouterProvider router={router} context={{ auth: { isAuthenticated } }} />
      </ThemeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<RootComponent />);

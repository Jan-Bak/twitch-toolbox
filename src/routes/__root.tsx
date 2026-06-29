import { useEffect } from 'react';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { listen } from '@tauri-apps/api/event';
import { RouterContext } from '../main';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
      </div>
    );
  },
});

function Root() {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const subscribe = async () => {
      unlisten = await listen<string>('twitch-loop-writer-error', (event) => {
        toast.error('Twitch chat send failed', {
          description: event.payload || 'The loop could not send a chat message.',
        });
      });
    };

    void subscribe().catch((error) => {
      console.error('Failed to subscribe to Twitch loop writer errors', error);
    });

    return () => {
      unlisten?.();
    };
  }, []);

  return (
    <>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
      <Toaster richColors position="bottom-right" />
    </>
  );
}

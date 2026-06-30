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
      unlisten = await listen<{ title?: string; description?: string }>(
        'tauri-api-error',
        (event) => {
          toast.error(event.payload.title ?? 'Rust API error', {
            description:
              event.payload.description ?? 'An error occurred while calling the backend.',
          });
        }
      );
    };

    void subscribe().catch((error) => {
      console.error('Failed to subscribe to Rust API errors', error);
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

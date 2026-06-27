import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/menu',
        search: { redirect: location.href },
      });
    }
  },
});

function Index() {
  return <div>Bruh, you shouldn't be here.</div>;
}

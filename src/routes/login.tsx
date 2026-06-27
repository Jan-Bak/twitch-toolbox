import { createFileRoute, redirect } from '@tanstack/react-router';
import LoginComponent from '../pages/login/login';

export const Route = createFileRoute('/login')({
  component: Login,
  beforeLoad: ({ context, location }) => {
    if (context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/menu',
        search: { redirect: location.href },
      });
    }
  },
});

function Login() {
  return (
    <div className="bg-black min-h-screen">
      <LoginComponent />
    </div>
  );
}

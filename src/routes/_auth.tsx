import AppSidebar from '@/components/layout/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: () => <AuthLayout />,
});

const AuthLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="p-2 w-full">
        <Outlet />
      </div>
    </SidebarProvider>
  );
};

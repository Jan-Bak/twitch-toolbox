import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/menu')({
  component: Menu,
});

function Menu() {
  return <div>Hello "/_auth/menu"!</div>;
}

import SavedLoops from '@/src/pages/loop-writer/saved';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/loop-writer/saved')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <SavedLoops />
    </>
  );
}

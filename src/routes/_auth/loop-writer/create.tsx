import { createFileRoute } from '@tanstack/react-router';
import Component from '@/src/pages/loop-writer';

export const Route = createFileRoute('/_auth/loop-writer/create')({
  component: LoopWriter,
});

function LoopWriter() {
  return <Component />;
}

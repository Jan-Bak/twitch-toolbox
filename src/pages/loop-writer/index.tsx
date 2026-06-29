import { Separator } from '@/components/ui/separator';
import LoopWriterForm from '@/src/pages/loop-writer/form';

const LoopWriter = () => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold">Loop Writer</h3>
      <h5 className="text-sm text-muted-foreground">
        Select a channel, set a cron time and a message to activate a loop spammer.
      </h5>
      <Separator className="my-2" />
      <LoopWriterForm />
    </div>
  );
};

export default LoopWriter;

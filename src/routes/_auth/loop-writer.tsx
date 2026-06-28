import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/loop-writer')({
  component: LoopWriter,
});

function LoopWriter() {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold">Loop Writer</h3>
      <h5 className="text-sm text-muted-foreground">
        Select a channel, set a cron time and a message to activate a loop spammer.
      </h5>
      <Separator className="my-2" />
      <form className="flex flex-col gap-2">
        <Field>
          <FieldLabel htmlFor="input-channel">Twitch channel name</FieldLabel>
          <Input id="input-channel" type="text" placeholder="For eg. DayRa1se" required />
          <FieldDescription>
            Type a valid Twitch channel name, where the loop will be activated.
          </FieldDescription>
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field>
            <FieldLabel htmlFor="input-hours">Hours</FieldLabel>
            <Input id="input-hours" placeholder="123" required defaultValue="0" type="number" />
          </Field>
          <Field>
            <FieldLabel htmlFor="input-minutes">Minutes</FieldLabel>
            <Input id="input-minutes" placeholder="123" required defaultValue="0" type="number" />
          </Field>
          <Field>
            <FieldLabel htmlFor="input-seconds">Seconds</FieldLabel>
            <Input id="input-seconds" placeholder="123" required defaultValue="5" type="number" />
          </Field>
        </div>
        <FieldDescription>
          Set a time interval, when the message will be sent to the channel.
        </FieldDescription>
        <Field>
          <FieldLabel htmlFor="input-message">Message</FieldLabel>
          <Textarea id="input-message" placeholder="For eg. Hello World x{count}!" required />
          <FieldDescription>Type a message, which will be sent to the channel.</FieldDescription>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="submit"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            Activate
          </Button>
          <Button variant="destructive" disabled>
            Stop
          </Button>
        </div>
        <Separator className="my-2" />
        <Button variant="secondary">Save</Button>
      </form>
    </div>
  );
}

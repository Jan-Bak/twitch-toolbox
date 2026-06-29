import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { type FormEvent, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { scheduleLoopWriter } from '@/lib/twitchChatService';

type LoopWriterFormInputs = {
  channel: string;
  hours: number;
  minutes: number;
  seconds: number;
  message: string;
};

const LoopWriterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoopWriterFormInputs>();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<LoopWriterFormInputs> = async (data) => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const normalizedData = {
        ...data,
        hours: Number.parseInt(String(data.hours), 10),
        minutes: Number.parseInt(String(data.minutes), 10),
        seconds: Number.parseInt(String(data.seconds), 10),
      };
      const result = await scheduleLoopWriter(normalizedData);
      setStatusMessage(
        `Scheduled loop writer for ${data.channel} using cron ${result.cronExpression}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to schedule loop writer';
      setStatusMessage(message);
      toast.error('Could not activate loop writer', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleFormSubmit}>
      <Field>
        <FieldLabel htmlFor="input-channel">Twitch channel name</FieldLabel>
        <Input
          id="input-channel"
          type="text"
          placeholder="For eg. DayRa1se"
          {...register('channel', { required: true, minLength: 3, maxLength: 25 })}
        />
        <FieldDescription className={errors.channel ? 'text-destructive' : ''}>
          {errors.channel ? (
            <>Channel name is required and must be between 3 and 25 characters.</>
          ) : (
            <>Type a valid Twitch channel name, where the loop will be activated.</>
          )}
        </FieldDescription>
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field>
          <FieldLabel htmlFor="input-hours">Hours</FieldLabel>
          <Input
            id="input-hours"
            placeholder="123"
            defaultValue="0"
            type="number"
            {...register('hours', { required: true, min: 0 })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="input-minutes">Minutes</FieldLabel>
          <Input
            id="input-minutes"
            placeholder="123"
            defaultValue="0"
            type="number"
            {...register('minutes', { required: true, min: 0 })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="input-seconds">Seconds</FieldLabel>
          <Input
            id="input-seconds"
            placeholder="123"
            defaultValue="5"
            type="number"
            {...register('seconds', { required: true, min: 0 })}
          />
        </Field>
      </div>
      <FieldDescription
        className={errors.hours || errors.minutes || errors.seconds ? 'text-destructive' : ''}
      >
        {errors.hours || errors.minutes || errors.seconds ? (
          <>Time interval is required and must be a positive number.</>
        ) : (
          <>Set a time interval, when the message will be sent to the channel.</>
        )}
      </FieldDescription>
      <Field>
        <FieldLabel htmlFor="input-message">Message</FieldLabel>
        <Textarea
          id="input-message"
          placeholder="For eg. Hello World x{count}!"
          {...register('message', { required: true, minLength: 1, maxLength: 500 })}
        />
        <FieldDescription className={errors.message ? 'text-destructive' : ''}>
          {errors.message ? (
            <>Message is required and must be between 1 and 500 characters.</>
          ) : (
            <>Type a message, which will be sent to the channel.</>
          )}
        </FieldDescription>
      </Field>
      {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
      <div className="grid grid-cols-3 gap-2">
        <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? 'Activating…' : 'Activate'}
        </Button>
        <Button variant="destructive" disabled className="cursor-pointer">
          Stop
        </Button>
        <Button variant="outline" disabled className="cursor-pointer">
          Reset
        </Button>
      </div>
      <Separator className="my-2" />
      <Button variant="secondary" className="cursor-pointer">
        Save
      </Button>
    </form>
  );
};

export default LoopWriterForm;

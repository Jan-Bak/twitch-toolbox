import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { type SyntheticEvent, useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { scheduleLoopWriter, stopLoopWriter, resolveTwitchUserId } from '@/lib/twitchChatService';
import { saveForm, type SavedLoopForm } from '@/lib/formStorage';
import useUser from '@/stores/user';

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
    getValues,
    // setValue,
  } = useForm<LoopWriterFormInputs>();
  const { accessToken } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loopActive, setLoopActive] = useState(false);

  const onSubmit: SubmitHandler<LoopWriterFormInputs> = async (data) => {
    setIsSubmitting(true);

    try {
      const normalizedData = {
        ...data,
        hours: Number.parseInt(String(data.hours), 10),
        minutes: Number.parseInt(String(data.minutes), 10),
        seconds: Number.parseInt(String(data.seconds), 10),
      };
      const result = await scheduleLoopWriter(normalizedData);
      setLoopActive(true);
      toast.success(
        `Scheduled loop writer for ${data.channel} using cron ${result.cronExpression}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to schedule loop writer';
      toast.error('Could not activate loop writer', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStop = async () => {
    setIsSubmitting(true);

    try {
      await stopLoopWriter();
      setLoopActive(false);
      toast.success('Loop writer stopped successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to stop loop writer';
      toast.error('Could not stop loop writer', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit)(event);
  };

  useEffect(() => {
    // Cleanup function to stop the loop writer when the component unmounts
    return () => {
      if (loopActive) {
        void handleStop();
      }
    };
  }, [loopActive]);

  // useEffect(() => {
  //   void (async () => {
  //     const list = await listForms();
  //     setSavedForms(list);
  //   })();
  // }, []);

  const onSaveClick = () => {
    const values = getValues();
    const defaultName = `${values.channel ?? 'form'}-${Date.now()}`;
    const name = window.prompt('Save form as', defaultName)?.trim() || defaultName;
    const payload: SavedLoopForm = {
      channel: values.channel,
      message: values.message,
      hours: Number.parseInt(String(values.hours || 0), 10),
      minutes: Number.parseInt(String(values.minutes || 0), 10),
      seconds: Number.parseInt(String(values.seconds || 0), 10),
      createdAt: new Date().toISOString(),
    };

    try {
      saveForm(name, payload);
      // const list = await listForms();
      // setSavedForms(list);
      toast.success('Form saved');
    } catch (e) {
      toast.error('Failed to save form');
      console.error(e);
    }
  };

  return (
    <>
      <form className="flex flex-col gap-2" onSubmit={handleFormSubmit}>
        <Field>
          <FieldLabel htmlFor="input-channel">Twitch channel name</FieldLabel>
          <Input
            id="input-channel"
            type="text"
            placeholder="For eg. DayRa1sE"
            {...register('channel', {
              required: 'Channel name is required',
              minLength: { value: 3, message: 'Channel name must be at least 3 characters' },
              maxLength: { value: 25, message: 'Channel name can be at most 25 characters' },
              validate: async (value) => {
                if (!accessToken) {
                  return 'Authentication required to validate channel name';
                }

                const normalizedChannel = value.trim().toLowerCase();
                if (!normalizedChannel) {
                  return 'Channel name is required';
                }

                try {
                  const userId = await resolveTwitchUserId(normalizedChannel, accessToken);
                  return userId ? true : 'Channel name could not be resolved on Twitch';
                } catch (error) {
                  return error instanceof Error
                    ? error.message
                    : 'Unable to find a channel with the given name on Twitch';
                }
              },
            })}
          />
          <FieldDescription className={errors.channel ? 'text-destructive' : ''}>
            {errors.channel ? (
              <>{errors.channel.message}</>
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
              <>
                Type a message, which will be sent to the channel. Supported variables:{' '}
                <code className="font-mono">{'{{i}}'}</code>,{' '}
                <code className="font-mono">{'{{count}}'}</code>,{' '}
                <code className="font-mono">{'{{i++}}'}</code>,{' '}
                <code className="font-mono">{'{{++i}}'}</code>.
              </>
            )}
          </FieldDescription>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Button type="submit" className="cursor-pointer" disabled={isSubmitting || loopActive}>
            {isSubmitting ? 'Activating…' : loopActive ? 'Active' : 'Activate'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={void handleStop}
            disabled={isSubmitting || !loopActive}
            className="cursor-pointer"
          >
            {isSubmitting ? 'Stopping…' : 'Stop'}
          </Button>
          <Button variant="outline" disabled className="cursor-pointer">
            Reset
          </Button>
        </div>
      </form>
      <Separator className="my-2" />
      <div className="flex flex-col gap-2">
        <Button variant="secondary" className="cursor-pointer" onClick={void onSaveClick}>
          Save
        </Button>
      </div>
    </>
  );
};

export default LoopWriterForm;

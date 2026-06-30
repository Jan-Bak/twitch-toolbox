import { listForms, deleteForm, SavedLoopForm } from '@/lib/formStorage';
import SavedForm from './saved-form';
import { useState } from 'react';
import { toast } from 'sonner';

const SavedLoops = () => {
  const [savedForms, setSavedForms] = useState<Array<{ name: string; data: SavedLoopForm }>>([
    {
      name: 'test',
      data: {
        channel: 'dziwka',
        message: 'test',
        hours: 0,
        minutes: 0,
        seconds: 0,
      },
    },
  ]);

  const onDelete = (saved: { name: string; data: SavedLoopForm }) => {
    deleteForm(saved.name);
    const list = listForms();
    setSavedForms(list);
    toast.success('Form deleted');
  };

  return (
    <div className="flex flex-col ">
      {savedForms.map((s) => (
        <SavedForm
          key={s.name}
          streamer={s.data.channel}
          message={s.data.message}
          status={'stopped'}
          // onLoad={async () => {
          //   const loaded = await loadForm(s.name);
          //   if (loaded) {
          //     setValue('channel', loaded.channel);
          //     setValue('message', loaded.message);
          //     setValue('hours', loaded.hours);
          //     setValue('minutes', loaded.minutes);
          //     setValue('seconds', loaded.seconds);
          //     toast.success('Form loaded');
          //   } else {
          //     toast.error('Failed to load form');
          //   }
          // }}
          onDelete={() => void onDelete(s)}
        />
      ))}
    </div>
  );
};

export default SavedLoops;

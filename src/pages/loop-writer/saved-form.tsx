import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentTitle,
} from '@/components/ui/attachment';
import { XIcon, UploadIcon } from 'lucide-react';

type SavedFormProps = {
  streamer: string;
  message: string;
  onLoad?: () => void;
  onDelete?: () => void;
  status: 'stopped' | 'running' | 'error';
};

const SavedForm = ({ streamer, message, onLoad, onDelete, status = 'running' }: SavedFormProps) => {
  return (
    <Attachment
      className={`w-full ${status === 'running' ? 'border-emerald-800' : status === 'error' ? 'border-rose-800' : ''}`}
    >
      <AttachmentContent>
        <AttachmentTitle>{streamer}</AttachmentTitle>
        <AttachmentDescription>{message}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Load" onClick={onLoad} className="cursor-pointer">
          <UploadIcon />
        </AttachmentAction>
        <AttachmentAction aria-label="Remove" onClick={onDelete} className="cursor-pointer">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
};

export default SavedForm;

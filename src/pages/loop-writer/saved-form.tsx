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
};

const SavedForm = ({ streamer, message, onLoad, onDelete }: SavedFormProps) => {
  return (
    <Attachment className="w-32">
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

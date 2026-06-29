import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

const CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID;

type TwitchChatMessageResponse = {
  data?: Array<{
    message_id?: string;
    is_sent?: boolean;
    drop_reason?: {
      code?: string;
      message?: string;
    } | null;
  }>;
};

const invokeWithToast = async <T>(command: string, params?: Record<string, unknown>) => {
  try {
    return await invoke<T>(command, params);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toast.error('Rust API error', {
      description: message || 'An error occurred while calling the backend.',
    });
    throw error;
  }
};

const getTwitchAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Client-ID': CLIENT_ID ?? '',
});

const resolveTwitchUserId = async (login: string, accessToken: string): Promise<string | null> => {
  const normalizedLogin = login.trim().toLowerCase();
  if (!normalizedLogin) {
    return null;
  }

  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(normalizedLogin)}`,
    {
      headers: getTwitchAuthHeaders(accessToken),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to resolve Twitch user id (${response.status})`);
  }

  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  return payload.data?.[0]?.id ?? null;
};

const sendTwitchChatMessage = async (args: {
  broadcasterId: string;
  senderId: string;
  message: string;
  accessToken: string;
}): Promise<TwitchChatMessageResponse> => {
  const response = await fetch('https://api.twitch.tv/helix/chat/messages', {
    method: 'POST',
    headers: {
      ...getTwitchAuthHeaders(args.accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      broadcaster_id: args.broadcasterId,
      sender_id: args.senderId,
      message: args.message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send Twitch chat message (${response.status})`);
  }

  return (await response.json()) as TwitchChatMessageResponse;
};

const scheduleLoopWriter = async (args: {
  channel: string;
  message: string;
  hours: number;
  minutes: number;
  seconds: number;
}) => {
  const result = await invokeWithToast<{
    cronExpression: string;
    broadcasterId: string;
    senderId: string;
  }>('start_loop_writer_job', {
    channel: args.channel,
    message: args.message,
    hours: Number.parseInt(String(args.hours), 10),
    minutes: Number.parseInt(String(args.minutes), 10),
    seconds: Number.parseInt(String(args.seconds), 10),
  });

  return {
    cronExpression: result.cronExpression,
    broadcasterId: result.broadcasterId,
    senderId: result.senderId,
    message: args.message,
  };
};

const stopLoopWriter = async () => {
  await invokeWithToast('stop_loop_writer_job');
};

export { resolveTwitchUserId, sendTwitchChatMessage, scheduleLoopWriter, stopLoopWriter };

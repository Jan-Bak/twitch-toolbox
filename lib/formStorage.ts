export type SavedLoopForm = {
  channel: string;
  message: string;
  hours: number;
  minutes: number;
  seconds: number;
  createdAt?: string;
};

const KEY_PREFIX = 'twitch-toolbox:form:';

export const saveForm = (name: string, data: SavedLoopForm) => {
  const key = `${KEY_PREFIX}${name}`;

  localStorage.setItem(key, JSON.stringify(data));
};

export const listForms = (): Array<{ name: string; data: SavedLoopForm }> => {
  const results: Array<{ name: string; data: SavedLoopForm }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.startsWith(KEY_PREFIX)) continue;
    const name = key.substring(KEY_PREFIX.length);
    try {
      const txt = localStorage.getItem(key);
      if (!txt) continue;
      const data = JSON.parse(txt) as SavedLoopForm;
      results.push({ name, data });
    } catch {
      // skip malformed
    }
  }
  return results;
};

export const loadForm = (name: string): SavedLoopForm | null => {
  const key = `${KEY_PREFIX}${name}`;
  try {
    const txt = localStorage.getItem(key);
    if (!txt) return null;
    return JSON.parse(txt) as SavedLoopForm;
  } catch {
    return null;
  }
};

export const deleteForm = (name: string) => {
  const key = `${KEY_PREFIX}${name}`;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

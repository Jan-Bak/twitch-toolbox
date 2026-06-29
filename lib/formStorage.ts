// Use dynamic imports for Tauri FS so TS type resolution doesn't fail during typecheck

export type SavedLoopForm = {
  channel: string;
  message: string;
  hours: number;
  minutes: number;
  seconds: number;
  createdAt?: string;
};

const KEY_PREFIX = 'twitch-toolbox:form:';

export const saveForm = async (name: string, data: SavedLoopForm) => {
  const key = `${KEY_PREFIX}${name}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    throw e;
  }
};

export const listForms = async (): Promise<Array<{ name: string; data: SavedLoopForm }>> => {
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

export const loadForm = async (name: string): Promise<SavedLoopForm | null> => {
  const key = `${KEY_PREFIX}${name}`;
  try {
    const txt = localStorage.getItem(key);
    if (!txt) return null;
    return JSON.parse(txt) as SavedLoopForm;
  } catch {
    return null;
  }
};

export const deleteForm = async (name: string) => {
  const key = `${KEY_PREFIX}${name}`;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

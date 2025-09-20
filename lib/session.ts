const GUEST_TOKEN_PREFIX = 'party-inviter-guest-token-';
const MANAGE_TOKEN_PREFIX = 'party-inviter-manage-token-';

const safeSessionStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch (error) {
    console.error('Unable to access sessionStorage:', error);
    return null;
  }
};

export const storeGuestToken = (eventId: string, token: string) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return;
  }
  storage.setItem(`${GUEST_TOKEN_PREFIX}${eventId}`, token);
};

export const readGuestToken = (eventId: string) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(`${GUEST_TOKEN_PREFIX}${eventId}`);
};

export const clearGuestToken = (eventId: string) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(`${GUEST_TOKEN_PREFIX}${eventId}`);
  storage.removeItem(`${MANAGE_TOKEN_PREFIX}${eventId}`);
};

export const storeManageToken = (eventId: string, token: string) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return;
  }
  storage.setItem(`${MANAGE_TOKEN_PREFIX}${eventId}`, token);
};

export const readManageToken = (eventId: string) => {
  const storage = safeSessionStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(`${MANAGE_TOKEN_PREFIX}${eventId}`);
};

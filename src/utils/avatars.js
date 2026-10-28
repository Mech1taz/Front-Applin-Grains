// Detecta solas las imágenes de src/assets/avatars (png, jpg, jpeg, webp, svg, gif)
const files = import.meta.glob('/src/assets/avatars/*.{png,jpg,jpeg,webp,svg,gif}', {
  eager: true, query: '?url', import: 'default',
});
export const AVATARS = Object.entries(files).map(([path, url]) => ({ path, url }));

const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const key = (id) => `applin-avatar:${id}`;

/** Gato elegido por el usuario o, por defecto, uno fijo según su id. */
export function getAvatar(userId) {
  if (!AVATARS.length) return null;
  const saved = localStorage.getItem(key(userId));
  return (AVATARS.find((a) => a.path === saved) ?? AVATARS[hash(userId) % AVATARS.length]).url;
}

export function setAvatar(userId, path) {
  localStorage.setItem(key(userId), path);
  window.dispatchEvent(new Event('avatar-changed'));
}

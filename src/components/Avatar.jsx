import { useEffect, useState } from 'react';
import { getAvatar } from '../utils/avatars.js';

export default function Avatar({ user, size = 36 }) {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    window.addEventListener('avatar-changed', f);
    return () => window.removeEventListener('avatar-changed', f);
  }, []);

  const src = user ? getAvatar(user.id) : null;
  const box = { width: size, height: size };
  return src ? (
    <img src={src} alt="" style={box} className="rounded-full object-cover" />
  ) : (
    <span style={{ ...box, fontSize: size * 0.55 }} className="flex items-center justify-center rounded-full bg-ocre/30">🐱</span>
  );
}

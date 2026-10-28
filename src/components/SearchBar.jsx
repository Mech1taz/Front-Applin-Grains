import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SearchBar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  useEffect(() => { setQ(params.get('q') ?? ''); }, [params]);

  const submit = (e) => {
    e.preventDefault();
    const t = q.trim();
    navigate(t ? `/?q=${encodeURIComponent(t)}` : '/');
  };

  return (
    <form onSubmit={submit} role="search" className="relative mx-auto w-full max-w-md flex-1">
      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-oliva-claro" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Busca productos aquí…" aria-label="Buscar productos"
        className="w-full rounded-full border border-oliva-claro/30 bg-white/70 py-2 pl-10 pr-4 text-sm text-cafe outline-none focus:border-ocre dark:bg-oliva/40 dark:text-crema"
      />
    </form>
  );
}

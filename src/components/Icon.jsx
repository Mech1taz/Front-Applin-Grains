const P = {
  orders: 'M3 7h18M5 7l1 12h12l1-12M9 7a3 3 0 0 1 6 0',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  audit: 'M12 8v4l3 2M21 12a9 9 0 1 1-3-6.7M21 4v5h-5',
  store: 'M3 9l1.5-5h15L21 9M4 9v11h16V9M9 20v-6h6v6',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6 4.6 4.6M19.4 19.4 18 18M6 18l-1.4 1.4M19.4 4.6 18 6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  refresh: 'M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
  info: 'M12 16v-4M12 8h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  plus: 'M12 5v14M5 12h14',
  plusCircle: 'M12 8v8M8 12h8M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0Z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
};

export default function Icon({ name, size = 18, className = '' }) {
  const path = P[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

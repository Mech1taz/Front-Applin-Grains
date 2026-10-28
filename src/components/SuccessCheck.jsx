import { motion } from 'framer-motion';

export default function SuccessCheck({ size = 96 }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 52 52" className="mx-auto text-oliva-claro dark:text-lima" aria-hidden="true"
      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <motion.circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
      <motion.path d="M15 27l8 8 14-16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.4 }} />
    </motion.svg>
  );
}

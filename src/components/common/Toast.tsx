// src/components/common/Toast.tsx
import { motion } from 'motion/react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={`fixed top-20 right-4 z-[3500] p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-700' : 'bg-red-600'
      } text-white min-w-[200px] text-sm font-bold`}
    >
      {message}
    </motion.div>
  );
};
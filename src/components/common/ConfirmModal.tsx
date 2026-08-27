// src/components/common/ConfirmModal.tsx
import { motion } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[5000] p-4 font-sans">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl font-sans"
      >
        <h3 className="font-sans font-black text-xl mb-2 tracking-tight text-on-background">{title}</h3>
        <p className="font-sans text-sm text-on-surface-variant mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-sans font-bold text-sm text-on-surface-variant hover:bg-gray-100 transition cursor-pointer"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl font-sans font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition cursor-pointer"
          >
            Verwijderen
          </button>
        </div>
      </motion.div>
    </div>
  );
};
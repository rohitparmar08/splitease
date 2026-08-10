import React from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  isDanger = True,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-12 h-12 rounded-full ${isDanger ? 'bg-rose-500/10 text-rose-400' : 'bg-brand-500/10 text-brand-400'} flex items-center justify-center mb-4`}>
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-300 mb-6">{message}</p>
        <div className="flex items-center justify-end space-x-3 w-full">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all shadow-lg ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

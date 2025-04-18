import { X } from "lucide-react";
import React from "react";

const DeleteQuickTabModal = ({
  isOpen,
  title = "Delete Quick Tab?",
  subtitle = "Are you sure you want to delete this Quick Tab? This action cannot be undone.",
  onClose,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="relative flex flex-col w-auto h-fit mb-[60px] border-zinc-800 bg-zinc-950 px-8 py-6 gap-4 z-10">
      <X
        onClick={onClose}
        size={20}
        className="absolute text-zinc-400 right-2 top-2 cursor-pointer hover:text-white"
      />
      <div className="text-center">
        <p className="font-semibold text-lg text-white">{title}</p>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </div>
      <div className="flex justify-center gap-2">
        <button
          onClick={onClose}
          className="px-4 h-9 border border-zinc-800 text-sm rounded text-white hover:bg-zinc-800"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="px-4 h-9 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default DeleteQuickTabModal;

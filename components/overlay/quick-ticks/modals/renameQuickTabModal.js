// components/RenameModal.jsx
import { X } from "lucide-react";
import React, { useEffect, useRef } from "react";

const RenameQuickTabModal = ({
  isOpen,
  title = "Rename Item",
  subtitle = "Type a new name and click Update",
  inputValue,
  onInputChange,
  onClose,
  onSubmit,
  placeholder = "New name",
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="relative flex flex-col w-auto h-fit mb-[60px]  border-zinc-800 bg-zinc-950  px-8 py-6 gap-4 z-10">
      <X
        onClick={onClose}
        size={20}
        className="absolute text-zinc-400 right-2 top-2 cursor-pointer hover:text-white"
      />
      <div className="text-center">
        <p className="font-semibold text-lg text-white">{title}</p>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </div>
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
            onClose();
          }
        }}
        placeholder={placeholder}
        rows={1}
        className="w-full px-3 py-2 rounded border bg-zinc-900 border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <div className="flex items-center gap-4">
        <div className="w-full"></div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              onSubmit();
              onClose();
            }}
            className="flex items-center px-4 h-9 bg-zinc-800 hover:bg-white hover:text-zinc-900 rounded text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameQuickTabModal;

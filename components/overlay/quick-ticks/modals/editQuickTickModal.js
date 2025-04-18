// components/EditQuickTickModal.jsx
import { X, Flag } from "lucide-react";
import { useEffect, useRef } from "react";

const EditQuickTickModal = ({
  isOpen,
  onClose,
  inputValue,
  onInputChange,
  onSubmit,
  priority,
  onTogglePriority,
  inputRef,
}) => {
  const localRef = useRef(null);
  const textRef = inputRef || localRef;

  useEffect(() => {
    if (isOpen && textRef.current) {
      const input = textRef.current;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [isOpen, textRef]);

  if (!isOpen) return null;

  return (
    <div className="relative flex flex-col w-auto h-fit mb-[60px]  border-zinc-800 bg-zinc-950  px-8 py-6 gap-4 z-10">
      <X
        onClick={onClose}
        size={20}
        className="absolute text-zinc-400 right-2 top-2 cursor-pointer hover:text-white"
      />
      <div className="text-center">
        <p className="font-semibold text-lg text-white">Update QuickTick</p>
        <p className="text-sm text-zinc-400">
          Modify the details of this check and click &quot;Save&quot;
        </p>
      </div>
      <textarea
        ref={textRef}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
            onClose();
          }
        }}
        placeholder="Check name"
        rows={3}
        className="w-full px-3 py-2 rounded border bg-zinc-900 border-zinc-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <div className="flex items-center gap-4">
        <div className="w-full"></div>
        <button
          onClick={onTogglePriority}
          className={`flex items-center justify-center h-full aspect-square border rounded transition-colors duration-150 ${
            priority ? "border-red-500 bg-red-500/10" : "border-zinc-800"
          }`}
        >
          <Flag
            size={18}
            className={`transition-colors ${
              priority ? "text-red-500" : "text-zinc-400"
            }`}
          />
        </button>
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

export default EditQuickTickModal;

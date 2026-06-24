"use client";

interface Props {
  onReport: () => void;
  onBlockUser: () => void;
  onClose: () => void;
}

export default function MessageActionMenu({ onReport, onBlockUser, onClose }: Props) {
  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <div className="absolute z-20 mt-1 w-36 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
      <button
        onClick={() => run(onReport)}
        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 transition-colors"
      >
        신고
      </button>
      <button
        onClick={() => run(onBlockUser)}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
      >
        차단
      </button>
    </div>
  );
}

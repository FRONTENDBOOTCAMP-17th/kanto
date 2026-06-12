interface ToastProps {
  message: string;
  showMessage: boolean;
}

export default function Toast({ message, showMessage }: ToastProps) {
  return (
    <div
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 border-2 border-teal-500 bg-teal-400 rounded-xl p-2 z-1 text-center transition-opacity duration-1000 ${showMessage ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {message}
    </div>
  );
}

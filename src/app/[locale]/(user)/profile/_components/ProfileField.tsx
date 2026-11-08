interface ProfileFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function ProfileField({ label, hint, ...props }: ProfileFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-500">{label}</label>
      <input
        className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        {...props}
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
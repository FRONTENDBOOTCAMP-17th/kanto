import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

const inputClass =
  "w-full border-b bg-transparent py-3 pr-2 pl-8 text-base text-gray-950 placeholder:text-gray-400 outline-none transition-colors focus:border-teal-400 sm:text-sm";
const iconClass =
  "pointer-events-none absolute top-1/2 left-0 h-5 w-5 -translate-y-1/2 text-gray-400";
const errorClass = "text-xs font-medium text-red-500";

interface FormFieldProps {
  id: string;
  type: string;
  icon: LucideIcon;
  ariaLabel: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  errorMessage?: React.ReactNode;
  successMessage?: React.ReactNode;
  autoFocus?: boolean;
  toggleButton?: React.ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  {
    id,
    type,
    icon: Icon,
    ariaLabel,
    placeholder,
    value,
    onChange,
    onBlur,
    onKeyDown,
    errorMessage,
    successMessage,
    autoFocus,
    toggleButton,
  },
  ref,
) {
  const hasError = !!errorMessage;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Icon className={iconClass} strokeWidth={1.8} aria-hidden />
        <input
          id={id}
          ref={ref}
          autoFocus={autoFocus}
          type={type}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`${inputClass} ${toggleButton ? "pr-11" : ""} ${hasError ? "border-red-400 focus:border-red-400" : "border-gray-200"}`}
        />
        {toggleButton}
      </div>
      {errorMessage && <p className={errorClass}>{errorMessage}</p>}
      {successMessage && (
        <p className="text-xs font-medium text-teal-600">{successMessage}</p>
      )}
    </div>
  );
});

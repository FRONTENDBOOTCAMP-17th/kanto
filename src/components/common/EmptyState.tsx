interface EmptyStateProps {
  message: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ message, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
      <p className="text-lg font-medium">{message}</p>
      {description && <p className="text-sm">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

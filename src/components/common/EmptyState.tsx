interface EmptyStateProps {
  message: string;
  description?: string;
}

export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
      <p className="text-lg font-medium">{message}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function ChatRoomSkeleton() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-32 h-4" />
      </div>
      <div className="flex-1 flex flex-col gap-3 px-4 py-4 overflow-hidden">
        <Skeleton className="w-2/5 h-9 rounded-2xl self-start" />
        <Skeleton className="w-1/2 h-9 rounded-2xl self-end" />
        <Skeleton className="w-1/3 h-9 rounded-2xl self-start" />
        <Skeleton className="w-2/5 h-9 rounded-2xl self-end" />
        <Skeleton className="w-1/4 h-9 rounded-2xl self-start" />
      </div>
      <div className="px-4 py-3 border-t border-gray-200 bg-white shrink-0">
        <Skeleton className="w-full h-10 rounded-full" />
      </div>
    </div>
  );
}

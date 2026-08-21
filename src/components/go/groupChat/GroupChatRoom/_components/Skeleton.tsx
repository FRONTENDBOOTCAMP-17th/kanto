export default function Skeleton() {
  return (
    <div
      className="flex-1 min-h-0 overflow-hidden px-4 py-4 flex flex-col gap-3"
      aria-hidden="true"
    >
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={`flex flex-col gap-1 ${i % 3 === 0 ? "items-end" : "items-start"}`}
        >
          {i % 3 !== 0 && (
            <div className="ml-1 h-2.5 w-16 rounded bg-gray-100 animate-pulse" />
          )}
          <div
            className={`h-9 rounded-2xl bg-gray-100 animate-pulse ${
              i % 3 === 0 ? "w-32 rounded-tr-sm" : "w-44 rounded-tl-sm"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

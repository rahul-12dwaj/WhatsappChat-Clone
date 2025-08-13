export default function ChannelListEmptyState() {
  return (
    <div
      className="w-full border-r border-[#222D32] flex flex-col overflow-x-hidden min-w-0 bg-[#161717] text-[#E9EDEF]"
      role="list"
      aria-label="Channel list empty state"
    >
      {/* Title */}
      <div className="mt-3 text-xl font-bold p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">Channels</div>
        <div className="flex items-center gap-3">
          <img
            src="/menu.png"
            alt="Menu"
            className="w-6 h-6 cursor-pointer"
            draggable={false}
          />
        </div>
      </div>

      {/* Empty message */}
      <div
        className="flex-1 flex items-center justify-center text-[#8696A0] text-sm"
        role="alert"
        aria-live="polite"
      >
        No channels found
      </div>
    </div>
  );
}

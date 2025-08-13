import { IoLockClosedOutline } from "react-icons/io5";
import { PiCircleDashedThin } from "react-icons/pi"; // placeholder icon

export default function StatusListEmptyState() {
  return (
    <div className="bg-[#161717] flex flex-col items-center justify-center w-full h-full bg-[#111b21] text-[#E9EDEF]">
      {/* Center Icon */}
      <div className="mb-6">
        <PiCircleDashedThin size={60} className="text-[#8696A0]" />
      </div>

      {/* Main text */}
      <h3 className="text-2xl font-semibold mb-2">Share status updates</h3>
      <p className="text-[#8696A0] text-s text-center max-w-xs">
        Share photos, videos and text that disappear after 24 hours.
      </p>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[#8696A0] text-xs">
        <IoLockClosedOutline size={14} />
        <span className="text-lg">Your status updates are end-to-end encrypted</span>
      </div>
    </div>
  );
}

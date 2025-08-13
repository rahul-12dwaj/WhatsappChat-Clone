import { IoLockClosedOutline } from "react-icons/io5";

export default function StatusListEmptyState() {
  return (
    <div className="bg-[#161717] flex flex-col items-center justify-center w-full h-full bg-[#111b21] text-[#E9EDEF]">
      {/* Center Icon */}
      <div className="mb-6">
        <img
        src="/whatsapp.png"
        className="w-20 h-20 opacity-50"
      />
      </div>

      {/* Main text */}
      <h3 className="text-2xl mb-2 opacity-50">Download Whatsapp for Windows</h3>
      <p className="text-[#8696A0] text-s text-center max-w-lg">
        Make calls, share your screen and get a faster experience when you download the windows app.
      </p>

      {/* Footer */}
      <div className="absolute bottom-6 flex items-center gap-2 text-[#8696A0] text-xs">
        <IoLockClosedOutline size={14} />
        <span className="text-lg">Your status updates are end-to-end encrypted</span>
      </div>
    </div>
  );
}

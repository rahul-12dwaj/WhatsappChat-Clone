import { IoAdd } from "react-icons/io5";

export default function StatusList() {
  const defaultImg = "/abstract-profile.png";

  return (
    <div className="w-full border-r border-[#222D32] flex flex-col overflow-y-auto min-w-0 bg-[#161717] text-[#E9EDEF]">
      {/* Header */}
      <div className="mt-3 text-xl font-bold p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">Status</div>
        <div className="flex items-center gap-3">
          <IoAdd size={24} className="cursor-pointer" />
          <img src="/menu.png" alt="Menu" className="w-6 h-6 cursor-pointer" />
        </div>
      </div>

      {/* My Status */}
      <div className="px-4 flex items-center gap-3 cursor-pointer hover:bg-[#292a2a] py-2">
        <div className="relative">
          <img
            src={defaultImg}
            alt="My status"
            className="w-12 h-12 rounded-full"
          />
          <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-[2px]">
            <IoAdd size={12} className="text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-medium">My status</span>
          <span className="text-[#8696A0] text-sm">Click to add status update</span>
        </div>
      </div>
    </div>
  );
}

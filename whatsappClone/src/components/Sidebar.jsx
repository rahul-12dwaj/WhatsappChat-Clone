import { BsChatDotsFill } from "react-icons/bs";
import { FiPlus } from "react-icons/fi";

function Sidebar({ activeTab, setActiveTab }) {
  const ICON_SIZE = 28;
  const isActive = activeTab === "chats";

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col justify-between bg-[#111b21] border-r border-gray-700 shadow-md"
      style={{ width: "72px" }}
    >
      {/* Top Chat Icon */}
      <div className="flex flex-col items-center py-4">
        <button
          aria-label="Chats"
          title="Chats"
          className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto transition-colors duration-200
            ${
              isActive
                ? "bg-[#25D366] text-[#111b21] shadow-lg"
                : "text-[#8696a0] hover:bg-[#2a3942] hover:text-[#25D366]"
            }
          `}
          onClick={() => setActiveTab("chats")}
        >
          <BsChatDotsFill size={ICON_SIZE} />
        </button>
      </div>

      {/* Bottom Chat Icon */}
      

    <div className="flex flex-col items-center py-4">
    <button
        aria-label="Chats"
        title="Add Chats"
        className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto transition-colors duration-200
        ${
            isActive
            ? "bg-[#25D366] text-[#111b21] shadow-lg"
            : "text-[#8696a0] hover:bg-[#2a3942] hover:text-[#25D366]"
        }
        `}
        onClick={() => setActiveTab("chats")}
    >
        <FiPlus size={ICON_SIZE} />
    </button>
    </div>

    </nav>
  );
}

export default Sidebar

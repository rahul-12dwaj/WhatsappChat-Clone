const ICON_BG_ACTIVE = "bg-[#292a2a] text-white shadow-lg";
const ICON_BG_INACTIVE = "text-gray-400 hover:bg-[#292a2a] hover:text-white";

function Sidebar({ activeTab, setActiveTab, isHorizontal = false }) {
  const buttons = [
    { id: "chats", iconSrc: "/chat.png", label: "Chats" },
    { id: "status", iconSrc: "/status.png", label: "Status" },
    { id: "channels", iconSrc: "/signal.png", label: "Channel" },
    { id: "communities", iconSrc: "/community.png", label: "Communities" },
    { id: "settings", iconSrc: "/settings.png", label: "Settings" },
    { id: "profile", iconSrc: "/abstract-profile.png", label: "Profile" },
  ];

  if (isHorizontal) {
    // Horizontal bottom bar style for mobile
    return (
      <nav
        aria-label="Main navigation"
        className="flex justify-around items-center bg-[#1d1f1f] text-gray-400 w-full h-full"
      >
        {buttons.map(({ id, iconSrc, label }) => (
          <button
            key={id}
            aria-label={label}
            title={label}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-md transition-colors duration-200 ${
              activeTab === id ? ICON_BG_ACTIVE : ICON_BG_INACTIVE
            }`}
            onClick={() => setActiveTab(id)}
          >
            <img src={iconSrc} alt={label} className="w-6 h-6 mb-1" draggable={false} />
          </button>
        ))}
      </nav>
    );
  }

  // Default vertical sidebar (desktop)
  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-col justify-between items-center bg-[#1d1f1f] text-gray-400"
      style={{ width: "72px", borderRight: "1px solid #2a3942" }}
    >
      {/* Top icons */}
      <div className="flex flex-col items-center py-3 space-y-3 mt-3">
        {buttons.slice(0, 4).map(({ id, iconSrc, label }) => (
          <button
            key={id}
            aria-label={label}
            title={label}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
              activeTab === id ? ICON_BG_ACTIVE : ICON_BG_INACTIVE
            }`}
            onClick={() => setActiveTab(id)}
          >
            <img src={iconSrc} alt={label} className="w-6 h-6" draggable={false} />
          </button>
        ))}
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center py-4 space-y-3">
        {buttons.slice(4).map(({ id, iconSrc, label }) => (
          <button
            key={id}
            aria-label={label}
            title={label}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
              activeTab === id ? ICON_BG_ACTIVE : ICON_BG_INACTIVE
            }`}
            onClick={() => setActiveTab(id)}
          >
            <img src={iconSrc} alt={label} className="w-6 h-6" draggable={false} />
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Sidebar;

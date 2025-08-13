import React from "react";
import { IoAdd } from "react-icons/io5";

function CommunityTab() {
  const communities = [
    {
      id: "1",
      name: "Nature Lovers",
      description: "A community for nature enthusiasts",
      avatar: null,
    },
    {
      id: "2",
      name: "Tech Geeks",
      description: "Discuss the latest in technology",
      avatar:
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&q=80",
    },
    {
      id: "3",
      name: "Book Club",
      description: "Sharing and reviewing books",
      avatar: null,
    },
  ];

  return (
    <div className="w-full border-r border-[#222D32] flex flex-col overflow-x-hidden min-w-0 bg-[#161717] text-[#E9EDEF]">
      {/* Title */}
      <div className="mt-3 text-xl font-bold p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">Communities</div>
        <div className="flex items-center gap-3">
          <IoAdd size={24} className="cursor-pointer" />
        </div>
      </div>

      {/* Search Bar */}
      <input
        type="search"
        aria-label="Search communities"
        placeholder="Search communities"
        value=""
        onChange={() => {}}
        className="m-2 p-2 rounded-full bg-[#2e2f2f] border border-transparent hover:border-gray-700 text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-gray-700 focus:ring-2 focus:ring-[#25D366] transition-colors duration-200"
        autoComplete="off"
      />

      {/* Community List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {communities.map((community) => (
          <div
            key={community.id}
            className="flex items-center gap-3 p-3 min-w-0 select-none cursor-default"
          >
            {community.avatar ? (
              <img
                src={community.avatar}
                alt={`Avatar of ${community.name}`}
                className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#005c4b] text-[#111B21] flex items-center justify-center font-semibold flex-shrink-0 select-none text-lg">
                {community.name[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-base truncate font-medium text-[#E9EDEF]">
                {community.name}
              </h2>
              <p className="text-sm truncate text-[#8696A0]">{community.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommunityTab;

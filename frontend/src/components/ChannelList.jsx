import React from "react";
import { IoAdd } from "react-icons/io5";

function ChannelList() {
  const channels = [
    {
      id: "1",
      name: "Him News",
      description: "A channel for latest news coverage",
      avatar: null,
    },
    {
      id: "3",
      name: "Jokes",
      description: "Sharing memes and jokes",
      avatar: null,
    },
  ];

  return (
    <div className="w-full border-r border-[#222D32] flex flex-col overflow-x-hidden min-w-0 bg-[#161717] text-[#E9EDEF]">
      {/* Title */}
      <div className="mt-3 text-xl font-bold p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">Channels</div>
        <div className="flex items-center gap-3">
          <IoAdd size={24} className="cursor-pointer" />
        </div>
      </div>

      {/* Search Bar */}
      <input
        type="search"
        aria-label="Search channels"
        placeholder="Search channels"
        value=""
        onChange={() => {}}
        className="m-2 p-2 rounded-full bg-[#2e2f2f] border border-transparent hover:border-gray-700 text-[#E9EDEF] placeholder-[#8696A0] focus:outline-none focus:border-gray-700 focus:ring-2 focus:ring-[#25D366] transition-colors duration-200"
        autoComplete="off"
      />

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center gap-3 p-3 min-w-0 select-none cursor-default"
          >
            {channel.avatar ? (
              <img
                src={channel.avatar}
                alt={`Avatar of ${channel.name}`}
                className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#005c4b] text-[#111B21] flex items-center justify-center font-semibold flex-shrink-0 select-none text-lg">
                {channel.name[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-base truncate font-medium text-[#E9EDEF]">
                {channel.name}
              </h2>
              <p className="text-sm truncate text-[#8696A0]">{channel.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChannelList;

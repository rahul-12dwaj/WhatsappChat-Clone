function ChannelListEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#161717] text-[#8696a0] select-none px-6 py-8 w-full">
      {/* Logo */}
      <img
        src="/whatsapp.png"
        alt="WhatsApp Logo"
        className="w-20 h-20 mb-6"
      />

      {/* Main Text */}
      <div className="text-center max-w-md w-full">
        <h1 className="text-3xl font-semibold mb-2">
          No Channels Available
        </h1>
        <p className="text-sm leading-relaxed mb-2">
          Subscribe to channels to receive updates and content from your favorite creators.
        </p>
      </div>
    </div>
  );
}

export default ChannelListEmptyState;

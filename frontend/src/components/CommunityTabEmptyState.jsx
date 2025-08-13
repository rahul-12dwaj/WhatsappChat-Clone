function CommunityTabEmptyState() {
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
        <p className="text-sm leading-relaxed mb-2">
          Join or create communities to stay connected with groups of people.
        </p>
        <p className="text-sm leading-relaxed">
          Communities help you organize conversations around specific topics or interests.
        </p>
      </div>
    </div>
  );
}

export default CommunityTabEmptyState;

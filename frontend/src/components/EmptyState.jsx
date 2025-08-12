function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#111b21] text-[#8696a0] select-none px-6 py-8 w-full">
      {/* Logo */}
      <img
        src="/whatsapp.png"
        alt="WhatsApp Logo"
        className="w-20 h-20 mb-6"
      />

      {/* Main Text */}
      <div className="text-center max-w-md w-full">
        <h1 className="text-3xl font-semibold mb-2">
          WhatsApp for Windows
        </h1>
        <p className="text-sm leading-relaxed mb-2">
          Send and receive messages without keeping your phone online.
        </p>
        <p className="text-sm leading-relaxed">
          Use WhatsApp on up to 4 linked devices and your phone at the
          same time.
        </p>
      </div>

      {/* Footer Text */}
      <p className="text-2xl text-[#4a8c37] mt-8 w-full text-center font-semibold select-text">
        End-to-end encrypted
      </p>
    </div>
  );
}

export default EmptyState
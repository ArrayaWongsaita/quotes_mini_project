export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="relative">
        {/* App logo/icon */}
        <div className="bg-primary rounded-md p-4 text-primary-foreground font-bold text-3xl mb-4 animate-pulse">
          Q
        </div>

        {/* Loading spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="size-12 animate-spin text-muted-foreground opacity-25"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M50 10 A40 40 0 0 1 90 50 L82 50 A32 32 0 0 0 50 18 z"
            />
          </svg>
        </div>
      </div>

      <div className="mt-8 text-sm text-center">
        <p className="font-medium">Loading QOUTE</p>
        <p className="text-muted-foreground mt-1">Please wait...</p>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full">
      <div className="ios-loading-bar" />
      <div className="flex flex-col items-center gap-4 w-full max-w-sm px-6">
        <div className="ios-shimmer w-24 h-24 rounded-full" />
        <div className="ios-shimmer w-48 h-4" />
        <div className="ios-shimmer w-32 h-3" />
        <div className="w-full flex flex-col gap-3 mt-4">
          <div className="ios-shimmer w-full h-20" />
          <div className="ios-shimmer w-full h-20" />
          <div className="ios-shimmer w-full h-20" />
        </div>
      </div>
    </div>
  )
}

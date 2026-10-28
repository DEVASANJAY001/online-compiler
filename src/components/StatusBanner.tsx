import React from 'react'
import { WifiOff } from 'lucide-react'

export interface StatusBannerProps {
  progressMessage?: string | null
  progressFraction?: number | null
  onDismissProgress?: () => void
}

export const StatusBanner: React.FC<StatusBannerProps> = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="z-10 select-none">
      {!isOnline && (
        <div className="bg-amber-950/80 border-b border-amber-800 text-amber-200 px-3 py-1 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5 text-amber-400" />
            <span>Offline mode. Cached runtimes continue working.</span>
          </div>
        </div>
      )}
    </div>
  )
}

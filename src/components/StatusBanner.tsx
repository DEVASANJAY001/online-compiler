import React, { useState, useEffect } from 'react'
import { WifiOff, AlertTriangle, X, ShieldAlert, CheckCircle2, ChevronRight, Info } from 'lucide-react'

export interface StatusBannerProps {
  progressMessage?: string | null
  progressFraction?: number | null
  onDismissProgress?: () => void
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  progressMessage,
  progressFraction,
  onDismissProgress,
}) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isCrossIsolated, setIsCrossIsolated] = useState(
    typeof window !== 'undefined' ? Boolean(window.crossOriginIsolated) : true
  )
  const [isSecure, setIsSecure] = useState(
    typeof window !== 'undefined' ? Boolean(window.isSecureContext) : true
  )
  const [isDismissed, setIsDismissed] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Recheck cross-origin isolation after possible service worker activation
    if (typeof window !== 'undefined') {
      setIsCrossIsolated(Boolean(window.crossOriginIsolated))
      setIsSecure(Boolean(window.isSecureContext))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="z-20 select-none text-xs">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-800 text-amber-200 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Offline mode. Cached WebAssembly toolchains continue working.</span>
          </div>
        </div>
      )}

      {/* Progress Notification (if toolchains are actively downloading) */}
      {progressMessage && (
        <div className="bg-indigo-900/90 border-b border-indigo-700 text-indigo-100 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
            <span className="truncate">{progressMessage}</span>
            {typeof progressFraction === 'number' && (
              <span className="font-mono text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300">
                {Math.round(progressFraction * 100)}%
              </span>
            )}
          </div>
          {onDismissProgress && (
            <button
              onClick={onDismissProgress}
              className="text-indigo-300 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Cross-Origin Isolation Warning (Visible if not crossOriginIsolated and not dismissed) */}
      {!isCrossIsolated && !isDismissed && (
        <div className="bg-amber-500/10 dark:bg-amber-950/50 border-b border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 px-3 py-1.5 flex items-center justify-between transition-all">
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>Cross-Origin Isolation Inactive:</strong> C, C++, and Java require COOP/COEP headers and HTTPS. <strong>Python &amp; JavaScript work normally!</strong>
            </span>
            <button
              onClick={() => setShowExplanation(true)}
              className="underline font-semibold hover:text-amber-700 dark:hover:text-amber-100 shrink-0 cursor-pointer text-[11px] ml-1"
            >
              How to fix
            </button>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 p-0.5 rounded cursor-pointer shrink-0"
            title="Dismiss warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cross-Origin Isolation Explanation Modal */}
      {showExplanation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-slate-100">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Cross-Origin Isolation Guide</span>
              </div>
              <button
                onClick={() => setShowExplanation(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs leading-relaxed max-h-[75vh] overflow-y-auto">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Why is this needed?
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  CodeSpace runs 100% in your browser using WebAssembly. Compilers like <strong>Clang (C/C++)</strong> and <strong>Wasmer</strong> use WebAssembly multi-threading (<code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">SharedArrayBuffer</code>). For security against Spectre vulnerabilities, modern browsers strictly require:
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-600 dark:text-slate-300">
                  <li><strong>A Secure Context:</strong> HTTPS or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">localhost</code></li>
                  <li><strong>COOP Header:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">Cross-Origin-Opener-Policy: same-origin</code></li>
                  <li><strong>COEP Header:</strong> <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">Cross-Origin-Embedder-Policy: require-corp</code></li>
                </ul>
              </div>

              {!isSecure && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5" />
                    Testing on Mobile over Wi-Fi?
                  </h4>
                  <p className="text-amber-900 dark:text-amber-200">
                    You are accessing via plain HTTP on a local IP (<code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono">{typeof window !== 'undefined' ? window.location.origin : 'http://...'}</code>). Mobile browsers disable <code className="font-mono">SharedArrayBuffer</code> over plain HTTP.
                  </p>
                  <p className="text-amber-900 dark:text-amber-200 mt-1.5">
                    <strong>Solutions:</strong>
                  </p>
                  <ol className="list-decimal list-inside mt-1 space-y-1 text-amber-900 dark:text-amber-200">
                    <li>Use a secure tunnel (e.g., <code className="font-mono">npx ngrok http 5173</code> or Cloudflare Tunnel) to open an HTTPS URL on your phone.</li>
                    <li>Or test <strong>Python</strong> and <strong>JavaScript</strong> — they run completely without requiring Cross-Origin Isolation!</li>
                  </ol>
                </div>
              )}

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  What works right now?
                </h4>
                <p className="text-emerald-900 dark:text-emerald-200">
                  <strong>Python</strong> (Pyodide 3.12) and <strong>JavaScript</strong> (ES2024 V8) work 100% offline in all browser contexts, on all devices, with zero configuration needed.
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowExplanation(false)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-xs transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

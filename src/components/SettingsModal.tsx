import React from 'react'
import { X, Sliders, Type, Clock, Save, AlignLeft, Sun, Moon } from 'lucide-react'
import type { Settings } from '../types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: Settings
  onSaveSettings: (settings: Settings) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-slate-100">
            <Sliders className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Preferences</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Theme Option */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              {settings.theme === 'dark' ? (
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              )}
              <span>Theme</span>
            </label>
            <select
              value={settings.theme}
              onChange={(e) =>
                onSaveSettings({ ...settings, theme: e.target.value as 'dark' | 'light' })
              }
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="light">Light (White)</option>
              <option value="dark">Dark (Night)</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Type className="h-3.5 w-3.5 text-slate-400" />
              <span>Font Size</span>
            </label>
            <select
              value={settings.fontSize}
              onChange={(e) =>
                onSaveSettings({ ...settings, fontSize: parseInt(e.target.value, 10) })
              }
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              {[12, 13, 14, 15, 16, 18].map((size) => (
                <option key={size} value={size}>
                  {size} px
                </option>
              ))}
            </select>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
              <span>Tab Spacing</span>
            </label>
            <select
              value={settings.tabSize}
              onChange={(e) =>
                onSaveSettings({ ...settings, tabSize: parseInt(e.target.value, 10) })
              }
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>

          {/* Execution Timeout */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Run Timeout</span>
            </label>
            <select
              value={settings.timeoutSeconds}
              onChange={(e) =>
                onSaveSettings({
                  ...settings,
                  timeoutSeconds: parseInt(e.target.value, 10),
                })
              }
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value={5}>5 sec</option>
              <option value={10}>10 sec</option>
              <option value={15}>15 sec</option>
              <option value={30}>30 sec</option>
            </select>
          </div>

          {/* Auto-save */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Save className="h-3.5 w-3.5 text-slate-400" />
              <span>Autosave Drafts</span>
            </label>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) =>
                onSaveSettings({
                  ...settings,
                  autoSave: e.target.checked,
                })
              }
              className="h-4 w-4 rounded bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded text-xs font-medium transition cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

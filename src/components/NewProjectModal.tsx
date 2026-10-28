import React, { useState } from 'react'
import { X, FolderPlus } from 'lucide-react'
import type { Language, Project } from '../types'
import { STARTER_PROJECTS, MULTI_FILE_EXAMPLES } from '../examples/starterTemplates'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (project: Project) => void
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<Language>('c')
  const [useMultiFile, setUseMultiFile] = useState(false)

  if (!isOpen) return null

  const handleCreate = () => {
    const finalName = name.trim() || `${language.toUpperCase()} Project`
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    let templateProject: Project

    if (useMultiFile) {
      const example = MULTI_FILE_EXAMPLES[language]
      templateProject = {
        id,
        name: finalName,
        language,
        activeFile: example.defaultEntry,
        updatedAt: Date.now(),
        files: example.files.map((f) => ({
          path: f.path,
          name: f.name,
          content: f.content,
          language,
          isEntry: f.path === example.defaultEntry,
        })),
      }
    } else {
      const starter = STARTER_PROJECTS[language]
      templateProject = {
        id,
        name: finalName,
        language,
        activeFile: starter.activeFile,
        updatedAt: Date.now(),
        files: starter.files.map((f) => ({ ...f })),
      }
    }

    onCreateProject(templateProject)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-slate-100">
            <FolderPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>New Project</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My App"
              autoFocus
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="c">C (Clang Wasm)</option>
              <option value="cpp">C++ (Clang++ Wasm)</option>
              <option value="java">Java (TeaVM Wasm)</option>
              <option value="python">Python (Pyodide Wasm)</option>
              <option value="javascript">JavaScript (Worker)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="multiFileCheck"
              checked={useMultiFile}
              onChange={(e) => setUseMultiFile(e.target.checked)}
              className="h-3.5 w-3.5 rounded bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="multiFileCheck" className="text-slate-700 dark:text-slate-300 cursor-pointer">
              Multi-file template (with headers & modules)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded text-xs font-medium transition cursor-pointer shadow-xs"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

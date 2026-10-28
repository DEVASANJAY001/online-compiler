import React, { useState } from 'react'
import {
  FilePlus,
  Trash2,
  Edit2,
  FolderOpen,
  Plus,
  Check,
  X,
  FileCode,
  ShieldCheck,
} from 'lucide-react'
import type { Project, ProjectFile, RuntimeCapabilities } from '../types'

interface FileExplorerProps {
  project: Project
  projects: Project[]
  onSelectProject: (id: string) => void
  onNewProject: () => void
  onDeleteProject: (id: string) => void
  onRenameProject: (newName: string) => void
  onSelectFile: (path: string) => void
  onAddFile: (filename: string) => void
  onDeleteFile: (path: string) => void
  onRenameFile: (oldPath: string, newPath: string) => void
  dirtyFiles: Set<string>
  capabilities: RuntimeCapabilities
}

function getFileColor(path: string): string {
  if (path.endsWith('.c') || path.endsWith('.h')) return 'text-blue-400'
  if (path.endsWith('.cpp') || path.endsWith('.hpp')) return 'text-indigo-400'
  if (path.endsWith('.java')) return 'text-orange-400'
  if (path.endsWith('.py')) return 'text-emerald-400'
  if (path.endsWith('.js') || path.endsWith('.json')) return 'text-amber-400'
  return 'text-slate-400'
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  project,
  projects,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  dirtyFiles,
  capabilities: _capabilities,
}) => {
  const [isAddingFile, setIsAddingFile] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [editingPath, setEditingPath] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isRenamingProject, setIsRenamingProject] = useState(false)
  const [projectNameInput, setProjectNameInput] = useState('')

  const handleAddSubmit = () => {
    const val = newFileName.trim()
    if (val) {
      onAddFile(val)
      setNewFileName('')
      setIsAddingFile(false)
    }
  }

  const handleRenameSubmit = (oldPath: string) => {
    const val = editingName.trim()
    if (val && val !== oldPath) {
      onRenameFile(oldPath, val)
    }
    setEditingPath(null)
  }

  const handleProjectRenameSubmit = () => {
    const val = projectNameInput.trim()
    if (val && val !== project.name) {
      onRenameProject(val)
    }
    setIsRenamingProject(false)
  }

  return (
    <aside className="w-56 bg-slate-950/90 border-r border-slate-800/80 flex flex-col h-full select-none text-slate-300">
      {/* Project Bar */}
      <div className="p-2.5 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
            Project
          </span>
          <button
            onClick={onNewProject}
            className="text-blue-400 hover:text-blue-300 p-0.5 rounded transition cursor-pointer"
            title="New Project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {isRenamingProject ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProjectRenameSubmit()}
              autoFocus
              className="w-full bg-slate-900 text-slate-100 px-2 py-0.5 text-xs rounded border border-blue-500 focus:outline-none"
            />
            <button onClick={handleProjectRenameSubmit} className="text-emerald-400 p-0.5">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setIsRenamingProject(false)} className="text-slate-400 p-0.5">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <select
              value={project.id}
              onChange={(e) => onSelectProject(e.target.value)}
              aria-label="Select Project"
              className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex items-center ml-1">
              <button
                onClick={() => {
                  setProjectNameInput(project.name)
                  setIsRenamingProject(true)
                }}
                className="p-1 text-slate-500 hover:text-slate-200"
                title="Rename Project"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              {projects.length > 1 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${project.name}"?`)) onDeleteProject(project.id)
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="Delete Project"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Files Header */}
      <div className="px-3 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-800/40">
        <span>FILES</span>
        <button
          onClick={() => setIsAddingFile(true)}
          className="text-slate-400 hover:text-blue-400 p-0.5 rounded transition cursor-pointer"
          title="Add File"
        >
          <FilePlus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Add File Field */}
      {isAddingFile && (
        <div className="p-2 border-b border-slate-800 flex items-center gap-1 bg-slate-900/60">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubmit()
              if (e.key === 'Escape') setIsAddingFile(false)
            }}
            placeholder="e.g. helper.h"
            autoFocus
            className="w-full bg-slate-900 text-slate-100 px-2 py-0.5 text-xs rounded border border-blue-500 focus:outline-none"
          />
          <button onClick={handleAddSubmit} className="text-emerald-400 p-0.5">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setIsAddingFile(false)} className="text-slate-400 p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {project.files.map((file: ProjectFile) => {
          const isActive = file.path === project.activeFile
          const isDirty = dirtyFiles.has(file.path)
          const isEditing = editingPath === file.path
          const iconColor = getFileColor(file.path)

          return (
            <div
              key={file.path}
              onClick={() => onSelectFile(file.path)}
              className={`group flex items-center justify-between px-3 py-1.5 text-xs font-mono transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-slate-100 font-semibold border-l-2 border-blue-500'
                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate flex-1 mr-2">
                <FileCode className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubmit(file.path)
                      if (e.key === 'Escape') setEditingPath(null)
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-800 text-slate-100 px-1 py-0.5 rounded border border-blue-500 focus:outline-none"
                  />
                ) : (
                  <span className="truncate">{file.path}</span>
                )}
                {isDirty && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
                )}
              </div>

              {/* Actions */}
              <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                {!isEditing && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingName(file.path)
                        setEditingPath(file.path)
                      }}
                      className="p-0.5 text-slate-500 hover:text-slate-300"
                      title="Rename"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </button>
                    {project.files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Delete "${file.path}"?`)) onDeleteFile(file.path)
                        }}
                        className="p-0.5 text-slate-500 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Badge */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950 text-[11px] text-slate-400 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span className="truncate">Runs 100% in browser</span>
      </div>
    </aside>
  )
}

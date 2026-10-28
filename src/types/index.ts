export type Language = 'c' | 'cpp' | 'java' | 'python' | 'javascript'

export interface ProjectFile {
  path: string
  name: string
  content: string
  language: Language
  isEntry?: boolean
}

export interface Project {
  id: string
  name: string
  language: Language
  files: ProjectFile[]
  activeFile: string
  updatedAt: number
}

export type ExecutionState =
  | 'idle'
  | 'initializing'
  | 'compiling'
  | 'running'
  | 'waiting-input'
  | 'completed'
  | 'failed'
  | 'stopped'

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export interface Diagnostic {
  severity: DiagnosticSeverity
  message: string
  file?: string
  line?: number
  column?: number
  endLine?: number
  endColumn?: number
  source?: string
}

export interface ExecutionMetrics {
  durationMs: number
  compilationTimeMs?: number
  executionTimeMs?: number
  memoryBytes?: number | null
  terminationReason?: string
  cost?: number | null
}

export interface ExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  diagnostics: Diagnostic[]
  metrics: ExecutionMetrics
  termination?: string
}

export interface RuntimeCapabilities {
  supportsMultiFile: boolean
  supportsInteractiveStdin: boolean
  supportsPreloadedStdin: boolean
  supportsMemoryMetrics: boolean
  inBrowserCompiler: boolean
  clientSideExecution: boolean
  notes: string
  limitations: string[]
}

export interface Settings {
  fontSize: number
  tabSize: number
  timeoutSeconds: number
  theme: 'dark' | 'light'
  autoSave: boolean
  wordWrap: 'on' | 'off'
}

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  tabSize: 2,
  timeoutSeconds: 15,
  theme: 'light',
  autoSave: true,
  wordWrap: 'on',
}

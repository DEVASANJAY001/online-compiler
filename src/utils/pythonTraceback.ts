/**
 * Cleans Pyodide internal stack frames and eval_code wrappers from Python tracebacks,
 * ensuring users only see clean tracebacks referencing their own project files.
 */
export function cleanPythonTraceback(rawError: string): string {
  if (!rawError) return ''
  const lines = rawError.split('\n')
  const cleaned: string[] = []
  let skipUnderInternalFrame = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trimStart()

    // Identify Pyodide internal frames or eval_code wrappers
    const isInternalFrame =
      trimmed.startsWith('File ') &&
      (line.includes('/_pyodide/') ||
        line.includes('_base.py') ||
        line.includes('<exec>') ||
        line.includes('eval_code') ||
        line.includes('eval_code_async'))

    if (isInternalFrame) {
      skipUnderInternalFrame = true
      continue
    }

    if (skipUnderInternalFrame) {
      // If this is a new frame header (e.g. `File "main.py"`), stop skipping
      if (trimmed.startsWith('File ')) {
        skipUnderInternalFrame = false
      } else if (!/^[A-Za-z_][A-Za-z0-9_]*Error:/.test(trimmed)) {
        // Skip code lines or caret lines attached to the internal frame
        continue
      } else {
        // An exception line (e.g. `SyntaxError: ...`) reached
        skipUnderInternalFrame = false
      }
    }

    cleaned.push(line)
  }

  return cleaned.join('\n').trim()
}

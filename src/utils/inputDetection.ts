export interface InputCheckResult {
  needsInput: boolean
  cleanedStdout: string
  cleanedStderr: string
  promptMessage?: string
}

export function analyzeExecutionOutput(
  stdout: string,
  stderr: string,
  exitCode: number
): InputCheckResult {
  // Check for common EOF / NoSuchElementException errors when reading stdin
  const isJavaEof =
    stderr.includes('java.util.NoSuchElementException') ||
    stderr.includes('java.util.Scanner.throwFor') ||
    stdout.includes('java.util.NoSuchElementException')

  const isPythonEof =
    stderr.includes('EOFError: EOF when reading a line') ||
    stderr.includes('EOFError')

  const isCppEof =
    stderr.includes('ios_base::failure') ||
    stderr.includes('basic_ios::clear')

  // Check if stdout ended with an interactive prompt pattern (e.g. "Enter a number: ", "Value: ", "> ")
  const trimmed = stdout.trimEnd()
  const isPromptPattern =
    /(?:enter|input|type|value|number|name|choice|option|give|provide)[^:\n\r]*:\s*$/i.test(trimmed) ||
    /:\s*$/.test(trimmed) ||
    /\?\s*$/.test(trimmed) ||
    />\s*$/.test(trimmed)

  const needsInput = isJavaEof || isPythonEof || isCppEof || (exitCode !== 0 && isPromptPattern)

  if (!needsInput) {
    return {
      needsInput: false,
      cleanedStdout: stdout,
      cleanedStderr: stderr,
    }
  }

  // Clean up the stderr stack trace so the terminal looks clean and only displays the prompt
  let cleanedStderr = stderr
  if (isJavaEof) {
    cleanedStderr = ''
  } else if (isPythonEof) {
    cleanedStderr = ''
  } else if (isCppEof) {
    cleanedStderr = ''
  }

  return {
    needsInput: true,
    cleanedStdout: stdout,
    cleanedStderr,
    promptMessage: trimmed.split('\n').pop() || 'Input required',
  }
}

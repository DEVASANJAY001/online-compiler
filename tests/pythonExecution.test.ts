import { describe, it, expect } from 'vitest'
import { analyzeExecutionOutput } from '../src/utils/inputDetection'
import { computeProjectCacheKey } from '../src/runtimes/wasmOjShared'
import { cleanPythonTraceback } from '../src/utils/pythonTraceback'

describe('Python Execution & Interactive Input Handling', () => {
  it('detects Python EOFError when input() is called and requests interactive terminal input', () => {
    const stdout = 'Enter your name: '
    const stderr = 'Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    name = input("Enter your name: ")\nEOFError: EOF when reading a line'
    const exitCode = 1

    const check = analyzeExecutionOutput(stdout, stderr, exitCode)
    expect(check.needsInput).toBe(true)
    expect(check.cleanedStdout).toBe('Enter your name: ')
    expect(check.cleanedStderr).toBe('')
    expect(check.promptMessage).toBe('Enter your name:')
  })

  it('correctly passes standard execution results when no input is requested', () => {
    const stdout = 'Hello, CodeSpace Python!\nSquares: [1, 4, 9, 16]\n'
    const stderr = ''
    const exitCode = 0

    const check = analyzeExecutionOutput(stdout, stderr, exitCode)
    expect(check.needsInput).toBe(false)
    expect(check.cleanedStdout).toBe(stdout)
    expect(check.cleanedStderr).toBe('')
  })

  it('correctly reports standard Python runtime errors with traceback', () => {
    const stdout = ''
    const stderr = 'Traceback (most recent call last):\n  File "main.py", line 5, in <module>\n    print(1 / 0)\nZeroDivisionError: division by zero\n'
    const exitCode = 1

    const check = analyzeExecutionOutput(stdout, stderr, exitCode)
    expect(check.needsInput).toBe(false)
    expect(check.cleanedStderr).toContain('ZeroDivisionError: division by zero')
  })

  it('generates consistent and deterministic cache keys for Python bytecode caching', () => {
    const files = [
      { path: 'main.py', content: 'print("hello world")' },
      { path: 'helper.py', content: 'def add(a, b): return a + b' },
    ]
    const key1 = computeProjectCacheKey('python', 'main.py', files)
    const key2 = computeProjectCacheKey('python', 'main.py', [...files].reverse())
    expect(key1).toBe(key2)
    expect(key1).toMatch(/^art-python-[0-9a-f]+-[0-9a-f]+$/)

    const keyChanged = computeProjectCacheKey('python', 'main.py', [
      { path: 'main.py', content: 'print("hello modified")' },
      { path: 'helper.py', content: 'def add(a, b): return a + b' },
    ])
    expect(keyChanged).not.toBe(key1)
  })

  it('strips internal Pyodide eval_code and _base.py frames from raw Python errors', () => {
    const rawError = `Traceback (most recent call last):
  File "/lib/python312.zip/_pyodide/_base.py", line 523, in eval_code
    .run(globals, locals)
  File "<exec>", line 3, in <module>
    exec(_bytecode_cache["art-1"], globals())
  File "main.py", line 4, in <module>
    print(1 / 0)
ZeroDivisionError: division by zero`

    const cleaned = cleanPythonTraceback(rawError)
    expect(cleaned).not.toContain('_pyodide')
    expect(cleaned).not.toContain('_base.py')
    expect(cleaned).not.toContain('<exec>')
    expect(cleaned).not.toContain('.run(globals, locals)')
    expect(cleaned).toContain('File "main.py", line 4, in <module>')
    expect(cleaned).toContain('ZeroDivisionError: division by zero')
  })
})


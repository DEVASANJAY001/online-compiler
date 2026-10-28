import { describe, it, expect } from 'vitest'
import { analyzeExecutionOutput } from '../src/utils/inputDetection'

describe('Interactive Terminal Input Detection', () => {
  it('should detect when Java Scanner needs input and strip the EOF stack trace', () => {
    const stdout = 'Enter a number: '
    const stderr = `
      java.util.NoSuchElementException
        at java.util.Scanner.throwFor(Scanner.java:951)
        at java.util.Scanner.next(Scanner.java:1613)
        at java.util.Scanner.nextInt(Scanner.java:2277)
    `
    const res = analyzeExecutionOutput(stdout, stderr, 1)
    expect(res.needsInput).toBe(true)
    expect(res.cleanedStdout).toBe('Enter a number: ')
    expect(res.cleanedStderr).toBe('')
  })

  it('should detect Python input() prompt on EOFError', () => {
    const stdout = 'Enter your age: '
    const stderr = 'EOFError: EOF when reading a line'
    const res = analyzeExecutionOutput(stdout, stderr, 1)
    expect(res.needsInput).toBe(true)
    expect(res.cleanedStdout).toBe('Enter your age: ')
  })

  it('should detect sequential second input prompt when first input is already consumed', () => {
    const stdout = 'Enter first number: Enter second number: '
    const stderr = 'EOFError: EOF when reading a line'
    const res = analyzeExecutionOutput(stdout, stderr, 1)
    expect(res.needsInput).toBe(true)
    expect(res.cleanedStdout).toBe('Enter first number: Enter second number: ')
  })

  it('should not trigger input needed for normal successful execution', () => {
    const stdout = 'Hello, World!\nTotal: 100\n'
    const stderr = ''
    const res = analyzeExecutionOutput(stdout, stderr, 0)
    expect(res.needsInput).toBe(false)
    expect(res.cleanedStdout).toBe(stdout)
  })
})

import { describe, it, expect } from 'vitest'

describe('JavaScript Worker Execution Logic', () => {
  it('should execute calculation and capture console output', async () => {
    let stdoutBuffer = ''
    const mockConsole = {
      log: (...args: unknown[]) => {
        stdoutBuffer += args.join(' ') + '\n'
      },
    }

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const code = `
      let sum = 0;
      for (let i = 1; i <= 5; i++) {
        sum += i;
      }
      console.log("Sum:", sum);
    `

    const runner = new AsyncFunction('console', code)
    await runner(mockConsole)

    expect(stdoutBuffer).toContain('Sum: 15')
  })

  it('should capture runtime errors properly', async () => {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
    const code = `
      throw new Error("Deliberate test runtime failure");
    `

    const runner = new AsyncFunction('console', code)
    await expect(runner(console)).rejects.toThrow('Deliberate test runtime failure')
  })
})

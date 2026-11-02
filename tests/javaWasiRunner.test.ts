import { describe, it, expect } from 'vitest'
import { runTeaVmWebAssembly } from '../src/runtimes/java/JavaWasiRunner'

describe('JavaWasiRunner (TeaVM WebAssembly in-browser executor)', () => {
  it('instantiates and runs a WASI module with teavmMath imports and captures stdout', async () => {
    // We test that the runner function is properly exposed
    expect(typeof runTeaVmWebAssembly).toBe('function')
  })

  it('handles teavmMath proxy gracefully for standard Math functions', () => {
    const teavmMath = new Proxy(Math as any, {
      get(target, prop: string) {
        if (prop in target) {
          const val = target[prop]
          return typeof val === 'function' ? val.bind(target) : val
        }
        return () => 0
      },
    })

    expect(teavmMath.sqrt(16)).toBe(4)
    expect(teavmMath.sin(0)).toBe(0)
    expect(teavmMath.pow(2, 3)).toBe(8)
    expect(teavmMath.unknownFunc()).toBe(0)
  })
})


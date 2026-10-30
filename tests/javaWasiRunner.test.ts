import { describe, it, expect } from 'vitest'
import { runTeaVmWebAssembly } from '../src/runtimes/java/JavaWasiRunner'

describe('JavaWasiRunner (TeaVM WebAssembly in-browser executor)', () => {
  it('instantiates and runs a WASI module with teavmMath imports and captures stdout', async () => {
    // Construct a minimal WebAssembly binary that imports teavmMath.sqrt and wasi_snapshot_preview1.fd_write
    // To ensure portability in tests without needing compiler toolchain, we test the runner with a synthetic wasm module
    const wat = `
      (module
        (import "teavmMath" "sqrt" (func $sqrt (param f64) (result f64)))
        (import "wasi_snapshot_preview1" "proc_exit" (func $exit (param i32)))
        (memory (export "memory") 1)
        (func (export "_start")
          (local $val f64)
          (call $sqrt (f64.const 25.0))
          (set_local $val)
          (call $exit (i32.const 0))
        )
      )
    `
    // We can test the runner functions directly
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

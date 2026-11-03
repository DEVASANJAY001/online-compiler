import { useState, useEffect } from 'react'
import type { Language } from './types'

export type AppRoute =
  | 'compiler'
  | 'python'
  | 'c'
  | 'cpp'
  | 'java'
  | 'javascript'
  | 'features'
  | 'faq'
  | 'templates'
  | 'docs'

interface RouteInfo {
  route: AppRoute
  language?: Language
  title: string
  description: string
}

export function parsePath(pathname: string): RouteInfo {
  const clean = pathname.toLowerCase().replace(/^\/+|\/+$/g, '')

  if (!clean || clean === 'compiler' || clean === 'ide') {
    return {
      route: 'compiler',
      title: 'CodeSpace — Free Online Compiler & IDE (Python, C, C++, Java, JS)',
      description: 'Run Python, C, C++, Java, and JavaScript instantly in your browser with WebAssembly sandboxing.',
    }
  }

  if (clean === 'python' || clean === 'online-python-compiler' || clean === 'run-python') {
    return {
      route: 'python',
      language: 'python',
      title: 'Online Python 3.12 Compiler — Fast, Free In-Browser CPython IDE',
      description: 'Run Python 3.12 online with Pyodide WebAssembly. Supports standard library, math, statistics, collections, and live interactive input.',
    }
  }

  if (clean === 'c' || clean === 'online-c-compiler' || clean === 'run-c') {
    return {
      route: 'c',
      language: 'c',
      title: 'Online C Compiler (Clang 22) — Fast WebAssembly C IDE',
      description: 'Compile and run C code online using Clang 22.0.0 WebAssembly. Supports C99, C11, pointers, stdio, stdlib, math.h, and interactive stdin.',
    }
  }

  if (clean === 'cpp' || clean === 'c++' || clean === 'online-cpp-compiler' || clean === 'run-cpp') {
    return {
      route: 'cpp',
      language: 'cpp',
      title: 'Online C++ Compiler (C++20 Clang++) — Modern STL & Algorithms',
      description: 'Compile modern C++20 online with Clang++ WebAssembly sandbox. Includes full STL vectors, algorithms, classes, templates, and zero server lag.',
    }
  }

  if (clean === 'java' || clean === 'online-java-compiler' || clean === 'run-java') {
    return {
      route: 'java',
      language: 'java',
      title: 'Online Java Compiler (Java 17) — Run Java in Browser without JVM',
      description: 'Execute Java code in your web browser with TeaVM WebAssembly sandbox. Includes Scanner input, OOP, arrays, and standard libraries.',
    }
  }

  if (clean === 'javascript' || clean === 'js' || clean === 'online-javascript-compiler' || clean === 'run-javascript') {
    return {
      route: 'javascript',
      language: 'javascript',
      title: 'Online JavaScript Runner (ES2024) — Browser V8 Sandbox',
      description: 'Run modern ES2024 JavaScript in an isolated browser worker sandbox. Supports async/await, Array methods, JSON, and live console output.',
    }
  }

  if (clean === 'features' || clean === 'about') {
    return {
      route: 'features',
      title: 'CodeSpace Features — Zero-Queue Client-Side WebAssembly Architecture',
      description: 'Discover how CodeSpace compiles Python, C, C++, Java, and JS entirely inside your browser with 100% privacy and zero server wait time.',
    }
  }

  if (clean === 'faq') {
    return {
      route: 'faq',
      title: 'Frequently Asked Questions (FAQ) — CodeSpace Online Compiler',
      description: 'Common questions about CodeSpace client-side execution, security sandbox, supported libraries, interactive input, and privacy.',
    }
  }

  if (clean === 'templates' || clean === 'algorithms') {
    return {
      route: 'templates',
      title: 'Algorithm & Code Templates Library — CodeSpace Online IDE',
      description: 'Explore ready-to-run starter code and algorithms for Python, C, C++, Java, and JavaScript. Open and run with 1 click.',
    }
  }

  if (clean === 'docs' || clean === 'shortcuts') {
    return {
      route: 'docs',
      title: 'CodeSpace Documentation & Keyboard Shortcuts',
      description: 'Complete user guide for CodeSpace online compiler: multi-file projects, hotkeys, downloading ZIPs, and customization options.',
    }
  }

  // Fallback to compiler
  return {
    route: 'compiler',
    title: 'CodeSpace — Free Online Compiler & IDE',
    description: 'Run Python, C, C++, Java, and JavaScript in your browser.',
  }
}

export function updatePageMetadata(info: RouteInfo) {
  if (typeof document === 'undefined') return

  // Update title
  document.title = info.title

  // Update meta description
  let descMeta = document.querySelector('meta[name="description"]')
  if (!descMeta) {
    descMeta = document.createElement('meta')
    descMeta.setAttribute('name', 'description')
    document.head.appendChild(descMeta)
  }
  descMeta.setAttribute('content', info.description)

  // Update canonical
  let canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) {
    const url = info.route === 'compiler'
      ? 'https://yourcodebase.vercel.app/'
      : `https://yourcodebase.vercel.app/${info.route}`
    canonical.setAttribute('href', url)
  }
}

export function navigateTo(path: string) {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useAppRouter() {
  const [currentRoute, setCurrentRoute] = useState<RouteInfo>(() => {
    if (typeof window !== 'undefined') {
      return parsePath(window.location.pathname)
    }
    return parsePath('/')
  })

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parsePath(window.location.pathname)
      setCurrentRoute(parsed)
      updatePageMetadata(parsed)
    }

    // Apply metadata for initial route
    updatePageMetadata(currentRoute)

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path: string) => {
    navigateTo(path)
  }

  return { currentRoute, navigate }
}

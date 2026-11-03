import { useState, useEffect } from 'react'
import { Workspace } from './components/Workspace'
import { LanguageLandingPage } from './pages/LanguageLandingPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { FaqPage } from './pages/FaqPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { DocsPage } from './pages/DocsPage'
import { useAppRouter } from './router'
import type { Language } from './types'

export function App() {
  const { currentRoute, navigate } = useAppRouter()

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('codespace_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch {}
    return 'light'
  })

  const [compilerInitState, setCompilerInitState] = useState<{
    language?: Language
    code?: string
    filename?: string
  }>({})

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem('codespace_theme', next)
    } catch {}
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }

  const handleLaunchCompiler = (lang?: Language) => {
    if (lang) {
      setCompilerInitState({ language: lang })
    }
    navigate('/')
  }

  const handleLaunchWithCode = (lang: Language, code: string, filename: string) => {
    setCompilerInitState({ language: lang, code, filename })
    navigate('/')
  }

  switch (currentRoute.route) {
    case 'python':
      return (
        <LanguageLandingPage
          language="python"
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={handleLaunchCompiler}
        />
      )

    case 'c':
      return (
        <LanguageLandingPage
          language="c"
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={handleLaunchCompiler}
        />
      )

    case 'cpp':
      return (
        <LanguageLandingPage
          language="cpp"
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={handleLaunchCompiler}
        />
      )

    case 'java':
      return (
        <LanguageLandingPage
          language="java"
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={handleLaunchCompiler}
        />
      )

    case 'javascript':
      return (
        <LanguageLandingPage
          language="javascript"
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={handleLaunchCompiler}
        />
      )

    case 'features':
      return (
        <FeaturesPage
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={() => handleLaunchCompiler()}
        />
      )

    case 'faq':
      return (
        <FaqPage
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={() => handleLaunchCompiler()}
        />
      )

    case 'templates':
      return (
        <TemplatesPage
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchWithCode={handleLaunchWithCode}
        />
      )

    case 'docs':
      return (
        <DocsPage
          theme={theme}
          onToggleTheme={toggleTheme}
          onLaunchCompiler={() => handleLaunchCompiler()}
        />
      )

    case 'compiler':
    default:
      return (
        <Workspace
          initialLanguage={compilerInitState.language}
          initialCode={compilerInitState.code}
          initialFilename={compilerInitState.filename}
        />
      )
  }
}

export default App

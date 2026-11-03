import React, { useState } from 'react'
import {
  Play,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import type { Language } from '../types'
import { navigateTo } from '../router'
import { SeoNav } from '../components/SeoNav'
import { SeoFooter } from '../components/SeoFooter'
import { renderLanguageIcon } from '../components/LanguageStrip'

interface LanguageLandingPageProps {
  language: Language
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLaunchCompiler: (lang?: Language) => void
}

interface LanguageMeta {
  title: string
  subtitle: string
  versionBadge: string
  engineBadge: string
  description: string
  codeSnippet: string
  filename: string
  features: Array<{ title: string; desc: string }>
  cheatsheet: Array<{ label: string; code: string; explanation: string }>
  faqs: Array<{ q: string; a: string }>
}

const LANGUAGE_DETAILS: Record<Language, LanguageMeta> = {
  python: {
    title: 'Online Python 3.12 Compiler',
    subtitle: 'Run Python 3.12 code instantly in your web browser with Pyodide CPython WebAssembly. Zero install, zero wait time.',
    versionBadge: 'Python 3.12.7',
    engineBadge: 'CPython / Pyodide WASM',
    description: 'CodeSpace is a lightning-fast online Python compiler executing standard Python 3.12 directly in your browser. Features standard library collections, math, statistics, string manipulation, and interactive stdin.',
    filename: 'main.py',
    codeSnippet: `from collections import Counter
import math

# Calculate prime numbers using list comprehension
def get_primes(limit):
    return [x for x in range(2, limit) if all(x % d != 0 for d in range(2, int(math.isqrt(x)) + 1))]

# Frequency counter demo
words = "python webassembly online compiler codespace python"
freq = Counter(words.split())

print("Top Primes under 50:", get_primes(50))
print("Word Frequency:", dict(freq))
`,
    features: [
      { title: 'Standard CPython 3.12', desc: 'Real CPython 3.12.7 WebAssembly VM with full language specification compatibility.' },
      { title: 'Live Interactive Stdin', desc: 'Seamlessly accepts input() prompts through an integrated interactive terminal.' },
      { title: 'Standard Libraries Included', desc: 'Includes collections, math, re, json, itertools, functools, random, and statistics out of the box.' },
      { title: 'Clean Traceback Filtering', desc: 'Internal Pyodide stack frames are cleanly stripped, highlighting your exact file and line numbers.' },
    ],
    cheatsheet: [
      { label: 'Interactive Input', code: 'name = input("Enter name: ")\nprint(f"Hello, {name}!")', explanation: 'Read user line via stdin and format into f-string.' },
      { label: 'List Comprehension', code: 'squares = [x**2 for x in range(10) if x % 2 == 0]', explanation: 'Concise syntax to filter and transform lists.' },
      { label: 'Dictionary & Counting', code: 'counts = {}\nfor ch in "hello":\n    counts[ch] = counts.get(ch, 0) + 1', explanation: 'Count element frequency with .get() default value.' },
      { label: 'File & Exception Handling', code: 'try:\n    res = 100 / 0\nexcept ZeroDivisionError as e:\n    print("Handled:", e)', explanation: 'Safely catch and process runtime exceptions.' },
    ],
    faqs: [
      { q: 'Is this real Python or a limited simulator?', a: 'CodeSpace executes official CPython 3.12 compiled to WebAssembly via Pyodide. It is the real Python interpreter running client-side inside your browser.' },
      { q: 'Can I use input() to take interactive inputs?', a: 'Yes! When your Python script calls input(), CodeSpace automatically highlights the input bar in the terminal, accepts your text, and resumes execution.' },
      { q: 'Is my Python code sent to a remote server?', a: 'No. Your code is compiled and executed 100% inside your browser web worker. It never leaves your device.' },
    ],
  },

  c: {
    title: 'Online C Compiler (Clang 22)',
    subtitle: 'Compile and run standard C code in your browser with Clang 22.0.0 WebAssembly. Real pointers, memory safety, and 0ms queue.',
    versionBadge: 'Clang 22.0.0',
    engineBadge: 'wasm32-wasip1 Sandbox',
    description: 'CodeSpace provides a genuine Clang compiler running inside WebAssembly. Compile C99 and C11 programs with full support for stdio.h, stdlib.h, string.h, math.h, and structs.',
    filename: 'main.c',
    codeSnippet: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Dynamic array demonstration
int main(void) {
    printf("=== Online C Compiler (Clang WebAssembly) ===\\n");
    
    int n = 5;
    int *arr = (int *)malloc(n * sizeof(int));
    if (!arr) return 1;

    for (int i = 0; i < n; i++) {
        arr[i] = (i + 1) * 10;
        printf("arr[%d] = %d\\n", i, arr[i]);
    }

    free(arr);
    printf("Memory cleanly deallocated!\\n");
    return 0;
}
`,
    features: [
      { title: 'Real Clang 22 Toolchain', desc: 'Native LLVM Clang compiler executing client-side with wasm32-wasip1 target.' },
      { title: 'Standard C Libraries', desc: 'Full support for stdio.h, stdlib.h, string.h, math.h, ctype.h, and stdbool.h.' },
      { title: 'Instant In-Browser Linking', desc: 'Links object files into WASM binaries client-side in ~40ms with memory caching.' },
      { title: 'Diagnostic Markers', desc: 'Compiler warnings and errors map directly to line and column markers in the Monaco editor.' },
    ],
    cheatsheet: [
      { label: 'Basic I/O & Scanf', code: 'int val;\nprintf("Enter integer: ");\nscanf("%d", &val);', explanation: 'Prompt user and read formatted integer from stdin.' },
      { label: 'Pointers & Dereferencing', code: 'int a = 42;\nint *ptr = &a;\nprintf("Value: %d", *ptr);', explanation: 'Store memory address in pointer and access value with * operator.' },
      { label: 'Structures & Memory', code: 'typedef struct {\n    char name[32];\n    int score;\n} Player;', explanation: 'Define custom compound data types with typedef.' },
      { label: 'Dynamic Memory (malloc/free)', code: 'char *buf = malloc(256);\nsnprintf(buf, 256, "Hello C");\nfree(buf);', explanation: 'Allocate heap memory and ensure cleanup with free().' },
    ],
    faqs: [
      { q: 'What C standard is supported by default?', a: 'CodeSpace compiles with Clang 22 supporting C99, C11, and C17 standard syntax.' },
      { q: 'Can I allocate heap memory with malloc() in WebAssembly?', a: 'Yes! WebAssembly includes linear memory heap management, so malloc(), calloc(), and free() work exactly as expected.' },
      { q: 'How fast is compilation compared to cloud compilers?', a: 'Because compilation happens client-side without queuing on remote servers or network hops, rebuilds take less than 50ms with cached artifacts.' },
    ],
  },

  cpp: {
    title: 'Online C++ Compiler (C++20 Clang++)',
    subtitle: 'Modern C++20 compiler with full Standard Template Library (STL), templates, vectors, and algorithms powered by Clang++ WebAssembly.',
    versionBadge: 'C++ 20 Standard',
    engineBadge: 'Clang++ WebAssembly',
    description: 'Write modern C++20 with vector, map, set, algorithm, and object-oriented abstractions. Compiled client-side with Clang++ 22.0.0 and libc++ precompiled headers for fast execution.',
    filename: 'main.cpp',
    codeSnippet: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::cout << "=== Modern C++20 Online Compiler ===" << std::endl;

    std::vector<int> numbers = {64, 34, 25, 12, 22, 11, 90};
    
    // Modern STL sorting
    std::sort(numbers.begin(), numbers.end());

    std::cout << "Sorted numbers: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << std::endl;

    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum: " << sum << std::endl;

    return 0;
}
`,
    features: [
      { title: 'C++20 Modern Standard', desc: 'Support for range-for loops, auto type deduction, lambdas, and constexpr.' },
      { title: 'Full STL Containers', desc: 'Rich support for std::vector, std::string, std::map, std::set, std::queue, and std::stack.' },
      { title: 'Precompiled libc++ Headers', desc: 'Precompiled header optimization cuts cold C++ build latency by over 80%.' },
      { title: 'Zero Rate Limits', desc: 'No queue bottlenecks, hourly compilation quotas, or paywalls. Compile freely.' },
    ],
    cheatsheet: [
      { label: 'STL Vector & Sort', code: 'std::vector<int> v = {3, 1, 4};\nstd::sort(v.begin(), v.end());', explanation: 'Dynamic contiguous array with efficient O(N log N) sorting.' },
      { label: 'C++ Cin & Cout', code: 'std::string s;\nstd::cout << "Enter text: ";\nstd::cin >> s;', explanation: 'Standard stream I/O from iostream library.' },
      { label: 'Lambda Expressions', code: 'auto square = [](int x) { return x * x; };\nstd::cout << square(5);', explanation: 'Inline anonymous callable closures.' },
      { label: 'Class & Constructor', code: 'class Item {\npublic:\n    Item(int v) : val(v) {}\n    int val;\n};', explanation: 'Object-oriented class definition with initializer list.' },
    ],
    faqs: [
      { q: 'Does CodeSpace support the C++ Standard Template Library?', a: 'Yes! CodeSpace includes full LLVM libc++ containing vector, string, algorithm, map, set, unordered_map, and iostream.' },
      { q: 'Is cin supported for user input?', a: 'Yes! The terminal seamlessly streams your inputs to std::cin.' },
      { q: 'How does C++ achieve instant compile times?', a: 'We utilize precompiled header caches for libc++, allowing Clang++ to reuse parsed standard templates instantly.' },
    ],
  },

  java: {
    title: 'Online Java Compiler (Java 17)',
    subtitle: 'Run Java code directly in your browser without installing the JDK or JVM. Powered by TeaVM WebAssembly sandbox.',
    versionBadge: 'Java 17 Compatible',
    engineBadge: 'TeaVM WebAssembly JVM',
    description: 'CodeSpace translates Java bytecode into isolated WebAssembly modules using TeaVM, providing a genuine client-side Java environment with Scanner input, OOP, and arrays.',
    filename: 'Main.java',
    codeSnippet: `import java.util.ArrayList;
import java.util.Collections;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== Online Java Compiler (WebAssembly) ===");

        ArrayList<String> languages = new ArrayList<>();
        languages.add("Java");
        languages.add("Python");
        languages.add("C++");
        languages.add("C");
        languages.add("JavaScript");

        Collections.sort(languages);

        System.out.println("Supported Languages in CodeSpace:");
        for (String lang : languages) {
            System.out.println(" • " + lang);
        }
    }
}
`,
    features: [
      { title: 'In-Browser JVM Sandbox', desc: 'Executes Java bytecode inside a WebAssembly sandbox without needing JDK installation.' },
      { title: 'Interactive Scanner Support', desc: 'Use java.util.Scanner(System.in) for live user prompts.' },
      { title: 'Standard Java Collections', desc: 'Full support for ArrayList, HashMap, HashSet, StringBuilder, and Arrays.' },
      { title: 'Object-Oriented Design', desc: 'Build multiple classes, interfaces, inheritance trees, and custom methods.' },
    ],
    cheatsheet: [
      { label: 'Scanner Input', code: 'import java.util.Scanner;\nScanner sc = new Scanner(System.in);\nint val = sc.nextInt();', explanation: 'Read primitive tokens and lines from standard input.' },
      { label: 'ArrayList & Iteration', code: 'List<Integer> list = new ArrayList<>();\nlist.add(10);\nfor (int n : list) System.out.println(n);', explanation: 'Resizable array implementation of List interface.' },
      { label: 'Class Definition', code: 'class Car {\n    String model;\n    Car(String m) { this.model = m; }\n}', explanation: 'Define blueprints for objects with fields and constructors.' },
      { label: 'Exception Handling', code: 'try {\n    int res = 10 / 0;\n} catch (ArithmeticException e) {\n    System.out.println(e.getMessage());\n}', explanation: 'Catch and handle runtime exceptions cleanly.' },
    ],
    faqs: [
      { q: 'Do I need Java or JDK installed on my computer?', a: 'No! CodeSpace runs completely inside any modern browser using WebAssembly. No JVM or Oracle JDK required.' },
      { q: 'Can I use java.util.Scanner for reading inputs?', a: 'Yes! System.in is connected to our interactive terminal stdin stream.' },
      { q: 'Can I create multiple classes?', a: 'Yes! You can define additional helper classes within Main.java or add multiple project files.' },
    ],
  },

  javascript: {
    title: 'Online JavaScript Runner (ES2024)',
    subtitle: 'Execute modern JavaScript in an isolated browser V8 worker sandbox. Features async/await, Array methods, and real-time console.',
    versionBadge: 'ES2024 / V8 Sandbox',
    engineBadge: 'Isolated Web Worker',
    description: 'CodeSpace offers an instant JavaScript sandbox for writing, testing, and debugging modern ECMAScript code. Clean console output, execution timers, and zero configuration.',
    filename: 'index.js',
    codeSnippet: `// Modern ES2024 JavaScript Runner
const data = [
  { name: 'Python', type: 'Interpreted', speed: 'Fast' },
  { name: 'C', type: 'Compiled', speed: 'Blazing' },
  { name: 'C++', type: 'Compiled', speed: 'Blazing' },
  { name: 'Java', type: 'Bytecode', speed: 'Fast' },
  { name: 'JavaScript', type: 'JIT V8', speed: 'Instant' },
];

// Array transformations
const compiled = data.filter(item => item.type === 'Compiled');
console.log('Compiled Languages:', compiled);

// Async execution simulation
async function runDemo() {
  console.log('Calculating stats...');
  const names = data.map(d => d.name).join(', ');
  console.log(\`CodeSpace supports: \${names}\`);
}

runDemo();
`,
    features: [
      { title: 'Modern ES2024 Features', desc: 'Full support for async/await, arrow functions, destructuring, and template literals.' },
      { title: 'Isolated V8 Worker', desc: 'Runs inside a clean web worker sandbox preventing DOM tampering while preserving full JS power.' },
      { title: 'Console Stream Mirroring', desc: 'console.log, console.warn, and console.error output directly to the terminal.' },
      { title: 'Zero Latency', desc: 'Executes instantly in under 5ms using your browser native JavaScript engine.' },
    ],
    cheatsheet: [
      { label: 'Async / Await', code: 'async function fetchVal() {\n  return 42;\n}\nconst v = await fetchVal();', explanation: 'Handle asynchronous promises with clean synchronous syntax.' },
      { label: 'Array Methods', code: 'const arr = [1, 2, 3];\nconst doubled = arr.map(x => x * 2);', explanation: 'Functional transformations using .map(), .filter(), .reduce().' },
      { label: 'Destructuring & Spread', code: 'const user = { name: "Alice", age: 25 };\nconst { name } = user;', explanation: 'Extract properties easily into distinct variables.' },
      { label: 'Classes & Modules', code: 'class Calc {\n  static add(a, b) { return a + b; }\n}', explanation: 'Modern ECMAScript class syntax with static methods.' },
    ],
    faqs: [
      { q: 'Which JavaScript features are supported?', a: 'CodeSpace runs on your browser native V8/JavaScriptCore engine, supporting 100% of modern ECMAScript 2024 standards.' },
      { q: 'Can I inspect performance metrics?', a: 'Yes! The Metrics tab shows exact execution duration down to sub-milliseconds and heap memory usage.' },
      { q: 'Is Node.js required?', a: 'No, CodeSpace runs directly in client-side web workers with zero server requirements.' },
    ],
  },
}

export const LanguageLandingPage: React.FC<LanguageLandingPageProps> = ({
  language,
  theme,
  onToggleTheme,
  onLaunchCompiler,
}) => {
  const meta = LANGUAGE_DETAILS[language] || LANGUAGE_DETAILS.python
  const [copied, setCopied] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meta.codeSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRunInIde = () => {
    onLaunchCompiler(language)
  }

  const otherLanguages: Language[] = (['python', 'c', 'cpp', 'java', 'javascript'] as Language[]).filter(
    (l) => l !== language
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <SeoNav
        currentRoute={language}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLaunchCompiler={() => onLaunchCompiler(language)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* HERO SECTION */}
        <section className="text-center space-y-6 pt-4 pb-2">
          {/* Version Badges */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>{meta.versionBadge}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{meta.engineBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            {meta.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {meta.subtitle}
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRunInIde}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-sm sm:text-base rounded-xl shadow-md hover:shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Open in Compiler (Instant)</span>
            </button>
            <button
              onClick={handleCopyCode}
              className="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Code Copied' : 'Copy Sample'}</span>
            </button>
          </div>
        </section>

        {/* INTERACTIVE CODE PREVIEW & RUN CARD */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="h-10 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
              {renderLanguageIcon(language, 'w-4 h-4')}
              <span>{meta.filename}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleRunInIde}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Run Code</span>
              </button>
            </div>
          </div>
          <pre className="p-4 sm:p-6 overflow-x-auto font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/50 dark:bg-slate-950/50">
            <code>{meta.codeSnippet}</code>
          </pre>
        </section>

        {/* WHY CODESPACE GRID */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Why CodeSpace for {meta.title.replace('Online ', '').replace(' Compiler', '')}?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Engineered with WebAssembly client-side execution to deliver unparalleled speed, privacy, and responsiveness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {meta.features.map((feat, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">{feat.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* QUICK CHEATSHEET & SYNTAX REFERENCE */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Quick Syntax Cheatsheet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Key building blocks and common patterns you can run right away in the IDE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meta.cheatsheet.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{item.label}</span>
                  <span className="text-[11px] text-slate-400">{item.explanation}</span>
                </div>
                <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg font-mono text-xs overflow-x-auto text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800/60">
                  <code>{item.code}</code>
                </pre>
              </div>
            ))}
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Everything you need to know about running code on CodeSpace.
            </p>
          </div>

          <div className="space-y-3">
            {meta.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-sm flex items-center justify-between text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* CROSS-LINKING TO OTHER COMPILERS */}
        <section className="p-8 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Need to compile another programming language?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            CodeSpace supports 5 major programming languages with zero server lag. Explore our other dedicated compilers:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {otherLanguages.map((otherLang) => (
              <a
                key={otherLang}
                href={`/${otherLang}`}
                onClick={(e) => {
                  e.preventDefault()
                  navigateTo(`/${otherLang}`)
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex items-center gap-1.5 shadow-2xs"
              >
                {renderLanguageIcon(otherLang, 'w-3.5 h-3.5')}
                <span className="capitalize">{otherLang}</span>
              </a>
            ))}
          </div>
        </section>
      </main>

      <SeoFooter />
    </div>
  )
}

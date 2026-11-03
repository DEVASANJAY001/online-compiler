import React, { useState } from 'react'
import {
  Layers,
  Play,
  Copy,
  Check,
  Code2,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { SeoNav } from '../components/SeoNav'
import { SeoFooter } from '../components/SeoFooter'
import type { Language } from '../types'
import { renderLanguageIcon } from '../components/LanguageStrip'

interface TemplatesPageProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLaunchWithCode: (lang: Language, code: string, filename: string) => void
}

interface TemplateItem {
  id: string
  title: string
  category: string
  language: Language
  filename: string
  description: string
  code: string
}

const TEMPLATES_COLLECTION: TemplateItem[] = [
  {
    id: 'py-fibonacci',
    title: 'Fibonacci Series (Dynamic Programming)',
    category: 'Algorithms',
    language: 'python',
    filename: 'fibonacci.py',
    description: 'Calculates Fibonacci numbers with memoization for O(N) linear time complexity.',
    code: `def fib_memo(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]

print("First 15 Fibonacci Numbers:")
for i in range(15):
    print(f"F({i}) = {fib_memo(i)}")
`,
  },
  {
    id: 'py-prime-sieve',
    title: 'Sieve of Eratosthenes (Prime Numbers)',
    category: 'Math',
    language: 'python',
    filename: 'sieve.py',
    description: 'Efficiently discovers all prime numbers up to N in O(N log log N) time.',
    code: `def sieve_of_eratosthenes(limit):
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False
    
    for p in range(2, int(limit**0.5) + 1):
        if is_prime[p]:
            for multiple in range(p * p, limit + 1, p):
                is_prime[multiple] = False
                
    return [i for i, prime in enumerate(is_prime) if prime]

primes = sieve_of_eratosthenes(100)
print(f"Found {len(primes)} primes under 100:")
print(primes)
`,
  },
  {
    id: 'c-binary-search',
    title: 'Binary Search Implementation',
    category: 'Algorithms',
    language: 'c',
    filename: 'binary_search.c',
    description: 'Fast O(log N) search on sorted arrays in standard C using pointer arithmetic.',
    code: `#include <stdio.h>

int binarySearch(const int arr[], int left, int right, int target) {
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main(void) {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 23;

    int idx = binarySearch(arr, 0, n - 1, target);
    if (idx != -1) {
        printf("Target %d located at index %d!\\n", target, idx);
    } else {
        printf("Target %d not present in array.\\n", target);
    }
    return 0;
}
`,
  },
  {
    id: 'c-linked-list',
    title: 'Singly Linked List with Malloc',
    category: 'Data Structures',
    language: 'c',
    filename: 'linked_list.c',
    description: 'Dynamic node allocation and traversal demonstration in C.',
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

Node *createNode(int val) {
    Node *n = (Node *)malloc(sizeof(Node));
    n->data = val;
    n->next = NULL;
    return n;
}

int main(void) {
    Node *head = createNode(10);
    head->next = createNode(20);
    head->next->next = createNode(30);

    printf("Linked List Elements: ");
    Node *curr = head;
    while (curr) {
        printf("%d -> ", curr->data);
        Node *tmp = curr;
        curr = curr->next;
        free(tmp);
    }
    printf("NULL\\nMemory freed cleanly!\\n");
    return 0;
}
`,
  },
  {
    id: 'cpp-vector-stl',
    title: 'Modern C++20 STL Algorithms',
    category: 'Standard Library',
    language: 'cpp',
    filename: 'stl_demo.cpp',
    description: 'Demonstrates vector sorting, filtering, and reduction using std::algorithm.',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::vector<int> scores = {85, 92, 78, 96, 88, 74, 100};

    // Sort descending
    std::sort(scores.begin(), scores.end(), std::greater<int>());

    std::cout << "Ranked Scores:\\n";
    for (size_t i = 0; i < scores.size(); ++i) {
        std::cout << i + 1 << ". " << scores[i] << std::endl;
    }

    double avg = std::accumulate(scores.begin(), scores.end(), 0.0) / scores.size();
    std::cout << "\\nAverage Score: " << avg << std::endl;
    return 0;
}
`,
  },
  {
    id: 'java-palindrome',
    title: 'Palindrome & String Manipulation',
    category: 'Strings',
    language: 'java',
    filename: 'Palindrome.java',
    description: 'Checks palindrome strings ignoring casing and non-alphanumeric characters.',
    code: `public class Main {
    public static boolean isPalindrome(String s) {
        String clean = s.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        int left = 0, right = clean.length() - 1;
        while (left < right) {
            if (clean.charAt(left) != clean.charAt(right)) return false;
            left++;
            right--;
        }
        return true;
    }

    public static void main(String[] args) {
        String test1 = "A man, a plan, a canal: Panama";
        String test2 = "CodeSpace Compiler";

        System.out.println("'" + test1 + "' -> " + (isPalindrome(test1) ? "PALINDROME" : "NOT"));
        System.out.println("'" + test2 + "' -> " + (isPalindrome(test2) ? "PALINDROME" : "NOT"));
    }
}
`,
  },
  {
    id: 'js-async-demo',
    title: 'Async Task Queue & Promise.all',
    category: 'Async',
    language: 'javascript',
    filename: 'async_queue.js',
    description: 'Concurrent simulated async processing using modern Promises and timing metrics.',
    code: `const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function processTask(id, durationMs) {
  console.log(\`Task \${id} started...\`);
  await sleep(durationMs);
  console.log(\`Task \${id} completed after \${durationMs}ms\`);
  return { id, durationMs };
}

async function runQueue() {
  const start = performance.now();
  console.log("=== Concurrent Task Processor ===");

  const results = await Promise.all([
    processTask(1, 40),
    processTask(2, 60),
    processTask(3, 20),
  ]);

  const total = performance.now() - start;
  console.log(\`All tasks finished in \${total.toFixed(1)}ms!\`);
  console.log("Results Summary:", results);
}

runQueue();
`,
  },
]

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  theme,
  onToggleTheme,
  onLaunchWithCode,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = selectedLang === 'all'
    ? TEMPLATES_COLLECTION
    : TEMPLATES_COLLECTION.filter((t) => t.language === selectedLang)

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <SeoNav
        currentRoute="templates"
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLaunchCompiler={() => onLaunchWithCode('python', TEMPLATES_COLLECTION[0].code, TEMPLATES_COLLECTION[0].filename)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Layers className="w-3.5 h-3.5" />
            <span>Curated Code Snippets &amp; Algorithms</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Algorithm &amp; Starter Templates Library
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Ready-to-run computer science algorithms and standard patterns. Open any template in the CodeSpace compiler with 1 click.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {['all', 'python', 'c', 'cpp', 'java', 'javascript'].map((langKey) => (
              <button
                key={langKey}
                onClick={() => setSelectedLang(langKey)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer flex items-center gap-1.5 ${
                  selectedLang === langKey
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                {langKey !== 'all' && renderLanguageIcon(langKey as Language, 'w-3.5 h-3.5')}
                <span>{langKey === 'cpp' ? 'C++' : langKey}</span>
              </button>
            ))}
          </div>
        </section>

        {/* TEMPLATES GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => {
            const isCopied = copiedId === item.id
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 flex items-center justify-center">
                          {renderLanguageIcon(item.language, 'w-3.5 h-3.5')}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white pt-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                    </div>

                    <button
                      onClick={() => handleCopy(item.id, item.code)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                      title="Copy snippet"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Code Snippet Box */}
                  <pre className="p-4 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] sm:text-xs overflow-x-auto text-slate-800 dark:text-slate-200 max-h-56 leading-relaxed">
                    <code>{item.code}</code>
                  </pre>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">{item.filename}</span>
                  <button
                    onClick={() => onLaunchWithCode(item.language, item.code, item.filename)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Open in Compiler</span>
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      </main>

      <SeoFooter />
    </div>
  )
}

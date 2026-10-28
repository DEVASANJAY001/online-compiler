import type { Language, Project } from '../types'

export interface ExampleSnippet {
  id: string
  title: string
  description: string
  language: Language
  defaultEntry: string
  files: Array<{ path: string; name: string; content: string }>
}

export const STARTER_PROJECTS: Record<Language, Project> = {
  c: {
    id: 'default-c',
    name: 'C Program',
    language: 'c',
    activeFile: 'main.c',
    updatedAt: Date.now(),
    files: [
      {
        path: 'main.c',
        name: 'main.c',
        language: 'c',
        isEntry: true,
        content: `#include <stdio.h>

int main(void) {
    printf("Hello, CodeSpace!\\n");
    printf("Compiled client-side in your browser with Clang WebAssembly.\\n\\n");
    
    // Quick calculation
    int sum = 0;
    for (int i = 1; i <= 10; ++i) {
        sum += i;
    }
    printf("Sum from 1 to 10: %d\\n", sum);
    
    return 0;
}
`,
      },
    ],
  },

  cpp: {
    id: 'default-cpp',
    name: 'C++ Program',
    language: 'cpp',
    activeFile: 'main.cpp',
    updatedAt: Date.now(),
    files: [
      {
        path: 'main.cpp',
        name: 'main.cpp',
        language: 'cpp',
        isEntry: true,
        content: `#include <iostream>
#include <vector>
#include <numeric>
#include <string>

int main() {
    std::cout << "Hello, CodeSpace C++20!" << std::endl;
    std::cout << "Running in-browser WebAssembly via Clang & libc++." << std::endl << std::endl;

    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int total = std::accumulate(numbers.begin(), numbers.end(), 0);

    std::cout << "Vector elements: ";
    for (int n : numbers) {
        std::cout << n << " ";
    }
    std::cout << "\\nTotal sum: " << total << std::endl;

    return 0;
}
`,
      },
    ],
  },

  java: {
    id: 'default-java',
    name: 'Java Program',
    language: 'java',
    activeFile: 'Main.java',
    updatedAt: Date.now(),
    files: [
      {
        path: 'Main.java',
        name: 'Main.java',
        language: 'java',
        isEntry: true,
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeSpace Java!");
        System.out.println("Compiled and executed in your browser via WebAssembly.\\n");

        int n = 7;
        long factorial = 1;
        for (int i = 1; i <= n; i++) {
            factorial *= i;
        }

        System.out.println("Factorial of " + n + " is: " + factorial);
    }
}
`,
      },
    ],
  },

  python: {
    id: 'default-python',
    name: 'Python Program',
    language: 'python',
    activeFile: 'main.py',
    updatedAt: Date.now(),
    files: [
      {
        path: 'main.py',
        name: 'main.py',
        language: 'python',
        isEntry: true,
        content: `import sys

def main():
    print("Hello, CodeSpace Python!")
    print(f"Python Version: {sys.version.split()[0]}")
    print("Running in browser via Pyodide WebAssembly runtime.\\n")

    # List comprehension & calculation
    squares = [x**2 for x in range(1, 11)]
    print(f"Squares from 1 to 10: {squares}")
    print(f"Sum of squares: {sum(squares)}")

if __name__ == "__main__":
    main()
`,
      },
    ],
  },

  javascript: {
    id: 'default-javascript',
    name: 'JavaScript Program',
    language: 'javascript',
    activeFile: 'index.js',
    updatedAt: Date.now(),
    files: [
      {
        path: 'index.js',
        name: 'index.js',
        language: 'javascript',
        isEntry: true,
        content: `// CodeSpace JavaScript Playground
console.log("Hello, CodeSpace JavaScript!");
console.log("Executed in a dedicated browser Web Worker.\\n");

const data = [
  { name: "Alpha", score: 88 },
  { name: "Beta", score: 94 },
  { name: "Gamma", score: 76 }
];

const highScorers = data.filter(item => item.score > 80);
console.log("High Scorers (score > 80):", highScorers);

const average = data.reduce((acc, curr) => acc + curr.score, 0) / data.length;
console.log("Average Score:", average.toFixed(2));
`,
      },
    ],
  },
}

export const MULTI_FILE_EXAMPLES: Record<Language, ExampleSnippet> = {
  c: {
    id: 'c-multifile',
    title: 'C Multi-File (Header + Source)',
    description: 'Demonstrates modular C code with custom header file inclusion.',
    language: 'c',
    defaultEntry: 'main.c',
    files: [
      {
        path: 'math_utils.h',
        name: 'math_utils.h',
        content: `#ifndef MATH_UTILS_H
#define MATH_UTILS_H

int add(int a, int b);
int multiply(int a, int b);

#endif
`,
      },
      {
        path: 'math_utils.c',
        name: 'math_utils.c',
        content: `#include "math_utils.h"

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}
`,
      },
      {
        path: 'main.c',
        name: 'main.c',
        content: `#include <stdio.h>
#include "math_utils.h"

int main(void) {
    printf("Multi-file C compilation demo\\n");
    int sum = add(15, 27);
    int prod = multiply(6, 7);
    
    printf("add(15, 27) = %d\\n", sum);
    printf("multiply(6, 7) = %d\\n", prod);
    return 0;
}
`,
      },
    ],
  },

  cpp: {
    id: 'cpp-multifile',
    title: 'C++ Multi-File (Class Header & Impl)',
    description: 'Object-oriented C++ with separate class declaration and main driver.',
    language: 'cpp',
    defaultEntry: 'main.cpp',
    files: [
      {
        path: 'Calculator.hpp',
        name: 'Calculator.hpp',
        content: `#pragma once
#include <string>

class Calculator {
public:
    Calculator(const std::string& name);
    int power(int base, int exp);
    void greet() const;
private:
    std::string m_name;
};
`,
      },
      {
        path: 'Calculator.cpp',
        name: 'Calculator.cpp',
        content: `#include "Calculator.hpp"
#include <iostream>

Calculator::Calculator(const std::string& name) : m_name(name) {}

int Calculator::power(int base, int exp) {
    int res = 1;
    for (int i = 0; i < exp; ++i) res *= base;
    return res;
}

void Calculator::greet() const {
    std::cout << "Greetings from " << m_name << "!" << std::endl;
}
`,
      },
      {
        path: 'main.cpp',
        name: 'main.cpp',
        content: `#include <iostream>
#include "Calculator.hpp"

int main() {
    Calculator calc("WasmMath Engine");
    calc.greet();

    int result = calc.power(2, 8);
    std::cout << "2^8 = " << result << std::endl;
    return 0;
}
`,
      },
    ],
  },

  java: {
    id: 'java-multifile',
    title: 'Java Multi-Class Project',
    description: 'Multiple Java source files compiled together.',
    language: 'java',
    defaultEntry: 'Main.java',
    files: [
      {
        path: 'Person.java',
        name: 'Person.java',
        content: `public class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void introduce() {
        System.out.println("Hello, my name is " + name + " and I am " + age + " years old.");
    }
}
`,
      },
      {
        path: 'Main.java',
        name: 'Main.java',
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println("=== Multi-file Java Demo ===");
        Person p1 = new Person("Alice", 28);
        Person p2 = new Person("Bob", 32);

        p1.introduce();
        p2.introduce();
    }
}
`,
      },
    ],
  },

  python: {
    id: 'python-multifile',
    title: 'Python Multi-Module',
    description: 'Custom module imported into main script using virtual filesystem.',
    language: 'python',
    defaultEntry: 'main.py',
    files: [
      {
        path: 'math_helper.py',
        name: 'math_helper.py',
        content: `def fibonacci(n):
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[-1] + fib[-2])
    return fib[:n]
`,
      },
      {
        path: 'main.py',
        name: 'main.py',
        content: `from math_helper import fibonacci

def main():
    print("=== Python Multi-File Demo ===")
    fib_series = fibonacci(10)
    print(f"First 10 Fibonacci numbers: {fib_series}")

if __name__ == "__main__":
    main()
`,
      },
    ],
  },

  javascript: {
    id: 'js-multifile',
    title: 'JavaScript Virtual Files',
    description: 'Reads multiple files from virtual project filesystem.',
    language: 'javascript',
    defaultEntry: 'index.js',
    files: [
      {
        path: 'config.json',
        name: 'config.json',
        content: `{
  "appName": "CodeSpace Web IDE",
  "version": "1.0.0",
  "mode": "Client-Side Wasm"
}
`,
      },
      {
        path: 'index.js',
        name: 'index.js',
        content: `console.log("Accessing virtual files in worker:");

const configRaw = files.get("config.json");
if (configRaw) {
  const config = JSON.parse(configRaw);
  console.log("App Name:", config.appName);
  console.log("Version:", config.version);
  console.log("Mode:", config.mode);
} else {
  console.log("config.json not found");
}
`,
      },
    ],
  },
}

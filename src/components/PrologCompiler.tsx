// PrologCompiler.tsx - Нова версия с swipl-wasm
import { useState, useEffect, useRef } from 'react';
import {
  Play,
  RefreshCw,
  CheckCircle,
  Terminal,
  FolderOpen,
  FileCode,
  Trash2
} from 'lucide-react';
import { useTheme } from "../context/ThemeContext";

// ==================== TYPES ====================
interface SWIPLQuery {
  once(): Record<string, any> | null;
  next(): Record<string, any> | null;
  close(): void;
}

interface PrologEngine {
  prolog: {
    query(query: string): SWIPLQuery;
  };
  FS?: {
    writeFile(path: string, data: string): void;
    readFile(path: string): { data: Uint8Array };
  };
  version?: string;
}

// ==================== SWI-Prolog WASM LOADER ====================
const loadPrologEngine = async (): Promise<PrologEngine> => {
  if ((window as any).__swipl) {
    return (window as any).__swipl;
  }

  try {
    // Динамичен импорт на swipl-wasm
    const SWIPL = (await import('swipl-wasm')).default;
    
    const swipl = await SWIPL({
      arguments: ['-q', '--no-signals'],
      locateFile: (path: string) => `/swipl/${path}`,
    });

    (window as any).__swipl = swipl;
    return swipl as unknown as PrologEngine;
  } catch (error) {
    console.error('Failed to load SWI-Prolog:', error);
    throw new Error('Could not initialize Prolog engine. Please check your connection.');
  }
};

// ==================== EXAMPLE PROGRAMS ====================
const EXAMPLES: Record<string, { name: string; description: string; code: string }> = {
  family: {
    name: 'Family Tree',
    description: 'Family relationships with rules',
    code: `% Family Tree
parent(alice, bob).
parent(alice, carol).
parent(bob, david).
parent(carol, emma).
parent(david, fiona).

male(bob).
male(david).
male(frank).
female(alice).
female(carol).
female(emma).
female(fiona).

father(X, Y) :- parent(X, Y), male(X).
mother(X, Y) :- parent(X, Y), female(X).
grandparent(X, Y) :- parent(X, Z), parent(Z, Y).
sibling(X, Y) :- parent(P, X), parent(P, Y), X \\= Y.
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).

% Query:
% ?- father(bob, david).
% ?- mother(alice, carol).
% ?- grandparent(alice, emma).
% ?- sibling(bob, carol).
% ?- ancestor(alice, fiona).`
  },
  lists: {
    name: 'List Operations',
    description: 'Working with lists in Prolog',
    code: `% List Operations
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).

member(X, [X|_]).
member(X, [_|T]) :- member(X, T).

reverse([], []).
reverse([H|T], R) :- reverse(T, R1), append(R1, [H], R).

length([], 0).
length([_|T], N) :- length(T, N1), N is N1 + 1.

% Query:
% ?- append([1,2], [3,4], X).
% ?- member(3, [1,2,3,4]).
% ?- reverse([a,b,c], X).
% ?- length([1,2,3,4], X).`
  },
  arithmetic: {
    name: 'Arithmetic',
    description: 'Math operations and predicates',
    code: `% Arithmetic
factorial(0, 1).
factorial(N, F) :- N > 0, N1 is N - 1, factorial(N1, F1), F is N * F1.

fibonacci(0, 0).
fibonacci(1, 1).
fibonacci(N, F) :- N > 1, N1 is N - 1, N2 is N - 2,
                   fibonacci(N1, F1), fibonacci(N2, F2), F is F1 + F2.

even(X) :- X mod 2 =:= 0.
odd(X) :- X mod 2 =:= 1.

sum(List, Sum) :- sum(List, 0, Sum).
sum([], Acc, Acc).
sum([H|T], Acc, Sum) :- NewAcc is Acc + H, sum(T, NewAcc, Sum).

% Query:
% ?- factorial(5, X).
% ?- fibonacci(10, X).
% ?- even(42).
% ?- sum([1,2,3,4,5], X).`
  },
  puzzles: {
    name: 'Logic Puzzles',
    description: 'Classic logic puzzle - Zebra puzzle',
    code: `% Zebra Puzzle (simplified)
% Colors: red, green, white, yellow, blue
% Nationalities: englishman, spaniard, ukrainian, norwegian, japanese
% Drinks: coffee, tea, milk, orange-juice, water
% Cigarettes: old-gold, kools, chesterfield, lucky-strike, parliament
% Pets: dog, snails, fox, horse, zebra

% Query:
% Who owns the zebra?`
  }
};

// ==================== MAIN COMPONENT ====================
export default function PrologCompiler() {
  const { theme } = useTheme();
  
  // ===== STATE =====
  const [code, setCode] = useState(EXAMPLES.family.code);
  const [output, setOutput] = useState<string[]>(['Welcome to Prolog Trinity v0.2.0']);
  const [isLoading, setIsLoading] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string>('family');
  const [_isQueryRunning, setIsQueryRunning] = useState(false);
  const [_hasNextSolution, setHasNextSolution] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PrologEngine | null>(null);
  const queryRef = useRef<SWIPLQuery | null>(null);

  // ===== THEME =====
  const themeClasses = {
    light: {
      background: "bg-gray-50",
      sidebar: "bg-white border-r border-gray-200",
      card: "bg-white border-gray-200",
      text: "text-gray-900",
      subtitle: "text-gray-600",
      border: "border-gray-200",
      editorBg: "bg-gray-50",
      outputBg: "bg-gray-100",
      hover: "hover:bg-gray-100",
      active: "bg-blue-50 text-blue-700",
      buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonSecondary: "bg-gray-200 hover:bg-gray-300 text-gray-700",
      buttonDanger: "bg-red-600 hover:bg-red-700 text-white",
    },
    dark: {
      background: "bg-gray-900",
      sidebar: "bg-gray-800 border-r border-gray-700",
      card: "bg-gray-800 border-gray-700",
      text: "text-gray-100",
      subtitle: "text-gray-400",
      border: "border-gray-700",
      editorBg: "bg-gray-900",
      outputBg: "bg-gray-800",
      hover: "hover:bg-gray-700",
      active: "bg-blue-900/40 text-blue-300",
      buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonSecondary: "bg-gray-700 hover:bg-gray-600 text-gray-200",
      buttonDanger: "bg-red-600 hover:bg-red-700 text-white",
    }
  };

  const currentTheme = themeClasses[theme];

  // ===== ENGINE INIT =====
  useEffect(() => {
    const initEngine = async () => {
      try {
        setOutput(prev => [...prev, '⏳ Loading Prolog engine...']);
        const engine = await loadPrologEngine();
        engineRef.current = engine;
        setIsEngineReady(true);
        setOutput(prev => [...prev, '✅ Prolog engine loaded successfully']);
        setOutput(prev => [...prev, 'ℹ️ Ready for queries. Type your code and press Run.']);
      } catch (err: any) {
        const msg = err.message || 'Failed to load Prolog engine';
        setOutput(prev => [...prev, `❌ ${msg}`]);
        console.error(err);
      }
    };

    initEngine();
  }, []);

  // ===== SCROLL TO OUTPUT =====
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // ===== PARSE QUERIES =====
  const parseQueries = (code: string): string[] => {
    console.log(parseQueries);
  const lines = code.split('\n');
  const queries: string[] = [];
  let inQuerySection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '% Query:') {
      inQuerySection = true;
      continue;
    }

    if (inQuerySection && trimmed) {
      // Skip comments
      if (trimmed.startsWith('%')) {
        continue;
      }

      let query = trimmed;

      // Remove Prolog top-level prompt "?-"
      if (query.startsWith('?-')) {
        query = query.substring(2).trim();
      }

      // Accept the query
      if (query) {
        queries.push(query);
      }
    }
  }

  return queries;
};

  // ===== CONSULT PROGRAM =====
  const consultProgram = async (program: string) => {
    if (!engineRef.current) {
      throw new Error('Prolog engine is not initialized.');
    }

    const engine = engineRef.current;

    if (!engine.FS) {
      throw new Error('SWI-Prolog virtual filesystem is not available.');
    }

    // Записваме програмата като .pl файл
    engine.FS.writeFile('/program.pl', program);

    // Консултираме файла
    const query = engine.prolog.query("consult('/program.pl').");
    
    try {
      const result = query.once();
      if (!result) {
        throw new Error('Could not consult /program.pl');
      }
      return result;
    } finally {
      query.close();
    }
  };

  // ===== RUN CODE =====
  const runCode = async () => {
  if (!isEngineReady || !engineRef.current) {
    setOutput(prev => [...prev, '❌ Prolog engine not ready. Please wait...']);
    return;
  }

  setIsLoading(true);
  setIsQueryRunning(true);
  setHasNextSolution(false);

  // Затваряме предишната заявка
  if (queryRef.current) {
    try {
      queryRef.current.close();
    } catch (e) {}

    queryRef.current = null;
  }

  try {
    // --------------------------------------------------
    // 1. Разделяме програмата и заявките
    // --------------------------------------------------

    const lines = code.split('\n');

    const programLines: string[] = [];
    const queries: string[] = [];

    let inQuerySection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Начало на Query секцията
      if (trimmed === '% Query:') {
        inQuerySection = true;
        continue;
      }

      if (inQuerySection) {
        if (!trimmed) {
          continue;
        }

        // Пропускаме коментари
        if (trimmed.startsWith('%')) {
          continue;
        }

        let query = trimmed;

        // Премахваме ?- ако потребителят го е написал
        if (query.startsWith('?-')) {
          query = query.substring(2).trim();
        }

        if (query) {
          queries.push(query);
        }

      } else {
        // Всичко преди % Query: е Prolog програмата
        programLines.push(line);
      }
    }

    const program = programLines.join('\n').trim();

    // --------------------------------------------------
    // 2. Проверяваме дали има програма
    // --------------------------------------------------

    if (!program) {
      setOutput(prev => [
        ...prev,
        '❌ No Prolog program found.'
      ]);

      return;
    }

    // --------------------------------------------------
    // 3. Проверяваме дали има заявка
    // --------------------------------------------------

    if (queries.length === 0) {
      setOutput(prev => [
        ...prev,
        'ℹ️ No query found. Add a query after % Query:'
      ]);

      return;
    }

    // --------------------------------------------------
    // 4. Зареждаме програмата в SWI-Prolog
    // --------------------------------------------------

    setOutput(prev => [
      ...prev,
      '📄 Loading Prolog program...'
    ]);

    await consultProgram(program);

    setOutput(prev => [
      ...prev,
      '✅ Prolog program loaded successfully'
    ]);

    // --------------------------------------------------
    // 5. Изпълняваме заявките
    // --------------------------------------------------

    for (const queryStr of queries) {

      setOutput(prev => [
        ...prev,
        `\n❓ ?- ${queryStr}`
      ]);

      try {

        const q = engineRef.current.prolog.query(queryStr);

        queryRef.current = q;

        // Първо решение
       const solution = q.once();

if (solution && typeof solution === 'object') {

  // SWI-WASM връща служебни полета като $tag и success.
  // Те не са Prolog променливи.
  const vars = Object.keys(solution).filter(
    key =>
      key !== '$tag' &&
      key !== 'success' &&
      key !== 'keys' &&
      !key.startsWith('_') &&
      typeof solution[key] !== 'function'
  );

  // Няма потребителски променливи → true/false
  if (vars.length === 0) {

    if (solution.success === true) {
      setOutput(prev => [
        ...prev,
        `  ✓ true`
      ]);
    } else {
      setOutput(prev => [
        ...prev,
        `  ✗ false`
      ]);
    }

  } else {

    const resultStr = vars
      .map(v => `${v} = ${solution[v]}`)
      .join(', ');

    setOutput(prev => [
      ...prev,
      `  ✓ ${resultStr}`
    ]);
  }

} else {

  setOutput(prev => [
    ...prev,
    `  ✗ false`
  ]);
}

      } catch (err: any) {

        setOutput(prev => [
          ...prev,
          `  ❌ Error: ${err.message || 'Query failed'}`
        ]);

      }
    }

  } catch (err: any) {

    setOutput(prev => [
      ...prev,
      `❌ ${err.message || 'Unexpected error'}`
    ]);

  } finally {

    setIsLoading(false);
    setIsQueryRunning(false);

    if (queryRef.current) {
      try {
        queryRef.current.close();
      } catch (e) {}

      queryRef.current = null;
    }
  }
};

  // ===== CLEAR OUTPUT =====
  const clearOutput = () => {
    setOutput(['Output cleared. Ready for new code.']);
    setHasNextSolution(false);
    if (queryRef.current) {
      try {
        queryRef.current.close();
      } catch (e) {}
      queryRef.current = null;
    }
  };

  // ===== LOAD EXAMPLE =====
  const loadExample = (key: string) => {
    setSelectedExample(key);
    setCode(EXAMPLES[key].code);
    clearOutput();
  };

  // ===== RENDER =====
  return (
    <div className={`h-screen flex pt-28 ${currentTheme.background} ${currentTheme.text}`}>
      {/* Sidebar */}
      <div className={`w-64 flex-shrink-0 ${currentTheme.sidebar} overflow-y-auto`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">IDEAS</span>
            <span className="text-xs opacity-60">v0.2.0</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            {isEngineReady ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="w-3 h-3" /> SWI-Prolog Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-500">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
              </span>
            )}
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            <FolderOpen className="w-4 h-4" />
            EXAMPLES
          </div>
          {Object.entries(EXAMPLES).map(([key, example]) => (
            <button
              key={key}
              onClick={() => loadExample(key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                selectedExample === key 
                  ? currentTheme.active 
                  : `${currentTheme.hover} ${currentTheme.text}`
              }`}
            >
              <FileCode className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{example.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${currentTheme.border} ${currentTheme.card}`}>
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Prolog Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearOutput}
              className={`p-2 rounded-lg text-sm transition-colors ${currentTheme.buttonSecondary}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={runCode}
              disabled={isLoading || !isEngineReady}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${currentTheme.buttonPrimary}`}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex min-h-0">
          {/* Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className={`flex-1 p-4 ${currentTheme.editorBg} overflow-hidden`}>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-full p-4 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border ${currentTheme.border} ${currentTheme.editorBg} ${currentTheme.text}`}
                spellCheck={false}
                style={{ tabSize: 2, lineHeight: '1.6' }}
              />
            </div>
          </div>

          {/* Output */}
          <div className={`w-96 flex-shrink-0 flex flex-col border-l ${currentTheme.border}`}>
            <div className={`p-2 border-b ${currentTheme.border} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span className="font-medium text-sm">Terminal</span>
              </div>
            </div>
            <div 
              ref={outputRef}
              className={`flex-1 p-3 overflow-y-auto font-mono text-sm ${currentTheme.outputBg}`}
              style={{ lineHeight: '1.8' }}
            >
              {output.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
              {isLoading && (
                <div className="text-gray-400 animate-pulse">⏳ Processing...</div>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className={`flex items-center justify-between px-4 py-1 border-t ${currentTheme.border} ${currentTheme.card} text-xs`}>
          <div className="flex items-center gap-4">
            {isEngineReady ? (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCircle className="w-3 h-3" /> Prolog Engine Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-500">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading Engine...
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>{code.split('\n').length} lines</span>
          </div>
        </div>
      </div>
    </div>
  );
}
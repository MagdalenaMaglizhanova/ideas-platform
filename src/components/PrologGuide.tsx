import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, Database, Brain, GitBranch,
  Variable, Terminal, BookOpen, Lightbulb,
  CheckCircle, Copy,
  ExternalLink, Info, ChevronRight, 
  Book, Layers, Cpu, Server, Puzzle,
  Network, GanttChartSquare,
  Blocks, Workflow
} from 'lucide-react';
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface CodeExample {
  id: number;
  title: string;
  description: string;
  code: string;
  explanation: string;
  tags: string[];
}

interface TutorialSection {
  id: number;
  title: string;
  icon: React.ReactNode;
  content: string;
  examples: string[];
}

export default function PrologGuide() {
  const { theme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('basics');
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
console.log(currentLanguage)
  // Theme classes
  const themeClasses = {
    light: {
      background: "bg-gradient-to-b from-gray-50 to-white",
      card: "bg-white border-gray-200",
      text: "text-gray-900",
      subtitle: "text-gray-600",
      hover: "hover:bg-gray-100",
      code: "bg-gray-900 text-gray-100",
      tag: "bg-blue-100 text-blue-700"
    },
    dark: {
      background: "bg-gradient-to-b from-gray-900 to-gray-800",
      card: "bg-gray-800 border-gray-700",
      text: "text-white",
      subtitle: "text-gray-300",
      hover: "hover:bg-gray-700",
      code: "bg-gray-900 text-gray-100",
      tag: "bg-blue-900/50 text-blue-300"
    }
  };

  const currentTheme = themeClasses[theme];

  // Interesting Prolog code examples
  const codeExamples: CodeExample[] = [
    {
      id: 1,
      title: "Family Tree with Complex Relationships",
      description: "Modeling family relationships with advanced rules",
      code: `% Facts - Define basic family relationships
parent(alice, bob).
parent(alice, carol).
parent(bob, david).
parent(bob, emma).
parent(carol, frank).
parent(david, grace).

male(bob).
male(david).
male(frank).
female(alice).
female(carol).
female(emma).
female(grace).

% Rules for family relationships
father(X, Y) :- parent(X, Y), male(X).
mother(X, Y) :- parent(X, Y), female(X).

sibling(X, Y) :- 
    parent(P, X), 
    parent(P, Y), 
    X \= Y.

brother(X, Y) :- sibling(X, Y), male(X).
sister(X, Y) :- sibling(X, Y), female(X).

uncle(X, Y) :-
    parent(P, Y),
    brother(X, P).

aunt(X, Y) :-
    parent(P, Y),
    sister(X, P).

cousin(X, Y) :-
    parent(P1, X),
    parent(P2, Y),
    sibling(P1, P2).

% Complex query example
% ?- uncle(X, grace).        % Find all uncles of Grace
% ?- cousin(alice, Y).       % Find all cousins of Alice
% ?- findall(X, parent(alice, X), Children).  % List all children of Alice`,
      explanation: "This example demonstrates a complete family relationship system. Facts define the basic parent-child relationships and genders. Rules then build upon these facts to derive complex relationships like siblings, aunts/uncles, and cousins. The X \= Y condition prevents a person from being their own sibling. This showcases Prolog's power in representing and querying hierarchical data structures.",
      tags: ["relationships", "rules", "queries", "family-tree"]
    },
    {
      id: 2,
      title: "Graph Path Finding",
      description: "Finding paths in a directed graph with cycle detection",
      code: `% Define a graph as a set of edges
edge(a, b).
edge(a, c).
edge(b, d).
edge(b, e).
edge(c, f).
edge(c, g).
edge(d, h).
edge(e, i).
edge(f, j).
edge(g, k).

% Simple path finding (without cycle detection)
path(X, Y) :- edge(X, Y).
path(X, Y) :- edge(X, Z), path(Z, Y).

% Path finding with cycle detection
safe_path(X, Y) :- safe_path(X, Y, [X]).

safe_path(X, Y, _) :- edge(X, Y).
safe_path(X, Y, Visited) :-
    edge(X, Z),
    not(member(Z, Visited)),  % Prevent cycles
    safe_path(Z, Y, [Z|Visited]).

% Find all paths between two nodes
all_paths(X, Y, Path) :-
    find_path(X, Y, [X], Path).

find_path(X, X, Path, Path).
find_path(X, Y, Visited, Path) :-
    edge(X, Z),
    not(member(Z, Visited)),
    find_path(Z, Y, [Z|Visited], Path).

% Check if graph has cycles
has_cycle :-
    edge(X, Y),
    path(Y, X).

% Example queries:
% ?- path(a, h).              % Check if path exists from a to h
% ?- all_paths(a, k, Path).   % Find all paths from a to k
% ?- has_cycle.                % Check if graph contains cycles`,
      explanation: "This example implements graph traversal algorithms. The basic path/2 predicate finds connections but can get stuck in cycles. The safe_path/3 uses an accumulator list 'Visited' to track visited nodes and prevent infinite loops. The all_paths/3 predicate finds every possible path between two nodes using depth-first search. The has_cycle/0 predicate demonstrates how Prolog can analyze graph properties by checking if any node can reach itself through a path.",
      tags: ["graphs", "algorithms", "recursion", "DFS"]
    },
    {
      id: 3,
      title: "Arithmetic and List Processing",
      description: "Mathematical operations on lists with constraints",
      code: `% List arithmetic operations
sum_list([], 0).
sum_list([H|T], Sum) :-
    sum_list(T, TailSum),
    Sum is H + TailSum.

product_list([], 1).
product_list([H|T], Product) :-
    product_list(T, TailProd),
    Product is H * TailProd.

% Find minimum and maximum
min_list([H|T], Min) :- min_list(T, H, Min).
min_list([], Min, Min).
min_list([H|T], CurrentMin, Min) :-
    H < CurrentMin,
    min_list(T, H, Min).
min_list([H|T], CurrentMin, Min) :-
    H >= CurrentMin,
    min_list(T, CurrentMin, Min).

max_list([H|T], Max) :- max_list(T, H, Max).
max_list([], Max, Max).
max_list([H|T], CurrentMax, Max) :-
    H > CurrentMax,
    max_list(T, H, Max).
max_list([H|T], CurrentMax, Max) :-
    H =< CurrentMax,
    max_list(T, CurrentMax, Max).

% Filter even numbers
even_numbers([], []).
even_numbers([H|T], [H|Evens]) :-
    H mod 2 =:= 0,
    even_numbers(T, Evens).
even_numbers([H|T], Evens) :-
    H mod 2 =:= 1,
    even_numbers(T, Evens).

% Quick sort implementation
quick_sort([], []).
quick_sort([Pivot|Tail], Sorted) :-
    partition(Pivot, Tail, Less, Greater),
    quick_sort(Less, SortedLess),
    quick_sort(Greater, SortedGreater),
    append(SortedLess, [Pivot|SortedGreater], Sorted).

partition(_, [], [], []).
partition(Pivot, [H|T], [H|Less], Greater) :-
    H =< Pivot,
    partition(Pivot, T, Less, Greater).
partition(Pivot, [H|T], Less, [H|Greater]) :-
    H > Pivot,
    partition(Pivot, T, Less, Greater).

% Example queries:
% ?- sum_list([1,2,3,4,5], X).        % X = 15
% ?- even_numbers([1,2,3,4,5,6], E).  % E = [2,4,6]
% ?- quick_sort([3,1,4,1,5,9,2], S).  % S = [1,1,2,3,4,5,9]`,
      explanation: "This example showcases Prolog's capabilities in numerical computing and list processing. The arithmetic predicates use 'is' for evaluation, unlike unification (=). The min/max implementations demonstrate accumulator patterns and multiple clauses for different conditions. Quick sort illustrates Prolog's elegant recursive solutions - the partition/4 predicate splits lists based on a pivot value, and the main predicate recursively sorts the partitions. The even_numbers/2 shows how to filter lists using conditional logic.",
      tags: ["arithmetic", "lists", "sorting", "recursion"]
    },
    {
      id: 4,
      title: "Expert System - Medical Diagnosis",
      description: "Simple expert system for symptom-based diagnosis",
      code: `% Symptoms database
symptom(patient1, fever).
symptom(patient1, cough).
symptom(patient1, fatigue).
symptom(patient2, headache).
symptom(patient2, nausea).
symptom(patient3, fever).
symptom(patient3, rash).
symptom(patient3, joint_pain).

% Disease definitions with required symptoms
disease(flu, [fever, cough, fatigue, body_ache]).
disease(cold, [runny_nose, sneezing, sore_throat, cough]).
disease(covid, [fever, dry_cough, fatigue, loss_of_taste]).
disease(measles, [fever, rash, cough, conjunctivitis]).
disease(migraine, [headache, nausea, sensitivity_to_light]).
disease(arthritis, [joint_pain, stiffness, swelling]).

% Diagnosis rule - check if patient has at least N symptoms of a disease
has_disease(Patient, Disease, Threshold) :-
    disease(Disease, RequiredSymptoms),
    findall(Symptom, (symptom(Patient, Symptom), member(Symptom, RequiredSymptoms)), MatchedSymptoms),
    length(RequiredSymptoms, TotalNeeded),
    length(MatchedSymptoms, MatchedCount),
    MatchedCount >= Threshold,
    MatchPercentage is (MatchedCount * 100) // TotalNeeded.

% Find possible diagnoses for a patient
possible_diagnoses(Patient, Diagnoses) :-
    findall(Disease-Percentage, 
            (has_disease(Patient, Disease, 2), 
             has_disease(Patient, Disease, 2, Percentage)), 
            Diagnoses).

% Calculate match percentage
has_disease(Patient, Disease, MinSymptoms, Percentage) :-
    disease(Disease, RequiredSymptoms),
    findall(Symptom, (symptom(Patient, Symptom), member(Symptom, RequiredSymptoms)), MatchedSymptoms),
    length(RequiredSymptoms, Total),
    length(MatchedSymptoms, Matched),
    Matched >= MinSymptoms,
    Percentage is (Matched * 100) // Total.

% Suggest additional tests
suggest_tests(Patient, Tests) :-
    findall(Test, 
            (disease(_, RequiredSymptoms),
             symptom(Patient, Symptom),
             member(Symptom, RequiredSymptoms),
             disease(_, [Test|_]),
             not(symptom(Patient, Test))), 
            Tests).

% Example queries:
% ?- has_disease(patient1, flu, 2, P).           % Check if patient1 has flu (P = 75)
% ?- possible_diagnoses(patient3, Diagnoses).    % Find all possible diagnoses
% ?- suggest_tests(patient1, Tests).             % Get suggested tests`,
      explanation: "This expert system demonstrates Prolog's applications in AI and knowledge representation. The disease/2 predicates define knowledge base of conditions and their symptoms. The has_disease/4 predicate calculates match percentages by finding intersection of patient symptoms and required symptoms. The system uses findall/3 to collect matching symptoms and perform set operations. This shows how Prolog can implement rule-based reasoning and handle uncertainty through percentage matching, similar to real medical expert systems.",
      tags: ["AI", "expert-system", "knowledge-base", "reasoning"]
    },
    {
      id: 5,
      title: "Constraint Satisfaction - Sudoku Solver",
      description: "Solve Sudoku puzzles using constraint logic",
      code: `% Sudoku solver using backtracking
sudoku(Puzzle, Solution) :-
    Solution = Puzzle,
    rows(Solution),
    columns(Solution),
    boxes(Solution).

% Define valid rows (all digits 1-9 with no repeats)
rows([]).
rows([Row|Rows]) :-
    valid_row(Row),
    rows(Rows).

valid_row(Row) :-
    fd_domain(Row, 1, 9),
    fd_all_different(Row).

% Get columns from rows
columns(Solution) :-
    transpose(Solution, Columns),
    rows(Columns).

% Define 3x3 boxes
boxes(Solution) :-
    boxes(Solution, 1, 1).

boxes(_, 9, _) :- !.
boxes(Solution, Row, Col) :-
    get_box(Solution, Row, Col, Box),
    valid_row(Box),
    next_cell(Row, Col, NextRow, NextCol),
    boxes(Solution, NextRow, NextCol).

% Extract a 3x3 box
get_box(Solution, Row, Col, Box) :-
    R1 is Row, R2 is Row + 1, R3 is Row + 2,
    C1 is Col, C2 is Col + 1, C3 is Col + 2,
    nth1(R1, Solution, Row1),
    nth1(R2, Solution, Row2),
    nth1(R3, Solution, Row3),
    nth1(C1, Row1, A), nth1(C2, Row1, B), nth1(C3, Row1, C),
    nth1(C1, Row2, D), nth1(C2, Row2, E), nth1(C3, Row2, F),
    nth1(C1, Row3, G), nth1(C2, Row3, H), nth1(C3, Row3, I),
    Box = [A, B, C, D, E, F, G, H, I].

% Helper to move to next cell
next_cell(7, _, 1, 1) :- !.
next_cell(Row, 7, Row, 1) :- !.
next_cell(Row, Col, Row, NextCol) :-
    NextCol is Col + 3.

% Transpose matrix
transpose([], []).
transpose([[]|_], []).
transpose(Matrix, [Row|Rows]) :-
    first_row(Matrix, Row, RestMatrix),
    transpose(RestMatrix, Rows).

first_row([], [], []).
first_row([[H|T]|Rows], [H|Hs], [T|Ts]) :-
    first_row(Rows, Hs, Ts).

% Pretty print solution
print_sudoku([]).
print_sudoku([Row|Rows]) :-
    write(Row), nl,
    print_sudoku(Rows).

% Example puzzle (0 represents empty cell)
example_puzzle([
    [5,3,0, 0,7,0, 0,0,0],
    [6,0,0, 1,9,5, 0,0,0],
    [0,9,8, 0,0,0, 0,6,0],
    
    [8,0,0, 0,6,0, 0,0,3],
    [4,0,0, 8,0,3, 0,0,1],
    [7,0,0, 0,2,0, 0,0,6],
    
    [0,6,0, 0,0,0, 2,8,0],
    [0,0,0, 4,1,9, 0,0,5],
    [0,0,0, 0,8,0, 0,7,9]
]).

% Solve the puzzle:
% ?- example_puzzle(P), sudoku(P, Solution), print_sudoku(Solution).`,
      explanation: "This Sudoku solver demonstrates Prolog's power in constraint satisfaction problems. The solution uses generate-and-test with backtracking: it defines constraints (rows, columns, and 3x3 boxes must contain unique digits 1-9) and lets Prolog's inference engine find valid combinations. The fd_domain and fd_all_different are finite domain constraints that dramatically reduce the search space. The boxes/2 predicate extracts all nine 3x3 subgrids, and transpose/2 handles column constraints elegantly. This showcases how Prolog naturally expresses combinatorial search problems.",
      tags: ["constraints", "backtracking", "puzzles", "logic"]
    },
    {
      id: 6,
      title: "Natural Language Processing",
      description: "Simple grammar parser for English sentences",
      code: `% Define parts of speech
noun(man).
noun(woman).
noun(dog).
noun(cat).
noun(boy).
noun(girl).
noun(ball).
noun(book).

verb(loves).
verb(hates).
verb(sees).
verb(knows).
verb(chases).
verb(reads).

determiner(the).
determiner(a).

adjective(happy).
adjective(sad).
adjective(big).
adjective(small).
adjective(red).
adjective(blue).

% Grammar rules
sentence(S) :-
    noun_phrase(NP),
    verb_phrase(VP),
    append(NP, VP, S).

noun_phrase(NP) :-
    determiner(D),
    noun(N),
    append([D], [N], NP).

noun_phrase(NP) :-
    determiner(D),
    adjective(Adj),
    noun(N),
    append([D, Adj], [N], NP).

noun_phrase(NP) :-
    noun(N),
    NP = [N].

verb_phrase(VP) :-
    verb(V),
    noun_phrase(NP),
    append([V], NP, VP).

verb_phrase(VP) :-
    verb(V),
    VP = [V].

% Parse a sentence into its structure
parse(Sentence, Structure) :-
    sentence(Sentence),
    build_tree(Sentence, Structure).

build_tree([D, N], np(det(D), noun(N))) :-
    determiner(D), noun(N).

build_tree([D, Adj, N], np(det(D), adj(Adj), noun(N))) :-
    determiner(D), adjective(Adj), noun(N).

build_tree([V, NP], vp(verb(V), np(NP))) :-
    verb(V).

% Generate all valid sentences
all_sentences(S) :-
    findall(S, sentence(S), All),
    list_to_set(All, UniqueSentences),
    member(S, UniqueSentences).

% Check if sentence is grammatically correct
correct_sentence(S) :-
    sentence(S),
    write('✓ Valid sentence: '), write(S), nl.

% Example queries:
% ?- sentence([the, man, loves, the, woman]).     % true
% ?- parse([the, happy, boy, reads, a, book], T). % T = vp(verb(reads), np(det(a), noun(book)))
% ?- all_sentences(S).                             % Generate all valid sentences`,
      explanation: "This natural language processing example shows Prolog's applications in computational linguistics. The grammar is defined using definite clause grammar (DCG) style - noun phrases combine determiners, adjectives, and nouns; verb phrases combine verbs with objects. The parser can both validate sentences and generate grammatical ones. The build_tree/2 predicate creates a parse tree showing the syntactic structure. This demonstrates how Prolog's unification makes it ideal for language processing - the same rules work for both parsing and generation due to the bidirectional nature of Prolog predicates.",
      tags: ["NLP", "grammar", "parsing", "linguistics"]
    }
  ];

  // Tutorial sections
  const tutorials: TutorialSection[] = [
    {
      id: 1,
      title: "Program Structure",
      icon: <Layers className="w-5 h-5" />,
      content: "Every Prolog program consists of facts, rules, and queries. Facts are unconditional truths, rules define logical relationships, and queries ask questions. Prolog's execution model is based on resolution and unification.",
      examples: [
        "Facts end with a period (.) and represent ground truths",
        "Rules use :- as 'if', with head on left and body on right",
        "Queries start with ?- and trigger Prolog's inference engine",
        "Variables (uppercase) unify with values during execution"
      ]
    },
    {
      id: 2,
      title: "Unification and Variables",
      icon: <Variable className="w-5 h-5" />,
      content: "Unification is Prolog's core operation - it tries to make two terms identical by binding variables. Unlike assignment in other languages, unification is symmetric and bidirectional.",
      examples: [
        "Two constants unify only if they're identical",
        "A variable unifies with any term, becoming instantiated",
        "Anonymous variable _ matches anything but forgets the binding",
        "Occurs check prevents infinite terms (X = f(X))"
      ]
    },
    {
      id: 3,
      title: "Backtracking and Search",
      icon: <GitBranch className="w-5 h-5" />,
      content: "Prolog uses depth-first search with chronological backtracking. When a goal fails, Prolog returns to the last choice point and tries alternative clauses or solutions.",
      examples: [
        "Multiple clauses for the same predicate create choice points",
        "Use ; after a solution to trigger backtracking",
        "Cut (!) prunes the search tree, preventing backtracking",
        "fail/0 forces failure, triggering backtracking"
      ]
    },
    {
      id: 4,
      title: "Recursion in Prolog",
      icon: <Network className="w-5 h-5" />,
      content: "Recursion is fundamental in Prolog - most list processing and graph traversal algorithms use recursive predicates. Always define base cases before recursive cases.",
      examples: [
        "Base case terminates recursion (typically empty list)",
        "Recursive case reduces problem size",
        "Tail recursion optimization improves performance",
        "Accumulators can make recursion more efficient"
      ]
    },
    {
      id: 5,
      title: "Lists and Data Structures",
      icon: <Blocks className="w-5 h-5" />,
      content: "Lists are Prolog's primary data structure, written as [Head|Tail]. They can contain any terms and are processed recursively. Prolog also supports complex terms for structured data.",
      examples: [
        "[H|T] decomposes list into head and tail",
        "[] is the empty list",
        "Lists can contain variables, atoms, or complex terms",
        "Member/2, append/3 are fundamental list predicates"
      ]
    },
    {
      id: 6,
      title: "Advanced Techniques",
      icon: <Workflow className="w-5 h-5" />,
      content: "Prolog supports meta-programming, constraint logic programming, and defeasible reasoning. These advanced features make Prolog suitable for AI and expert systems.",
      examples: [
        "findall/3, bagof/3, setof/3 collect solutions",
        "assert/1 and retract/1 modify database dynamically",
        "CLP(FD) for constraint solving",
        "call/N for higher-order programming"
      ]
    }
  ];

  // Learning resources
  const learningResources = [
    {
      title: "SWI-Prolog Documentation",
      description: "Official documentation and manual",
      icon: <BookOpen className="w-5 h-5" />,
      url: "https://www.swi-prolog.org/pldoc/doc_for?object=manual",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Learn Prolog Now!",
      description: "Free online textbook",
      icon: <Book className="w-5 h-5" />,
      url: "http://www.learnprolognow.org/",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "SWISH Online IDE",
      description: "Run Prolog in browser",
      icon: <Cpu className="w-5 h-5" />,
      url: "https://swish.swi-prolog.org/",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Prolog Problems",
      description: "99 Prolog problems",
      icon: <Puzzle className="w-5 h-5" />,
      url: "https://www.ic.unicamp.br/~meidanis/courses/mc336/2009s2/prolog/problemas/",
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "Advent of Code",
      description: "Solve puzzles in Prolog",
      icon: <GanttChartSquare className="w-5 h-5" />,
      url: "https://adventofcode.com/",
      color: "from-red-500 to-rose-500"
    },
    {
      title: "GitHub Examples",
      description: "Open source Prolog projects",
      icon: <Code className="w-5 h-5" />,
      url: "https://github.com/topics/prolog",
      color: "from-indigo-500 to-blue-500"
    }
  ];

  // Copy code to clipboard
  const copyToClipboard = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`min-h-screen pt-20 ${currentTheme.background}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' 
                : 'bg-gradient-to-br from-blue-100 to-cyan-100'
            }`}>
              <Brain className={`w-8 h-8 ${
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Prolog Guide
              </h1>
              <p className={`text-lg mt-2 ${currentTheme.subtitle}`}>
                {t?.('prolog_guide_subtitle') || "Master Logic Programming Through Interactive Examples"}
              </p>
            </div>
          </div>
          
          <p className={`text-xl max-w-3xl mx-auto ${currentTheme.subtitle}`}>
            {t?.('prolog_guide_description') || "Prolog is a logic programming language associated with artificial intelligence and computational linguistics. This comprehensive guide covers fundamental concepts through practical, real-world examples."}
          </p>
        </motion.div>

        {/* Navigation tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { id: 'basics', label: t?.('tab_basics') || "Basics", icon: <BookOpen className="w-4 h-4" /> },
            { id: 'examples', label: t?.('tab_examples') || "Examples", icon: <Code className="w-4 h-4" /> },
            { id: 'tutorials', label: t?.('tab_tutorials') || "Tutorials", icon: <Lightbulb className="w-4 h-4" /> },
            { id: 'resources', label: t?.('tab_resources') || "Resources", icon: <ExternalLink className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : `${currentTheme.hover} ${currentTheme.subtitle}`
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'basics' && (
            <motion.div
              key="basics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: <Database className="w-8 h-8" />,
                  title: "Facts",
                  description: "Facts are unconditional truths in your knowledge base. They form the foundation of Prolog programs.",
                  points: [
                    "Always end with a period (.)",
                    "Use lowercase for predicate names",
                    "Can have multiple arguments (arity)",
                    "Represent relationships or properties"
                  ]
                },
                {
                  icon: <Server className="w-8 h-8" />,
                  title: "Rules",
                  description: "Rules define logical implications. They consist of a head and a body, separated by :- (if).",
                  points: [
                    "Head :- Body syntax",
                    "Body contains goals (subqueries)",
                    "Comma (,) means logical AND",
                    "Semicolon (;) means logical OR"
                  ]
                },
                {
                  icon: <Terminal className="w-8 h-8" />,
                  title: "Queries",
                  description: "Queries ask questions about your knowledge base. Prolog attempts to prove them true through resolution.",
                  points: [
                    "Interactive prompt: ?-",
                    "Variables start with uppercase",
                    "Press ; for multiple solutions",
                    "false means no proof exists"
                  ]
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-6 border ${currentTheme.card} backdrop-blur-sm`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    theme === 'dark' 
                      ? 'bg-blue-500/20' 
                      : 'bg-blue-100'
                  }`}>
                    <div className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className={`mb-4 ${currentTheme.subtitle}`}>{item.description}</p>
                  <ul className="space-y-2">
                    {item.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          theme === 'dark' ? 'text-green-400' : 'text-green-600'
                        }`} />
                        <span className={currentTheme.subtitle}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'examples' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {codeExamples.map((example) => (
                <div
                  key={example.id}
                  className={`rounded-2xl border overflow-hidden ${currentTheme.card}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            theme === 'dark' 
                              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20' 
                              : 'bg-gradient-to-r from-blue-100 to-cyan-100'
                          }`}>
                            <Code className={`w-5 h-5 ${
                              theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{example.title}</h3>
                            <p className={currentTheme.subtitle}>{example.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {example.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${currentTheme.tag}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(example.code, example.id)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                          theme === 'dark' 
                            ? 'hover:bg-white/10' 
                            : 'hover:bg-gray-100'
                        } transition-colors`}
                      >
                        {copiedCode === example.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                              Copied!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <div className={`rounded-xl overflow-hidden ${currentTheme.code}`}>
                          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-sm text-gray-400">example.pl</span>
                          </div>
                          <pre className="p-4 overflow-x-auto text-sm">
                            <code>{example.code}</code>
                          </pre>
                        </div>
                      </div>

                      <div>
                        <div className={`p-6 rounded-xl ${
                          theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                        }`}>
                          <div className="flex items-center gap-3 mb-4">
                            <Info className={`w-5 h-5 ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                            <h4 className="font-bold">Explanation</h4>
                          </div>
                          <p className={currentTheme.subtitle}>{example.explanation}</p>
                          
                          <div className={`mt-6 p-4 rounded-lg ${
                            theme === 'dark' ? 'bg-white/5' : 'bg-white'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Terminal className={`w-4 h-4 ${
                                theme === 'dark' ? 'text-green-400' : 'text-green-600'
                              }`} />
                              <span className="font-medium">Try it yourself:</span>
                            </div>
                            <ol className="space-y-2 text-sm">
                              <li className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3" />
                                <span>Save code as <code className="px-1 py-0.5 rounded bg-black/20">example.pl</code></span>
                              </li>
                              <li className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3" />
                                <span>Start Prolog: <code className="px-1 py-0.5 rounded bg-black/20">swipl</code></span>
                              </li>
                              <li className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3" />
                                <span>Load file: <code className="px-1 py-0.5 rounded bg-black/20">['example.pl'].</code></span>
                              </li>
                              <li className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3" />
                                <span>Run the example queries shown below</span>
                              </li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'tutorials' && (
            <motion.div
              key="tutorials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {tutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className={`rounded-2xl p-6 border ${currentTheme.card}`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20' 
                        : 'bg-gradient-to-r from-purple-100 to-pink-100'
                    }`}>
                      <div className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}>
                        {tutorial.icon}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{tutorial.title}</h3>
                      <p className={`text-lg ${currentTheme.subtitle}`}>{tutorial.content}</p>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className={`w-5 h-5 ${
                        theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
                      }`} />
                      <h4 className="font-bold">Key Concepts</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tutorial.examples.map((example, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            theme === 'dark' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            <span className="text-xs font-bold">{idx + 1}</span>
                          </div>
                          <p className={currentTheme.subtitle}>{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {learningResources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-2xl p-6 border ${currentTheme.card} ${currentTheme.hover} transition-all duration-300`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-r ${resource.color}`}>
                    <div className="text-white">
                      {resource.icon}
                    </div>
                  </div>
                  <h4 className="font-bold mb-2 group-hover:text-blue-500 transition-colors">
                    {resource.title}
                  </h4>
                  <p className={`text-sm mb-4 ${currentTheme.subtitle}`}>
                    {resource.description}
                  </p>
                  <div className="flex items-center gap-2 text-blue-500">
                    <span className="text-sm font-medium">Visit</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
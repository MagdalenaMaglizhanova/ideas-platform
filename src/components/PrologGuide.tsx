import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, Database, Brain, GitBranch,
  Variable, Hash, Terminal, BookOpen, Lightbulb,
  CheckCircle, ArrowRight, Copy, Play, Download,
  ExternalLink, Info, ChevronRight, Zap,
  Book, Layers, Cpu, Server, Package,
  MessageSquare, Video, HelpCircle, Users,
  Globe, Wifi, Shield, Rocket, Trophy,
  Search, Filter, Sliders
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

  // Теематчни класове
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

  // Примерен код на Prolog
  const codeExamples: CodeExample[] = [
    {
      id: 1,
      title: t?.('prolog_basics_title') || "Основи на Prolog",
      description: t?.('prolog_basics_desc') || "Факти и правила в Prolog",
      code: `% Факти - декларативни твърдения
parent(john, mary).
parent(mary, ann).
parent(john, tom).

% Правила - логически заключения
grandparent(X, Z) :-
    parent(X, Y),
    parent(Y, Z).

% Заявки в конзолата
% ?- parent(john, mary).      → true
% ?- grandparent(john, ann).  → true`,
      explanation: t?.('prolog_basics_expl') || "Facts represent true statements. Rules define relationships between facts. Queries ask questions about the knowledge base.",
      tags: ["basics", "facts", "rules"]
    },
    {
      id: 2,
      title: t?.('prolog_recursion_title') || "Рекурсия в Prolog",
      description: t?.('prolog_recursion_desc') || "Рекурсивни правила за обхождане",
      code: `% Рекурсивно дефиниране на предшественик
ancestor(X, Y) :-
    parent(X, Y).

ancestor(X, Y) :-
    parent(X, Z),
    ancestor(Z, Y).

% Факти за семейно дърво
parent(adam, cain).
parent(adam, abel).
parent(adam, seth).
parent(seth, enos).

% Примерни заявки
% ?- ancestor(adam, enos).    → true
% ?- ancestor(X, enos).       → X = seth, X = adam`,
      explanation: t?.('prolog_recursion_expl') || "Recursion is essential in Prolog. The ancestor rule calls itself to find indirect relationships.",
      tags: ["recursion", "logic"]
    },
    {
      id: 3,
      title: t?.('prolog_lists_title') || "Работа със списъци",
      description: t?.('prolog_lists_desc') || "Манипулиране на списъци в Prolog",
      code: `% Дефиниране на списък
% [Head|Tail] - стандартна нотация

% Проверка за член на списък
member(X, [X|_]).
member(X, [_|Tail]) :-
    member(X, Tail).

% Конкатенация на списъци
append([], L, L).
append([H|T], L, [H|R]) :-
    append(T, L, R).

% Обръщане на списък
reverse([], []).
reverse([H|T], R) :-
    reverse(T, RevT),
    append(RevT, [H], R).

% Примерна употреба
% ?- member(3, [1,2,3,4]).   → true
% ?- reverse([1,2,3], X).    → X = [3,2,1]`,
      explanation: t?.('prolog_lists_expl') || "Lists are fundamental data structures in Prolog. They use head-tail notation for recursive processing.",
      tags: ["lists", "data-structures"]
    }
  ];

  // Уроци и наръчници
  const tutorials: TutorialSection[] = [
    {
      id: 1,
      title: t?.('tutorial_structure_title') || "Структура на програма",
      icon: <Layers className="w-5 h-5" />,
      content: t?.('tutorial_structure_content') || "Every Prolog program consists of three main parts: facts, rules, and queries. Facts are unconditional truths, rules define logical relationships, and queries ask questions.",
      examples: [
        t?.('tutorial_structure_ex1') || "Start with simple facts about your domain",
        t?.('tutorial_structure_ex2') || "Define rules that connect facts logically",
        t?.('tutorial_structure_ex3') || "Write queries to test your knowledge base",
        t?.('tutorial_structure_ex4') || "Use comments (%) to document your code"
      ]
    },
    {
      id: 2,
      title: t?.('tutorial_variables_title') || "Променливи и унификация",
      icon: <Variable className="w-5 h-5" />,
      content: t?.('tutorial_variables_content') || "Variables in Prolog start with uppercase letters. Unification is the process of matching variables with values. This is how Prolog finds solutions to queries.",
      examples: [
        t?.('tutorial_variables_ex1') || "Variables unify with any term",
        t?.('tutorial_variables_ex2') || "Anonymous variable _ matches anything once",
        t?.('tutorial_variables_ex3') || "Use same variable to require same value",
        t?.('tutorial_variables_ex4') || "Variables become instantiated during execution"
      ]
    },
    {
      id: 3,
      title: t?.('tutorial_backtracking_title') || "Backtracking и търсене",
      icon: <GitBranch className="w-5 h-5" />,
      content: t?.('tutorial_backtracking_content') || "Prolog uses depth-first search with backtracking. When a goal fails, Prolog goes back to the last choice point and tries alternative solutions.",
      examples: [
        t?.('tutorial_backtracking_ex1') || "Multiple solutions are found one by one",
        t?.('tutorial_backtracking_ex2') || "Use semicolon (;) to find all solutions",
        t?.('tutorial_backtracking_ex3') || "Cut (!) prevents backtracking",
        t?.('tutorial_backtracking_ex4') || "fail forces backtracking"
      ]
    }
  ];

  // Ресурси за учене
  const learningResources = [
    {
      title: "SWI-Prolog Documentation",
      description: "Официална документация",
      icon: <BookOpen className="w-5 h-5" />,
      url: "https://www.swi-prolog.org/pldoc/doc_for?object=manual",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Learn Prolog Now!",
      description: "Безплатен онлайн учебник",
      icon: <Book className="w-5 h-5" />,
      url: "http://www.learnprolognow.org/",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Prolog Visualizer",
      description: "Визуализация на изпълнението",
      icon: <Cpu className="w-5 h-5" />,
      url: "https://pengines.swi-prolog.org/apps/swish/",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Prolog Examples",
      description: "Колекция от примери",
      icon: <Code className="w-5 h-5" />,
      url: "https://github.com/klaussinani/prolog-examples",
      color: "from-amber-500 to-orange-500"
    }
  ];

  // Копиране на код
  const copyToClipboard = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`min-h-screen pt-20 ${currentTheme.background}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero секция */}
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
                {t?.('prolog_guide_subtitle') || "Learn logic programming with interactive examples"}
              </p>
            </div>
          </div>
          
          <p className={`text-xl max-w-3xl mx-auto ${currentTheme.subtitle}`}>
            {t?.('prolog_guide_description') || "Prolog is a logic programming language associated with artificial intelligence and computational linguistics. This guide will help you master Prolog programming through practical examples and tutorials."}
          </p>
        </motion.div>

        {/* Навигационни табове */}
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

        {/* Съдържание според активния таб */}
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
                  title: t?.('basics_facts_title') || "Facts",
                  description: t?.('basics_facts_desc') || "Facts are true statements about the world. They form the foundation of your knowledge base.",
                  points: [
                    t?.('basics_facts_p1') || "End with a period (.)",
                    t?.('basics_facts_p2') || "Use lowercase for predicates",
                    t?.('basics_facts_p3') || "Can have multiple arguments",
                    t?.('basics_facts_p4') || "Represent relationships"
                  ]
                },
                {
                  icon: <Server className="w-8 h-8" />,
                  title: t?.('basics_rules_title') || "Rules",
                  description: t?.('basics_rules_desc') || "Rules define logical relationships between facts. They consist of a head and body.",
                  points: [
                    t?.('basics_rules_p1') || "Head :- Body syntax",
                    t?.('basics_rules_p2') || "Body contains goals",
                    t?.('basics_rules_p3') || "Comma (,) means AND",
                    t?.('basics_rules_p4') || "Semicolon (;) means OR"
                  ]
                },
                {
                  icon: <Terminal className="w-8 h-8" />,
                  title: t?.('basics_queries_title') || "Queries",
                  description: t?.('basics_queries_desc') || "Queries ask questions about your knowledge base. Prolog tries to prove them true.",
                  points: [
                    t?.('basics_queries_p1') || "Start with ?- prompt",
                    t?.('basics_queries_p2') || "Variables start uppercase",
                    t?.('basics_queries_p3') || "Get multiple solutions",
                    t?.('basics_queries_p4') || "Use backtracking"
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
                                <span>Run queries from the examples</span>
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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

        {/* Quick Tips секция */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`mt-16 p-8 rounded-2xl border ${currentTheme.card}`}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20' 
                : 'bg-gradient-to-r from-green-100 to-emerald-100'
            }`}>
              <Zap className={`w-6 h-6 ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
              }`} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {t?.('quick_tips_title') || "Quick Tips for Beginners"}
              </h3>
              <p className={currentTheme.subtitle}>
                {t?.('quick_tips_subtitle') || "Essential advice to get started with Prolog"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                tip: t?.('tip_1') || "Start with simple facts before complex rules",
                icon: "🎯"
              },
              {
                tip: t?.('tip_2') || "Use meaningful predicate names",
                icon: "📝"
              },
              {
                tip: t?.('tip_3') || "Test each rule independently",
                icon: "🧪"
              },
              {
                tip: t?.('tip_4') || "Read error messages carefully",
                icon: "⚠️"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className={currentTheme.subtitle}>{item.tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
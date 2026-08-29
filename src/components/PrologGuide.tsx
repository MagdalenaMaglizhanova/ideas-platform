import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  BookOpen, Lightbulb,
  ExternalLink, 
  Book,  Cpu, Puzzle,
  GanttChartSquare,
  Link2
} from 'lucide-react';
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";



export default function PrologGuide() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('tutorials');

  // Theme classes - подобрен контраст за светлата тема
  const themeClasses = {
    light: {
      background: "bg-gray-50",
      card: "bg-white border-gray-200 shadow-sm",
      cardHover: "hover:shadow-md transition-shadow",
      text: "text-gray-900",
      textSecondary: "text-gray-700",
      subtitle: "text-gray-600",
      hover: "hover:bg-gray-100",
      code: "bg-gray-900 text-gray-100",
      codeBg: "bg-gray-900",
      tag: "bg-blue-100 text-blue-700",
      tabInactive: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      tableHeader: "bg-gray-100",
      tableBorder: "border-gray-300",
      border: "border-gray-200",
      cardBg: "bg-white",
      muted: "text-gray-500",
      buttonSecondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      link: "text-blue-600 hover:text-blue-800",
    },
    dark: {
      background: "bg-gray-900",
      card: "bg-gray-800 border-gray-700",
      cardHover: "hover:border-gray-600 transition-colors",
      text: "text-white",
      textSecondary: "text-gray-300",
      subtitle: "text-gray-300",
      hover: "hover:bg-gray-700",
      code: "bg-gray-900 text-gray-100",
      codeBg: "bg-gray-900",
      tag: "bg-blue-900/50 text-blue-300",
      tabInactive: "bg-gray-700 text-gray-300 hover:bg-gray-600",
      tableHeader: "bg-gray-700",
      tableBorder: "border-gray-700",
      border: "border-gray-700",
      cardBg: "bg-gray-800",
      muted: "text-gray-400",
      buttonSecondary: "bg-gray-700 text-gray-200 hover:bg-gray-600",
      link: "text-blue-400 hover:text-blue-300",
    }
  };

  const currentTheme = themeClasses[theme];

  // Learning resources
  // Learning resources
const learningResources = [
  // --- Интерактивни инструменти за логика (от Logica) ---
  {
    title: "Logica - Logic Tools Suite",
    description: "Collection of interactive logic tools: Truth Tables, Proof Editors, Unifier & more",
    icon: <Lightbulb className="w-5 h-5" />,
    url: "http://logic.stanford.edu/logica/homepage/index.php",
    color: "from-amber-500 to-orange-500",
    category: "Interactive Tools"
  },
  // --- Основни Prolog ресурси ---
  {
    title: "SWI-Prolog Documentation",
    description: "Official documentation and manual",
    icon: <BookOpen className="w-5 h-5" />,
    url: "https://www.swi-prolog.org/pldoc/doc_for?object=manual",
    color: "from-blue-500 to-cyan-500",
    category: "Documentation"
  },
  {
    title: "Learn Prolog Now!",
    description: "Free online textbook",
    icon: <Book className="w-5 h-5" />,
    url: "http://www.learnprolognow.org/",
    color: "from-green-500 to-emerald-500",
    category: "Tutorials"
  },
  // --- Онлайн среди за изпълнение ---
  {
    title: "SWISH Online IDE",
    description: "Run Prolog in browser",
    icon: <Cpu className="w-5 h-5" />,
    url: "https://swish.swi-prolog.org/",
    color: "from-purple-500 to-pink-500",
    category: "Online Tools"
  },
  // --- Задачи и предизвикателства ---
  {
    title: "Prolog Problems",
    description: "99 Prolog problems",
    icon: <Puzzle className="w-5 h-5" />,
    url: "https://www.ic.unicamp.br/~meidanis/courses/mc336/2009s2/prolog/problemas/",
    color: "from-amber-500 to-orange-500",
    category: "Exercises"
  },
  {
    title: "Advent of Code",
    description: "Solve puzzles in Prolog",
    icon: <GanttChartSquare className="w-5 h-5" />,
    url: "https://adventofcode.com/",
    color: "from-red-500 to-rose-500",
    category: "Exercises"
  },
  // --- Примери и проекти ---
  {
    title: "GitHub Examples",
    description: "Open source Prolog projects",
    icon: <Code className="w-5 h-5" />,
    url: "https://github.com/topics/prolog",
    color: "from-indigo-500 to-blue-500",
    category: "Code"
  }
];

  // Interactive Question component
  const InteractiveQuestion = ({ question, answer }: { question: string; answer: string }) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const handleCheck = (option: string) => {
      setSelected(option);
      setIsCorrect(option === answer);
    };

    const options = ["Yes", "No"];

    return (
      <div className={`mt-4 p-4 rounded-lg border ${currentTheme.card} ${currentTheme.cardHover}`}>
        <p className={`font-medium mb-3 ${currentTheme.text}`}>{question}</p>
        <div className="flex flex-wrap gap-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleCheck(option)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selected === option
                  ? isCorrect
                    ? 'border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'border-red-500 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : `${currentTheme.buttonSecondary} ${currentTheme.card}`
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {selected && (
          <p className={`mt-3 text-sm font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isCorrect ? '✅ Correct!' : `❌ Incorrect. The correct answer is "${answer}".`}
          </p>
        )}
      </div>
    );
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
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Prolog Guide
              </h1>
              <p className={`text-lg mt-2 ${currentTheme.subtitle}`}>
                {t?.('prolog_guide_subtitle') || "Master Logic Programming Through Interactive Examples"}
              </p>
            </div>
          </div>
          
          <p className={`text-xl max-w-3xl mx-auto ${currentTheme.textSecondary}`}>
            {t?.('prolog_guide_description') || "Prolog is a logic programming language associated with artificial intelligence and computational linguistics. This comprehensive guide covers fundamental concepts through practical, real-world examples."}
          </p>
        </motion.div>

        {/* Navigation tabs - removed "Tutorials" tab, renamed "Basics" to "Tutorials" */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { id: 'tutorials', label: "Tutorials", icon: <BookOpen className="w-4 h-4" /> },
            { id: 'examples', label: "Examples", icon: <Code className="w-4 h-4" /> },
            { id: 'resources', label: "Resources", icon: <ExternalLink className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : `${currentTheme.tabInactive} ${currentTheme.text}`
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'tutorials' && (
            <motion.div
              key="tutorials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className={`text-center p-8 rounded-2xl border ${currentTheme.card} ${currentTheme.cardHover} mb-8`}>
                <h2 className={`text-3xl font-bold mb-4 ${currentTheme.text}`}>Introduction to Logic Programming</h2>
                <p className={`text-lg ${currentTheme.textSecondary}`}>
                  This structured course will guide you through the fundamental concepts of logic programming and Prolog.
                  Each lesson combines theory with practical exercises.
                </p>
              </div>

              <div className="space-y-6">
                {/* Lesson 1: Logical Relationships */}
                <div className={`rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.cardHover}`}>
                  <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${
                    theme === 'dark' ? 'from-blue-900/30 to-cyan-900/30' : 'from-blue-50 to-cyan-50'
                  }`}>
                    <h3 className={`text-2xl font-bold flex items-center gap-3 ${currentTheme.text}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        1
                      </span>
                      Logical Relationships
                    </h3>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className={`font-semibold flex items-center gap-2 mb-3 ${currentTheme.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'}`}></span>
                        Lessons & Videos
                      </h4>
                      <ul className="space-y-2 pl-4">
                        {[
                          { label: "Introduction to Facts", link: "/prolog-guide/lesson/1/1" },
                          { label: "How to Read Truth Tables", link: "/prolog-guide/lesson/1/2" },
                          { label: "Formalizing Statements", link: "/prolog-guide/lesson/1/3" },
                          { label: "Checking Truth Values", link: "/prolog-guide/lesson/1/4" }
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {idx + 1}.{idx + 1}
                            </span>
                            <a 
                              href={item.link}
                              className={`${currentTheme.link} transition-colors flex items-center gap-1`}
                              onClick={(e) => e.preventDefault()}
                            >
                              {item.label}
                              <Link2 className="w-3 h-3 opacity-50" />
                            </a>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                              theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                            }`}>
                              Video
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                      <div>
                        <h4 className={`font-semibold flex items-center gap-2 mb-2 text-sm ${currentTheme.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}></span>
                          Extra
                        </h4>
                        <ul className="space-y-1 pl-4">
                          {[
                            { label: "Why 'likes' is not symmetric", link: "/prolog-guide/extra/symmetry" },
                            { label: "Difference between facts and rules", link: "/prolog-guide/extra/facts-vs-rules" },
                            { label: "Representing relationships in logic", link: "/prolog-guide/extra/relationships" }
                          ].map((item, idx) => (
                            <li key={idx} className={`text-sm flex items-center gap-2 ${currentTheme.textSecondary}`}>
                              <span className="text-xs">•</span>
                              <a 
                                href={item.link}
                                className={`${currentTheme.link} transition-colors flex items-center gap-1`}
                                onClick={(e) => e.preventDefault()}
                              >
                                {item.label}
                                <Link2 className="w-3 h-3 opacity-50" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className={`font-semibold flex items-center gap-2 mb-2 text-sm ${currentTheme.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}></span>
                          Puzzle
                        </h4>
                        <ul className="space-y-1 pl-4">
                          <li className={`text-sm flex items-center gap-2 ${currentTheme.textSecondary}`}>
                            <span className="text-xs">•</span>
                            <a 
                              href="/prolog-guide/puzzle/likes"
                              className={`${currentTheme.link} transition-colors flex items-center gap-1`}
                              onClick={(e) => e.preventDefault()}
                            >
                              Who likes everyone else?
                              <Link2 className="w-3 h-3 opacity-50" />
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson 2: Prolog Fundamentals */}
                <div className={`rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.cardHover}`}>
                  <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${
                    theme === 'dark' ? 'from-purple-900/30 to-pink-900/30' : 'from-purple-50 to-pink-50'
                  }`}>
                    <h3 className={`text-2xl font-bold flex items-center gap-3 ${currentTheme.text}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        theme === 'dark' ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white'
                      }`}>
                        2
                      </span>
                      Prolog Fundamentals
                    </h3>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className={`font-semibold flex items-center gap-2 mb-3 ${currentTheme.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-600'}`}></span>
                        Lessons & Videos
                      </h4>
                      <ul className="space-y-2 pl-4">
                        {[
                          { label: "Facts and Rules", link: "/prolog-guide/lesson/2/1" },
                          { label: "Unification", link: "/prolog-guide/lesson/2/2" },
                          { label: "Backtracking", link: "/prolog-guide/lesson/2/3" },
                          { label: "Lists and Recursion", link: "/prolog-guide/lesson/2/4" },
                          { label: "Built-in Predicates", link: "/prolog-guide/lesson/2/5" }
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-sm">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {idx + 1}.{idx + 1}
                            </span>
                            <a 
                              href={item.link}
                              className={`${currentTheme.link} transition-colors flex items-center gap-1`}
                              onClick={(e) => e.preventDefault()}
                            >
                              {item.label}
                              <Link2 className="w-3 h-3 opacity-50" />
                            </a>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
                              theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                            }`}>
                              Video
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                      <div>
                        <h4 className={`font-semibold flex items-center gap-2 mb-2 text-sm ${currentTheme.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}></span>
                          Extra
                        </h4>
                        <ul className="space-y-1 pl-4">
                          {[
                            { label: "SWI-Prolog Installation Guide", link: "/prolog-guide/extra/install" },
                            { label: "Debugging Tips", link: "/prolog-guide/extra/debugging" },
                            { label: "Common Pitfalls", link: "/prolog-guide/extra/pitfalls" }
                          ].map((item, idx) => (
                            <li key={idx} className={`text-sm flex items-center gap-2 ${currentTheme.textSecondary}`}>
                              <span className="text-xs">•</span>
                              <a 
                                href={item.link}
                                className={`${currentTheme.link} transition-colors flex items-center gap-1`}
                                onClick={(e) => e.preventDefault()}
                              >
                                {item.label}
                                <Link2 className="w-3 h-3 opacity-50" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className={`font-semibold flex items-center gap-2 mb-2 text-sm ${currentTheme.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}></span>
                          Puzzle
                        </h4>
                        <ul className="space-y-1 pl-4">
                          <li className={`text-sm flex items-center gap-2 ${currentTheme.textSecondary}`}>
                            <span className="text-xs">•</span>
                            <a 
                              href="/prolog-guide/puzzle/family"
                              className={`${currentTheme.link} transition-colors flex items-center gap-1`}
                              onClick={(e) => e.preventDefault()}
                            >
                              Find all siblings of David
                              <Link2 className="w-3 h-3 opacity-50" />
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`text-center p-6 rounded-2xl border ${currentTheme.card} ${currentTheme.cardHover}`}>
                  <p className={currentTheme.textSecondary}>
                    More lessons and advanced topics coming soon. Stay tuned!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'examples' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Exercise 1.1: The Sorority */}
              <div className={`rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.cardHover}`}>
                <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${
                  theme === 'dark' ? 'from-blue-900/30 to-cyan-900/30' : 'from-blue-50 to-cyan-50'
                }`}>
                  <h3 className={`text-2xl font-bold flex items-center gap-3 ${currentTheme.text}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      1
                    </span>
                    Exercise 1.1: The Sorority
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <p className={`text-lg ${currentTheme.textSecondary}`}>
                    Meet the four members of a small sorority - Abby, Bess, Cody, and Dana. 
                    The binary relationship is "likes". The table below shows who likes whom. 
                    A check (✓) means the girl in the row likes the girl in the column.
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className={`${currentTheme.tableHeader}`}>
                          <th className={`border p-2 text-left ${currentTheme.tableBorder} ${currentTheme.text}`}>Likes</th>
                          <th className={`border p-2 text-center ${currentTheme.tableBorder} ${currentTheme.text}`}>Abby</th>
                          <th className={`border p-2 text-center ${currentTheme.tableBorder} ${currentTheme.text}`}>Bess</th>
                          <th className={`border p-2 text-center ${currentTheme.tableBorder} ${currentTheme.text}`}>Cody</th>
                          <th className={`border p-2 text-center ${currentTheme.tableBorder} ${currentTheme.text}`}>Dana</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Abby", data: ["", "✓", "✓", ""] },
                          { name: "Bess", data: ["", "", "", "✓"] },
                          { name: "Cody", data: ["✓", "", "", "✓"] },
                          { name: "Dana", data: ["", "✓", "✓", ""] }
                        ].map((row) => (
                          <tr key={row.name} className={`${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className={`border p-2 font-medium ${currentTheme.tableBorder} ${currentTheme.text}`}>{row.name}</td>
                            {row.data.map((cell, idx) => (
                              <td key={idx} className={`border p-2 text-center text-lg ${currentTheme.tableBorder} ${currentTheme.text}`}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <p className={`font-medium mb-3 ${currentTheme.textSecondary}`}>Facts represented in logic:</p>
                    <div className={`p-3 rounded-lg font-mono text-sm ${currentTheme.codeBg} text-gray-100`}>
                      {[
                        "likes(abby, bess).",
                        "likes(abby, cody).",
                        "likes(bess, dana).",
                        "likes(cody, abby).",
                        "likes(cody, dana).",
                        "likes(dana, bess).",
                        "likes(dana, cody)."
                      ].map((fact, idx) => (
                        <div key={idx}>{fact}</div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <InteractiveQuestion question="Abby likes Dana" answer="No" />
                    <InteractiveQuestion question="Cody likes Abby" answer="Yes" />
                    <InteractiveQuestion question="Bess likes herself" answer="No" />
                    <InteractiveQuestion question="Dana likes Bess and Cody" answer="Yes" />
                  </div>
                </div>
              </div>

              {/* Exercise 2.1: Family Tree */}
              <div className={`rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.cardHover}`}>
                <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${
                  theme === 'dark' ? 'from-purple-900/30 to-pink-900/30' : 'from-purple-50 to-pink-50'
                }`}>
                  <h3 className={`text-2xl font-bold flex items-center gap-3 ${currentTheme.text}`}>
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      theme === 'dark' ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white'
                    }`}>
                      2
                    </span>
                    Exercise 2.1: Family Tree
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <p className={`text-lg ${currentTheme.textSecondary}`}>
                    Consider the following family relationships:
                  </p>
                  
                  <div className={`p-3 rounded-lg font-mono text-sm ${currentTheme.codeBg} text-gray-100`}>
                    {[
                      "parent(alice, bob).",
                      "parent(alice, carol).",
                      "parent(bob, david).",
                      "parent(carol, emma).",
                      "male(bob).",
                      "male(david).",
                      "female(alice).",
                      "female(carol).",
                      "female(emma)."
                    ].map((fact, idx) => (
                      <div key={idx}>{fact}</div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <InteractiveQuestion question="Bob is a parent of David" answer="Yes" />
                    <InteractiveQuestion question="Alice is a parent of Carol" answer="Yes" />
                    <InteractiveQuestion question="Emma is male" answer="No" />
                    <InteractiveQuestion question="Carol is a parent of Emma" answer="Yes" />
                  </div>
                </div>
              </div>
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
                  className={`group rounded-2xl p-6 border ${currentTheme.card} ${currentTheme.cardHover} transition-all duration-300`}
                >
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-r ${resource.color}`}>
                    <div className="text-white">
                      {resource.icon}
                    </div>
                  </div>
                  <h4 className={`font-bold mb-2 group-hover:text-blue-500 transition-colors ${currentTheme.text}`}>
                    {resource.title}
                  </h4>
                  <p className={`text-sm mb-4 ${currentTheme.textSecondary}`}>
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
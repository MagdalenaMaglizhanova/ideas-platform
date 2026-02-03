import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { 
  BookOpen, 
  GraduationCap, 
  Brain, 
  Database, 
  Layers, 
  Search, 
  Filter, 
  Play, 
  CheckCircle, 
  ChevronRight,
  Clock, 
  Tag, 
  Book, 
  FileText, 
  Code, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Bookmark,
  Grid,
  List,
  Bolt,
  Video,
  Circle,
  Sparkle,
  Loader2
} from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  icon: string;
  color: string;
  lessonsCount: number;
  duration: string;
  completed: boolean;
}

interface Lesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  type: "video" | "article" | "exercise" | "quiz";
}

// Демо урок за Prolog
const prologDemoLesson: Lesson = {
  id: "prolog-kb-structure",
  topicId: "prolog",
  title: "Structuring a Prolog Knowledge Base",
  description: "Learn how to properly structure a Prolog knowledge base using the amphibians domain as an example.",
  duration: "15 min",
  completed: false,
  type: "article"
};

// Демо тема за Prolog с урока
const prologDemoTopic: Topic = {
  id: "prolog-kb",
  title: "Structuring a Prolog Knowledge Base",
  description: "Learn how to properly structure a Prolog knowledge base using the amphibians domain as an example.",
  category: "prolog",
  difficulty: "beginner",
  icon: "Code",
  color: "#9D4EDD",
  lessonsCount: 1,
  duration: "15 min",
  completed: false
};

export default function LessonPlanner() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"topics" | "lessons">("topics");
  const [showAllTopics, setShowAllTopics] = useState(!category);
  const { theme } = useTheme();
  const { t } = useLanguage();

  const categories = [
    { 
      id: "prolog", 
      name: t('prolog_programming') || "Prolog Programming", 
      icon: Code, 
      color: "#667eea",
      gradient: "from-blue-500 to-indigo-600"
    },
    { 
      id: "ai", 
      name: t('artificial_intelligence') || "Artificial Intelligence", 
      icon: Brain, 
      color: "#FF6B8B",
      gradient: "from-pink-500 to-rose-600"
    },
    { 
      id: "databases", 
      name: t('databases') || "Databases", 
      icon: Database, 
      color: "#36D1DC",
      gradient: "from-cyan-500 to-teal-500"
    },
    { 
      id: "algorithms", 
      name: t('algorithms') || "Algorithms", 
      icon: Layers, 
      color: "#FFD166",
      gradient: "from-yellow-500 to-amber-500"
    },
    { 
      id: "logic", 
      name: t('logic_programming') || "Logic Programming", 
      icon: Sparkles, 
      color: "#9D4EDD",
      gradient: "from-purple-500 to-violet-600"
    },
  ];

  // Зареждане на теми от базата данни
  useEffect(() => {
    async function loadTopics() {
      setIsLoading(true);
      try {
        let topicsData: Topic[] = [];
        
        // Ако сме в категория Prolog, добавяме демо темата
        if (category === "prolog") {
          topicsData = [prologDemoTopic];
        } else if (category) {
          const q = query(collection(db, "topics"), where("category", "==", category));
          const snapshot = await getDocs(q);
          topicsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Topic));
        } else {
          const q = collection(db, "topics");
          const snapshot = await getDocs(q);
          topicsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Topic));
          
          // Добавяме демо темата само ако не съществува
          if (!topicsData.some(t => t.id === "prolog-kb")) {
            topicsData.push(prologDemoTopic);
          }
        }
        
        setTopics(topicsData);
        
        // Ако има категория, задаваме първата тема като избрана
        if (category && topicsData.length > 0) {
          setSelectedTopic(topicsData[0]);
        }
      } catch (err) {
        console.error("Failed to load topics:", err);
        // При грешка все пак показваме демо темата за Prolog
        if (category === "prolog") {
          setTopics([prologDemoTopic]);
          setSelectedTopic(prologDemoTopic);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadTopics();
  }, [category]);

  // Зареждане на уроци за избраната тема
  useEffect(() => {
    async function loadLessons() {
      if (!selectedTopic) return;

      try {
        let lessonsData: Lesson[] = [];
        
        // Ако избраната тема е демо темата за Prolog, добавяме демо урока
        if (selectedTopic.id === "prolog-kb") {
          lessonsData = [prologDemoLesson];
        } else {
          const q = query(collection(db, "lessons"), where("topicId", "==", selectedTopic.id));
          const snapshot = await getDocs(q);
          lessonsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Lesson));
        }
        
        setLessons(lessonsData);
      } catch (err) {
        console.error("Failed to load lessons:", err);
        // При грешка за демо темата показваме демо урока
        if (selectedTopic.id === "prolog-kb") {
          setLessons([prologDemoLesson]);
        }
      }
    }
    loadLessons();
  }, [selectedTopic]);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setActiveTab("lessons");
  };

  const handleStartLesson = (lesson: Lesson) => {
    if (lesson.id === "prolog-kb-structure" && selectedTopic?.id === "prolog-kb") {
      navigate(`/topics/prolog/lessons/prolog-kb-structure`);
    } else {
      navigate(`/topics/${selectedTopic?.category}/lessons/${lesson.id}`);
    }
  };

  const handleStartTopic = (topic: Topic) => {
    if (topic.id === "prolog-kb") {
      setSelectedTopic(topic);
      setActiveTab("lessons");
    } else {
      setSelectedTopic(topic);
      setActiveTab("lessons");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "#10b981";
      case "intermediate": return "#f59e0b";
      case "advanced": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "article": return FileText;
      case "exercise": return Code;
      case "quiz": return HelpCircle;
      default: return Circle;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-red-500/20 text-red-400";
      case "article": return "bg-blue-500/20 text-blue-400";
      case "exercise": return "bg-green-500/20 text-green-400";
      case "quiz": return "bg-purple-500/20 text-purple-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const filteredTopics = showAllTopics 
    ? topics 
    : topics.filter(topic => !category || topic.category === category);

  const completedTopics = topics.filter(t => t.completed).length;
  const completedLessons = lessons.filter(l => l.completed).length;
  const totalLessons = lessons.length;
  const progressPercentage = Math.round((completedLessons / Math.max(totalLessons, 1)) * 100);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-900 via-indigo-900/20 to-gray-900' 
            : 'bg-gradient-to-br from-gray-50 via-indigo-50/20 to-gray-50'
        }`} />
        
        {/* Animated shapes */}
        <motion.div
          className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full ${
            theme === 'dark' 
              ? 'bg-indigo-500/10' 
              : 'bg-indigo-400/10'
          } blur-3xl`}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full ${
            theme === 'dark' 
              ? 'bg-purple-500/10' 
              : 'bg-purple-400/10'
          } blur-3xl`}
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex pt-20">
        {/* 🔹 САЙДБАР С КАТЕГОРИИ */}
        <aside className={`w-64 lg:w-80 min-h-screen p-6 border-r ${
          theme === 'dark' 
            ? 'bg-gray-800/50 backdrop-blur-xl border-gray-700' 
            : 'bg-white/80 backdrop-blur-xl border-gray-200'
        }`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="h-full"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    : 'bg-gradient-to-br from-indigo-400 to-purple-400'
                }`}>
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('learning_topics') || "Learning Topics"}
                  </h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('explore_materials') || "Explore educational materials"}
                  </p>
                </div>
              </div>
            </div>

            {/* Categories Section */}
            <div className="mb-8">
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Layers className="w-4 h-4" />
                {t('categories') || "Categories"}
              </h3>
              <div className="space-y-2">
                <Link 
                  to="/topics" 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    !category 
                      ? theme === 'dark' 
                        ? 'bg-indigo-500/20 border border-indigo-500/30 text-white' 
                        : 'bg-indigo-100 border border-indigo-200 text-indigo-700'
                      : theme === 'dark'
                        ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                  onClick={() => setShowAllTopics(true)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    !category 
                      ? 'bg-indigo-500 text-white'
                      : theme === 'dark' 
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Grid className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t('all_topics') || "All Topics"}</span>
                </Link>
                
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.id}
                      to={`/topics/${cat.id}`}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        category === cat.id
                          ? theme === 'dark' 
                            ? 'bg-indigo-500/20 border border-indigo-500/30 text-white' 
                            : 'bg-indigo-100 border border-indigo-200 text-indigo-700'
                          : theme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                      onClick={() => setShowAllTopics(false)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center`}
                           style={{ backgroundColor: cat.color }}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{cat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Progress Section */}
            <div className={`p-4 rounded-2xl mb-6 ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10'
                : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <TrendingUp className="w-4 h-4" />
                {t('learning_progress') || "Learning Progress"}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {completedTopics}/{topics.length}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('topics_completed') || "Topics Completed"}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {completedLessons}/{totalLessons}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('lessons_completed') || "Lessons Completed"}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className={`w-full h-2 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {progressPercentage}% {t('complete') || "Complete"}
                  </span>
                  <span className={`text-xs font-medium ${
                    progressPercentage >= 80 ? 'text-green-500' :
                    progressPercentage >= 50 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {progressPercentage >= 80 ? '🎉 Excellent' :
                     progressPercentage >= 50 ? '👍 Good' :
                     '💪 Keep going'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            {category === "prolog" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`p-4 rounded-2xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20'
                    : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200'
                }`}
              >
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Bolt className="w-4 h-4 text-purple-500" />
                  {t('quick_access') || "Quick Access"}
                </h3>
                <button
                  onClick={() => {
                    setSelectedTopic(prologDemoTopic);
                    setActiveTab("lessons");
                  }}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <Code className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-sm">Prolog KB Structure</h4>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Jump to the lesson
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </aside>

        {/* 🔹 ОСНОВНО СЪДЪРЖАНИЕ */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <BookOpen className="w-8 h-8" />
                    {category 
                      ? categories.find(c => c.id === category)?.name || t('topics') || "Topics"
                      : t('all_learning_topics') || "All Learning Topics"}
                  </h1>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {category 
                      ? t('explore_category_topics') || `Explore ${categories.find(c => c.id === category)?.name} topics`
                      : t('browse_all_topics') || "Browse all available learning topics"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`relative flex-1 lg:flex-none ${
                    theme === 'dark' ? 'lg:w-64' : 'lg:w-72'
                  }`}>
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input 
                      type="text" 
                      placeholder={t('search_topics') || "Search topics..."}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                      } transition-all outline-none`}
                    />
                  </div>
                  <button className={`p-2.5 rounded-xl flex items-center gap-2 ${
                    theme === 'dark'
                      ? 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-800'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}>
                    <Filter className="w-5 h-5" />
                    <span className="hidden lg:inline">{t('filter') || "Filter"}</span>
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab("topics")}
                  className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    activeTab === "topics"
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                      : theme === 'dark'
                        ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                  {t('all_topics') || "All Topics"} ({filteredTopics.length})
                </button>
                <button
                  onClick={() => setActiveTab("lessons")}
                  disabled={!selectedTopic}
                  className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
                    activeTab === "lessons"
                      ? theme === 'dark'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                      : theme === 'dark'
                        ? 'bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <List className="w-5 h-5" />
                  {t('lessons') || "Lessons"} {selectedTopic && `(${lessons.length})`}
                </button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {activeTab === "topics" ? (
                <motion.div
                  key="topics"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {isLoading ? (
                    <div className="col-span-full py-20 text-center">
                      <div className="inline-flex items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          {t('loading_topics') || "Loading topics..."}
                        </span>
                      </div>
                    </div>
                  ) : filteredTopics.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      }`}>
                        <Book className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('no_topics_found') || "No topics found"}
                      </h3>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('no_topics_for_category') || "There are no topics available for this category yet."}
                      </p>
                    </div>
                  ) : (
                    filteredTopics.map((topic, index) => (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-2xl p-6 transition-all cursor-pointer ${
                          selectedTopic?.id === topic.id
                            ? theme === 'dark'
                              ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/50'
                              : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-500/50'
                            : theme === 'dark'
                              ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                              : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
                        }`}
                        onClick={() => handleTopicSelect(topic)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: topic.color }}
                          >
                            {topic.icon === "Code" ? <Code className="w-6 h-6 text-white" /> :
                             topic.icon === "Brain" ? <Brain className="w-6 h-6 text-white" /> :
                             topic.icon === "Database" ? <Database className="w-6 h-6 text-white" /> :
                             topic.icon === "Layers" ? <Layers className="w-6 h-6 text-white" /> :
                             <BookOpen className="w-6 h-6 text-white" />}
                          </div>
                          <div className="flex gap-2">
                            <span 
                              className="px-3 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getDifficultyColor(topic.difficulty) }}
                            >
                              {topic.difficulty}
                            </span>
                            {topic.completed && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {t('completed') || "Completed"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mb-6">
                          <h3 className={`font-bold text-lg mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {topic.title}
                          </h3>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {topic.description}
                          </p>
                        </div>

                        <div className={`flex items-center gap-4 mb-6 pb-6 border-b ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Book className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {topic.lessonsCount} {topic.lessonsCount === 1 ? t('lesson') || 'lesson' : t('lessons') || 'lessons'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {topic.duration}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {topic.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTopic(topic);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                              topic.completed
                                ? theme === 'dark'
                                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                : theme === 'dark'
                                  ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            } transition-colors`}
                          >
                            {topic.completed ? t('review') || "Review" : t('start_learning') || "Start Learning"}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <Link 
                            to={`/chat?topic=${topic.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`p-2 rounded-lg ${
                              theme === 'dark'
                                ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } transition-colors`}
                            title={t('ask_ai_about_topic') || "Ask AI about this topic"}
                          >
                            <Sparkles className="w-5 h-5" />
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="lessons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {!selectedTopic ? (
                    <div className="text-center py-20">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      }`}>
                        <Sparkles className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('select_topic_prompt') || "Select a topic to view lessons"}
                      </h3>
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t('choose_topic_from_list') || "Choose a topic from the list to see available lessons"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Selected Topic Info */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl p-6 mb-8 ${
                          theme === 'dark'
                            ? 'bg-gray-800/50 border border-gray-700'
                            : 'bg-white border border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          <div 
                            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: selectedTopic.color }}
                          >
                            {selectedTopic.icon === "Code" ? <Code className="w-8 h-8 text-white" /> :
                             selectedTopic.icon === "Brain" ? <Brain className="w-8 h-8 text-white" /> :
                             selectedTopic.icon === "Database" ? <Database className="w-8 h-8 text-white" /> :
                             selectedTopic.icon === "Layers" ? <Layers className="w-8 h-8 text-white" /> :
                             <BookOpen className="w-8 h-8 text-white" />}
                          </div>
                          
                          <div className="flex-1">
                            <h2 className={`text-2xl font-bold mb-3 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {selectedTopic.title}
                            </h2>
                            <p className={`mb-6 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {selectedTopic.description}
                            </p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className={`p-3 rounded-xl ${
                                theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <GraduationCap className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {t('difficulty') || "Difficulty"}
                                  </span>
                                </div>
                                <span className={`font-semibold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {selectedTopic.difficulty}
                                </span>
                              </div>
                              
                              <div className={`p-3 rounded-xl ${
                                theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Book className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {t('lessons') || "Lessons"}
                                  </span>
                                </div>
                                <span className={`font-semibold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {selectedTopic.lessonsCount}
                                </span>
                              </div>
                              
                              <div className={`p-3 rounded-xl ${
                                theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {t('duration') || "Duration"}
                                  </span>
                                </div>
                                <span className={`font-semibold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {selectedTopic.duration}
                                </span>
                              </div>
                              
                              <div className={`p-3 rounded-xl ${
                                theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <Tag className="w-4 h-4 text-gray-400" />
                                  <span className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {t('category') || "Category"}
                                  </span>
                                </div>
                                <span className={`font-semibold ${
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {selectedTopic.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => {
                              if (selectedTopic.id === "prolog-kb" && lessons.length > 0) {
                                handleStartLesson(lessons[0]);
                              }
                            }}
                            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 whitespace-nowrap ${
                              theme === 'dark'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/30'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/30'
                            } transition-all`}
                          >
                            <Play className="w-5 h-5" />
                            {t('start_course') || "Start Course"}
                          </button>
                        </div>
                      </motion.div>

                      {/* Lessons List */}
                      <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                          <div>
                            <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              <List className="w-6 h-6" />
                              {t('course_lessons') || "Course Lessons"}
                            </h3>
                            <div className="flex items-center gap-4">
                              <span className={`text-sm ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {lessons.length} {lessons.length === 1 ? t('lesson') || 'lesson' : t('lessons') || 'lessons'} total
                              </span>
                              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                                theme === 'dark'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {lessons.filter(l => l.completed).length} {t('completed') || "completed"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {lessons.length === 0 ? (
                          <div className={`rounded-2xl p-12 text-center ${
                            theme === 'dark'
                              ? 'bg-gray-800/50 border border-gray-700'
                              : 'bg-white border border-gray-200'
                          }`}>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                            }`}>
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className={`text-lg font-bold mb-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {t('no_lessons_available') || "No lessons available"}
                            </h4>
                            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {t('no_lessons_for_topic') || "There are no lessons available for this topic yet."}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {lessons.map((lesson, index) => {
                              const LessonIcon = getTypeIcon(lesson.type);
                              return (
                                <motion.div
                                  key={lesson.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`rounded-2xl p-6 ${
                                    lesson.completed
                                      ? theme === 'dark'
                                        ? 'bg-green-500/5 border border-green-500/20'
                                        : 'bg-green-50 border border-green-200'
                                      : theme === 'dark'
                                        ? 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${
                                        theme === 'dark'
                                          ? 'bg-white/10 text-gray-300'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {index + 1}
                                      </div>
                                      <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${getTypeColor(lesson.type)}`}>
                                        <LessonIcon className="w-4 h-4" />
                                        <span className="text-xs font-medium capitalize">
                                          {lesson.type}
                                        </span>
                                      </div>
                                    </div>
                                    {lesson.completed && (
                                      <div className="flex items-center gap-1 text-green-500">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="text-sm font-medium">{t('completed') || "Completed"}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="mb-6">
                                    <h4 className={`font-bold text-lg mb-2 ${
                                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {lesson.title}
                                    </h4>
                                    <p className={`text-sm ${
                                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {lesson.description}
                                    </p>
                                  </div>
                                  
                                  <div className={`flex items-center justify-between mb-6 pb-6 border-b ${
                                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <span className={`text-sm ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                      }`}>
                                        {lesson.duration}
                                      </span>
                                    </div>
                                    {lesson.completed && (
                                      <div className="flex items-center gap-2 text-green-500">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm">{t('completed') || "Completed"}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <button 
                                      onClick={() => handleStartLesson(lesson)}
                                      className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                                        lesson.completed
                                          ? theme === 'dark'
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                          : theme === 'dark'
                                            ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                                      } transition-colors`}
                                    >
                                      {lesson.completed ? t('review_lesson') || "Review Lesson" : t('start_lesson') || "Start Lesson"}
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                    
                                    <div className="flex items-center gap-2">
                                      <Link 
                                        to={`/chat?lesson=${lesson.id}`}
                                        className={`p-2 rounded-lg ${
                                          theme === 'dark'
                                            ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        } transition-colors`}
                                        title={t('ask_ai_about_lesson') || "Ask AI about this lesson"}
                                      >
                                        <Sparkle className="w-5 h-5" />
                                      </Link>
                                      <button 
                                        className={`p-2 rounded-lg ${
                                          theme === 'dark'
                                            ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        } transition-colors`}
                                        title={t('bookmark_lesson') || "Bookmark this lesson"}
                                      >
                                        <Bookmark className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
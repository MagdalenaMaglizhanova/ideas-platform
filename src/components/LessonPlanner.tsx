import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { motion } from 'framer-motion';
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { 
  BookOpen, GraduationCap, Brain, Database, Layers, 
  Search, Filter, Play, CheckCircle,
  Clock, Code, Sparkles,
  Grid, Loader2
} from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
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

// Помощни функции - дефинирани ГЛОБАЛНО, за да се използват във всички компоненти
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner": return "bg-green-500/20 text-green-500";
    case "intermediate": return "bg-yellow-500/20 text-yellow-500";
    case "advanced": return "bg-red-500/20 text-red-500";
    default: return "bg-gray-500/20 text-gray-500";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "video": return "🎥";
    case "article": return "📄";
    case "exercise": return "💻";
    case "quiz": return "❓";
    default: return "📌";
  }
};

export default function LessonPlanner() {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
console.log(t)
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: "prolog", name: "Prolog Programming", icon: Code, color: "#667eea" },
    { id: "ai", name: "Artificial Intelligence", icon: Brain, color: "#FF6B8B" },
    { id: "databases", name: "Databases", icon: Database, color: "#36D1DC" },
    { id: "algorithms", name: "Algorithms", icon: Layers, color: "#FFD166" },
    { id: "logic", name: "Logic Programming", icon: Sparkles, color: "#9D4EDD" },
  ];

  // Зареждане на теми
  useEffect(() => {
    async function loadTopics() {
      setIsLoading(true);
      try {
        let topicsData: Topic[] = [];
        
        if (category) {
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
        }
        
        setTopics(topicsData);
        
        if (category && topicsData.length > 0) {
          setSelectedTopic(topicsData[0]);
        }
      } catch (err) {
        console.error("Failed to load topics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTopics();
  }, [category]);

  // Зареждане на уроци
  useEffect(() => {
    async function loadLessons() {
      if (!selectedTopic) return;

      try {
        const q = query(collection(db, "lessons"), where("topicId", "==", selectedTopic.id));
        const snapshot = await getDocs(q);
        const lessonsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Lesson));
        setLessons(lessonsData);
      } catch (err) {
        console.error("Failed to load lessons:", err);
      }
    }
    loadLessons();
  }, [selectedTopic]);

  const handleStartLesson = (lesson: Lesson) => {
    navigate(`/topics/${selectedTopic?.category}/lessons/${lesson.id}`);
  };

  const filteredTopics = topics.filter(topic => 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedTopics = topics.filter(t => t.completed).length;
  const completedLessons = lessons.filter(l => l.completed).length;
  const totalLessons = lessons.length;
  const progressPercentage = Math.round((completedLessons / Math.max(totalLessons, 1)) * 100);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="min-h-screen flex pt-20">
        {/* Sidebar */}
        <aside className={`w-64 lg:w-80 min-h-screen p-6 border-r ${
          theme === 'dark' 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : 'bg-gradient-to-r from-indigo-400 to-purple-400'
              }`}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Learning Topics
                </h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Explore materials
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <Layers className="w-4 h-4" />
              Categories
            </h3>
            <div className="space-y-2">
              <Link 
                to="/topics" 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  !category 
                    ? theme === 'dark' 
                      ? 'bg-indigo-500/20 border border-indigo-500/30' 
                      : 'bg-indigo-100 border border-indigo-200'
                    : theme === 'dark'
                      ? 'hover:bg-white/10'
                      : 'hover:bg-gray-100'
                }`}
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
                <span className="font-medium">All Topics</span>
              </Link>
              
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/topics/${cat.id}`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    category === cat.id
                      ? theme === 'dark' 
                        ? 'bg-indigo-500/20 border border-indigo-500/30' 
                        : 'bg-indigo-100 border border-indigo-200'
                      : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cat.color }}
                  >
                    <cat.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-white/5' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Progress
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {completedTopics}/{topics.length}
                </div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Topics
                </div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {completedLessons}/{totalLessons}
                </div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Lessons
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className={`w-full h-2 rounded-full overflow-hidden ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {progressPercentage}% complete
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <BookOpen className="w-8 h-8" />
                    {category 
                      ? categories.find(c => c.id === category)?.name || "Topics"
                      : "All Learning Topics"}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`relative flex-1 lg:flex-none lg:w-72`}>
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search topics..."
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-indigo-500'
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-indigo-500'
                      } transition-all outline-none`}
                    />
                  </div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-xl ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    } transition-colors`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Topics Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : filteredTopics.length === 0 ? (
              <EmptyState 
                theme={theme}
                message="No topics found"
                submessage="Try adjusting your search or filter"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    theme={theme}
                    isSelected={selectedTopic?.id === topic.id}
                    onSelect={() => setSelectedTopic(topic)}
                    onStart={() => setSelectedTopic(topic)}
                  />
                ))}
              </div>
            )}

            {/* Lessons Section */}
            {selectedTopic && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedTopic.title} - Lessons
                    </h2>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {lessons.length} lessons available
                    </p>
                  </div>
                  <button
                    onClick={() => lessons[0] && handleStartLesson(lessons[0])}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start First Lesson
                  </button>
                </div>

                {lessons.length === 0 ? (
                  <EmptyState 
                    theme={theme}
                    message="No lessons yet"
                    submessage="Lessons for this topic will be added soon"
                    small
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {lessons.map((lesson, index) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        index={index}
                        theme={theme}
                        onStart={() => handleStartLesson(lesson)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Topic Card Component
function TopicCard({ topic, theme, isSelected, onSelect, onStart }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`rounded-xl p-6 cursor-pointer ${
        isSelected
          ? theme === 'dark'
            ? 'bg-indigo-500/20 border-2 border-indigo-500/50'
            : 'bg-indigo-50 border-2 border-indigo-500'
          : theme === 'dark'
            ? 'bg-gray-800/50 border border-white/10 hover:bg-gray-800'
            : 'bg-white border border-gray-200 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(topic.difficulty)}`}>
            {topic.difficulty}
          </div>
          {topic.completed && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>
      </div>

      <h3 className={`font-bold text-lg mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {topic.title}
      </h3>
      
      <p className={`text-sm mb-6 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {topic.description}
      </p>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {topic.lessonsCount} lessons
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {topic.duration}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStart();
          }}
          className="flex-1 py-2 rounded-lg bg-indigo-500 text-white font-medium text-sm hover:bg-indigo-600 transition-colors"
        >
          View Lessons
        </button>
        <Link
          to={`/chat?topic=${topic.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`p-2 rounded-lg ${
            theme === 'dark'
              ? 'bg-white/5 hover:bg-white/10'
              : 'bg-gray-100 hover:bg-gray-200'
          } transition-colors`}
        >
          <Sparkles className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

// Lesson Card Component
function LessonCard({ lesson, index, theme, onStart }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-xl p-6 ${
        lesson.completed
          ? theme === 'dark'
            ? 'bg-green-500/5 border border-green-500/20'
            : 'bg-green-50 border border-green-200'
          : theme === 'dark'
            ? 'bg-gray-800/50 border border-white/10'
            : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
          }`}>
            <span className="text-sm font-bold">{index + 1}</span>
          </div>
          <div className={`px-3 py-1 rounded-lg text-sm ${
            lesson.type === 'video' ? 'bg-red-500/20 text-red-500' :
            lesson.type === 'article' ? 'bg-blue-500/20 text-blue-500' :
            lesson.type === 'exercise' ? 'bg-green-500/20 text-green-500' :
            'bg-purple-500/20 text-purple-500'
          }`}>
            {getTypeIcon(lesson.type)} {lesson.type}
          </div>
        </div>
        {lesson.completed && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
      </div>

      <h4 className={`font-bold mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {lesson.title}
      </h4>
      
      <p className={`text-sm mb-4 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {lesson.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {lesson.duration}
          </span>
        </div>

        <button
          onClick={onStart}
          className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          Start
        </button>
      </div>
    </motion.div>
  );
}

// Empty State Component
function EmptyState({ theme, message, submessage, small }: any) {
  return (
    <div className={`rounded-xl p-12 text-center ${
      small ? 'p-8' : 'p-12'
    } ${
      theme === 'dark'
        ? 'bg-gray-800/50 border border-white/10'
        : 'bg-white border border-gray-200'
    }`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
        theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <BookOpen className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className={`text-lg font-bold mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {message}
      </h3>
      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {submessage}
      </p>
    </div>
  );
}
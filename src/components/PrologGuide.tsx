// PrologGuide.tsx

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  BookOpen, Lightbulb,
  ExternalLink, 
  Book,  Cpu, Puzzle,
  GanttChartSquare,
  Link2,
  ChevronRight,
  ChevronLeft,
  Video,
  Star,
  
} from 'lucide-react';
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../services/supabase";
import ReactMarkdown from 'react-markdown';

interface LessonTranslation {
  id: string;
  lesson_id: string;
  language: 'en' | 'bg' | 'es';
  title: string;
  content: string;
  description?: string;
  video_url?: string;
  duration?: string;
  example_code?: string;
  example_output?: string;
  tags?: string[];
  image_url?: string;
}

interface Lesson {
  id: string;
  slug: string;
  lesson_number: number;
  sublesson_number?: number;
  order_index: number;
  type: 'video' | 'text' | 'puzzle' | 'extra';
  created_at: string;
  updated_at: string;
  translations: LessonTranslation[];
}

export default function PrologGuide() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('tutorials');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Theme classes
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
      modalBg: "bg-white",
      overlay: "bg-black/50",
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
      modalBg: "bg-gray-800",
      overlay: "bg-black/70",
    }
  };

  const currentTheme = themeClasses[theme];

  // Функция за конвертиране на YouTube URL към embed формат
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    const youtubeDomains = [
      'https://www.youtube.com/',
      'https://youtube.com/',
      'https://www.youtube.com',
      'https://youtube.com',
      'www.youtube.com/',
      'youtube.com/'
    ];
    
    if (youtubeDomains.includes(url) || youtubeDomains.includes(url + '/')) {
      return '';
    }
    
    if (url.includes('/embed/')) {
      const id = url.split('/embed/')[1]?.split('?')[0] || '';
      if (id && id.length > 5) return url;
      return '';
    }
    
    let videoId = '';
    
    if (url.includes('watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('/embed/')) {
      videoId = url.split('/embed/')[1]?.split('?')[0] || '';
    } else if (url.includes('/shorts/')) {
      videoId = url.split('/shorts/')[1]?.split('?')[0] || '';
    } else if (url.includes('/v/')) {
      videoId = url.split('/v/')[1]?.split('?')[0] || '';
    }
    
    if (!videoId || videoId.length < 5) {
      return '';
    }
    
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&enablejsapi=1`;
  };

  const getFirstContentLine = (content?: string) => {
    if (!content) return '';
    return content
      .split('\n')
      .map(line => line.trim())
      .find(line => line.length > 0) || '';
  };

  const getContentWithoutFirstLine = (content?: string) => {
    if (!content) return '';
    const lines = content.split('\n');
    const firstNonEmptyIndex = lines.findIndex(line => line.trim().length > 0);
    if (firstNonEmptyIndex === -1) return '';
    return lines.slice(firstNonEmptyIndex + 1).join('\n').trim();
  };

  useEffect(() => {
    loadLessons();
  }, [language]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading lessons for language:', language);

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          translations:lesson_translations!inner(*)
        `)
        .eq('translations.language', language)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      console.log('✅ Loaded lessons:', lessonsData?.length || 0);
      setLessons(lessonsData || []);
      
    } catch (error: any) {
      console.error('❌ Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveTab('tutorials');

    window.setTimeout(() => {
      document.getElementById('tutorial-lesson-content')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const closeLesson = () => {
    setSelectedLesson(null);

    window.setTimeout(() => {
      document.getElementById('tutorial-lessons-list')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const navigableLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);

  const selectedLessonIndex = selectedLesson
    ? navigableLessons.findIndex(lesson => lesson.id === selectedLesson.id)
    : -1;

  const goToNextLesson = () => {
    if (selectedLessonIndex >= 0 && selectedLessonIndex < navigableLessons.length - 1) {
      setSelectedLesson(navigableLessons[selectedLessonIndex + 1]);
      window.setTimeout(() => {
        document.getElementById('tutorial-lesson-content')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 0);
    }
  };

  const goToPreviousLesson = () => {
    if (selectedLessonIndex <= 0) {
      closeLesson();
      return;
    }
    setSelectedLesson(navigableLessons[selectedLessonIndex - 1]);
    window.setTimeout(() => {
      document.getElementById('tutorial-lesson-content')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const getTranslation = (lesson: Lesson) => {
    if (!lesson) return null;
    return lesson.translations.find(t => t.language === language) || lesson.translations[0];
  };

  const mainLessons = Array.from(
    new Map(lessons.map(lesson => [lesson.lesson_number, lesson])).values()
  );

  const getSubLessonsForMain = (mainLesson: Lesson) => {
    return lessons
      .filter(l => l.lesson_number === mainLesson.lesson_number && l.sublesson_number && l.sublesson_number > 0)
      .sort((a, b) => (a.sublesson_number || 0) - (b.sublesson_number || 0));
  };

  const getExtraLessons = (lessonNumber: number) => {
    return lessons
      .filter(l => l.lesson_number === lessonNumber && l.type === 'extra')
      .sort((a, b) => (a.sublesson_number || 0) - (b.sublesson_number || 0));
  };

  const getPuzzleLessons = (lessonNumber: number) => {
    return lessons
      .filter(l => l.lesson_number === lessonNumber && l.type === 'puzzle')
      .sort((a, b) => (a.sublesson_number || 0) - (b.sublesson_number || 0));
  };



  const getAllPuzzleLessons = () => {
    return lessons
      .filter(l => l.type === 'puzzle')
      .sort((a, b) => a.order_index - b.order_index);
  };

  const getAllExtraLessons = () => {
    return lessons
      .filter(l => l.type === 'extra')
      .sort((a, b) => a.order_index - b.order_index);
  };

  const learningResources = [
    {
      title: "Logica - Logic Tools Suite",
      description: "Collection of interactive logic tools: Truth Tables, Proof Editors, Unifier & more",
      icon: <Lightbulb className="w-5 h-5" />,
      url: "http://logic.stanford.edu/logica/homepage/index.php",
      color: "from-amber-500 to-orange-500",
      category: "Interactive Tools"
    },
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
    {
      title: "SWISH Online IDE",
      description: "Run Prolog in browser",
      icon: <Cpu className="w-5 h-5" />,
      url: "https://swish.swi-prolog.org/",
      color: "from-purple-500 to-pink-500",
      category: "Online Tools"
    },
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
    {
      title: "GitHub Examples",
      description: "Open source Prolog projects",
      icon: <Code className="w-5 h-5" />,
      url: "https://github.com/topics/prolog",
      color: "from-indigo-500 to-blue-500",
      category: "Code"
    }
  ];

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

  if (loading) {
    return (
      <div className={`min-h-screen pt-20 ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={currentTheme.textSecondary}>Loading lessons...</p>
        </div>
      </div>
    );
  }

  const selectedTranslation = selectedLesson ? getTranslation(selectedLesson) : null;

  const translations = {
    tutorials: t('tutorials') || 'Tutorials',
    examples: t('examples') || 'Examples',
    resources: t('resources') || 'Resources',
    videos: t('videos') || 'Videos',
    puzzles: t('puzzles') || 'Puzzles',
    extras: t('extras') || 'Extras',
    introduction_title: t('prolog_guide_intro_title') || 'Introduction to Logic Programming',
    introduction_description: t('prolog_guide_intro_desc') || 'This structured course will guide you through the fundamental concepts of logic programming and Prolog. Each lesson combines theory with practical exercises.',
    lessons_videos: t('lessons_videos') || 'Lessons & Videos',
    extra: t('extra') || 'Extra',
    puzzle: t('puzzle') || 'Puzzle',
    video: t('video') || 'Video',
    no_lessons: t('no_lessons') || 'No Lessons Available',
    no_lessons_desc: t('no_lessons_desc') || 'Check back later for new lessons.',
    back_to_lessons: t('back_to_lessons') || 'Back to lessons',
    previous: t('previous') || 'Previous',
    next: t('next') || 'Next',
    visit: t('visit') || 'Visit',
    lesson: t('lesson') || 'Lesson',
    example: t('example') || 'Example',
    output: t('output') || 'Output',
    duration: t('duration') || 'Duration',
    no_videos: t('no_videos') || 'No Videos Available',
    no_videos_desc: t('no_videos_desc') || 'Check back later for video lessons.',
    no_puzzles: t('no_puzzles') || 'No Puzzles Available',
    no_puzzles_desc: t('no_puzzles_desc') || 'Check back later for puzzles.',
    no_extras: t('no_extras') || 'No Extra Content Available',
    no_extras_desc: t('no_extras_desc') || 'Check back later for extra content.',
  };

  // Компонент за показване само на видео уроци (само видеото, без текст)
  

  const PuzzlesTab = () => {
    const puzzleLessons = getAllPuzzleLessons();
    const [showSolutions, setShowSolutions] = useState<Record<string, boolean>>({});

    const toggleSolution = (id: string) => {
      setShowSolutions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-4xl mx-auto"
      >
        <div className={`text-center p-8 rounded-2xl border ${currentTheme.card} ${currentTheme.cardHover} mb-8`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Puzzle className="w-8 h-8 text-amber-500" />
            <h2 className={`text-3xl font-bold ${currentTheme.text}`}>
              {translations.puzzles}
            </h2>
          </div>
          <p className={`text-lg ${currentTheme.textSecondary}`}>
            Challenge yourself with interactive Prolog puzzles
          </p>
        </div>

        <div className="space-y-6">
          {puzzleLessons.map((lesson) => {
            const translation = getTranslation(lesson);
            const firstLine = getFirstContentLine(translation?.content);
            const isSolutionShown = showSolutions[lesson.id] || false;

            return (
              <div
                key={lesson.id}
                className={`rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.cardHover}`}
              >
                <div
                  className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-amber-500/20 to-orange-500/20`}
                >
                  <div>
                    <h3 className={`text-xl font-bold flex items-center gap-3 ${currentTheme.text}`}>
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-amber-500 text-white`}
                      >
                        {lesson.lesson_number}
                        {lesson.sublesson_number && `.${lesson.sublesson_number}`}
                      </span>
                      {translation?.title || lesson.slug}
                    </h3>
                    {firstLine && (
                      <p className={`mt-2 ml-11 text-lg font-semibold ${currentTheme.textSecondary}`}>
                        {firstLine}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {translation?.content && (
                    <div className={`prose max-w-none ${currentTheme.text}`}>
                      <ReactMarkdown>{translation.content}</ReactMarkdown>
                    </div>
                  )}

                  {translation?.example_code && (
                    <div className={`mt-4 p-4 rounded-lg ${currentTheme.codeBg}`}>
                      <h4 className={`font-bold mb-2 ${currentTheme.text}`}>💻 Code</h4>
                      <pre className="text-sm text-green-400">
                        <code>{translation.example_code}</code>
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={() => toggleSolution(lesson.id)}
                    className={`mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium transition-all hover:shadow-lg`}
                  >
                    {isSolutionShown ? 'Hide Solution' : 'Show Solution'}
                  </button>

                  {isSolutionShown && (
                    <div className={`mt-4 p-6 rounded-lg border-2 border-green-500/30 ${currentTheme.card}`}>
                      <h4 className={`font-bold mb-2 text-green-500 ${currentTheme.text}`}>✅ Solution</h4>
                      {translation?.example_output && (
                        <div className={`mt-2 p-3 rounded-lg ${currentTheme.codeBg}`}>
                          <pre className="text-sm text-yellow-400">
                            <code>{translation.example_output}</code>
                          </pre>
                        </div>
                      )}
                      {translation?.description && (
                        <p className={`mt-3 ${currentTheme.textSecondary}`}>
                          {translation.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {puzzleLessons.length === 0 && (
            <div className={`text-center p-12 rounded-2xl border ${currentTheme.card}`}>
              <Puzzle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className={`text-xl font-bold mb-2 ${currentTheme.text}`}>
                {translations.no_puzzles}
              </h3>
              <p className={currentTheme.textSecondary}>
                {translations.no_puzzles_desc}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const ExtrasTab = () => {
    const extraLessons = getAllExtraLessons();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-4xl mx-auto"
      >
        <div className={`text-center p-8 rounded-2xl border ${currentTheme.card} ${currentTheme.cardHover} mb-8`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-8 h-8 text-purple-500" />
            <h2 className={`text-3xl font-bold ${currentTheme.text}`}>
              {translations.extras}
            </h2>
          </div>
          <p className={`text-lg ${currentTheme.textSecondary}`}>
            Additional resources and advanced topics
          </p>
        </div>

        <div className="space-y-6">
          {extraLessons.map((lesson) => {
            const translation = getTranslation(lesson);
            const firstLine = getFirstContentLine(translation?.content);

            return (
              <div
                key={lesson.id}
                className={`rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.cardHover}`}
              >
                <div
                  className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-purple-500/20 to-pink-500/20`}
                >
                  <div>
                    <h3 className={`text-xl font-bold flex items-center gap-3 ${currentTheme.text}`}>
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-purple-500 text-white`}
                      >
                        {lesson.lesson_number}
                        {lesson.sublesson_number && `.${lesson.sublesson_number}`}
                      </span>
                      {translation?.title || lesson.slug}
                    </h3>
                    {firstLine && (
                      <p className={`mt-2 ml-11 text-lg font-semibold ${currentTheme.textSecondary}`}>
                        {firstLine}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {translation?.content && (
                    <div className={`prose max-w-none ${currentTheme.text}`}>
                      <ReactMarkdown>{translation.content}</ReactMarkdown>
                    </div>
                  )}

                  {translation?.example_code && (
                    <div className={`mt-4 p-4 rounded-lg ${currentTheme.codeBg}`}>
                      <h4 className={`font-bold mb-2 ${currentTheme.text}`}>💻 Example Code</h4>
                      <pre className="text-sm text-green-400">
                        <code>{translation.example_code}</code>
                      </pre>
                    </div>
                  )}

                  {translation?.example_output && (
                    <div className={`mt-4 p-4 rounded-lg ${currentTheme.codeBg}`}>
                      <h4 className={`font-bold mb-2 ${currentTheme.text}`}>📤 Output</h4>
                      <pre className="text-sm text-yellow-400">
                        <code>{translation.example_output}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {extraLessons.length === 0 && (
            <div className={`text-center p-12 rounded-2xl border ${currentTheme.card}`}>
              <Star className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className={`text-xl font-bold mb-2 ${currentTheme.text}`}>
                {translations.no_extras}
              </h3>
              <p className={currentTheme.textSecondary}>
                {translations.no_extras_desc}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-screen pt-20 ${currentTheme.background}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { id: 'tutorials', label: translations.tutorials, icon: <BookOpen className="w-4 h-4" /> },
            { id: 'puzzles', label: translations.puzzles, icon: <Puzzle className="w-4 h-4" /> },
            { id: 'extras', label: translations.extras, icon: <Star className="w-4 h-4" /> },
            { id: 'examples', label: translations.examples, icon: <Code className="w-4 h-4" /> },
            { id: 'resources', label: translations.resources, icon: <ExternalLink className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'tutorials') {
                  setSelectedLesson(null);
                }
              }}
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

        <AnimatePresence mode="wait">
          {activeTab === 'tutorials' && (
            <motion.div
              key="tutorials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {!selectedLesson ? (
                <>
                  <div
                    id="tutorial-lessons-list"
                    className={`text-center p-8 rounded-2xl border ${currentTheme.card} ${currentTheme.cardHover} mb-8`}
                  >
                    <h2 className={`text-3xl font-bold mb-4 ${currentTheme.text}`}>
                      {translations.introduction_title}
                    </h2>
                    <p className={`text-lg ${currentTheme.textSecondary}`}>
                      {translations.introduction_description}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {mainLessons.map((mainLesson) => {
                      const translation = getTranslation(mainLesson);
                      const subLessons = getSubLessonsForMain(mainLesson);
                      const extraLessons = getExtraLessons(mainLesson.lesson_number);
                      const puzzleLessons = getPuzzleLessons(mainLesson.lesson_number);
                      const firstLine = getFirstContentLine(translation?.content);
                      const hasSubLessons = subLessons.length > 0;

                      return (
                        <div
                          key={mainLesson.id}
                          className={`rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.cardHover}`}
                        >
                          <div
                            className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r ${
                              theme === 'dark'
                                ? 'from-blue-900/30 to-cyan-900/30'
                                : 'from-blue-50 to-cyan-50'
                            }`}
                          >
                            <div>
                              <h3 className={`text-2xl font-bold flex items-center gap-3 ${currentTheme.text}`}>
                                <span
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    theme === 'dark'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  {mainLesson.lesson_number}
                                </span>
                                {translation?.title || mainLesson.slug}
                              </h3>
                              {firstLine && !hasSubLessons && (
                                <p className={`mt-2 ml-11 text-lg font-semibold ${currentTheme.textSecondary}`}>
                                  {firstLine}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="p-6 space-y-6">
                            <div>
                              <h4 className={`font-semibold flex items-center gap-2 mb-3 ${currentTheme.text}`}>
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600'
                                  }`}
                                ></span>
                                {translations.lessons_videos}
                              </h4>

                              <ul className="space-y-2 pl-4">
                                {subLessons.map((subLesson) => {
                                  const subTranslation = getTranslation(subLesson);
                                  const subFirstLine = getFirstContentLine(subTranslation?.content);

                                  return (
                                    <li key={subLesson.id} className="flex items-center gap-3 text-sm">
                                      <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono ${
                                          theme === 'dark'
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                      >
                                        {mainLesson.lesson_number}.{subLesson.sublesson_number}
                                      </span>

                                      <button
                                        onClick={() => openLesson(subLesson)}
                                        className={`${currentTheme.link} transition-colors flex items-center gap-1 hover:underline`}
                                      >
                                        {subFirstLine || subTranslation?.title || subLesson.slug}
                                        <Link2 className="w-3 h-3 opacity-50" />
                                      </button>

                                      {subLesson.type === 'video' && (
                                        <span
                                          className={`ml-auto text-xs px-2 py-0.5 rounded ${
                                            theme === 'dark'
                                              ? 'bg-red-500/20 text-red-400'
                                              : 'bg-red-100 text-red-600'
                                          }`}
                                        >
                                          <Video className="w-3 h-3 inline mr-1" />
                                          {translations.video}
                                        </span>
                                      )}
                                      {subLesson.type === 'puzzle' && (
                                        <span
                                          className={`ml-auto text-xs px-2 py-0.5 rounded ${
                                            theme === 'dark'
                                              ? 'bg-amber-500/20 text-amber-400'
                                              : 'bg-amber-100 text-amber-600'
                                          }`}
                                        >
                                          <Puzzle className="w-3 h-3 inline mr-1" />
                                          {translations.puzzle}
                                        </span>
                                      )}
                                      {subLesson.type === 'extra' && (
                                        <span
                                          className={`ml-auto text-xs px-2 py-0.5 rounded ${
                                            theme === 'dark'
                                              ? 'bg-purple-500/20 text-purple-400'
                                              : 'bg-purple-100 text-purple-600'
                                          }`}
                                        >
                                          <Star className="w-3 h-3 inline mr-1" />
                                          {translations.extra}
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>

                            {(extraLessons.length > 0 || puzzleLessons.length > 0) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                                {extraLessons.length > 0 && (
                                  <div>
                                    <h4
                                      className={`font-semibold flex items-center gap-2 mb-2 text-sm ${currentTheme.text}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          theme === 'dark' ? 'bg-purple-400' : 'bg-purple-600'
                                        }`}
                                      ></span>
                                      {translations.extra}
                                    </h4>

                                    <ul className="space-y-1 pl-4">
                                      {extraLessons.map((extra) => {
                                        const extraTranslation = getTranslation(extra);
                                        const extraFirstLine = getFirstContentLine(extraTranslation?.content);

                                        return (
                                          <li
                                            key={extra.id}
                                            className={`text-sm flex items-center gap-2 ${currentTheme.textSecondary}`}
                                          >
                                            <span className="text-xs">•</span>
                                            <button
                                              onClick={() => openLesson(extra)}
                                              className={`${currentTheme.link} transition-colors flex items-center gap-1 hover:underline`}
                                            >
                                              {extraFirstLine || extraTranslation?.title || extra.slug}
                                              <Link2 className="w-3 h-3 opacity-50" />
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}

                                {puzzleLessons.length > 0 && (
                                  <div>
                                    <h4
                                      className={`font-semibold flex items-center gap-2 mb-2 text-sm ${currentTheme.text}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          theme === 'dark' ? 'bg-amber-400' : 'bg-amber-600'
                                        }`}
                                      ></span>
                                      {translations.puzzle}
                                    </h4>

                                    <ul className="space-y-1 pl-4">
                                      {puzzleLessons.map((puzzle) => {
                                        const puzzleTranslation = getTranslation(puzzle);
                                        const puzzleFirstLine = getFirstContentLine(puzzleTranslation?.content);

                                        return (
                                          <li
                                            key={puzzle.id}
                                            className={`text-sm flex items-center gap-2 ${currentTheme.textSecondary}`}
                                          >
                                            <span className="text-xs">•</span>
                                            <button
                                              onClick={() => openLesson(puzzle)}
                                              className={`${currentTheme.link} transition-colors flex items-center gap-1 hover:underline`}
                                            >
                                              {puzzleFirstLine || puzzleTranslation?.title || puzzle.slug}
                                              <Link2 className="w-3 h-3 opacity-50" />
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {mainLessons.length === 0 && (
                      <div className={`text-center p-12 rounded-2xl border ${currentTheme.card}`}>
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className={`text-xl font-bold mb-2 ${currentTheme.text}`}>
                          {translations.no_lessons}
                        </h3>
                        <p className={currentTheme.textSecondary}>
                          {translations.no_lessons_desc}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <motion.div
                  id="tutorial-lesson-content"
                  key={selectedLesson.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`rounded-2xl border overflow-hidden ${currentTheme.card}`}
                >
                  <div
                    className={`p-6 border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-sm px-2 py-0.5 rounded ${currentTheme.muted}`}>
                          {translations.lesson} #{selectedLesson.lesson_number}
                          {selectedLesson.sublesson_number && `.${selectedLesson.sublesson_number}`}
                        </span>

                        {selectedLesson.type === 'video' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                            <Video className="w-3 h-3 inline mr-1" />
                            {translations.video}
                          </span>
                        )}

                        {selectedLesson.type === 'puzzle' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
                            <Puzzle className="w-3 h-3 inline mr-1" />
                            {translations.puzzle}
                          </span>
                        )}

                        {selectedLesson.type === 'extra' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-500">
                            <Star className="w-3 h-3 inline mr-1" />
                            {translations.extra}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={closeLesson}
                        className={`px-3 py-2 rounded-lg ${currentTheme.buttonSecondary} transition-colors text-sm font-medium`}
                      >
                        ← {translations.back_to_lessons}
                      </button>
                    </div>

                    <h2 className={`text-3xl font-bold ${currentTheme.text}`}>
                      {getFirstContentLine(selectedTranslation?.content) || selectedTranslation?.title}
                    </h2>

                    {selectedTranslation?.description && (
                      <p className={`mt-2 ${currentTheme.textSecondary}`}>
                        {selectedTranslation.description}
                      </p>
                    )}
                  </div>

                  <div className="p-6">
                    {/* В TUTORIALS таба - показваме ВИДЕОТО + ТЕКСТА заедно */}
                    {selectedLesson.type === 'video' && selectedTranslation?.video_url && (
                      (() => {
                        const embedUrl = getEmbedUrl(selectedTranslation.video_url || '');
                        const isValidVideo = embedUrl && embedUrl.includes('/embed/') && embedUrl.length > 20;
                        
                        return isValidVideo ? (
                          <div className="mb-6 aspect-video rounded-xl overflow-hidden bg-black">
                            <iframe
                              src={embedUrl}
                              className="w-full h-full"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              loading="lazy"
                              title={selectedTranslation?.title || selectedLesson.slug}
                            />
                          </div>
                        ) : (
                          <div className={`mb-6 aspect-video rounded-xl flex items-center justify-center ${currentTheme.codeBg}`}>
                            <div className="text-center">
                              <Video className="w-16 h-16 mx-auto mb-3 opacity-30" />
                              <p className={currentTheme.textSecondary}>
                                Invalid video URL
                              </p>
                              <a 
                                href={selectedTranslation.video_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`mt-2 inline-block text-blue-500 hover:underline text-sm`}
                              >
                                Open video on YouTube →
                              </a>
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {/* Показваме съдържанието (текста) за всички типове уроци в Tutorials таба */}
                    <div className={`prose max-w-none ${currentTheme.text}`}>
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className={`text-3xl font-bold mt-6 mb-4 ${currentTheme.text}`}>
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className={`text-2xl font-bold mt-5 mb-3 ${currentTheme.text}`}>
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className={`text-xl font-bold mt-4 mb-2 ${currentTheme.text}`}>
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className={`mb-4 leading-relaxed ${currentTheme.textSecondary}`}>
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className={currentTheme.textSecondary}>{children}</li>
                          ),
                          code: ({ className, children, ...props }: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <pre className={`p-4 rounded-lg overflow-x-auto ${currentTheme.codeBg}`}>
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code
                                className={`px-1.5 py-0.5 rounded text-sm font-mono ${currentTheme.code}`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          blockquote: ({ children }) => (
                            <blockquote
                              className={`border-l-4 border-blue-500 pl-4 py-2 my-4 ${currentTheme.textSecondary}`}
                            >
                              {children}
                            </blockquote>
                          ),
                          img: ({ src, alt }) => (
                            <img src={src} alt={alt} className="max-w-full rounded-lg my-4" />
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={currentTheme.link}
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {getContentWithoutFirstLine(selectedTranslation?.content)}
                      </ReactMarkdown>
                    </div>

                    {selectedTranslation?.example_code && (
                      <div className={`mt-6 p-4 rounded-lg ${currentTheme.codeBg}`}>
                        <h4 className={`font-bold mb-2 ${currentTheme.text}`}>💻 {translations.example}</h4>
                        <pre className="text-sm text-green-400">
                          <code>{selectedTranslation.example_code}</code>
                        </pre>

                        {selectedTranslation.example_output && (
                          <>
                            <h5 className={`text-sm font-medium mt-3 ${currentTheme.muted}`}>
                              {translations.output}:
                            </h5>
                            <pre className="text-sm text-yellow-400">
                              <code>{selectedTranslation.example_output}</code>
                            </pre>
                          </>
                        )}
                      </div>
                    )}

                    {selectedTranslation?.tags && selectedTranslation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-6">
                        {selectedTranslation.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded-full text-xs ${currentTheme.tag}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between gap-4 mt-10 pt-6 border-t ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}
                    >
                      <button
                        onClick={goToPreviousLesson}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl ${currentTheme.buttonSecondary} transition-all disabled:opacity-40`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="font-medium">{translations.previous}</span>
                      </button>

                      <span className={`text-sm text-center ${currentTheme.muted}`}>
                        {selectedLessonIndex >= 0
                          ? `${selectedLessonIndex + 1} / ${navigableLessons.length}`
                          : ''}
                      </span>

                      <button
                        onClick={goToNextLesson}
                        disabled={
                          selectedLessonIndex < 0 ||
                          selectedLessonIndex >= navigableLessons.length - 1
                        }
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <span className="font-medium">{translations.next}</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'puzzles' && <PuzzlesTab />}

          {activeTab === 'extras' && <ExtrasTab />}

          {activeTab === 'examples' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
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
                    <span className="text-sm font-medium">{translations.visit}</span>
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
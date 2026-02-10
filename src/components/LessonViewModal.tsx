import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, BookOpen, Calendar, User, Tag, 
  Edit, Trash2, Eye, Download, Printer,
  Share2, Bookmark, ThumbsUp, MessageCircle,
  FileText, Code, Video, Link, CheckCircle, Play, Clock,
  Users, BarChart3, Star, Target,
Shield, TrendingUp,
  Copy, ExternalLink, Heart, Flag,
  MoreVertical, Filter, Search, BookmarkCheck,
  GraduationCap,  Puzzle, Rocket,
  ChevronRight,  Maximize2,
  DownloadCloud, Lock, Globe,
  EyeOff, Heart as HeartFilled
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  createdAt: any;
  updatedAt?: any;
  category: string;
  color: string;
  icon: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  attachments: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'video' | 'code' | 'link' | 'image';
    size?: string;
  }>;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visibility: 'public' | 'private' | 'unlisted';
  language?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
  views?: number;
  likes?: string[];
  students?: string[];
  rating?: number;
  totalRatings?: number;
}

interface LessonViewModalProps {
  lesson: Lesson;
  onClose: () => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}

export default function LessonViewModal({ lesson, onClose, onEdit, onDelete }: LessonViewModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, userData } = useAuth();
  console.log(t)
  const [activeTab, setActiveTab] = useState<'content' | 'attachments' | 'info' | 'analytics' | 'students'>('content');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(lesson.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(lesson.likes?.length || 0);
  const [viewCount, setViewCount] = useState(lesson.views || 0);
  const [studentCount, _setStudentCount] = useState(lesson.students?.length || 0);
  const [rating, _setRating] = useState(lesson.rating || 0);
  const [userRating, setUserRating] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [relatedLessons, setRelatedLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    incrementViewCount();
    loadComments();
    loadRelatedLessons();
  }, [lesson.id]);

  const incrementViewCount = async () => {
    try {
      if (user?.uid !== lesson.teacherId) {
        setViewCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const loadComments = async () => {
    try {
      const commentsQuery = query(
        collection(db, "lessonComments"),
        where("lessonId", "==", lesson.id),
        where("parentId", "==", null)
      );
      const snapshot = await getDocs(commentsQuery);
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const loadRelatedLessons = async () => {
    try {
      const lessonsQuery = query(
        collection(db, "lessons"),
        where("category", "==", lesson.category),
        where("status", "==", "published"),
        where("id", "!=", lesson.id)
      );
      const snapshot = await getDocs(lessonsQuery);
      const lessonsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lesson)).slice(0, 3);
      setRelatedLessons(lessonsData);
    } catch (error) {
      console.error("Error loading related lessons:", error);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      // TODO: Add Firestore logic
    } catch (error) {
      console.error("Error updating like:", error);
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
    }
  };

  const handleBookmark = async () => {
    setIsBookmarked(!isBookmarked);
    try {
      // TODO: Add Firestore logic
    } catch (error) {
      console.error("Error updating bookmark:", error);
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleRateLesson = async (stars: number) => {
    if (!user) return;
    setUserRating(stars);
    // TODO: Add rating logic
  };

  const handleSubmitComment = async () => {
    if (!user || !comment.trim()) return;

    try {
      const commentData = {
        lessonId: lesson.id,
        userId: user.uid,
        userName: userData?.fullName || user.email?.split('@')[0],
        userAvatar: userData?.avatar,
        content: comment,
        parentId: null,
        likes: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "lessonComments"), commentData);
      setComments(prev => [{
        id: docRef.id,
        ...commentData
      }, ...prev]);
      setComment('');
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'video': return <Video className="w-5 h-5 text-blue-500" />;
      case 'code': return <Code className="w-5 h-5 text-green-500" />;
      case 'link': return <Link className="w-5 h-5 text-purple-500" />;
      case 'image': return <Eye className="w-5 h-5 text-amber-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'from-green-500 to-emerald-500';
      case 'intermediate': return 'from-yellow-500 to-amber-500';
      case 'advanced': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'unlisted': return <EyeOff className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/20 text-green-500';
      case 'draft': return 'bg-yellow-500/20 text-yellow-500';
      case 'archived': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const shareOptions = [
    { icon: Copy, label: 'Copy Link', action: () => navigator.clipboard.writeText(window.location.href) },
    { icon: ExternalLink, label: 'Share via Email', action: () => window.open(`mailto:?subject=${lesson.title}&body=Check out this lesson: ${window.location.href}`) },
    { icon: MessageCircle, label: 'Share in Messages', action: () => window.open(`sms:?body=Check out this lesson: ${window.location.href}`) },
    { icon: DownloadCloud, label: 'Export as PDF', action: () => alert('PDF export coming soon!') },
  ];

  const moreOptions = [
    { icon: Flag, label: 'Report Issue', action: () => alert('Report feature coming soon!') },
    { icon: Edit, label: 'Suggest Edit', action: () => alert('Edit suggestion feature coming soon!') },
    { icon: Download, label: 'Download All Files', action: () => alert('Download feature coming soon!') },
    { icon: Printer, label: 'Print Lesson', action: () => window.print() },
  ];

  // Fix: Custom style for SyntaxHighlighter
  const customStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
      borderRadius: '0.5rem',
      padding: '1.25rem',
      marginTop: '0',
      marginBottom: '1rem',
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      fontSize: '0.875rem',
      fontFamily: 'monospace',
    },
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isFullscreen ? 'p-0' : ''}`}>
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      {/* Ред 272-278 - Променете това: */}
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  className={`relative ${isFullscreen ? 'w-full h-full rounded-none' : 'w-[95vw] max-w-[1000px] h-[90vh] rounded-2xl shadow-2xl'} border overflow-hidden flex flex-col ${
    theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  }`}
>
        {/* Header with Gradient */}
        <div 
          className={`relative p-6 border-b text-white`}
          style={{ 
            background: `linear-gradient(135deg, ${lesson.color}20 0%, ${lesson.color}40 100%)`,
            borderColor: `${lesson.color}30`
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl backdrop-blur-sm bg-white/20"
                style={{ color: lesson.color }}
              >
                {lesson.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lesson.status)}`}>
                      {lesson.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getDifficultyColor(lesson.difficulty)} text-white`}>
                      {lesson.difficulty}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-black/20 text-white flex items-center gap-1">
                      {getVisibilityIcon(lesson.visibility)}
                      {lesson.visibility}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {lesson.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" /> {lesson.teacherName}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {formatDate(lesson.createdAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4" /> {lesson.category}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {lesson.estimatedTime}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-lg ${isBookmarked ? 'text-yellow-500 bg-yellow-500/10' : 
                  theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
              >
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg ${isLiked ? 'text-red-500 bg-red-500/10' : 
                  theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title="Like"
              >
                {isLiked ? <HeartFilled className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                <span className="ml-1 text-xs">{likeCount}</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className={`p-2 rounded-lg ${showShareMenu ? 'bg-blue-500/10 text-blue-500' : 
                    theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {showShareMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg z-10 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {shareOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          option.action();
                          setShowShareMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          index === 0 ? 'rounded-t-xl' : index === shareOptions.length - 1 ? 'rounded-b-xl' : ''
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`p-2 rounded-lg ${showMoreMenu ? 'bg-gray-500/10' : 
                    theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
                  }`}
                  title="More Options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMoreMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg z-10 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {moreOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          option.action();
                          setShowMoreMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          index === 0 ? 'rounded-t-xl' : index === moreOptions.length - 1 ? 'rounded-b-xl' : ''
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{viewCount} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">{studentCount} students</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="font-medium">{rating.toFixed(1)} rating ({lesson.totalRatings || 0} ratings)</span>
            </div>
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              <span className="font-medium">{likeCount} likes</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'content'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'attachments'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Resources ({lesson.attachments?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'info'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Tag className="w-4 h-4" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            {user?.uid === lesson.teacherId && (
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'students'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Students ({studentCount})
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[calc(95vh-200px)]'}`}>
          {/* Left Content */}
          <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'content' ? '' : 'hidden'}`}>
            {/* Tags */}
            {lesson.tags && lesson.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {lesson.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-sm ${
                      theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Learning Objectives */}
            {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
              <div className={`mb-8 p-6 rounded-xl border ${
                theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-blue-50'
              }`}>
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Learning Objectives
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lesson.learningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/30">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span>{objective}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {lesson.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      if (!isInline && match) {
                        const language = match[1];
                        return (
                          <div className="relative my-4">
                            <div className={`absolute top-0 left-0 px-3 py-1 text-xs rounded-tr rounded-bl ${
                              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {language}
                            </div>
                            <SyntaxHighlighter
                              style={customStyle as any}
                              language={language}
                              PreTag="div"
                              className="rounded-lg !mt-0"
                              showLineNumbers={true}
                              lineNumberStyle={{
                                minWidth: '3em',
                                color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                                paddingRight: '1em',
                                userSelect: 'none',
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        );
                      } else {
                        return (
                          <code className={`px-2 py-1 rounded text-sm ${className} ${
                            theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                          }`} {...props}>
                            {children}
                          </code>
                        );
                      }
                    },
                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-bold mt-5 mb-2 text-gray-700 dark:text-gray-300">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className={`border-l-4 pl-4 italic my-4 py-2 ${
                        theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'
                      }`}>
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left bg-gray-100 dark:bg-gray-800 font-bold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {lesson.content}
                </ReactMarkdown>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Content Yet</h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    This lesson doesn't have any content yet.
                  </p>
                  {user?.uid === lesson.teacherId && (
                    <button
                      onClick={() => onEdit(lesson)}
                      className="mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
                    >
                      <Edit className="w-4 h-4 inline mr-2" />
                      Add Content
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-xl mb-6">Discussion ({comments.length})</h3>
              
              {/* Add Comment */}
              {user && (
                <div className="mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {userData?.fullName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment or question..."
                        className={`w-full rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] ${
                          theme === 'dark' 
                            ? 'bg-gray-800 border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } border`}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={handleSubmitComment}
                          disabled={!comment.trim()}
                          className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium disabled:opacity-50"
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className={`p-4 rounded-xl border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {comment.userName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">{comment.userName}</span>
                            <span className={`text-sm ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <button className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className={`flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}>
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-sm">{comment.likes || 0}</span>
                          </button>
                          <button className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}>
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Attachments Tab */}
          <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'attachments' ? '' : 'hidden'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lesson.attachments && lesson.attachments.length > 0 ? (
                lesson.attachments.map((attachment, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-xl border overflow-hidden hover:shadow-lg transition-all ${
                      theme === 'dark' 
                        ? 'border-gray-700 bg-gray-800 hover:border-gray-600' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            attachment.type === 'pdf' ? 'bg-red-500/20' :
                            attachment.type === 'video' ? 'bg-blue-500/20' :
                            attachment.type === 'code' ? 'bg-green-500/20' :
                            attachment.type === 'link' ? 'bg-purple-500/20' :
                            'bg-amber-500/20'
                          }`}>
                            {getFileIcon(attachment.type)}
                          </div>
                          <div>
                            <h4 className="font-bold">{attachment.name}</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {attachment.type.toUpperCase()}
                              {attachment.size && ` • ${attachment.size}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-lg ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={attachment.url}
                            download
                            className={`p-2 rounded-lg ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {attachment.url.length > 60 ? `${attachment.url.substring(0, 60)}...` : attachment.url}
                      </p>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block w-full py-3 text-center rounded-lg font-medium ${
                          attachment.type === 'pdf' ? 'bg-red-500 hover:bg-red-600' :
                          attachment.type === 'video' ? 'bg-blue-500 hover:bg-blue-600' :
                          attachment.type === 'code' ? 'bg-green-500 hover:bg-green-600' :
                          attachment.type === 'link' ? 'bg-purple-500 hover:bg-purple-600' :
                          'bg-amber-500 hover:bg-amber-600'
                        } text-white`}
                      >
                        Open {attachment.type === 'pdf' ? 'PDF' : 
                              attachment.type === 'video' ? 'Video' : 
                              attachment.type === 'code' ? 'Code File' : 
                              attachment.type === 'link' ? 'Link' : 'Image'}
                      </a>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Resources Available</h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    This lesson doesn't have any attachments or resources yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Tab */}
          <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'info' ? '' : 'hidden'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lesson Details */}
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Lesson Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Created</span>
                    <p className="font-medium">{formatDate(lesson.createdAt)}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Last Updated</span>
                    <p className="font-medium">{lesson.updatedAt ? formatDate(lesson.updatedAt) : 'Never'}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Category</span>
                    <p className="font-medium">{lesson.category}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Language</span>
                    <p className="font-medium">{lesson.language?.toUpperCase() || 'EN'}</p>
                  </div>
                  <div>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Estimated Time</span>
                    <p className="font-medium">{lesson.estimatedTime}</p>
                  </div>
                </div>
              </div>

              {/* Teacher Info */}
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <User className="w-5 h-5" /> Teacher Information
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                    {lesson.teacherName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{lesson.teacherName}</h4>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Teacher</p>
                  </div>
                </div>
                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center justify-center gap-2 hover:from-blue-600 hover:to-cyan-600">
                  <MessageCircle className="w-4 h-4" />
                  Contact Teacher
                </button>
              </div>

              {/* Prerequisites */}
              {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-amber-50'}`}>
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5" /> Prerequisites
                  </h3>
                  <div className="space-y-3">
                    {lesson.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/30">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                          <Star className="w-4 h-4" />
                        </div>
                        <span>{prereq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rate This Lesson */}
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-purple-50'}`}>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5" /> Rate This Lesson
                </h3>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold mb-2">{rating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateLesson(star)}
                        className={`text-2xl ${star <= userRating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Based on {lesson.totalRatings || 0} ratings
                  </p>
                </div>
                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium">
                  Submit Rating
                </button>
              </div>

              {/* Related Lessons */}
              {relatedLessons.length > 0 && (
                <div className={`rounded-xl border p-6 lg:col-span-2 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                    <Puzzle className="w-5 h-5" /> Related Lessons
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedLessons.map((relatedLesson, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border cursor-pointer hover:shadow-lg transition-all ${
                          theme === 'dark' 
                            ? 'border-gray-700 bg-gray-800 hover:border-gray-600' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${relatedLesson.color}20`, color: relatedLesson.color }}
                          >
                            {relatedLesson.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm line-clamp-1">{relatedLesson.title}</h4>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              by {relatedLesson.teacherName}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm mb-3 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {relatedLesson.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(relatedLesson.difficulty)} text-white`}>
                            {relatedLesson.difficulty}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analytics Tab */}
          <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'analytics' ? '' : 'hidden'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stats Cards */}
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Lesson Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span>Total Views</span>
                    <span className="font-bold text-lg">{viewCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span>Total Students</span>
                    <span className="font-bold text-lg">{studentCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span>Completion Rate</span>
                    <span className="font-bold text-lg">{(studentCount > 0 ? (studentCount / viewCount * 100) : 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <span>Average Rating</span>
                    <span className="font-bold text-lg">{rating.toFixed(1)}/5</span>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Engagement Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Content Engagement</span>
                      <span className="font-bold">85%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Resource Downloads</span>
                      <span className="font-bold">42%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '42%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Student Retention</span>
                      <span className="font-bold">78%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '78%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Progress */}
              <div className={`rounded-xl border p-6 lg:col-span-2 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" /> Student Progress Overview
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className="py-3 px-4 text-left">Student</th>
                        <th className="py-3 px-4 text-left">Progress</th>
                        <th className="py-3 px-4 text-left">Last Active</th>
                        <th className="py-3 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <tr key={item} className={`border-b ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                              <span>Student {item}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-32 h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${Math.random() * 100}%` }} />
                              </div>
                              <span>{Math.floor(Math.random() * 100)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">2 hours ago</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${Math.random() > 0.5 ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                              {Math.random() > 0.5 ? 'Active' : 'In Progress'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Students Tab */}
          <div className={`flex-1 overflow-y-auto p-6 ${activeTab === 'students' ? '' : 'hidden'}`}>
            <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Users className="w-5 h-5" /> Enrolled Students ({studentCount})
                </h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      className={`pl-10 pr-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <button className={`px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'border-gray-600 hover:bg-gray-700' 
                      : 'border-gray-300 hover:bg-gray-200'
                  }`}>
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="py-3 px-4 text-left">Student</th>
                      <th className="py-3 px-4 text-left">Email</th>
                      <th className="py-3 px-4 text-left">Enrolled</th>
                      <th className="py-3 px-4 text-left">Progress</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.students?.map((_studentId, index) => (
                      <tr key={index} className={`border-b ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                              S
                            </div>
                            <div>
                              <div className="font-medium">Student {index + 1}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Class 10-A
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          student{index + 1}@school.edu
                        </td>
                        <td className="py-3 px-4">
                          {formatDate(new Date(Date.now() - index * 86400000))}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-24 h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${Math.random() * 100}%` }} />
                            </div>
                            <span className="text-sm">{Math.floor(Math.random() * 100)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            Math.random() > 0.5 
                              ? 'bg-green-500/20 text-green-500' 
                              : Math.random() > 0.3 
                              ? 'bg-yellow-500/20 text-yellow-500' 
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {Math.random() > 0.5 ? 'Active' : Math.random() > 0.3 ? 'In Progress' : 'Needs Help'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button className={`p-2 rounded-lg ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}>
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button className={`p-2 rounded-lg ${
                              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}>
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-bold mb-2">No Students Enrolled</h4>
                          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            No students have enrolled in this lesson yet.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className={`w-80 border-l overflow-y-auto ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} p-6`}>
            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" />
                  Start Lesson
                </button>
                <button className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download All
                </button>
                {user?.uid === lesson.teacherId && (
                  <>
                    <button
                      onClick={() => onEdit(lesson)}
                      className="w-full p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Lesson
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this lesson?')) {
                          onDelete(lesson.id);
                        }
                      }}
                      className="w-full p-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Lesson
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Lesson Stats */}
            <div className={`mb-8 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border'}`}>
              <h3 className="font-bold mb-3">Lesson Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Completion Rate</span>
                  <span className="font-bold">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Avg. Time Spent</span>
                  <span className="font-bold">45min</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Questions Asked</span>
                  <span className="font-bold">23</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Assignments Submitted</span>
                  <span className="font-bold">15</span>
                </div>
              </div>
            </div>

            {/* Up Next */}
            <div className={`mb-8 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border'}`}>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Rocket className="w-4 h-4" /> Up Next
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    🧠
                  </div>
                  <div>
                    <div className="font-medium text-sm">Advanced Concepts</div>
                    <div className="text-xs text-gray-500">Next in series</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white">
                    🎯
                  </div>
                  <div>
                    <div className="font-medium text-sm">Practice Exercises</div>
                    <div className="text-xs text-gray-500">5 exercises</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border'}`}>
              <h3 className="font-bold mb-3">Lesson Tags</h3>
              <div className="flex flex-wrap gap-2">
                {lesson.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Lesson ID: </span>
              <code className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">{lesson.id.substring(0, 8)}...</code>
            </div>
            <div className="text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Updated: </span>
              <span>{lesson.updatedAt ? formatTimeAgo(lesson.updatedAt) : 'Never'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
              <Printer className="w-4 h-4 inline mr-2" />
              Print
            </button>
            <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Mark Complete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
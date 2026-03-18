import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Save, Clock, BookOpen,
  Tag, Target,
  Eye, Users, Search, Edit, Trash2,
  RefreshCw, ChevronDown,
  ChevronUp, Star, 
  Calendar, User, Shield,
  BarChart3, CheckCircle, AlertCircle, 
  FileText, 
  Globe, Lock,
  Heart, Bookmark
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import TipTapEditor from "../components/TipTapEditor";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

// ============ ИНТЕРФЕЙСИ ============

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
  color?: string;
  icon?: string;
  status: 'draft' | 'published';
  tags: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: 'pdf' | 'video' | 'code' | 'link' | 'image';
    size?: string;
  }>;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visibility: 'public' | 'community' | 'private';
  language: 'en' | 'bg' | 'es';
  prerequisites?: string[];
  learningObjectives?: string[];
  views?: number;
  likes?: string[];
  favorites?: string[];
  bookmarks?: string[];
  students?: string[];
  rating?: number;
  totalRatings?: number;
  communityId?: string;
  communityName?: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  memberCount: number;
}

interface TeacherLessonsProps {
  teacherId: string;
  isTeacherOrAdmin: boolean;
  onStatsChange?: (stats: { total: number; published: number; draft: number }) => void;
  onLessonsChange?: (lessons: Lesson[]) => void;
}

// ============ ЦВЕТОВА СХЕМА ============
const colors = {
  primary: "#3B82F6",    // синьо
  secondary: "#F97316",  // оранжево
  accent: "#22C55E",     // зелено
  danger: "#EF4444"      // червено (само за грешки)
};

// ============ ПОМОЩНИ ФУНКЦИИ ============

const getDifficultyColor = (difficulty: string): string => {
  switch(difficulty) {
    case 'beginner': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/20';
    case 'intermediate': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/20';
    case 'advanced': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/20';
    default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-500/20';
  }
};

const getStatusColor = (status: string): string => {
  switch(status) {
    case 'published': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/20';
    case 'draft': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/20';
    default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-500/20';
  }
};

const getVisibilityIcon = (visibility: string) => {
  switch(visibility) {
    case 'public': return <Globe className="w-4 h-4" />;
    case 'community': return <Users className="w-4 h-4" />;
    case 'private': return <Lock className="w-4 h-4" />;
    default: return <Globe className="w-4 h-4" />;
  }
};

const formatDate = (timestamp: any): string => {
  try {
    if (!timestamp) return 'No date';
    if (timestamp?.toMillis) {
      return new Date(timestamp.toMillis()).toLocaleDateString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    return 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

// ============ СТАТИСТИЧЕСКА КАРТА ============
const StatsCard = ({ title, value, color, theme}: { title: string; value: number; color: 'blue' | 'green' | 'orange'; theme: string; t?: any }) => {
  const colorClasses = {
    blue: theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
    green: theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
    orange: theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600',
  };

  const getIcon = () => {
    switch(color) {
      case 'blue': return <BarChart3 className="w-5 h-5" />;
      case 'green': return <CheckCircle className="w-5 h-5" />;
      case 'orange': return <FileText className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <div className={`rounded-2xl p-6 border ${
      theme === 'dark'
        ? 'bg-gray-900/80 border-white/10'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm opacity-70">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {getIcon()}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

// ============ ФИЛТЪР БУТОН ============
const FilterButton = ({ label, active, onClick, count, theme }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-blue-500 text-white'
        : theme === 'dark' 
          ? 'bg-white/5 hover:bg-white/10' 
          : 'bg-gray-100 hover:bg-gray-200'
    }`}
  >
    {label} {count !== undefined && <span className="ml-1 opacity-70">({count})</span>}
  </button>
);

// ============ КОМПОНЕНТ ЗА ЕЛЕМЕНТ ОТ СПИСЪК ============
const LessonListItem = ({ lesson, theme, onView, onEdit, onDelete, t }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden ${
        theme === 'dark'
          ? 'bg-gray-900/80 border-white/10'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Основен ред */}
      <div 
        className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Заглавие и описание */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold truncate">{lesson.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(lesson.status)}`}>
                {t?.(lesson.status) || lesson.status}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${getDifficultyColor(lesson.difficulty)}`}>
                {t?.(lesson.difficulty) || lesson.difficulty}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-500 flex items-center gap-1">
                {getVisibilityIcon(lesson.visibility)}
                {t?.(lesson.visibility) || lesson.visibility}
              </span>
            </div>
            <p className="text-sm opacity-70 line-clamp-1">{lesson.description}</p>
          </div>

          {/* Статистика */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs opacity-70">{t?.('views') || 'Views'}</div>
              <div className="font-bold text-sm">{lesson.views || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-70">{t?.('rating') || 'Rating'}</div>
              <div className="font-bold text-sm flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                {(lesson.rating || 0).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Време */}
          <div className="flex items-center gap-1 min-w-[80px]">
            <Clock className="w-3 h-3 opacity-70" />
            <span className="text-xs">{lesson.estimatedTime || '1h'}</span>
          </div>

          {/* Дата */}
          <div className="text-xs opacity-70 min-w-[80px]">
            {formatDate(lesson.createdAt)}
          </div>

          {/* Действия */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onView(lesson)}
              className={`p-1.5 rounded-lg ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
              title={t?.('view') || 'View'}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(lesson)}
              className={`p-1.5 rounded-lg ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
              title={t?.('edit') || 'Edit'}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(lesson.id)}
              className={`p-1.5 rounded-lg ${
                theme === 'dark' ? 'hover:bg-white/10 text-red-400' : 'hover:bg-gray-100 text-red-500'
              }`}
              title={t?.('delete') || 'Delete'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1.5 rounded-lg ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Разширени детайли */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}
          >
            <div className="p-4 space-y-3">
              {/* Тагове и категория */}
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 opacity-70" />
                  <div className="flex flex-wrap gap-2">
                    {lesson.tags?.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10">
                        {tag}
                      </span>
                    ))}
                    {(!lesson.tags || lesson.tags.length === 0) && (
                      <span className="text-xs opacity-70">{t?.('no_tags') || 'No tags'}</span>
                    )}
                  </div>
                </div>
                {lesson.communityName && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-70" />
                    <span className="text-sm">{lesson.communityName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(lesson.visibility)}
                  <span className="text-sm">
                    {lesson.visibility === 'public' && (t?.('public') || 'Public')}
                    {lesson.visibility === 'community' && (t?.('community') || 'Community')}
                    {lesson.visibility === 'private' && (t?.('private') || 'Private')}
                  </span>
                </div>
              </div>

              {/* Learning Objectives */}
              {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 opacity-70">{t?.('learning_objectives') || 'Learning Objectives'}:</h4>
                  <ul className="list-disc list-inside space-y-0.5">
                    {lesson.learningObjectives.map((obj: string, idx: number) => (
                      <li key={idx} className="text-xs opacity-70">{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prerequisites */}
              {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-1 opacity-70">{t?.('prerequisites') || 'Prerequisites'}:</h4>
                  <ul className="list-disc list-inside space-y-0.5">
                    {lesson.prerequisites.map((prereq: string, idx: number) => (
                      <li key={idx} className="text-xs opacity-70">{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============ МОДАЛ ЗА ПРЕГЛЕД НА УРОК ============
const LessonViewModal = ({ lesson, onClose, onEdit, onDelete, theme, t, user }: any) => {
  const [activeTab, setActiveTab] = useState<'content' | 'info'>('content');
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(lesson.likes?.length || 0);
  const [favoriteCount, setFavoriteCount] = useState(lesson.favorites?.length || 0);
  const [viewCount, setViewCount] = useState(lesson.views || 0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [rating, setRating] = useState(lesson.rating || 0);
  const [totalRatings, setTotalRatings] = useState(lesson.totalRatings || 0);

  useEffect(() => {
    if (user?.uid !== lesson.teacherId) {
      const updateViews = async () => {
        try {
          await updateDoc(doc(db, "lessons", lesson.id), {
            views: increment(1)
          });
          setViewCount((prev: number) => prev + 1);
        } catch (error) {
          console.error("Error updating views:", error);
        }
      };
      updateViews();
    }

    if (user && lesson.likes?.includes(user.uid)) {
      setIsLiked(true);
    }
    if (user && lesson.favorites?.includes(user.uid)) {
      setIsFavorite(true);
    }
    if (user && lesson.bookmarks?.includes(user.uid)) {
      setIsBookmarked(true);
    }
  }, [lesson.id, user?.uid, lesson.teacherId]);

  const handleLike = async () => {
    if (!user) {
      alert(t?.('login_to_like') || 'Please login to like this lesson');
      return;
    }

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev: number) => newLikedState ? prev + 1 : prev - 1);

    try {
      const lessonRef = doc(db, "lessons", lesson.id);
      if (newLikedState) {
        await updateDoc(lessonRef, {
          likes: arrayUnion(user.uid)
        });
      } else {
        await updateDoc(lessonRef, {
          likes: arrayRemove(user.uid)
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      setIsLiked(!newLikedState);
      setLikeCount((prev: number) => newLikedState ? prev - 1 : prev + 1);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      alert(t?.('login_to_favorite') || 'Please login to add to favorites');
      return;
    }

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    setFavoriteCount((prev: number) => newFavoriteState ? prev + 1 : prev - 1);

    try {
      const lessonRef = doc(db, "lessons", lesson.id);
      if (newFavoriteState) {
        await updateDoc(lessonRef, {
          favorites: arrayUnion(user.uid)
        });
      } else {
        await updateDoc(lessonRef, {
          favorites: arrayRemove(user.uid)
        });
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
      setIsFavorite(!newFavoriteState);
      setFavoriteCount((prev: number) => newFavoriteState ? prev - 1 : prev + 1);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      alert(t?.('login_to_bookmark') || 'Please login to bookmark');
      return;
    }

    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);

    try {
      const lessonRef = doc(db, "lessons", lesson.id);
      if (newBookmarkState) {
        await updateDoc(lessonRef, {
          bookmarks: arrayUnion(user.uid)
        });
      } else {
        await updateDoc(lessonRef, {
          bookmarks: arrayRemove(user.uid)
        });
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
      setIsBookmarked(!newBookmarkState);
    }
  };

  const handleRate = async (ratingValue: number) => {
    if (!user) {
      alert(t?.('login_to_rate') || 'Please login to rate this lesson');
      return;
    }

    if (user.uid === lesson.teacherId) {
      alert(t?.('cannot_rate_own') || 'You cannot rate your own lesson');
      return;
    }

    setUserRating(ratingValue);
    
    const newTotalRatings = totalRatings + 1;
    const newRating = (rating * totalRatings + ratingValue) / newTotalRatings;
    
    setRating(newRating);
    setTotalRatings(newTotalRatings);

    try {
      await updateDoc(doc(db, "lessons", lesson.id), {
        rating: newRating,
        totalRatings: newTotalRatings
      });
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  };

  const formatDateFull = (timestamp: any) => {
    if (!timestamp) return t?.('unknown') || 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return t?.('invalid_date') || 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          theme === 'dark' 
            ? 'bg-gray-900 border-white/10' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="text-2xl font-bold">{lesson.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                    {t?.(lesson.status) || lesson.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                    {t?.(lesson.difficulty) || lesson.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 flex items-center gap-1">
                    {getVisibilityIcon(lesson.visibility)}
                    {t?.(lesson.visibility) || lesson.visibility}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {lesson.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" /> {lesson.teacherName}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {formatDateFull(lesson.createdAt)}
                </span>
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4" /> {lesson.category}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {lesson.estimatedTime}
                </span>
                {lesson.communityName && (
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> {lesson.communityName}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
              title={t?.('close') || 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{viewCount} {t?.('views') || 'views'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{lesson.students?.length || 0} {t?.('students') || 'students'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    disabled={user?.uid === lesson.teacherId}
                    className={`p-0.5 ${user?.uid === lesson.teacherId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    title={t?.('rate') || 'Rate'}
                  >
                    <Star 
                      className={`w-4 h-4 ${
                        (userRating || rating) >= star 
                          ? 'fill-yellow-500 text-yellow-500' 
                          : 'text-gray-400'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm">
                {rating.toFixed(1)} ({totalRatings} {t?.('ratings') || 'ratings'})
              </span>
            </div>
            
            {/* Бутон за любими */}
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isFavorite ? 'text-red-500' : ''
              }`}
              title={t?.('favorite') || 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm">{favoriteCount}</span>
            </button>

            {/* Бутон за отметки */}
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isBookmarked ? 'text-blue-500' : ''
              }`}
              title={t?.('bookmark') || 'Bookmark'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-blue-500 text-blue-500' : ''}`} />
            </button>

            {/* Бутон за харесвания */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isLiked ? 'text-yellow-500' : ''
              }`}
              title={t?.('like') || 'Like'}
            >
              <Star className={`w-4 h-4 ${isLiked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'content'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark' 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-gray-100'
              }`}
            >
              {t?.('content') || 'Content'}
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'info'
                  ? 'bg-blue-500 text-white'
                  : theme === 'dark' 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-gray-100'
              }`}
            >
              {t?.('details') || 'Details'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'content' ? (
            <div>
              {/* Tags */}
              {lesson.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {lesson.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${
                        theme === 'dark' 
                          ? 'bg-white/10' 
                          : 'bg-gray-100'
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
                  theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    {t?.('learning_objectives') || 'Learning Objectives'}
                  </h3>
                  <div className="space-y-3">
                    {lesson.learningObjectives.map((objective: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span>{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: lesson.content || t?.('no_content') || '*No content available*' }} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Prerequisites */}
              {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                <div className={`p-6 rounded-xl border ${
                  theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-orange-50'
                }`}>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    {t?.('prerequisites') || 'Prerequisites'}
                  </h3>
                  <div className="space-y-3">
                    {lesson.prerequisites.map((prereq: string, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-orange-500">•</span>
                        <span>{prereq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Info */}
              <div className={`p-6 rounded-xl border ${
                theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t?.('teacher') || 'Teacher'}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
                    {lesson.teacherName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold">{lesson.teacherName}</div>
                    <div className="text-sm text-gray-500">{t?.('lesson_creator') || 'Lesson Creator'}</div>
                  </div>
                </div>
              </div>

              {/* Actions for Teacher */}
              {user?.uid === lesson.teacherId && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onEdit(lesson)}
                    className="flex-1 py-3 rounded-lg bg-blue-500 text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t?.('edit_lesson') || 'Edit Lesson'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(t?.('confirm_delete_lesson') || 'Delete this lesson?')) {
                        onDelete(lesson.id);
                      }
                    }}
                    className="flex-1 py-3 rounded-lg bg-red-500 text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t?.('delete') || 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ============ МОДАЛ ЗА ФОРМА ЗА УРОК ============
const LessonFormModal = ({ editingLesson, onClose, onSave, theme, t, user, userData }: any) => {
  const categories = [
    'Programming', 'Mathematics', 'Science', 'History', 
    'Languages', 'Arts', 'Business', 'Technology'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'es', name: 'Spanish' }
  ];

  const visibilityOptions = [
    { value: 'public', label: t?.('public') || 'Public', icon: <Globe className="w-4 h-4" /> },
    { value: 'community', label: t?.('community') || 'Community', icon: <Users className="w-4 h-4" /> },
    { value: 'private', label: t?.('private') || 'Private', icon: <Lock className="w-4 h-4" /> }
  ];

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    content: string;
    category: string;
    status: 'draft' | 'published';
    tags: string[];
    estimatedTime: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    visibility: 'public' | 'community' | 'private';
    language: 'en' | 'bg' | 'es';
    prerequisites: string[];
    learningObjectives: string[];
    communityId: string;
  }>({
    title: '',
    description: '',
    content: '',
    category: 'Programming',
    status: 'draft',
    tags: [],
    estimatedTime: '1 hour',
    difficulty: 'beginner',
    visibility: 'public',
    language: 'en',
    prerequisites: [],
    learningObjectives: [],
    communityId: ''
  });

  const [newTag, setNewTag] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Зареждане на общностите на учителя
  useEffect(() => {
    const loadTeacherCommunities = async () => {
      if (!user) return;
      
      setLoadingCommunities(true);
      try {
        const communitiesQuery = query(
          collection(db, "communities"),
          where("teacherId", "==", user.uid)
        );
        
        const snapshot = await getDocs(communitiesQuery);
        const communitiesData: Community[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          communitiesData.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            teacherId: data.teacherId,
            memberCount: data.memberCount || 0
          });
        });
        
        setCommunities(communitiesData);
      } catch (error) {
        console.error("Error loading communities:", error);
      } finally {
        setLoadingCommunities(false);
      }
    };

    loadTeacherCommunities();
  }, [user]);

  useEffect(() => {
    if (editingLesson) {
      setFormData({
        title: editingLesson.title || '',
        description: editingLesson.description || '',
        content: editingLesson.content || '',
        category: editingLesson.category || 'Programming',
        status: editingLesson.status || 'draft',
        tags: editingLesson.tags || [],
        estimatedTime: editingLesson.estimatedTime || '1 hour',
        difficulty: editingLesson.difficulty || 'beginner',
        visibility: editingLesson.visibility || 'public',
        language: editingLesson.language || 'en',
        prerequisites: editingLesson.prerequisites || [],
        learningObjectives: editingLesson.learningObjectives || [],
        communityId: editingLesson.communityId || ''
      });
    }
  }, [editingLesson]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim() && !formData.prerequisites?.includes(newPrerequisite.trim())) {
      setFormData({
        ...formData,
        prerequisites: [...(formData.prerequisites || []), newPrerequisite.trim()]
      });
      setNewPrerequisite('');
    }
  };

  const handleAddObjective = () => {
    if (newObjective.trim() && !formData.learningObjectives?.includes(newObjective.trim())) {
      setFormData({
        ...formData,
        learningObjectives: [...(formData.learningObjectives || []), newObjective.trim()]
      });
      setNewObjective('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setUploadStatus(t?.('error_title_required') || 'Please enter a lesson title');
      return;
    }

    if (formData.visibility === 'community' && !formData.communityId) {
      setUploadStatus(t?.('error_community_required') || 'Please select a community for this lesson');
      return;
    }

    setIsSaving(true);
    try {
      const lessonData = {
        ...formData,
        teacherId: user?.uid,
        teacherName: userData?.fullName || user?.email?.split('@')[0] || t?.('teacher') || 'Teacher',
        teacherAvatar: userData?.avatar || '',
        createdAt: editingLesson ? editingLesson.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: editingLesson?.views || 0,
        likes: editingLesson?.likes || [],
        favorites: editingLesson?.favorites || [],
        bookmarks: editingLesson?.bookmarks || [],
        students: editingLesson?.students || [],
        rating: editingLesson?.rating || 0,
        totalRatings: editingLesson?.totalRatings || 0,
        color: editingLesson?.color || colors.primary,
        icon: editingLesson?.icon || '📚',
        // 🔥 КЛЮЧОВОТО - ако няма communityId, слагаме null, а не undefined
        communityId: formData.communityId || null,
        communityName: formData.communityId ? communities.find(c => c.id === formData.communityId)?.name || null : null
      };

      await onSave(lessonData);
      setUploadStatus('✅ ' + (t?.('lesson_saved') || 'Lesson saved!'));
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setUploadStatus('❌ ' + (t?.('error_saving_lesson') || 'Error saving lesson'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, callback: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  // Стилове за select в тъмен режим
  const selectClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 text-white [&>option]:bg-gray-800 [&>option]:text-white'
    : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          theme === 'dark' 
            ? 'bg-gray-900 border-white/10' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {editingLesson ? (t?.('edit_lesson') || 'Edit Lesson') : (t?.('create_lesson') || 'Create New Lesson')}
                </h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {editingLesson 
                    ? (t?.('edit_lesson_desc') || 'Update your lesson details') 
                    : (t?.('create_lesson_desc') || 'Add a new lesson to your curriculum')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
              } transition-colors`}
              title={t?.('close') || 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Message */}
          {uploadStatus && (
            <div className={`mb-6 p-3 rounded-lg ${
              uploadStatus.includes('✅') 
                ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
              {uploadStatus}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t?.('title') || 'Title'} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                  placeholder={t?.('enter_title') || "Enter lesson title..."}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t?.('category') || 'Category'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${selectClasses}`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{t?.(cat.toLowerCase()) || cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t?.('description') || 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white border border-gray-300'
                }`}
                placeholder={t?.('enter_description') || "Brief description of what students will learn..."}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t?.('content') || 'Content'}
              </label>
              <div className={`rounded-xl border overflow-hidden ${
                theme === 'dark' ? 'border-white/10' : 'border-gray-300'
              }`}>
                <TipTapEditor
                  content={formData.content}
                  onChange={(content) => setFormData({...formData, content})}
                  placeholder={t?.('editor_placeholder') || "Start writing your lesson content here..."}
                />
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {t?.('learning_objectives') || 'Learning Objectives'}
                </label>
              </div>
              <div className="space-y-2 mb-3">
                {formData.learningObjectives?.map((obj, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <span className="text-sm">{obj}</span>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        learningObjectives: formData.learningObjectives?.filter(o => o !== obj)
                      })}
                      className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                      title={t?.('remove') || 'Remove'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddObjective)}
                  placeholder={t?.('add_objective') || "Add a learning objective..."}
                  className={`flex-1 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                />
                <button
                  onClick={handleAddObjective}
                  className="px-4 py-3 rounded-xl bg-blue-500 text-white"
                  title={t?.('add') || 'Add'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {t?.('tags') || 'Tags'}
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
                      title={t?.('remove') || 'Remove'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddTag)}
                  placeholder={t?.('add_tag') || "Add tag..."}
                  className={`flex-1 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-3 rounded-xl bg-blue-500 text-white"
                  title={t?.('add') || 'Add'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  {t?.('prerequisites') || 'Prerequisites'}
                </label>
              </div>
              <div className="space-y-2 mb-3">
                {formData.prerequisites?.map((prereq, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                    <span className="text-sm">{prereq}</span>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        prerequisites: formData.prerequisites?.filter(p => p !== prereq)
                      })}
                      className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                      title={t?.('remove') || 'Remove'}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPrerequisite}
                  onChange={(e) => setNewPrerequisite(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleAddPrerequisite)}
                  placeholder={t?.('add_prerequisite') || "What should students know before starting?"}
                  className={`flex-1 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                />
                <button
                  onClick={handleAddPrerequisite}
                  className="px-4 py-3 rounded-xl bg-blue-500 text-white"
                  title={t?.('add') || 'Add'}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t?.('duration') || 'Duration'}
                </label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
                  className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                  placeholder={t?.('duration_placeholder') || "e.g., 1 hour"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t?.('difficulty') || 'Difficulty'}
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value as any})}
                  className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${selectClasses}`}
                >
                  <option value="beginner">{t?.('beginner') || 'Beginner'}</option>
                  <option value="intermediate">{t?.('intermediate') || 'Intermediate'}</option>
                  <option value="advanced">{t?.('advanced') || 'Advanced'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t?.('language') || 'Language'}
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value as any})}
                  className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${selectClasses}`}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t?.('visibility') || 'Visibility'} *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({...formData, visibility: option.value as any})}
                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                      formData.visibility === option.value
                        ? option.value === 'public' ? 'bg-green-500/20 border-green-500 text-green-500' :
                          option.value === 'community' ? 'bg-blue-500/20 border-blue-500 text-blue-500' :
                          'bg-purple-500/20 border-purple-500 text-purple-500'
                        : theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
              {formData.visibility === 'public' && (
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('public_visibility_desc') || "This lesson will be visible to all users."}
                </p>
              )}
              {formData.visibility === 'private' && (
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('private_visibility_desc') || "This lesson will be visible only to you."}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">{t?.('status') || 'Status'}</label>
              <div className="grid grid-cols-2 gap-2 max-w-xs">
                {(['draft', 'published'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, status})}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.status === status
                        ? status === 'draft' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                        : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                    }`}
                  >
                    {t?.(status) || status}
                  </button>
                ))}
              </div>
            </div>

            {/* Community Selection (only for community visibility) */}
            {formData.visibility === 'community' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t?.('select_community') || 'Select Community'} *
                </label>
                {loadingCommunities ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : communities.length === 0 ? (
                  <div className={`p-4 rounded-lg text-center ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <p className="text-sm mb-2">{t?.('no_communities') || "You don't have any communities yet."}</p>
                    <p className="text-xs opacity-70">{t?.('create_community_first') || "Create a community first to share lessons with it."}</p>
                  </div>
                ) : (
                  <select
                    value={formData.communityId}
                    onChange={(e) => setFormData({...formData, communityId: e.target.value})}
                    className={`w-full rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${selectClasses}`}
                  >
                    <option value="">{t?.('select_community_placeholder') || "Select a community..."}</option>
                    {communities.map(community => (
                      <option key={community.id} value={community.id}>
                        {community.name} ({community.memberCount} {t?.('members') || 'members'})
                      </option>
                    ))}
                  </select>
                )}
                <p className={`text-xs mt-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {t?.('community_visibility_desc') || "This lesson will be visible only to members of the selected community."}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
              >
                {t?.('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !formData.title.trim() || (formData.visibility === 'community' && !formData.communityId)}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t?.('saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingLesson ? (t?.('update') || 'Update') : (t?.('create') || 'Create')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ============ ОСНОВЕН КОМПОНЕНТ ============
export default function TeacherLessons({ teacherId, isTeacherOrAdmin, onStatsChange, onLessonsChange }: TeacherLessonsProps) {
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  // State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState({ message: "", type: "" });
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'community' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'rating'>('date');
  
  // Modal State
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Зареждане на уроци
  const loadLessons = async () => {
    if (!teacherId) {
      setLessons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "lessons"),
        where("teacherId", "==", teacherId),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lessonsData: Lesson[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          lessonsData.push({
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            content: data.content || '',
            teacherId: data.teacherId,
            teacherName: data.teacherName || 'Teacher',
            teacherAvatar: data.teacherAvatar,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            category: data.category || 'Programming',
            color: data.color || colors.primary,
            icon: data.icon || '📚',
            status: data.status || 'draft',
            tags: data.tags || [],
            attachments: data.attachments || [],
            estimatedTime: data.estimatedTime || '1 hour',
            difficulty: data.difficulty || 'beginner',
            visibility: data.visibility || 'public',
            language: data.language || 'en',
            prerequisites: data.prerequisites || [],
            learningObjectives: data.learningObjectives || [],
            views: data.views || 0,
            likes: data.likes || [],
            favorites: data.favorites || [],
            bookmarks: data.bookmarks || [],
            students: data.students || [],
            rating: data.rating || 0,
            totalRatings: data.totalRatings || 0,
            communityId: data.communityId || null,
            communityName: data.communityName || null
          });
        });

        setLessons(lessonsData);
        
        // Изпращане на статистика
        if (onStatsChange) {
          onStatsChange({
            total: lessonsData.length,
            published: lessonsData.filter(l => l.status === 'published').length,
            draft: lessonsData.filter(l => l.status === 'draft').length
          });
        }

        if (onLessonsChange) {
          onLessonsChange(lessonsData);
        }

        setLoading(false);
      }, (error) => {
        console.error("Error loading lessons:", error);
        setLoading(false);
      });

      return () => unsubscribe();

    } catch (error) {
      console.error("Error loading lessons:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [teacherId]);

  // Запазване на урок
  const handleSaveLesson = async (lessonData: any) => {
    if (!user) return;

    try {
      if (editingLesson) {
        await updateDoc(doc(db, "lessons", editingLesson.id), {
          ...lessonData,
          updatedAt: serverTimestamp()
        });
        setUploadStatus({ 
          message: "✅ " + (t?.('lesson_updated') || "Lesson updated successfully!"), 
          type: "success" 
        });
      } else {
        await addDoc(collection(db, "lessons"), {
          ...lessonData,
          teacherId: user.uid,
          teacherName: userData?.fullName || user.email?.split('@')[0] || t?.('teacher') || "Teacher",
          teacherAvatar: userData?.avatar || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          views: 0,
          likes: [],
          favorites: [],
          bookmarks: [],
          students: [],
          rating: 0,
          totalRatings: 0
        });
        setUploadStatus({ 
          message: "✅ " + (t?.('lesson_created') || "Lesson created successfully!"), 
          type: "success" 
        });
      }
      
      setTimeout(() => setUploadStatus({ message: "", type: "" }), 3000);
      
    } catch (error) {
      console.error("Error saving lesson:", error);
      setUploadStatus({ 
        message: "❌ " + (t?.('error_saving_lesson') || "Error saving lesson!"), 
        type: "error" 
      });
      setTimeout(() => setUploadStatus({ message: "", type: "" }), 3000);
    }
  };

  // Изтриване на урок
  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm(t?.('confirm_delete_lesson') || "Are you sure you want to delete this lesson?")) return;
    
    try {
      await deleteDoc(doc(db, "lessons", lessonId));
      setUploadStatus({ 
        message: "✅ " + (t?.('lesson_deleted') || "Lesson deleted successfully!"), 
        type: "success" 
      });
      setTimeout(() => setUploadStatus({ message: "", type: "" }), 3000);
    } catch (error) {
      console.error("Error deleting lesson:", error);
      setUploadStatus({ 
        message: "❌ " + (t?.('error_deleting_lesson') || "Error deleting lesson!"), 
        type: "error" 
      });
      setTimeout(() => setUploadStatus({ message: "", type: "" }), 3000);
    }
  };

  // Филтриране и сортиране
  const filteredLessons = lessons
    .filter(lesson => {
      // Търсене
      const matchesSearch = searchTerm === '' || 
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Филтър по статус
      const matchesStatus = filterStatus === 'all' || lesson.status === filterStatus;
      
      // Филтър по трудност
      const matchesDifficulty = filterDifficulty === 'all' || lesson.difficulty === filterDifficulty;
      
      // Филтър по видимост
      const matchesVisibility = filterVisibility === 'all' || lesson.visibility === filterVisibility;
      
      return matchesSearch && matchesStatus && matchesDifficulty && matchesVisibility;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      }
      if (sortBy === 'views') {
        return (b.views || 0) - (a.views || 0);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

  // Статистика
  const stats = {
    total: lessons.length,
    published: lessons.filter(l => l.status === 'published').length,
    draft: lessons.filter(l => l.status === 'draft').length,
    totalViews: lessons.reduce((sum, l) => sum + (l.views || 0), 0),
    public: lessons.filter(l => l.visibility === 'public').length,
    community: lessons.filter(l => l.visibility === 'community').length,
    private: lessons.filter(l => l.visibility === 'private').length
  };

  if (!isTeacherOrAdmin) {
    return (
      <div className={`rounded-2xl p-12 border text-center ${
        theme === 'dark'
          ? 'bg-gray-900/80 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">
          {t?.('access_denied') || "Access Denied"}
        </h3>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {t?.('teacher_only') || "Only teachers can access this section."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{t?.('my_lessons') || 'My Lessons'}</h2>
          <span className={`px-3 py-1 rounded-full text-sm ${
            theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
          }`}>
            {stats.total} {t?.('total') || 'total'}
          </span>
        </div>
        <button
          onClick={() => {
            setEditingLesson(null);
            setShowLessonForm(true);
          }}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t?.('new_lesson') || "New Lesson"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title={t?.('total_lessons') || "Total Lessons"}
          value={stats.total}
          color="blue"
          theme={theme}
          t={t}
        />
        <StatsCard
          title={t?.('published') || "Published"}
          value={stats.published}
          color="green"
          theme={theme}
          t={t}
        />
        <StatsCard
          title={t?.('drafts') || "Drafts"}
          value={stats.draft}
          color="orange"
          theme={theme}
          t={t}
        />
        <StatsCard
          title={t?.('total_views') || "Total Views"}
          value={stats.totalViews}
          color="blue"
          theme={theme}
          t={t}
        />
      </div>

      {/* Status Message */}
      {uploadStatus.message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          uploadStatus.type === 'success' 
            ? theme === 'dark' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-200'
            : theme === 'dark' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {uploadStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {uploadStatus.message}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder={t?.('search_lessons') || "Search lessons..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-white border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton
            label={t?.('all') || "All"}
            active={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
            count={stats.total}
            theme={theme}
          />
          <FilterButton
            label={t?.('published') || "Published"}
            active={filterStatus === 'published'}
            onClick={() => setFilterStatus('published')}
            count={stats.published}
            theme={theme}
          />
          <FilterButton
            label={t?.('draft') || "Draft"}
            active={filterStatus === 'draft'}
            onClick={() => setFilterStatus('draft')}
            count={stats.draft}
            theme={theme}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as any)}
            className={`px-4 py-2 rounded-xl border text-sm ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">{t?.('all_difficulties') || "All Difficulties"}</option>
            <option value="beginner">{t?.('beginner') || "Beginner"}</option>
            <option value="intermediate">{t?.('intermediate') || "Intermediate"}</option>
            <option value="advanced">{t?.('advanced') || "Advanced"}</option>
          </select>

          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value as any)}
            className={`px-4 py-2 rounded-xl border text-sm ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">{t?.('all_visibility') || "All Visibility"}</option>
            <option value="public">{t?.('public') || "Public"}</option>
            <option value="community">{t?.('community') || "Community"}</option>
            <option value="private">{t?.('private') || "Private"}</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`px-4 py-2 rounded-xl border text-sm ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="date">{t?.('sort_by_date') || "Sort by Date"}</option>
            <option value="views">{t?.('sort_by_views') || "Sort by Views"}</option>
            <option value="rating">{t?.('sort_by_rating') || "Sort by Rating"}</option>
          </select>

          <button
            onClick={loadLessons}
            className={`p-2 rounded-xl ${
              theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={t?.('refresh') || "Refresh"}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Lessons List */}
      {!loading && filteredLessons.length === 0 ? (
        <div className={`rounded-2xl p-12 border text-center ${
          theme === 'dark'
            ? 'bg-gray-900/80 border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">
            {t?.('no_lessons_yet') || "No lessons yet"}
          </h3>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t?.('create_first_lesson') || "Create your first lesson to get started"}
          </p>
          <button
            onClick={() => {
              setEditingLesson(null);
              setShowLessonForm(true);
            }}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {t?.('create_first_lesson') || "Create First Lesson"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              theme={theme}
              onView={setViewingLesson}
              onEdit={(lesson: Lesson) => {
                setEditingLesson(lesson);
                setShowLessonForm(true);
              }}
              onDelete={handleDeleteLesson}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <LessonFormModal
          editingLesson={editingLesson}
          onClose={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
          onSave={handleSaveLesson}
          theme={theme}
          t={t}
          user={user}
          userData={userData}
        />
      )}

      {/* Lesson View Modal */}
      {viewingLesson && (
        <LessonViewModal
          lesson={viewingLesson}
          onClose={() => setViewingLesson(null)}
          onEdit={(lesson: Lesson) => {
            setViewingLesson(null);
            setEditingLesson(lesson);
            setShowLessonForm(true);
          }}
          onDelete={handleDeleteLesson}
          theme={theme}
          t={t}
          user={user}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, BookOpen, Calendar, User, Tag, 
  Edit, Trash2, Eye, 
  Clock,
  Users, Star, Target, Shield, 
  CheckCircle, Play, Heart, 
  Globe, Lock, EyeOff, 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";


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
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visibility: 'public' | 'private' | 'unlisted';
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
  const { user } = useAuth();
console.log(t)
  const [activeTab, setActiveTab] = useState<'content' | 'info'>('content');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(lesson.likes?.length || 0);
  const [viewCount, setViewCount] = useState(lesson.views || 0);
  const [studentCount, _setStudentCount] = useState(lesson.students?.length || 0);

  useEffect(() => {
    incrementViewCount();
  }, [lesson.id]);

  const incrementViewCount = async () => {
    if (user?.uid !== lesson.teacherId) {
      setViewCount(prev => prev + 1);
    }
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-500';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-500';
      case 'advanced': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
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
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold">{lesson.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                    {lesson.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    {getVisibilityIcon(lesson.visibility)}
                    {lesson.visibility}
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

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{viewCount} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{studentCount} students</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="text-sm">{lesson.rating?.toFixed(1) || '0'} rating</span>
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isLiked ? 'text-red-500' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likeCount}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'content'
                  ? 'bg-indigo-500 text-white'
                  : theme === 'dark' 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'info'
                  ? 'bg-indigo-500 text-white'
                  : theme === 'dark' 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-gray-100'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Details
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
                  {lesson.tags.map((tag, index) => (
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

              {/* Learning Objectives - ФИКС 1 */}
              {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                <div className={`mb-8 p-6 rounded-xl border ${
                  theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    Learning Objectives
                  </h3>
                  <div className="space-y-3">
                    {lesson.learningObjectives.map((objective, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Content */}
              {/* Main Content - БЕЗ Markdown */}
<div className="prose prose-lg max-w-none dark:prose-invert">
  <div className="whitespace-pre-wrap font-sans">
    {lesson.content || '*No content available*'}
  </div>
</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Prerequisites - ФИКС 2 */}
              {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                <div className={`p-6 rounded-xl border ${
                  theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-amber-50'
                }`}>
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Prerequisites
                  </h3>
                  <div className="space-y-3">
                    {lesson.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
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
                  Teacher
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                    {lesson.teacherName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold">{lesson.teacherName}</div>
                    <div className="text-sm text-gray-500">Lesson Creator</div>
                  </div>
                </div>
              </div>

              {/* Actions for Teacher */}
              {user?.uid === lesson.teacherId && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onEdit(lesson)}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Lesson
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this lesson?')) {
                        onDelete(lesson.id);
                      }
                    }}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="text-sm text-gray-500">
            ID: {lesson.id.substring(0, 8)}...
          </div>
          
          <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2">
            <Play className="w-4 h-4" />
            Start Lesson
          </button>
        </div>
      </motion.div>
    </div>
  );
}
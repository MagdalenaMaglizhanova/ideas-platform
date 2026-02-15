import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, X, Save, Clock, BookOpen,
  Tag, Target, FileText, GraduationCap, Globe,
  Lock, Eye, Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import TipTapEditor from "../components/TipTapEditor";
import { Timestamp, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  visibility: 'public' | 'private' | 'unlisted' | 'community';
  language?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
  communityId?: string; // ID на общността, ако е споделен
}

interface Community {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  memberCount: number;
}

interface LessonFormModalProps {
  editingLesson?: any;
  onClose: () => void;
  onSave: (lessonData: any) => Promise<void>;
}

const categories = [
  'Programming', 'Mathematics', 'Science', 'History', 
  'Languages', 'Arts', 'Business', 'Technology'
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'bg', name: 'Bulgarian' }
];

export default function LessonFormModal({ editingLesson, onClose, onSave }: LessonFormModalProps) {
  const { theme } = useTheme();
  const { user, userData } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    content: '',
    category: 'Programming',
    status: 'draft',
    tags: [],
    estimatedTime: '1 hour',
    difficulty: 'beginner',
    visibility: 'private',
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
        visibility: editingLesson.visibility || 'private',
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
      setUploadStatus('Please enter a lesson title');
      return;
    }

    // Валидация за community visibility
    if (formData.visibility === 'community' && !formData.communityId) {
      setUploadStatus('Please select a community for this lesson');
      return;
    }

    setIsSaving(true);
    try {
      const lessonData = {
        ...formData,
        teacherId: user?.uid,
        teacherName: userData?.fullName || user?.email?.split('@')[0] || 'Teacher',
        teacherAvatar: userData?.avatar || '',
        createdAt: editingLesson ? editingLesson.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        views: editingLesson?.views || 0,
        likes: editingLesson?.likes || [],
        students: editingLesson?.students || [],
        rating: editingLesson?.rating || 0,
        totalRatings: editingLesson?.totalRatings || 0,
        // Добавяме допълнителна информация за общността
        communityName: formData.visibility === 'community' && formData.communityId
          ? communities.find(c => c.id === formData.communityId)?.name
          : undefined
      };

      await onSave(lessonData);
      setUploadStatus('✅ Lesson saved!');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setUploadStatus('❌ Error saving lesson');
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

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'unlisted': return <Eye className="w-4 h-4" />;
      case 'community': return <Users className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return t?.('public') || 'Public';
      case 'private': return t?.('private') || 'Private';
      case 'unlisted': return t?.('unlisted') || 'Unlisted';
      case 'community': return t?.('community') || 'Community';
      default: return visibility;
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
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {editingLesson ? '✏️ Edit Lesson' : 'Create New Lesson'}
                </h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {editingLesson ? 'Update your lesson details' : 'Add a new lesson to your curriculum'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
              } transition-colors`}
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
                  <FileText className="w-4 h-4 inline mr-2" />
                  Title *
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
                  placeholder="Enter lesson title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Description
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
                placeholder="Brief description of what students will learn..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Content
              </label>
              <div className={`rounded-xl border overflow-hidden ${
                theme === 'dark' ? 'border-white/10' : 'border-gray-300'
              }`}>
                <TipTapEditor
                  content={formData.content}
                  onChange={(content) => setFormData({...formData, content})}
                  placeholder="Start writing your lesson content here..."
                />
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  <Target className="w-4 h-4 inline mr-2" />
                  Learning Objectives
                </label>
              </div>
              <div className="space-y-2 mb-3">
                {formData.learningObjectives?.map((obj, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span>{obj}</span>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        learningObjectives: formData.learningObjectives?.filter(o => o !== obj)
                      })}
                      className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                    >
                      <X className="w-4 h-4" />
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
                  placeholder="Add a learning objective..."
                  className={`flex-1 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                />
                <button
                  onClick={handleAddObjective}
                  className="px-4 py-3 rounded-xl bg-blue-500 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Tags
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500"
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
                  placeholder="Add tag..."
                  className={`flex-1 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-3 rounded-xl bg-blue-500 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Prerequisites
                </label>
              </div>
              <div className="space-y-2 mb-3">
                {formData.prerequisites?.map((prereq, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <span>{prereq}</span>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        prerequisites: formData.prerequisites?.filter(p => p !== prereq)
                      })}
                      className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                    >
                      <X className="w-4 h-4" />
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
                  placeholder="What should students know before starting?"
                  className={`flex-1 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                />
                <button
                  onClick={handleAddPrerequisite}
                  className="px-4 py-3 rounded-xl bg-blue-500 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                  placeholder="e.g., 1 hour"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value as any})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status & Visibility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['draft', 'published', 'archived'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({...formData, status})}
                      className={`py-2 rounded-lg text-sm font-medium ${
                        formData.status === status
                          ? status === 'draft' ? 'bg-yellow-500 text-white' :
                            status === 'published' ? 'bg-green-500 text-white' :
                            'bg-gray-500 text-white'
                          : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Visibility</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['public', 'private', 'unlisted', 'community'] as const).map(visibility => (
                    <button
                      key={visibility}
                      type="button"
                      onClick={() => setFormData({...formData, visibility, communityId: visibility === 'community' ? formData.communityId : ''})}
                      className={`py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                        formData.visibility === visibility
                          ? visibility === 'public' ? 'bg-green-500 text-white' :
                            visibility === 'private' ? 'bg-blue-500 text-white' :
                            visibility === 'unlisted' ? 'bg-yellow-500 text-white' :
                            'bg-purple-500 text-white'
                          : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      }`}
                    >
                      {getVisibilityIcon(visibility)}
                      {getVisibilityLabel(visibility).charAt(0).toUpperCase() + getVisibilityLabel(visibility).slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Community Selection (показва се само ако visibility е 'community') */}
            {formData.visibility === 'community' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Select Community
                </label>
                {loadingCommunities ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : communities.length === 0 ? (
                  <div className={`p-4 rounded-lg text-center ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <p className="text-sm mb-2">You don't have any communities yet.</p>
                    <p className="text-xs opacity-70">Create a community first to share lessons with it.</p>
                  </div>
                ) : (
                  <select
                    value={formData.communityId}
                    onChange={(e) => setFormData({...formData, communityId: e.target.value})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                  >
                    <option value="">Select a community...</option>
                    {communities.map(community => (
                      <option key={community.id} value={community.id}>
                        {community.name} ({community.memberCount} members)
                      </option>
                    ))}
                  </select>
                )}
                {formData.communityId && (
                  <p className={`text-xs mt-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    This lesson will be visible only to members of the selected community.
                  </p>
                )}
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
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !formData.title.trim() || (formData.visibility === 'community' && !formData.communityId)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
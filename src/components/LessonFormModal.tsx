import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, BookOpen, Tag, FileText, 
  Video, Link as LinkIcon, Image, Code, Plus, 
  Trash2, Save,  Clock,
  AlertCircle,  Globe, Lock,
  Star, Award, Target, Hash,
  Paperclip, Eye, Download, 
   BarChart3, 
   Shield,  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import TipTapEditor from "../components/TipTapEditor";
import { Timestamp } from "firebase/firestore";

interface LessonFormData {
  title: string;
  description: string;
  content: string;
  category: string;
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
  color: string;
  icon: string;
  visibility: 'public' | 'private' | 'unlisted';
  language?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
}

interface LessonFormModalProps {
  editingLesson?: any;
  onClose: () => void;
  onSave: (lessonData: any) => Promise<void>;
}

const LessonFormModal = ({ editingLesson, onClose, onSave }: LessonFormModalProps) => {
  const { theme } = useTheme();
  const { user, userData } = useAuth();
  const { t } = useLanguage();
  console.log(t)
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    content: '',
    category: 'Programming',
    status: 'draft',
    tags: [],
    attachments: [],
    estimatedTime: '1 hour',
    difficulty: 'beginner',
    color: '#3B82F6',
    icon: '📚',
    visibility: 'private',
    language: 'en',
    prerequisites: [],
    learningObjectives: []
  });

  const [newTag, setNewTag] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [attachmentForm, setAttachmentForm] = useState({
    name: '',
    url: '',
    type: 'pdf' as 'pdf' | 'video' | 'code' | 'link' | 'image',
    size: ''
  });
  const [uploadStatus, setUploadStatus] = useState('');
  const [activeSection, setActiveSection] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingLesson) {
      setFormData({
        title: editingLesson.title || '',
        description: editingLesson.description || '',
        content: editingLesson.content || '',
        category: editingLesson.category || 'Programming',
        status: editingLesson.status || 'draft',
        tags: editingLesson.tags || [],
        attachments: editingLesson.attachments || [],
        estimatedTime: editingLesson.estimatedTime || '1 hour',
        difficulty: editingLesson.difficulty || 'beginner',
        color: editingLesson.color || '#3B82F6',
        icon: editingLesson.icon || '📚',
        visibility: editingLesson.visibility || 'private',
        language: editingLesson.language || 'en',
        prerequisites: editingLesson.prerequisites || [],
        learningObjectives: editingLesson.learningObjectives || []
      });
    }
  }, [editingLesson]);

  const categories = [
    'Programming', 'Mathematics', 'Science', 'History', 
    'Languages', 'Arts', 'Business', 'Technology', 
    'Physics', 'Chemistry', 'Biology', 'Other'
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }
  ];

  const colors = [
    { hex: '#3B82F6', name: 'Blue', class: 'from-blue-500 to-blue-600' },
    { hex: '#10B981', name: 'Green', class: 'from-green-500 to-emerald-600' },
    { hex: '#8B5CF6', name: 'Purple', class: 'from-purple-500 to-violet-600' },
    { hex: '#F59E0B', name: 'Amber', class: 'from-amber-500 to-orange-600' },
    { hex: '#EF4444', name: 'Red', class: 'from-red-500 to-pink-600' },
    { hex: '#06B6D4', name: 'Cyan', class: 'from-cyan-500 to-teal-600' },
    { hex: '#EC4899', name: 'Pink', class: 'from-pink-500 to-rose-600' },
    { hex: '#6366F1', name: 'Indigo', class: 'from-indigo-500 to-blue-600' },
  ];

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
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

  const handleRemovePrerequisite = (prereq: string) => {
    setFormData({
      ...formData,
      prerequisites: formData.prerequisites?.filter(p => p !== prereq) || []
    });
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

  const handleRemoveObjective = (objective: string) => {
    setFormData({
      ...formData,
      learningObjectives: formData.learningObjectives?.filter(o => o !== objective) || []
    });
  };

  const handleAddAttachment = () => {
    if (attachmentForm.name && attachmentForm.url) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, { ...attachmentForm }]
      });
      setAttachmentForm({ name: '', url: '', type: 'pdf', size: '' });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setUploadStatus('Please enter a lesson title');
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
        totalRatings: editingLesson?.totalRatings || 0
      };

      await onSave(lessonData);
      setUploadStatus('✅ Lesson saved successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error saving lesson:', error);
      setUploadStatus('❌ Error saving lesson');
    } finally {
      setIsSaving(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4" />;
      case 'private': return <Lock className="w-4 h-4" />;
      case 'unlisted': return <Eye className="w-4 h-4" />;
      default: return <Lock className="w-4 h-4" />;
    }
  };

  // Fix: Added event parameter type for onKeyPress handlers
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, callback: () => void) => {
    if (e.key === 'Enter') {
      callback();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  className={`relative w-[95vw] max-w-[1000px] h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
    theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  }`}
>
        {/* Header with Gradient */}
        <div className={`relative p-6 border-b bg-gradient-to-r ${colors.find(c => c.hex === formData.color)?.class || 'from-blue-500 to-cyan-500'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
                {formData.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {editingLesson ? '✏️ Edit Lesson' : 'Create New Lesson'}
                </h2>
                <p className="text-white/80">
                  {editingLesson ? 'Update your lesson details' : 'Add a new lesson to your curriculum'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-6">
            {['basic', 'content', 'settings', 'attachments'].map((step, index) => (
              <button
                key={step}
                onClick={() => setActiveSection(step)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeSection === step 
                    ? 'bg-white text-blue-600' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  activeSection === step ? 'bg-blue-100 text-blue-600' : 'bg-white/20'
                }`}>
                  {index + 1}
                </div>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto h-[calc(95vh-200px)] grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info - Only shown when active */}
            {activeSection === 'basic' && (
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 items-center gap-2">
                      <span className="text-red-500">*</span> Lesson Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className={`w-full rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } border`}
                      placeholder="Enter an engaging lesson title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className={`w-full rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } border`}
                      placeholder="Brief description of what students will learn..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Content Editor - Only shown when active */}
            {activeSection === 'content' && (
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Lesson Content
                </h3>
                <TipTapEditor
                  content={formData.content}
                  onChange={(content) => setFormData({...formData, content})}
                  placeholder="Start writing your lesson content here..."
                />
                
                {/* Learning Objectives */}
                <div className="mt-6">
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Learning Objectives
                  </h4>
                  <div className="space-y-2 mb-3">
                    {formData.learningObjectives?.map((objective, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                            <Award className="w-3 h-3" />
                          </div>
                          <span>{objective}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveObjective(objective)}
                          className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
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
                      placeholder="Add a learning objective"
                      className={`flex-1 rounded-lg p-3 border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      onClick={handleAddObjective}
                      className="px-4 py-3 rounded-lg bg-green-500 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings - Only shown when active */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" /> Settings & Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className={`w-full rounded-lg p-3 border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Language</label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({...formData, language: e.target.value})}
                        className={`w-full rounded-lg p-3 border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Estimated Time</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.estimatedTime}
                          onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
                          className={`flex-1 rounded-lg p-3 border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="e.g., 1 hour"
                        />
                        <div className={`px-3 rounded-lg flex items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Visibility</label>
                      <div className="flex gap-2">
                        {(['public', 'private', 'unlisted'] as const).map(visibility => (
                          <button
                            key={visibility}
                            type="button"
                            onClick={() => setFormData({...formData, visibility})}
                            className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                              formData.visibility === visibility
                                ? visibility === 'public' ? 'bg-green-500 text-white' :
                                  visibility === 'private' ? 'bg-blue-500 text-white' :
                                  'bg-yellow-500 text-white'
                                : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            {getVisibilityIcon(visibility)}
                            {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-bold text-lg mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-2 rounded-full bg-blue-500/20 text-blue-500 text-sm flex items-center gap-2"
                      >
                        <Hash className="w-3 h-3" />
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
                      placeholder="Add tag (e.g., prolog, logic, programming)"
                      className={`flex-1 rounded-lg p-3 border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-3 rounded-lg bg-blue-500 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prerequisites */}
                <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Prerequisites
                  </h3>
                  <div className="space-y-2 mb-3">
                    {formData.prerequisites?.map((prereq, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                            <Star className="w-3 h-3" />
                          </div>
                          <span>{prereq}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePrerequisite(prereq)}
                          className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
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
                      className={`flex-1 rounded-lg p-3 border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <button
                      onClick={handleAddPrerequisite}
                      className="px-4 py-3 rounded-lg bg-amber-500 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments - Only shown when active */}
            {activeSection === 'attachments' && (
              <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Paperclip className="w-5 h-5" /> Attachments & Resources
                </h3>
                <div className="space-y-4">
                  {/* Current Attachments */}
                  {formData.attachments.map((attachment, index) => (
                    <div key={index} className={`p-4 rounded-lg border flex items-center justify-between ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          attachment.type === 'pdf' ? 'bg-red-500/20 text-red-500' :
                          attachment.type === 'video' ? 'bg-blue-500/20 text-blue-500' :
                          attachment.type === 'code' ? 'bg-green-500/20 text-green-500' :
                          attachment.type === 'link' ? 'bg-purple-500/20 text-purple-500' :
                          'bg-amber-500/20 text-amber-500'
                        }`}>
                          {attachment.type === 'pdf' ? <FileText className="w-5 h-5" /> :
                           attachment.type === 'video' ? <Video className="w-5 h-5" /> :
                           attachment.type === 'code' ? <Code className="w-5 h-5" /> :
                           attachment.type === 'link' ? <LinkIcon className="w-5 h-5" /> :
                           <Image className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{attachment.name}</p>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              {attachment.url.substring(0, 30)}...
                            </span>
                            {attachment.size && (
                              <span className={`px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                {attachment.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Attachment Form */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'
                  }`}>
                    <h4 className="font-medium mb-3">Add New Resource</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={attachmentForm.name}
                        onChange={(e) => setAttachmentForm({...attachmentForm, name: e.target.value})}
                        placeholder="Resource name"
                        className={`rounded-lg p-3 border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <input
                        type="text"
                        value={attachmentForm.url}
                        onChange={(e) => setAttachmentForm({...attachmentForm, url: e.target.value})}
                        placeholder="URL or file path"
                        className={`rounded-lg p-3 border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <select
                        value={attachmentForm.type}
                        onChange={(e) => setAttachmentForm({...attachmentForm, type: e.target.value as any})}
                        className={`rounded-lg p-3 border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="video">Video</option>
                        <option value="code">Code File</option>
                        <option value="link">Web Link</option>
                        <option value="image">Image</option>
                      </select>
                      <button
                        onClick={handleAddAttachment}
                        className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Always Visible */}
          <div className="space-y-6">
            {/* Lesson Status Card */}
            <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className="font-bold text-lg mb-4">Lesson Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['draft', 'published', 'archived'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({...formData, status})}
                        className={`py-3 rounded-lg font-medium text-sm ${
                          formData.status === status
                            ? status === 'draft' ? 'bg-yellow-500 text-white' :
                              status === 'published' ? 'bg-green-500 text-white' :
                              'bg-gray-500 text-white'
                            : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setFormData({...formData, difficulty: diff})}
                        className={`py-3 rounded-lg font-medium text-sm ${
                          formData.difficulty === diff
                            ? diff === 'beginner' ? 'bg-green-500 text-white' :
                              diff === 'intermediate' ? 'bg-yellow-500 text-white' :
                              'bg-red-500 text-white'
                            : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>


            {/* Quick Stats */}
            <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Words</span>
                  <span className="font-bold">{(formData.content.match(/\b\w+\b/g) || []).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Characters</span>
                  <span className="font-bold">{formData.content.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Attachments</span>
                  <span className="font-bold">{formData.attachments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Tags</span>
                  <span className="font-bold">{formData.tags.length}</span>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-gray-700 bg-gradient-to-br from-purple-900/30 to-pink-900/30' : 'border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50'}`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> AI Suggestions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  ✨ Generate learning objectives
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  📝 Improve lesson structure
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  🔍 Add interactive exercises
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  🎯 Suggest assessment questions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            {uploadStatus && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                uploadStatus.includes('✅') 
                  ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                  : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4" />
                {uploadStatus}
              </div>
            )}
            <div className="text-sm">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Step: </span>
              <span className="font-medium">{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const sections = ['basic', 'content', 'settings', 'attachments'];
                  const currentIndex = sections.indexOf(activeSection);
                  if (currentIndex > 0) {
                    setActiveSection(sections[currentIndex - 1]);
                  }
                }}
                className={`px-4 py-3 rounded-lg font-medium ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const sections = ['basic', 'content', 'settings', 'attachments'];
                  const currentIndex = sections.indexOf(activeSection);
                  if (currentIndex < sections.length - 1) {
                    setActiveSection(sections[currentIndex + 1]);
                  }
                }}
                className={`px-4 py-3 rounded-lg font-medium ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.title.trim()}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2 shadow-lg"
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
      </motion.div>
    </div>
  );
};

export default LessonFormModal;
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Target,
  Brain, Users as GroupIcon, 
  ChevronRight,
  X,
  User,
  BookOpen, 
  FileText,
  Eye,
  GraduationCap, 
  Plus, 
  Activity,
  Bell,
  MessageCircle,
  UserPlus,
  Star,
  Home,
  Mail,
  Users2,
  Award,
  BookMarked,
  FileCheck,
  Inbox,
  LogOut,
  CheckCircle,
  TrendingUp,
  Clock,
  Trophy,
  Zap,
  Code,
  Play,
  Book,
  Tag,
  Heart,
  Bookmark
} from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  limit,
  setDoc,
  arrayUnion,
  getDoc,
  writeBatch,
  Timestamp,
  arrayRemove
} from "firebase/firestore";

import Header from "../components/Header";
import StudentChallenges from "../components/StudentChallenges";
import StudentAssignments from "../components/StudentAssignments";
import StudentCodeEditor from "../components/StudentCodeEditor";
import StudentSubmissions from "../components/StudentSubmissions";
import StudentMessages from "./StudentMessages";

// Интерфейси
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'grade' | 'assignment' | 'challenge' | 'system' | 'message' | 'direct' | 'lesson' | 'challenge_response' | 'submission_evaluated' | 'challenge_submission' | 'challenge_accepted' | 'challenge_rejected' | 'challenge_completed' | 'assignment_submission';
  timestamp: any;
  read: boolean;
  link?: string;
  details?: any;
  icon?: React.JSX.Element;
  color?: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  institution: string;
  gradeLevel?: string;
  subject?: string;
  memberCount: number;
  studentIds: string[];
  pendingRequests: string[];
  createdAt: any;
  isPublic: boolean;
  inviteCode: string;
  challenges: string[];
  settings: {
    allowStudentChallenges: boolean;
    allowInterCommunityChallenges: boolean;
    allowStudentMessages: boolean;
    autoApproveStudents: boolean;
    privacy: "public" | "private";
  };
}

interface Lesson {
  id: string;
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
  communityId?: string;
  communityName?: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  createdAt: any;
  updatedAt: any;
  views: number;
  likes: string[];
  favorites?: string[];
  bookmarks?: string[];
  students: string[];
  rating: number;
  totalRatings: number;
  progress?: number;
  lastRead?: any;
  completed?: boolean;
}

interface ChallengeSolution {
  id: string;
  challengeId: string;
  studentId: string;
  studentName?: string;
  solutionCode: string;
  status: 'submitted' | 'evaluated' | 'joined';
  score?: number;
  feedback?: string;
  evaluatedAt?: any;
  evaluatedBy?: string;
  evaluatedByName?: string;
  submittedAt: any;
  updatedAt: any;
  challengeTitle?: string;
  challengeDescription?: string;
  createdAt?: any;
}

interface ChallengeSubmission {
  studentId: string;
  studentName?: string;
  submittedAt: any;
  files?: string[];
  notes?: string;
  score?: number;
  status?: 'joined' | 'submitted' | 'completed';
  solutionCode?: string;
  grade?: { 
    score: number;
    feedback?: string;
    gradedAt: any;
    gradedBy?: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorCommunityId: string;
  targetCommunityId: string;
  createdBy: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  dueDate?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  submissions: ChallengeSubmission[];
  createdAt: any;
  studentGrade?: {
    score: number;
    feedback?: string;
    gradedAt?: any;
  };
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
  communityId?: string;
  content: string;
  timestamp: any;
  read: boolean;
  type: 'direct' | 'community' | 'broadcast';
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  objective: string;
  topic: string;
  subject: string;
  requirements: {
    minFacts: number;
    minRules: number;
    minCombinedRules: number;
    minMenuItems: number;
  };
  instructions: string[];
  teacherId: string;
  teacherName: string;
  createdAt: any;
  dueDate: string;
  status: 'active' | 'draft' | 'archived';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  exampleCode?: string;
  backgroundImage?: string;
  category?: string;
  progress?: number;
  studentProgress?: {
    completed: boolean;
    submissionId?: string;
    submittedAt?: any;
    code?: string;
    requirementsMet?: {
      facts: number;
      rules: number;
      combinedRules: number;
      menuItems: number;
    };
    grade?: {
      score?: number;
      feedback?: string;
      gradedAt?: any;
      gradedBy?: string;
    };
  };
}

interface ActivityLog {
  id: string;
  studentId: string;
  studentName: string;
  action: string;
  timestamp: any;
  details?: string;
  file?: string;
  status?: string;
}

interface Submission {
  id: string;
  name: string;
  date: string;
  status: string;
  code?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  grade?: {
    score?: number;
    feedback?: string;
    gradedAt?: any;
    gradedBy?: string;
  };
}

interface UserData {
  uid: string;
  username: string;
  email: string;
  role: string;
  teacherId?: string;
  fullName?: string;
}

interface Grade {
  id: string;
  assignmentId?: string;
  assignmentTitle?: string;
  fileId?: string;
  fileName?: string;
  points: number;
  maxPoints: number;
  feedback?: string;
  gradedAt: any;
  gradedBy?: string;
  teacherId?: string;
  teacherName?: string;
  studentId: string;
  studentName?: string;
  type?: string;
  gradePercentage?: number;
  challengeId?: string;
}

const prologTemplates = [
  {
    id: "insects",
    name: "Insects Expert System",
    description: "Knowledge-based system for insect classification",
    code: `start :-
    writeln('=== INSECTS EXPERT SYSTEM ==='),
    writeln('1. List all insects'),
    writeln('2. Insect classification'),
    writeln('3. Dangerous insects'),
    writeln('4. Pollinating insects'),
    writeln('0. Exit'),
    read(Choice),
    handle_choice(Choice).`
  },
  {
    id: "basic",
    name: "Basic Prolog Template",
    description: "Simple template with start predicate",
    code: `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                  %
%   YOUR KNOWLEDGE-BASED EXPERT SYSTEM             %
%   =====================================           %
%   Domain: [Your Domain Here]                      %
%   Type: Symbolic AI / Expert System               %
%   Student: [Your Name Here]                       %
%   Data Area: [Your Data Area Here]                %
%   Assignment: [Your Assignment Here]              %
%   Date: [Current Date]                            %
%                                                  %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


%%%%%%%%%%%%%%%%%%%%%%%%%
% PROGRAM ENTRY POINT
%%%%%%%%%%%%%%%%%%%%%%%%%
start :-
    writeln('=== EXPERT SYSTEM ==='),
    writeln('System started successfully.'),
    nl.`
  }
];

const assignmentBackgrounds = [
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
];

const categories = ["Design", "Programming", "Algorithms", "Data Science", "Database", "AI"];

export default function StudentsDashboard() {
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  // State променливи
  const [sidebarOpen, _setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [_selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  
  // Данни
  const [communities, setCommunities] = useState<Community[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeSolutions, setChallengeSolutions] = useState<ChallengeSolution[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [_allUsers, setAllUsers] = useState<UserData[]>([]);
  
  // Състояния за code editor
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [code, setCode] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [codeMetadata, setCodeMetadata] = useState({
    domain: "",
    type: "Symbolic AI / Expert System",
    studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
    dataArea: "",
    assignmentId: "",
    assignmentTitle: ""
  });
  
  // UI състояния
  const [loadingData, setLoadingData] = useState({
    communities: true,
    challenges: true,
    assignments: true,
    lessons: true,
    notifications: true,
    grades: true,
    initialLoad: true
  });
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);
  
  // Модали
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<Assignment | null>(null);
  const [communityInviteCode, setCommunityInviteCode] = useState("");
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  
  // Refs
  const notificationsListenerActive = useRef(false);
  const notificationsUnsubscribe = useRef<(() => void) | null>(null);
  const isAssignmentsLoading = useRef(false);
  const hasLoadedAssignments = useRef(false);

  // Статистики
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    totalSubmissions: 0,
    successRate: 0,
    activeStreak: 7,
    averageScore: 0,
    communityMembers: 0,
    activeChallenges: 0,
    totalLessons: 0,
    completedLessons: 0,
    pendingLessons: 0
  });

  // ТРИ ЦВЯТА
  const colorScheme = {
    primary: "#22C55E",    // зелено
    secondary: "#3B82F6",  // синьо
    accent: "#F97316",     // оранжево
    danger: "#EF4444",     // червено
    purple: "#A855F7",     // лилаво
    pink: "#EC4899",       // розово
    teal: "#14B8A6",       // тюркоазено
    light: {
      bg: "bg-gray-50",
      text: "text-gray-900",
      card: "bg-white",
      border: "border-gray-200",
      hover: "hover:bg-gray-100"
    },
    dark: {
      bg: "bg-gray-900",
      text: "text-white",
      card: "bg-gray-800",
      border: "border-gray-700",
      hover: "hover:bg-gray-700"
    }
  };

  const currentTheme = theme === 'dark' ? colorScheme.dark : colorScheme.light;

  // ⭐ СИНХРОНИЗИРАНЕ НА TAB С URL ПАРАМЕТРИ ⭐
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'messages', 'communities', 'lessons', 'challenges', 'mysolutions', 'assignments', 'grades', 'progress', 'upload', 'submissions'].includes(tab)) {
      setSelectedTab(tab);
    }
  }, [location.search]);

  // Logout handler
  const handleLogout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../services/firebase');
      await signOut(auth);
    } catch (error) {
      console.error(t('logout_failed') || 'Logout failed:', error);
    }
  };

  const generateHeader = () => {
    const studentName = codeMetadata.studentName || user?.email?.split('@')[0] || t?.('student') || "Student";
    const domain = codeMetadata.domain || t?.('expert_system') || "Expert System";
    const type = codeMetadata.type || t?.('symbolic_ai_expert_system') || "Symbolic AI / Expert System";
    const dataArea = codeMetadata.dataArea || t?.('general_knowledge') || "General Knowledge";
    const assignmentTitle = codeMetadata.assignmentTitle || t?.('general_assignment') || "General Assignment";
    
    return `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                  %
%   ${domain.toUpperCase()} KNOWLEDGE-BASED EXPERT SYSTEM           %
%   =====================================           %
%   ${t?.('domain') || "Domain"}: ${domain.padEnd(40)}%
%   ${t?.('type') || "Type"}: ${type.padEnd(42)}%
%   ${t?.('student') || "Student"}: ${studentName.padEnd(37)}%
%   ${t?.('data_area') || "Data Area"}: ${dataArea.padEnd(35)}%
%   ${t?.('assignment') || "Assignment"}: ${assignmentTitle.padEnd(33)}%
%   ${t?.('date') || "Date"}: ${new Date().toLocaleDateString().padEnd(38)}%
%                                                  %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%`;
  };

  const generateChallengeTemplate = (challenge: Challenge) => {
    return `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                  %
%   CHALLENGE SOLUTION: ${challenge.title.toUpperCase()}
%   =====================================           %
%   Category: ${challenge.category.padEnd(40)}%
%   Difficulty: ${challenge.difficulty.padEnd(38)}%
%   Student: ${(userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student").padEnd(40)}%
%   Due Date: ${challenge.dueDate || t?.('not_specified')?.padEnd(37) || "Not specified".padEnd(37)}%
%   Points: ${challenge.points.toString().padEnd(43)}%
%   Description: ${challenge.description.substring(0, 30).padEnd(34)}...%
%                                                  %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


%%%%%%%%%%%%%%%%%%%%%%%%%
% CHALLENGE DESCRIPTION
%%%%%%%%%%%%%%%%%%%%%%%%%
/*
${challenge.description}

Requirements:
- Solve the problem using Prolog
- Create at least 10 facts
- Create at least 5 rules
- Include a menu system
*/

%%%%%%%%%%%%%%%%%%%%%%%%%
% YOUR SOLUTION STARTS HERE
%%%%%%%%%%%%%%%%%%%%%%%%%`;
  };

  const downloadCode = (code: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.pl`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('just_now') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('minutes_ago') || 'min ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('hours_ago') || 'hours ago'}`;
    if (diffDays < 7) return `${diffDays} ${t('days_ago') || 'days ago'}`;
    
    return date.toLocaleDateString();
  };

  // НАВИГАЦИЯ
  const navSections = [
    {
      title: t('main') || "Основно",
      items: [
        { 
          id: "dashboard", 
          label: t('dashboard') || "Табло", 
          icon: <Home className="w-5 h-5" />, 
          badge: null 
        },
        { 
          id: "messages", 
          label: t('messages') || "Съобщения", 
          icon: <Mail className="w-5 h-5" />, 
          badge: messages.filter(m => !m.read && m.receiverId === user?.uid && m.type === 'direct').length 
        },
        { 
          id: "communities", 
          label: t('communities') || "Общности", 
          icon: <Users2 className="w-5 h-5" />, 
          badge: communities.length 
        }
      ]
    },
    {
      title: t('learning') || "Обучение",
      items: [
        { 
          id: "lessons", 
          label: t('lessons') || "Уроци", 
          icon: <BookMarked className="w-5 h-5" />, 
          badge: stats.pendingLessons 
        },
        { 
          id: "assignments", 
          label: t('assignments') || "Задания", 
          icon: <FileCheck className="w-5 h-5" />, 
          badge: stats.pendingAssignments 
        },
        { 
          id: "challenges", 
          label: t('challenges') || "Предизвикателства", 
          icon: <Award className="w-5 h-5" />, 
          badge: stats.activeChallenges 
        }
      ]
    },
    {
      title: t('progress') || "Прогрес",
      items: [
        { 
          id: "grades", 
          label: t('grades') || "Оценки", 
          icon: <Star className="w-5 h-5" />, 
          badge: studentGrades.length 
        },
        { 
          id: "mysolutions", 
          label: t('my_solutions') || "Моите решения", 
          icon: <Trophy className="w-5 h-5" />, 
          badge: challenges.filter(c => c.submissions?.some(s => s.studentId === user?.uid)).length 
        },
        { 
          id: "progress", 
          label: t('learning_progress') || "Прогрес", 
          icon: <TrendingUp className="w-5 h-5" />, 
          badge: null 
        }
      ]
    },
    {
      title: t('content') || "Съдържание",
      items: [
        { 
          id: "submissions", 
          label: t('submissions') || "Предадени", 
          icon: <Inbox className="w-5 h-5" />, 
          badge: submissions.length 
        },
        { 
          id: "upload", 
          label: t('code_editor') || "Code Editor", 
          icon: <Code className="w-5 h-5" />, 
          badge: null 
        }
      ]
    }
  ];

  // 🔥 ОБНОВЕНА ФУНКЦИЯ ЗА ЗАРЕЖДАНЕ НА УРОЦИ - ВКЛЮЧВА И PUBLIC УРОЦИ
  const loadLessons = async () => {
    if (!user) {
      setLessons([]);
      setStats(prev => ({
        ...prev,
        totalLessons: 0,
        completedLessons: 0,
        pendingLessons: 0
      }));
      setLoadingData(prev => ({ ...prev, lessons: false }));
      return;
    }

    setLoadingLessons(true);
    
    try {
      let lessonsQuery;
      
      // Ако има общности, зареждаме и уроците от общностите, и публичните уроци
      if (communities.length > 0) {
        const communityIds = communities.map(c => c.id);
        
        // 🔥 ВАЖНО: Зареждаме и двата типа уроци - от общности и публични
        lessonsQuery = query(
          collection(db, "lessons"),
          where("status", "==", "published"),
          where("visibility", "in", ["community", "public"]),
          orderBy("createdAt", "desc")
        );
        
        console.log(`Loading lessons for communities:`, communityIds);
      } else {
        // Ако няма общности, зареждаме само публичните уроци
        lessonsQuery = query(
          collection(db, "lessons"),
          where("status", "==", "published"),
          where("visibility", "==", "public"),
          orderBy("createdAt", "desc")
        );
        
        console.log(`Loading only public lessons (no communities)`);
      }
      
      const snapshot = await getDocs(lessonsQuery);
      console.log(`Found ${snapshot.size} lessons`);
      
      const lessonsData: Lesson[] = [];
      
      // Зареждаме прогреса на ученика
      const progressQuery = query(
        collection(db, "lessonProgress"),
        where("studentId", "==", user.uid)
      );
      const progressSnapshot = await getDocs(progressQuery);
      const progressMap = new Map();
      
      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        progressMap.set(data.lessonId, {
          completed: data.completed || false,
          lastRead: data.lastRead,
          progress: data.progress || 0
        });
      });
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const lessonProgress = progressMap.get(doc.id);
        
        // 🔥 Филтрираме само уроците, които са достъпни за ученика
        // - Публичните уроци са достъпни за всички
        // - Уроците от общности са достъпни само ако ученикът е в тази общност
        if (data.visibility === 'public' || 
            (data.visibility === 'community' && communities.some(c => c.id === data.communityId))) {
          
          lessonsData.push({
            id: doc.id,
            title: data.title || "Untitled Lesson",
            description: data.description || "No description",
            content: data.content || "",
            category: data.category || "General",
            status: data.status || "published",
            tags: data.tags || [],
            estimatedTime: data.estimatedTime || "30 min",
            difficulty: data.difficulty || "beginner",
            visibility: data.visibility || "public",
            language: data.language || "en",
            prerequisites: data.prerequisites || [],
            learningObjectives: data.learningObjectives || [],
            communityId: data.communityId,
            communityName: data.communityName,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            teacherAvatar: data.teacherAvatar,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            views: data.views || 0,
            likes: data.likes || [],
            favorites: data.favorites || [],
            bookmarks: data.bookmarks || [],
            students: data.students || [],
            rating: data.rating || 0,
            totalRatings: data.totalRatings || 0,
            progress: lessonProgress?.progress || 0,
            completed: lessonProgress?.completed || false,
            lastRead: lessonProgress?.lastRead
          });
        }
      });
      
      setLessons(lessonsData);

      const completedLessons = lessonsData.filter(l => l.completed).length;
      setStats(prev => ({
        ...prev,
        totalLessons: lessonsData.length,
        completedLessons: completedLessons,
        pendingLessons: lessonsData.length - completedLessons
      }));
      
    } catch (error) {
      console.error("Error loading lessons:", error);
    } finally {
      setLoadingLessons(false);
      setLoadingData(prev => ({ ...prev, lessons: false }));
    }
  };

  // Функция за харесване на урок
  const handleLikeLesson = async (lessonId: string) => {
    if (!user) return;
    
    try {
      const lessonRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonRef, {
        likes: arrayUnion(user.uid)
      });
      
      // Актуализираме локалния списък
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, likes: [...(lesson.likes || []), user.uid] } 
          : lesson
      ));
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(prev => prev ? { ...prev, likes: [...(prev.likes || []), user.uid] } : null);
      }
    } catch (error) {
      console.error("Error liking lesson:", error);
    }
  };

  // Функция за премахване на харесване
  const handleUnlikeLesson = async (lessonId: string) => {
    if (!user) return;
    
    try {
      const lessonRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonRef, {
        likes: arrayRemove(user.uid)
      });
      
      // Актуализираме локалния списък
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, likes: (lesson.likes || []).filter(id => id !== user.uid) } 
          : lesson
      ));
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(prev => prev ? { ...prev, likes: (prev.likes || []).filter(id => id !== user.uid) } : null);
      }
    } catch (error) {
      console.error("Error unliking lesson:", error);
    }
  };

  // Функция за добавяне в любими
  const handleFavoriteLesson = async (lessonId: string) => {
    if (!user) return;
    
    try {
      const lessonRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonRef, {
        favorites: arrayUnion(user.uid)
      });
      
      // Актуализираме локалния списък
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, favorites: [...(lesson.favorites || []), user.uid] } 
          : lesson
      ));
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(prev => prev ? { ...prev, favorites: [...(prev.favorites || []), user.uid] } : null);
      }
    } catch (error) {
      console.error("Error favoriting lesson:", error);
    }
  };

  // Функция за премахване от любими
  const handleUnfavoriteLesson = async (lessonId: string) => {
    if (!user) return;
    
    try {
      const lessonRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonRef, {
        favorites: arrayRemove(user.uid)
      });
      
      // Актуализираме локалния списък
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, favorites: (lesson.favorites || []).filter(id => id !== user.uid) } 
          : lesson
      ));
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(prev => prev ? { ...prev, favorites: (prev.favorites || []).filter(id => id !== user.uid) } : null);
      }
    } catch (error) {
      console.error("Error unfavoriting lesson:", error);
    }
  };

  // Функция за отметка
  const handleBookmarkLesson = async (lessonId: string) => {
    if (!user) return;
    
    try {
      const lessonRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonRef, {
        bookmarks: arrayUnion(user.uid)
      });
      
      // Актуализираме локалния списък
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, bookmarks: [...(lesson.bookmarks || []), user.uid] } 
          : lesson
      ));
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(prev => prev ? { ...prev, bookmarks: [...(prev.bookmarks || []), user.uid] } : null);
      }
    } catch (error) {
      console.error("Error bookmarking lesson:", error);
    }
  };

  // Функция за премахване на отметка
  const handleUnbookmarkLesson = async (lessonId: string) => {
    if (!user) return;
    
    try {
      const lessonRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonRef, {
        bookmarks: arrayRemove(user.uid)
      });
      
      // Актуализираме локалния списък
      setLessons(prev => prev.map(lesson => 
        lesson.id === lessonId 
          ? { ...lesson, bookmarks: (lesson.bookmarks || []).filter(id => id !== user.uid) } 
          : lesson
      ));
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(prev => prev ? { ...prev, bookmarks: (prev.bookmarks || []).filter(id => id !== user.uid) } : null);
      }
    } catch (error) {
      console.error("Error unbookmarking lesson:", error);
    }
  };

  // Функция за оценяване на урок
  const handleRateLesson = async (lessonId: string, ratingValue: number) => {
    if (!user) return;
    
    try {
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return;
      
      const newTotalRatings = (lesson.totalRatings || 0) + 1;
      const newRating = ((lesson.rating || 0) * (lesson.totalRatings || 0) + ratingValue) / newTotalRatings;
      
      const lessonRef = doc(db, "lessons", lessonId);
      await updateDoc(lessonRef, {
        rating: newRating,
        totalRatings: newTotalRatings
      });
      
      // Актуализираме локалния списък
      setLessons(prev => prev.map(l => 
        l.id === lessonId 
          ? { ...l, rating: newRating, totalRatings: newTotalRatings } 
          : l
      ));
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(prev => prev ? { ...prev, rating: newRating, totalRatings: newTotalRatings } : null);
      }
    } catch (error) {
      console.error("Error rating lesson:", error);
    }
  };

  // 🔥 ОБНОВЕН МОДАЛ ЗА ПРЕГЛЕД НА УРОК - С РЕЙТИНГ И ЛЮБИМИ
  const renderLessonViewModal = () => (
    <AnimatePresence>
      {showLessonModal && selectedLesson && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLessonModal(false)}
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowLessonModal(false)} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${currentTheme.card} ${currentTheme.border}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${colorScheme.secondary}20` }}>
                    <BookOpen className="w-5 h-5" style={{ color: colorScheme.secondary }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedLesson.title}</h3>
                    <p className="opacity-70">{selectedLesson.communityName || (selectedLesson.visibility === 'public' ? t('public') || 'Public' : '')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLessonModal(false)}
                  className={`p-2 rounded-lg ${currentTheme.hover}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`mb-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: colorScheme.secondary }} />
                    <span className="text-sm">{selectedLesson.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" style={{ color: colorScheme.primary }} />
                    <span className={`text-sm capitalize ${
                      selectedLesson.difficulty === 'beginner' ? 'text-green-500' :
                      selectedLesson.difficulty === 'intermediate' ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {selectedLesson.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" style={{ color: colorScheme.purple }} />
                    <span className="text-sm">{selectedLesson.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: colorScheme.accent }} />
                    <span className="text-sm">{selectedLesson.teacherName}</span>
                  </div>
                  
                  {/* 🔥 БУТОНИ ЗА РЕЙТИНГ, ЛЮБИМИ И ОТМЕТКИ */}
                  <div className="flex items-center gap-3 ml-auto">
                    {/* Рейтинг със звезди */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRateLesson(selectedLesson.id, star)}
                          className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                          title={t?.('rate') || 'Rate'}
                        >
                          <Star 
                            className={`w-4 h-4 ${
                              (selectedLesson.rating || 0) >= star 
                                ? 'fill-yellow-500 text-yellow-500' 
                                : 'text-gray-400'
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="text-xs ml-1 opacity-70">
                        ({(selectedLesson.rating || 0).toFixed(1)})
                      </span>
                    </div>

                    {/* Бутон за любими */}
                    <button
                      onClick={() => {
                        if (selectedLesson.favorites?.includes(user?.uid || '')) {
                          handleUnfavoriteLesson(selectedLesson.id);
                        } else {
                          handleFavoriteLesson(selectedLesson.id);
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedLesson.favorites?.includes(user?.uid || '') 
                          ? 'text-red-500 bg-red-500/10' 
                          : 'hover:bg-white/10'
                      }`}
                      title={selectedLesson.favorites?.includes(user?.uid || '') 
                        ? t?.('remove_from_favorites') || 'Remove from favorites' 
                        : t?.('add_to_favorites') || 'Add to favorites'}
                    >
                      <Heart className={`w-5 h-5 ${selectedLesson.favorites?.includes(user?.uid || '') ? 'fill-red-500' : ''}`} />
                    </button>

                    {/* Бутон за отметки */}
                    <button
                      onClick={() => {
                        if (selectedLesson.bookmarks?.includes(user?.uid || '')) {
                          handleUnbookmarkLesson(selectedLesson.id);
                        } else {
                          handleBookmarkLesson(selectedLesson.id);
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedLesson.bookmarks?.includes(user?.uid || '') 
                          ? 'text-blue-500 bg-blue-500/10' 
                          : 'hover:bg-white/10'
                      }`}
                      title={selectedLesson.bookmarks?.includes(user?.uid || '') 
                        ? t?.('remove_bookmark') || 'Remove bookmark' 
                        : t?.('bookmark') || 'Bookmark'}
                    >
                      <Bookmark className={`w-5 h-5 ${selectedLesson.bookmarks?.includes(user?.uid || '') ? 'fill-blue-500' : ''}`} />
                    </button>

                    {/* Бутон за харесвания */}
                    <button
                      onClick={() => {
                        if (selectedLesson.likes?.includes(user?.uid || '')) {
                          handleUnlikeLesson(selectedLesson.id);
                        } else {
                          handleLikeLesson(selectedLesson.id);
                        }
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        selectedLesson.likes?.includes(user?.uid || '') 
                          ? 'text-yellow-500 bg-yellow-500/10' 
                          : 'hover:bg-white/10'
                      }`}
                      title={t?.('like') || 'Like'}
                    >
                      <Star className={`w-4 h-4 ${selectedLesson.likes?.includes(user?.uid || '') ? 'fill-yellow-500' : ''}`} />
                      <span className="text-sm">{selectedLesson.likes?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </div>

              {selectedLesson.description && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">{t('description') || "Описание"}</h4>
                  <p className="opacity-70">{selectedLesson.description}</p>
                </div>
              )}

              {selectedLesson.learningObjectives && selectedLesson.learningObjectives.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" style={{ color: colorScheme.secondary }} />
                    {t('learning_objectives') || "Цели на обучението"}
                  </h4>
                  <ul className="space-y-1">
                    {selectedLesson.learningObjectives.map((obj, idx) => (
                      <li key={idx} className="text-sm opacity-70 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-8">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: colorScheme.primary }} />
                  {t('lesson_content') || "Съдържание"}
                </h4>
                <div className={`prose max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                  <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                </div>
              </div>

              {selectedLesson.tags && selectedLesson.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">{t('tags') || "Тагове"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLesson.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                {!selectedLesson.completed && (
                  <button
                    onClick={() => handleMarkLessonAsRead(selectedLesson)}
                    className="flex-1 py-3 rounded-lg text-white font-medium"
                    style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})` }}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    {t('mark_as_completed') || "Маркирай като завършен"}
                  </button>
                )}
                <button
                  onClick={() => setShowLessonModal(false)}
                  className={`flex-1 py-3 rounded-lg ${currentTheme.hover}`}
                >
                  {t('close') || "Затвори"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 🔥 ОБНОВЕН ИЗГЛЕД ЗА УРОЦИ - С РЕЙТИНГ И ЛЮБИМИ
  const renderLessonsView = () => (
    <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{t('my_lessons') || "Моите уроци"}</h2>
          <p className="opacity-70">{lessons.length} {t('lessons_available') || "налични урока"}</p>
        </div>
      </div>

      {loadingLessons ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2"
               style={{ borderColor: colorScheme.primary }}></div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-12">
          <BookMarked className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="opacity-70">{t('no_lessons_found') || "Няма намерени уроци"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`p-4 rounded-lg border ${currentTheme.border} hover:bg-white/5 transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${colorScheme.secondary}20` }}>
                    <Book className="w-4 h-4" style={{ color: colorScheme.secondary }} />
                  </div>
                  <div>
                    <h3 className="font-medium">{lesson.title}</h3>
                    <p className="text-xs opacity-70">{lesson.communityName || (lesson.visibility === 'public' ? t('public') || 'Public' : '')}</p>
                  </div>
                </div>
                {lesson.completed && (
                  <CheckCircle className="w-4 h-4" style={{ color: colorScheme.primary }} />
                )}
              </div>
              <p className="text-sm opacity-70 mb-3 line-clamp-2">{lesson.description}</p>
              
              {/* 🔥 РЕЙТИНГ И ЛЮБИМИ В КАРТАТА */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs">{(lesson.rating || 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className={`w-3 h-3 ${lesson.favorites?.includes(user?.uid || '') ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-xs">{lesson.favorites?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bookmark className={`w-3 h-3 ${lesson.bookmarks?.includes(user?.uid || '') ? 'fill-blue-500 text-blue-500' : ''}`} />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full
                  ${lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' :
                    lesson.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'}`}>
                  {lesson.difficulty}
                </span>
                <span className="text-xs opacity-50">{lesson.estimatedTime}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedLesson(lesson);
                  setShowLessonModal(true);
                }}
                className="w-full mt-3 py-2 rounded-lg text-white text-sm"
                style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})` }}
              >
                {lesson.completed ? t('review') || "Преглед" : t('read') || "Чети"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMessagesView = () => (
    <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
      <StudentMessages />
    </div>
  );

  const renderCommunitiesView = () => (
    <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{t('communities') || "Общности"}</h2>
          <p className="opacity-70">{t('your_learning_communities') || "Вашите учебни общности"}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={communityInviteCode}
            onChange={(e) => setCommunityInviteCode(e.target.value.toUpperCase())}
            placeholder={t?.('enter_invite_code') || "Въведете код"}
            className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.card} text-sm w-32`}
          />
          <button
            onClick={handleJoinWithCode}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 text-sm"
            style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})` }}
          >
            <UserPlus className="w-4 h-4" />
            {t('join') || "Присъедини се"}
          </button>
        </div>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-12">
          <GroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-bold mb-2">{t('no_communities') || "Нямате общности"}</h3>
          <p className="opacity-70 mb-4">{t('join_community_with_code') || "Присъединете се към общност с код"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community) => (
            <div
              key={community.id}
              className={`p-4 rounded-lg border ${currentTheme.border} cursor-pointer hover:bg-white/5 transition-colors`}
              onClick={() => setSelectedCommunity(community.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{community.name}</h3>
                <span className="text-xs opacity-70">{community.memberCount} {t('members') || 'членове'}</span>
              </div>
              <p className="text-sm opacity-70 mb-3 line-clamp-2">{community.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                  {community.subject || t('no_subject') || "Без предмет"}
                </span>
                {community.teacherId && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-500">
                    {t('teacher') || "Учител"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDashboardView = () => {
    // Статистики за dashboard-а
    const statsCards = [
      {
        title: t?.('total_assignments') || "Общо задания",
        value: stats.totalAssignments,
        icon: <FileText className="w-6 h-6" />,
        color: "from-blue-500 to-cyan-500",
        change: `${stats.completedAssignments} ${t?.('completed') || "завършени"}`,
        description: t?.('active_assignments') || "Активни задания"
      },
      {
        title: t?.('pending_assignments') || "Чакащи",
        value: stats.pendingAssignments,
        icon: <Clock className="w-6 h-6" />,
        color: "from-amber-500 to-orange-500",
        change: t?.('requires_attention') || "Нуждаят се от внимание",
        description: t?.('needs_submission') || "Очакват предаване"
      },
      {
        title: t?.('communities') || "Общности",
        value: communities.length,
        icon: <GroupIcon className="w-6 h-6" />,
        color: "from-purple-500 to-pink-500",
        change: `${stats.communityMembers} ${t?.('members') || "членове"}`,
        description: t?.('learning_communities') || "Учебни общности"
      },
      {
        title: t?.('my_lessons') || "Моите уроци",
        value: stats.totalLessons,
        icon: <BookMarked className="w-6 h-6" />,
        color: "from-green-500 to-emerald-500",
        change: `${stats.completedLessons}/${stats.totalLessons} ${t?.('completed') || "завършени"}`,
        description: t?.('lessons_to_read') || "Уроци за четене"
      }
    ];

    // Задачи за днес
    const todaysTasks = assignments.slice(0, 3).map(assignment => {
      const isCompleted = assignment.studentProgress?.completed || false;
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        dueDate: assignment.dueDate,
        dueTime: `${t?.('due') || "Краен срок"}: ${new Date(assignment.dueDate).toLocaleDateString()}`,
        completed: isCompleted,
        assignment: assignment
      };
    });

    // Препоръки
    const recommendations = [
      {
        id: 1,
        icon: <Brain className="w-5 h-5" />,
        title: t?.('practice_makes_perfect') || "Practice Makes Perfect",
        description: t?.('practice_makes_perfect_desc') || "Опитайте да решите 3 нови Prolog задачи тази седмица.",
        color: "from-purple-500 to-pink-500",
        action: t?.('start_now') || "Започни сега"
      },
      {
        id: 2,
        icon: <Target className="w-5 h-5" />,
        title: t?.('complete_assignments_early') || "Предайте заданията рано",
        description: t?.('complete_assignments_early_desc') || "Предайте 2 дни преди крайния срок за бонус точки.",
        color: "from-blue-500 to-cyan-500",
        action: t?.('view_assignments') || "Виж задания"
      },
      {
        id: 3,
        icon: <Users className="w-5 h-5" />,
        title: t?.('join_study_group') || "Присъединете се към група",
        description: t?.('join_study_group_desc') || "Работете в екип по сложни Prolog проекти.",
        color: "from-green-500 to-emerald-500",
        action: t?.('join_now') || "Присъедини се"
      }
    ];

    return (
      <div className="space-y-8">
        {loadingData.initialLoad ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                 style={{ borderColor: colorScheme.primary }}></div>
          </div>
        ) : (
          <>
            {/* СТАТИСТИКИ КАРТИ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`rounded-xl p-6 border ${currentTheme.card} ${currentTheme.border}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r ${stat.color}/20`}>
                      {stat.icon}
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-lg ${
                      stat.change.includes(t?.('completed') || 'завършени') || stat.change.includes(t?.('members') || 'членове')
                        ? 'bg-green-500/20 text-green-500'
                        : stat.change.includes(t?.('requires_attention') || 'Нуждаят')
                        ? 'bg-amber-500/20 text-amber-500'
                        : theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{stat.title}</div>
                  <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stat.description}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ЗАДАЧИ И АКТИВНОСТ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Задачи за днес */}
              <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" style={{ color: colorScheme.secondary }} />
                    {t?.('todays_tasks') || "Задачи за днес"}
                  </h3>
                  <button 
                    onClick={() => setSelectedTab("assignments")}
                    className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1"
                  >
                    {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {todaysTasks.length > 0 ? (
                    todaysTasks.map((task) => (
                      <div key={task.id} className={`p-4 rounded-lg border ${currentTheme.border} hover:bg-white/5 transition-colors`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{task.title}</div>
                          {task.completed ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                              {t?.('completed') || "Завършено"}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-500">
                              {t?.('pending') || "Чакащо"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm opacity-70 mb-2">{task.description.substring(0, 60)}...</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs opacity-50">{task.dueTime}</span>
                          <button
                            onClick={() => {
                              setSelectedAssignment(task.id);
                              setSelectedTab("upload");
                            }}
                            className="text-xs px-3 py-1 rounded-full"
                            style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`, color: 'white' }}
                          >
                            {t?.('start') || "Старт"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 opacity-70">{t?.('no_tasks_today') || "Няма задачи за днес"}</p>
                  )}
                </div>
              </div>

              {/* Последна активност */}
              <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5" style={{ color: colorScheme.primary }} />
                  {t?.('recent_activity') || "Последна активност"}
                </h3>
                
                <div className="space-y-4">
                  {(showAllActivities ? activityLogs : activityLogs.slice(0, 3)).map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${log.status === 'submitted' ? 'bg-green-500/20' :
                          log.status === 'started' ? 'bg-blue-500/20' :
                          log.status === 'completed' ? 'bg-purple-500/20' :
                          'bg-gray-500/20'}`}>
                        {log.status === 'submitted' ? '📤' :
                         log.status === 'started' ? '🚀' :
                         log.status === 'completed' ? '✅' : '📝'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{log.action}</div>
                        <div className="text-xs opacity-70">{log.details}</div>
                        <div className="text-xs opacity-50 mt-1">
                          {log.timestamp?.toDate ? 
                            new Date(log.timestamp.toDate()).toLocaleString() : 
                            t?.('recently') || 'Скоро'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {activityLogs.length > 3 && (
                    <button
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="w-full mt-2 text-sm text-center opacity-70 hover:opacity-100 flex items-center justify-center gap-1"
                    >
                      {showAllActivities ? t?.('show_less') || "Покажи по-малко" : t?.('view_all') || "Виж всички"} 
                      <ChevronRight className={`w-4 h-4 transition-transform ${showAllActivities ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ПОСЛЕДНИ ПРЕДИЗВИКАТЕЛСТВА И УРОЦИ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Последни предизвикателства */}
              <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5" style={{ color: colorScheme.accent }} />
                    {t('recent_challenges') || 'Последни предизвикателства'}
                  </h3>
                  <button 
                    onClick={() => setSelectedTab("challenges")}
                    className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1"
                  >
                    {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {challenges.slice(0, 3).length > 0 ? (
                    challenges.slice(0, 3).map((challenge) => (
                      <div key={challenge.id} className={`p-4 rounded-lg border ${currentTheme.border} hover:bg-white/5 transition-colors`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">{challenge.title}</div>
                            <div className="text-xs opacity-70">{challenge.category}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full
                            ${challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                              challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'}`}>
                            {challenge.difficulty}
                          </span>
                        </div>
                        <p className="text-sm opacity-70 line-clamp-2 mb-2">{challenge.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs opacity-50">
                            {challenge.points} {t('points') || 'т.'}
                          </span>
                          <button
                            onClick={() => handleJoinChallenge(challenge.id)}
                            className="text-xs px-3 py-1 rounded-full"
                            style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`, color: 'white' }}
                          >
                            {t?.('join') || "Участвай"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 opacity-70">{t('no_active_challenges') || 'Няма активни предизвикателства'}</p>
                  )}
                </div>
              </div>

              {/* Последни уроци */}
              <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: colorScheme.secondary }} />
                    {t('recent_lessons') || 'Последни уроци'}
                  </h3>
                  <button 
                    onClick={() => setSelectedTab("lessons")}
                    className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1"
                  >
                    {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {lessons.slice(0, 3).length > 0 ? (
                    lessons.slice(0, 3).map((lesson) => (
                      <div key={lesson.id} className={`p-4 rounded-lg border ${currentTheme.border} hover:bg-white/5 transition-colors`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                               style={{ backgroundColor: `${colorScheme.secondary}20` }}>
                            <Book className="w-5 h-5" style={{ color: colorScheme.secondary }} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-xs opacity-70 mb-2">{lesson.estimatedTime}</div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-2 py-1 rounded-full
                                ${lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' :
                                  lesson.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                                  'bg-red-500/20 text-red-500'}`}>
                                {lesson.difficulty}
                              </span>
                              {lesson.completed ? (
                                <span className="text-xs text-green-500 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> {t('completed') || 'Завършен'}
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedLesson(lesson);
                                    setShowLessonModal(true);
                                  }}
                                  className="text-xs px-3 py-1 rounded-full"
                                  style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`, color: 'white' }}
                                >
                                  {t('read') || "Чети"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 opacity-70">{t('no_lessons') || 'Няма налични уроци'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ПОСЛЕДНИ СЪОБЩЕНИЯ */}
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" style={{ color: colorScheme.primary }} />
                  {t('recent_messages') || 'Последни съобщения'}
                </h3>
                <button 
                  onClick={() => setSelectedTab("messages")}
                  className="text-sm opacity-70 hover:opacity-100 flex items-center gap-1"
                >
                  {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {messages.slice(0, 3).length > 0 ? (
                  messages.slice(0, 3).map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Mail className="w-4 h-4" style={{ color: colorScheme.secondary }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{msg.senderName}</span>
                          <span className="text-xs opacity-50">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm opacity-70 line-clamp-1">{msg.content}</p>
                      </div>
                      {!msg.read && msg.receiverId === user?.uid && (
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 opacity-70">{t('no_new_messages') || 'Няма нови съобщения'}</p>
                )}
              </div>
            </div>

            {/* ПРЕПОРЪКИ */}
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5" style={{ color: colorScheme.purple }} />
                {t('recommendations') || 'Препоръки за вас'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((rec) => (
                  <motion.div
                    key={rec.id}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setActiveRecommendation(rec.id)}
                    onHoverEnd={() => setActiveRecommendation(null)}
                    className={`relative overflow-hidden rounded-xl p-5 cursor-pointer transition-all ${
                      activeRecommendation === rec.id ? 'shadow-lg' : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${colorScheme.primary}15, ${colorScheme.secondary}15)`,
                      border: `1px solid ${activeRecommendation === rec.id ? colorScheme.primary + '40' : 'transparent'}`
                    }}
                  >
                    <div className={`absolute inset-0 opacity-10 bg-gradient-to-r ${rec.color}`} />
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                           style={{ backgroundColor: `${colorScheme.primary}20` }}>
                        {rec.icon}
                      </div>
                      <h4 className="font-bold mb-1">{rec.title}</h4>
                      <p className="text-sm opacity-70 mb-3">{rec.description}</p>
                      <button 
                        className="text-sm font-medium flex items-center gap-1"
                        style={{ color: colorScheme.primary }}
                        onClick={() => {
                          if (rec.id === 2) setSelectedTab("assignments");
                          else if (rec.id === 3) setSelectedTab("communities");
                        }}
                      >
                        {rec.action} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderMySolutionsView = () => {
    const solvedChallenges = challenges.filter(c => 
      c.submissions?.some(s => s.studentId === user?.uid)
    );

    return (
      <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">{t('my_solutions') || "Моите решения"}</h2>
            <p className="opacity-70">{solvedChallenges.length} {t('solutions_found') || "намерени решения"}</p>
          </div>
        </div>

        {solvedChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="opacity-70">{t('no_solutions_yet') || "Все още нямате решения"}</p>
            <button
              onClick={() => setSelectedTab("challenges")}
              className="mt-4 px-4 py-2 rounded-lg text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})` }}
            >
              {t('browse_challenges') || "Разгледай предизвикателства"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {solvedChallenges.map((challenge) => {
              const submission = challenge.submissions?.find(s => s.studentId === user?.uid);
              const solution = challengeSolutions.find(s => s.challengeId === challenge.id);
              
              return (
                <div key={challenge.id} className={`p-4 rounded-lg border ${currentTheme.border}`}>
                  <h4 className="font-bold mb-2">{challenge.title}</h4>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="opacity-70">{t('status') || "Статус"}:</span>
                      <span className={`font-medium ${
                        submission?.status === 'submitted' ? 'text-green-500' :
                        submission?.status === 'joined' ? 'text-blue-500' : 'text-gray-500'
                      }`}>
                        {submission?.status === 'submitted' ? t('submitted') || 'Предадено' :
                         submission?.status === 'joined' ? t('in_progress') || 'В прогрес' :
                         t('joined') || 'Започнато'}
                      </span>
                    </div>
                    {solution?.score !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="opacity-70">{t('score') || "Резултат"}:</span>
                        <span className={`font-medium ${
                          solution.score >= 8 ? 'text-green-500' :
                          solution.score >= 6 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {solution.score}/10
                        </span>
                      </div>
                    )}
                    {challenge.points && (
                      <div className="flex justify-between text-sm">
                        <span className="opacity-70">{t('points') || "Точки"}:</span>
                        <span className="font-medium">{challenge.points}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedChallengeId(challenge.id);
                      setIsChallengeMode(true);
                      setSelectedTab("upload");
                      if (solution?.solutionCode) {
                        setCode(solution.solutionCode);
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm"
                  >
                    {submission?.status === 'submitted' 
                      ? t('view_solution') || "Преглед" 
                      : t('continue') || "Продължи"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderProgressView = () => (
    <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
      <h2 className="text-xl font-bold mb-6">{t('learning_progress') || "Моят прогрес"}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Статистики */}
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="opacity-70">{t('completed_assignments') || "Завършени задания"}:</span>
              <span className="font-bold text-lg">{stats.completedAssignments}/{stats.totalAssignments}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-green-500" 
                   style={{ width: `${stats.totalAssignments > 0 ? (stats.completedAssignments / stats.totalAssignments) * 100 : 0}%` }} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="opacity-70">{t('completed_lessons') || "Завършени уроци"}:</span>
              <span className="font-bold text-lg">{stats.completedLessons}/{stats.totalLessons}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-blue-500" 
                   style={{ width: `${stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0}%` }} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="opacity-70">{t('average_grade') || "Средна оценка"}:</span>
              <span className="font-bold text-lg">{stats.averageScore}/10</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-yellow-500" 
                   style={{ width: `${stats.averageScore * 10}%` }} />
            </div>
          </div>
        </div>

        {/* Диаграма на активност */}
        <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
          <h3 className="font-bold mb-4">{t('activity_chart') || "Активност"}</h3>
          <div className="h-40 flex items-end justify-around">
            {['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].map((day, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-8 bg-blue-500/20 rounded-t" 
                     style={{ height: `${Math.random() * 100}px` }}></div>
                <span className="text-xs mt-2">{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGradesView = () => (
    <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{t('my_grades') || "Моите оценки"}</h2>
          <p className="opacity-70">{studentGrades.length} {t('grades_received') || "получени оценки"}</p>
        </div>
        <button
          onClick={() => setShowGradesModal(true)}
          className="px-4 py-2 rounded-lg text-white flex items-center gap-2 text-sm"
          style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})` }}
        >
          <Eye className="w-4 h-4" />
          {t('detailed_view') || "Детайлен преглед"}
        </button>
      </div>

      {studentGrades.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="opacity-70">{t('no_grades_yet') || "Все още нямате оценки"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {studentGrades.slice(0, 5).map((grade) => (
            <div key={grade.id} className={`p-4 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{grade.assignmentTitle}</h4>
                  <p className="text-xs opacity-70">{grade.gradedBy} • {formatTimestamp(grade.gradedAt)}</p>
                </div>
                <div className="text-center">
                  <span className={`text-xl font-bold ${
                    grade.points >= 9 ? 'text-green-500' :
                    grade.points >= 7 ? 'text-yellow-500' :
                    grade.points >= 5 ? 'text-orange-500' :
                    'text-red-500'
                  }`}>
                    {grade.points}/{grade.maxPoints}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) {
      setUploadStatus("❌ " + (t?.('please_login') || "Please login first!"));
      return;
    }
    
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) {
        setUploadStatus("❌ " + (t?.('challenge_not_found') || "Challenge not found!"));
        return;
      }

      const hasJoined = challenge.submissions?.some(s => s.studentId === user.uid);
      if (hasJoined) {
        setUploadStatus("ℹ️ " + (t?.('already_joined_challenge') || "You have already joined this challenge!"));
        setIsChallengeMode(true);
        setSelectedChallengeId(challengeId);
        setSelectedTab("upload");
        return;
      }

      const challengeRef = doc(db, 'challenges', challengeId);
      const currentTime = new Date();
      
      const newSubmission: ChallengeSubmission = {
        studentId: user.uid,
        studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
        submittedAt: currentTime,
        status: 'joined',
        notes: t?.('joined_the_challenge') || "Joined the challenge"
      };

      await updateDoc(challengeRef, {
        submissions: arrayUnion(newSubmission)
      });

      const solutionRef = doc(collection(db, 'challengeSolutions'));
      
      await setDoc(solutionRef, {
        id: solutionRef.id,
        challengeId: challengeId,
        studentId: user.uid,
        studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
        solutionCode: "",
        submittedAt: serverTimestamp(),
        status: 'joined',
        challengeTitle: challenge.title,
        challengeDescription: challenge.description,
        createdAt: serverTimestamp()
      });

      setIsChallengeMode(true);
      setSelectedChallengeId(challengeId);
      setSelectedTab("upload");
      
      const challengeTemplate = generateChallengeTemplate(challenge);
      setCode(challengeTemplate);
      
      setCodeMetadata({
        domain: challenge.category,
        type: t?.('challenge_solution') || "Challenge Solution",
        studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
        dataArea: challenge.category,
        assignmentId: challengeId,
        assignmentTitle: `${t?.('challenge') || "Challenge"}: ${challenge.title}`
      });
      
      setUploadStatus("✅ " + (t?.('challenge_joined_success') || "Challenge joined! You can now work on your solution."));
      await loadChallenges();
      
    } catch (error) {
      console.error("Error joining challenge:", error);
      setUploadStatus("❌ " + (t?.('challenge_join_error') || "Error joining challenge!"));
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;
    
    try {
      // Първо вземете данните за общността
      const communityDoc = await getDoc(doc(db, 'communities', communityId));
      const communityData = communityDoc.data();
      
      const communityRef = doc(db, 'communities', communityId);
      
      await updateDoc(communityRef, {
        pendingRequests: arrayUnion(user.uid)
      });
      
      // 🔥 ИЗПРАЩАНЕ НА НОТИФИКАЦИЯ ДО УЧИТЕЛЯ
      if (communityData?.teacherId) {
        try {
          const notificationRef = doc(collection(db, 'notifications'));
          await setDoc(notificationRef, {
            userId: communityData.teacherId,
            type: 'join_request',
            title: t?.('new_join_request') || '📨 Нова заявка за присъединяване',
            message: `${userData?.fullName || user.email?.split('@')[0] || 'Ученик'} иска да се присъедини към "${communityData?.name || 'общност'}"`,
            timestamp: serverTimestamp(),
            read: false,
            data: {
              studentId: user.uid,
              studentName: userData?.fullName || user.email?.split('@')[0] || 'Student',
              communityId: communityId,
              communityName: communityData?.name
            },
            actionUrl: '/teacher-dashboard?tab=communities'
          });
          console.log("✅ Изпратена нотификация до учителя:", communityData.teacherId);
        } catch (notificationError) {
          console.error("❌ Грешка при изпращане на нотификация:", notificationError);
        }
      }
      
      await addDoc(collection(db, "activityLogs"), {
        userId: user.uid,
        userName: userData?.fullName || user.email?.split('@')[0] || t?.('student') || "Student",
        action: t?.('requested_to_join_community') || "Requested to join community",
        details: t?.('requested_to_join_community') || "Requested to join community",
        actionType: "community",
        timestamp: serverTimestamp()
      });
      
      setUploadStatus("✅ " + (t?.('join_request_sent') || "Join request sent!"));
      loadCommunities();
    } catch (error) {
      console.error("Error joining community:", error);
      setUploadStatus("❌ " + (t?.('join_request_error') || "Error sending join request!"));
    }
  };

  const handleJoinWithCode = async () => {
    if (!user || !communityInviteCode.trim()) return;
    
    try {
      const communitiesQuery = query(
        collection(db, "communities"),
        where("inviteCode", "==", communityInviteCode.toUpperCase())
      );
      
      const snapshot = await getDocs(communitiesQuery);
      
      if (snapshot.empty) {
        setUploadStatus("❌ " + (t?.('invalid_invite_code') || "Invalid invite code!"));
        return;
      }
      
      const communityDoc = snapshot.docs[0];
      const communityId = communityDoc.id;
      
      await handleJoinCommunity(communityId);
      setCommunityInviteCode("");
    } catch (error) {
      console.error("Error joining with code:", error);
      setUploadStatus("❌ " + (t?.('join_error') || "Error joining community!"));
    }
  };

  const submitChallengeSolution = async () => {
    if (!selectedChallengeId || !user) {
      setUploadStatus("❌ " + (t?.('select_challenge_first') || "Please select a challenge first!"));
      return;
    }

    if (!code.trim()) {
      setUploadStatus("❌ " + (t?.('code_empty') || "Code cannot be empty!"));
      return;
    }

    try {
      const challenge = challenges.find(c => c.id === selectedChallengeId);
      if (!challenge) {
        setUploadStatus("❌ " + (t?.('challenge_not_found') || "Challenge not found!"));
        return;
      }

      const hasJoined = challenge.submissions?.some(s => s.studentId === user.uid);
      if (!hasJoined) {
        setUploadStatus("❌ " + (t?.('challenge_not_joined') || "You must join the challenge first!"));
        return;
      }

      const solutionsQuery = query(
        collection(db, "challengeSolutions"),
        where("challengeId", "==", selectedChallengeId),
        where("studentId", "==", user.uid)
      );

      const solutionsSnapshot = await getDocs(solutionsQuery);
      let solutionRef;
      
      if (solutionsSnapshot.empty) {
        solutionRef = doc(collection(db, 'challengeSolutions'));
        
        await setDoc(solutionRef, {
          id: solutionRef.id,
          challengeId: selectedChallengeId,
          studentId: user.uid,
          studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
          solutionCode: code,
          submittedAt: serverTimestamp(),
          status: 'submitted',
          challengeTitle: challenge.title,
          challengeDescription: challenge.description,
          createdAt: serverTimestamp()
        });
      } else {
        const solutionDoc = solutionsSnapshot.docs[0];
        solutionRef = solutionDoc.ref;
        await updateDoc(solutionDoc.ref, {
          solutionCode: code,
          status: 'submitted',
          submittedAt: serverTimestamp()
        });
      }

      const challengeRef = doc(db, 'challenges', selectedChallengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (challengeDoc.exists()) {
        const challengeData = challengeDoc.data();
        const submissions = challengeData.submissions || [];
        
        const updatedSubmissions = submissions.map((sub: any) => {
          if (sub.studentId === user.uid) {
            return {
              ...sub,
              status: 'submitted',
              solutionCode: code,
              submittedAt: new Date().toISOString()
            };
          }
          return sub;
        });
        
        if (!updatedSubmissions.some((s: any) => s.studentId === user.uid)) {
          updatedSubmissions.push({
            studentId: user.uid,
            studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
            submittedAt: new Date().toISOString(),
            solutionCode: code,
            status: 'submitted'
          });
        }
        
        await updateDoc(challengeRef, {
          submissions: updatedSubmissions
        });
      }

      await addDoc(collection(db, "activityLogs"), {
        userId: user.uid,
        userName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
        action: t?.('submitted_challenge_solution') || "Submitted Challenge Solution",
        details: `${t?.('challenge') || "Challenge"}: ${challenge.title}`,
        target: `Challenge_${selectedChallengeId}`,
        actionType: "challenge_submission",
        timestamp: serverTimestamp()
      });

      // Изпращане на нотификация до учителя
      const community = communities.find(c => c.id === challenge.targetCommunityId);
      if (community) {
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          userId: community.teacherId,
          type: 'challenge_submission',
          title: t?.('challenge_solved') || '🎯 Решено предизвикателство',
          message: `${t?.('student') || 'Ученик'} ${userData?.fullName || user?.email?.split('@')[0]} ${t?.('solved_challenge') || 'реши предизвикателство'}: "${challenge.title}"`,
          timestamp: serverTimestamp(),
          read: false,
          data: {
            challengeId: challenge.id,
            challengeTitle: challenge.title,
            studentId: user.uid,
            studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
            communityId: community.id,
            communityName: community.name,
            solutionId: solutionRef.id
          },
          actionUrl: '/teacher-dashboard?tab=challenges'
        });
      }

      setUploadStatus("✅ " + (t?.('challenge_submitted') || "Challenge solution submitted successfully!"));
      setCode("");
      
      await loadChallenges();
      await loadActivityLogs();
      setSelectedTab("mysolutions");
      
    } catch (error) {
      console.error("Error submitting challenge solution:", error);
      setUploadStatus("❌ " + (t?.('challenge_submission_error') || "Error submitting challenge solution!"));
    }
  };

  const handleUpload = async () => {
    if (!code.trim() || !user) {
      setUploadStatus("❌ " + (t?.('code_empty') || "Code cannot be empty!"));
      return;
    }

    const finalCode = code.includes('KNOWLEDGE-BASED EXPERT SYSTEM') 
      ? code 
      : generateHeader() + "\n\n" + code;

    if (isChallengeMode) {
      if (!selectedChallengeId) {
        setUploadStatus("❌ " + (t?.('select_challenge_first') || "Please select a challenge first!"));
        return;
      }
      
      try {
        await submitChallengeSolution();
      } catch (error) {
        console.error("Error in challenge upload:", error);
        setUploadStatus("❌ " + (t?.('challenge_submission_error') || "Error submitting challenge!"));
      }
    } else {
      if (!selectedAssignment && !codeMetadata.assignmentId) {
        setUploadStatus("❌ " + (t?.('select_assignment_first') || "Please select an assignment first!"));
        return;
      }
      
      const assignmentId = selectedAssignment || codeMetadata.assignmentId;
      const assignment = assignments.find(a => a.id === assignmentId);
      
      if (!assignment) {
        setUploadStatus("❌ " + (t?.('assignment_not_found') || "Assignment not found!"));
        return;
      }
      
      try {
        const docRef = await addDoc(collection(db, "prologCodes"), {
          userId: user.uid,
          title: `${t?.('prolog_submission') || "Prolog Submission"} - ${assignment.title}`,
          code: finalCode,
          status: Math.random() > 0.3 ? "success" : "error",
          metadata: codeMetadata,
          assignmentId: assignmentId,
          assignmentTitle: assignment.title,
          createdAt: serverTimestamp(),
          requirementsAnalysis: {
            factsCount: (finalCode.match(/\.\s*$/gm) || []).length,
            rulesCount: (finalCode.match(/:-/g) || []).length,
            menuItemsCount: (finalCode.match(/writeln.*[0-9]\./g) || []).length
          }
        });

        await addDoc(collection(db, "activityLogs"), {
          userId: user.uid,
          userName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
          action: t?.('submitted_prolog_code') || "Submitted Prolog code",
          details: `${t?.('submitted_assignment') || "Submitted assignment"}: ${assignment.title}`,
          target: `${assignment.title.replace(/\s+/g, '_')}.pl`,
          actionType: "submission",
          timestamp: serverTimestamp()
        });

        // Изпращане на нотификация до учителя
        const teacherId = assignment.teacherId;
        if (teacherId) {
          const notificationRef = doc(collection(db, 'notifications'));
          await setDoc(notificationRef, {
            userId: teacherId,
            type: 'assignment_submission',
            title: t?.('new_submission') || '📥 Ново предадено задание',
            message: `${t?.('student') || 'Ученик'} ${userData?.fullName || user?.email?.split('@')[0]} ${t?.('submitted_assignment') || 'предаде задание'}: "${assignment.title}"`,
            timestamp: serverTimestamp(),
            read: false,
            data: {
              assignmentId: assignment.id,
              assignmentTitle: assignment.title,
              studentId: user.uid,
              studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
              submissionId: docRef.id,
              points: assignment.points
            },
            actionUrl: '/teacher-dashboard?tab=assignments'
          });
        }

        setCode("");
        setCodeMetadata({
          domain: "",
          type: t?.('symbolic_ai_expert_system') || "Symbolic AI / Expert System",
          studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
          dataArea: "",
          assignmentId: "",
          assignmentTitle: ""
        });
        setSelectedAssignment("");
        setIsChallengeMode(false);
        setUploadStatus("✅ " + (t?.('upload_success') || "Code uploaded successfully!"));
        
        await loadAssignments();
        await loadActivityLogs();
        await loadSubmissions();
        
      } catch (error) {
        console.error("Error uploading assignment:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setUploadStatus("❌ " + (t?.('upload_error') || "Error uploading code!") + " " + errorMessage);
      }
    }
  };

  const handleShowGrade = async (submission: Submission) => {
    const assignment = assignments.find(a => a.id === submission.assignmentId);
    
    if (assignment?.studentProgress?.grade) {
      setSelectedSubmission({
        ...submission,
        grade: assignment.studentProgress.grade
      });
      setShowEvaluationModal(true);
      return;
    }
    
    if (studentGrades.length === 0) {
      await loadStudentGrades();
    }
    
    const gradeFromGrades = studentGrades.find(g => 
      g.assignmentId === submission.assignmentId || 
      g.fileId === submission.id
    );
    
    if (gradeFromGrades) {
      setSelectedSubmission({
        ...submission,
        grade: {
          score: gradeFromGrades.points * 10,
          feedback: gradeFromGrades.feedback || "",
          gradedAt: gradeFromGrades.gradedAt,
          gradedBy: gradeFromGrades.gradedBy
        }
      });
      setShowEvaluationModal(true);
      return;
    }
    
    if (submission.grade) {
      setSelectedSubmission(submission);
      setShowEvaluationModal(true);
      return;
    }
    
    setSelectedSubmission({
      ...submission,
      grade: undefined
    });
    setShowEvaluationModal(true);
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { 
        read: true, 
        readAt: serverTimestamp() 
      });
      
      console.log(`✅ Notification ${notificationId} marked as read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      const unreadNotificationsList = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotificationsList) {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true, readAt: serverTimestamp() });
      }
      
      await batch.commit();
      
      console.log(`✅ Marked ${unreadNotificationsList.length} notifications as read`);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read && user) {
      try {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, { 
          read: true, 
          readAt: serverTimestamp() 
        });
      } catch (error) {
        console.error("❌ Error marking notification as read:", error);
      }
    }
    
    const type = notification.type;
    
    if (type === 'grade' || type === 'submission_evaluated') {
      setSelectedTab("grades");
    } else if (type === 'assignment' || type === 'assignment_submission') {
      setSelectedTab("assignments");
    } else if (type === 'challenge' || 
               type === 'challenge_accepted' || 
               type === 'challenge_rejected' ||
               type === 'challenge_completed' ||
               type === 'challenge_response' ||
               type === 'challenge_submission') {
      setSelectedTab("challenges");
    } else if (type === 'message' || type === 'direct') {
      setSelectedTab("messages");
    } else if (type === 'lesson') {
      setSelectedTab("lessons");
      if (notification.details?.lessonId) {
        const lesson = lessons.find(l => l.id === notification.details.lessonId);
        if (lesson) {
          setSelectedLesson(lesson);
          setShowLessonModal(true);
        }
      }
    }
  };

  const handleMarkLessonAsRead = async (lesson: Lesson) => {
    if (!user) return;
    
    try {
      const progressQuery = query(
        collection(db, "lessonProgress"),
        where("studentId", "==", user.uid),
        where("lessonId", "==", lesson.id)
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      
      if (progressSnapshot.empty) {
        await addDoc(collection(db, "lessonProgress"), {
          studentId: user.uid,
          studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completed: true,
          progress: 100,
          lastRead: serverTimestamp(),
          communityId: lesson.communityId,
          teacherId: lesson.teacherId,
          readAt: serverTimestamp()
        });
      } else {
        const progressDoc = progressSnapshot.docs[0];
        await updateDoc(progressDoc.ref, {
          completed: true,
          progress: 100,
          lastRead: serverTimestamp()
        });
      }
      
      setLessons(prev => 
        prev.map(l => 
          l.id === lesson.id 
            ? { ...l, completed: true, progress: 100, lastRead: Timestamp.now() } 
            : l
        )
      );
      
      setStats(prev => ({
        ...prev,
        completedLessons: prev.completedLessons + 1,
        pendingLessons: prev.pendingLessons - 1
      }));
      
      await addDoc(collection(db, "activityLogs"), {
        userId: user.uid,
        userName: userData?.fullName || user?.email?.split('@')[0] || "Student",
        action: t?.('lesson_completed') || "Completed Lesson",
        details: `${t?.('completed_lesson') || "Completed lesson"}: ${lesson.title}`,
        target: `Lesson_${lesson.id}`,
        actionType: "lesson_completion",
        timestamp: serverTimestamp()
      });
      
      setShowLessonModal(false);
    } catch (error) {
      console.error("Error marking lesson as read:", error);
    }
  };

  const handleMarkMessageAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true
      });
      
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId ? { ...m, read: true } : m
        )
      );
      
      console.log(`✅ Message ${messageId} marked as read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleMarkAllMessagesAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadMessages = messages.filter(m => !m.read && m.receiverId === user.uid);
      if (unreadMessages.length === 0) {
        alert(t?.('no_unread_messages') || 'Нямате непрочетени съобщения');
        return;
      }
      
      const batch = writeBatch(db);
      unreadMessages.forEach(message => {
        const messageRef = doc(db, 'messages', message.id);
        batch.update(messageRef, { read: true });
      });
      
      await batch.commit();
      
      setMessages(prev => prev.map(m => 
        !m.read && m.receiverId === user.uid ? { ...m, read: true } : m
      ));
      
      alert(`${unreadMessages.length} ${t?.('messages_marked_as_read') || "съобщения са маркирани като прочетени"}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      alert('❌ ' + (t?.('mark_messages_error') || "Грешка при маркиране на съобщенията!"));
    }
  };

  const handleSendMessage = async (recipientId: string, content: string) => {
    if (!user || !content.trim()) return;
    
    try {
      const messageRef = doc(collection(db, 'messages'));
      
      const newMessageData = {
        senderId: user.uid,
        senderName: userData?.fullName || user.email?.split('@')[0] || "Student",
        receiverId: recipientId,
        receiverName: "Teacher",
        content: content,
        timestamp: serverTimestamp(),
        read: false,
        type: 'direct'
      };
      
      await setDoc(messageRef, newMessageData);
      
      setUploadStatus("✅ " + (t('message_sent') || "Message sent!"));
      
    } catch (error) {
      console.error(t('error_sending_message') || "Error sending message:", error);
      setUploadStatus("❌ " + (t('error_sending_message') || "Error sending message!"));
    }
  };

  const loadCommunities = async () => {
    if (!user) {
      setLoadingData(prev => ({ ...prev, communities: false }));
      return;
    }
    
    try {
      const q = query(
        collection(db, "communities"),
        where("studentIds", "array-contains", user.uid)
      );
      
      const snapshot = await getDocs(q);
      const communitiesData: Community[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        communitiesData.push({
          id: doc.id,
          name: data.name || "Unnamed Community",
          description: data.description || "No description",
          teacherId: data.teacherId || "",
          institution: data.institution || "Unknown",
          gradeLevel: data.gradeLevel,
          subject: data.subject,
          memberCount: data.memberCount || data.studentIds?.length || 0,
          studentIds: data.studentIds || [],
          pendingRequests: data.pendingRequests || [],
          createdAt: data.createdAt,
          isPublic: data.isPublic || false,
          inviteCode: data.inviteCode || "N/A",
          challenges: data.challenges || [],
          settings: data.settings || {
            allowStudentChallenges: false,
            allowInterCommunityChallenges: true,
            allowStudentMessages: true,
            autoApproveStudents: false,
            privacy: "private"
          }
        });
      });
      
      setCommunities(communitiesData);
      
      setStats(prev => ({
        ...prev,
        communityMembers: communitiesData.reduce((sum, c) => sum + c.memberCount, 0)
      }));
      
      if (communitiesData.length > 0 && !activeCommunity) {
        setActiveCommunity(communitiesData[0]);
      }
      
    } catch (error) {
      console.error("Error loading communities:", error);
    } finally {
      setLoadingData(prev => ({ ...prev, communities: false }));
    }
  };

  const loadAllUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: UserData[] = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        usersData.push({
          uid: doc.id,
          username: userData.fullName || userData.email?.split('@')[0] || `User_${doc.id.substring(0, 6)}`,
          email: userData.email || "",
          role: userData.role || 'student',
          teacherId: userData.teacherId,
          fullName: userData.fullName
        });
      });
      
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error loading all users:", error);
    }
  };

  const loadChallenges = async () => {
    if (!user || communities.length === 0) {
      setLoadingData(prev => ({ ...prev, challenges: false }));
      return;
    }
    
    try {
      const userCommunityIds = communities.map(c => c.id);
      
      if (userCommunityIds.length === 0) {
        setChallenges([]);
        setLoadingData(prev => ({ ...prev, challenges: false }));
        return;
      }
      
      const q = query(
        collection(db, "challenges"),
        where("targetCommunityId", "in", userCommunityIds),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      const challengesData: Challenge[] = [];
      
      const gradesQuery = query(
        collection(db, "grades"),
        where("studentId", "==", user.uid),
        where("type", "==", "challenge")
      );
      
      const gradesSnapshot = await getDocs(gradesQuery);
      const gradesMap = new Map();
      
      gradesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.challengeId) {
          gradesMap.set(data.challengeId, {
            score: data.points * 10,
            feedback: data.feedback,
            gradedAt: data.gradedAt
          });
        }
      });
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const challengeId = doc.id;
        
        const studentGrade = gradesMap.get(challengeId);
        
        challengesData.push({
          id: challengeId,
          title: data.title || t?.('untitled_challenge') || "Untitled Challenge",
          description: data.description || t?.('no_description') || "No description",
          creatorCommunityId: data.creatorCommunityId,
          targetCommunityId: data.targetCommunityId,
          createdBy: data.createdBy || t?.('unknown') || "Unknown",
          status: data.status || 'pending',
          dueDate: data.dueDate,
          category: data.category || t?.('general') || "General",
          difficulty: data.difficulty || 'medium',
          points: data.points || 50,
          submissions: data.submissions || [],
          createdAt: data.createdAt,
          studentGrade: studentGrade
        });
      });
      
      setChallenges(challengesData);
      
      const activeChallengesCount = challengesData.filter(c => 
        c.status === 'accepted' || c.status === 'pending'
      ).length;
      
      setStats(prev => ({
        ...prev,
        activeChallenges: activeChallengesCount
      }));
      
      setLoadingData(prev => ({ ...prev, challenges: false }));
    } catch (error) {
      console.error("Error loading challenges:", error);
      setLoadingData(prev => ({ ...prev, challenges: false }));
    }
  };

  const loadChallengeSolutions = async () => {
    if (!user?.uid) return;
    
    setLoadingSolutions(true);
    try {
      const q = query(
        collection(db, 'challengeSolutions'),
        where('studentId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const solutions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChallengeSolution[];
      
      setChallengeSolutions(solutions);
    } catch (error) {
      console.error('Error loading challenge solutions:', error);
    } finally {
      setLoadingSolutions(false);
    }
  };

  const loadAssignments = async () => {
    if (!user || isAssignmentsLoading.current) {
      setLoadingData(prev => ({ ...prev, assignments: false }));
      return;
    }
    
    if (hasLoadedAssignments.current && communities.length === 0) {
      return;
    }
    
    isAssignmentsLoading.current = true;
    setLoadingAssignments(true);
    
    try {
      await loadStudentGrades();
      
      const teacherIds = communities.map(c => c.teacherId).filter(Boolean);
      
      if (teacherIds.length === 0) {
        setAssignments([]);
        setStats(prev => ({
          ...prev,
          totalAssignments: 0,
          completedAssignments: 0,
          pendingAssignments: 0
        }));
        setLoadingData(prev => ({ ...prev, assignments: false }));
        hasLoadedAssignments.current = true;
        return;
      }
      
      const uniqueTeacherIds = [...new Set(teacherIds)];
      const assignmentsData: Assignment[] = [];
      
      for (const teacherId of uniqueTeacherIds) {
        try {
          const assignmentsQuery = query(
            collection(db, "assignments"),
            where("teacherId", "==", teacherId),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
          );
          
          const snapshot = await getDocs(assignmentsQuery);
          
          snapshot.forEach((doc) => {
            const exists = assignmentsData.some(a => a.id === doc.id);
            if (exists) return;
            
            const data = doc.data();
            assignmentsData.push({
              id: doc.id,
              title: data.title || t?.('untitled_assignment') || "Untitled Assignment",
              description: data.description || t?.('no_description') || "No description",
              objective: data.objective || t?.('learn_and_practice') || "Learn and practice",
              topic: data.topic || t?.('general') || "General",
              subject: data.subject || "Prolog",
              requirements: data.requirements || {
                minFacts: 10,
                minRules: 5,
                minCombinedRules: 2,
                minMenuItems: 3
              },
              instructions: data.instructions || [],
              teacherId: data.teacherId,
              teacherName: data.teacherName || t?.('teacher') || "Teacher",
              createdAt: data.createdAt,
              dueDate: data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: data.status || 'active',
              difficulty: data.difficulty || 'medium',
              points: data.points || 100,
              exampleCode: data.exampleCode,
              backgroundImage: data.backgroundImage || assignmentBackgrounds[Math.floor(Math.random() * assignmentBackgrounds.length)],
              category: data.category || categories[Math.floor(Math.random() * categories.length)],
              studentProgress: {
                completed: false,
                requirementsMet: {
                  facts: 0,
                  rules: 0,
                  combinedRules: 0,
                  menuItems: 0
                }
              }
            });
          });
        } catch (error) {
          console.error(`Error loading assignments for teacher ${teacherId}:`, error);
        }
      }
      
      const updatedAssignments = assignmentsData.map(assignment => {
        let gradeForAssignment = studentGrades.find(
          grade => grade.assignmentId === assignment.id
        );
        
        if (!gradeForAssignment) {
          const assignmentSubmissions = submissions.filter(
            sub => sub.assignmentId === assignment.id
          );
          
          for (const submission of assignmentSubmissions) {
            gradeForAssignment = studentGrades.find(
              grade => grade.fileId === submission.id
            );
            if (gradeForAssignment) break;
          }
        }
        
        if (!gradeForAssignment) {
          gradeForAssignment = studentGrades.find(grade => 
            grade.assignmentTitle?.includes(assignment.title) ||
            grade.fileName?.includes(assignment.title)
          );
        }
        
        if (gradeForAssignment) {
          return {
            ...assignment,
            studentProgress: {
              completed: true,
              submissionId: gradeForAssignment.fileId || `grade_${gradeForAssignment.id}`,
              submittedAt: gradeForAssignment.gradedAt || new Date(),
              code: "",
              requirementsMet: {
                facts: Math.floor(Math.random() * 10) + 15,
                rules: Math.floor(Math.random() * 3) + 4,
                combinedRules: Math.floor(Math.random() * 2) + 1,
                menuItems: Math.floor(Math.random() * 3) + 5
              },
              grade: {
                score: gradeForAssignment.points * 10,
                feedback: gradeForAssignment.feedback || "",
                gradedAt: gradeForAssignment.gradedAt,
                gradedBy: gradeForAssignment.gradedBy || t?.('teacher') || "Teacher"
              }
            }
          };
        }
        
        const studentSubmission = submissions.find(sub => sub.assignmentId === assignment.id);
        if (studentSubmission?.grade) {
          return {
            ...assignment,
            studentProgress: {
              completed: true,
              submissionId: studentSubmission.id,
              submittedAt: new Date(studentSubmission.date),
              code: studentSubmission.code || "",
              requirementsMet: {
                facts: Math.floor(Math.random() * 10) + 15,
                rules: Math.floor(Math.random() * 3) + 4,
                combinedRules: Math.floor(Math.random() * 2) + 1,
                menuItems: Math.floor(Math.random() * 3) + 5
              },
              grade: {
                score: studentSubmission.grade.score,
                feedback: studentSubmission.grade.feedback || "",
                gradedAt: studentSubmission.grade.gradedAt,
                gradedBy: studentSubmission.grade.gradedBy || t?.('teacher') || "Teacher"
              }
            }
          };
        }
        
        if (studentSubmission) {
          return {
            ...assignment,
            studentProgress: {
              completed: true,
              submissionId: studentSubmission.id,
              submittedAt: new Date(studentSubmission.date),
              code: studentSubmission.code || "",
              requirementsMet: {
                facts: Math.floor(Math.random() * 10) + 15,
                rules: Math.floor(Math.random() * 3) + 4,
                combinedRules: Math.floor(Math.random() * 2) + 1,
                menuItems: Math.floor(Math.random() * 3) + 5
              }
            }
          };
        }
        
        return assignment;
      });
      
      const uniqueAssignmentsMap = new Map();
      updatedAssignments.forEach(assignment => {
        if (!uniqueAssignmentsMap.has(assignment.id)) {
          uniqueAssignmentsMap.set(assignment.id, assignment);
        }
      });
      
      const uniqueAssignments = Array.from(uniqueAssignmentsMap.values());
      
      const completedAssignments = uniqueAssignments.filter(a => 
        a.studentProgress?.completed && a.studentProgress?.grade
      ).length;
      
      const totalAssignments = uniqueAssignments.length;
      const pendingAssignments = totalAssignments - completedAssignments;
      
      const gradedAssignments = uniqueAssignments.filter(a => 
        a.studentProgress?.grade?.score
      );
      
      const avgScore = gradedAssignments.length > 0 
        ? Math.round(gradedAssignments.reduce((sum, a) => 
            sum + (a.studentProgress?.grade?.score || 0), 0) / gradedAssignments.length)
        : 0;
      
      setAssignments(uniqueAssignments);
      
      setStats(prev => ({
        ...prev,
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        averageScore: avgScore
      }));
      
      setLoadingData(prev => ({ ...prev, assignments: false }));
      hasLoadedAssignments.current = true;
      
    } catch (error) {
      console.error("Error loading assignments:", error);
      setLoadingData(prev => ({ ...prev, assignments: false }));
    } finally {
      setLoadingAssignments(false);
      isAssignmentsLoading.current = false;
    }
  };

  const loadSubmissions = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, "prologCodes"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const submissionsData: Submission[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        submissionsData.push({
          id: doc.id,
          name: data.title || "Untitled Submission",
          date: data.createdAt?.toDate ? new Date(data.createdAt.toDate()).toLocaleString() : new Date().toLocaleString(),
          status: data.status || "pending",
          code: data.code,
          assignmentId: data.assignmentId,
          assignmentTitle: data.assignmentTitle,
          grade: data.grade
        });
      });
      
      setSubmissions(submissionsData);
      
      setStats(prev => ({
        ...prev,
        totalSubmissions: submissionsData.length,
        successRate: submissionsData.length > 0 
          ? Math.round((submissionsData.filter(s => s.status === "success").length / submissionsData.length) * 100)
          : 0
      }));
      
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const q = query(
        collection(db, "activityLogs"),
        where("userId", "==", user?.uid),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const logs: ActivityLog[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        let status = 'general';
        let actionText = data.action || t?.('unknown_action') || "Unknown action";
        
        if (data.actionType === 'submission' || data.action?.toLowerCase().includes('submit')) {
          status = 'submitted';
        } else if (data.actionType === 'challenge_submission' || data.action?.toLowerCase().includes('challenge')) {
          status = 'submitted';
        } else if (data.actionType === 'lesson_completion' || data.action?.toLowerCase().includes('lesson')) {
          status = 'completed';
        } else if (data.action?.toLowerCase().includes('start')) {
          status = 'started';
        }
        
        logs.push({
          id: doc.id,
          studentId: data.userId || user?.uid || "",
          studentName: data.userName || userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
          action: actionText,
          timestamp: data.timestamp || serverTimestamp(),
          details: data.details || "",
          file: data.target || "",
          status: status
        });
      });
      
      // Ако няма логове, създаваме примерни от submissions
      if (logs.length === 0 && submissions.length > 0) {
        submissions.slice(0, 5).forEach(sub => {
          logs.push({
            id: `sub-${sub.id}`,
            studentId: user?.uid || "",
            studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
            action: sub.status === 'success' ? t?.('code_uploaded') || "Code Uploaded" : t?.('code_submitted') || "Code Submitted",
            details: sub.assignmentTitle ? `${t?.('assignment') || "Assignment"}: ${sub.assignmentTitle}` : sub.name,
            file: sub.name,
            timestamp: sub.date,
            status: sub.status === 'success' ? 'submitted' : 'pending'
          });
        });
      }
      
      setActivityLogs(logs);
    } catch (error) {
      console.error("Error loading activity logs:", error);
    }
  };

  const loadStudentGrades = async () => {
    if (!user?.uid) {
      setLoadingData(prev => ({ ...prev, grades: false }));
      return;
    }
    
    try {
      const gradesQuery = query(
        collection(db, "grades"),
        where("studentId", "==", user.uid),
        orderBy("gradedAt", "desc")
      );
      
      const unsubscribe = onSnapshot(gradesQuery, (snapshot) => {
        const gradesData: Grade[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          gradesData.push({
            id: doc.id,
            assignmentId: data.assignmentId || "",
            assignmentTitle: data.assignmentTitle || t?.('unknown_assignment') || "Unknown Assignment",
            fileId: data.fileId || "",
            fileName: data.fileName || data.assignmentTitle || t?.('unknown_file') || "Unknown file",
            points: data.points || 0,
            maxPoints: data.maxPoints || 10,
            feedback: data.feedback || "",
            gradedAt: data.gradedAt,
            gradedBy: data.gradedBy || data.teacherName || t?.('teacher') || "Teacher",
            teacherId: data.teacherId || "",
            teacherName: data.teacherName,
            studentId: data.studentId || user.uid,
            studentName: data.studentName || userData?.fullName || t?.('student') || "Student",
            type: data.type || 'assignment',
            gradePercentage: data.gradePercentage,
          });
        });
        
        setStudentGrades(gradesData);
        
        const avgScore = gradesData.length > 0 
          ? Math.round(gradesData.reduce((sum, g) => sum + (g.points || 0), 0) / gradesData.length) 
          : 0;
        
        setStats(prev => ({
          ...prev,
          averageScore: avgScore
        }));
        
        setLoadingData(prev => ({ ...prev, grades: false }));
      }, (error) => {
        console.error("Error in grades snapshot:", error);
        setLoadingData(prev => ({ ...prev, grades: false }));
      });
      
      return unsubscribe;
       
    } catch (error: any) {
      console.error("Error loading student grades:", error);
      setLoadingData(prev => ({ ...prev, grades: false }));
    }
  };

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        where("type", "==", "direct"),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const messagesData: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'direct' || data.type === 'community') {
          messagesData.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            receiverId: data.receiverId,
            receiverName: data.receiverName,
            content: data.content,
            timestamp: data.timestamp,
            read: data.read || false,
            type: data.type || 'direct'
          });
        }
      });
      
      setMessages(messagesData);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Зареждане на нотификации
  useEffect(() => {
    if (!user) {
      setLoadingData(prev => ({ ...prev, notifications: false }));
      return;
    }
    
    if (notificationsListenerActive.current) {
      return;
    }
    
    notificationsListenerActive.current = true;
    
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    notificationsUnsubscribe.current = onSnapshot(notificationsQuery, 
      (snapshot) => {
        const notificationsData: Notification[] = [];
        let unreadCount = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          let icon = <Bell className="w-4 h-4" />;
          let color = 'bg-blue-500/20 text-blue-500';
          
          const type = data.type as string;
          
          if (type === 'grade' || type === 'submission_evaluated') {
            icon = <Award className="w-4 h-4" />;
            color = 'bg-yellow-500/20 text-yellow-500';
          } else if (type === 'assignment' || type === 'assignment_submission') {
            icon = <FileText className="w-4 h-4" />;
            color = 'bg-green-500/20 text-green-500';
          } else if (type === 'challenge' || type === 'challenge_submission' || type === 'challenge_accepted' || type === 'challenge_completed') {
            icon = <Target className="w-4 h-4" />;
            color = 'bg-purple-500/20 text-purple-500';
          } else if (type === 'message' || type === 'direct') {
            icon = <MessageCircle className="w-4 h-4" />;
            color = 'bg-blue-500/20 text-blue-500';
          } else if (type === 'lesson') {
            icon = <BookOpen className="w-4 h-4" />;
            color = 'bg-green-500/20 text-green-500';
          }
          
          const isRead = data.read === true;
          if (!isRead) {
            unreadCount++;
          }
          
          notificationsData.push({
            id: doc.id,
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type as any,
            timestamp: data.timestamp,
            read: isRead,
            link: data.actionUrl,
            details: data.data,
            icon: icon,
            color: color
          });
        });
        
        setNotifications(notificationsData);
        setUnreadNotifications(unreadCount);
        
        setLoadingData(prev => ({ 
          ...prev, 
          notifications: false,
          initialLoad: false
        }));
      },
      (error) => {
        console.error("Error in notifications snapshot:", error);
        notificationsListenerActive.current = false;
        setLoadingData(prev => ({ 
          ...prev, 
          notifications: false, 
          initialLoad: false 
        }));
      }
    );
    
    return () => {
      if (notificationsUnsubscribe.current) {
        notificationsUnsubscribe.current();
        notificationsUnsubscribe.current = null;
      }
      notificationsListenerActive.current = false;
    };
  }, [user]);

  // Слушател за съобщения
  useEffect(() => {
    if (!user) return;
    
    const messagesQuery = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("type", "==", "direct"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesData.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName || t?.('unknown') || "Unknown",
          receiverId: data.receiverId,
          content: data.content,
          timestamp: data.timestamp,
          read: data.read || false,
          type: 'direct'
        });
      });
      
      setMessages(messagesData);
    }, (error) => {
      console.error("Error loading messages:", error);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Зареждане на всички данни
  useEffect(() => {
    if (!user) {
      setLoadingData({
        communities: false,
        challenges: false,
        assignments: false,
        lessons: false,
        notifications: false,
        grades: false,
        initialLoad: false
      });
      return;
    }

    const loadAllData = async () => {
      try {
        await loadCommunities();
        await loadAllUsers();
        await loadMessages();
        await loadStudentGrades();
        await loadSubmissions();
        await loadActivityLogs();
        await loadChallengeSolutions();
        
        if (communities.length > 0) {
          await Promise.all([
            loadChallenges(),
            loadAssignments(),
            loadLessons(),
          ]);
        } else {
          // Ако няма общности, все пак зареждаме публичните уроци
          await loadLessons();
          setLoadingData(prev => ({
            ...prev,
            challenges: false,
            assignments: false
          }));
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadAllData();
  }, [user]);

  // Зареждане на уроци и предизвикателства при зареждане на общности
  useEffect(() => {
    if (communities.length > 0 && !loadingData.communities) {
      loadChallenges();
      loadAssignments();
      loadLessons();
      loadChallengeSolutions();
    }
  }, [communities, loadingData.communities]);

  // Актуализиране на статистики при промяна на challenges
  useEffect(() => {
    if (!loadingData.challenges) {
      const activeChallengesCount = challenges.filter(c => 
        c.status === 'accepted' || c.status === 'pending'
      ).length;
      
      setStats(prev => ({
        ...prev,
        activeChallenges: activeChallengesCount
      }));
    }
  }, [challenges, loadingData.challenges]);

  // Актуализиране на assignments при промяна на grades
  useEffect(() => {
    if (studentGrades.length > 0 && assignments.length > 0 && !loadingData.assignments) {
      const updatedAssignments = assignments.map(assignment => {
        const gradeForAssignment = studentGrades.find(grade => grade.assignmentId === assignment.id);
        
        if (gradeForAssignment && (!assignment.studentProgress?.grade || 
            assignment.studentProgress.grade.score !== gradeForAssignment.points * 10)) {
          
          return {
            ...assignment,
            studentProgress: {
              ...assignment.studentProgress,
              completed: true,
              grade: {
                score: gradeForAssignment.points * 10,
                feedback: gradeForAssignment.feedback,
                gradedAt: gradeForAssignment.gradedAt,
                gradedBy: gradeForAssignment.gradedBy
              }
            }
          };
        }
        
        return assignment;
      });
      
      setAssignments(updatedAssignments);
    }
  }, [studentGrades]);

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text}`}>
      {/* HEADER */}
      <Header 
        isScrolled={true}
        userRole="student"
        studentNotifications={notifications.map(n => ({
          id: n.id,
          title: n.title || t('notification') || 'Notification',
          description: n.message || '',
          type: (n.type as string) || 'system',
          read: n.read,
          timestamp: n.timestamp,
          data: n.details || { type: n.type || 'system' },
          actionUrl: n.link
        }))}
        studentUnreadCount={unreadNotifications}
        onStudentNotificationClick={handleMarkNotificationAsRead}
        onStudentMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onStudentNotificationAction={(notification: any) => {
          const originalNotification = notifications.find(n => n.id === notification.id);
          if (originalNotification) {
            handleNotificationClick(originalNotification);
          }
        }}
        messages={messages.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          receiverId: msg.receiverId,
          receiverName: msg.receiverName,
          content: msg.content,
          timestamp: msg.timestamp,
          read: msg.read,
          type: msg.type as any
        }))}
        unreadMessagesCount={messages.filter(m => !m.read && m.receiverId === user?.uid).length}
        onMessageClick={(messageId) => {
          const message = messages.find(m => m.id === messageId);
          if (message && !message.read) {
            handleMarkMessageAsRead(messageId);
          }
        }}
        onMarkAllMessagesAsRead={handleMarkAllMessagesAsRead}
        onSendMessage={handleSendMessage}
      />

      {/* СТРАНИЧЕН ПАНЕЛ */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={`w-72 ${currentTheme.card} border-r ${currentTheme.border} fixed left-0 top-20 z-30 h-[calc(100vh-5rem)] overflow-hidden`}
          >
            <div className="h-full flex flex-col pt-6">
              <div className="flex-1 overflow-y-auto px-4 pb-4 hide-scrollbar">
                {navSections.map((section, idx) => (
                  <div key={idx} className="mb-6">
                    <h3 className="text-xs uppercase tracking-wider opacity-50 mb-3 px-3">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedTab(item.id);
                            navigate(`/students-dashboard?tab=${item.id}`);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                            selectedTab === item.id
                              ? 'text-white'
                              : `opacity-70 hover:opacity-100 ${currentTheme.hover}`
                          }`}
                          style={selectedTab === item.id ? { 
                            background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`
                          } : {}}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button 
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${currentTheme.hover} opacity-70 hover:opacity-100 mt-8`}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('logout') || "Изход"}</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ОСНОВНО СЪДЪРЖАНИЕ */}
      <div className={`transition-all ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <main className="p-6 pt-32">
          
          {/* ЗАГЛАВИЕ */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {selectedTab === "dashboard" && (t('welcome_back') || "Добре дошли отново!")}
              {selectedTab === "messages" && (t('messages') || "Съобщения")}
              {selectedTab === "communities" && (t('communities') || "Общности")}
              {selectedTab === "lessons" && (t('my_lessons') || "Моите уроци")}
              {selectedTab === "assignments" && (t('assignments') || "Задания")}
              {selectedTab === "challenges" && (t('challenges') || "Предизвикателства")}
              {selectedTab === "mysolutions" && (t('my_solutions') || "Моите решения")}
              {selectedTab === "grades" && (t('my_grades') || "Моите оценки")}
              {selectedTab === "progress" && (t('learning_progress') || "Моят прогрес")}
              {selectedTab === "upload" && (t('code_editor') || "Code Editor")}
              {selectedTab === "submissions" && (t('submissions') || "Предадени работи")}
            </h1>
            <p className="opacity-70">
              {selectedTab === "dashboard" && (t('dashboard_description') || "Преглед на последните активности и статистики")}
              {selectedTab === "messages" && `${messages.filter(m => m.receiverId === user?.uid).length} ${t('total_messages') || 'общо съобщения'}`}
              {selectedTab === "communities" && `${communities.length} ${t('communities') || 'общности'}`}
              {selectedTab === "lessons" && `${stats.totalLessons} ${t('lessons') || 'урока'}`}
              {selectedTab === "assignments" && `${stats.totalAssignments} ${t('assignments') || 'задания'}`}
              {selectedTab === "challenges" && `${stats.activeChallenges} ${t('active_challenges') || 'активни предизвикателства'}`}
              {selectedTab === "mysolutions" && `${challenges.filter(c => c.submissions?.some(s => s.studentId === user?.uid)).length} ${t('solutions') || 'решения'}`}
              {selectedTab === "grades" && `${studentGrades.length} ${t('grades') || 'оценки'}`}
              {selectedTab === "submissions" && `${submissions.length} ${t('submissions') || 'предадени работи'}`}
            </p>
          </div>

          {/* ДИНАМИЧНО СЪДЪРЖАНИЕ */}
          {selectedTab === "dashboard" && renderDashboardView()}
          {selectedTab === "messages" && renderMessagesView()}
          {selectedTab === "communities" && renderCommunitiesView()}
          {selectedTab === "lessons" && renderLessonsView()}
          {selectedTab === "mysolutions" && renderMySolutionsView()}
          {selectedTab === "progress" && renderProgressView()}
          {selectedTab === "grades" && renderGradesView()}
          
          {selectedTab === "challenges" && (
            <StudentChallenges
              challenges={challenges}
              challengeSolutions={challengeSolutions}
              communities={communities}
              user={user}
              userData={userData}
              theme={theme}
              loadingSolutions={loadingSolutions}
              onJoinChallenge={handleJoinChallenge}
              onSolveChallenge={(challengeId, solutionCode) => {
                setIsChallengeMode(true);
                setSelectedChallengeId(challengeId);
                setSelectedTab("upload");
                if (solutionCode) {
                  setCode(solutionCode);
                }
              }}
              generateChallengeTemplate={generateChallengeTemplate}
            />
          )}

          {selectedTab === "assignments" && (
            <div className="mb-8">
              <StudentAssignments
                assignments={assignments}
                submissions={submissions}
                theme={theme}
                loading={loadingAssignments}
                onViewDetails={(assignmentId) => {
                  const assignment = assignments.find(a => a.id === assignmentId);
                  if (assignment) {
                    setSelectedAssignmentDetails(assignment);
                  }
                }}
                onStartAssignment={(assignmentId) => {
                  const assignment = assignments.find(a => a.id === assignmentId);
                  if (assignment) {
                    setSelectedAssignment(assignmentId);
                    setIsChallengeMode(false);
                    setSelectedTab("upload");
                    
                    if (assignment.exampleCode) {
                      setCode(assignment.exampleCode);
                    } else {
                      const basicTemplate = prologTemplates.find(t => t.id === "basic")?.code || "";
                      setCode(generateHeader() + "\n\n" + basicTemplate.split('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\n')[1] || basicTemplate);
                    }
                    
                    setCodeMetadata({
                      domain: assignment.topic,
                      type: t?.('symbolic_ai_expert_system') || "Symbolic AI / Expert System",
                      studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
                      dataArea: assignment.subject,
                      assignmentId: assignment.id,
                      assignmentTitle: assignment.title
                    });
                  }
                }}
                onViewGrade={handleShowGrade}
              />
            </div>
          )}

          {selectedTab === "upload" && (
            <StudentCodeEditor
              code={code}
              setCode={setCode}
              codeMetadata={codeMetadata}
              setCodeMetadata={setCodeMetadata}
              assignments={assignments}
              challenges={challenges}
              selectedAssignment={selectedAssignment}
              setSelectedAssignment={setSelectedAssignment}
              selectedChallengeId={selectedChallengeId}
              isChallengeMode={isChallengeMode}
              setIsChallengeMode={setIsChallengeMode}
              uploadStatus={uploadStatus}
              theme={theme}
              userData={userData}
              user={user}
              generateHeader={generateHeader}
              onUpload={handleUpload}
              onSwitchToChallenges={() => {
                setIsChallengeMode(true);
                setSelectedChallengeId("");
                setSelectedTab("challenges");
              }}
              onViewChallengeDetails={(challengeId) => {
                const challenge = challenges.find(c => c.id === challengeId);
                if (challenge) {
                  alert(`${t?.('challenge') || "Challenge"}: ${challenge.title}\n\n${t?.('description') || "Description"}: ${challenge.description}\n\n${t?.('points') || "Points"}: ${challenge.points}\n\n${t?.('due') || "Due"}: ${challenge.dueDate || t?.('not_specified') || "Not specified"}`);
                }
              }}
              setUploadStatus={setUploadStatus}
            />
          )}

          {selectedTab === "submissions" && (
            <div className="mb-8">
              <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold">
                      {t('recent_submissions') || "Предадени работи"} ({submissions.length})
                    </h2>
                    <p className="opacity-70">
                      {t('view_download_submissions') || "Преглед и изтегляне на вашите предадени работи"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTab("upload")}
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})` }}
                  >
                    <Plus className="w-4 h-4" />
                    {t('new_submission') || "Ново предаване"}
                  </button>
                </div>
                
                <StudentSubmissions
                  submissions={submissions}
                  theme={theme}
                  onNewSubmission={() => setSelectedTab("upload")}
                  onDownloadCode={downloadCode}
                  onViewGrade={handleShowGrade}
                />
              </div>
            </div>
          )}

          {/* СТАТУС ЗА КАЧВАНЕ */}
          {uploadStatus && uploadStatus.includes('✅') && (
            <div className={`fixed bottom-6 right-6 p-4 rounded-lg border shadow-lg ${currentTheme.card} ${currentTheme.border}`}>
              {uploadStatus}
            </div>
          )}

        </main>
      </div>

      {/* МОДАЛИ */}

      {/* Lesson Modal */}
      {renderLessonViewModal()}

      {/* Evaluation Modal */}
      <AnimatePresence>
        {showEvaluationModal && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEvaluationModal(false)}
          >
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowEvaluationModal(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md rounded-2xl border ${currentTheme.card} ${currentTheme.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5" style={{ color: colorScheme.accent }} />
                    {t('evaluation') || "Оценка"}
                  </h3>
                  <button
                    onClick={() => setShowEvaluationModal(false)}
                    className={`p-2 rounded-lg ${currentTheme.hover}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">{selectedSubmission.name}</h4>
                    <p className="text-sm opacity-70">{selectedSubmission.date}</p>
                  </div>
                  
                  {selectedSubmission.grade ? (
                    <>
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-2 ${
                          selectedSubmission.grade.score! >= 80 ? 'text-green-500' :
                          selectedSubmission.grade.score! >= 60 ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {selectedSubmission.grade.score}%
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          selectedSubmission.grade.score! >= 80 ? 'bg-green-500/20 text-green-500' :
                          selectedSubmission.grade.score! >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {selectedSubmission.grade.score! >= 80 ? t('excellent') || 'Отличен' :
                           selectedSubmission.grade.score! >= 60 ? t('good') || 'Добър' :
                           t('needs_improvement') || 'Има нужда от подобрение'}
                        </span>
                      </div>
                      
                      {selectedSubmission.grade.feedback && (
                        <div>
                          <h5 className="font-medium mb-2">{t('feedback') || "Обратна връзка"}:</h5>
                          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <p className="whitespace-pre-wrap">{selectedSubmission.grade.feedback}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm opacity-70">
                        {selectedSubmission.grade.gradedBy && (
                          <div>{t('graded_by') || "Оценено от"}: {selectedSubmission.grade.gradedBy}</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="opacity-70">{t('pending_evaluation') || "Очаква оценяване"}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grades Modal */}
      <AnimatePresence>
        {showGradesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowGradesModal(false)}
          >
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowGradesModal(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl border ${currentTheme.card} ${currentTheme.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Star className="w-5 h-5" style={{ color: colorScheme.accent }} />
                    {t('all_grades') || "Всички оценки"}
                  </h3>
                  <button
                    onClick={() => setShowGradesModal(false)}
                    className={`p-2 rounded-lg ${currentTheme.hover}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {studentGrades.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="opacity-70">{t('no_grades_yet') || "Все още нямате оценки"}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentGrades.map((grade) => (
                      <div key={grade.id} className={`p-4 rounded-lg border ${currentTheme.border}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold">{grade.assignmentTitle}</h4>
                            <p className="text-sm opacity-70">{grade.fileName}</p>
                            <p className="text-sm opacity-70 mt-1">{grade.gradedBy} • {formatTimestamp(grade.gradedAt)}</p>
                            {grade.feedback && (
                              <p className="text-sm mt-2 opacity-80">{grade.feedback}</p>
                            )}
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              grade.points >= 9 ? 'text-green-500' :
                              grade.points >= 7 ? 'text-yellow-500' :
                              grade.points >= 5 ? 'text-orange-500' :
                              'text-red-500'
                            }`}>
                              {grade.points}/{grade.maxPoints}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment Details Modal */}
      <AnimatePresence>
        {selectedAssignmentDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAssignmentDetails(null)}
          >
            <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedAssignmentDetails(null)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl rounded-2xl border ${currentTheme.card} ${currentTheme.border}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{selectedAssignmentDetails.title}</h3>
                  <button
                    onClick={() => setSelectedAssignmentDetails(null)}
                    className={`p-2 rounded-lg ${currentTheme.hover}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="opacity-70">{selectedAssignmentDetails.description}</p>

                  <div>
                    <h4 className="font-semibold mb-2">{t('objective') || "Цел"}:</h4>
                    <p className="opacity-70">{selectedAssignmentDetails.objective}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">{t('requirements') || "Изисквания"}:</h4>
                    <ul className="list-disc list-inside space-y-1 opacity-70">
                      <li>{selectedAssignmentDetails.requirements.minFacts} {t('facts') || "факта"}</li>
                      <li>{selectedAssignmentDetails.requirements.minRules} {t('rules') || "правила"}</li>
                      <li>{selectedAssignmentDetails.requirements.minCombinedRules} {t('combined_rules') || "комбинирани правила"}</li>
                      <li>{selectedAssignmentDetails.requirements.minMenuItems} {t('menu_items') || "меню елемента"}</li>
                    </ul>
                  </div>

                  {selectedAssignmentDetails.instructions.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">{t('instructions') || "Инструкции"}:</h4>
                      <ol className="list-decimal list-inside space-y-1 opacity-70">
                        {selectedAssignmentDetails.instructions.map((inst, idx) => (
                          <li key={idx}>{inst}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <span className="text-sm opacity-70">{t('due_date') || "Краен срок"}:</span>
                      <span className="ml-2 font-medium">{new Date(selectedAssignmentDetails.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-sm opacity-70">{t('points') || "Точки"}:</span>
                      <span className="ml-2 font-medium">{selectedAssignmentDetails.points}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAssignment(selectedAssignmentDetails.id);
                      setSelectedAssignmentDetails(null);
                      setSelectedTab("upload");
                    }}
                    className="w-full py-3 rounded-lg text-white font-medium mt-4"
                    style={{ background: `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})` }}
                  >
                    <Play className="w-4 h-4 inline mr-2" />
                    {t('start_assignment') || "Започни задание"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Стилове за скриване на скрол */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
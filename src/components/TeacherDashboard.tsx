// src/pages/TeacherDashboard.tsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Target,
   Users as GroupIcon, Coffee, 
   ChevronRight,
  BarChart3, X,
  BookOpen, Calendar,
  Upload, FileCode, 
  Folder,  Download, Eye,
  GraduationCap, FolderOpen,
  Plus, RefreshCw,
  Activity,
  MessageCircle,
  Send,
  Star,
  Home,
  Mail,
  Users2,
  Award,
  BookMarked,
  FileCheck,
  UserCircle,
  Inbox,
  LogOut,
  CheckCircle,
  TrendingUp,
  Clock,
  Trophy,
  Zap,
  Globe,
  Book,
  LineChart,
  Hash,
  UserPlus
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
  arrayRemove,
  getDoc,
  writeBatch,
  deleteDoc
} from "firebase/firestore";
import { supabase } from "../services/supabase";
import MessagesTab from "../components/MessagesTab";
import AssignmentGradingModal from "./AssignmentGradingModal";
import TeacherChallenges from './TeacherChallenges';
import type { ChallengeNotification } from './TeacherChallenges';
import TeacherAssignments from './TeacherAssignments';
import TeacherLessons from './TeacherLessons';
import Header from "../components/Header";
import StatsChart from "../components/StatsChart";

// Интерфейси
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
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  attachments?: Array<{
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
  type: 'direct' | 'community' | 'broadcast' | string;
  status?: 'starred' | 'important' | 'read' | 'unread' | 'draft' | 'sent' | 'archived';
  subject?: string;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  labels?: string[];
  pinned?: boolean;
}

interface StudentFile {
  id: string;
  username: string;
  originalFileName: string;
  storedFileName: string;
  code: string;
  createdAt: any;
  folder: string;
  fileSize: number;
  displayName: string;
  userId: string;
  studentName?: string;
  status?: string;
  points?: number;
  feedback?: string;
}

interface Student {
  username: string;
  files: StudentFile[];
  totalFiles: number;
  lastUpload: string;
  role: string;
  email?: string;
  class?: string;
  averagePoints?: number;
  status?: string;
  lastActivity?: string;
  pendingApproval?: boolean;
  uid?: string;
  communityId?: string;
  communityStatus?: string;
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

interface Challenge {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  communityId?: string;
  communityName?: string;
  createdAt: any;
  deadline?: any;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'active' | 'completed' | 'expired';
  participants: number;
  submissions: number;
  completedBy: string[];
  type: 'individual' | 'team' | 'community';
  category: string;
  instructions: string;
  starterCode?: string;
  testCases?: Array<{ input: string; output: string }>;
  hints?: string[];
}

interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  points: number;
  maxPoints: number;
  feedback: string;
  gradedAt: any;
  gradedBy: string;
  teacherName: string;
}

interface UserData {
  uid: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  avatar?: string;
  communityId?: string;
  communityStatus?: string;
  lastSeen?: any;
  online?: boolean;
}

const folders = ["animals", "geography", "history", "mineralwater", "balkan"];

export default function TeacherDashboard() {
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  
  // State променливи
  const [sidebarOpen, _setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  const [assignmentStats, setAssignmentStats] = useState({ total: 0, active: 0 });
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [allSystemUsers, setAllSystemUsers] = useState<UserData[]>([]);
  
  // Community form state
  const [communityForm, setCommunityForm] = useState({
    name: "",
    description: "",
    gradeLevel: "",
    subject: "",
    privacy: "private" as "public" | "private",
    autoApprove: false,
    allowStudentMessages: true,
    allowStudentChallenges: false,
    allowInterCommunityChallenges: true
  });
  
  // Основни state променливи
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState("general");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submissions, setSubmissions] = useState<
    { id: string; name: string; date: string; status: string; code?: string }[]
  >([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [viewingStudentFiles, setViewingStudentFiles] = useState<string | null>(null);
  const [_activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [_challengeNotifications, setChallengeNotifications] = useState<ChallengeNotification[]>([]);
  
  // UI states
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);
  
  // Нови state за началния изглед
  const [recentChallenges, setRecentChallenges] = useState<Challenge[]>([]);
  const [topStudents, setTopStudents] = useState<Array<Student & { totalPoints: number }>>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [recentGrades, setRecentGrades] = useState<Grade[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  
  // States за уроци
  const [lessonStats, setLessonStats] = useState({ total: 0, published: 0, draft: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [challengeStats, setChallengeStats] = useState({ total: 0, active: 0, completed: 0 });
  const [communityActivity, setCommunityActivity] = useState<Array<{
    communityId: string;
    communityName: string;
    activity: number;
    submissions: number;
  }>>([]);

  // Grading states
  const [_selectedPoints, _setSelectedPoints] = useState<{[key: string]: number}>({});
  const [_feedbackText, _setFeedbackText] = useState<{[key: string]: string}>({});

  const [gradingModal, setGradingModal] = useState<{
    isOpen: boolean;
    studentName: string;
    studentId: string;
    files: StudentFile[];
    assignmentId?: string;
  }>({
    isOpen: false,
    studentName: '',
    studentId: '',
    files: [],
    assignmentId: undefined
  });

  // Refs за проследяване на зареждането
  const isDataLoaded = useRef({
    communities: false,
    students: false,
    challenges: false,
    lessons: false,
    grades: false,
    activity: false,
    assignments: false
  });

  // ОПТИМИЗИРАНА ЦВЕТОВА ПАЛИТРА
  const colorScheme = {
    primary: "#3B82F6",    // синьо (основен за бутони)
    secondary: "#F97316",  // оранжево (вторичен за акценти)
    accent: "#22C55E",     // зелено (акцент за успех)
    danger: "#EF4444",     // червено (само за грешки)
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
    if (tab && ['dashboard', 'students', 'communities', 'courses', 'assignments', 'challenges', 'submissions', 'file-upload', 'messages'].includes(tab)) {
      setSelectedTab(tab);
    }
  }, [location.search]);

  // СЛУШАТЕЛ ЗА НОТИФИКАЦИИ
  useEffect(() => {
    if (!user) return;
    
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          ...data
        });
      });
      
      setNotifications(notificationsData);
      setUnreadNotificationsCount(notificationsData.filter(n => !n.read).length);
    });
    
    return () => unsubscribe();
  }, [user]);

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

  // СЛУШАТЕЛ ЗА СЪОБЩЕНИЯ
  useEffect(() => {
    if (!user) return;
    
    const messagesQuery = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesData.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          content: data.content,
          timestamp: data.timestamp,
          read: data.read || false,
          type: data.type || 'direct',
          subject: data.subject,
          attachments: data.attachments,
          labels: data.labels || [],
          pinned: data.pinned || false
        });
      });
      
      setMessages(messagesData);
      setRecentMessages(messagesData.slice(0, 3));
    });
    
    return () => unsubscribe();
  }, [user]);

  // Зареждане на общности
  useEffect(() => {
    if (userData?.role === 'teacher' && user) {
      loadCommunities();
      loadAllSystemUsers();
    } else {
      setCommunities([]);
      isDataLoaded.current.communities = false;
    }
  }, [user, userData]);

  // Зареждане на assignment stats
  useEffect(() => {
    if (user && communities.length > 0) {
      loadAssignmentStats();
    }
  }, [user, communities]);

  // Зареждане на challenge stats
  useEffect(() => {
    if (user) {
      loadChallengeStats();
    }
  }, [user]);

  // Зареждане на dashboard данни
  useEffect(() => {
    if (user && communities.length > 0) {
      loadDashboardData();
    } else if (user && communities.length === 0 && isDataLoaded.current.communities) {
      setLoadingDashboard(false);
    }
  }, [communities, user]);

  // Зареждане на всички потребители
  useEffect(() => {
    if (user) {
      loadAllUsers();
    }
  }, [user]);

  // Зареждане на submissions
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "prologCodes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().title,
        date: new Date(doc.data().createdAt?.toMillis()).toLocaleString(),
        status: doc.data().status ?? "success",
        code: doc.data().code
      }));

      setSubmissions(data);
    });

    return () => unsub();
  }, [user]);

  // Зареждане на ученици
  useEffect(() => {
    if (
      (selectedTab === "dashboard" || selectedTab === "students") &&
      (userData?.role === 'teacher' || userData?.role === 'admin') &&
      communities.length > 0
    ) {
      loadAllStudentsData();
      loadActivityLogs();
    }
  }, [selectedTab, userData?.role, communities, language]);

  // Функция за зареждане на assignment stats
  const loadAssignmentStats = async () => {
    if (!user) return;
    
    try {
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("teacherId", "==", user.uid)
      );
      
      const snapshot = await getDocs(assignmentsQuery);
      let total = 0;
      let active = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.status === 'active') active++;
      });
      
      setAssignmentStats({ total, active });
      isDataLoaded.current.assignments = true;
      
    } catch (error) {
      console.error("Error loading assignment stats:", error);
    }
  };

  // Зареждане на dashboard данни
  const loadDashboardData = async () => {
  if (!user) return;
  
  setLoadingDashboard(true);
  
  try {
    console.log("📊 Зареждане на dashboard данни...");
    
    // Първо се увери, че communities са заредени
    if (communities.length === 0) {
      await loadCommunities();
    }
    
    // Зареждане на всички данни паралелно
    await Promise.all([
      loadRecentChallenges(),
      loadRecentLessons(),
      loadRecentGrades(),
      loadCommunityActivity(),
      loadAssignmentStats()
    ]);
    
    // Challenge stats трябва да се зареди след като communities са готови
    await loadChallengeStats();
    
    // Зареждане на учениците
    await loadAllStudentsData();
    
    console.log("✅ Dashboard данните са заредени", {
      challenges: recentChallenges.length,
      challengeStats,
      assignments: assignmentStats,
      communityActivity: communityActivity.length,
      students: students.length,
      lessons: lessonStats.total
    });
    
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    setLoadingDashboard(false);
  }
};

  // Зареждане на последните challenge-и
  const loadRecentChallenges = async () => {
    try {
      let challengesQuery = query(
        collection(db, "challenges"),
        where("teacherId", "==", user?.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      let snapshot = await getDocs(challengesQuery);
      
      if (snapshot.empty) {
        challengesQuery = query(
          collection(db, "challenges"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        snapshot = await getDocs(challengesQuery);
      }
      
      const challengesData: Challenge[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        challengesData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          communityId: data.communityId,
          communityName: data.communityName,
          createdAt: data.createdAt,
          deadline: data.deadline,
          points: data.points || 100,
          difficulty: data.difficulty || 'medium',
          status: data.status || 'active',
          participants: data.participants || 0,
          submissions: data.submissions || 0,
          completedBy: data.completedBy || [],
          type: data.type || 'individual',
          category: data.category || 'programming',
          instructions: data.instructions,
          starterCode: data.starterCode,
          testCases: data.testCases,
          hints: data.hints
        });
      });
      
      setRecentChallenges(challengesData);
      
    } catch (error) {
      console.error(t('error_loading_challenges') || "Error loading recent challenges:", error);
      try {
        const fallbackQuery = query(
          collection(db, "challenges"),
          where("teacherId", "==", user?.uid),
          limit(5)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const challengesData: Challenge[] = [];
        
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          challengesData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            communityId: data.communityId,
            communityName: data.communityName,
            createdAt: data.createdAt,
            deadline: data.deadline,
            points: data.points || 100,
            difficulty: data.difficulty || 'medium',
            status: data.status || 'active',
            participants: data.participants || 0,
            submissions: data.submissions || 0,
            completedBy: data.completedBy || [],
            type: data.type || 'individual',
            category: data.category || 'programming',
            instructions: data.instructions,
            starterCode: data.starterCode,
            testCases: data.testCases,
            hints: data.hints
          });
        });
        
        setRecentChallenges(challengesData);
      } catch (fallbackError) {
        console.error("Fallback също неуспешен:", fallbackError);
      }
    }
  };

  // Зареждане на последните уроци
  const loadRecentLessons = async () => {
    try {
      let lessonsQuery = query(
        collection(db, "lessons"),
        where("teacherId", "==", user?.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      let snapshot = await getDocs(lessonsQuery);
      
      if (snapshot.empty) {
        lessonsQuery = query(
          collection(db, "lessons"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        snapshot = await getDocs(lessonsQuery);
      }
      
      const lessonsData: Lesson[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        lessonsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          content: data.content,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          teacherAvatar: data.teacherAvatar,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          category: data.category || 'general',
          color: data.color,
          icon: data.icon,
          status: data.status || 'published',
          tags: data.tags || [],
          attachments: data.attachments,
          estimatedTime: data.estimatedTime || '30 min',
          difficulty: data.difficulty || 'beginner',
          visibility: data.visibility || 'public',
          language: data.language,
          prerequisites: data.prerequisites,
          learningObjectives: data.learningObjectives,
          views: data.views || 0,
          likes: data.likes || [],
          students: data.students || [],
          rating: data.rating,
          totalRatings: data.totalRatings
        });
      });
      
      setRecentLessons(lessonsData);
      
      const allLessonsQuery = query(
        collection(db, "lessons"),
        where("teacherId", "==", user?.uid)
      );
      const allSnapshot = await getDocs(allLessonsQuery);
      
      let total = 0;
      let published = 0;
      let draft = 0;
      
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.status === 'published') published++;
        if (data.status === 'draft') draft++;
      });
      
      setLessonStats({ total, published, draft });
      
    } catch (error) {
      console.error(t('error_loading_lessons') || "Error loading recent lessons:", error);
      
      try {
        const fallbackQuery = query(
          collection(db, "lessons"),
          where("teacherId", "==", user?.uid)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        
        let total = 0;
        let published = 0;
        let draft = 0;
        
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          total++;
          if (data.status === 'published') published++;
          if (data.status === 'draft') draft++;
        });
        
        setLessonStats({ total, published, draft });
        
        const recentData: Lesson[] = [];
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data();
          recentData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            content: data.content,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            teacherAvatar: data.teacherAvatar,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            category: data.category || 'general',
            color: data.color,
            icon: data.icon,
            status: data.status || 'published',
            tags: data.tags || [],
            attachments: data.attachments,
            estimatedTime: data.estimatedTime || '30 min',
            difficulty: data.difficulty || 'beginner',
            visibility: data.visibility || 'public',
            language: data.language,
            prerequisites: data.prerequisites,
            learningObjectives: data.learningObjectives,
            views: data.views || 0,
            likes: data.likes || [],
            students: data.students || [],
            rating: data.rating,
            totalRatings: data.totalRatings
          });
        });
        
        recentData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setRecentLessons(recentData.slice(0, 5));
        
      } catch (fallbackError) {
        console.error("Fallback също неуспешен:", fallbackError);
      }
    }
  };

  // Зареждане на последните оценки
  const loadRecentGrades = async () => {
    try {
      const gradesQuery = query(
        collection(db, "grades"),
        where("teacherId", "==", user?.uid),
        orderBy("gradedAt", "desc"),
        limit(5)
      );
      
      const snapshot = await getDocs(gradesQuery);
      const gradesData: Grade[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        gradesData.push({
          id: doc.id,
          studentId: data.studentId,
          studentName: data.studentName,
          assignmentId: data.assignmentId,
          assignmentTitle: data.assignmentTitle,
          points: data.points,
          maxPoints: data.maxPoints || 10,
          feedback: data.feedback,
          gradedAt: data.gradedAt,
          gradedBy: data.gradedBy,
          teacherName: data.teacherName
        });
      });
      
      setRecentGrades(gradesData);
    } catch (error) {
      console.error(t('error_loading_grades') || "Error loading recent grades:", error);
    }
  };

  // Зареждане на статистики за challenge-и
  // Зареждане на статистики за challenge-и
const loadChallengeStats = async () => {
  try {
    console.log("🏆 Зареждане на challenge stats...");
    
    // Трябва да заредим challenge-ите, свързани с общностите на учителя
    if (communities.length === 0) {
      setChallengeStats({ total: 0, active: 0, completed: 0 });
      return;
    }
    
    const communityIds = communities.map(c => c.id);
    
    // Зареждане на challenge-ите, които са target към тези общности
    const challengesQuery = query(
      collection(db, "challenges"),
      where("targetCommunityId", "in", communityIds)
    );
    
    const snapshot = await getDocs(challengesQuery);
    let total = 0;
    let active = 0;
    let completed = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      total++;
      
      if (data.status === 'active') active++;
      else if (data.status === 'completed') completed++;
    });
    
    console.log(`🏆 Challenge stats: total=${total}, active=${active}, completed=${completed}`);
    setChallengeStats({ total, active, completed });
    
  } catch (error) {
    console.error(t('error_loading_challenge_stats') || "Error loading challenge stats:", error);
  }
};

  // Зареждане на активност в общностите
  const loadCommunityActivity = async () => {
    try {
      if (communities.length === 0) {
        setCommunityActivity([]);
        return;
      }
      
      const activity: Array<{
        communityId: string;
        communityName: string;
        activity: number;
        submissions: number;
      }> = [];
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      for (const community of communities) {
        const participants = community.studentIds?.length || 0;
        const pendingCount = community.pendingRequests?.length || 0;
        let submissionsCount = 0;
        
        if (community.studentIds && community.studentIds.length > 0) {
          const allCodesQuery = query(
            collection(db, "prologCodes"),
            where("createdAt", ">=", oneWeekAgo)
          );
          
          const snapshot = await getDocs(allCodesQuery);
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (community.studentIds.includes(data.userId)) {
              submissionsCount++;
            }
          });
        }
        
        let challengesCount = 0;
        const challengesQuery = query(
          collection(db, "challenges"),
          where("communityId", "==", community.id),
          where("status", "==", "active")
        );
        const challengesSnapshot = await getDocs(challengesQuery);
        challengesCount = challengesSnapshot.size;
        
        const totalActivity = participants + pendingCount + submissionsCount + challengesCount;
        
        activity.push({
          communityId: community.id,
          communityName: community.name,
          activity: totalActivity,
          submissions: submissionsCount
        });
      }
      
      setCommunityActivity(activity);
      
    } catch (error) {
      console.error("❌ Error loading community activity:", error);
    }
  };

  // Намиране на топ ученици
  const calculateTopStudents = (studentsList: Student[]) => {
    const studentsWithPoints = studentsList
      .filter(s => s.files && s.files.length > 0)
      .map(s => ({
        ...s,
        totalPoints: s.files.reduce((sum, file) => sum + (file.points || 0), 0)
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 3);
    
    setTopStudents(studentsWithPoints);
  };

  const loadCommunities = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, "communities"),
        where("teacherId", "==", user.uid)
      );
      
      const snapshot = await getDocs(q);
      const communitiesData: Community[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        communitiesData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          teacherId: data.teacherId,
          institution: data.institution || userData?.institution || t('unknown') || "Unknown",
          gradeLevel: data.gradeLevel,
          subject: data.subject,
          memberCount: data.memberCount || 0,
          studentIds: data.studentIds || [],
          pendingRequests: data.pendingRequests || [],
          createdAt: data.createdAt,
          isPublic: data.isPublic || false,
          inviteCode: data.inviteCode,
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
      isDataLoaded.current.communities = true;
      
      if (communitiesData.length > 0 && !selectedCommunity) {
        setSelectedCommunity(communitiesData[0].id);
      }
      
    } catch (error) {
      console.error(t('error_loading_communities') || "Error loading communities:", error);
    }
  };

  const loadAllSystemUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: UserData[] = [];
      
      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        usersData.push({
          uid: doc.id,
          username: user.fullName || user.email?.split('@')[0] || t('user_prefix') + doc.id.substring(0, 6),
          fullName: user.fullName,
          email: user.email || "",
          role: user.role || 'student',
          avatar: user.avatar,
          communityId: user.communityId || null,
          communityStatus: user.communityStatus || null,
          online: user.online || false,
          lastSeen: user.lastSeen
        });
      });
      
      setAllSystemUsers(usersData);
    } catch (error) {
      console.error(t('error_loading_users') || "Error loading all system users:", error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      });
      
      setMessages(prev => 
        prev.map(m => 
          m.id === messageId ? { ...m, read: true } : m
        )
      );
      
    } catch (error) {
      console.error(t('error_marking_read') || "Error marking message as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadMessages = messages.filter(m => !m.read && m.receiverId === user?.uid);
      
      const batch = writeBatch(db);
      for (const msg of unreadMessages) {
        const messageRef = doc(db, 'messages', msg.id);
        batch.update(messageRef, { read: true });
      }
      
      await batch.commit();
      
      setMessages(prev => 
        prev.map(m => 
          !m.read && m.receiverId === user?.uid ? { ...m, read: true } : m
        )
      );
      
      setUploadStatus("✅ " + (t('all_messages_read') || "All messages marked as read!"));
    } catch (error) {
      console.error(t('error_marking_all_read') || "Error marking all messages as read:", error);
    }
  };

  const loadAllMessages = async () => {
    if (!user) return;
    
    try {
      const receivedQ = query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      
      const sentQ = query(
        collection(db, "messages"),
        where("senderId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      
      const [receivedSnapshot, sentSnapshot] = await Promise.all([
        getDocs(receivedQ),
        getDocs(sentQ)
      ]);
      
      const allMessages: Message[] = [];
      
      receivedSnapshot.forEach((doc) => {
        const data = doc.data();
        allMessages.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          content: data.content,
          timestamp: data.timestamp,
          read: data.read || false,
          type: data.type || 'direct',
          subject: data.subject,
          attachments: data.attachments,
          labels: data.labels || [],
          pinned: data.pinned || false
        });
      });
      
      sentSnapshot.forEach((doc) => {
        const data = doc.data();
        allMessages.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          receiverId: data.receiverId,
          receiverName: data.receiverName,
          content: data.content,
          timestamp: data.timestamp,
          read: true,
          type: data.type || 'direct',
          subject: data.subject,
          attachments: data.attachments,
          labels: data.labels || [],
          pinned: data.pinned || false
        });
      });
      
      allMessages.sort((a, b) => 
        (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)
      );
      
      setMessages(allMessages);
      
    } catch (error) {
      console.error("Error loading all messages:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t('confirm_delete_message') || "Delete this message?")) return;
    
    try {
      const messageRef = doc(db, 'messages', messageId);
      const message = messages.find(m => m.id === messageId);
      
      if (!message) return;
      
      if (message.senderId !== user?.uid && message.receiverId !== user?.uid) {
        alert(t('no_permission_delete') || "You don't have permission to delete this message!");
        return;
      }
      
      if (message.receiverId === user?.uid) {
        const newLabels = [...(message.labels || []), 'trash'];
        await updateDoc(messageRef, {
          labels: newLabels
        });
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, labels: newLabels } : msg
        ));
        
        alert("✅ " + (t('message_moved_to_trash') || "Message moved to trash!"));
      } else if (message.senderId === user?.uid) {
        await deleteDoc(messageRef);
        
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        alert("✅ " + (t('message_deleted') || "Message deleted!"));
      }
      
    } catch (error) {
      console.error(t('error_deleting_message') || "Error deleting message:", error);
    }
  };

  const handlePinMessage = async (messageId: string, pinned: boolean) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        pinned
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, pinned } : msg
      ));
    } catch (error) {
      console.error(t('error_pinning_message') || "Error pinning message:", error);
    }
  };

  const handleStarMessage = async (messageId: string, starred: boolean) => {
    try {
      const status = starred ? 'starred' : 'sent';
      await updateDoc(doc(db, 'messages', messageId), {
        status
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
    } catch (error) {
      console.error(t('error_starring_message') || "Error starring message:", error);
    }
  };

  const handleArchiveMessage = async (messageId: string, archive: boolean) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      const newLabels = archive 
        ? [...(message.labels || []), 'archived']
        : (message.labels || []).filter(l => l !== 'archived');
      
      await updateDoc(doc(db, 'messages', messageId), {
        labels: newLabels
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, labels: newLabels } : msg
      ));
    } catch (error) {
      console.error(t('error_archiving_message') || "Error archiving message:", error);
    }
  };
console.log(handleDeleteMessage, handlePinMessage, handleStarMessage, handleArchiveMessage);
  const loadAllUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: UserData[] = [];
      
      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        usersData.push({
          uid: doc.id,
          username: user.fullName || user.email?.split('@')[0] || t('user_prefix') + doc.id.substring(0, 6),
          email: user.email || "",
          role: user.role || 'student',
          fullName: user.fullName,
          avatar: user.avatar,
          communityId: user.communityId,
          online: user.online || false,
          lastSeen: user.lastSeen
        });
      });
      
      setAllUsers(usersData);
    } catch (error) {
      console.error(t('error_loading_users') || "Error loading all users:", error);
    }
  };

  const handleCreateCommunity = async () => {
    if (!user || !userData) {
      alert(t('login_as_teacher') || "Please login as a teacher!");
      return;
    }

    try {
      const communityRef = doc(collection(db, 'communities'));
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newCommunity: Community = {
        id: communityRef.id,
        name: communityForm.name,
        description: communityForm.description,
        teacherId: user.uid,
        institution: userData.institution || t('unknown') || "Unknown",
        gradeLevel: communityForm.gradeLevel,
        subject: communityForm.subject,
        memberCount: 1,
        studentIds: [],
        pendingRequests: [],
        createdAt: serverTimestamp(),
        isPublic: communityForm.privacy === 'public',
        inviteCode,
        challenges: [],
        settings: {
          allowStudentChallenges: communityForm.allowStudentChallenges,
          allowInterCommunityChallenges: communityForm.allowInterCommunityChallenges,
          allowStudentMessages: communityForm.allowStudentMessages,
          autoApproveStudents: communityForm.autoApprove,
          privacy: communityForm.privacy
        }
      };
      
      await setDoc(communityRef, newCommunity);
      
      await updateDoc(doc(db, 'users', user.uid), {
        communityId: communityRef.id,
        createdCommunities: arrayUnion(communityRef.id)
      });
      
      setUploadStatus("✅ " + (t('community_created') || "Community created successfully!"));
      setShowCommunityForm(false);
      
      await loadCommunities();
      setSelectedCommunity(communityRef.id);
      
      setCommunityForm({
        name: "",
        description: "",
        gradeLevel: "",
        subject: "",
        privacy: "private",
        autoApprove: false,
        allowStudentMessages: true,
        allowStudentChallenges: false,
        allowInterCommunityChallenges: true
      });
      
    } catch (error) {
      console.error(t('error_creating_community') || "Error creating community:", error);
      setUploadStatus("❌ " + (t('error_creating_community') || "Error creating community!"));
    }
  };

  const handleSendMessage = async (recipientId?: string, content?: string) => {
    const messageToSend = content || newMessage;
    if (!user || !messageToSend.trim()) return;

    try {
      let receivers: string[] = [];
      let messageType: 'direct' | 'community' | 'broadcast' = 'direct';
      
      if (recipientId === 'all') {
        receivers = allUsers.map(u => u.uid).filter(Boolean);
        messageType = 'broadcast';
      } else if (recipientId === 'community' && selectedCommunity) {
        const community = getCurrentCommunity();
        receivers = community?.studentIds || [];
        messageType = 'community';
      } else if (recipientId && (selectedStudent?.uid === recipientId)) {
        receivers = [recipientId];
        messageType = 'direct';
      } else if (selectedStudent) {
        receivers = [selectedStudent.uid!];
        messageType = 'direct';
      } else if (selectedCommunity) {
        const community = getCurrentCommunity();
        receivers = community?.studentIds || [];
        messageType = 'community';
      } else {
        receivers = allUsers.map(u => u.uid).filter(Boolean);
        messageType = 'broadcast';
      }
      
      const batch = writeBatch(db);
      
      for (const receiverId of receivers) {
        const messageRef = doc(collection(db, 'messages'));
        
        const receiver = allUsers.find(u => u.uid === receiverId) || 
                        students.find(s => s.uid === receiverId) || 
                        { username: t('unknown_user') || "Unknown User", email: "" };
        
        const newMessageData = {
          senderId: user.uid,
          senderName: userData?.fullName || user.email?.split('@')[0] || t('teacher') || "Teacher",
          senderEmail: user.email || "",
          receiverId: receiverId,
          receiverName: receiver.username,
          receiverEmail: receiver.email || "",
          content: messageToSend,
          subject: t('new_message') || "New Message",
          timestamp: serverTimestamp(),
          read: false,
          type: messageType,
          status: 'sent',
          labels: [],
          attachments: [],
          pinned: false
        };
        
        batch.set(messageRef, newMessageData);
      }
      
      await batch.commit();
      
      setNewMessage("");
      setUploadStatus(`✅ ${receivers.length} ` + (t('messages_sent') || "message(s) sent successfully!"));
      
    } catch (error) {
      console.error(t('error_sending_message') || "Error sending message:", error);
      setUploadStatus("❌ " + (t('error_sending_message') || "Error sending message!"));
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user || unreadNotificationsCount === 0) return;
    
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true, readAt: serverTimestamp() });
      }
      
      await batch.commit();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
      
    } catch (error) {
      console.error(t('error_marking_notifications') || "Error marking notifications as read:", error);
    }
  };

  // Helper functions
  const getColorByIndex = (index: number): string => {
    const colors = [
      colorScheme.primary,
      colorScheme.secondary,
      colorScheme.accent,
      colorScheme.purple,
      colorScheme.pink,
      colorScheme.teal
    ];
    return colors[index % colors.length];
  };

  const getCurrentCommunity = () => {
    return communities.find(c => c.id === selectedCommunity);
  };

  const getCommunityStudents = () => {
    if (!selectedCommunity) return students;
    const community = getCurrentCommunity();
    return students.filter(student => 
      community?.studentIds.includes(student.uid || "") ||
      student.communityId === selectedCommunity
    );
  };

  const loadActivityLogs = async () => {
    try {
      const q = query(
        collection(db, "activityLogs"),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const logs: ActivityLog[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          studentId: data.userId || "",
          studentName: data.userName || data.user || t('unknown_student') || "Unknown Student",
          action: data.action || t('unknown_action') || "Unknown action",
          timestamp: data.timestamp || serverTimestamp(),
          details: data.details || "",
          file: data.target || "",
          status: data.actionType || 'general'
        });
      });
      
      setActivityLogs(logs);
      
    } catch (error) {
      console.error(t('error_loading_activity') || "Error loading activity logs:", error);
      
      const sampleLogs = [
        {
          id: "1",
          studentId: "student-1",
          studentName: "John Doe",
          action: t('submitted_prolog_code') || "Submitted Prolog code",
          timestamp: new Date(),
          details: t('created_expert_system') || "Created expert system for biology project",
          file: "expert_system.pl",
          status: 'submitted'
        },
        {
          id: "2",
          studentId: "student-2",
          studentName: "Jane Smith",
          action: t('uploaded_assignment') || "Uploaded assignment file",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          details: t('completed_logical_rules') || "Completed assignment on logical rules",
          file: "assignment_1.pl",
          status: 'submitted'
        }
      ];
      setActivityLogs(sampleLogs);
    }
  };

  const handleApproveRequest = async (studentId: string, communityId: string) => {
    try {
      const communityRef = doc(db, 'communities', communityId);
      
      await updateDoc(communityRef, {
        studentIds: arrayUnion(studentId),
        pendingRequests: arrayRemove(studentId),
        memberCount: (communities.find(c => c.id === communityId)?.memberCount || 0) + 1
      });
      
      await updateDoc(doc(db, 'users', studentId), {
        communityId: communityId,
        communityStatus: 'member'
      });
      
      setUploadStatus("✅ " + (t('student_approved') || "Student approved successfully!"));
      loadCommunities();
      
    } catch (error) {
      console.error("Error approving student:", error);
      setUploadStatus("❌ " + (t('error_approving_student') || "Error approving student!"));
    }
  };

  const handleRejectRequest = async (studentId: string, communityId: string) => {
    try {
      const communityRef = doc(db, 'communities', communityId);
      
      await updateDoc(communityRef, {
        pendingRequests: arrayRemove(studentId)
      });
      
      setUploadStatus("✅ " + (t('request_rejected') || "Request rejected!"));
      loadCommunities();
      
    } catch (error) {
      console.error("Error rejecting request:", error);
      setUploadStatus("❌ " + (t('error_rejecting_request') || "Error rejecting request!"));
    }
  };

  const loadAllStudentsData = async () => {
    if (loadingStudents) return;
    
    setLoadingStudents(true);
    try {
      const currentUserRole = userData?.role;
      if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        setStudents([]);
        return;
      }

      const myStudentIds = new Set<string>();
      
      communities.forEach(community => {
        community.studentIds.forEach(studentId => {
          myStudentIds.add(studentId);
        });
      });

      if (myStudentIds.size === 0) {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: Record<string, any> = {};
      
      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        usersData[doc.id] = {
          ...user,
          uid: doc.id,
          fullName: user.fullName || user.email?.split('@')[0] || t('user_prefix') + doc.id.substring(0, 6),
          role: user.role || 'student',
          email: user.email || '',
          class: user.class || 'N/A',
          communityId: user.communityId || null,
          communityStatus: user.communityStatus || null
        };
      });

      const codesQuery = query(collection(db, "prologCodes"));
      const codesSnapshot = await getDocs(codesQuery);
      
      const filesByUserId: Record<string, StudentFile[]> = {};
      
      codesSnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        
        if (myStudentIds.has(userId)) {
          const userData = usersData[userId];
          const studentName = userData.fullName || 
                           userData.email?.split('@')[0] || 
                           t('user_prefix') + userId.substring(0, 6);
          
          if (!filesByUserId[userId]) {
            filesByUserId[userId] = [];
          }
          
          filesByUserId[userId].push({
            id: doc.id,
            username: studentName,
            originalFileName: data.originalFileName || data.title || t('untitled') || "Untitled",
            storedFileName: data.storedFileName || "",
            code: data.code || t('no_code') || "No code",
            createdAt: data.createdAt,
            folder: data.folder || data.domain || t('uncategorized') || 'uncategorized',
            fileSize: data.fileSize || (data.code?.length || 0),
            displayName: data.displayName || `${studentName}/${data.title}`,
            userId: userId,
            status: data.status,
            points: data.points,
            feedback: data.feedback
          });
        }
      });

      const studentsArray: Student[] = [];
      
      Array.from(myStudentIds).forEach(userId => {
        const user = usersData[userId];
        if (!user) return;
        
        const role = user.role;
        if (role !== 'student') return;
        
        const studentFiles = filesByUserId[userId] || [];
        const sortedFiles = studentFiles.sort((a, b) => 
          new Date(b.createdAt?.toMillis?.() || 0).getTime() - 
          new Date(a.createdAt?.toMillis?.() || 0).getTime()
        );

        const averagePoints = studentFiles.length > 0 
          ? studentFiles.reduce((sum, file) => sum + (file.points || 0), 0) / studentFiles.length
          : 0;

        const lastFile = sortedFiles[0];
        const lastActivity = lastFile ? 
          new Date(lastFile.createdAt?.toMillis?.() || Date.now()).toLocaleDateString() :
          t('no_activity') || "No activity";

        const userObj: Student = {
          username: user.fullName,
          email: user.email,
          class: user.class,
          files: sortedFiles,
          totalFiles: studentFiles.length,
          lastUpload: lastActivity,
          role: role,
          averagePoints,
          status: averagePoints >= 7 ? 'active' : averagePoints >= 4 ? 'warning' : 'inactive',
          lastActivity,
          pendingApproval: studentFiles.some(f => !f.points && f.status === 'pending'),
          uid: userId,
          communityId: user.communityId,
          communityStatus: user.communityStatus
        };

        studentsArray.push(userObj);
      });

      const sortedStudents = studentsArray.sort((a, b) => 
        new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime()
      );
      
      setStudents(sortedStudents);
      isDataLoaded.current.students = true;
      
      calculateTopStudents(sortedStudents);
      
    } catch (error) {
      console.error("❌ " + (t('load_students_error') || "Error loading students:"), error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !user) {
      setUploadStatus("❌ " + (t('no_file_user') || "No file selected or user not logged in"));
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pl')) {
      setUploadStatus("❌ " + (t('only_pl_files') || "Only .pl files allowed"));
      return;
    }

    const username = user.email ? user.email.split('@')[0] : 'anonymous';
    const originalName = file.name;
    const fileNameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const safeFileName = fileNameWithoutExt
      .replace(/[^a-zA-Z0-9а-яА-Я\s\-_]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .substring(0, 50);
    const shortTimestamp = Date.now().toString().slice(-4);
    const randomId = Math.random().toString(36).substring(2, 6);
    let finalFileName = `${username}_${safeFileName}_${shortTimestamp}${randomId}.pl`;
    let path = `${folder}/${finalFileName}`;

    try {
      const { error } = await supabase.storage
        .from("prolog-files")
        .upload(path, file, { 
          upsert: false,
          cacheControl: '3600',
          contentType: file.type || 'text/plain'
        });

      if (error) {
        if (error.message.includes('already exists')) {
          const newRandomId = Math.random().toString(36).substring(2, 8);
          const newFinalFileName = `${username}_${safeFileName}_${shortTimestamp}${newRandomId}.pl`;
          const newPath = `${folder}/${newFinalFileName}`;
          
          const { error: retryError } = await supabase.storage
            .from("prolog-files")
            .upload(newPath, file, { 
              upsert: false,
              cacheControl: '3600'
            });

          if (retryError) {
            setUploadStatus("❌ " + (t('upload_failed') || "Upload failed:") + " " + retryError.message);
            return;
          }
          
          path = newPath;
          finalFileName = newFinalFileName;
        } else {
          setUploadStatus("❌ " + (t('upload_failed') || "Upload failed:") + " " + error.message);
          return;
        }
      }

      await addDoc(collection(db, "prologCodes"), {
        userId: user.uid,
        username: username,
        title: originalName,
        storedFileName: finalFileName,
        originalFileName: originalName,
        displayName: `${username}/${originalName}`,
        code: await file.text(),
        fileName: finalFileName,
        filePath: path,
        folder: folder,
        fileSize: file.size,
        uploadFormat: "username_original_id.pl",
        timestamp: shortTimestamp,
        randomId: randomId,
        status: "success",
        createdAt: serverTimestamp()
      });

      setUploadStatus("✅ " + (t('file_upload_success') || `File "${originalName}" uploaded as "${finalFileName}"`));
      setFile(null);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error("❌ " + (t('catch_block_error') || "Catch block error:"), err);
      setUploadStatus("❌ " + (t('unexpected_error') || "An unexpected error occurred"));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.pl')) {
      setFile(droppedFile);
    } else {
      setUploadStatus("❌ " + (t('only_pl_files') || "Only .pl files allowed"));
    }
  };

  const openGradingModal = (student: Student, assignmentId?: string) => {
    setGradingModal({
      isOpen: true,
      studentName: student.username,
      studentId: student.uid || '',
      files: student.files,
      assignmentId
    });
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { 
        read: true,
        readAt: serverTimestamp() 
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSaveGrade = async (gradingData: {
    points: number;
    feedback: string;
    assignmentId: string;
    fileId: string;
    studentId: string;
  }): Promise<void> => {
    try {
      const serverTime = serverTimestamp();

      const fileDoc = await getDoc(doc(db, "prologCodes", gradingData.fileId));
      const fileData = fileDoc.exists() ? fileDoc.data() : null;
      
      const studentDoc = await getDoc(doc(db, "users", gradingData.studentId));
      const studentData = studentDoc.exists() ? studentDoc.data() : null;
      
      const assignmentDoc = await getDoc(doc(db, "assignments", gradingData.assignmentId));
      const assignmentData = assignmentDoc.exists() ? assignmentDoc.data() : null;

      const fileRef = doc(db, "prologCodes", gradingData.fileId);
      await updateDoc(fileRef, {
        points: gradingData.points,
        feedback: gradingData.feedback,
        gradedAt: serverTime,
        gradedBy: user?.uid,
        status: 'graded',
        teacherName: userData?.fullName || user?.email?.split('@')[0] || t('teacher') || "Teacher"
      });

      const gradeRef = doc(collection(db, "grades"));
      
      const gradeData = {
        ...gradingData,
        fileName: fileData?.originalFileName || fileData?.title || t('unknown_file') || "Unknown file",
        fileCreatedAt: fileData?.createdAt,
        fileFolder: fileData?.folder || "general",
        studentName: studentData?.fullName || 
                    studentData?.email?.split('@')[0] || 
                    t('unknown_student') || "Unknown Student",
        studentEmail: studentData?.email || "",
        studentClass: studentData?.class || "N/A",
        assignmentTitle: assignmentData?.title || t('general_assignment') || "General Assignment",
        assignmentDescription: assignmentData?.description || t('no_description') || "No description",
        assignmentDifficulty: assignmentData?.difficulty || "medium",
        assignmentPoints: assignmentData?.points || 100,
        teacherId: user?.uid,
        teacherName: userData?.fullName || user?.email?.split('@')[0] || t('teacher') || "Teacher",
        teacherInstitution: userData?.institution || t('unknown') || "Unknown",
        gradedAt: serverTime,
        createdAt: serverTime,
        maxPoints: 10,
        gradePercentage: (gradingData.points / 10) * 100,
        status: 'graded',
        category: assignmentData?.category || fileData?.folder || "general",
        subject: assignmentData?.subject || "prolog"
      };

      await setDoc(gradeRef, gradeData);

      const userRef = doc(db, "users", gradingData.studentId);
      const userDocSnap = await getDoc(userRef);
      
      if (userDocSnap.exists()) {
        const currentUser = userDocSnap.data();
        const currentGrades = currentUser.grades || [];
        
        const newGrade = {
          points: gradingData.points,
          feedback: gradingData.feedback,
          assignmentId: gradingData.assignmentId,
          assignmentTitle: assignmentData?.title || t('general_assignment') || "General Assignment",
          fileId: gradingData.fileId,
          fileName: fileData?.originalFileName || t('unknown_file') || "Unknown file",
          gradedAt: new Date().toISOString(),
          gradedBy: user?.uid,
          teacherName: userData?.fullName || user?.email?.split('@')[0] || t('teacher') || "Teacher",
          maxPoints: 10,
          gradeId: gradeRef.id
        };
        
        const existingGradeIndex = currentGrades.findIndex((g: any) => 
          g.fileId === gradingData.fileId && g.assignmentId === gradingData.assignmentId
        );
        
        if (existingGradeIndex >= 0) {
          currentGrades[existingGradeIndex] = newGrade;
        } else {
          currentGrades.push(newGrade);
        }
        
        await updateDoc(userRef, {
          grades: currentGrades,
          lastGraded: serverTime,
          totalGrades: currentGrades.length,
          averageGrade: currentGrades.length > 0 
            ? currentGrades.reduce((sum: number, grade: any) => sum + (grade.points || 0), 0) / currentGrades.length
            : 0
        });
      }

      setStudents(prev => prev.map(student => {
        if (student.uid === gradingData.studentId) {
          const updatedFiles = student.files.map(file => 
            file.id === gradingData.fileId 
              ? { 
                  ...file, 
                  points: gradingData.points, 
                  feedback: gradingData.feedback,
                  gradedAt: new Date(),
                  gradedBy: user?.uid,
                  teacherName: userData?.fullName || user?.email?.split('@')[0] || t('teacher') || "Teacher"
                }
              : file
          );
          
          const newAveragePoints = updatedFiles.length > 0 
            ? updatedFiles.reduce((sum, file) => sum + (file.points || 0), 0) / updatedFiles.length
            : 0;
          
          return {
            ...student,
            files: updatedFiles,
            averagePoints: newAveragePoints,
            status: newAveragePoints >= 7 ? 'active' : 
                    newAveragePoints >= 4 ? 'warning' : 'inactive'
          };
        }
        return student;
      }));

      try {
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          userId: gradingData.studentId,
          type: 'grade',
          title: t('grade_received') || '📊 Grade Received',
          message: (t('grade_notification') || 'Your work "{file}" has been graded. Points: {points}/10.')
            .replace('{file}', fileData?.originalFileName || 'file')
            .replace('{points}', gradingData.points.toString()),
          timestamp: serverTime,
          read: false,
          data: {
            type: 'grade',
            gradeId: gradeRef.id,
            assignmentId: gradingData.assignmentId,
            assignmentTitle: assignmentData?.title || t('general_assignment') || "General Assignment",
            fileId: gradingData.fileId,
            fileName: fileData?.originalFileName || 'file',
            points: gradingData.points,
            maxPoints: 10,
            teacherId: user?.uid,
            teacherName: userData?.fullName || user?.email?.split('@')[0] || t('teacher') || "Teacher"
          },
          actionUrl: '/teacher-dashboard?tab=students'
        });
        
      } catch (notificationError) {
        console.error("❌ " + (t('error_sending_notification') || "Error sending grade notification:"), notificationError);
      }

      try {
        await addDoc(collection(db, "activityLogs"), {
          userId: gradingData.studentId,
          userName: studentData?.fullName || studentData?.email?.split('@')[0] || t('student') || "Student",
          teacherId: user?.uid,
          teacherName: userData?.fullName || user?.email?.split('@')[0] || t('teacher') || "Teacher",
          action: t('grade_assigned') || "Grade Assigned",
          details: (t('grade_assigned_details') || 'Assigned {points}/10 points for "{file}"')
            .replace('{points}', gradingData.points.toString())
            .replace('{file}', fileData?.originalFileName || 'file'),
          target: `grade_${gradeRef.id}`,
          actionType: "grading",
          timestamp: serverTime,
          metadata: {
            points: gradingData.points,
            assignmentId: gradingData.assignmentId,
            fileId: gradingData.fileId,
            assignmentTitle: assignmentData?.title || t('general_assignment') || "General Assignment"
          }
        });
      } catch (logError) {
        console.error(t('error_adding_activity') || "Error adding activity log:", logError);
      }
      
      setUploadStatus("✅ " + (t('grade_saved') || "Grade saved successfully!"));
      return;
      
    } catch (error) {
      console.error(t('error_saving_grade') || "Error saving grade:", error);
      setUploadStatus("❌ " + (t('error_saving_grade') || "Error saving grade!"));
      throw new Error(`Failed to save grade: ${error}`);
    }
  };

  // Статистики
  const totalSubmissions = submissions.length;
  const successfulSubmissions = submissions.filter(s => s.status === "success").length;
  const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;

  const studentActivities = [...students]
  .sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime())
  .slice(0, 7) // Вземи последните 7 дни активност
  .map(student => ({
    date: student.lastActivity,
    count: student.totalFiles,
    name: student.username
  }));

  const recommendations = [
    {
      id: 1,
      icon: <Target className="w-5 h-5" />,
      title: t('visual_examples') || "Визуални примери",
      description: t('visual_examples_desc') || "Учениците реагират много добре на графики и диаграми.",
      color: "from-blue-500 to-green-500",
      action: t('apply') || "Приложи"
    },
    {
      id: 2,
      icon: <GroupIcon className="w-5 h-5" />,
      title: t('group_work') || "Групова работа",
      description: t('group_work_desc') || "Започнете групова задача за следващите 15 минути.",
      color: "from-orange-500 to-blue-500",
      action: t('start') || "Старт"
    },
    {
      id: 3,
      icon: <Coffee className="w-5 h-5" />,
      title: t('short_break') || "Кратка почивка",
      description: t('short_break_desc') || "Вниманието намалява - 2 минути почивка биха помогнали.",
      color: "from-green-500 to-orange-500",
      action: t('create') || "Създай"
    }
  ];

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
        },
        { 
          id: "students", 
          label: t('students') || "Ученици", 
          icon: <UserCircle className="w-5 h-5" />, 
          badge: students.length 
        }
      ]
    },
    {
      title: t('learning') || "Обучение",
      items: [
        { 
          id: "courses", 
          label: t('lessons') || "Уроци", 
          icon: <BookMarked className="w-5 h-5" />, 
          badge: lessonStats.total 
        },
        { 
          id: "assignments", 
          label: t('assignments') || "Задания", 
          icon: <FileCheck className="w-5 h-5" />, 
          badge: assignmentStats.total 
        },
        { 
          id: "challenges", 
          label: t('challenges') || "Предизвикателства", 
          icon: <Award className="w-5 h-5" />, 
          badge: challengeStats.active 
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
          id: "file-upload", 
          label: t('upload_file') || "Качване", 
          icon: <Upload className="w-5 h-5" />, 
          badge: null 
        }
      ]
    }
  ];

  // Функции за отваряне и сваляне на файлове
  const openFileInNewTab = async (file: StudentFile) => {
    try {
      const { data } = await supabase.storage
        .from("prolog-files")
        .getPublicUrl(`${file.folder}/${file.storedFileName}`);
      
      window.open(data.publicUrl, '_blank');
    } catch (error) {
      console.error(t('error_opening_file') || "Error opening file:", error);
    }
  };

  const downloadFile = async (file: StudentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("prolog-files")
        .download(`${file.folder}/${file.storedFileName}`);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(t('error_downloading_file') || "Error downloading file:", error);
    }
  };

  // Debugging useEffect
  useEffect(() => {
    console.log("📊 Current stats:", {
      assignmentStats,
      challengeStats,
      lessonStats,
      students: students.length,
      communities: communities.length,
      submissions: submissions.length
    });
  }, [assignmentStats, challengeStats, lessonStats, students, communities, submissions]);

  // Рендиране на началния изглед
  const renderDashboardView = () => (
    <div className="space-y-8">
      {loadingDashboard ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
               style={{ borderColor: colorScheme.primary }}></div>
        </div>
      ) : (
        <>
          {/* СТАТИСТИКИ КАРТИ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Ученици - Синьо */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-6 border ${currentTheme.card} ${currentTheme.border}`}
              style={{ borderLeftColor: colorScheme.primary, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: `${colorScheme.primary}20` }}>
                  <Users className="w-6 h-6" style={{ color: colorScheme.primary }} />
                </div>
                <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: `${colorScheme.primary}20`, color: colorScheme.primary }}>
                  {students.filter(s => s.status === 'active').length} {t('active') || 'активни'}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{students.length}</div>
              <div className="text-sm opacity-70">{t('total_students') || 'Общо ученици'}</div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: colorScheme.primary }} />
                <span className="text-sm">{Math.round((students.filter(s => s.status === 'active').length / (students.length || 1)) * 100)}% {t('activity') || 'активност'}</span>
              </div>
            </motion.div>

            {/* Предизвикателства - Оранжево */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-xl p-6 border ${currentTheme.card} ${currentTheme.border}`}
              style={{ borderLeftColor: colorScheme.secondary, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: `${colorScheme.secondary}20` }}>
                  <Zap className="w-6 h-6" style={{ color: colorScheme.secondary }} />
                </div>
                <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: `${colorScheme.secondary}20`, color: colorScheme.secondary }}>
                  {challengeStats.active} {t('active') || 'активни'}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{challengeStats.total}</div>
              <div className="text-sm opacity-70">{t('total_challenges') || 'Общо предизвикателства'}</div>
              <div className="mt-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" style={{ color: colorScheme.accent }} />
                <span className="text-sm">{challengeStats.completed} {t('completed') || 'завършени'}</span>
              </div>
            </motion.div>

            {/* Уроци - Зелено */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-xl p-6 border ${currentTheme.card} ${currentTheme.border}`}
              style={{ borderLeftColor: colorScheme.accent, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: `${colorScheme.accent}20` }}>
                  <Book className="w-6 h-6" style={{ color: colorScheme.accent }} />
                </div>
                <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: `${colorScheme.accent}20`, color: colorScheme.accent }}>
                  {lessonStats.published} {t('published') || 'публикувани'}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{lessonStats.total}</div>
              <div className="text-sm opacity-70">{t('total_lessons') || 'Общо уроци'}</div>
              <div className="mt-4 flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: colorScheme.accent }} />
                <span className="text-sm">{lessonStats.draft} {t('in_draft') || 'в чернова'}</span>
              </div>
            </motion.div>

            {/* Общности - Синьо */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-xl p-6 border ${currentTheme.card} ${currentTheme.border}`}
              style={{ borderLeftColor: colorScheme.primary, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: `${colorScheme.primary}20` }}>
                  <Globe className="w-6 h-6" style={{ color: colorScheme.primary }} />
                </div>
                <span className="text-sm px-2 py-1 rounded-full" style={{ backgroundColor: `${colorScheme.secondary}20`, color: colorScheme.secondary }}>
                  {communities.reduce((sum, c) => sum + c.memberCount, 0)} {t('members') || 'членове'}
                </span>
              </div>
              <div className="text-3xl font-bold mb-1">{communities.length}</div>
              <div className="text-sm opacity-70">{t('total_communities') || 'Общо общности'}</div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full" style={{ 
                      width: `${communityActivity.length > 0 ? Math.min(100, communityActivity.reduce((sum, ca) => sum + ca.activity, 0)) : 0}%`,
                      backgroundColor: colorScheme.primary
                    }}></div>
                  </div>
                  <span className="text-sm">{communityActivity.reduce((sum, ca) => sum + ca.activity, 0)} {t('activities') || 'активности'}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ДВЕ СТАТИСТИЧЕСКИ ГРАФИКИ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Графика 1: Активност на учениците */}
            <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
  className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}
>
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-lg flex items-center gap-2">
      <BarChart3 className="w-5 h-5" style={{ color: colorScheme.primary }} />
      {t('student_activity_chart') || 'Активност на учениците'}
    </h3>
    <div className="flex items-center gap-2">
      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${colorScheme.primary}20`, color: colorScheme.primary }}>
        {t('last_7_days') || 'Последни 7 дни'}
      </span>
    </div>
  </div>
  
  <div className="h-64">
    <StatsChart 
      type="activity"
      data={studentActivities} // ← Тук трябва да подадеш целия масив, не само totalFiles
      colorScheme={colorScheme}
    />
  </div>
  
  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
    <div className={`p-2 rounded-lg ${currentTheme.hover}`}>
      <div className="text-sm opacity-70">{t('active_students') || 'Активни'}</div>
      <div className="font-bold text-lg" style={{ color: colorScheme.primary }}>{students.filter(s => s.status === 'active').length}</div>
    </div>
    <div className={`p-2 rounded-lg ${currentTheme.hover}`}>
      <div className="text-sm opacity-70">{t('submissions') || 'Предадени'}</div>
      <div className="font-bold text-lg" style={{ color: colorScheme.secondary }}>{submissions.length}</div>
    </div>
    <div className={`p-2 rounded-lg ${currentTheme.hover}`}>
      <div className="text-sm opacity-70">{t('success_rate') || 'Успеваемост'}</div>
      <div className="font-bold text-lg" style={{ color: colorScheme.accent }}>{successRate}%</div>
    </div>
  </div>
</motion.div>

            {/* Графика 2: Тенденция на оценките */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <LineChart className="w-5 h-5" style={{ color: colorScheme.secondary }} />
                  {t('grades_trend') || 'Тенденция на оценките'}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${colorScheme.secondary}20`, color: colorScheme.secondary }}>
                    {t('last_4_weeks') || 'Последни 4 седмици'}
                  </span>
                </div>
              </div>
              
              <div className="h-64">
                <StatsChart 
                  type="grades"
                  data={recentGrades}
                  colorScheme={colorScheme}
                />
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme.secondary }}></div>
                  <span className="text-sm">{t('average_grade') || 'Среден успех'}</span>
                </div>
                <span className="font-bold text-lg" style={{ color: colorScheme.primary }}>
                  {(recentGrades.reduce((sum, g) => sum + g.points, 0) / (recentGrades.length || 1)).toFixed(1)}
                </span>
              </div>
            </motion.div>
          </div>

          {/* ТОП УЧЕНИЦИ И АКТИВНОСТ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Топ ученици */}
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5" style={{ color: colorScheme.secondary }} />
                  {t('top_students') || 'Топ ученици'}
                </h3>
                <button 
                  onClick={() => setSelectedTab("students")}
                  className="text-sm px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {topStudents.length > 0 ? (
                  topStudents.map((student, index) => (
                    <div key={student.uid} className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                             style={{ backgroundColor: index === 0 ? colorScheme.accent : index === 1 ? colorScheme.primary : colorScheme.secondary }}>
                          {student.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold"
                             style={{ color: index === 0 ? colorScheme.accent : index === 1 ? colorScheme.primary : colorScheme.secondary }}>
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{student.username}</div>
                        <div className="text-sm opacity-70">{t('total_points') || 'Общо точки'}: {student.totalPoints}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colorScheme.accent}20`, color: colorScheme.accent }}>
                            {t('average') || 'Средно'}: {student.averagePoints?.toFixed(1)}/10
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colorScheme.primary}20`, color: colorScheme.primary }}>
                            {student.files.length} {t('files') || 'файла'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openGradingModal(student)}
                        className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors"
                        title={t('grade') || 'Оцени'}
                      >
                        <GraduationCap className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 opacity-70">{t('no_student_data') || 'Няма данни за ученици'}</p>
                )}
              </div>
            </div>

            {/* Активност в общностите */}
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: colorScheme.primary }} />
                {t('community_activity') || 'Активност в общностите'}
              </h3>
              
              <div className="space-y-4">
                {communityActivity.length > 0 ? (
                  communityActivity.slice(0, 3).map((ca, idx) => (
                    <div key={ca.communityId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{ca.communityName}</span>
                        <span className="font-medium" style={{ color: getColorByIndex(idx) }}>{ca.submissions} {t('submitted') || 'предадени'}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full" style={{ 
                          width: `${Math.min(100, ca.activity)}%`,
                          backgroundColor: getColorByIndex(idx)
                        }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 opacity-70">{t('no_community_activity') || 'Няма активност в общностите'}</p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('total_messages') || 'Общо съобщения'}</span>
                  <span className="font-medium" style={{ color: colorScheme.primary }}>
                    {messages.filter(m => 
                      m.type === 'community' || 
                      (m.receiverId === user?.uid && m.type === 'direct')
                    ).length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span>{t('pending_requests') || 'Чакащи заявки'}</span>
                  <span className="font-medium" style={{ color: colorScheme.secondary }}>{communities.reduce((sum, c) => sum + c.pendingRequests.length, 0)}</span>
                </div>
              </div>
            </div>

            {/* Скорошни оценки */}
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Star className="w-5 h-5" style={{ color: colorScheme.accent }} />
                {t('recent_grades') || 'Скорошни оценки'}
              </h3>
              
              <div className="space-y-4">
                {recentGrades.length > 0 ? (
                  recentGrades.slice(0, 3).map((grade) => (
                    <div key={grade.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                           style={{ backgroundColor: `${colorScheme.accent}20` }}>
                        <CheckCircle className="w-4 h-4" style={{ color: colorScheme.accent }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{grade.studentName}</div>
                        <div className="text-xs opacity-70 mt-1">{grade.assignmentTitle}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${colorScheme.accent}20`, color: colorScheme.accent }}>
                            {grade.points}/{grade.maxPoints}
                          </span>
                          <span className="text-xs opacity-50">
                            {grade.gradedAt?.toDate ? new Date(grade.gradedAt.toDate()).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 opacity-70">{t('no_recent_grades') || 'Няма скорошни оценки'}</p>
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
                  <Zap className="w-5 h-5" style={{ color: colorScheme.secondary }} />
                  {t('recent_challenges') || 'Последни предизвикателства'}
                </h3>
                <button 
                  onClick={() => setSelectedTab("challenges")}
                  className="text-sm px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {recentChallenges.length > 0 ? (
                  recentChallenges.slice(0, 5).map((challenge) => (
                    <div key={challenge.id} className={`p-4 rounded-lg border ${currentTheme.border} hover:bg-white/5 transition-colors`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{challenge.title}</div>
                          <div className="text-sm opacity-70 line-clamp-1">{challenge.description}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full
                          ${challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                            challenge.difficulty === 'medium' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-blue-500/20 text-blue-500'}`}>
                          {challenge.difficulty === 'easy' ? t('easy') || 'Лесно' : 
                           challenge.difficulty === 'medium' ? t('medium') || 'Средно' : t('hard') || 'Трудно'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs opacity-70">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {challenge.participants} {t('participants') || 'участници'}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {challenge.completedBy.length} {t('completed') || 'завършили'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" /> {challenge.points} {t('points') || 'т.'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="opacity-70">{t('no_active_challenges') || 'Няма активни предизвикателства'}</p>
                    <button
                      onClick={() => setSelectedTab("challenges")}
                      className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      {t('create_first') || 'Създай първото'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Последни уроци */}
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: colorScheme.primary }} />
                  {t('recent_lessons') || 'Последни уроци'}
                </h3>
                <button 
                  onClick={() => setSelectedTab("courses")}
                  className="text-sm px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {recentLessons.length > 0 ? (
                  recentLessons.slice(0, 5).map((lesson) => (
                    <div key={lesson.id} className={`p-4 rounded-lg border ${currentTheme.border} hover:bg-white/5 transition-colors`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                             style={{ backgroundColor: `${lesson.color || colorScheme.primary}20` }}>
                          {lesson.icon ? (
                            <img src={lesson.icon} alt="" className="w-5 h-5" />
                          ) : (
                            <Book className="w-5 h-5" style={{ color: lesson.color || colorScheme.primary }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-sm opacity-70 line-clamp-1">{lesson.description}</div>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {lesson.estimatedTime}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full
                              ${lesson.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' :
                                lesson.difficulty === 'intermediate' ? 'bg-orange-500/20 text-orange-500' :
                                'bg-blue-500/20 text-blue-500'}`}>
                              {lesson.difficulty === 'beginner' ? t('beginner') || 'Начинаещ' : 
                               lesson.difficulty === 'intermediate' ? t('intermediate') || 'Среден' : t('advanced') || 'Напреднал'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="opacity-70">{t('no_lessons') || 'Няма създадени уроци'}</p>
                    <button
                      onClick={() => setSelectedTab("courses")}
                      className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      {t('create_first_lesson') || 'Създай първия урок'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ПОСЛЕДНИ СЪОБЩЕНИЯ */}
          <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" style={{ color: colorScheme.accent }} />
                {t('recent_messages') || 'Последни съобщения'}
              </h3>
              <button 
                onClick={() => setSelectedTab("messages")}
                className="text-sm px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                {t('view_all') || 'Виж всички'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {recentMessages.length > 0 ? (
                recentMessages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: `${colorScheme.accent}20` }}>
                      <Mail className="w-4 h-4" style={{ color: colorScheme.accent }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{msg.senderName}</span>
                        <span className="text-xs opacity-50">
                          {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm opacity-70 line-clamp-1">{msg.content}</p>
                    </div>
                    {!msg.read && msg.receiverId === user?.uid && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorScheme.accent }}></span>
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
              {t('recommendations') || 'Препоръки за днешния час'}
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

  // Рендиране на общностите
  const renderCommunitiesView = () => (
    <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{t('communities') || "Общности"}</h2>
          <p className="opacity-70">{t('manage_learning_communities') || "Управление на учебни общности"}</p>
        </div>
        <button
          onClick={() => setShowCommunityForm(true)}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('new_community') || "Нова общност"}
        </button>
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-12">
          <GroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-bold mb-2">{t('no_communities') || "Няма общности"}</h3>
          <p className="opacity-70 mb-4">{t('create_first_community') || "Създайте първата си учебна общност"}</p>
          <button
            onClick={() => setShowCommunityForm(true)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {t('create_community') || "Създай общност"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Табове с общности */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {communities.map((community) => (
              <button
                key={community.id}
                onClick={() => setSelectedCommunity(community.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${
                  selectedCommunity === community.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent'
                    : theme === 'dark'
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <GroupIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{community.name}</div>
                    <div className={`text-sm ${selectedCommunity === community.id ? 'text-white/80' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {community.memberCount} {t('members') || 'членове'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Детайли за избраната общност */}
          {selectedCommunity && getCurrentCommunity() && (
            <div className={`rounded-2xl p-6 border ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">{getCurrentCommunity()?.name}</h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {getCurrentCommunity()?.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      <Hash className="w-3 h-3 inline mr-1" />
                      {getCurrentCommunity()?.inviteCode}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      getCurrentCommunity()?.isPublic
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {getCurrentCommunity()?.isPublic ? t('public') || 'Публична' : t('private') || 'Частна'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      loadAllMessages();
                      setShowMessaging(true);
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors flex items-center gap-2`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t('message_all') || "Изпрати съобщение"}
                  </button>
                </div>
              </div>

              {/* Чакащи заявки */}
              {getCurrentCommunity()?.pendingRequests && getCurrentCommunity()!.pendingRequests.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold mb-3">{t('pending_requests') || "Чакащи заявки"} ({getCurrentCommunity()!.pendingRequests.length})</h4>
                  <div className="space-y-2">
                    {getCurrentCommunity()!.pendingRequests.map((studentId, index) => {
                      const user = allSystemUsers.find(u => u.uid === studentId);
                      
                      return user ? (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                              <UserPlus className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium">{user.fullName || user.username}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(studentId, selectedCommunity!)}
                              className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                            >
                              {t('approve') || "Одобри"}
                            </button>
                            <button
                              onClick={() => handleRejectRequest(studentId, selectedCommunity!)}
                              className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                            >
                              {t('reject') || "Отхвърли"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                          theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                              <UserPlus className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium">{t('unknown_user') || "Неизвестен потребител"}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('id') || "ID"}: {studentId.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(studentId, selectedCommunity!)}
                              className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                            >
                              {t('approve') || "Одобри"}
                            </button>
                            <button
                              onClick={() => handleRejectRequest(studentId, selectedCommunity!)}
                              className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                            >
                              {t('reject') || "Отхвърли"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Членове на общността */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">{t('members') || "Членове"} ({getCurrentCommunity()?.memberCount || 0})</h4>
                  <button
                    onClick={() => setSelectedTab("students")}
                    className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    {t('view_all') || "Виж всички"} →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getCommunityStudents().slice(0, 6).map((student, index) => (
                    <div
                      key={student.username}
                      className={`p-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: getColorByIndex(index) }}
                        >
                          {student.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{student.username}</div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {student.email}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className={`p-2 rounded-lg ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Рендиране на предизвикателствата
  const renderChallengesView = () => (
    <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
      <TeacherChallenges 
        communities={communities}
        selectedCommunityId={selectedCommunity}
        onCommunityChange={(communityId) => {
          setSelectedCommunity(communityId);
        }}
        onUpdate={() => {
          loadCommunities();
          loadDashboardData();
        }}
        onNewChallenge={(challenge) => {
          setUploadStatus(`✅ ${t('challenge_sent') || 'Предизвикателство'} "${challenge.title}" ${t('sent_successfully') || 'изпратено успешно'}!`);
          setTimeout(() => setUploadStatus(""), 3000);
          loadDashboardData();
        }}
        onIncomingChallenge={(notification) => {
          setChallengeNotifications(prev => [notification, ...prev]);
          setUploadStatus(`📬 ${notification.description}`);
          setTimeout(() => setUploadStatus(""), 5000);
        }}
        onChallengeStatusChange={(notification) => {
          setChallengeNotifications(prev => [notification, ...prev]);
          setUploadStatus(notification.description);
          setTimeout(() => setUploadStatus(""), 5000);
          loadDashboardData();
        }}
      />
    </div>
  );

  // Компонент за нишка от съобщения
  const MessageThread = ({ threadId, onClose }: { threadId: string, onClose: () => void }) => {
    const [threadMessages, setThreadMessages] = useState<Message[]>([]);
    const [newThreadMessage, setNewThreadMessage] = useState("");
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
      if (threadId) {
        loadThreadMessages();
      }
    }, [threadId]);
    
    const loadThreadMessages = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const q = query(
          collection(db, "messages"),
          where("senderId", "in", [user.uid, threadId]),
          where("receiverId", "in", [user.uid, threadId]),
          orderBy("timestamp", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        const messagesData: Message[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName || t('unknown') || "Unknown",
            receiverId: data.receiverId,
            receiverName: data.receiverName || t('unknown') || "Unknown",
            content: data.content,
            timestamp: data.timestamp,
            read: data.read || false,
            type: data.type || 'direct'
          });
        });
        
        setThreadMessages(messagesData);
      } catch (error) {
        console.error(t('error_loading_thread') || "Error loading thread messages:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const sendThreadMessage = async () => {
      if (!user || !threadId || !newThreadMessage.trim()) return;
      
      try {
        const messageRef = doc(collection(db, 'messages'));
        
        let receiverName = t('unknown') || "Unknown";
        
        const student = students.find(s => s.uid === threadId);
        if (student) {
          receiverName = student.username;
        } else {
          const community = communities.find(c => c.id === threadId);
          if (community) {
            receiverName = community.name;
          } else {
            const foundUser = allUsers.find(u => u.uid === threadId);
            if (foundUser) {
              receiverName = foundUser.username;
            }
          }
        }
        
        const newMessageData = {
          senderId: user.uid,
          senderName: userData?.fullName || user.email?.split('@')[0] || t('teacher') || "Teacher",
          receiverId: threadId,
          receiverName: receiverName,
          content: newThreadMessage,
          timestamp: serverTimestamp(),
          read: false,
          type: 'direct'
        };
        
        await setDoc(messageRef, newMessageData);
        
        const tempMessage: Message = {
          id: messageRef.id,
          ...newMessageData,
          timestamp: new Date()
        };
        
        setThreadMessages(prev => [...prev, tempMessage]);
        setNewThreadMessage("");
        
        setTimeout(() => loadThreadMessages(), 100);
        
      } catch (error) {
        console.error(t('error_sending_message') || "Error sending message:", error);
        alert(t('error_sending_message') || "Error sending message!");
      }
    };
    
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-black/80' : 'bg-black/60'}`}>
        <div className="absolute inset-0" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className={`relative w-full max-w-2xl rounded-2xl border overflow-hidden ${
            theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
          }`}
        >
          <div className="p-6 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">
                {t('message_thread') || "Нишка съобщения"} - {
                  students.find(s => s.uid === threadId)?.username ||
                  communities.find(c => c.id === threadId)?.name ||
                  allUsers.find(u => u.uid === threadId)?.username ||
                  threadId.substring(0, 8)
                }
              </h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-500/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2"
                     style={{ borderColor: colorScheme.primary }}></div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
              {threadMessages.length === 0 && !loading ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('no_messages_yet') || "Все още няма съобщения"}
                  </p>
                  <p className="text-sm opacity-70 mt-2">
                    {t('start_conversation') || "Започнете разговор, като изпратите съобщение"}
                  </p>
                </div>
              ) : (
                threadMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.senderId === user?.uid
                        ? 'ml-auto'
                        : 'mr-auto'
                    } max-w-[80%]`}
                    style={{
                      backgroundColor: msg.senderId === user?.uid 
                        ? `${colorScheme.primary}20`
                        : `${colorScheme.secondary}20`
                    }}
                  >
                    <div className="font-medium text-sm mb-1" style={{
                      color: msg.senderId === user?.uid 
                        ? colorScheme.primary
                        : colorScheme.secondary
                    }}>
                      {msg.senderName}
                      {msg.senderId === user?.uid && ` (${t('you') || 'Вие'})`}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                    <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {msg.timestamp?.toDate 
                        ? new Date(msg.timestamp.toDate()).toLocaleString()
                        : msg.timestamp instanceof Date
                        ? msg.timestamp.toLocaleString()
                        : t('just_now') || 'Току-що'}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newThreadMessage}
                onChange={(e) => setNewThreadMessage(e.target.value)}
                placeholder={t('type_message') || "Напишете съобщение..."}
                className={`flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendThreadMessage();
                  }
                }}
              />
              <button
                onClick={sendThreadMessage}
                disabled={!newThreadMessage.trim()}
                className="px-4 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text}`}>
      
      {/* HEADER */}
      <Header 
        isScrolled={true}
        userRole="teacher"
        notifications={notifications.map(n => ({
          id: n.id,
          title: n.title || t('notification') || 'Notification',
          description: n.message || n.description || '',
          type: (n.type as string) || 'system',
          read: n.read,
          timestamp: n.timestamp,
          data: n.data || { type: n.type || 'system' },
          actionUrl: n.actionUrl
        }))}
        unreadCount={unreadNotificationsCount}
        onNotificationClick={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onNotificationAction={(notification) => {
          if (notification.id) {
            handleMarkNotificationAsRead(notification.id);
          }
          
          if (notification.actionUrl) {
            const urlParams = new URLSearchParams(notification.actionUrl.split('?')[1]);
            const tab = urlParams.get('tab');
            
            if (tab) {
              setSelectedTab(tab);
            }
            
            if (notification.data?.communityId) {
              setSelectedCommunity(notification.data.communityId);
            }
            
            navigate(notification.actionUrl);
            return;
          }
          
          if (notification.data) {
            const data = notification.data;
            const type = data.type || notification.type;
            
            switch(type) {
              case 'join_request':
                if (data.communityId) {
                  setSelectedCommunity(data.communityId);
                  setSelectedTab('communities');
                }
                break;
                
              case 'message':
              case 'direct':
                setActiveThread(data.studentId || data.senderId || null);
                setShowMessaging(true);
                break;
                
              case 'challenge':
              case 'challenge_accepted':
              case 'challenge_rejected':
              case 'challenge_completed':
              case 'challenge_submission':
                setSelectedTab('challenges');
                if (data.communityId) {
                  setSelectedCommunity(data.communityId);
                }
                break;
                
              case 'grade':
              case 'submission_evaluated':
                setSelectedTab('students');
                if (data.studentId) {
                  const student = students.find(s => s.uid === data.studentId);
                  if (student) {
                    setTimeout(() => {
                      openGradingModal(student, data.assignmentId);
                    }, 300);
                  }
                }
                break;
            }
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
        onMessageClick={handleMarkAsRead}
        onMarkAllMessagesAsRead={handleMarkAllAsRead}
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
                            navigate(`/teacher-dashboard?tab=${item.id}`);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                            selectedTab === item.id
                              ? 'bg-blue-500 text-white'
                              : `opacity-70 hover:opacity-100 ${currentTheme.hover}`
                          }`}
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
              {selectedTab === "students" && (t('my_students') || "Моите ученици")}
              {selectedTab === "communities" && (t('communities') || "Общности")}
              {selectedTab === "courses" && (t('my_lessons') || "Моите уроци")}
              {selectedTab === "assignments" && (t('assignments') || "Задания")}
              {selectedTab === "challenges" && (t('challenges') || "Предизвикателства")}
              {selectedTab === "submissions" && (t('submissions') || "Предадени работи")}
              {selectedTab === "file-upload" && (t('upload_file') || "Качване на файл")}
              {selectedTab === "messages" && (t('messages') || "Съобщения")}
            </h1>
            <p className="opacity-70">
              {selectedTab === "dashboard" && (t('dashboard_description') || "Преглед на последните активности и статистики")}
              {selectedTab === "students" && `${students.filter(s => s.role === 'student').length} ${t('students_in_system') || 'ученици в системата'}`}
              {selectedTab === "communities" && `${communities.length} ${t('communities') || 'общности'}`}
              {selectedTab === "courses" && `${lessonStats.total} ${t('lessons') || 'урока'}`}
              {selectedTab === "assignments" && `${assignmentStats.total} ${t('assignments') || 'задания'}`}
              {selectedTab === "challenges" && `${challengeStats.active} ${t('active_challenges') || 'активни предизвикателства'}`}
              {selectedTab === "submissions" && `${submissions.length} ${t('submissions') || 'предадени работи'}`}
            </p>
          </div>

          {/* ДИНАМИЧНО СЪДЪРЖАНИЕ */}
          {selectedTab === "dashboard" && renderDashboardView()}
          {selectedTab === "students" && (
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <div className="flex justify-between mb-6">
                <h2 className="text-xl font-bold">{t('student_list') || "Списък с ученици"}</h2>
                <button
                  onClick={loadAllStudentsData}
                  className="px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  {t('refresh') || "Обнови"}
                </button>
              </div>

              {loadingStudents ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 mx-auto mb-4"
                       style={{ borderColor: colorScheme.primary }}></div>
                  <p className="opacity-70">{t('loading') || "Зареждане..."}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="opacity-70">{t('no_students_found') || "Няма намерени ученици"}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 text-left text-sm font-medium opacity-70">{t('student') || "Ученик"}</th>
                        <th className="py-3 text-left text-sm font-medium opacity-70">{t('files') || "Файлове"}</th>
                        <th className="py-3 text-left text-sm font-medium opacity-70">{t('avg_points') || "Ср. точки"}</th>
                        <th className="py-3 text-left text-sm font-medium opacity-70">{t('status') || "Статус"}</th>
                        <th className="py-3 text-left text-sm font-medium opacity-70">{t('actions') || "Действия"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                   style={{ backgroundColor: getColorByIndex(idx) }}>
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm">{student.username}</span>
                            </div>
                          </td>
                          <td className="py-3 text-sm">{student.totalFiles}</td>
                          <td className="py-3">
                            <span className="text-sm font-medium"
                                  style={{ color: student.averagePoints && student.averagePoints >= 7 ? colorScheme.accent :
                                          student.averagePoints && student.averagePoints >= 4 ? colorScheme.primary :
                                          colorScheme.secondary }}>
                              {student.averagePoints?.toFixed(1) || '0.0'}/10
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-xs px-2 py-1 rounded-full`}
                            style={{
                              backgroundColor: student.status === 'active' ? `${colorScheme.accent}20` :
                                              student.status === 'warning' ? `${colorScheme.primary}20` :
                                              `${colorScheme.secondary}20`,
                              color: student.status === 'active' ? colorScheme.accent :
                                     student.status === 'warning' ? colorScheme.primary :
                                     colorScheme.secondary
                            }}>
                              {student.status === 'active' ? t('active') || 'Активен' :
                               student.status === 'warning' ? t('average') || 'Среден' : t('inactive') || 'Неактивен'}
                            </span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => openGradingModal(student)}
                              className="p-1.5 rounded hover:bg-gray-500/20 transition-colors"
                              title={t('grade') || "Оцени"}
                            >
                              <GraduationCap className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {selectedTab === "communities" && renderCommunitiesView()}
          {selectedTab === "challenges" && renderChallengesView()}
          
          {selectedTab === "courses" && (
            <TeacherLessons
              teacherId={user?.uid || ''}
              isTeacherOrAdmin={userData?.role === 'teacher' || userData?.role === 'admin'}
              onStatsChange={(stats) => {
                setLessonStats(stats);
                loadDashboardData();
              }}
            />
          )}

          {selectedTab === "assignments" && (
            <TeacherAssignments 
              teacherId={user?.uid || ''}
              isTeacherOrAdmin={userData?.role === 'teacher' || userData?.role === 'admin'}
              onStatsChange={(stats) => {
                setAssignmentStats(stats);
              }}
            />
          )}

          {selectedTab === "submissions" && (
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <h2 className="text-xl font-bold mb-6">{t('submissions') || "Предадени работи"}</h2>
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="opacity-70">{t('no_submissions') || "Няма предадени работи"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className={`p-4 rounded-lg border ${currentTheme.border}`}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{sub.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          sub.status === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}
                        style={{
                          color: sub.status === 'success' ? colorScheme.accent : colorScheme.danger
                        }}>
                          {sub.status === 'success' ? t('success') || 'Успех' : t('error') || 'Грешка'}
                        </span>
                      </div>
                      <p className="text-xs opacity-70">{sub.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === "file-upload" && (
            <div className={`rounded-xl border ${currentTheme.card} ${currentTheme.border} p-6`}>
              <h2 className="text-xl font-bold mb-6">{t('upload_file') || "Качване на файл"}</h2>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-500/5' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">{t('drag_drop') || "Плъзнете вашия .pl файл тук"}</p>
                <p className="text-sm opacity-70 mb-4">{t('or') || "или"}</p>
                
                <input
                  id="fileInput"
                  type="file"
                  accept=".pl"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="fileInput"
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer inline-block"
                >
                  {t('browse_files') || "Избери файл"}
                </label>
              </div>

              {file && (
                <div className={`mt-4 p-4 rounded-lg border ${currentTheme.border}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5" style={{ color: colorScheme.primary }} />
                      <span>{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="p-1 rounded hover:bg-gray-500/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.card}`}
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleFileUpload}
                  disabled={!file}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  {t('upload') || "Качи"}
                </button>
              </div>

              {uploadStatus && (
                <div className={`mt-4 p-3 rounded-lg ${
                  uploadStatus.includes('✅') ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {uploadStatus}
                </div>
              )}
            </div>
          )}

          {selectedTab === "messages" && <MessagesTab />}

          {/* СТАТУС ЗА КАЧВАНЕ */}
          {uploadStatus && uploadStatus.includes('✅') && (
            <div className={`fixed bottom-6 right-6 p-4 rounded-lg border shadow-lg ${currentTheme.card} ${currentTheme.border}`}>
              {uploadStatus}
            </div>
          )}

        </main>
      </div>

      {/* МОДАЛИ */}

      {/* Community Form Modal */}
      {showCommunityForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowCommunityForm(false)} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className={`relative w-full max-w-md rounded-2xl border ${currentTheme.card} ${currentTheme.border}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${colorScheme.primary}20` }}>
                    <GroupIcon className="w-5 h-5" style={{ color: colorScheme.primary }} />
                  </div>
                  <h3 className="text-xl font-bold">{t('new_community') || "Нова общност"}</h3>
                </div>
                <button
                  onClick={() => setShowCommunityForm(false)}
                  className={`p-2 rounded-lg hover:bg-gray-500/20 transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('name') || "Име"} *</label>
                  <input
                    type="text"
                    value={communityForm.name}
                    onChange={(e) => setCommunityForm({...communityForm, name: e.target.value})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${currentTheme.card} border ${currentTheme.border}`}
                    placeholder={t('enter_name') || "Въведете име"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('description') || "Описание"}</label>
                  <textarea
                    value={communityForm.description}
                    onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})}
                    rows={3}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${currentTheme.card} border ${currentTheme.border}`}
                    placeholder={t('enter_description') || "Въведете описание"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('grade_level') || "Клас"}</label>
                    <input
                      type="text"
                      value={communityForm.gradeLevel}
                      onChange={(e) => setCommunityForm({...communityForm, gradeLevel: e.target.value})}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${currentTheme.card} border ${currentTheme.border}`}
                      placeholder={t('grade_example') || "напр. 10 клас"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('subject') || "Предмет"}</label>
                    <input
                      type="text"
                      value={communityForm.subject}
                      onChange={(e) => setCommunityForm({...communityForm, subject: e.target.value})}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${currentTheme.card} border ${currentTheme.border}`}
                      placeholder={t('subject_example') || "напр. Математика"}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('privacy') || "Приватност"}</label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={communityForm.privacy === 'private'}
                        onChange={(e) => setCommunityForm({...communityForm, privacy: e.target.value as "public" | "private"})}
                        className="hidden"
                      />
                      <span className={`px-4 py-2 rounded-lg ${communityForm.privacy === 'private' ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>
                        {t('private') || "Частна"}
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={communityForm.privacy === 'public'}
                        onChange={(e) => setCommunityForm({...communityForm, privacy: e.target.value as "public" | "private"})}
                        className="hidden"
                      />
                      <span className={`px-4 py-2 rounded-lg ${communityForm.privacy === 'public' ? 'bg-blue-500 text-white' : 'bg-white/10'}`}>
                        {t('public') || "Публична"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={communityForm.autoApprove}
                      onChange={(e) => setCommunityForm({...communityForm, autoApprove: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">{t('auto_approve_students') || "Автоматично одобряване на ученици"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={communityForm.allowStudentMessages}
                      onChange={(e) => setCommunityForm({...communityForm, allowStudentMessages: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">{t('allow_student_messages') || "Позволи съобщения между ученици"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={communityForm.allowStudentChallenges}
                      onChange={(e) => setCommunityForm({...communityForm, allowStudentChallenges: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">{t('allow_student_challenges') || "Позволи учениците да създават предизвикателства"}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={communityForm.allowInterCommunityChallenges}
                      onChange={(e) => setCommunityForm({...communityForm, allowInterCommunityChallenges: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">{t('allow_inter_community_challenges') || "Позволи предизвикателства между общности"}</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCommunityForm(false)}
                  className={`flex-1 py-3 rounded-lg hover:bg-gray-500/20 transition-colors`}
                >
                  {t('cancel') || "Отказ"}
                </button>
                <button
                  onClick={handleCreateCommunity}
                  disabled={!communityForm.name.trim()}
                  className="flex-1 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  {t('create') || "Създай"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Messaging Modal */}
      {showMessaging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => {
            setShowMessaging(false);
            setSelectedStudent(null);
          }} />
          
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className={`relative w-full max-w-lg rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.border}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${colorScheme.primary}20` }}>
                    <MessageCircle className="w-5 h-5" style={{ color: colorScheme.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t('quick_message') || "Бързо съобщение"}</h3>
                    <p className="opacity-70 text-sm">{t('quick_message_desc') || "Изпратете бързо съобщение до ученици"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTab("messages");
                      setShowMessaging(false);
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
                  >
                    {t('mailbox') || "Поща"}
                  </button>
                  <button
                    onClick={() => {
                      setShowMessaging(false);
                      setSelectedStudent(null);
                    }}
                    className={`p-2 rounded-lg hover:bg-gray-500/20 transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('recipient') || "Получател"}</label>
                  <select
                    value={selectedStudent?.uid || selectedCommunity || "broadcast"}
                    onChange={(e) => {
                      if (e.target.value === "broadcast") {
                        setSelectedStudent(null);
                        setSelectedCommunity(null);
                      } else if (communities.find(c => c.id === e.target.value)) {
                        setSelectedCommunity(e.target.value);
                        setSelectedStudent(null);
                      } else {
                        const user = allUsers.find(u => u.uid === e.target.value) || 
                                   students.find(s => s.uid === e.target.value);
                        
                        if (user) {
                          setSelectedStudent({
                            username: user.username,
                            uid: user.uid,
                            files: [],
                            totalFiles: 0,
                            lastUpload: '',
                            role: user.role
                          });
                          setSelectedCommunity(null);
                        }
                      }
                    }}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${currentTheme.card} border ${currentTheme.border}`}
                  >
                    <option value="broadcast">📢 {t('all_students') || "Всички ученици"}</option>
                    
                    <optgroup label={t('communities') || "Общности"}>
                      {communities.map(community => (
                        <option key={community.id} value={community.id}>
                          👥 {community.name}
                        </option>
                      ))}
                    </optgroup>
                    
                    <optgroup label={t('students') || "Ученици"}>
                      {students.slice(0, 5).map(student => (
                        <option key={student.uid} value={student.uid}>
                          👤 {student.username}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('message') || "Съобщение"}</label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${currentTheme.card} border ${currentTheme.border}`}
                    placeholder={t('type_message_here') || "Напишете вашето съобщение тук..."}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowMessaging(false);
                      setSelectedStudent(null);
                      setNewMessage("");
                    }}
                    className={`flex-1 py-3 rounded-lg hover:bg-gray-500/20 transition-colors`}
                  >
                    {t('cancel') || "Отказ"}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedCommunity) {
                        handleSendMessage(selectedCommunity, newMessage);
                      } else if (selectedStudent) {
                        handleSendMessage(selectedStudent.uid || undefined, newMessage);
                      } else {
                        handleSendMessage('all', newMessage);
                      }
                      setShowMessaging(false);
                      setSelectedStudent(null);
                      setNewMessage("");
                    }}
                    disabled={!newMessage.trim()}
                    className="flex-1 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5 inline mr-2" />
                    {t('send') || "Изпрати"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Grading Modal */}
      {gradingModal.isOpen && (
        <AssignmentGradingModal
          studentName={gradingModal.studentName}
          studentId={gradingModal.studentId}
          files={gradingModal.files}
          assignmentId={gradingModal.assignmentId}
          onClose={() => setGradingModal({ isOpen: false, studentName: '', studentId: '', files: [] })}
          onSave={handleSaveGrade}
        />
      )}

      {/* View Student Files Modal */}
      {viewingStudentFiles && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => setViewingStudentFiles(null)} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl border overflow-hidden ${currentTheme.card} ${currentTheme.border}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                       style={{ backgroundColor: `${colorScheme.primary}20` }}>
                    <FolderOpen className="w-5 h-5" style={{ color: colorScheme.primary }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {t('student_files') || "Файлове на ученик"}: {viewingStudentFiles}
                    </h3>
                    <p className="opacity-70">
                      {students.find(s => s.username === viewingStudentFiles)?.files.length || 0} {t('files') || 'файла'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingStudentFiles(null)}
                  className={`p-2 rounded-lg hover:bg-gray-500/20 transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {students.find(s => s.username === viewingStudentFiles)?.files.map((file) => (
                  <div
                    key={file.id}
                    className={`p-4 rounded-xl border ${currentTheme.border} hover:bg-white/5 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                             style={{ backgroundColor: `${colorScheme.primary}20` }}>
                          <FileCode className="w-5 h-5" style={{ color: colorScheme.primary }} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{file.originalFileName}</div>
                          <div className="flex items-center gap-4 text-sm opacity-70">
                            <span><Folder className="w-4 h-4 inline mr-1" /> {file.folder}</span>
                            <span>
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {new Date(file.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}
                            </span>
                            {file.points !== undefined && (
                              <span className="px-2 py-1 rounded text-xs"
                                    style={{ backgroundColor: `${colorScheme.accent}20`, color: colorScheme.accent }}>
                                {file.points}/10
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => openFileInNewTab(file)}
                          className={`p-2 rounded-lg hover:bg-gray-500/20 transition-colors`}
                          title={t('view') || "Преглед"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadFile(file)}
                          className={`p-2 rounded-lg hover:bg-gray-500/20 transition-colors`}
                          title={t('download') || "Изтегли"}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {students.find(s => s.username === viewingStudentFiles)?.files.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="opacity-70">{t('no_files') || "Няма качени файлове"}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Message Thread Modal */}
      {activeThread && (
        <MessageThread
          threadId={activeThread}
          onClose={() => setActiveThread(null)}
        />
      )}

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
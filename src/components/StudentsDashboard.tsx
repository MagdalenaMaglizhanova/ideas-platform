import { useEffect, useState, useRef, type JSX } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Target, TrendingUp, Award, 
  Brain, 
  Sparkles, ChevronRight,
  BarChart3,  X,
  BookOpen, Calendar,
  CheckCircle, Upload, FileCode, FileText,
  Eye,
  GraduationCap, User,
  Plus, RefreshCw,
  Database,
  Trophy,
  Activity,
  Clock,
  Bell,
  Copy,
  UploadCloud,
  History,
  Code,
  Play,
  AlertCircle,
  Globe,
  Cpu,
  Download as DownloadIcon,
  MessageCircle,
  Group as GroupIcon,
  UserPlus,
  Hash,
  Trash2,
  ListChecks,
  Link,
  List
} from "lucide-react";
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
  getDocs,
  serverTimestamp,
  limit,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  writeBatch,
  deleteDoc 
} from "firebase/firestore";
import StudentMessages from "./StudentMessages";

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

interface ChallengeSolution {
  id: string;
  challengeId: string;
  studentId: string;
  studentName?: string;
  solutionCode: string;
  status: 'submitted' | 'evaluated';
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

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'grade' | 'assignment' | 'challenge' | 'system' | 'message' | 'direct';
  timestamp: any;
  read: boolean;
  link?: string;
  details?: any;
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

const courses = [
  { id: 1, title: "Prolog Basics", description: "Introduction to Prolog programming", progress: 70, color: "#FF6B8B", icon: "💻" },
  { id: 2, title: "Expert Systems", description: "Build intelligent systems", progress: 45, color: "#36D1DC", icon: "🧠" },
  { id: 3, title: "Logical Rules", description: "Advanced logic programming", progress: 85, color: "#FFD166", icon: "⚡" },
  { id: 4, title: "AI Fundamentals", description: "Artificial Intelligence basics", progress: 30, color: "#9D4EDD", icon: "🤖" },
  { id: 5, title: "Data Structures", description: "Prolog data organization", progress: 60, color: "#4CC9F0", icon: "🗂️" },
  { id: 6, title: "Problem Solving", description: "Solve real-world problems", progress: 25, color: "#FF9E6D", icon: "🎯" },
];

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

export default function StudentsDashboard(): JSX.Element {
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const topRef = useRef<HTMLDivElement>(null);
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [code, setCode] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const isAssignmentsLoading = useRef(false);
  const hasLoadedAssignments = useRef(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<Assignment | null>(null);
  const [challengeSolutions, setChallengeSolutions] = useState<ChallengeSolution[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [_showMessaging, setShowMessaging] = useState(false);
  const [_selectedMessageUser, setSelectedMessageUser] = useState<any>(null);
  const [communityInviteCode, setCommunityInviteCode] = useState("");
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingData, setLoadingData] = useState({
    communities: true,
    challenges: true,
    assignments: true,
    users: true,
    notifications: true,
    grades: true
  });
  
  const [codeMetadata, setCodeMetadata] = useState({
    domain: "",
    type: "Symbolic AI / Expert System",
    studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
    dataArea: "",
    assignmentId: "",
    assignmentTitle: ""
  });

  const [submissions, _setSubmissions] = useState<Submission[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);

  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    totalSubmissions: 0,
    successRate: 0,
    activeStreak: 7,
    averageScore: 0,
    communityMembers: 0,
    activeChallenges: 0
  });

  const themeClasses = {
    light: {
      background: "bg-gray-50",
      text: "text-gray-900",
      sidebar: "bg-white border-gray-200",
      card: "bg-white border-gray-200",
      input: "bg-white border-gray-300",
      hover: "hover:bg-gray-100",
      modal: "bg-white",
      tableRow: "hover:bg-gray-50"
    },
    dark: {
      background: "bg-gray-900",
      text: "text-white",
      sidebar: "bg-gray-800 border-gray-700",
      card: "bg-gray-800 border-gray-700",
      input: "bg-gray-700 border-gray-600",
      hover: "hover:bg-gray-700",
      modal: "bg-gray-800",
      tableRow: "hover:bg-gray-700/50"
    }
  };

  const currentTheme = themeClasses[theme];

  const recommendations = [
    {
      id: 1,
      icon: <Brain className="w-5 h-5" />,
      title: t?.('practice_makes_perfect') || "Practice Makes Perfect",
      description: t?.('practice_makes_perfect_desc') || "Try solving 3 new Prolog problems this week to improve your skills.",
      color: "from-purple-500 to-pink-500",
      action: t?.('start_now') || "Start Now"
    },
    {
      id: 2,
      icon: <Target className="w-5 h-5" />,
      title: t?.('complete_assignments_early') || "Complete Assignments Early",
      description: t?.('complete_assignments_early_desc') || "Submit your work 2 days before deadline for bonus points.",
      color: "from-blue-500 to-cyan-500",
      action: t?.('view_assignments') || "View Assignments"
    },
    {
      id: 3,
      icon: <Users className="w-5 h-5" />,
      title: t?.('join_study_group') || "Join Study Group",
      description: t?.('join_study_group_desc') || "Collaborate with classmates on complex Prolog projects.",
      color: "from-green-500 to-emerald-500",
      action: t?.('join_now') || "Join Now"
    }
  ];

  // Зареждане на решенията на студента за всички challenge-и
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
      
      console.log(`📥 Loaded ${solutions.length} challenge solutions for student`);
      setChallengeSolutions(solutions);
    } catch (error) {
      console.error('Error loading challenge solutions:', error);
    } finally {
      setLoadingSolutions(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'messages', notificationId));
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      }
      
      console.log("Notification deleted:", notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert(t?.('delete_notification_error') || 'Грешка при изтриване на нотификацията!');
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      
      notifications.forEach(notification => {
        const notificationRef = doc(db, 'messages', notification.id);
        batch.delete(notificationRef);
      });
      
      await batch.commit();
      
      setNotifications([]);
      setUnreadNotifications(0);
      
      console.log("All notifications deleted");
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      alert(t?.('delete_all_notifications_error') || 'Грешка при изтриване на нотификациите!');
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoadingData(prev => ({ ...prev, notifications: true }));
      
      // Директен listener за всички нотификации
      const q = query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        where("type", "in", ["grade", "grade_notification", "assignment", "challenge", "direct", "system"]),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("✅ Notifications loaded:", snapshot.size);
        
        const notificationsData: Notification[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          let notificationType = data.type;
          if (notificationType === 'grade_notification') {
            notificationType = 'grade';
          }
          
          let title = data.title;
          if (!title) {
            if (notificationType === 'grade') {
              title = t?.('grade_received') || "📊 Получена оценка";
            } else if (notificationType === 'assignment') {
              title = t?.('new_assignment') || "📚 Ново задание";
            } else if (notificationType === 'challenge') {
              title = t?.('new_challenge') || "🎯 Ново предизвикателство";
            } else if (notificationType === 'direct') {
              title = t?.('new_message') || "💬 Ново съобщение";
            } else {
              title = t?.('notification') || "📢 Известие";
            }
          }
          
          notificationsData.push({
            id: doc.id,
            userId: data.receiverId || user.uid,
            title: title,
            message: data.content || data.message || "",
            type: notificationType,
            timestamp: data.timestamp,
            read: data.read || false,
            link: data.link,
            details: data.details || {
              gradeId: data.gradeId,
              assignmentTitle: data.assignmentTitle,
              challengeId: data.challengeId,
              points: data.content?.match(/\d+\/10/)?.[0] || data.points
            }
          });
        });
        
        setNotifications(notificationsData);
        setUnreadNotifications(notificationsData.filter(n => !n.read).length);
        setLoadingData(prev => ({ ...prev, notifications: false }));
        
      }, (error) => {
        console.error("❌ Error loading notifications:", error);
        setLoadingData(prev => ({ ...prev, notifications: false }));
      });
      
      return unsubscribe;
      
    } catch (error) {
      console.error("Error setting up notifications listener:", error);
      setLoadingData(prev => ({ ...prev, notifications: false }));
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user || unreadNotifications === 0) return;
    
    try {
      const batch = writeBatch(db);
      const unreadNotificationsList = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotificationsList) {
        const notificationRef = doc(db, 'messages', notification.id);
        batch.update(notificationRef, { read: true });
      }
      
      await batch.commit();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifications(0);
      
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read && user) {
      try {
        const notificationRef = doc(db, 'messages', notification.id);
        await updateDoc(notificationRef, { read: true });
        
        setUnreadNotifications(prev => prev - 1);
        
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    
    if (notification.type === 'grade') {
      setShowGradesModal(true);
      await loadStudentGrades();
    } else if (notification.type === 'assignment') {
      setSelectedTab("assignments");
    } else if (notification.type === 'challenge') {
      setSelectedTab("challenges");
      if (notification.details?.challengeId) {
        console.log("Challenge ID:", notification.details.challengeId);
        setSelectedChallengeId(notification.details.challengeId);
      }
    } else if (notification.type === 'direct') {
      setSelectedTab("messages");
    }
    
    setShowNotifications(false);
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
      setLoadingData(prev => ({ ...prev, users: false }));
    } catch (error) {
      console.error("Error loading all users:", error);
      setLoadingData(prev => ({ ...prev, users: false }));
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
          name: data.name || t?.('unnamed_community') || "Unnamed Community",
          description: data.description || t?.('no_description') || "No description",
          teacherId: data.teacherId || "",
          institution: data.institution || t?.('unknown') || "Unknown",
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
      
      setLoadingData(prev => ({ ...prev, communities: false }));
    } catch (error) {
      console.error("Error loading communities:", error);
      setLoadingData(prev => ({ ...prev, communities: false }));
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

  const loadNotificationsFromMessages = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        where("type", "in", ["grade_notification", "system", "grade", "assignment", "challenge"]),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      console.log(loadNotificationsFromMessages)
      const snapshot = await getDocs(q);
      const notificationsData: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        let notificationType = data.type;
        if (notificationType === 'grade_notification') {
          notificationType = 'grade';
        }
        
        notificationsData.push({
          id: doc.id,
          userId: data.receiverId || user.uid,
          title: data.title || 
                (data.type === 'grade_notification' ? t?.('grade_received') || "Grade Received" : t?.('system') || "System"),
          message: data.content || "",
          type: notificationType,
          timestamp: data.timestamp,
          read: data.read || false,
          link: data.link,
          details: data.details || {
            gradeId: data.gradeId,
            assignmentTitle: data.assignmentTitle,
            points: data.content?.match(/\d+\/10/)?.[0] || ""
          }
        });
      });
      
      setNotifications(notificationsData);
      setUnreadNotifications(notificationsData.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications from messages:", error);
    }
  };

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

  useEffect(() => {
    if (!user) return;
    
    console.log("📡 Setting up messages listener...");
    
    const messagesQ = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("type", "==", "direct"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    
    const unsubscribeMessages = onSnapshot(messagesQ, 
      (snapshot) => {
        console.log("✅ Direct messages loaded:", snapshot.size);
        
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
      },
      (error) => {
        console.error("❌ Error loading messages:", error);
        
        // Ако има грешка, опитайте без orderBy
        if (error.code === 'failed-precondition') {
          console.log("🔄 Trying without orderBy...");
          
          const simpleMessagesQ = query(
            collection(db, "messages"),
            where("receiverId", "==", user.uid),
            where("type", "==", "direct"),
            limit(20)
          );
          
          onSnapshot(simpleMessagesQ, 
            (simpleSnapshot) => {
              console.log("✅ Simple messages query successful:", simpleSnapshot.size);
              const messagesData: Message[] = [];
              simpleSnapshot.forEach((doc) => {
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
            },
            (simpleError) => {
              console.error("❌ Simple query also failed:", simpleError);
            }
          );
        }
      }
    );
    
    return () => {
      unsubscribeMessages();
    };
  }, [user, t]);

  useEffect(() => {
    if (!user) return;
    
    console.log("📡 Setting up notifications listener...");
    
    const unsubscribe = loadNotifications();
    
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub?.());
      }
    };
  }, [user, t]);

  useEffect(() => {
    if (!user) return;
    
    const notificationsQ = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("type", "in", ["grade_notification", "direct", "system", "assignment", "challenge"]),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const unsubscribeNotifications = onSnapshot(notificationsQ, 
      (snapshot) => {
        console.log("✅ Notifications loaded:", snapshot.size);
      },
      (error) => {
        console.error("❌ Error loading notifications:", error);
      }
    );
    
    return () => {
      unsubscribeNotifications();
    };
  }, [user]);

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
        logs.push({
          id: doc.id,
          studentId: data.userId || user?.uid || "",
          studentName: data.userName || userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
          action: data.action || t?.('unknown_action') || "Unknown action",
          timestamp: data.timestamp || serverTimestamp(),
          details: data.details || "",
          file: data.target || "",
          status: data.actionType || 'general'
        });
      });
      
      setActivityLogs(logs);
    } catch (error) {
      console.error("Error loading activity logs:", error);
    }
  };

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
      const communityRef = doc(db, 'communities', communityId);
      
      await updateDoc(communityRef, {
        pendingRequests: arrayUnion(user.uid)
      });
      
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
      
      if (solutionsSnapshot.empty) {
        const solutionRef = doc(collection(db, 'challengeSolutions'));
        
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
              submittedAt: serverTimestamp()
            };
          }
          return sub;
        });
        
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

      setUploadStatus("✅ " + (t?.('challenge_submitted') || "Challenge solution submitted successfully!"));
      setCode("");
      
      await loadChallenges();
      await loadActivityLogs();
    } catch (error) {
      console.error("Error submitting challenge solution:", error);
      setUploadStatus("❌ " + (t?.('challenge_submission_error') || "Error submitting challenge solution!"));
    }
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

  const getNavItems = () => [
    { 
      id: "dashboard", 
      label: t?.('dashboard') || "Dashboard", 
      icon: <BarChart3 className="w-5 h-5" />,
      badge: null
    },
    { 
      id: "messages", 
      label: t?.('messages') || "Messages", 
      icon: <MessageCircle className="w-5 h-5" />,
      badge: messages.filter(m => !m.read && m.type === 'direct' && m.receiverId === user?.uid).length
    },
    { 
      id: "communities", 
      label: t?.('communities') || "Communities", 
      icon: <GroupIcon className="w-5 h-5" />,
      badge: communities.length
    },
    { 
      id: "challenges", 
      label: t?.('challenges') || "Challenges", 
      icon: <Target className="w-5 h-5" />,
      badge: challenges.filter(c => c.status === 'accepted' || c.status === 'pending').length
    },
    { 
      id: "mySolutions", 
      label: t?.('my_solutions') || "My Solutions", 
      icon: <Trophy className="w-5 h-5" />,
      badge: null
    },
    { 
      id: "courses", 
      label: t?.('my_courses') || "My Courses", 
      icon: <BookOpen className="w-5 h-5" />,
      badge: courses.length
    },
    { 
      id: "assignments", 
      label: t?.('assignments') || "Assignments", 
      icon: <FileText className="w-5 h-5" />,
      badge: stats.pendingAssignments
    },
    { 
      id: "grades", 
      label: t?.('my_grades') || "My Grades", 
      icon: <Award className="w-5 h-5" />,
      badge: null
    },
    { 
      id: "progress", 
      label: t?.('progress') || "Progress", 
      icon: <TrendingUp className="w-5 h-5" />,
      badge: null
    },
    { 
      id: "upload", 
      label: t?.('code_editor') || "Code Editor", 
      icon: <Code className="w-5 h-5" />,
      badge: null
    },
    { 
      id: "submissions", 
      label: t?.('submissions') || "Submissions", 
      icon: <History className="w-5 h-5" />,
      badge: submissions.length
    },
  ];

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

  useEffect(() => {
    if (!user) return;
    
    console.log("📡 Setting up challenge notifications listener...");
    
    const challengesQuery = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("type", "==", "challenge"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(challengesQuery, (snapshot) => {
      console.log("📬 Challenge notifications loaded:", snapshot.size);
      
      if (snapshot.empty) {
        console.log("No challenge notifications found");
        return;
      }
      
      const challengeNotifications: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📨 Challenge notification:", data);
        
        challengeNotifications.push({
          id: doc.id,
          userId: user.uid,
          title: data.title || t?.('new_challenge_notification') || "🎯 Ново предизвикателство",
          message: data.content || (t?.('new_challenge_available') || `Ново challenge: ${data.challengeTitle || "Без име"}`),
          type: 'challenge',
          timestamp: data.timestamp,
          read: data.read || false,
          link: data.link || '/dashboard/student?tab=challenges',
          details: data.details || {
            challengeId: data.challengeId,
            challengeTitle: data.challengeTitle,
            teacherName: data.metadata?.teacherName || data.fromTeacherName
          }
        });
      });
      
      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'challenge');
        const merged = [...challengeNotifications, ...filtered];
        return merged.sort((a, b) => {
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });
      });
      
      const unreadChallenges = challengeNotifications.filter(n => !n.read).length;
      setUnreadNotifications(_prev => {
        const otherUnread = notifications.filter(n => n.type !== 'challenge' && !n.read).length;
        return unreadChallenges + otherUnread;
      });
      
    }, (error) => {
      console.error("❌ Error loading challenge notifications:", error);
    });
    
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("type", "in", ["grade_notification", "direct", "system", "assignment", "challenge"]),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("✅ All notifications loaded:", snapshot.size);
      
      const notificationsData: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        let notificationType = data.type;
        if (notificationType === 'grade_notification') {
          notificationType = 'grade';
        }
        
        notificationsData.push({
          id: doc.id,
          userId: user.uid,
          title: data.type === 'grade_notification' 
            ? t?.('grade_received') || "Grade Received"
            : data.type === 'assignment'
            ? t?.('new_assignment_notification') || "📚 Ново задание"
            : data.type === 'challenge'
            ? t?.('new_challenge_notification') || "🎯 Ново предизвикателство"
            : data.type === 'direct'
            ? t?.('new_message') || "New Message"
            : data.title || t?.('notification') || "Notification",
          message: data.content || "",
          type: notificationType,
          timestamp: data.timestamp,
          read: data.read || false,
          link: data.link,
          details: data.details || {}
        });
      });
      
      setNotifications(notificationsData);
      
      const unreadCount = notificationsData.filter(n => !n.read).length;
      console.log("🔢 Unread notifications:", unreadCount, "Total:", notificationsData.length);
      setUnreadNotifications(unreadCount);
      
    }, (error) => {
      console.error("❌ Error loading notifications:", error);
    });
    
    return () => unsubscribe();
  }, [user, t]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      
      console.log("Message deleted:", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert(t?.('delete_message_error') || 'Грешка при изтриване на съобщението!');
    }
  };

  const handleDeleteAllMessages = async () => {
    if (!user || messages.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      const userMessages = messages.filter(m => m.receiverId === user.uid);
      
      userMessages.forEach(message => {
        const messageRef = doc(db, 'messages', message.id);
        batch.delete(messageRef);
      });
      
      await batch.commit();
      
      setMessages([]);
      
      console.log("All messages deleted");
    } catch (error) {
      console.error("Error deleting all messages:", error);
      alert(t?.('delete_all_messages_error') || 'Грешка при изтриване на съобщенията!');
    }
  };

  const markAllMessagesAsRead = async () => {
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

  const loadStudentGrades = async () => {
    if (!user?.uid) {
      setLoadingGrades(false);
      setLoadingData(prev => ({ ...prev, grades: false }));
      return;
    }
    
    setLoadingGrades(true);
    setLoadingData(prev => ({ ...prev, grades: true }));
    
    try {
      const gradesQuery = query(
        collection(db, "grades"),
        where("studentId", "==", user.uid),
        orderBy("gradedAt", "desc")
      );
      
      const unsubscribe = onSnapshot(gradesQuery, (snapshot) => {
        const gradesData: any[] = [];
        
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
            _searchable: `${data.assignmentTitle} ${data.fileName} ${data.studentName}`.toLowerCase()
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
        
        setLoadingGrades(false);
        setLoadingData(prev => ({ ...prev, grades: false }));
      });
      
      return unsubscribe;
      
    } catch (error: any) {
      console.error("Error loading student grades:", error);
      
      if (studentGrades.length === 0) {
        const mockGrades = [
          {
            id: "mock_grade_1",
            assignmentId: "mock_assignment_1",
            assignmentTitle: t?.('introduction_to_prolog') || "Introduction to Prolog",
            points: 9,
            maxPoints: 10,
            feedback: t?.('excellent_work_prolog') || "Excellent work! Your understanding of Prolog basics is solid.",
            gradedAt: new Date(),
            gradedBy: "Prof. Smith",
            studentId: user.uid,
            studentName: userData?.fullName || t?.('student') || "Student",
            type: "assignment"
          },
          {
            id: "mock_grade_2",
            assignmentId: "mock_assignment_2",
            assignmentTitle: t?.('expert_systems_design') || "Expert Systems Design",
            points: 8,
            maxPoints: 10,
            feedback: t?.('good_work_detailed_rules') || "Good work, but could use more detailed rules.",
            gradedAt: new Date(Date.now() - 86400000),
            gradedBy: "Prof. Johnson",
            studentId: user.uid,
            studentName: userData?.fullName || t?.('student') || "Student",
            type: "assignment"
          }
        ];
        setStudentGrades(mockGrades);
      }
      
      setLoadingGrades(false);
      setLoadingData(prev => ({ ...prev, grades: false }));
    }
  };

  useEffect(() => {
    if (user) {
      loadAllUsers();
      loadCommunities();
      loadMessages(); 
      loadActivityLogs();
      loadStudentGrades();
      loadChallengeSolutions();
    }
  }, [user]);

  useEffect(() => {
    if (communities.length > 0 && !loadingData.communities) {
      loadChallenges();
      loadAssignments();
      loadChallengeSolutions();
    }
  }, [communities, loadingData.communities]);

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

  useEffect(() => {
    if (selectedTab === "assignments" || selectedTab === "dashboard") {
      if (!loadingData.assignments) {
        loadAssignments();
      }
    }
    
    if (selectedTab === "challenges") {
      if (!loadingData.challenges) {
        loadChallenges();
      }
    }
    
    if (selectedTab === "communities") {
      if (!loadingData.communities) {
        loadCommunities();
      }
    }
    
    if (selectedTab === "grades") {
      if (!loadingData.grades) {
        loadStudentGrades();
      }
    }
  }, [selectedTab]);

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
        setSelectedTab("mySolutions");
        window.scrollTo(0, 0);
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
        await addDoc(collection(db, "prologCodes"), {
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
      } catch (error) {
        console.error("Error uploading assignment:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setUploadStatus("❌ " + (t?.('upload_error') || "Error uploading code!") + " " + errorMessage);
      }
    }
  };

  const statsCards = [
    {
      title: t?.('total_assignments') || "Total Assignments",
      value: stats.totalAssignments,
      icon: <FileText className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      change: `${stats.completedAssignments} ${t?.('completed') || "completed"}`,
      description: t?.('active_assignments') || "Active assignments"
    },
    {
      title: t?.('pending_assignments') || "Pending",
      value: stats.pendingAssignments,
      icon: <Clock className="w-6 h-6" />,
      color: "from-amber-500 to-orange-500",
      change: t?.('requires_attention') || "Requires attention",
      description: t?.('needs_submission') || "Needs submission"
    },
    {
      title: t?.('communities') || "Communities",
      value: communities.length,
      icon: <GroupIcon className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      change: `${stats.communityMembers} ${t?.('members') || "members"}`,
      description: t?.('learning_communities') || "Learning communities"
    },
    {
      title: t?.('active_challenges') || "Active Challenges",
      value: stats.activeChallenges,
      icon: <Target className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      change: `${challenges.filter(c => c.status === 'accepted').length} ${t?.('accepted') || "accepted"}`,
      description: t?.('challenges_in_progress') || "Challenges in progress"
    }
  ];

  const todaysTasks = assignments.map(assignment => {
    const isCompleted = assignment.studentProgress?.completed || false;
    const progress = isCompleted ? 100 : 0;
    const evaluation = assignment.studentProgress?.grade;
    
    const priority = assignment.difficulty === 'hard' ? 'high' : 
                    assignment.difficulty === 'medium' ? 'medium' : 'low';
    
    const priorityIcon = assignment.difficulty === 'hard' ? '🔥' :
                        assignment.difficulty === 'medium' ? '💧' : '🌬️';

    const subjectIcon = assignment.subject === 'biology' ? '🧬' :
                       assignment.subject === 'chemistry' ? '🧪' :
                       assignment.subject === 'physics' ? '⚛️' : '💾';
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject.charAt(0).toUpperCase() + assignment.subject.slice(1),
      subjectIcon: subjectIcon,
      dueDate: assignment.dueDate,
      dueTime: `${t?.('due') || "Due"}: ${new Date(assignment.dueDate).toLocaleDateString()}`,
      estimatedTime: `${assignment.requirements.minFacts}-${assignment.requirements.minFacts + 20} ${t?.('lines') || "lines"}`,
      priority: priority,
      priorityIcon: priorityIcon,
      completed: isCompleted,
      evaluation: evaluation,
      progress: progress,
      assignment: assignment
    };
  });

  const startTask = (taskId: string) => {
    const assignment = assignments.find(a => a.id === taskId);
    if (assignment) {
      setSelectedAssignment(taskId);
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
      
      window.scrollTo(0, 0);
    }
  };

  const openTaskDetails = (taskId: string) => {
    const assignment = assignments.find(a => a.id === taskId);
    if (assignment) {
      setSelectedAssignmentDetails(assignment);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "success": return t?.('status_success') || "Success";
      case "error": return t?.('status_error') || "Error";
      default: return t?.('status_pending') || "Pending";
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

  const downloadCode = (code: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.pl`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderCommunitiesView = () => (
    <div className="space-y-6">
      <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5" /> {t?.('join_community') || "Join Community"}
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={communityInviteCode}
            onChange={(e) => setCommunityInviteCode(e.target.value.toUpperCase())}
            placeholder={t?.('enter_invite_code') || "Enter invite code"}
            className={`flex-1 px-4 py-3 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
          <button
            onClick={handleJoinWithCode}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
          >
            <UserPlus className="w-5 h-5 inline mr-2" />
            {t?.('join') || "Join"}
          </button>
        </div>
        {uploadStatus && (
          <div className={`mt-3 p-3 rounded-lg ${
            uploadStatus.includes('✅') 
              ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
              : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>

      <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <GroupIcon className="w-5 h-5" /> {t?.('my_communities') || "My Communities"} ({communities.length})
        </h3>
        
        {communities.length === 0 ? (
          <div className="text-center py-12">
            <GroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold mb-2">
              {t?.('no_communities_yet') || "No communities yet"}
            </h4>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t?.('join_community_description') || "Join a community to collaborate with classmates!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <motion.div
                key={community.id}
                whileHover={{ scale: 1.02 }}
                className={`p-6 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <GroupIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold">{community.name}</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {community.memberCount} {t?.('members') || "members"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    community.isPublic 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {community.isPublic ? t?.('public') || 'Public' : t?.('private') || 'Private'}
                  </span>
                </div>
                
                <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {community.description}
                </p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {community.subject || t?.('general') || "General"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t?.('code') || "Code"}: {community.inviteCode}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveCommunity(community);
                      setSelectedTab("challenges");
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {t?.('view_challenges') || "View Challenges"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMessageUser({
                        uid: community.id,
                        username: community.name,
                        type: 'community'
                      });
                      setShowMessaging(true);
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    {t?.('message') || "Message"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {activeCommunity && (
        <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5" /> {t?.('community_members') || "Community Members"} - {activeCommunity.name}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers
              .filter(u => activeCommunity.studentIds.includes(u.uid) || u.uid === activeCommunity.teacherId)
              .map((member, idx) => (
                <div
                  key={member.uid}
                  className={`p-4 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ 
                        backgroundColor: member.uid === activeCommunity.teacherId 
                          ? '#9D4EDD' 
                          : `hsl(${idx * 60}, 70%, 60%)` 
                      }}
                    >
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">
                        {member.username}
                        {member.uid === activeCommunity.teacherId && (
                          <span className="ml-2 px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-500">
                            {t?.('teacher') || "Teacher"}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {member.role}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMessageUser(member);
                        setShowMessaging(true);
                      }}
                      className={`ml-auto p-2 rounded-lg ${
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
      )}
    </div>
  );

  const renderChallengesView = () => (
    <div className="space-y-6">
      {loadingSolutions && (
        <div className={`rounded-2xl p-4 border backdrop-blur-xl ${currentTheme.card} mb-4`}>
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500"></div>
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {t?.('loading_solutions') || "Loading your solutions..."}
            </span>
          </div>
        </div>
      )}
      
      <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" /> {t?.('active_challenges') || "Active Challenges"} ({challenges.length})
        </h3>
        
        {challenges.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold mb-2">
              {t?.('no_challenges_yet') || "No challenges yet"}
            </h4>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t?.('no_challenges_description') || "No active challenges for your communities."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const creatorCommunity = communities.find(c => c.id === challenge.creatorCommunityId);
              
              const challengeSolution = challengeSolutions?.find((s: ChallengeSolution) => 
                s.challengeId === challenge.id && s.studentId === user?.uid
              );
              
              const hasJoined = !!challengeSolution;
              
              const studentGrade = challengeSolution && challengeSolution.score !== undefined ? {
                score: challengeSolution.score * 10,
                feedback: challengeSolution.feedback,
                gradedAt: challengeSolution.evaluatedAt || challengeSolution.updatedAt,
                evaluatedBy: challengeSolution.evaluatedBy,
                evaluatedByName: challengeSolution.evaluatedByName,
                status: challengeSolution.status
              } : null;
              
              const hasGrade = studentGrade && studentGrade.score !== undefined && studentGrade.score !== null;

              return (
                <motion.div
                  key={challenge.id}
                  id={`challenge-${challenge.id}`}
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  } ${hasGrade ? 'ring-2 ring-offset-2 ring-green-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        challenge.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                        challenge.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">{challenge.title}</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {challenge.category}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      challenge.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                      challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {challenge.description}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <GroupIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('from') || "From"}: {creatorCommunity?.name || t?.('unknown') || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('due') || "Due"}: {challenge.dueDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('points') || "Points"}: {challenge.points}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('participants') || "Participants"}: {challenge.submissions?.length || 0}
                      </span>
                    </div>
                    
                    {challengeSolution && (
                      <div className="flex items-center gap-2 text-sm">
                        {challengeSolution.status === 'evaluated' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {t?.('solution_status') || "Status"}: {
                            challengeSolution.status === 'evaluated' 
                              ? (t?.('evaluated') || "Evaluated") 
                              : (t?.('pending_evaluation') || "Pending Evaluation")
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {hasGrade && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium text-sm">{t?.('your_grade') || "Your Grade"}:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${
                            studentGrade.score >= 80 ? 'text-green-500' :
                            studentGrade.score >= 60 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {studentGrade.score}%
                          </span>
                          {studentGrade.feedback && (
                            <button
                              onClick={() => {
                                alert(`${t?.('feedback') || "Feedback"}: ${studentGrade.feedback}`);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs ${
                                theme === 'dark' 
                                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                              }`}
                            >
                              {t?.('view_feedback') || "Feedback"}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className={`h-1.5 rounded-full overflow-hidden ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <div
                            className={`h-full rounded-full ${
                              studentGrade.score >= 80 ? 'bg-green-500' :
                              studentGrade.score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${studentGrade.score}%` }}
                          />
                        </div>
                      </div>
                      
                      {studentGrade.evaluatedByName && (
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {t?.('evaluated_by') || "Evaluated by"}: {studentGrade.evaluatedByName}
                        </p>
                      )}
                      
                      {studentGrade.gradedAt && (
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {t?.('graded_on') || "Graded on"}: {
                            studentGrade.gradedAt?.toDate 
                              ? new Date(studentGrade.gradedAt.toDate()).toLocaleDateString()
                              : new Date(studentGrade.gradedAt).toLocaleDateString()
                          }
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    {hasJoined ? (
                      <>
                        <span className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                          theme === 'dark' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          {t?.('joined') || "Joined"}
                        </span>
                        <button
                          onClick={() => {
                            setIsChallengeMode(true);
                            setSelectedChallengeId(challenge.id);
                            setSelectedTab("upload");
                            
                            const codeToSet = challengeSolution?.solutionCode || generateChallengeTemplate(challenge);
                            setCode(codeToSet);
                            
                            setCodeMetadata({
                              domain: challenge.category,
                              type: t?.('challenge_solution') || "Challenge Solution",
                              studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
                              dataArea: challenge.category,
                              assignmentId: challenge.id,
                              assignmentTitle: `${t?.('challenge') || "Challenge"}: ${challenge.title}`
                            });
                          }}
                          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm"
                        >
                          <Code className="w-4 h-4 inline mr-1" />
                          {hasGrade ? t?.('view_solution') || "View Solution" : t?.('solve_now') || "Solve Now"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm"
                      >
                        {t?.('join_challenge') || "Join Challenge"}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={topRef} className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-20 md:pt-24`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-400" />
              </div>
              <span>{t?.('student_dashboard') || "Student Dashboard"}</span>
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t?.('welcome_back') || "Welcome back"}, {userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student"}!
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {Object.values(loadingData).some(v => v) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                {t?.('loading') || "Loading"}...
              </div>
            )}

            {/* Бутон за съобщения с dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMessages(!showMessages)}
                className={`relative p-2 rounded-lg transition-all ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5' 
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-200'
                }`}
              >
                <MessageCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
                {messages.filter(m => !m.read && m.type === 'direct' && m.receiverId === user?.uid).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {messages.filter(m => !m.read && m.type === 'direct' && m.receiverId === user?.uid).length}
                  </span>
                )}
              </button>

              {/* Dropdown за съобщения */}
              {showMessages && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`absolute right-0 top-12 w-80 rounded-xl shadow-xl z-50 ${
                    theme === 'dark' 
                      ? 'bg-gray-900 border border-gray-700 shadow-gray-900/50' 
                      : 'bg-white border border-gray-200 shadow-gray-200/50'
                  }`}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  <div className={`p-4 border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <MessageCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                        <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t?.('messages') || "Messages"}
                        </h3>
                        {messages.filter(m => !m.read && m.type === 'direct' && m.receiverId === user?.uid).length > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {messages.filter(m => !m.read && m.type === 'direct' && m.receiverId === user?.uid).length} {t?.('new') || "new"}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {messages.filter(m => !m.read && m.type === 'direct' && m.receiverId === user?.uid).length > 0 && (
                          <button
                            onClick={markAllMessagesAsRead}
                            className={`p-1.5 rounded-lg text-sm ${
                              theme === 'dark' 
                                ? 'hover:bg-white/10 text-blue-400' 
                                : 'hover:bg-gray-100 text-blue-600'
                            } transition-colors`}
                            title={t?.('mark_all_as_read') || "Mark all as read"}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowMessages(false)}
                          className={`p-1.5 rounded-lg ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 text-gray-400' 
                              : 'hover:bg-gray-100 text-gray-600'
                          } transition-colors`}
                          title={t?.('close') || "Close"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {messages.length === 0 ? (
                      <div className={`p-6 text-center ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="mb-2">{t?.('no_messages') || "No messages"}</p>
                        <p className="text-sm opacity-70">{t?.('new_messages_will_appear_here') || "New messages will appear here"}</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {messages.slice(0, 5).map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`relative group p-4 cursor-pointer ${
                              theme === 'dark' 
                                ? 'hover:bg-gray-800/50' 
                                : 'hover:bg-gray-50'
                            } ${
                              !message.read && message.receiverId === user?.uid
                                ? theme === 'dark' 
                                  ? 'bg-blue-900/10' 
                                  : 'bg-blue-50/70'
                                : ''
                            }`}
                            onClick={() => {
                              if (!message.read && message.receiverId === user?.uid) {
                                const messageRef = doc(db, 'messages', message.id);
                                updateDoc(messageRef, { read: true });
                                setMessages(prev => prev.map(m => 
                                  m.id === message.id ? { ...m, read: true } : m
                                ));
                              }
                              setSelectedTab("messages");
                              setShowMessages(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                    message.senderId === user?.uid
                                      ? theme === 'dark' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-green-100 text-green-600'
                                      : theme === 'dark' 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'bg-blue-100 text-blue-600'
                                  }`}
                                >
                                  {message.senderName.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex justify-between items-start mb-1">
                                  <div className={`font-medium truncate ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {message.senderId === user?.uid 
                                      ? t?.('you') || "You"
                                      : message.senderName}
                                    {!message.read && message.receiverId === user?.uid && (
                                      <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    )}
                                  </div>
                                  <div className={`text-xs ${
                                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                  }`}>
                                    {message.timestamp?.toDate
                                      ? new Date(message.timestamp.toDate()).toLocaleTimeString([], { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })
                                      : t?.('recently') || "Now"}
                                  </div>
                                </div>
                                
                                <p className={`text-sm mb-1 line-clamp-2 ${
                                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {message.content}
                                </p>
                                
                                {message.type === 'community' && (
                                  <div className={`text-xs flex items-center gap-1 ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    <GroupIcon className="w-3 h-3" />
                                    <span>{t?.('community') || "Community"}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMessage(message.id);
                              }}
                              className={`absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                                theme === 'dark' 
                                  ? 'hover:bg-red-500/30 bg-red-500/20 text-red-400' 
                                  : 'hover:bg-red-100 bg-red-50 text-red-500'
                              }`}
                              title={t?.('delete_message') || "Delete message"}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            <div className={`border-b ${
                              theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                            }`} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                  
                  {messages.length > 0 && (
                    <div className={`p-3 border-t ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => {
                            setSelectedTab("messages");
                            setShowMessages(false);
                          }}
                          className={`text-sm flex items-center gap-1.5 ${
                            theme === 'dark' 
                              ? 'text-blue-400 hover:text-blue-300' 
                              : 'text-blue-600 hover:text-blue-700'
                          } transition-colors`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t?.('view_all') || "View all"}
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm(t?.('delete_all_messages_confirm') || 'Are you sure you want to delete all messages?')) {
                              handleDeleteAllMessages();
                            }
                          }}
                          className={`text-sm flex items-center gap-1.5 ${
                            theme === 'dark' 
                              ? 'text-red-400 hover:text-red-300' 
                              : 'text-red-600 hover:text-red-700'
                          } transition-colors`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t?.('delete_all') || "Delete all"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Бутон за нотификации */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-all ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5' 
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow-lg hover:shadow-gray-200'
                }`}
              >
                <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Dropdown за нотификации */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`absolute right-0 top-12 w-80 rounded-xl shadow-xl z-50 ${
                    theme === 'dark' 
                      ? 'bg-gray-900 border border-gray-700 shadow-gray-900/50' 
                      : 'bg-white border border-gray-200 shadow-gray-200/50'
                  }`}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  <div className={`p-4 border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                        <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {t?.('notifications') || "Notifications"}
                        </h3>
                        {unreadNotifications > 0 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            theme === 'dark' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {unreadNotifications} {t?.('new') || "new"}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {unreadNotifications > 0 && (
                          <button
                            onClick={markAllNotificationsAsRead}
                            className={`p-1.5 rounded-lg text-sm ${
                              theme === 'dark' 
                                ? 'hover:bg-white/10 text-blue-400' 
                                : 'hover:bg-gray-100 text-blue-600'
                            } transition-colors`}
                            title={t?.('mark_all_as_read') || "Mark all as read"}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className={`p-1.5 rounded-lg ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 text-gray-400' 
                              : 'hover:bg-gray-100 text-gray-600'
                          } transition-colors`}
                          title={t?.('close') || "Close"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    {notifications.length === 0 ? (
                      <div className={`p-6 text-center ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="mb-2">{t?.('no_notifications') || "No notifications"}</p>
                        <p className="text-sm opacity-70">{t?.('new_notifications_will_appear_here') || "New notifications will appear here"}</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {notifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`relative group ${
                              theme === 'dark' 
                                ? 'hover:bg-gray-800/50' 
                                : 'hover:bg-gray-50'
                            } ${
                              !notification.read
                                ? theme === 'dark' 
                                  ? 'bg-blue-900/10' 
                                  : 'bg-blue-50/70'
                                : ''
                            }`}
                          >
                            <div
                              className="p-4 cursor-pointer"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                    notification.type === 'grade'
                                      ? theme === 'dark' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-green-100 text-green-600'
                                      : notification.type === 'assignment'
                                      ? theme === 'dark' 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'bg-blue-100 text-blue-600'
                                      : notification.type === 'challenge'
                                      ? theme === 'dark' 
                                        ? 'bg-purple-500/20 text-purple-400' 
                                        : 'bg-purple-100 text-purple-600'
                                      : notification.type === 'direct'
                                      ? theme === 'dark' 
                                        ? 'bg-yellow-500/20 text-yellow-400' 
                                        : 'bg-yellow-100 text-yellow-600'
                                      : theme === 'dark' 
                                        ? 'bg-gray-500/20 text-gray-400' 
                                        : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {notification.type === 'grade' ? (
                                      <Award className="w-4 h-4" />
                                    ) : notification.type === 'assignment' ? (
                                      <FileText className="w-4 h-4" />
                                    ) : notification.type === 'challenge' ? (
                                      <Target className="w-4 h-4" />
                                    ) : notification.type === 'direct' ? (
                                      <MessageCircle className="w-4 h-4" />
                                    ) : (
                                      <Bell className="w-4 h-4" />
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0 pr-6">
                                  <div className="flex justify-between items-start mb-1">
                                    <div className={`font-medium truncate ${
                                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {notification.title}
                                      {!notification.read && (
                                        <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                      )}
                                    </div>
                                    <div className={`text-xs ${
                                      theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                    }`}>
                                      {notification.timestamp?.toDate
                                        ? new Date(notification.timestamp.toDate()).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })
                                        : t?.('recently') || "Now"}
                                    </div>
                                  </div>
                                  
                                  <p className={`text-sm mb-1 line-clamp-2 ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                  }`}>
                                    {notification.message}
                                  </p>
                                  
                                  <div className={`text-xs flex items-center gap-2 ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    <span>
                                      {notification.timestamp?.toDate
                                        ? new Date(notification.timestamp.toDate()).toLocaleDateString()
                                        : t?.('today') || "Today"}
                                    </span>
                                    {notification.details?.points && (
                                      <span className={`px-1.5 py-0.5 rounded ${
                                        theme === 'dark' 
                                          ? 'bg-green-500/20 text-green-400' 
                                          : 'bg-green-100 text-green-600'
                                      } text-xs`}>
                                        {notification.details.points}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className={`absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                                theme === 'dark' 
                                  ? 'hover:bg-red-500/30 bg-red-500/20 text-red-400' 
                                  : 'hover:bg-red-100 bg-red-50 text-red-500'
                              }`}
                              title={t?.('delete_notification') || "Delete notification"}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            <div className={`border-b ${
                              theme === 'dark' ? 'border-gray-800' : 'border-gray-100'
                            }`} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className={`p-3 border-t ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => {
                            if (window.confirm(t?.('delete_all_notifications_confirm') || 'Are you sure you want to delete all notifications?')) {
                              handleDeleteAllNotifications();
                            }
                          }}
                          className={`text-sm flex items-center gap-1.5 ${
                            theme === 'dark' 
                              ? 'text-red-400 hover:text-red-300' 
                              : 'text-red-600 hover:text-red-700'
                          } transition-colors`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t?.('delete_all') || "Delete all"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {getNavItems().map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  selectedTab === item.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    selectedTab === item.id
                      ? 'bg-white/20 text-white'
                      : theme === 'dark'
                      ? 'bg-white/10'
                      : 'bg-gray-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {selectedTab === "messages" && (
          <StudentMessages />
        )}
        
        {selectedTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color}/20 flex items-center justify-center`}>
                      {stat.icon}
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-lg ${
                      stat.change.includes('completed') || stat.change.includes('members') || stat.change.includes('accepted')
                        ? 'bg-green-500/20 text-green-500'
                        : stat.change.includes('Requires')
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold">{t?.('todays_tasks') || "Today's Tasks"}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedTab("assignments")}
                      className={`px-4 py-2 rounded-lg ${
                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {t?.('view_all') || "View All"} <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {todaysTasks.slice(0, 3).map((task, taskIndex) => (
                      <div
                        key={`todays-task-${task.id}-${taskIndex}`}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-green-500/20 text-green-500'
                        }`}>
                          {task.subjectIcon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{task.title}</h4>
                            {task.completed ? (
                              <div className="flex items-center gap-2">
                                {task.evaluation?.score && (
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    task.evaluation.score >= 80 ? 'bg-green-500/20 text-green-500' :
                                    task.evaluation.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-red-500/20 text-red-500'
                                  }`}>
                                    {task.evaluation.score}%
                                  </span>
                                )}
                                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">
                                  {t?.('completed') || "Completed"}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-500">
                                {t?.('pending') || "Pending"}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {task.description.substring(0, 60)}...
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {task.dueTime}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {task.estimatedTime}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${
                              task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-green-500/20 text-green-500'
                            }`}>
                              {task.priorityIcon} {task.priority}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => openTaskDetails(task.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white`}
                        >
                          {t?.('view_details') || "View Details"}
                        </button>
                      </div>
                    ))}
                    
                    {todaysTasks.length === 0 && (
                      <div className="text-center py-8">
                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {t?.('no_tasks_today') || "No tasks for today"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold">{t?.('recent_activity') || "Recent Activity"}</h3>
                  </div>

                  <div className="space-y-4">
                    {(showAllActivities ? activityLogs : activityLogs.slice(0, 3)).map((log, _index) => (
                      <div
                        key={log.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          log.status === 'submitted' ? 'bg-green-500/20 text-green-500' :
                          log.status === 'started' ? 'bg-blue-500/20 text-blue-500' :
                          log.status === 'completed' ? 'bg-purple-500/20 text-purple-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {log.status === 'submitted' ? '📤' :
                           log.status === 'started' ? '🚀' :
                           log.status === 'completed' ? '✅' : '📝'}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{log.action}</h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {log.details}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {log.file ? `${t?.('file') || "File"}: ${log.file}` : ''}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {log.timestamp?.toDate ? 
                                new Date(log.timestamp.toDate()).toLocaleTimeString() : 
                                t?.('recently') || 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {activityLogs.length > 3 && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => setShowAllActivities(!showAllActivities)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                            theme === 'dark' 
                              ? 'bg-white/5 hover:bg-white/10 text-blue-400' 
                              : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
                          } transition-colors`}
                        >
                          {showAllActivities ? t?.('show_less') || "Show Less" : t?.('view_all') || "View All"} 
                          <ChevronRight className={`w-4 h-4 transition-transform ${showAllActivities ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    )}
                    
                    {activityLogs.length === 0 && (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {t?.('no_recent_activity') || "No recent activity"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Brain className="w-5 h-5" /> {t?.('recommendations') || "Recommendations"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.map((rec) => (
                    <motion.div
                      key={rec.id}
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-xl p-4 relative overflow-hidden group cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-gray-50 border border-gray-200'
                      } ${activeRecommendation === rec.id ? 'ring-2 ring-green-500/50' : ''}`}
                      onClick={() => setActiveRecommendation(rec.id === activeRecommendation ? null : rec.id)}
                    >
                      <div className="relative z-10">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${rec.color}/20 flex items-center justify-center`}>
                            {rec.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{rec.title}</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              {rec.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r ${rec.color} text-white`}
                          >
                            {rec.action}
                          </button>
                          <Sparkles className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedTab === "communities" && renderCommunitiesView()}
        {selectedTab === "challenges" && renderChallengesView()}

        {selectedTab === "courses" && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t?.('my_courses') || "My Courses"}</h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t?.('continue_learning') || "Continue your learning journey"}</p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {t?.('browse_courses') || "Browse Courses"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  className={`rounded-2xl p-6 border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  } backdrop-blur-xl`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${course.color}20`, color: course.color }}
                    >
                      {course.icon}
                    </div>
                    <div>
                      <h3 className="font-bold">{course.title}</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {course.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t?.('progress') || "Progress"}</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: course.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}>
                      {t?.('view_course') || "View Course"}
                    </button>
                    <button className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    } transition-colors`}>
                      {t?.('continue') || "Continue"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === "mySolutions" && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5" /> {t?.('my_challenge_solutions') || "My Challenge Solutions"}
              </h3>
              
              {challenges.filter(c => 
                c.submissions?.some(s => s.studentId === user?.uid)
              ).length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold mb-2">
                    {t?.('no_solutions_yet') || "No solutions yet"}
                  </h4>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('join_challenges_to_solve') || "Join challenges to start solving!"}
                  </p>
                  <button
                    onClick={() => setSelectedTab("challenges")}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                  >
                    {t?.('browse_challenges') || "Browse Challenges"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {challenges
                    .filter(c => c.submissions?.some(s => s.studentId === user?.uid))
                    .map(challenge => {
                      const submission = challenge.submissions?.find(s => s.studentId === user?.uid);
                      
                      return (
                        <div key={challenge.id} className={`p-6 rounded-xl border ${
                          theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                        }`}>
                          <h4 className="font-bold mb-2">{challenge.title}</h4>
                          <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {challenge.description.substring(0, 100)}...
                          </p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                                {t?.('status') || "Status"}:
                              </span>
                              <span className={`font-medium ${
                                submission?.status === 'submitted' ? 'text-green-500' :
                                submission?.status === 'joined' ? 'text-blue-500' : 'text-gray-500'
                              }`}>
                                {submission?.status || 'joined'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                                {t?.('points') || "Points"}:
                              </span>
                              <span className="font-medium">{challenge.points}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedTab("upload");
                              setSelectedChallengeId(challenge.id);
                              setIsChallengeMode(true);
                            }}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm"
                          >
                            {submission?.status === 'submitted' 
                              ? t?.('view_solution') || "View Solution" 
                              : t?.('continue_solving') || "Continue Solving"}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "assignments" && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t?.('all_assignments') || "All Assignments"}</h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {assignments.length} {t?.('assignments_found') || "assignments found"}
                </p>
              </div>
              <div className="flex gap-2">
                <select className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}>
                  <option>{t?.('all_status') || "All Status"}</option>
                  <option>{t?.('pending') || "Pending"}</option>
                  <option>{t?.('completed') || "Completed"}</option>
                </select>
                <select className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}>
                  <option>{t?.('all_difficulty') || "All Difficulty"}</option>
                  <option>{t?.('easy') || "Easy"}</option>
                  <option>{t?.('medium') || "Medium"}</option>
                  <option>{t?.('hard') || "Hard"}</option>
                </select>
              </div>
            </div>

            {loadingAssignments ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : assignments.length === 0 ? (
              <div className={`rounded-2xl p-12 border text-center ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t?.('no_assignments_yet') || "No assignments yet"}</h3>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('check_back_later') || "Check back later for new assignments"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {assignments.map((assignment, assignmentIndex) => {
                  const isCompleted = assignment.studentProgress?.completed || false;
                  const evaluation = assignment.studentProgress?.grade;
                  
                  return (
                    <motion.div
                      key={`assignment-${assignment.id}-${assignmentIndex}`}
                      whileHover={{ scale: 1.02, translateY: -5 }}
                      className={`rounded-2xl p-6 border ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                          : 'bg-white border-gray-200'
                      } backdrop-blur-xl`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            assignment.category === 'Design' ? 'bg-pink-500/20 text-pink-500' :
                            assignment.category === 'Programming' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {assignment.category === 'Design' ? '🎨' :
                             assignment.category === 'Programming' ? '💻' :
                             assignment.category === 'Algorithms' ? '🧠' :
                             assignment.category === 'Data Science' ? '📊' : '🤖'}
                          </div>
                          <div>
                            <h3 className="font-bold">{assignment.title}</h3>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {assignment.category}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          assignment.difficulty === 'easy' ? 'bg-green-500/20 text-green-500' :
                          assignment.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {assignment.difficulty}
                        </span>
                      </div>

                      <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {assignment.description}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            {t?.('due') || "Due"}: {assignment.dueDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            {t?.('difficulty') || "Difficulty"}: {assignment.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Award className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            {t?.('points') || "Points"}: {assignment.points}
                          </span>
                        </div>
                        {evaluation?.score && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-500' : 'text-green-600'}`} />
                            <span className={`font-medium ${
                              evaluation.score >= 80 ? 'text-green-500' :
                              evaluation.score >= 60 ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {t?.('grade') || "Grade"}: {evaluation.score}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
  {isCompleted ? (
    <button
      onClick={() => {
        const submission = submissions.find(sub => sub.assignmentId === assignment.id);
        if (submission) {
          handleShowGrade(submission);
        } else {
          const fakeSubmission: Submission = {
            id: `assignment_${assignment.id}`,
            name: assignment.title,
            date: new Date().toLocaleString(),
            status: "completed",
            assignmentId: assignment.id,
            assignmentTitle: assignment.title
          };
          handleShowGrade(fakeSubmission);
        }
      }}
      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
        theme === 'dark' 
          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
          : 'bg-green-100 hover:bg-green-200 text-green-600'
      }`}
    >
      <CheckCircle className="w-4 h-4" /> 
      {assignment.studentProgress?.grade?.score ? 
        `${t?.('view_grade') || 'View Grade'} (${assignment.studentProgress.grade.score}%)` : 
        t?.('completed') || "Completed"}
    </button>
  ) : (
    <button
      onClick={() => openTaskDetails(assignment.id)}
      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2"
    >
      <Play className="w-4 h-4" /> {t?.('start') || "Start"}
    </button>
  )}
</div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedTab === "progress" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{t?.('learning_progress') || "Learning Progress"}</h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t?.('track_achievements') || "Track your achievements and growth"}
                </p>
              </div>
              <div className="flex gap-2">
                <button className={`px-4 py-2 rounded-lg ${
                  theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  {t?.('week') || "Week"}
                </button>
                <button className={`px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white`}>
                  {t?.('month') || "Month"}
                </button>
                <button className={`px-4 py-2 rounded-lg ${
                  theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                }`}>
                  {t?.('year') || "Year"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: t?.('completion_rate') || "Completion Rate", value: `${stats.averageScore}%`, icon: <TrendingUp className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
                { label: t?.('total_submissions') || "Total Submissions", value: stats.totalSubmissions, icon: <UploadCloud className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
                { label: t?.('success_rate') || "Success Rate", value: `${stats.successRate}%`, icon: <CheckCircle className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
                { label: t?.('communities') || "Communities", value: communities.length, icon: <GroupIcon className="w-6 h-6" />, color: "from-amber-500 to-orange-500" },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`rounded-2xl p-6 border backdrop-blur-xl ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color}/20 flex items-center justify-center`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-2xl p-6 border backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}
              >
                <h3 className="text-lg font-bold mb-6">{t?.('assignment_progress') || "Assignment Progress"}</h3>
                <div className="space-y-4">
                  {assignments.slice(0, 4).map((assignment, idx) => {
                    const progress = assignment.studentProgress?.completed ? 100 : 0;
                    const colors = ["#9D4EDD", "#FF6B8B", "#36D1DC", "#FFD166"];
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                            {assignment.title}
                          </span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                        }`}>
                          <motion.div
                            className={`h-full rounded-full`}
                            style={{ backgroundColor: colors[idx % colors.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3 + idx * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-2xl p-6 border backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}
              >
                <h3 className="text-lg font-bold mb-6">{t?.('recent_activity') || "Recent Activity"}</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {submissions.slice(0, 5).map((sub, idx) => {
                    const Icon = sub.status === "success" ? CheckCircle : AlertCircle;
                    const color = sub.status === "success" ? "text-green-500" : "text-red-500";
                    
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          sub.status === "success" ? "bg-green-500/20" : "bg-red-500/20"
                        }`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            {t?.('uploaded') || "Uploaded"}: <span className="font-medium">{sub.name}</span>
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            {sub.date}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          sub.status === "success" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        }`}>
                          {getStatusText(sub.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {selectedTab === "upload" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t?.('upload_prolog_code') || "Upload Prolog Code"}</h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {isChallengeMode 
                    ? t?.('submit_challenge_solution') || "Submit your challenge solution"
                    : t?.('submit_assignments_projects') || "Submit your assignments and projects"}
                </p>
              </div>
              
              {isChallengeMode && (
                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center gap-2`}>
                  <Target className="w-4 h-4" />
                  {t?.('challenge_mode') || "Challenge Mode"}
                </div>
              )}
            </div>

            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> 
                {isChallengeMode 
                  ? t?.('current_challenge') || "Current Challenge"
                  : t?.('select_assignment') || "Select Assignment"}
              </h3>
              
              {isChallengeMode ? (
                <div className="space-y-4">
                  {selectedChallengeId ? (
                    <>
                      <div className={`p-4 rounded-lg ${
                        theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-100 border border-blue-200'
                      }`}>
                        <div className="font-medium flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          {(() => {
                            const challenge = challenges.find(c => c.id === selectedChallengeId);
                            return challenge?.title || codeMetadata.assignmentTitle || t?.('active_challenge') || "Active Challenge";
                          })()}
                        </div>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t?.('challenge_id') || "Challenge ID"}: {selectedChallengeId}
                        </p>
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t?.('challenge_mode_active') || "You are in challenge mode. Your solution will be submitted as a challenge solution."}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const challenge = challenges.find(c => c.id === selectedChallengeId);
                            if (challenge) {
                              alert(`${t?.('challenge') || "Challenge"}: ${challenge.title}\n\n${t?.('description') || "Description"}: ${challenge.description}\n\n${t?.('points') || "Points"}: ${challenge.points}\n\n${t?.('due') || "Due"}: ${challenge.dueDate}`);
                            } else {
                              alert(`${t?.('challenge_id') || "Challenge ID"}: ${selectedChallengeId}\n\n${t?.('challenge_not_loaded') || "This challenge is not loaded in your current session. Please refresh the page."}`);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-white/5 hover:bg-white/10' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {t?.('view_details') || "View Details"}
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsChallengeMode(false);
                            setSelectedChallengeId("");
                            setCode("");
                            setCodeMetadata({
                              domain: "",
                              type: "Symbolic AI / Expert System",
                              studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
                              dataArea: "",
                              assignmentId: "",
                              assignmentTitle: ""
                            });
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                              : 'bg-red-100 hover:bg-red-200 text-red-600'
                          }`}
                        >
                          {t?.('exit_challenge_mode') || "Exit Challenge Mode"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-100 border border-amber-200'
                    }`}>
                      <div className="font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        {t?.('no_challenge_selected') || "No challenge selected!"}
                      </div>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t?.('select_challenge_first_desc') || "You are in challenge mode but no challenge is selected. Please:"}
                      </p>
                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => setSelectedTab("challenges")}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm"
                        >
                          {t?.('go_to_challenges') || "Go to Challenges"}
                        </button>
                        <button
                          onClick={() => setIsChallengeMode(false)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-white/5 hover:bg-white/10' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {t?.('switch_to_assignments') || "Switch to Assignments"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <select
                    className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    value={selectedAssignment}
                    onChange={(e) => {
                      const assignmentId = e.target.value;
                      setSelectedAssignment(assignmentId);
                      setIsChallengeMode(false);
                      const assignment = assignments.find(a => a.id === assignmentId);
                      if (assignment) {
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
                  >
                    <option value="">-- {t?.('choose_assignment') || "Choose an assignment"} --</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title} ({assignment.difficulty})
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => {
                      setIsChallengeMode(true);
                      setSelectedChallengeId("");
                      setSelectedTab("challenges");
                    }}
                    className={`px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                      theme === 'dark' 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    {t?.('switch_to_challenges') || "Work on Challenges"}
                  </button>
                </div>
              )}
            </div>

            {selectedAssignment && !isChallengeMode && (
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> {t?.('assignment_info') || "Assignment Information"}
                </h3>
                
                {(() => {
                  const assignment = assignments.find(a => a.id === selectedAssignment);
                  if (!assignment) return null;
                  
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t?.('title') || "Title"}
                          </div>
                          <div className="font-medium">{assignment.title}</div>
                        </div>
                        <div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t?.('objective') || "Objective"}
                          </div>
                          <div className="font-medium">{assignment.objective}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t?.('requirements') || "Requirements"}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <div className={`px-3 py-2 rounded-lg ${
                            theme === 'dark' ? 'bg-green-500/10' : 'bg-green-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4" />
                              <span>{assignment.requirements.minFacts} {t?.('facts') || "facts"}</span>
                            </div>
                          </div>
                          <div className={`px-3 py-2 rounded-lg ${
                            theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Cpu className="w-4 h-4" />
                              <span>{assignment.requirements.minRules} {t?.('rules') || "rules"}</span>
                            </div>
                          </div>
                          <div className={`px-3 py-2 rounded-lg ${
                            theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              <FileCode className="w-4 h-4" />
                              <span>{assignment.requirements.minMenuItems} {t?.('menu_items') || "menu items"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t?.('due_date') || "Due Date"}
                          </div>
                          <div className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t?.('difficulty') || "Difficulty"}
                          </div>
                          <div className="font-medium capitalize">{assignment.difficulty}</div>
                        </div>
                        <div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t?.('points') || "Points"}
                          </div>
                          <div className="font-medium">{assignment.points}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" /> {t?.('file_information') || "File Information"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Globe className="w-4 h-4 inline mr-1" /> {t?.('domain') || "Domain"}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., Insects, Animals"
                    value={codeMetadata.domain}
                    onChange={(e) => setCodeMetadata({...codeMetadata, domain: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Cpu className="w-4 h-4 inline mr-1" /> {t?.('type') || "Type"}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Symbolic AI / Expert System"
                    value={codeMetadata.type}
                    onChange={(e) => setCodeMetadata({...codeMetadata, type: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <User className="w-4 h-4 inline mr-1" /> {t?.('student_name') || "Student Name"}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder={t?.('your_name') || "Your name"}
                    value={codeMetadata.studentName}
                    onChange={(e) => setCodeMetadata({...codeMetadata, studentName: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Database className="w-4 h-4 inline mr-1" /> {t?.('data_area') || "Data Area"}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., Biology, Geography"
                    value={codeMetadata.dataArea}
                    onChange={(e) => setCodeMetadata({...codeMetadata, dataArea: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border p-6 backdrop-blur-xl ${currentTheme.card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Code className="w-5 h-5" /> {t?.('code_editor') || "Code Editor"}
                </h3>
                <div className="flex gap-2">
                  <button
  className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
    theme === 'dark' 
      ? 'bg-white/5 hover:bg-white/10' 
      : 'bg-gray-100 hover:bg-gray-200'
  }`}
  onClick={() => {
    if (code.trim()) {
      navigator.clipboard.writeText(code);
      alert(t?.('code_copied') || "Code copied to clipboard!");
    } else {
      alert(t?.('no_code_to_copy') || "No code to copy!");
    }
  }}
>
  <Copy className="w-3 h-3" /> {t?.('copy_code') || "Copy Code"}
</button>
                  <button
                    className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      const header = generateHeader();
                      setCode(header + "\n\n" + (code.split('\n').slice(7).join('\n') || ""));
                    }}
                  >
                    <RefreshCw className="w-3 h-3" /> {t?.('update_header') || "Update Header"}
                  </button>
                </div>
              </div>
              
              <textarea
                className={`w-full h-96 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border border-gray-300'
                }`}
                placeholder={`% ${t?.('write_prolog_code') || "Write your Prolog code here..."}\n% ${t?.('example') || "Example"}:\n% student(john, math).\n% teaches(prof_smith, math).`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={handleUpload}
                  disabled={!code.trim() || (!isChallengeMode && !selectedAssignment && !codeMetadata.assignmentId) || (isChallengeMode && !selectedChallengeId)}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  {isChallengeMode 
                    ? t?.('submit_solution') || "Submit Solution" 
                    : t?.('submit_code') || "Submit Code"}
                </button>
                <button
                  onClick={() => setCode("")}
                  className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                  {t?.('clear') || "Clear"}
                </button>
              </div>
            </div>

            {uploadStatus && (
              <div className={`rounded-xl p-4 ${
                uploadStatus.includes('✅') 
                  ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                  : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
              }`}>
                <div className="flex justify-between items-center">
                  <span>{uploadStatus}</span>
                  <button onClick={() => setUploadStatus('')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === "grades" && (
          <div className="mb-8">
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Award className="w-6 h-6" />
                    {t?.('my_grades') || "My Grades"}
                  </h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {studentGrades.length} {t?.('grades_received') || "grades received"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await loadStudentGrades();
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t?.('refresh_grades') || "Refresh Grades"}
                  </button>
                  <button
                    onClick={() => setShowGradesModal(true)}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      theme === 'dark' 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    {t?.('detailed_view') || "Detailed View"}
                  </button>
                </div>
              </div>
              
              {loadingGrades ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : studentGrades.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {t?.('no_grades_yet') || "No grades yet"}
                  </h3>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('complete_assignments_to_get_grades') || "Complete assignments to receive grades"}
                  </p>
                  <button
                    onClick={() => setSelectedTab("assignments")}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                  >
                    {t?.('view_assignments') || "View Assignments"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className={`p-4 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-2xl font-bold mb-1">
                        {studentGrades.length}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t?.('total_grades') || "Total Grades"}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-2xl font-bold mb-1">
                        {(studentGrades.reduce((sum, grade) => sum + grade.points, 0) / studentGrades.length).toFixed(1)}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t?.('average_grade') || "Average Grade"}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${
                      theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-2xl font-bold mb-1">
                        {studentGrades.filter(g => g.points >= 7).length}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t?.('excellent_grades') || "Excellent Grades (≥7)"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {studentGrades.map((grade) => (
                      <div key={grade.id} className={`p-4 rounded-xl border ${
                        theme === 'dark' 
                          ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700' 
                          : 'bg-white border-gray-200'
                      } hover:shadow-md transition-shadow`}>
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-bold">{grade.assignmentTitle}</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {grade.gradedBy} • {grade.gradedAt?.toDate 
                                ? new Date(grade.gradedAt.toDate()).toLocaleDateString()
                                : t?.('recently') || "Recently"}
                            </p>
                            {grade.feedback && (
                              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {grade.feedback.length > 80 
                                  ? `${grade.feedback.substring(0, 80)}...` 
                                  : grade.feedback}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 text-center">
                            <div className={`text-3xl font-bold ${
                              grade.points >= 9 ? 'text-green-500' :
                              grade.points >= 7 ? 'text-yellow-500' :
                              grade.points >= 5 ? 'text-orange-500' :
                              'text-red-500'
                            }`}>
                              {grade.points}/{grade.maxPoints}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              grade.points >= 9 ? 'bg-green-500/20 text-green-500' :
                              grade.points >= 7 ? 'bg-yellow-500/20 text-yellow-500' :
                              grade.points >= 5 ? 'bg-orange-500/20 text-orange-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {grade.points >= 9 ? t?.('excellent') || 'Excellent' :
                               grade.points >= 7 ? t?.('good') || 'Good' :
                               grade.points >= 5 ? t?.('average') || 'Average' :
                               t?.('needs_improvement') || 'Needs Improvement'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "submissions" && (
          <div className="mb-8">
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {t?.('recent_submissions') || "Recent Submissions"} ({submissions.length})
                  </h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t?.('view_download_submissions') || "View and download your submissions"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTab("upload")}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t?.('new_submission') || "New Submission"}
                </button>
              </div>
              
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {t?.('no_submissions_yet') || "No submissions yet"}
                  </h3>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('make_first_submission') || "Make your first submission to get started"}
                  </p>
                  <button
                    onClick={() => setSelectedTab("upload")}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                  >
                    {t?.('upload_first_file') || "Upload Your First File"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => {
                    const assignment = assignments.find(a => a.id === sub.assignmentId);
                    
                    return (
                      <motion.div
                        key={sub.id}
                        whileHover={{ scale: 1.01, translateY: -2 }}
                        className={`rounded-2xl p-6 border ${
                          theme === 'dark'
                            ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                            : 'bg-white border-gray-200'
                        } backdrop-blur-xl`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold">{sub.name}</h4>
                              {assignment && (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                }`}>
                                  {assignment.title}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {sub.date}
                            </p>
                            <div className={`p-3 rounded-lg font-mono text-sm overflow-hidden ${
                              theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'
                            }`}>
                              <pre className="whitespace-pre-wrap break-words">
                                {sub.code?.substring(0, 200)}...
                              </pre>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                                sub.status === 'success' ? 'bg-green-500/20 text-green-500' :
                                sub.status === 'error' ? 'bg-red-500/20 text-red-500' :
                                'bg-amber-500/20 text-amber-500'
                              }`}>
                                {getStatusText(sub.status)}
                              </span>
                              
                              {sub.grade?.score && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                                  sub.grade.score >= 80 ? 'bg-green-500/20 text-green-500' :
                                  sub.grade.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                                  'bg-red-500/20 text-red-500'
                                }`}>
                                  {t?.('grade') || "Grade"}: {sub.grade.score}%
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                              <button
                                onClick={() => downloadCode(sub.code || '', sub.name)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                                  theme === 'dark' 
                                    ? 'bg-white/5 hover:bg-white/10' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                <DownloadIcon className="w-4 h-4" />
                                {t?.('download') || "Download"}
                              </button>
                              
                              {sub.grade && (
                                <button
                                  onClick={() => handleShowGrade(sub)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                                    theme === 'dark' 
                                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                                      : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                  }`}
                                >
                                  <Eye className="w-4 h-4" />
                                  {t?.('view_grade') || "View Grade"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showGradesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowGradesModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Award className="w-6 h-6" />
                      {t?.('my_grades') || "My Grades"}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {studentGrades.length} {t?.('grades_received') || "grades received"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowGradesModal(false)}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {loadingGrades ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : studentGrades.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <Award className="w-16 h-16 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium mb-2">
                      {t?.('no_grades_yet') || "No grades yet"}
                    </h4>
                    <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t?.('complete_assignments_to_get_grades') || "Complete assignments to receive grades"}
                    </p>
                    <button
                      onClick={() => {
                        setShowGradesModal(false);
                        setSelectedTab("assignments");
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    >
                      {t?.('view_assignments') || "View Assignments"}
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className={`p-4 rounded-xl border ${
                        theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="text-2xl font-bold mb-1">
                          {studentGrades.length}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t?.('total_grades') || "Total Grades"}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${
                        theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="text-2xl font-bold mb-1">
                          {(studentGrades.reduce((sum, grade) => sum + grade.points, 0) / studentGrades.length).toFixed(1)}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t?.('average_grade') || "Average Grade"}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${
                        theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="text-2xl font-bold mb-1">
                          {studentGrades.filter(g => g.points >= 7).length}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t?.('excellent_grades') || "Excellent Grades (≥7)"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {studentGrades.map((grade, index) => (
                        <motion.div
                          key={grade.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border ${
                            theme === 'dark' 
                              ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 hover:border-gray-600' 
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          } transition-colors`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  grade.points >= 9 ? 'bg-green-500/20 text-green-500' :
                                  grade.points >= 7 ? 'bg-yellow-500/20 text-yellow-500' :
                                  grade.points >= 5 ? 'bg-orange-500/20 text-orange-500' :
                                  'bg-red-500/20 text-red-500'
                                }`}>
                                  <Award className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold">{grade.assignmentTitle}</h4>
                                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {grade.fileName}
                                  </p>
                                </div>
                              </div>
                              
                              {grade.feedback && (
                                <div className={`mt-3 p-3 rounded-lg ${
                                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {grade.feedback.length > 150 
                                      ? `${grade.feedback.substring(0, 150)}...` 
                                      : grade.feedback}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                  {t?.('graded_by') || "Graded by"}: {grade.gradedBy}
                                </span>
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                  {grade.gradedAt?.toDate 
                                    ? new Date(grade.gradedAt.toDate()).toLocaleDateString()
                                    : t?.('recently') || "Recently"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-center">
                                <div className={`text-3xl font-bold ${
                                  grade.points >= 9 ? 'text-green-500' :
                                  grade.points >= 7 ? 'text-yellow-500' :
                                  grade.points >= 5 ? 'text-orange-500' :
                                  'text-red-500'
                                }`}>
                                  {grade.points}/{grade.maxPoints}
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  grade.points >= 9 ? 'bg-green-500/20 text-green-500' :
                                  grade.points >= 7 ? 'bg-yellow-500/20 text-yellow-500' :
                                  grade.points >= 5 ? 'bg-orange-500/20 text-orange-500' :
                                  'bg-red-500/20 text-red-500'
                                }`}>
                                  {grade.points >= 9 ? t?.('excellent') || 'Excellent' :
                                   grade.points >= 7 ? t?.('good') || 'Good' :
                                   grade.points >= 5 ? t?.('average') || 'Average' :
                                   t?.('needs_improvement') || 'Needs Improvement'}
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    alert(`${t?.('viewing_grade_details') || "Viewing grade details for"}: ${grade.assignmentTitle}`);
                                  }}
                                  className={`px-3 py-1 rounded text-sm ${
                                    theme === 'dark' 
                                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                                      : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                                  }`}
                                >
                                  {t?.('details') || "Details"}
                                </button>
                                {grade.feedback && grade.feedback.length > 150 && (
                                  <button
                                    onClick={() => {
                                      alert(`${t?.('full_feedback') || "Full Feedback"}:\n\n${grade.feedback}`);
                                    }}
                                    className={`px-3 py-1 rounded text-sm ${
                                      theme === 'dark' 
                                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                                        : 'bg-green-100 hover:bg-green-200 text-green-600'
                                    }`}
                                  >
                                    {t?.('full_feedback') || "Full Feedback"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{t?.('score') || "Score"}</span>
                              <span>{grade.points}/{grade.maxPoints}</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                            }`}>
                              <div
                                className={`h-full rounded-full ${
                                  grade.points >= 9 ? 'bg-green-500' :
                                  grade.points >= 7 ? 'bg-yellow-500' :
                                  grade.points >= 5 ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${(grade.points / grade.maxPoints) * 100}%` }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {studentGrades.length >= 3 && (
                      <div className={`mt-8 p-6 rounded-xl border ${
                        theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <h4 className="font-bold mb-4">{t?.('grade_distribution') || "Grade Distribution"}</h4>
                        <div className="flex items-end h-32 gap-2">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(point => {
                            const count = studentGrades.filter(g => Math.round(g.points) === point).length;
                            const maxCount = Math.max(...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => 
                              studentGrades.filter(g => Math.round(g.points) === p).length
                            ));
                            const height = maxCount > 0 ? (count / maxCount) * 80 : 0;
                            
                            return (
                              <div key={point} className="flex-1 flex flex-col items-center">
                                <div
                                  className={`w-full rounded-t ${
                                    point >= 9 ? 'bg-green-500' :
                                    point >= 7 ? 'bg-yellow-500' :
                                    point >= 5 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ height: `${height}px` }}
                                />
                                <div className="text-xs mt-1">{point}</div>
                                <div className="text-xs font-medium">{count}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEvaluationModal && selectedSubmission && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowEvaluationModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {t?.('assignment_evaluation') || "Assignment Evaluation"}
                  </h3>
                  <button
                    onClick={() => setShowEvaluationModal(false)}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">{selectedSubmission.name}</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t?.('submitted_on') || "Submitted on"}: {selectedSubmission.date}
                    </p>
                  </div>
                  
                  {selectedSubmission?.grade ? (
                    <>
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-2 ${
                          selectedSubmission.grade.score! >= 80 ? 'text-green-500' :
                          selectedSubmission.grade.score! >= 60 ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {selectedSubmission.grade.score}%
                        </div>
                        <div className={`px-4 py-2 rounded-full inline-block text-sm font-medium ${
                          selectedSubmission.grade.score! >= 80 ? 'bg-green-500/20 text-green-500' :
                          selectedSubmission.grade.score! >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {selectedSubmission.grade.score! >= 80 ? t?.('excellent') || 'Excellent' :
                           selectedSubmission.grade.score! >= 60 ? t?.('good') || 'Good' :
                           t?.('needs_improvement') || 'Needs Improvement'}
                        </div>
                      </div>
                      
                      {selectedSubmission.grade.feedback && (
                        <div>
                          <h5 className="font-medium mb-2">{t?.('feedback') || "Feedback"}:</h5>
                          <div className={`p-4 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                          }`}>
                            <p className="whitespace-pre-wrap">{selectedSubmission.grade.feedback}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {selectedSubmission.grade.gradedBy && (
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {t?.('graded_by') || "Graded by"}: {selectedSubmission.grade.gradedBy}
                          </div>
                        )}
                        {selectedSubmission.grade.gradedAt && (
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t?.('graded_on') || "Graded on"}: {new Date(selectedSubmission.grade.gradedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="font-medium mb-2">{t?.('pending_evaluation') || "Pending Evaluation"}</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {t?.('assignment_not_graded') || "This assignment has not been graded yet."}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => downloadCode(selectedSubmission.code || '', selectedSubmission.name)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                        theme === 'dark' 
                          ? 'bg-white/5 hover:bg-white/10' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <DownloadIcon className="w-4 h-4" />
                      {t?.('download_code') || "Download Code"}
                    </button>
                    <button
                      onClick={() => setShowEvaluationModal(false)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                        theme === 'dark' 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-green-100 hover:bg-green-200 text-green-600'
                      }`}
                    >
                      {t?.('close') || "Close"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div> 
      
      <AnimatePresence>
        {selectedAssignmentDetails && (
          <AssignmentDetailsModal
            assignment={selectedAssignmentDetails}
            onClose={() => setSelectedAssignmentDetails(null)}
            onStart={(id) => {
              setSelectedAssignmentDetails(null);
              startTask(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Компонент за детайлен изглед на assignment
function AssignmentDetailsModal({ 
  assignment, 
  onClose, 
  onStart 
}: { 
  assignment: Assignment; 
  onClose: () => void; 
  onStart: (id: string) => void;
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  if (!assignment) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`relative w-full max-w-4xl rounded-2xl border overflow-hidden ${
          theme === 'dark' 
            ? 'bg-gray-900 border-white/10' 
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Image Header */}
        {assignment.backgroundImage && (
          <div className="relative h-48 w-full overflow-hidden">
            <img 
              src={assignment.backgroundImage} 
              alt={assignment.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">{assignment.title}</h2>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  assignment.difficulty === 'easy' ? 'bg-green-500/80' :
                  assignment.difficulty === 'medium' ? 'bg-yellow-500/80' :
                  'bg-red-500/80'
                }`}>
                  {assignment.difficulty}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-white/20">
                  {assignment.category}
                </span>
                <span className="px-3 py-1 rounded-full text-sm bg-white/20">
                  {t?.('due') || "Due"}: {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Objective */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              {t?.('objective') || "Objective"}
            </h3>
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <p className="text-lg">{assignment.objective}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              {t?.('description') || "Description"}
            </h3>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {assignment.description}
            </p>
          </div>

          {/* Topic & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-purple-500" />
                <span className="font-medium">{t?.('topic') || "Topic"}</span>
              </div>
              <p className="text-lg">{assignment.topic}</p>
            </div>
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{t?.('subject') || "Subject"}</span>
              </div>
              <p className="text-lg capitalize">{assignment.subject}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-amber-500" />
              {t?.('requirements') || "Requirements"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <Database className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{assignment.requirements.minFacts}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('facts') || "Facts"}
                </div>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'
              }`}>
                <Cpu className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{assignment.requirements.minRules}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('rules') || "Rules"}
                </div>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'
              }`}>
                <Link className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{assignment.requirements.minCombinedRules}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('combined_rules') || "Combined Rules"}
                </div>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'
              }`}>
                <List className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <div className="text-2xl font-bold">{assignment.requirements.minMenuItems}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('menu_items') || "Menu Items"}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {assignment.instructions && assignment.instructions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-indigo-500" />
                {t?.('instructions') || "Instructions"}
              </h3>
              <div className="space-y-3">
                {assignment.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {index + 1}
                    </span>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points & Due Date */}
          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t?.('points') || "Points"}
                    </div>
                    <div className="text-xl font-bold">{assignment.points}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t?.('due_date') || "Due Date"}
                    </div>
                    <div className="text-xl font-bold">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onStart(assignment.id)}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                {assignment.studentProgress?.completed 
                  ? t?.('continue_work') || "Continue Work"
                  : t?.('start_assignment') || "Start Assignment"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
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
  Send,
  Group as GroupIcon,
  UserPlus,
  Hash
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
  writeBatch
} from "firebase/firestore";
import StudentMessages from "./StudentMessages";

// Интерфейси за общности, предизвикателства и съобщения
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

interface ChallengeSubmission {
  studentId: string;
  studentName?: string;
  submittedAt: any;
  files?: string[];
  notes?: string;
  score?: number;
  status?: 'joined' | 'submitted' | 'evaluated' | 'completed';
  solutionCode?: string;
  evaluation?: {
    score?: number;
    feedback?: string;
    evaluatedAt?: any;
    evaluatedBy?: string;
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

// Courses data
const courses = [
  { id: 1, title: "Prolog Basics", description: "Introduction to Prolog programming", progress: 70, color: "#FF6B8B", icon: "💻" },
  { id: 2, title: "Expert Systems", description: "Build intelligent systems", progress: 45, color: "#36D1DC", icon: "🧠" },
  { id: 3, title: "Logical Rules", description: "Advanced logic programming", progress: 85, color: "#FFD166", icon: "⚡" },
  { id: 4, title: "AI Fundamentals", description: "Artificial Intelligence basics", progress: 30, color: "#9D4EDD", icon: "🤖" },
  { id: 5, title: "Data Structures", description: "Prolog data organization", progress: 60, color: "#4CC9F0", icon: "🗂️" },
  { id: 6, title: "Problem Solving", description: "Solve real-world problems", progress: 25, color: "#FF9E6D", icon: "🎯" },
];

// Prolog Templates
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
    evaluation?: {
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
  evaluation?: {
    score?: number;
    feedback?: string;
    gradedAt?: any;
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
  const [_showTemplates, setShowTemplates] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  const [communities, setCommunities] = useState<Community[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [selectedMessageUser, setSelectedMessageUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [communityInviteCode, setCommunityInviteCode] = useState("");
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingData, setLoadingData] = useState({
    communities: true,
    challenges: true,
    assignments: true,
    users: true
  });
  
  const [codeMetadata, setCodeMetadata] = useState({
    domain: "",
    type: "Symbolic AI / Expert System",
    studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
    dataArea: "",
    assignmentId: "",
    assignmentTitle: ""
  });

  const [submissions, setSubmissions] = useState<Submission[]>([]);
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

  // Зареждане на всички потребители
  const loadAllUsers = async () => {
    try {
      console.log("Loading all users...");
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
      console.log("Loaded all users:", usersData.length);
      
    } catch (error) {
      console.error("Error loading all users:", error);
      setLoadingData(prev => ({ ...prev, users: false }));
    }
  };

  // Зареждане на общностите
  const loadCommunities = async () => {
    if (!user) {
      setLoadingData(prev => ({ ...prev, communities: false }));
      return;
    }
    
    try {
      console.log("Loading communities for user:", user.uid);
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
      
      // Обновяване на статистиката
      setStats(prev => ({
        ...prev,
        communityMembers: communitiesData.reduce((sum, c) => sum + c.memberCount, 0)
      }));
      
      if (communitiesData.length > 0 && !activeCommunity) {
        setActiveCommunity(communitiesData[0]);
      }
      
      setLoadingData(prev => ({ ...prev, communities: false }));
      console.log("Loaded communities:", communitiesData.length);
      
    } catch (error) {
      console.error("Error loading communities:", error);
      setLoadingData(prev => ({ ...prev, communities: false }));
    }
  };

  // Зареждане на предизвикателствата
  const loadChallenges = async () => {
    if (!user || communities.length === 0) {
      setLoadingData(prev => ({ ...prev, challenges: false }));
      return;
    }
    
    try {
      console.log("Loading challenges for communities:", communities.map(c => c.id));
      
      // Събираме всички community IDs
      const userCommunityIds = communities.map(c => c.id);
      
      if (userCommunityIds.length === 0) {
        setChallenges([]);
        setLoadingData(prev => ({ ...prev, challenges: false }));
        return;
      }
      
      // Правим заявка за всички предизвикателства към общностите на потребителя
      const q = query(
        collection(db, "challenges"),
        where("targetCommunityId", "in", userCommunityIds),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      const challengesData: Challenge[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        challengesData.push({
          id: doc.id,
          title: data.title || "Untitled Challenge",
          description: data.description || "No description",
          creatorCommunityId: data.creatorCommunityId,
          targetCommunityId: data.targetCommunityId,
          createdBy: data.createdBy || "Unknown",
          status: data.status || 'pending',
          dueDate: data.dueDate,
          category: data.category || "General",
          difficulty: data.difficulty || 'medium',
          points: data.points || 50,
          submissions: data.submissions || [],
          createdAt: data.createdAt
        });
      });
      
      setChallenges(challengesData);
      
      // Обновяваме статистиката
      const activeChallengesCount = challengesData.filter(c => 
        c.status === 'accepted' || c.status === 'pending'
      ).length;
      
      setStats(prev => ({
        ...prev,
        activeChallenges: activeChallengesCount
      }));
      
      setLoadingData(prev => ({ ...prev, challenges: false }));
      console.log("Loaded challenges:", challengesData.length);
      
    } catch (error) {
      console.error("Error loading challenges:", error);
      setLoadingData(prev => ({ ...prev, challenges: false }));
      
      // Fallback data за тестване
      if (communities.length > 0) {
        const fallbackChallenges: Challenge[] = [
          {
            id: "challenge-1",
            title: "Sample Prolog Challenge",
            description: "Create an expert system for animal classification",
            creatorCommunityId: communities[0].id,
            targetCommunityId: communities[0].id,
            createdBy: communities[0].teacherId,
            status: 'accepted',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            category: "AI",
            difficulty: 'medium',
            points: 100,
            submissions: [],
            createdAt: new Date()
          }
        ];
        
        setChallenges(fallbackChallenges);
        setStats(prev => ({ ...prev, activeChallenges: 1 }));
      }
    }
  };

  // Зареждане на съобщенията
  const loadMessages = async () => {
    if (!user) return;
    
    try {
      const q = query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
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
          type: data.type || 'direct'
        });
      });
      
      setMessages(messagesData);
      
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Зареждане на задачите/заданията
  const loadAssignments = async () => {
    if (!user) {
      setLoadingData(prev => ({ ...prev, assignments: false }));
      return;
    }
    
    setLoadingAssignments(true);
    try {
      console.log("Loading assignments...");
      
      // Използваме учителите от общностите на потребителя
      const teacherIds = communities.map(c => c.teacherId).filter(Boolean);
      
      if (teacherIds.length === 0) {
        console.log("No teacher IDs found");
        setAssignments([]);
        setStats(prev => ({
          ...prev,
          totalAssignments: 0,
          completedAssignments: 0,
          pendingAssignments: 0
        }));
        return;
      }
      
      // Зареждаме задачи от всички учители
      const assignmentsData: Assignment[] = [];
      
      for (const teacherId of teacherIds) {
        try {
          const assignmentsQuery = query(
            collection(db, "assignments"),
            where("teacherId", "==", teacherId),
            where("status", "==", "active"),
            orderBy("createdAt", "desc")
          );
          
          const snapshot = await getDocs(assignmentsQuery);
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            assignmentsData.push({
              id: doc.id,
              title: data.title || "Untitled Assignment",
              description: data.description || "No description",
              objective: data.objective || "Learn and practice",
              topic: data.topic || "General",
              subject: data.subject || "Prolog",
              requirements: data.requirements || {
                minFacts: 10,
                minRules: 5,
                minCombinedRules: 2,
                minMenuItems: 3
              },
              instructions: data.instructions || [],
              teacherId: data.teacherId,
              teacherName: data.teacherName || "Teacher",
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
      
      // Проверяваме за вече завършени задачи
      for (const assignment of assignmentsData) {
        const studentSubmission = submissions.find(sub => sub.assignmentId === assignment.id);
        if (studentSubmission) {
          let evaluation = undefined;
          
          if (studentSubmission.evaluation) {
            evaluation = {
              score: studentSubmission.evaluation.score,
              feedback: studentSubmission.evaluation.feedback,
              gradedAt: studentSubmission.evaluation.gradedAt,
              gradedBy: "Teacher"
            };
          }
          
          assignment.studentProgress = {
            completed: true,
            submissionId: studentSubmission.id,
            submittedAt: new Date(),
            code: studentSubmission.code,
            requirementsMet: {
              facts: Math.floor(Math.random() * 10) + 15,
              rules: Math.floor(Math.random() * 3) + 4,
              combinedRules: Math.floor(Math.random() * 2) + 1,
              menuItems: Math.floor(Math.random() * 3) + 5
            },
            evaluation: evaluation
          };
        }
      }
      
      setAssignments(assignmentsData);
      
      // Обновяване на статистиката
      const completedAssignments = assignmentsData.filter(a => a.studentProgress?.completed).length;
      const totalAssignments = assignmentsData.length;
      const pendingAssignments = totalAssignments - completedAssignments;
      
      setStats(prev => ({
        ...prev,
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        averageScore: completedAssignments > 0 ? 
          Math.round((completedAssignments / totalAssignments) * 100) : 0
      }));
      
      setLoadingData(prev => ({ ...prev, assignments: false }));
      console.log("Loaded assignments:", assignmentsData.length);
      
    } catch (error) {
      console.error("Error loading assignments:", error);
      setLoadingData(prev => ({ ...prev, assignments: false }));
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Зареждане на активностите
  const loadActivityLogs = async () => {
    try {
      const q = query(
        collection(db, "activityLogs"),
        where("userId", "==", user?.uid),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const logs: ActivityLog[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          studentId: data.userId || user?.uid || "",
          studentName: data.userName || userData?.fullName || user?.email?.split('@')[0] || "Student",
          action: data.action || "Unknown action",
          timestamp: data.timestamp || serverTimestamp(),
          details: data.details || "",
          file: data.target || "",
          status: data.actionType || 'general'
        });
      });
      
      setActivityLogs(logs);
      
    } catch (error) {
      console.error("Error loading activity logs:", error);
      
      const sampleLogs: ActivityLog[] = [
        {
          id: "1",
          studentId: user?.uid || "",
          studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
          action: "Uploaded Prolog code",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          details: "Submitted assignment on insects expert system",
          file: "insects.pl",
          status: "submitted"
        },
        {
          id: "2",
          studentId: user?.uid || "",
          studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
          action: "Started new assignment",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          details: "Working on animals classification system",
          file: "animals.pl",
          status: "started"
        },
        {
          id: "3",
          studentId: user?.uid || "",
          studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
          action: "Completed course module",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          details: "Finished Prolog basics course",
          file: "",
          status: "completed"
        }
      ];
      
      setActivityLogs(sampleLogs);
    }
  };

  // Функции за работа с предизвикателства
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

    // Проверяваме дали вече е присъединен
    const hasJoined = challenge.submissions?.some(s => s.studentId === user.uid);
    if (hasJoined) {
      setUploadStatus("ℹ️ " + (t?.('already_joined_challenge') || "You have already joined this challenge!"));
      setIsChallengeMode(true);
      setSelectedChallengeId(challengeId);
      setSelectedTab("upload");
      return;
    }

    const challengeRef = doc(db, 'challenges', challengeId);
    const currentTime = new Date(); // Използваме new Date() вместо serverTimestamp()
    
    // Добавяме submission към предизвикателството
    const newSubmission: ChallengeSubmission = {
      studentId: user.uid,
      studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
      submittedAt: currentTime, // Тук е new Date()
      status: 'joined',
      notes: "Joined the challenge"
    };

    await updateDoc(challengeRef, {
      submissions: arrayUnion(newSubmission)
    });

    // Създаваме отделен запис за решението
    const solutionRef = doc(collection(db, 'challengeSolutions'));
    
    await setDoc(solutionRef, {
      id: solutionRef.id,
      challengeId: challengeId,
      studentId: user.uid,
      studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
      solutionCode: "",
      submittedAt: serverTimestamp(), // Тук може да използваме serverTimestamp() защото е в setDoc()
      status: 'joined',
      challengeTitle: challenge.title,
      challengeDescription: challenge.description,
      createdAt: serverTimestamp()
    });

    // Задаваме режима на предизвикателство
    setIsChallengeMode(true);
    setSelectedChallengeId(challengeId);
    setSelectedTab("upload");
    
    // Генерираме шаблон
    const challengeTemplate = generateChallengeTemplate(challenge);
    setCode(challengeTemplate);
    
    setCodeMetadata({
      domain: challenge.category,
      type: "Challenge Solution",
      studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
      dataArea: challenge.category,
      assignmentId: challengeId,
      assignmentTitle: `Challenge: ${challenge.title}`
    });
    
    setUploadStatus("✅ " + (t?.('challenge_joined_success') || "Challenge joined! You can now work on your solution."));
    
    // Презареждаме предизвикателствата
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
        userName: userData?.fullName || user.email?.split('@')[0] || "Student",
        action: "Requested to join community",
        details: `Requested to join community`,
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

  const handleSendMessage = async (type: 'direct' | 'community' = 'direct') => {
    if (!user || !newMessage.trim()) return;

    try {
      let receiverId = "";
      let receiverName = "";
      
      if (type === 'direct' && selectedMessageUser) {
        receiverId = selectedMessageUser.uid;
        receiverName = selectedMessageUser.username;
      } else if (type === 'community' && activeCommunity) {
        receiverId = activeCommunity.id;
        receiverName = activeCommunity.name;
      }
      
      if (!receiverId) return;
      
      const messageRef = doc(collection(db, 'messages'));
      
      const newMessageData: Message = {
        id: messageRef.id,
        senderId: user.uid,
        senderName: userData?.fullName || user.email?.split('@')[0] || "Student",
        receiverId: receiverId,
        receiverName: receiverName,
        content: newMessage,
        timestamp: serverTimestamp(),
        read: false,
        type: type
      };
      
      await setDoc(messageRef, newMessageData);
      
      setNewMessage("");
      setUploadStatus(`✅ ${t?.('message_sent') || "Message sent successfully!"}`);
      loadMessages();
      
    } catch (error) {
      console.error("Error sending message:", error);
      setUploadStatus("❌ " + (t?.('message_error') || "Error sending message!"));
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
      // Намираме предизвикателството
      const challenge = challenges.find(c => c.id === selectedChallengeId);
      if (!challenge) {
        setUploadStatus("❌ " + (t?.('challenge_not_found') || "Challenge not found!"));
        return;
      }

      // Проверяваме дали потребителят е присъединен
      const hasJoined = challenge.submissions?.some(s => s.studentId === user.uid);
      if (!hasJoined) {
        setUploadStatus("❌ " + (t?.('challenge_not_joined') || "You must join the challenge first!"));
        return;
      }

      // Търсим съществуващо решение
      const solutionsQuery = query(
        collection(db, "challengeSolutions"),
        where("challengeId", "==", selectedChallengeId),
        where("studentId", "==", user.uid)
      );

      const solutionsSnapshot = await getDocs(solutionsQuery);
      
      if (solutionsSnapshot.empty) {
        // Създаваме ново решение
        const solutionRef = doc(collection(db, 'challengeSolutions'));
        
        await setDoc(solutionRef, {
          id: solutionRef.id,
          challengeId: selectedChallengeId,
          studentId: user.uid,
          studentName: userData?.fullName || user?.email?.split('@')[0] || "Student",
          solutionCode: code,
          submittedAt: serverTimestamp(),
          status: 'submitted',
          challengeTitle: challenge.title,
          challengeDescription: challenge.description,
          createdAt: serverTimestamp()
        });
      } else {
        // Обновяваме съществуващо решение
        const solutionDoc = solutionsSnapshot.docs[0];
        await updateDoc(solutionDoc.ref, {
          solutionCode: code,
          status: 'submitted',
          submittedAt: serverTimestamp()
        });
      }

      // Обновяваме submission в предизвикателството
      const challengeRef = doc(db, 'challenges', selectedChallengeId);
      const challengeDoc = await getDoc(challengeRef);
      
      if (challengeDoc.exists()) {
        const challengeData = challengeDoc.data();
        const submissions = challengeData.submissions || [];
        
        // Намираме submission на потребителя и го обновяваме
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

      // Лог на активността
      await addDoc(collection(db, "activityLogs"), {
        userId: user.uid,
        userName: userData?.fullName || user?.email?.split('@')[0] || "Student",
        action: "Submitted Challenge Solution",
        details: `Challenge: ${challenge.title}`,
        target: `Challenge_${selectedChallengeId}`,
        actionType: "challenge_submission",
        timestamp: serverTimestamp()
      });

      setUploadStatus("✅ " + (t?.('challenge_submitted') || "Challenge solution submitted successfully!"));
      setCode("");
      
      // Презареждаме данните
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
%   Student: ${(userData?.fullName || user?.email?.split('@')[0] || "Student").padEnd(40)}%
%   Due Date: ${challenge.dueDate || "Not specified".padEnd(37)}%
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
      label: t?.('messages') || "Съобщения", 
      icon: <MessageCircle className="w-5 h-5" />,
      badge: messages.filter(m => !m.read).length
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

  // Зареждане на submissions
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "prologCodes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const submissionData: Submission[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const submission: Submission = {
          id: docSnapshot.id,
          name: data.title || `Submission ${new Date(data.createdAt?.toMillis()).toLocaleDateString()}`,
          date: data.createdAt?.toDate ? 
            new Date(data.createdAt.toDate()).toLocaleString() : 
            new Date().toLocaleString(),
          status: data.status ?? "pending",
          code: data.code,
          assignmentId: data.assignmentId,
          assignmentTitle: data.assignmentTitle
        };
        
        if (data.assignmentId) {
          try {
            const evaluationDoc = await getDoc(doc(db, "evaluations", `${user.uid}_${data.assignmentId}`));
            if (evaluationDoc.exists()) {
              const evalData = evaluationDoc.data();
              submission.evaluation = {
                score: evalData.score,
                feedback: evalData.feedback,
                gradedAt: evalData.gradedAt?.toDate()
              };
            }
          } catch (error) {
            console.error("Error loading evaluation:", error);
          }
        }
        
        submissionData.push(submission);
      }

      setSubmissions(submissionData);
      
      // Обновяване на статистиката
      const totalSubmissions = submissionData.length;
      const successfulSubmissions = submissionData.filter(s => s.status === "success").length;
      const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;
      
      setStats(prev => ({
        ...prev,
        totalSubmissions,
        successRate
      }));
      
      console.log("Loaded submissions:", submissionData.length);
    });

    return () => unsub();
  }, [user]);

  // Инициализиране на данните
  useEffect(() => {
    if (user) {
      console.log("Initializing data for user:", user.uid);
      loadAllUsers();
      loadCommunities();
      loadMessages();
      loadActivityLogs();
    }
  }, [user]);

  // Когато общностите се заредят, зареждаме предизвикателства и задачи
  useEffect(() => {
    if (communities.length > 0 && !loadingData.communities) {
      console.log("Communities loaded, loading challenges and assignments");
      loadChallenges();
      loadAssignments();
    }
  }, [communities, loadingData.communities]);

  // Когато предизвикателствата се променят, обновяваме статистиката
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

  // Refresh данни при смяна на таб
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
      // ====== РЕЖИМ ЗА ПРЕДИЗВИКАТЕЛСТВА ======
      console.log("Processing CHALLENGE submission...");
      
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
      // ====== РЕЖИМ ЗА ОБИКНОВЕНИ ЗАДАНИЯ ======
      console.log("Processing REGULAR ASSIGNMENT submission...");
      
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
          userName: userData?.fullName || user?.email?.split('@')[0] || "Student",
          action: "Submitted Prolog code",
          details: `Submitted assignment: ${assignment.title}`,
          target: `${assignment.title.replace(/\s+/g, '_')}.pl`,
          actionType: "submission",
          timestamp: serverTimestamp()
        });

        setCode("");
        setCodeMetadata({
          domain: "",
          type: "Symbolic AI / Expert System",
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

  const loadMyTeachers = () => {
    if (!user || communities.length === 0) return [];
    
    const myTeachers: Array<{
      uid: string;
      username: string;
      email: string;
      role: string;
      communityId: string;
      communityName: string;
    }> = [];
    
    communities.forEach(community => {
      const teacher = allUsers.find(u => u.uid === community.teacherId);
      if (teacher && !myTeachers.some(t => t.uid === teacher.uid)) {
        myTeachers.push({
          uid: teacher.uid,
          username: teacher.username,
          email: teacher.email,
          role: teacher.role,
          communityId: community.id,
          communityName: community.name
        });
      }
    });
    
    return myTeachers;
  };

  const clearAllMessages = async () => {
    if (!user) return;
    
    try {
      const userMessages = messages.filter(m => m.receiverId === user.uid);
      if (userMessages.length === 0) {
        alert(t?.('no_messages') || "Нямате съобщения");
        return;
      }
      
      if (window.confirm(`${t?.('mark_all_as_read') || "Маркиране на всички"} ${userMessages.length} ${t?.('messages_as_read') || "съобщения като прочетени"}?`)) {
        const batch = writeBatch(db);
        userMessages.forEach(msg => {
          batch.update(doc(db, 'messages', msg.id), { 
            read: true 
          });
        });
        
        await batch.commit();
        alert(`${t?.('all_messages_marked_as_read') || "Всички съобщения са маркирани като прочетени"} (${userMessages.length})`);
        loadMessages();
      }
    } catch (error) {
      console.error(t?.('error_updating_messages') || "Грешка при маркиране на съобщения:", error);
      alert("❌ " + (t?.('error_updating_messages') || "Грешка при маркиране на съобщения!"));
    }
  };

  const deleteReadMessages = async () => {
    if (!user) return;
    
    try {
      const readMessages = messages.filter(m => m.read && m.receiverId === user.uid);
      if (readMessages.length === 0) {
        alert(t?.('no_read_messages') || "Нямате прочетени съобщения");
        return;
      }
      
      if (window.confirm(`${t?.('delete_read_messages') || "Изтриване на"} ${readMessages.length} ${t?.('read_messages') || "прочетени съобщения"}?`)) {
        const batch = writeBatch(db);
        readMessages.forEach(msg => {
          batch.delete(doc(db, 'messages', msg.id));
        });
        
        await batch.commit();
        alert(`${t?.('messages_deleted') || "Съобщенията са изтрити"} (${readMessages.length})`);
        loadMessages();
      }
    } catch (error) {
      console.error(t?.('error_deleting_messages') || "Грешка при изтриване на съобщения:", error);
      alert("❌ " + (t?.('error_deleting_messages') || "Грешка при изтриване на съобщения!"));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadMessages = messages.filter(m => !m.read && m.receiverId === user.uid);
      if (unreadMessages.length === 0) {
        alert(t?.('no_unread_messages') || "Нямате непрочетени съобщения");
        return;
      }
      
      const batch = writeBatch(db);
      unreadMessages.forEach(msg => {
        batch.update(doc(db, 'messages', msg.id), { read: true });
      });
      
      await batch.commit();
      alert(`${t?.('messages_marked_as_read') || "Съобщенията са маркирани като прочетени"} (${unreadMessages.length})`);
      loadMessages();
    } catch (error) {
      console.error(t?.('error_marking_messages') || "Грешка при маркиране на съобщения:", error);
      alert("❌ " + (t?.('error_marking_messages') || "Грешка при маркиране на съобщения!"));
    }
  };
console.log(clearAllMessages, markAllAsRead, deleteReadMessages, loadMyTeachers)
  const statsCards = [
    {
      title: t?.('total_assignments') || "Total Assignments",
      value: stats.totalAssignments,
      icon: <FileText className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      change: `${stats.completedAssignments} completed`,
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
      change: `${stats.communityMembers} members`,
      description: t?.('learning_communities') || "Learning communities"
    },
    {
      title: t?.('active_challenges') || "Active Challenges",
      value: stats.activeChallenges,
      icon: <Target className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      change: `${challenges.filter(c => c.status === 'accepted').length} accepted`,
      description: t?.('challenges_in_progress') || "Challenges in progress"
    }
  ];

  const todaysTasks = assignments.map(assignment => {
    const isCompleted = assignment.studentProgress?.completed || false;
    const progress = isCompleted ? 100 : 0;
    const evaluation = assignment.studentProgress?.evaluation;
    
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
        type: "Symbolic AI / Expert System",
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
      const requirements = `${t?.('requirements') || "Requirements"}:\n- ${t?.('facts') || "Facts"}: ${assignment.requirements.minFacts}\n- ${t?.('rules') || "Rules"}: ${assignment.requirements.minRules}\n- ${t?.('combined_rules') || "Combined rules"}: ${assignment.requirements.minCombinedRules}\n- ${t?.('menu_items') || "Menu items"}: ${assignment.requirements.minMenuItems}`;
      
      alert(`${t?.('assignment') || "Assignment"}: ${assignment.title}\n\n${t?.('objective') || "Objective"}: ${assignment.objective}\n\n${requirements}`);
    }
  };

  const generateHeader = () => {
    const studentName = codeMetadata.studentName || user?.email?.split('@')[0] || t?.('student') || "Student";
    const domain = codeMetadata.domain || t?.('expert_system') || "Expert System";
    const type = codeMetadata.type || "Symbolic AI / Expert System";
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

  const applyTemplate = (templateId: string) => {
    const template = prologTemplates.find(t => t.id === templateId);
    if (template) {
      const header = generateHeader();
      if (templateId === "basic") {
        const templateBody = template.code.split('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\n')[1] || template.code;
        setCode(header + "\n\n" + templateBody);
      } else {
        setCode(header + "\n\n" + template.code);
      }
      setShowTemplates(false);
    }
  };
console.log(applyTemplate)
  const getStatusText = (status: string) => {
    switch (status) {
      case "success": return t?.('status_success') || "Success";
      case "error": return t?.('status_error') || "Error";
      default: return t?.('status_pending') || "Pending";
    }
  };

  const handleShowEvaluation = (submission: Submission) => {
    setSelectedSubmission(submission);
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
                      Code: {community.inviteCode}
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
                    Message
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
              const hasJoined = challenge.submissions?.some(s => s.studentId === user?.uid);
              
              return (
                <motion.div
                  key={challenge.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  }`}
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
                        {t?.('from') || "From"}: {creatorCommunity?.name || "Unknown"}
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
                  </div>
                  
                  <div className="flex gap-2">
                    {hasJoined ? (
                      <div className="flex flex-col gap-2">
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium text-center ${
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
                            const challengeTemplate = generateChallengeTemplate(challenge);
                            setCode(challengeTemplate);
                            setCodeMetadata({
                              domain: challenge.category,
                              type: "Challenge Solution",
                              studentName: userData?.fullName || user?.email?.split('@')[0] || t?.('student') || "Student",
                              dataArea: challenge.category,
                              assignmentId: challenge.id,
                              assignmentTitle: `Challenge: ${challenge.title}`
                            });
                          }}
                          className="py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm"
                        >
                          <Code className="w-4 h-4 inline mr-1" />
                          {t?.('solve_now') || "Solve Now"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm"
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
              {t?.('welcome_back') || "Welcome back"}, {userData?.fullName || user?.email?.split('@')[0] || "Student"}!
            </p>
          </div>
          
          {/* Индикатори за зареждане */}
          <div className="flex items-center gap-2">
            {Object.values(loadingData).some(v => v) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                Зареждане...
              </div>
            )}
            
            <div className="relative group">
              <button
                onClick={() => setShowMessaging(true)}
                className={`relative p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                {messages.filter(m => !m.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {messages.filter(m => !m.read).length}
                  </span>
                )}
              </button>
            </div>
            <button 
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Bell className="w-5 h-5" />
            </button>
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
                      stat.change.includes('completed') 
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
                      <h3 className="text-xl font-bold">🎯 {t?.('todays_tasks') || "Today's Tasks"}</h3>
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
                    {todaysTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
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
                          onClick={() => startTask(task.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            task.completed
                              ? theme === 'dark' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-green-100 hover:bg-green-200 text-green-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          }`}
                        >
                          {task.completed ? t?.('review') || 'Review' : t?.('start') || 'Start'}
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
                    {activityLogs.map((log, _index) => (
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
                                'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
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
                                Status:
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
                                Points:
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
                {assignments.map((assignment) => {
                  const isCompleted = assignment.studentProgress?.completed || false;
                  const evaluation = assignment.studentProgress?.evaluation;
                  
                  return (
                    <motion.div
                      key={assignment.id}
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
                          <>
                            <button
                              onClick={() => {
                                const submission = submissions.find(sub => sub.assignmentId === assignment.id);
                                if (submission) {
                                  setSelectedSubmission(submission);
                                  setShowEvaluationModal(true);
                                }
                              }}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                                theme === 'dark' 
                                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-600'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" /> 
                              {evaluation?.score ? 
                                `${t?.('view_grade') || "View Grade"} (${evaluation.score}%)` : 
                                t?.('completed') || "Completed"}
                            </button>
                            {evaluation?.score && (
                              <button
                                onClick={() => startTask(assignment.id)}
                                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                              >
                                <RefreshCw className="w-4 h-4" /> {t?.('resubmit') || "Resubmit"}
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startTask(assignment.id)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                            >
                              <Play className="w-4 h-4" /> {t?.('start_work') || "Start Work"}
                            </button>
                            <button
                              onClick={() => openTaskDetails(assignment.id)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                                theme === 'dark' 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              <Eye className="w-4 h-4" /> {t?.('details') || "Details"}
                            </button>
                          </>
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
                            return challenge?.title || codeMetadata.assignmentTitle || "Active Challenge";
                          })()}
                        </div>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          Challenge ID: {selectedChallengeId}
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
                              alert(`Challenge: ${challenge.title}\n\nDescription: ${challenge.description}\n\nPoints: ${challenge.points}\n\nDue: ${challenge.dueDate}`);
                            } else {
                              alert(`Challenge ID: ${selectedChallengeId}\n\nThis challenge is not loaded in your current session. Please refresh the page.`);
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
                          type: "Symbolic AI / Expert System",
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

            {/* Metadata Form */}
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
                    placeholder="Your name"
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

            {/* Code Editor */}
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
                      const header = generateHeader();
                      navigator.clipboard.writeText(header);
                      alert(t?.('header_copied') || "Header copied to clipboard!");
                    }}
                  >
                    <Copy className="w-3 h-3" /> {t?.('copy_header') || "Copy Header"}
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

        {/* Submissions View */}
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
                              
                              {sub.evaluation?.score && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                                  sub.evaluation.score >= 80 ? 'bg-green-500/20 text-green-500' :
                                  sub.evaluation.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                                  'bg-red-500/20 text-red-500'
                                }`}>
                                  Grade: {sub.evaluation.score}%
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
                              
                              {sub.evaluation && (
                                <button
                                  onClick={() => handleShowEvaluation(sub)}
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

        {/* Messaging Modal */}
        <AnimatePresence>
          {showMessaging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowMessaging(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {selectedMessageUser?.type === 'community' 
                      ? `${t?.('message_community') || "Message Community"}: ${selectedMessageUser?.username}`
                      : selectedMessageUser
                      ? `${t?.('message') || "Message"}: ${selectedMessageUser?.username}`
                      : t?.('messages') || "Messages"}
                  </h3>
                  <button
                    onClick={() => setShowMessaging(false)}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Message Input */}
                  <div>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t?.('type_message_here') || "Type your message here..."}
                      className={`w-full h-32 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } border`}
                    />
                    
                    <div className="flex justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedMessageUser?.uid || ""}
                          onChange={(e) => {
                            const selected = allUsers.find(u => u.uid === e.target.value) || 
                                          communities.find(c => c.id === e.target.value);
                            setSelectedMessageUser(selected || null);
                          }}
                          className={`px-3 py-2 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          } border`}
                        >
                          <option value="">{t?.('select_recipient') || "Select recipient"}</option>
                          <optgroup label={t?.('communities') || "Communities"}>
                            {communities.map(community => (
                              <option key={community.id} value={community.id}>
                                👥 {community.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label={t?.('teachers') || "Teachers"}>
                            {allUsers.filter(u => u.role === 'teacher').map(teacher => (
                              <option key={teacher.uid} value={teacher.uid}>
                                👨‍🏫 {teacher.username}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      
                      <button
                        onClick={() => handleSendMessage(selectedMessageUser?.type === 'community' ? 'community' : 'direct')}
                        disabled={!newMessage.trim() || !selectedMessageUser}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 inline mr-2" />
                        {t?.('send') || "Send"}
                      </button>
                    </div>
                  </div>
                  
                  {/* Message History */}
                  <div>
                    <h4 className="font-medium mb-4">{t?.('message_history') || "Message History"}</h4>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.senderId === user?.uid
                              ? theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'
                              : theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">
                              {msg.senderName === (userData?.fullName || user?.email?.split('@')[0]) 
                                ? t?.('you') || "You" 
                                : msg.senderName}
                            </div>
                            <div className="text-xs opacity-70">
                              {msg.timestamp?.toDate ? 
                                new Date(msg.timestamp.toDate()).toLocaleTimeString() : 
                                'Recently'}
                            </div>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                          {!msg.read && msg.receiverId === user?.uid && (
                            <div className="text-xs text-green-500 mt-1">New</div>
                          )}
                        </div>
                      ))}
                      
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            {t?.('no_messages_yet') || "No messages yet"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evaluation Modal */}
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
                  
                  {selectedSubmission.evaluation ? (
                    <>
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-2 ${
                          selectedSubmission.evaluation.score! >= 80 ? 'text-green-500' :
                          selectedSubmission.evaluation.score! >= 60 ? 'text-yellow-500' :
                          'text-red-500'
                        }`}>
                          {selectedSubmission.evaluation.score}%
                        </div>
                        <div className={`px-4 py-2 rounded-full inline-block text-sm font-medium ${
                          selectedSubmission.evaluation.score! >= 80 ? 'bg-green-500/20 text-green-500' :
                          selectedSubmission.evaluation.score! >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {selectedSubmission.evaluation.score! >= 80 ? t?.('excellent') || 'Excellent' :
                           selectedSubmission.evaluation.score! >= 60 ? t?.('good') || 'Good' :
                           t?.('needs_improvement') || 'Needs Improvement'}
                        </div>
                      </div>
                      
                      {selectedSubmission.evaluation.feedback && (
                        <div>
                          <h5 className="font-medium mb-2">{t?.('feedback') || "Feedback"}:</h5>
                          <div className={`p-4 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                          }`}>
                            <p className="whitespace-pre-wrap">{selectedSubmission.evaluation.feedback}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedSubmission.evaluation.gradedAt && (
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t?.('graded_on') || "Graded on"}: {new Date(selectedSubmission.evaluation.gradedAt).toLocaleDateString()}
                        </div>
                      )}
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
    </div>
  );
}
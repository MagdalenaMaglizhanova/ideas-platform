import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, Target,
  Brain, Users as GroupIcon, Coffee, 
  Sparkles, ChevronRight,
  BarChart3, X,
  BookOpen, Calendar,
  Upload, FileCode, FileText,
  Folder, Search, Download, Eye,
  Edit, Trash2,
  GraduationCap, FolderOpen,
  Plus, RefreshCw, FileUp,
  Activity,
  Bell,
  MessageCircle,
  Send,
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
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  setDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from "firebase/firestore";
import { supabase } from "../services/supabase";
import MessagesTab from "../components/MessagesTab";
import AssignmentGradingModal from "./AssignmentGradingModal";
import LessonViewModal from "../components/LessonViewModal";
import LessonFormModal from "../components/LessonFormModal";
import TeacherChallenges from './TeacherChallenges';
import type { ChallengeNotification } from './TeacherChallenges';
import TeacherAssignments from './TeacherAssignments';

// Общност
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

//Уроци
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

// интерфейс за съобщения
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
  type: 'direct' | 'community' | 'broadcast' | string; // Добавете | string
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

//Ученици
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

const folders = ["animals", "geography", "history", "mineralwater", "balkan"];
const courses = [
  { id: 1, title: "Prolog Basics", description: "Introduction to Prolog programming", progress: 70, color: "#FF6B8B", icon: "💻" },
  { id: 2, title: "Expert Systems", description: "Build intelligent systems", progress: 45, color: "#36D1DC", icon: "🧠" },
  { id: 3, title: "Logical Rules", description: "Advanced logic programming", progress: 85, color: "#FFD166", icon: "⚡" },
  { id: 4, title: "AI Fundamentals", description: "Artificial Intelligence basics", progress: 30, color: "#9D4EDD", icon: "🤖" },
  { id: 5, title: "Data Structures", description: "Prolog data organization", progress: 60, color: "#4CC9F0", icon: "🗂️" },
  { id: 6, title: "Problem Solving", description: "Solve real-world problems", progress: 25, color: "#FF9E6D", icon: "🎯" },
];

export default function TeacherDashboard() {
  const { user: _currentUser, userData } = useAuth();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  // State променливи
  const [allUsers, setAllUsers] = useState<Array<{
    uid: string;
    username: string;
    email: string;
    role: string;
  }>>([]);

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
  const [showNotifications, setShowNotifications] = useState(false); 
  const [allSystemUsers, setAllSystemUsers] = useState<Array<{
    uid: string;
    username: string;
    email: string;
    role: string;
    fullName?: string;
    class?: string;
    communityId?: string;
    communityStatus?: string;
  }>>([]);
  
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
  
  // state променливи
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
  const [newLesson, setNewLesson] = useState({ title: '', description: '' });
  const [_activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [challengeNotifications, setChallengeNotifications] = useState<ChallengeNotification[]>([]);
  // States for lessons
const [lessons, setLessons] = useState<Lesson[]>([]);
const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);
const [showLessonForm, setShowLessonForm] = useState(false);
const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
const [lessonSearch, setLessonSearch] = useState('');
const [lessonFilter, setLessonFilter] = useState('all'); 

// Зареждане на уроците
const loadLessons = async () => {
  if (!user) return;
  
  try {
    const q = query(
      collection(db, "lessons"),
      where("teacherId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    const lessonsData: Lesson[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      lessonsData.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        content: data.content || "",
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        teacherAvatar: data.teacherAvatar,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        category: data.category || t?.('programming') || "Programming",
        color: data.color || "#3B82F6",
        icon: data.icon || "📚",
        status: data.status || 'draft',
        tags: data.tags || [],
        attachments: data.attachments || [],
        estimatedTime: data.estimatedTime || '1 hour',
        difficulty: data.difficulty || 'beginner',
        visibility: data.visibility || 'private',
        language: data.language || 'en',
        prerequisites: data.prerequisites || [],
        learningObjectives: data.learningObjectives || [],
        views: data.views || 0,
        likes: data.likes || [],
        students: data.students || [],
        rating: data.rating || 0,
        totalRatings: data.totalRatings || 0
      });
    });
    
    setLessons(lessonsData);
  } catch (error) {
    console.error("Error loading lessons:", error);
  }
};

// Запазване на урок
const handleSaveLesson = async (lessonData: any) => {
  if (!user) return;

  try {
    if (editingLesson) {
      await updateDoc(doc(db, "lessons", editingLesson.id), {
        ...lessonData,
        updatedAt: serverTimestamp()
      });
      setUploadStatus("✅ " + (t?.('lesson_updated') || "Lesson updated successfully!"));
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
        students: [],
        rating: 0,
        totalRatings: 0
      });
      setUploadStatus("✅ " + (t?.('lesson_created') || "Lesson created successfully!"));
    }
    
    loadLessons();
  } catch (error) {
    console.error("Error saving lesson:", error);
    setUploadStatus("❌ " + (t?.('error_saving_lesson') || "Error saving lesson!"));
  }
};

// Изтриване на урок
const handleDeleteLesson = async (lessonId: string) => {
  if (!window.confirm(t?.('confirm_delete_lesson') || "Are you sure you want to delete this lesson?")) return;
  
  try {
    await deleteDoc(doc(db, "lessons", lessonId));
    setUploadStatus("✅ " + (t?.('lesson_deleted') || "Lesson deleted successfully!"));
    loadLessons();
    setViewingLesson(null);
  } catch (error) {
    console.error("Error deleting lesson:", error);
    setUploadStatus("❌ " + (t?.('error_deleting_lesson') || "Error deleting lesson!"));
  }
};

// Филтриране на уроци
const filteredLessons = lessons.filter(lesson => {
  const matchesSearch = lessonSearch === '' || 
    lesson.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
    lesson.description.toLowerCase().includes(lessonSearch.toLowerCase()) ||
    lesson.tags.some(tag => tag.toLowerCase().includes(lessonSearch.toLowerCase()));
  
  const matchesFilter = lessonFilter === 'all' || lesson.status === lessonFilter;
  
  return matchesSearch && matchesFilter;
});

useEffect(() => {
  if (selectedTab === "courses" && user) {
    loadLessons();
  }
}, [selectedTab, user]);

  // Grading states
  const [_selectedPoints, setSelectedPoints] = useState<{[key: string]: number}>({});
  const [_feedbackText, setFeedbackText] = useState<{[key: string]: string}>({});


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

// Нова функция за запазване на оценката
const handleSaveGrade = async (gradingData: {
  points: number;
  feedback: string;
  assignmentId: string;
  fileId: string;
  studentId: string;
}): Promise<void> => {
  try {
    console.log("Saving grade...", gradingData);

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
      teacherName: userData?.fullName || user?.email?.split('@')[0] || t?.('teacher') || "Teacher"
    });

    const gradeRef = doc(collection(db, "grades"));
    
    const gradeData = {
      ...gradingData,
      fileName: fileData?.originalFileName || fileData?.title || t?.('unknown_file') || "Unknown file",
      fileCreatedAt: fileData?.createdAt,
      fileFolder: fileData?.folder || "general",
      studentName: studentData?.fullName || 
                  studentData?.email?.split('@')[0] || 
                  t?.('unknown_student') || "Unknown Student",
      studentEmail: studentData?.email || "",
      studentClass: studentData?.class || "N/A",
      assignmentTitle: assignmentData?.title || t?.('general_assignment') || "General Assignment",
      assignmentDescription: assignmentData?.description || t?.('no_description') || "No description",
      assignmentDifficulty: assignmentData?.difficulty || "medium",
      assignmentPoints: assignmentData?.points || 100,
      teacherId: user?.uid,
      teacherName: userData?.fullName || user?.email?.split('@')[0] || t?.('teacher') || "Teacher",
      teacherInstitution: userData?.institution || "Unknown",
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
        assignmentTitle: assignmentData?.title || t?.('general_assignment') || "General Assignment",
        fileId: gradingData.fileId,
        fileName: fileData?.originalFileName || t?.('unknown_file') || "Unknown file",
        gradedAt: new Date().toISOString(),
        gradedBy: user?.uid,
        teacherName: userData?.fullName || user?.email?.split('@')[0] || t?.('teacher') || "Teacher",
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
                teacherName: userData?.fullName || user?.email?.split('@')[0] || t?.('teacher') || "Teacher"
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
                  newAveragePoints >= 5 ? 'warning' : 'inactive'
        };
      }
      return student;
    }));

    try {
      const notificationRef = doc(collection(db, 'messages'));
      await setDoc(notificationRef, {
        senderId: user?.uid,
        senderName: "System",
        receiverId: gradingData.studentId,
        receiverName: studentData?.fullName || studentData?.email?.split('@')[0] || t?.('student') || "Student",
        content: (t?.('grade_notification') || 'Your work "{file}" has been graded. Points: {points}/10. Feedback: {feedback}')
          .replace('{file}', fileData?.originalFileName || 'file')
          .replace('{points}', gradingData.points.toString())
          .replace('{feedback}', gradingData.feedback.substring(0, 50) + (gradingData.feedback.length > 50 ? '...' : '')),
        timestamp: serverTime,
        read: false,
        type: 'grade_notification',
        gradeId: gradeRef.id,
        assignmentTitle: assignmentData?.title || t?.('general_assignment') || "General Assignment"
      });
      
      console.log("Grade notification sent to student");
    } catch (notificationError) {
      console.error("Error sending grade notification:", notificationError);
    }

    try {
      await addDoc(collection(db, "activityLogs"), {
        userId: gradingData.studentId,
        userName: studentData?.fullName || studentData?.email?.split('@')[0] || t?.('student') || "Student",
        teacherId: user?.uid,
        teacherName: userData?.fullName || user?.email?.split('@')[0] || t?.('teacher') || "Teacher",
        action: t?.('grade_assigned') || "Grade Assigned",
        details: (t?.('grade_assigned_details') || 'Assigned {points}/10 points for "{file}"')
          .replace('{points}', gradingData.points.toString())
          .replace('{file}', fileData?.originalFileName || 'file'),
        target: `grade_${gradeRef.id}`,
        actionType: "grading",
        timestamp: serverTime,
        metadata: {
          points: gradingData.points,
          assignmentId: gradingData.assignmentId,
          fileId: gradingData.fileId,
          assignmentTitle: assignmentData?.title || t?.('general_assignment') || "General Assignment"
        }
      });
    } catch (logError) {
      console.error("Error adding activity log:", logError);
    }
    setUploadStatus("✅ " + (t?.('grade_saved') || "Grade saved successfully! Student has been notified."));
    return;
    
  } catch (error) {
    console.error("Error saving grade:", error);
    
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error);
    console.error("Error details:", errorDetails);
    setUploadStatus("❌ " + (t?.('error_saving_grade') || "Error saving grade! Check console for details."));
    throw new Error(`Failed to save grade: ${errorDetails}`);
  }
};

// Helper функция за изчисляване на средна оценка
const calculateAveragePoints = (grades: any[]): number => {
  if (grades.length === 0) return 0;
  
  const sum = grades.reduce((total, grade) => {
    return total + (grade.points || grade.grade || 0);
  }, 0);
  
  return parseFloat((sum / grades.length).toFixed(1));
};
console.log(calculateAveragePoints)
// Функция за отваряне на модала за оценяване
const openGradingModal = (student: Student, assignmentId?: string) => {
  setGradingModal({
    isOpen: true,
    studentName: student.username,
    studentId: student.uid || '',
    files: student.files,
    assignmentId
  });
};

  // UI states
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);
  
  // Statistics states
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    pendingApprovals: 0,
    totalSubmissions: 0,
    averagePoints: 0,
    successRate: 0,
    lessonProgress: 0,
    communityMembers: 0,
    activeChallenges: 0
  });
  
  // Theme classes
  const themeClasses = {
    light: {
      background: "bg-gray-50",
      text: "text-gray-900",
      sidebar: "bg-white border-gray-200",
      card: "bg-white border-gray-200",
      input: "bg-white border-gray-300",
      hover: "hover:bg-gray-100",
    },
    dark: {
      background: "bg-gray-900",
      text: "text-white",
      sidebar: "bg-gray-800 border-gray-700",
      card: "bg-gray-800 border-gray-700",
      input: "bg-gray-700 border-gray-600",
      hover: "hover:bg-gray-700",
    }
  };

  const currentTheme = themeClasses[theme];
  
  // Зареждане на всички потребители
  const loadAllUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: Array<{
        uid: string;
        username: string;
        email: string;
        role: string;
      }> = [];
      
      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        usersData.push({
          uid: doc.id,
          username: user.fullName || user.email?.split('@')[0] || `User_${doc.id.substring(0, 6)}`,
          email: user.email || "",
          role: user.role || 'student'
        });
      });
      
      setAllUsers(usersData);
    } catch (error) {
      console.error("Error loading all users:", error);
    }
  };

  // Зареждане на съобщенията
  useEffect(() => {
    if (!user) return;
    
    const messagesQuery = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      orderBy("timestamp", "desc")
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
          type: data.type || 'direct'
        });
      });
      
      setMessages(messagesData);
    });
    
    return () => unsubscribe();
  }, [user]);
  
  // Зареждане на общностите
  useEffect(() => {
    if (!user) return;
    
    const communitiesQuery = query(
      collection(db, "communities"),
      where("teacherId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(communitiesQuery, (snapshot) => {
      const communitiesData: Community[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        communitiesData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          teacherId: data.teacherId,
          institution: data.institution || userData?.institution || "Unknown",
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
      if (communitiesData.length > 0 && !selectedCommunity) {
        setSelectedCommunity(communitiesData[0].id);
      }
      console.log("DEBUG: onSnapshot - communities updated:", {
        count: communitiesData.length,
        selectedCommunity
      });
    });
    return () => unsubscribe();
  }, [user, userData]);

  // Зареждане на общности, предизвикателства и потребители
  useEffect(() => {
    if (userData?.role === 'teacher' && user) {
      loadCommunities();
      loadAllSystemUsers();
    }
  }, [user, userData]);

  // Зареждане на всички потребители в системата
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

  useEffect(() => {
    if (
      (selectedTab === "dashboard" || selectedTab === "students") &&
      (userData?.role === 'teacher' || userData?.role === 'admin') &&
      communities.length > 0
    ) {
      loadAllStudentsData();
      loadActivityLogs();
    }
  }, [selectedTab, userData?.role, communities]);

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
          institution: data.institution || userData?.institution || "Unknown",
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
      if (communitiesData.length > 0 && !selectedCommunity) {
        setSelectedCommunity(communitiesData[0].id);
      }
      console.log("DEBUG: Loaded communities:", {
        count: communitiesData.length,
        communities: communitiesData.map(c => ({ id: c.id, name: c.name })),
        selectedCommunity
      });
      
    } catch (error) {
      console.error("Error loading communities:", error);
    }
  };

  const loadAllSystemUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: Array<{
        uid: string;
        username: string;
        email: string;
        role: string;
        fullName?: string;
        class?: string;
        communityId?: string;
        communityStatus?: string;
      }> = [];
      
      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        usersData.push({
          uid: doc.id,
          username: user.fullName || user.email?.split('@')[0] || `User_${doc.id.substring(0, 6)}`,
          fullName: user.fullName,
          email: user.email || "",
          role: user.role || 'student',
          class: user.class || 'N/A',
          communityId: user.communityId || null,
          communityStatus: user.communityStatus || null
        });
      });
      
      setAllSystemUsers(usersData);
      console.log("📋 Loaded all system users:", usersData.length);
    } catch (error) {
      console.error("Error loading all system users:", error);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        read: true
      });
      loadMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadMessages = messages.filter(m => !m.read && m.receiverId === user?.uid);
      
      for (const msg of unreadMessages) {
        await updateDoc(doc(db, 'messages', msg.id), {
          read: true
        });
      }
      
      loadMessages();
      setUploadStatus("✅ " + (t?.('all_messages_read') || "All messages marked as read!"));
    } catch (error) {
      console.error("Error marking all messages as read:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t?.('confirm_delete_message') || "Are you sure you want to delete this message?")) return;
    
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      loadMessages();
      setUploadStatus("✅ " + (t?.('message_deleted') || "Message deleted!"));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      const receivedQ = query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      
      const sentQ = query(
        collection(db, "messages"),
        where("senderId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(50)
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
          type: data.type || 'direct'
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
          type: data.type || 'direct'
        });
      });
      
      allMessages.sort((a, b) => 
        (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)
      );
      
      setMessages(allMessages);
      
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleCreateCommunity = async () => {
    if (!user || !userData) {
      alert(t?.('login_as_teacher') || "Please login as a teacher!");
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
        institution: userData.institution || "Unknown",
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
      
      setUploadStatus("✅ " + (t?.('community_created') || "Community created successfully!"));
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
      
      console.log("DEBUG: Created new community:", {
        id: communityRef.id,
        name: newCommunity.name,
        selectedCommunity: communityRef.id
      });
      
    } catch (error) {
      console.error("Error creating community:", error);
      setUploadStatus("❌ " + (t?.('error_creating_community') || "Error creating community!"));
    }
  };

  const handleSendMessage = async (type: 'direct' | 'community' | 'broadcast' = 'direct') => {
    if (!user || !newMessage.trim()) return;

    try {
      let receivers: string[] = [];
      
      if (type === 'direct' && selectedStudent) {
        receivers = [selectedStudent.uid!];
      } else if (type === 'community' && selectedCommunity) {
        const community = getCurrentCommunity();
        receivers = community?.studentIds || [];
      } else if (type === 'broadcast') {
        receivers = allUsers.map(u => u.uid).filter(Boolean);
      }
      
      for (const receiverId of receivers) {
        const messageRef = doc(collection(db, 'messages'));
        
        const receiver = allUsers.find(u => u.uid === receiverId) || 
                        students.find(s => s.uid === receiverId) || 
                        { username: t?.('unknown_user') || "Unknown User", email: "" };
        
        const newMessageData: Message = {
          id: messageRef.id,
          senderId: user.uid,
          senderName: userData?.fullName || user.email?.split('@')[0] || t?.('teacher') || "Teacher",
          receiverId: receiverId,
          receiverName: receiver.username,
          content: newMessage,
          timestamp: serverTimestamp(),
          read: false,
          type: type
        };
        
        await setDoc(messageRef, newMessageData);
      }
      
      setNewMessage("");
      setUploadStatus(`✅ ${receivers.length} ` + (t?.('messages_sent') || "message(s) sent successfully!"));
      loadMessages();
      
    } catch (error) {
      console.error("Error sending message:", error);
      setUploadStatus("❌ " + (t?.('error_sending_message') || "Error sending message!"));
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
          type: data.type || 'direct'
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
          type: data.type || 'direct'
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
      
      setUploadStatus("✅ " + (t?.('student_approved') || "Student approved successfully!"));
      loadCommunities();
      
    } catch (error) {
      console.error("Error approving student:", error);
      setUploadStatus("❌ " + (t?.('error_approving_student') || "Error approving student!"));
    }
  };

  const handleRejectRequest = async (studentId: string, communityId: string) => {
    try {
      const communityRef = doc(db, 'communities', communityId);
      
      await updateDoc(communityRef, {
        pendingRequests: arrayRemove(studentId)
      });
      
      setUploadStatus("✅ " + (t?.('request_rejected') || "Request rejected!"));
      loadCommunities();
      
    } catch (error) {
      console.error("Error rejecting request:", error);
      setUploadStatus("❌ " + (t?.('error_rejecting_request') || "Error rejecting request!"));
    }
  };

  // Helper functions
  const getColorByIndex = (index: number): string => {
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#F44336', 
      '#9C27B0', '#00BCD4', '#FF5722', '#673AB7',
      '#3F51B5', '#009688'
    ];
    return colors[index % colors.length];
  };

  const getStatusClass = (points: number): string => {
    if (points >= 9) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (points >= 7) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (points >= 5) return "bg-gradient-to-r from-yellow-500 to-amber-500";
    if (points >= 3) return "bg-gradient-to-r from-orange-500 to-red-500";
    return "bg-gradient-to-r from-gray-500 to-gray-700";
  };

  const getStatusText = (points: number): string => {
    if (points >= 9) return t?.('excellent') || 'Excellent';
    if (points >= 7) return t?.('good') || 'Good';
    if (points >= 5) return t?.('average') || 'Average';
    if (points >= 3) return t?.('needs_improvement') || 'Needs Improvement';
    return t?.('poor') || 'Poor';
  };

  const getFileStatusText = (file: StudentFile): string => {
    if (file.status) {
      switch (file.status) {
        case "success": return t?.('status_success') || "Success";
        case "error": return t?.('status_error') || "Error";
        default: return t?.('status_pending') || "Pending";
      }
    }
    if (file.code.includes('ERROR') || file.code.includes('error')) return t?.('status_error') || "Error";
    if (file.code.length > 1000) return t?.('status_success') || "Success";
    return t?.('status_pending') || "Pending";
  };
console.log(getStatusClass, getFileStatusText, getStatusText)
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
          studentName: data.userName || data.user || t?.('unknown_student') || "Unknown Student",
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
      
      const sampleLogs = [
        {
          id: "1",
          studentId: "student-1",
          studentName: "John Doe",
          action: t?.('submitted_prolog_code') || "Submitted Prolog code",
          timestamp: new Date(),
          details: t?.('created_expert_system') || "Created expert system for biology project",
          file: "expert_system.pl",
          status: 'submitted'
        },
        {
          id: "2",
          studentId: "student-2",
          studentName: "Jane Smith",
          action: t?.('uploaded_assignment') || "Uploaded assignment file",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          details: t?.('completed_logical_rules') || "Completed assignment on logical rules",
          file: "assignment_1.pl",
          status: 'submitted'
        }
      ];
      setActivityLogs(sampleLogs);
    }
  };

  const loadAllStudentsData = async () => {
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

      console.log("DEBUG: My communities student IDs:", Array.from(myStudentIds));

      if (myStudentIds.size === 0) {
        console.log("DEBUG: No students found in your communities");
        setStudents([]);
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
          fullName: user.fullName || user.email?.split('@')[0] || `User_${doc.id.substring(0, 6)}`,
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
                           `User_${userId.substring(0, 6)}`;
          
          if (!filesByUserId[userId]) {
            filesByUserId[userId] = [];
          }
          
          filesByUserId[userId].push({
            id: doc.id,
            username: studentName,
            originalFileName: data.originalFileName || data.title || t?.('untitled') || "Untitled",
            storedFileName: data.storedFileName || "",
            code: data.code || t?.('no_code') || "No code",
            createdAt: data.createdAt,
            folder: data.folder || data.domain || t?.('uncategorized') || 'uncategorized',
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
          t?.('no_activity') || "No activity";

        const userObj: Student = {
          username: user.fullName,
          email: user.email,
          class: user.class,
          files: sortedFiles,
          totalFiles: studentFiles.length,
          lastUpload: lastActivity,
          role: role,
          averagePoints,
          status: averagePoints >= 7 ? 'active' : averagePoints >= 5 ? 'warning' : 'inactive',
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
      
      console.log("📊 DEBUG Loaded MY students:", {
        myStudentIdsCount: myStudentIds.size,
        loadedStudentsCount: sortedStudents.length,
        myStudents: sortedStudents.map(s => ({
          name: s.username,
          uid: s.uid,
          communityId: s.communityId
        }))
      });
      
      setStudents(sortedStudents);

      const totalMyStudents = sortedStudents.length;
      const activeMyStudents = sortedStudents.filter(s => s.status === 'active').length;
      const pendingApprovals = sortedStudents.filter(s => s.pendingApproval).length;
      const totalSubmissions = sortedStudents.reduce((sum, s) => sum + s.totalFiles, 0);
      const avgPoints = totalMyStudents > 0 ? 
        sortedStudents.reduce((sum, s) => sum + (s.averagePoints || 0), 0) / totalMyStudents : 0;
      
      setStats(prev => ({
        ...prev,
        totalStudents: totalMyStudents,
        activeStudents: activeMyStudents,
        pendingApprovals,
        totalSubmissions,
        averagePoints: avgPoints,
        successRate: totalMyStudents > 0 ? Math.round((activeMyStudents / totalMyStudents) * 100) : 0,
        lessonProgress: assignmentStats.total > 0
          ? Math.round((assignmentStats.active / assignmentStats.total) * 100) 
          : 0,
        communityMembers: communities.reduce((sum, c) => sum + c.memberCount, 0)
      }));
      
    } catch (error) {
      console.error("❌ " + (t?.('load_students_error') || "Error loading students:"), error);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !user) {
      console.error("❌ " + (t?.('no_file_user') || "No file or user:"), { file, user });
      setUploadStatus("❌ " + (t?.('no_file_user') || "No file selected or user not logged in"));
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pl')) {
      console.error("❌ " + (t?.('not_pl_file') || "Not a .pl file:"), file.name);
      setUploadStatus("❌ " + (t?.('only_pl_files') || "Only .pl files allowed"));
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
      const { data: _uploadData, error } = await supabase.storage
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
          
          const { data: _retryData, error: retryError } = await supabase.storage
            .from("prolog-files")
            .upload(newPath, file, { 
              upsert: false,
              cacheControl: '3600'
            });

          if (retryError) {
            setUploadStatus("❌ " + (t?.('upload_failed') || "Upload failed:") + " " + retryError.message);
            return;
          }
          
          path = newPath;
          finalFileName = newFinalFileName;
        } else {
          setUploadStatus("❌ " + (t?.('upload_failed') || "Upload failed:") + " " + error.message);
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

      console.log("✅ " + (t?.('upload_successful') || "Upload successful"));
      setUploadStatus("✅ " + (t?.('file_upload_success') || `File "${originalName}" uploaded as "${finalFileName}"`));
      setFile(null);
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error("❌ " + (t?.('catch_block_error') || "Catch block error:"), err);
      setUploadStatus("❌ " + (t?.('unexpected_error') || "An unexpected error occurred"));
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
      setUploadStatus("❌ " + (t?.('only_pl_files') || "Only .pl files allowed"));
    }
  };

  const handleAddLesson = () => {
    if (!newLesson.title.trim()) {
      alert(t?.('lesson_title_required') || "Lesson title is required");
      return;
    }

    const newCourse = {
      id: courses.length + 1,
      title: newLesson.title,
      description: newLesson.description || t?.('new_lesson_created') || "New lesson created",
      progress: 0,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      icon: "📚"
    };

    courses.push(newCourse);
    setNewLesson({ title: '', description: '' });
    setShowLessonForm(false);
  };

  const handleQuickPoints = (studentId: string, points: number) => {
    setSelectedPoints(prev => ({
      ...prev,
      [studentId]: points
    }));
  };

  const handleAddFeedbackTag = (studentId: string, tag: string) => {
    setFeedbackText(prev => ({
      ...prev,
      [studentId]: (prev[studentId] || "") + (prev[studentId] ? '\n' : '') + tag
    }));
  };

  const downloadFile = (file: StudentFile) => {
  const element = document.createElement('a');
  const fileBlob = new Blob([file.code], { type: 'text/plain' });
  console.log(downloadFile, handleAddFeedbackTag, handleQuickPoints)
  const fileName = file.originalFileName.endsWith('.pl') 
    ? file.originalFileName 
    : `${file.originalFileName}.pl`;
  
  element.href = URL.createObjectURL(fileBlob);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  URL.revokeObjectURL(element.href);
};

  const openFileInNewTab = (file: StudentFile) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${file.originalFileName}</title>
            <style>
              body { 
                font-family: monospace; 
                margin: 20px; 
                background: #1e1e1e; 
                color: #fff;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>${file.code}</body>
        </html>
      `);
      newWindow.document.close();
    }
  };

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
      // Зареждане на съобщенията между текущия потребител и threadId
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
          senderName: data.senderName || t?.('unknown') || "Unknown",
          receiverId: data.receiverId,
          receiverName: data.receiverName || t?.('unknown') || "Unknown",
          content: data.content,
          timestamp: data.timestamp,
          read: data.read || false,
          type: data.type || 'direct'
        });
      });
      
      setThreadMessages(messagesData);
    } catch (error) {
      console.error("Error loading thread messages:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const sendThreadMessage = async () => {
    if (!user || !threadId || !newThreadMessage.trim()) return;
    
    try {
      const messageRef = doc(collection(db, 'messages'));
      
      // Намерете името на получателя
      let receiverName = t?.('unknown') || "Unknown";
      
      // Първо проверете в students
      const student = students.find(s => s.uid === threadId);
      if (student) {
        receiverName = student.username;
      } else {
        // После проверете в communities
        const community = communities.find(c => c.id === threadId);
        if (community) {
          receiverName = community.name;
        } else {
          // Накрая проверете в allUsers
          const foundUser = allUsers.find(u => u.uid === threadId);
          if (foundUser) {
            receiverName = foundUser.username;
          }
        }
      }
      
      const newMessageData = {
        senderId: user.uid,
        senderName: userData?.fullName || user.email?.split('@')[0] || t?.('teacher') || "Teacher",
        receiverId: threadId,
        receiverName: receiverName,
        content: newThreadMessage,
        timestamp: serverTimestamp(),
        read: false,
        type: 'direct'
      };
      
      await setDoc(messageRef, newMessageData);
      
      // Добавете съобщението локално за по-бързо визуализиране
      const tempMessage: Message = {
        id: messageRef.id,
        ...newMessageData,
        timestamp: new Date() // временно
      };
      
      setThreadMessages(prev => [...prev, tempMessage]);
      setNewThreadMessage("");
      
      // Презаредете, за да получите правилния timestamp
      setTimeout(() => loadThreadMessages(), 100);
      
    } catch (error) {
      console.error("Error sending message:", error);
      alert(t?.('error_sending_message') || "Грешка при изпращане на съобщение!");
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
              {t?.('message_thread') || "Message Thread"} - {
                students.find(s => s.uid === threadId)?.username ||
                communities.find(c => c.id === threadId)?.name ||
                allUsers.find(u => u.uid === threadId)?.username ||
                threadId.substring(0, 8)
              }
            </h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
            {threadMessages.length === 0 && !loading ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {t?.('no_messages_yet') || "No messages yet"}
                </p>
                <p className="text-sm opacity-70 mt-2">
                  {t?.('start_conversation') || "Start the conversation by sending a message below"}
                </p>
              </div>
            ) : (
              threadMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.senderId === user?.uid
                      ? theme === 'dark' ? 'bg-blue-500/20 ml-auto' : 'bg-blue-100 ml-auto'
                      : theme === 'dark' ? 'bg-white/5 mr-auto' : 'bg-gray-100 mr-auto'
                  } max-w-[80%]`}
                >
                  <div className="font-medium text-sm mb-1">
                    {msg.senderName}
                    {msg.senderId === user?.uid && ` (${t?.('you') || 'You'})`}
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                  <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {msg.timestamp?.toDate 
                      ? new Date(msg.timestamp.toDate()).toLocaleString()
                      : msg.timestamp instanceof Date
                      ? msg.timestamp.toLocaleString()
                      : t?.('just_now') || 'Just now'}
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
              placeholder={t?.('type_message') || "Type your message..."}
              className={`flex-1 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
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
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
    );
};

  // Статистики
  const totalSubmissions = submissions.length;
  const successfulSubmissions = submissions.filter(s => s.status === "success").length;
  const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;
  const activeAssignments = assignmentStats.active; 
  console.log(successRate, activeAssignments)
  const studentActivities = [...students]
    .sort((a, b) => new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime())
    .slice(0, 5);

  const recommendations = [
    {
      id: 1,
      icon: <Target className="w-5 h-5" />,
      title: t?.('visual_examples') || "Visual Examples",
      description: t?.('visual_examples_desc') || "Students respond very well to graphs and diagrams.",
      color: "from-purple-500 to-pink-500",
      action: t?.('apply') || "Apply"
    },
    {
      id: 2,
      icon: <GroupIcon className="w-5 h-5" />,
      title: t?.('group_work') || "Group Work",
      description: t?.('group_work_desc') || "Start a group task for the next 15 minutes.",
      color: "from-blue-500 to-cyan-500",
      action: t?.('start') || "Start"
    },
    {
      id: 3,
      icon: <Coffee className="w-5 h-5" />,
      title: t?.('short_break') || "Short Break",
      description: t?.('short_break_desc') || "Attention is waning - a 2-minute break would help.",
      color: "from-amber-500 to-orange-500",
      action: t?.('create') || "Create"
    }
  ];

  const statsCards = [
    {
      title: t?.('my_students') || "My Students",
      value: students.filter(s => s.role === 'student').length,
      icon: <Users className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      change: `${students.filter(s => s.role === 'student' && s.status === 'active').length} ${t?.('active') || 'active'}`,
      description: t?.('students_in_my_communities') || "Students in my communities"
    },
    {
      title: t?.('my_communities') || "My Communities",
      value: communities.length,
      icon: <GroupIcon className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      change: `${stats.communityMembers} ${t?.('members') || 'members'}`,
      description: t?.('learning_communities') || "Learning communities"
    },
    {
      title: t?.('my_assignments') || "My Assignments",
      value: assignmentStats.total, 
      icon: <FileText className="w-6 h-6" />,
      color: "from-amber-500 to-orange-500",
      change: `${assignmentStats.active} ${t?.('active') || 'active'}`, 
      description: t?.('assignments_created_by_me') || "Assignments created by me"
    },
    {
      title: t?.('other_teachers') || "Other Teachers",
      value: allUsers.filter(u => u.role === 'teacher' && u.uid !== user?.uid).length,
      icon: <Users className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      change: t?.('in_system') || "In system",
      description: t?.('other_teachers_in_system') || "Other teachers in system"
    }
  ];

  const navItems = [
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
      badge: messages.filter(m => !m.read && m.receiverId === user?.uid && m.type === 'direct').length
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
      badge: null
    },
    { 
      id: "courses", 
      label: t?.('my_lessons') || "My Lessons", 
      icon: <BookOpen className="w-5 h-5" />,
      badge: courses.length
    },
    { 
      id: "assignments", 
      label: t?.('all_assignments') || "Assignments", 
      icon: <FileText className="w-5 h-5" />,
      badge: assignmentStats.total 
    },
    { 
      id: "students", 
      label: t?.('students') || "Students", 
      icon: <Users className="w-5 h-5" />,
      badge: students.length
    },
    { 
      id: "submissions", 
      label: t?.('submissions') || "Submissions", 
      icon: <Folder className="w-5 h-5" />,
      badge: submissions.length
    },
    { 
      id: "file-upload", 
      label: t?.('upload_file') || "Upload File", 
      icon: <FileCode className="w-5 h-5" />,
      badge: null
    },
  ];

  // Рендиране на общностите
  const renderCommunitiesView = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t?.('communities') || "Communities"}</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {t?.('manage_learning_communities') || "Manage your learning communities"}
          </p>
        </div>
        <button
          onClick={() => setShowCommunityForm(true)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t?.('create_community') || "Create Community"}
        </button>
      </div>

      {communities.length === 0 ? (
        <div className={`rounded-2xl p-12 border text-center ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          <GroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">
            {t?.('no_communities_yet') || "No communities yet"}
          </h3>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t?.('create_first_community') || "Create your first learning community to get started"}
          </p>
          <button
            onClick={() => setShowCommunityForm(true)}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {t?.('create_first_community') || "Create First Community"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {communities.map((community) => (
              <button
                key={community.id}
                onClick={() => setSelectedCommunity(community.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all ${
                  selectedCommunity === community.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent'
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
                      {community.memberCount} {t?.('members') || 'members'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

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
                      {getCurrentCommunity()?.isPublic ? t?.('public') || 'Public' : t?.('private') || 'Private'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMessaging(true)}
                    className={`px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors flex items-center gap-2`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {t?.('message_all') || "Message All"}
                  </button>
                </div>
              </div>

              {getCurrentCommunity()?.pendingRequests && getCurrentCommunity()!.pendingRequests.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold mb-3">{t?.('pending_requests') || "Pending Requests"} ({getCurrentCommunity()!.pendingRequests.length})</h4>
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
                              {t?.('approve') || "Approve"}
                            </button>
                            <button
                              onClick={() => handleRejectRequest(studentId, selectedCommunity!)}
                              className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                            >
                              {t?.('reject') || "Reject"}
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
                              <div className="font-medium">{t?.('unknown_user') || "Unknown User"}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t?.('id') || "ID"}: {studentId.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(studentId, selectedCommunity!)}
                              className="px-3 py-1 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors"
                            >
                              {t?.('approve') || "Approve"}
                            </button>
                            <button
                              onClick={() => handleRejectRequest(studentId, selectedCommunity!)}
                              className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                            >
                              {t?.('reject') || "Reject"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold">{t?.('members') || "Members"} ({getCurrentCommunity()?.memberCount || 0})</h4>
                  <button
                    onClick={() => setSelectedTab("students")}
                    className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                  >
                    {t?.('view_all') || "View All"} →
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
    <TeacherChallenges 
      communities={communities}
      selectedCommunityId={selectedCommunity}
      onCommunityChange={(communityId) => {
        console.log("🔄 Смяна на community към:", communityId);
        setSelectedCommunity(communityId);
      }}
      onUpdate={() => {
        loadCommunities();
      }}
      onNewChallenge={(challenge) => {
        setUploadStatus(`✅ ${t?.('challenge_sent') || 'Challenge'} "${challenge.title}" ${t?.('sent_successfully') || 'sent successfully'}!`);
        setTimeout(() => setUploadStatus(""), 3000);
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
      }}
    />
  );

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-28`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-400" />
              </div>
              <span>{t?.('teacher_dashboard') || "Teacher Dashboard"}</span>
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t?.('welcome_back') || "Welcome back"}, {userData?.fullName || user?.email?.split('@')[0] || t?.('teacher') || "Teacher"}!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                loadAllMessages();
                setShowMessaging(true);
              }}
              className={`relative p-2 rounded-lg ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              
              {(() => {
                const unreadDirect = messages.filter(m => 
                  !m.read && m.receiverId === user?.uid && m.type === 'direct'
                ).length;
                
                if (unreadDirect > 0) {
                  return (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadDirect}
                    </span>
                  );
                }
                return null;
              })()}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Bell className="w-5 h-5" />
                
                {(() => {
                  const pendingRequestsCount = communities.reduce((total, community) => 
                    total + community.pendingRequests.length, 0
                  );
                  
                  const unreadMessagesCount = messages.filter(m => 
                    !m.read && m.receiverId === user?.uid
                  ).length;
                  
                  const totalNotifications = pendingRequestsCount + unreadMessagesCount;
                  
                  if (totalNotifications > 0) {
                    return (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {totalNotifications}
                      </span>
                    );
                  }
                  return null;
                })()}
              </button>
              
              {/* Падащо меню за нотификации */}
              {showNotifications && (
                <div 
                  className={`absolute right-0 mt-2 w-96 rounded-xl border shadow-lg z-50 ${
                    theme === 'dark' 
                      ? 'bg-gray-900 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">{t?.('notifications') || "Notifications"}</h4>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {(() => {
                        const allNotifications: Array<{
                          id: string;
                          type: 'pending_request' | 'direct_message' | 'challenge';
                          title: string;
                          description: string;
                          communityId?: string;
                          studentId?: string;
                          challengeId?: string;
                          timestamp: any;
                          read: boolean;
                        }> = [];
                        
                        communities.forEach(community => {
                          community.pendingRequests.forEach(studentId => {
                            const student = students.find(s => s.uid === studentId);
                            allNotifications.push({
                              id: `${community.id}-${studentId}`,
                              type: 'pending_request',
                              title: t?.('join_request') || 'Join Request',
                              description: (t?.('student_wants_to_join') || '{student} wants to join "{community}"')
                                .replace('{student}', student?.username || t?.('student') || 'Student')
                                .replace('{community}', community.name),
                              communityId: community.id,
                              studentId: studentId,
                              timestamp: community.createdAt,
                              read: false
                            });
                          });
                        });
                        
                        messages
                          .filter(m => !m.read && m.receiverId === user?.uid)
                          .forEach(msg => {
                            allNotifications.push({
                              id: msg.id,
                              type: 'direct_message',
                              title: t?.('new_message') || 'New Message',
                              description: `${msg.senderName}: ${msg.content.substring(0, 60)}${msg.content.length > 60 ? '...' : ''}`,
                              studentId: msg.senderId,
                              timestamp: msg.timestamp,
                              read: msg.read
                            });
                          });

                        challengeNotifications.forEach(notification => {
                          allNotifications.push({
                            id: notification.id,
                            type: 'challenge',
                            title: notification.title,
                            description: notification.description,
                            communityId: notification.targetCommunityId,
                            challengeId: notification.challengeId,
                            timestamp: notification.timestamp,
                            read: notification.read
                          });
                        });
                        
                        allNotifications.sort((a, b) => 
                          (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)
                        );
                        
                        if (allNotifications.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                {t?.('no_notifications') || "No notifications"}
                              </p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-3">
                            {allNotifications.map(notification => (
                              <div
                                key={notification.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                  theme === 'dark' 
                                    ? 'hover:bg-white/5 border-white/10' 
                                    : 'hover:bg-gray-50 border-gray-200'
                                }`}
                                onClick={() => {
                                  setShowNotifications(false);
                                  
                                  if (notification.type === 'pending_request') {
                                    setSelectedCommunity(notification.communityId || null);
                                    setSelectedTab('communities');
                                  } else if (notification.type === 'direct_message') {
                                    setActiveThread(notification.studentId || null);
                                    setShowMessaging(true);
                                  } else if (notification.type === 'challenge') {
                                    setSelectedTab('challenges');
                                  }
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    notification.type === 'pending_request'
                                      ? 'bg-amber-500/20 text-amber-500'
                                      : notification.type === 'challenge'
                                      ? 'bg-purple-500/20 text-purple-500'
                                      : 'bg-blue-500/20 text-blue-500'
                                  }`}>
                                    {notification.type === 'pending_request' ? (
                                      <UserPlus className="w-5 h-5" />
                                    ) : notification.type === 'challenge' ? (
                                      <Target className="w-5 h-5" />
                                    ) : (
                                      <MessageCircle className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="font-medium text-sm">
                                        {notification.title}
                                      </div>
                                      {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      )}
                                    </div>
                                    <div className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {notification.description}
                                    </div>
                                    <div className="text-xs opacity-70">
                                      {new Date(notification.timestamp?.toMillis?.() || Date.now()).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {(() => {
                      const pendingRequestsCount = communities.reduce((total, community) => 
                        total + community.pendingRequests.length, 0
                      );
                      
                      const unreadMessagesCount = messages.filter(m => 
                        !m.read && m.receiverId === user?.uid
                      ).length;
                      
                      const total = pendingRequestsCount + unreadMessagesCount;
                      
                      if (total > 0) {
                        return (
                          <div className={`mt-4 pt-4 ${theme === 'dark' ? 'border-t border-white/10' : 'border-t border-gray-200'}`}>
                            <button
                              onClick={async () => {
                                try {
                                  const unreadMessages = messages.filter(m => !m.read && m.receiverId === user?.uid);
                                  
                                  for (const msg of unreadMessages) {
                                    await updateDoc(doc(db, 'messages', msg.id), {
                                      read: true
                                    });
                                  }
                                  
                                  loadMessages();
                                  setShowNotifications(false);
                                } catch (error) {
                                  console.error("Error marking messages as read:", error);
                                }
                              }}
                              className="w-full py-2 text-sm text-blue-500 hover:text-blue-600"
                            >
                              {t?.('mark_all_as_read') || "Mark all as read"}
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
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
                {item.badge !== null && item.badge !== undefined && (
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

        {/* Dashboard View */}
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
                      stat.change.includes('active') 
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
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> {t?.('my_students_activities') || "My Students Activities"}
                  </h3>
                  
                  <div className="space-y-4">
                    {studentActivities.map((student, index) => (
                      <div
                        key={student.username}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold`}
                             style={{ backgroundColor: getColorByIndex(index) }}>
                          {student.username.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{student.username}</h4>
                            {student.pendingApproval && (
                              <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-500">
                                {t?.('pending_approval') || "Pending"}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {student.lastActivity || t?.('no_activity') || "No activity"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {t?.('files') || "Files"}: {student.totalFiles}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {t?.('points') || "Points"}: {student.averagePoints?.toFixed(1) || "0.0"}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${
                              student.status === 'active' ? 'bg-green-500/20 text-green-500' :
                              student.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {student.status}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setViewingStudentFiles(student.username)}
                          className={`p-2 rounded-lg ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {studentActivities.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {t?.('no_student_activities') || "No student activities yet"}
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
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <GroupIcon className="w-5 h-5" /> {t?.('my_communities') || "My Communities"}
                  </h3>
                  
                  {communities.length === 0 ? (
                    <div className="text-center py-8">
                      <GroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('no_communities_dashboard') || "You haven't created any communities yet"}
                      </p>
                      <button
                        onClick={() => setSelectedTab("communities")}
                        className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                      >
                        {t?.('create_community') || "Create Community"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {communities.slice(0, 3).map((community) => (
                        <div
                          key={community.id}
                          className={`flex items-center justify-between p-4 rounded-xl border ${
                            theme === 'dark' 
                              ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              community.isPublic
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              <GroupIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-medium">{community.name}</h4>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {community.memberCount} {t?.('members') || 'members'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {community.pendingRequests.length > 0 && (
                              <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-500">
                                {community.pendingRequests.length} {t?.('pending') || 'pending'}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setSelectedCommunity(community.id);
                                setSelectedTab("communities");
                              }}
                              className={`px-3 py-1 rounded text-sm ${
                                theme === 'dark' 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {t?.('view') || "View"}
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => setSelectedTab("communities")}
                        className={`w-full py-3 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-white/5 hover:bg-white/10' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors flex items-center justify-center gap-2`}
                      >
                        <ChevronRight className="w-4 h-4" />
                        {t?.('view_all_communities') || "View All Communities"}
                      </button>
                    </div>
                  )}
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

        {/* Communities View */}
        {selectedTab === "communities" && renderCommunitiesView()}

        {/* Challenges View */}
        {selectedTab === "challenges" && (
          communities.length === 0 ? (
            <div className={`rounded-2xl p-12 border text-center ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                : 'bg-white border-gray-200'
            }`}>
              <GroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{t?.('no_communities_yet') || "No Communities Yet"}</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t?.('need_community_for_challenges') || "You need to create a community before you can create challenges."}
              </p>
              <button
                onClick={() => setSelectedTab("communities")}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {t?.('create_first_community') || "Create Your First Community"}
              </button>
            </div>
          ) : !selectedCommunity ? (
            <div className={`rounded-2xl p-12 border text-center ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                : 'bg-white border-gray-200'
            }`}>
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{t?.('no_community_selected') || "No Community Selected"}</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {t?.('select_community_for_challenges') || "Please select a community from the Communities tab to view and manage challenges."}
              </p>
              <button
                onClick={() => setSelectedTab("communities")}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
              >
                {t?.('go_to_communities') || "Go to Communities"}
              </button>
            </div>
          ) : (
            renderChallengesView()
          )
        )}

        {/* Courses/Lessons View */}
        {selectedTab === "courses" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t?.('my_lessons') || "My Lessons"}</h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {filteredLessons.length} {t?.('lessons') || 'lessons'} • {lessons.filter(l => l.status === 'published').length} {t?.('published') || 'published'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder={t?.('search_lessons') || "Search lessons..."}
                    value={lessonSearch}
                    onChange={(e) => setLessonSearch(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <select
                  value={lessonFilter}
                  onChange={(e) => setLessonFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">{t?.('all_lessons') || "All Lessons"}</option>
                  <option value="published">{t?.('published') || "Published"}</option>
                  <option value="draft">{t?.('drafts') || "Drafts"}</option>
                  <option value="archived">{t?.('archived') || "Archived"}</option>
                </select>
                
                <button 
                  onClick={() => {
                    setEditingLesson(null);
                    setShowLessonForm(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t?.('add_new_lesson') || "Add New Lesson"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="text-2xl font-bold mb-1">{lessons.length}</div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('total_lessons') || "Total Lessons"}
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {lessons.filter(l => l.status === 'published').length}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('published') || "Published"}
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {lessons.filter(l => l.status === 'draft').length}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('drafts') || "Drafts"}
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="text-2xl font-bold mb-1">
                  {[...new Set(lessons.map(l => l.category))].length}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('categories') || "Categories"}
                </div>
              </div>
            </div>

            {filteredLessons.length === 0 ? (
              <div className={`rounded-2xl p-12 border text-center ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {lessonSearch || lessonFilter !== 'all' 
                    ? t?.('no_matching_lessons') || 'No matching lessons found' 
                    : t?.('no_lessons_yet') || "No lessons yet"}
                </h3>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {lessonSearch || lessonFilter !== 'all' 
                    ? t?.('try_changing_criteria') || 'Try changing your search or filter criteria'
                    : t?.('create_first_lesson') || "Create your first lesson to get started"}
                </p>
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setShowLessonForm(true);
                    setLessonSearch('');
                    setLessonFilter('all');
                  }}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  {t?.('create_first_lesson') || "Create First Lesson"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map((lesson) => (
                  <motion.div
                    key={lesson.id}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    className={`rounded-2xl p-6 border cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10 hover:border-white/20'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    } backdrop-blur-xl transition-all`}
                    onClick={() => setViewingLesson(lesson)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${lesson.color}20`, color: lesson.color }}
                        >
                          {lesson.icon}
                        </div>
                        <div>
                          <h3 className="font-bold line-clamp-1">{lesson.title}</h3>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {lesson.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          lesson.status === 'published' ? 'bg-green-500/20 text-green-500' :
                          lesson.status === 'draft' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {lesson.status === 'published' ? t?.('published') || 'published' :
                           lesson.status === 'draft' ? t?.('draft') || 'draft' :
                           t?.('archived') || 'archived'}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                          {lesson.estimatedTime || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <p className={`mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {lesson.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      {lesson.tags && lesson.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lesson.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded text-xs ${
                                theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {lesson.tags.length > 3 && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                            }`}>
                              +{lesson.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {new Date(lesson.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}
                        </span>
                        {lesson.attachments && lesson.attachments.length > 0 && (
                          <span className={`${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            <FileText className="w-4 h-4 inline mr-1" />
                            {lesson.attachments.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <span className="text-blue-400 font-bold text-sm">U</span>
                        </div>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {lesson.teacherName}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLesson(lesson);
                            setShowLessonForm(true);
                          }}
                          className={`p-2 rounded-lg ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                          }`}
                          title={t?.('edit') || "Edit"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingLesson(lesson);
                          }}
                          className={`p-2 rounded-lg ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                          }`}
                          title={t?.('view') || "View"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === "assignments" && (
          <TeacherAssignments 
            teacherId={user?.uid || ''}
            isTeacherOrAdmin={userData?.role === 'teacher' || userData?.role === 'admin'}
            onStatsChange={(stats) => {
              setAssignmentStats(stats);
              setStats(prev => ({
                ...prev,
                lessonProgress: stats.total > 0 
                  ? Math.round((stats.active / stats.total) * 100) 
                  : 0
              }));
            }}
          />
        )}

        {/* Students View */}
        {selectedTab === "students" && (userData?.role === 'teacher' || userData?.role === 'admin') && (
          <div className="mb-8">
            <div className={`rounded-2xl p-6 border ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                : 'bg-white border-gray-200'
            } backdrop-blur-xl`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {t?.('my_students') || "My Students"} ({students.filter(s => s.role === 'student').length})
                  </h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t?.('manage_students_subtitle') || "Review student submissions and assign grades"}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      placeholder={t?.('search_students') || "Search students..."}
                      className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <button
                    onClick={loadAllStudentsData}
                    disabled={loadingStudents}
                    className={`px-4 py-2 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors disabled:opacity-50`}
                  >
                    {loadingStudents ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500"></div>
                        {t?.('loading') || "Loading..."}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        {t?.('refresh') || "Refresh"}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {loadingStudents ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {t?.('no_students_found') || "No Students Found"}
                  </h3>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('no_students_description') || "No students with uploaded files found in the system."}
                  </p>
                  <button
                    onClick={loadAllStudentsData}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                  >
                    {t?.('try_again') || "Try Again"}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                        <th className="py-3 px-4 text-left font-medium">{t?.('student') || "Student"}</th>
                        <th className="py-3 px-4 text-left font-medium">{t?.('class') || "Class"}</th>
                        <th className="py-3 px-4 text-left font-medium">{t?.('files') || "Files"}</th>
                        <th className="py-3 px-4 text-left font-medium">{t?.('last_activity') || "Last Activity"}</th>
                        <th className="py-3 px-4 text-left font-medium">{t?.('avg_points') || "Avg Points"}</th>
                        <th className="py-3 px-4 text-left font-medium">{t?.('status') || "Status"}</th>
                        <th className="py-3 px-4 text-left font-medium">{t?.('actions') || "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={student.username} className={`border-b ${
                          theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'
                        }`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                style={{ backgroundColor: getColorByIndex(index) }}
                              >
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{student.username}</div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {student.email || t?.('no_email') || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                            }`}>
                              {student.class || t?.('na') || "N/A"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{student.totalFiles}</span>
                              {student.totalFiles > 0 && (
                                <span className={`text-xs ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  ({student.files.filter(f => f.points !== undefined).length} {t?.('graded') || 'graded'})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">{student.lastActivity}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{student.averagePoints?.toFixed(1) || "0.0"}/10</span>
                              <div className={`w-16 h-2 rounded-full overflow-hidden ${
                                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                              }`}>
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                  style={{ width: `${(student.averagePoints || 0) * 10}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              student.status === 'active' ? 'bg-green-500/20 text-green-500' :
                              student.status === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {student.status === 'active' ? t?.('active') || "Active" :
                               student.status === 'warning' ? t?.('warning') || "Warning" :
                               t?.('inactive') || "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openGradingModal(student)}
                                className={`p-2 rounded ${
                                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                } transition-colors`}
                                title={t?.('grade') || "Grade"}
                              >
                                <GraduationCap className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setViewingStudentFiles(student.username)}
                                className={`p-2 rounded ${
                                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                } transition-colors`}
                                title={t?.('view_files') || "View Files"}
                              >
                                <FolderOpen className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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
      className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl border overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {t?.('student_files') || "Student Files"}: {viewingStudentFiles}
              </h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                {students.find(s => s.username === viewingStudentFiles)?.files.length || 0} {t?.('files') || "files"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setViewingStudentFiles(null)}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
            } transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {students.find(s => s.username === viewingStudentFiles)?.files.map((file) => (
            <div
              key={file.id}
              className={`p-4 rounded-xl border ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              } transition-colors`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{file.originalFileName}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        <Folder className="w-4 h-4 inline mr-1" /> {file.folder}
                      </span>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(file.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}
                      </span>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {(file.fileSize / 1024).toFixed(2)} KB
                      </span>
                      {file.points !== undefined && (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs font-medium">
                          {file.points}/10
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openFileInNewTab(file)}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                    } transition-colors`}
                    title={t?.('view_code') || "View Code"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      // Актуализирана функция за изтегляне
                      const element = document.createElement('a');
                      const fileBlob = new Blob([file.code], { type: 'text/plain' });
                      
                      // Уверете се, че файлът има .pl разширение
                      const fileName = file.originalFileName.endsWith('.pl') 
                        ? file.originalFileName 
                        : `${file.originalFileName}.pl`;
                      
                      element.href = URL.createObjectURL(fileBlob);
                      element.download = fileName;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                      URL.revokeObjectURL(element.href);
                    }}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                    } transition-colors`}
                    title={t?.('download_file') || "Download File"}
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
            <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold mb-2">{t?.('no_files_found') || "No Files Found"}</h4>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              {t?.('no_files_uploaded') || "This student hasn't uploaded any files yet."}
            </p>
          </div>
        )}

        {/* Бутон за оценяване в модала за файлове */}
        {students.find(s => s.username === viewingStudentFiles) && 
         students.find(s => s.username === viewingStudentFiles)!.files.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10 dark:border-gray-700">
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const student = students.find(s => s.username === viewingStudentFiles);
                  if (student) {
                    setViewingStudentFiles(null);
                    setTimeout(() => {
                      openGradingModal(student);
                    }, 300);
                  }
                }}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
              >
                <GraduationCap className="w-5 h-5" />
                {t?.('grade_all_work') || "Grade All Work"}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
)}

        {/* Submissions View */}
        {selectedTab === "submissions" && (
          <div className="mb-8">
            <div className={`rounded-2xl p-6 border ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                : 'bg-white border-gray-200'
            } backdrop-blur-xl`}>
              <h2 className="text-2xl font-bold mb-6">
                {t?.('recent_submissions') || "Recent Submissions"} ({submissions.length})
              </h2>
              
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">
                    {t?.('no_submissions') || "No submissions yet"}
                  </h3>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('make_first_submission') || "Make your first submission to get started"}
                  </p>
                  <button
                    onClick={() => setSelectedTab("file-upload")}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                  >
                    {t?.('upload_first_file') || "Upload your first file"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-4 rounded-xl border ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium mb-1">{sub.name}</h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {sub.date}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sub.status === 'success' 
                            ? 'bg-green-500/20 text-green-500' 
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {sub.status === 'success' 
                            ? t?.('status_success') || 'Success'
                            : t?.('status_error') || 'Error'}
                        </span>
                      </div>
                      <div className={`mt-3 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'
                      }`}>
                        <code className="text-sm font-mono">
                          {sub.code?.substring(0, 100)}...
                        </code>
                      </div>
                      {sub.code && (
                        <button
                          onClick={() => {
                            const newWindow = window.open('', '_blank');
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${sub.name}</title>
                                    <style>
                                      body { 
                                        font-family: monospace; 
                                        margin: 20px; 
                                        background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
                                        color: ${theme === 'dark' ? '#ffffff' : '#000000'};
                                        white-space: pre-wrap;
                                      }
                                    </style>
                                  </head>
                                  <body>${sub.code}</body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          }}
                          className="mt-3 text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> {t?.('view_full_code') || "View Full Code"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Upload View */}
        {selectedTab === "file-upload" && (
          <div className="mb-8">
            <div className={`rounded-2xl p-6 border ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                : 'bg-white border-gray-200'
            } backdrop-blur-xl`}>
              <h2 className="text-2xl font-bold mb-6">{t?.('upload_file') || "Upload File"}</h2>
              
              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                  isDragging 
                    ? 'border-green-500 bg-green-500/5' 
                    : theme === 'dark' 
                      ? 'border-white/10 hover:border-white/20' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <FileUp className={`w-16 h-16 mx-auto mb-4 ${
                  theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p className="text-lg mb-2">
                  {t?.('drag_drop_file') || "Drag & drop your .pl file here"}
                </p>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('or') || "or"}
                </p>
                
                <input
                  id="fileInput"
                  type="file"
                  accept=".pl"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="fileInput"
                  className={`inline-block px-6 py-3 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  } transition-colors cursor-pointer`}
                >
                  {t?.('browse_files') || "Browse Files"}
                </label>
              </div>

              {file && (
                <div className={`mt-6 p-4 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-8 h-8 text-green-500" />
                      <div>
                        <div className="font-medium">{file.name}</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {(file.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className={`px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
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
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5 inline mr-2" />
                  {t?.('upload_to') || "Upload to"} {folder}
                </button>
              </div>

              {uploadStatus && (
                <div className={`mt-4 p-3 rounded-lg ${
                  uploadStatus.includes('✅') 
                    ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                    : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
                }`}>
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages View */}
        {selectedTab === "messages" && <MessagesTab />}

        {/* MODALS */}

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
              className={`relative w-full max-w-md rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <GroupIcon className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold">{t?.('create_community') || "Create Community"}</h3>
                  </div>
                  <button
                    onClick={() => setShowCommunityForm(false)}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('community_name') || "Community Name"} *
                    </label>
                    <input
                      type="text"
                      value={communityForm.name}
                      onChange={(e) => setCommunityForm({...communityForm, name: e.target.value})}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                      placeholder={t?.('enter_community_name') || "Enter community name"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('description') || "Description"}
                    </label>
                    <textarea
                      value={communityForm.description}
                      onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})}
                      rows={3}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                      placeholder={t?.('enter_description') || "Enter community description"}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t?.('grade_level') || "Grade Level"}
                      </label>
                      <input
                        type="text"
                        value={communityForm.gradeLevel}
                        onChange={(e) => setCommunityForm({...communityForm, gradeLevel: e.target.value})}
                        className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                          theme === 'dark' 
                            ? 'bg-white/5 border border-white/10' 
                            : 'bg-white border border-gray-300'
                        }`}
                        placeholder="e.g., 10th grade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t?.('subject') || "Subject"}
                      </label>
                      <input
                        type="text"
                        value={communityForm.subject}
                        onChange={(e) => setCommunityForm({...communityForm, subject: e.target.value})}
                        className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                          theme === 'dark' 
                            ? 'bg-white/5 border border-white/10' 
                            : 'bg-white border border-gray-300'
                        }`}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('privacy_settings') || "Privacy Settings"}
                    </label>
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
                        <span className={`px-4 py-2 rounded-lg ${communityForm.privacy === 'private' ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                          {t?.('private') || "Private"}
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
                        <span className={`px-4 py-2 rounded-lg ${communityForm.privacy === 'public' ? 'bg-green-500 text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                          {t?.('public') || "Public"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={communityForm.autoApprove}
                        onChange={(e) => setCommunityForm({...communityForm, autoApprove: e.target.checked})}
                        className={`w-4 h-4 rounded ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-blue-500'
                            : 'bg-white border-gray-300 text-blue-600'
                        } focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <span className="text-sm">
                        {t?.('auto_approve_students') || "Auto-approve student requests"}
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={communityForm.allowStudentMessages}
                        onChange={(e) => setCommunityForm({...communityForm, allowStudentMessages: e.target.checked})}
                        className={`w-4 h-4 rounded ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-blue-500'
                            : 'bg-white border-gray-300 text-blue-600'
                        } focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <span className="text-sm">
                        {t?.('allow_student_messages') || "Allow students to send messages"}
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={communityForm.allowStudentChallenges}
                        onChange={(e) => setCommunityForm({...communityForm, allowStudentChallenges: e.target.checked})}
                        className={`w-4 h-4 rounded ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-blue-500'
                            : 'bg-white border-gray-300 text-blue-600'
                        } focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <span className="text-sm">
                        {t?.('allow_student_challenges') || "Allow students to create challenges"}
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={communityForm.allowInterCommunityChallenges}
                        onChange={(e) => setCommunityForm({...communityForm, allowInterCommunityChallenges: e.target.checked})}
                        className={`w-4 h-4 rounded ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-blue-500'
                            : 'bg-white border-gray-300 text-blue-600'
                        } focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <span className="text-sm">
                        {t?.('allow_inter_community_challenges') || "Allow inter-community challenges"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCommunityForm(false)}
                    className={`flex-1 py-3 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {t?.('cancel') || "Cancel"}
                  </button>
                  <button
                    onClick={handleCreateCommunity}
                    disabled={!communityForm.name.trim()}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    {t?.('create_community') || "Create Community"}
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
              className={`relative w-full max-w-lg rounded-2xl border overflow-hidden ${
                theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t?.('quick_message') || "Quick Message"}</h3>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('quick_message_desc') || "Send a quick message to students"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTab("messages");
                        setShowMessaging(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      {t?.('open_mail') || "Open Mail"}
                    </button>
                    <button
                      onClick={() => {
                        setShowMessaging(false);
                        setSelectedStudent(null);
                      }}
                      className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('recipient') || "Recipient"}
                    </label>
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
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="broadcast">📢 {t?.('broadcast_all_students') || "Broadcast to All Students"}</option>
                      
                      <optgroup 
                        label={t?.('communities') || "Communities"}
                        className={theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}
                      >
                        {communities.map(community => (
                          <option 
                            key={community.id} 
                            value={community.id}
                            className={theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}
                          >
                            👥 {community.name}
                          </option>
                        ))}
                      </optgroup>
                      
                      <optgroup 
                        label={t?.('students') || "Students"}
                        className={theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}
                      >
                        {students.slice(0, 5).map(student => (
                          <option 
                            key={student.uid} 
                            value={student.uid}
                            className={theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}
                          >
                            👤 {student.username}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('message') || "Message"}
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={4}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder={t?.('type_your_message_here') || "Type your quick message here..."}
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/10 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setShowMessaging(false);
                        setSelectedStudent(null);
                        setNewMessage("");
                      }}
                      className={`flex-1 py-3 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-white/5 hover:bg-white/10' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {t?.('cancel') || "Cancel"}
                    </button>
                    <button
                      onClick={() => {
                        if (selectedCommunity) {
                          handleSendMessage('community');
                        } else if (selectedStudent) {
                          handleSendMessage('direct');
                        } else {
                          handleSendMessage('broadcast');
                        }
                        setShowMessaging(false);
                        setSelectedStudent(null);
                      }}
                      disabled={!newMessage.trim()}
                      className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50"
                    >
                      <Send className="w-5 h-5 inline mr-2" />
                      {t?.('send_message') || "Send Message"}
                    </button>
                  </div>
                </div>

                {/* Нови съобщения */}
                {messages.filter(m => !m.read && m.receiverId === user?.uid).length > 0 && (
                  <div className={`mt-6 pt-6 border-t ${
                    theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">
                        {t?.('new_messages') || "New Messages"} ({messages.filter(m => !m.read && m.receiverId === user?.uid).length})
                      </h4>
                      <button
                        onClick={() => {
                          if (window.confirm(t?.('mark_all_read_confirm') || "Mark all as read?")) {
                            handleMarkAllAsRead();
                          }
                        }}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        {t?.('mark_all_read') || "Mark all read"}
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {messages
                        .filter(m => !m.read && m.receiverId === user?.uid)
                        .slice(0, 5)
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                            } group relative`}
                          >
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 text-red-500 hover:bg-red-500/30"
                              title={t?.('delete_message') || "Delete message"}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            
                            <div 
                              className="cursor-pointer"
                              onClick={() => handleMarkAsRead(msg.id)}
                            >
                              <div className="flex justify-between items-start mb-1 pr-6">
                                <div className="font-medium text-sm">{msg.senderName}</div>
                                <div className="text-xs opacity-70">
                                  {new Date(msg.timestamp?.toMillis?.() || Date.now()).toLocaleTimeString()}
                                </div>
                              </div>
                              <p className="text-sm truncate">{msg.content}</p>
                              <div className="text-xs text-green-500 mt-1">
                                {t?.('click_to_mark_read') || "Click to mark as read"}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {messages.filter(m => !m.read && m.receiverId === user?.uid).length > 5 && (
                      <button
                        onClick={() => {
                          setSelectedTab("messages");
                          setShowMessaging(false);
                        }}
                        className={`w-full mt-3 py-2 rounded-lg text-center ${
                          theme === 'dark' 
                            ? 'bg-white/5 hover:bg-white/10' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {t?.('view_all_messages') || "View all messages"} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Lesson Form Modal */}
        {showLessonForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowLessonForm(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`relative w-full max-w-md rounded-2xl border ${
                theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold">{t?.('add_new_lesson') || "Add New Lesson"}</h3>
                  </div>
                  <button
                    onClick={() => setShowLessonForm(false)}
                    className={`p-2 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('lesson_title') || "Lesson Title"} *
                    </label>
                    <input
                      type="text"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                      placeholder={t?.('enter_lesson_title') || "Enter lesson title"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('description') || "Description"}
                    </label>
                    <textarea
                      value={newLesson.description}
                      onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                      rows={3}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                      placeholder={t?.('enter_description') || "Enter lesson description"}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowLessonForm(false)}
                    className={`flex-1 py-3 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {t?.('cancel') || "Cancel"}
                  </button>
                  <button
                    onClick={handleAddLesson}
                    disabled={!newLesson.title.trim()}
                    className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 inline mr-2" />
                    {t?.('add_lesson') || "Add Lesson"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* View Student Files Modal - този е излишен, вече имаме един по-горе */}
        {/* Премахнах дублиращия се модал */}

        {/* Message Thread Modal */}
        {activeThread && (
          <MessageThread
            threadId={activeThread}
            onClose={() => setActiveThread(null)}
          />
        )}
      </div>

      {/* Lesson View Modal */}
      {viewingLesson && (
        <LessonViewModal
          lesson={viewingLesson}
          onClose={() => setViewingLesson(null)}
          onEdit={(lesson) => {
            setViewingLesson(null);
            setEditingLesson(lesson);
            setShowLessonForm(true);
          }}
          onDelete={handleDeleteLesson}
        />
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
        />
      )}
    </div> 
  );
}
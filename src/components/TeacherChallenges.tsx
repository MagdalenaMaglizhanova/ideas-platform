// components/TeacherChallenges.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Target,
  GroupIcon,
  Calendar,
  Trophy,
  MessageCircle,
  CheckCircle,
  X,
  Plus,
  Eye,
  Send,
  FileCheck,
  Users,
  AlertCircle,
  ChevronDown,
  UserCheck,
  Clock,
  Star,
  Edit
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
  deleteDoc,
  getDoc,
  writeBatch,
  addDoc
} from "firebase/firestore";

// ============ ИНТЕРФЕЙСИ ============

interface Community {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  institution: string;
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
  id?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentAvatar?: string;
  submittedAt: any;
  files?: string[];
  notes?: string;
  score?: number;
  feedback?: string;
  status?: 'joined' | 'submitted' | 'evaluated' | 'completed';
  solutionCode?: string;
  evaluation?: {
    score?: number;
    feedback?: string;
    evaluatedAt?: any;
    evaluatedBy?: string;
  };
  communityId?: string;
  acceptedAt?: any;
}

interface AcceptedStudent {
  id: string;
  name: string;
  email?: string;
  acceptedAt: any;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorCommunityId: string;
  targetCommunityId: string;
  createdBy: string;
  createdByName: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'responded';
  dueDate?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  submissions: ChallengeSubmission[];
  acceptedBy?: string[];
  acceptedStudents?: AcceptedStudent[];
  response?: {
    respondedAt: any;
    responderId: string;
    responderName: string;
    content: string;
    files?: string[];
    solutionCode?: string;
  };
  createdAt: any;
  updatedAt?: any;
}

interface SystemUser {
  uid: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  class?: string;
  communityId?: string;
  communityStatus?: string;
  avatar?: string;
}

export interface ChallengeNotification {
  id: string;
  type: 'incoming_challenge' | 'challenge_response' | 'challenge_accepted' | 'challenge_rejected' | 'submission_evaluated';
  title: string;
  description: string;
  challengeId: string;
  fromCommunityId: string;
  fromCommunityName: string;
  fromTeacherName: string;
  targetCommunityId: string;
  status: string;
  timestamp: any;
  read: boolean;
}

interface TeacherChallengesProps {
  communities: Community[];
  selectedCommunityId: string | null;
  onUpdate?: () => void;
  onCommunityChange?: (communityId: string) => void;
  onNewChallenge?: (challenge: {
    id: string;
    title: string;
    description: string;
    targetCommunityId: string;
    status: string;
    createdAt: Date;
  }) => void;
  onIncomingChallenge?: (notification: ChallengeNotification) => void;
  onChallengeStatusChange?: (notification: ChallengeNotification) => void;
}

// ============ ПОМОЩНИ ФУНКЦИИ ============

const getStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    'joined': 'bg-blue-500/20 text-blue-500',
    'submitted': 'bg-yellow-500/20 text-yellow-500',
    'evaluated': 'bg-green-500/20 text-green-500',
    'completed': 'bg-purple-500/20 text-purple-500',
    'pending': 'bg-yellow-500/20 text-yellow-500',
    'accepted': 'bg-green-500/20 text-green-500',
    'rejected': 'bg-red-500/20 text-red-500',
    'responded': 'bg-purple-500/20 text-purple-500'
  };
  return statusColorMap[status] || 'bg-gray-500/20 text-gray-500';
};

const getSubmissionStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    'joined': 'bg-blue-500/20 text-blue-500',
    'submitted': 'bg-yellow-500/20 text-yellow-500',
    'evaluated': 'bg-green-500/20 text-green-500',
    'completed': 'bg-purple-500/20 text-purple-500'
  };
  return statusColorMap[status] || 'bg-gray-500/20 text-gray-500';
};

const getDifficultyColor = (difficulty: string): string => {
  switch(difficulty) {
    case 'easy': return 'bg-green-500/20 text-green-500';
    case 'medium': return 'bg-yellow-500/20 text-yellow-500';
    case 'hard': return 'bg-red-500/20 text-red-500';
    default: return 'bg-gray-500/20 text-gray-500';
  }
};

const formatDate = (timestamp: any): string => {
  try {
    if (!timestamp) return 'No date';
    if (timestamp?.toMillis) {
      return new Date(timestamp.toMillis()).toLocaleString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return 'Invalid date';
  } catch {
    return 'Invalid date';
  }
};

// ============ КОМПОНЕНТ ЗА RESPONSE ============
const ChallengeResponseDisplay = ({ response, theme, t }: { 
  response: NonNullable<Challenge['response']>, 
  theme: string,
  t: any
}) => {
  return (
    <div className={`mt-4 p-4 rounded-lg ${
      theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-blue-500">
          {t?.('challenge_response_title') || "Challenge Response"}
        </span>
      </div>
      <p className="text-sm mb-2 line-clamp-2">{response.content}</p>
      {response.solutionCode && (
        <button
          onClick={() => {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head>
                    <title>Challenge Solution</title>
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
                  <body>${response.solutionCode}</body>
                </html>
              `);
              newWindow.document.close();
            }
          }}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          {t?.('view_solution_code') || "View solution code"} →
        </button>
      )}
      <div className="text-xs opacity-70 mt-2">
        {t?.('challenge_response_from') || "Response from"} {response.responderName} • {formatDate(response.respondedAt)}
      </div>
    </div>
  );
};

// ============ МИГРАЦИЯ ЗА TEACHER NAMES ============
const fixTeacherNames = async (_userId: string) => {
  try {
    console.log("🔧 Fixing teacher names in challenges...");
    const challengesQuery = query(collection(db, "challenges"));
    const snapshot = await getDocs(challengesQuery);
    
    let fixedCount = 0;
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      if (!data.createdByName && data.createdBy) {
        let teacherName = "Teacher";
        
        const userDoc = await getDoc(doc(db, "users", data.createdBy));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          teacherName = userData?.fullName || 
                       (userData?.email ? userData.email.split('@')[0] : null) || 
                       "Teacher";
        }
        
        await updateDoc(docSnapshot.ref, { 
          createdByName: teacherName,
          updatedAt: serverTimestamp()
        });
        fixedCount++;
        console.log(`✅ Fixed challenge ${docSnapshot.id} -> Teacher: ${teacherName}`);
      }
    }
    console.log(`🎉 Fixed ${fixedCount} challenges!`);
  } catch (error) {
    console.error("❌ Error fixing teacher names:", error);
  }
};

// ============ ОСНОВЕН КОМПОНЕНТ ============

export default function TeacherChallenges({ 
  communities, 
  selectedCommunityId,
  onUpdate, 
  onCommunityChange,
  onNewChallenge,
  onChallengeStatusChange
}: TeacherChallengesProps) {
  
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  // ============ STATE ============
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [viewingChallengeSubmissions, setViewingChallengeSubmissions] = useState<Challenge | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ChallengeSubmission | null>(null);
  const [gradeForm, setGradeForm] = useState({
    score: 0,
    feedback: ""
  });
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ message: "", type: "" });
  const [allSystemUsers, setAllSystemUsers] = useState<SystemUser[]>([]);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // ТЕКУЩОТО community (избраното)
  const currentCommunity = communities.find(c => c.id === selectedCommunityId);
  
  // Моите комюнити (където съм учител)
  const myCommunities = communities.filter(c => c.teacherId === user?.uid);
  
  // Challenge form state
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: "Programming",
    difficulty: "medium" as "easy" | "medium" | "hard",
    points: 50
  });

  // Response form state
  const [challengeResponseForm, setChallengeResponseForm] = useState({
    content: "",
    solutionCode: ""
  });

  // ============ АКТУАЛИЗИРАНА ФУНКЦИЯ ЗА НОТИФИКАЦИИ ============
  const sendChallengeNotification = async (
    challengeId: string,
    challengeTitle: string,
    targetCommunityId: string,
    action: 'created' | 'accepted' | 'responded' | 'completed'
  ) => {
    if (!user || !userData || !selectedCommunityId) return;

    try {
      const targetCommunity = communities.find(c => c.id === targetCommunityId);
      if (!targetCommunity) return;

      const studentIds = targetCommunity.studentIds || [];
      console.log(`📢 Sending challenge notifications to ${studentIds.length} students`);

      const actionMessages = {
        created: {
          title: t?.('new_challenge') || '🎯 Ново предизвикателство',
          message: `${t?.('teacher') || 'Учител'} ${userData.fullName || user.email?.split('@')[0] || "Teacher"} ${t?.('created_new_challenge') || 'създаде ново предизвикателство'}: "${challengeTitle}"`
        },
        accepted: {
          title: t?.('challenge_accepted') || '✅ Предизвикателството е прието',
          message: `${t?.('challenge') || 'Предизвикателството'} "${challengeTitle}" ${t?.('has_been_accepted') || 'беше прието'}!`
        },
        responded: {
          title: t?.('challenge_response') || '💬 Отговор на предизвикателство',
          message: `${t?.('teacher') || 'Учителят'} ${t?.('responded_to') || 'отговори на предизвикателство'} "${challengeTitle}"`
        },
        completed: {
          title: t?.('challenge_completed') || '🎉 Предизвикателството е завършено',
          message: `${t?.('challenge') || 'Предизвикателството'} "${challengeTitle}" ${t?.('has_been_completed') || 'беше завършено успешно'}!`
        }
      };

      // ИЗПРАТЕТЕ НОТИФИКАЦИИ В НОВАТА КОЛЕКЦИЯ "notifications"
      const batch = writeBatch(db);
      
      studentIds.forEach((studentId) => {
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
          userId: studentId,
          type: 'challenge',
          title: actionMessages[action].title,
          message: actionMessages[action].message,
          timestamp: serverTimestamp(),
          read: false,
          data: {
            challengeId: challengeId,
            challengeTitle: challengeTitle,
            teacherId: user.uid,
            teacherName: userData.fullName || user.email?.split('@')[0] || "Teacher",
            communityId: targetCommunityId,
            communityName: targetCommunity.name,
            action: action
          },
          actionUrl: '/dashboard/student?tab=challenges'
        });
      });

      await batch.commit();
      
      console.log(`✅ Challenge notifications sent to ${studentIds.length} students`);
      
      // Добавете и в activityLogs за проследяване (опционално)
      if (studentIds.length > 0) {
        await addDoc(collection(db, "activityLogs"), {
          userId: user.uid,
          userName: userData.fullName || user.email?.split('@')[0] || "Teacher",
          action: t?.('challenge_notification_sent') || "Challenge Notification Sent",
          details: `${t?.('sent_notifications') || 'Sent notifications'} for challenge "${challengeTitle}" ${t?.('to') || 'to'} ${studentIds.length} ${t?.('students') || 'students'}`,
          target: `challenge_${challengeId}`,
          actionType: "challenge_notification",
          timestamp: serverTimestamp(),
          metadata: {
            challengeId: challengeId,
            challengeTitle: challengeTitle,
            action: action,
            studentCount: studentIds.length
          }
        });
      }
      
    } catch (error) {
      console.error("Error sending challenge notifications:", error);
    }
  };

  // ============ МИГРАЦИЯ ============
  useEffect(() => {
    if (user && !isMigrating) {
      setIsMigrating(true);
      fixTeacherNames(user.uid).finally(() => {
        setIsMigrating(false);
      });
    }
  }, [user]);

  // ============ API ЗАЯВКИ ============

  const loadAcceptedStudents = async (acceptedBy: string[] = [], acceptedAt: any = {}): Promise<AcceptedStudent[]> => {
    const students: AcceptedStudent[] = [];
    
    for (const studentId of acceptedBy) {
      try {
        const studentDoc = await getDoc(doc(db, "users", studentId));
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          students.push({
            id: studentId,
            name: studentData?.fullName || (studentData?.email ? studentData.email.split('@')[0] : "Unknown Student"),
            email: studentData?.email || "",
            acceptedAt: acceptedAt?.[studentId] || null
          });
        }
      } catch (error) {
        console.error("Error loading student:", error);
      }
    }
    
    return students;
  };

  const getTeacherName = (userId: string, data?: any): string => {
    if (data?.createdByName) return data.createdByName;
    
    if (userId === user?.uid) {
      return userData?.fullName || 
             (user?.email ? user.email.split('@')[0] : null) || 
             t?.('you') || "You";
    }
    
    return `${t?.('teacher') || 'Teacher'} (${userId.substring(0, 4)})`;
  };

  const loadChallengesForCommunity = async () => {
    if (!user || !selectedCommunityId) {
      setChallenges([]);
      return;
    }
    
    setLoading(true);
    try {
      console.log(`📋 Loading challenges for community: ${selectedCommunityId}`);
      
      const createdQ = query(
        collection(db, "challenges"),
        where("creatorCommunityId", "==", selectedCommunityId),
        orderBy("createdAt", "desc")
      );
      
      const targetQ = query(
        collection(db, "challenges"),
        where("targetCommunityId", "==", selectedCommunityId),
        orderBy("createdAt", "desc")
      );
      
      const [createdSnapshot, targetSnapshot] = await Promise.all([
        getDocs(createdQ),
        getDocs(targetQ)
      ]);
      
      const challengesData: Challenge[] = [];
      
      for (const docSnapshot of createdSnapshot.docs) {
        const data = docSnapshot.data();
        
        const acceptedStudents = await loadAcceptedStudents(
          data.acceptedBy || [], 
          data.acceptedAt || {}
        );
        
        challengesData.push({
          id: docSnapshot.id,
          title: data.title || "",
          description: data.description || "",
          creatorCommunityId: data.creatorCommunityId || "",
          targetCommunityId: data.targetCommunityId || "",
          createdBy: data.createdBy || "",
          createdByName: getTeacherName(data.createdBy, data),
          status: data.status || 'pending',
          dueDate: data.dueDate,
          category: data.category || "General",
          difficulty: data.difficulty || 'medium',
          points: data.points || 50,
          submissions: data.submissions || [],
          acceptedBy: data.acceptedBy || [],
          acceptedStudents: acceptedStudents,
          response: data.response,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      }
      
      for (const docSnapshot of targetSnapshot.docs) {
        const data = docSnapshot.data();
        if (!challengesData.some(c => c.id === docSnapshot.id)) {
          
          const acceptedStudents = await loadAcceptedStudents(
            data.acceptedBy || [], 
            data.acceptedAt || {}
          );
          
          challengesData.push({
            id: docSnapshot.id,
            title: data.title || "",
            description: data.description || "",
            creatorCommunityId: data.creatorCommunityId || "",
            targetCommunityId: data.targetCommunityId || "",
            createdBy: data.createdBy || "",
            createdByName: getTeacherName(data.createdBy, data),
            status: data.status || 'pending',
            dueDate: data.dueDate,
            category: data.category || "General",
            difficulty: data.difficulty || 'medium',
            points: data.points || 50,
            submissions: data.submissions || [],
            acceptedBy: data.acceptedBy || [],
            acceptedStudents: acceptedStudents,
            response: data.response,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        }
      }
      
      challengesData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      
      console.log(`✅ Loaded ${challengesData.length} challenges for community ${selectedCommunityId}`);
      setChallenges(challengesData);
      
    } catch (error) {
      console.error("❌ Error loading challenges for community:", error);
      setUploadStatus({ 
        message: t?.('error_loading_challenges') || "❌ Error loading challenges! Firebase index may be missing.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !selectedCommunityId) return;
    
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      await loadChallengesForCommunity();
    };
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, "challenges"),
        where("creatorCommunityId", "==", selectedCommunityId),
        orderBy("createdAt", "desc")
      ), 
      () => {
        loadData();
      }
    );
    
    const unsubscribe2 = onSnapshot(
      query(
        collection(db, "challenges"),
        where("targetCommunityId", "==", selectedCommunityId),
        orderBy("createdAt", "desc")
      ), 
      () => {
        loadData();
      }
    );
    
    return () => {
      isMounted = false;
      unsubscribe();
      unsubscribe2();
    };
  }, [user, selectedCommunityId]);

  useEffect(() => {
    if (selectedCommunityId) {
      loadChallengesForCommunity();
    }
  }, [selectedCommunityId]);

  const loadAllSystemUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: SystemUser[] = [];
      
      usersSnapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        usersData.push({
          uid: docSnapshot.id,
          username: userData?.fullName || (userData?.email ? userData.email.split('@')[0] : `User_${docSnapshot.id.substring(0, 6)}`),
          fullName: userData?.fullName,
          email: userData?.email || "",
          role: userData?.role || 'student',
          class: userData?.class || 'N/A',
          communityId: userData?.communityId || null,
          communityStatus: userData?.communityStatus || null,
          avatar: userData?.avatar
        });
      });
      
      setAllSystemUsers(usersData);
    } catch (error) {
      console.error("Error loading system users:", error);
    }
  };

  const loadChallengeSubmissions = async (challengeId: string): Promise<ChallengeSubmission[]> => {
    try {
      const solutionsQuery = query(
        collection(db, "challengeSolutions"),
        where("challengeId", "==", challengeId)
      );
      
      const solutionsSnapshot = await getDocs(solutionsQuery);
      const submissionsData: ChallengeSubmission[] = [];
      
      solutionsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        submissionsData.push({
          id: docSnapshot.id,
          studentId: data.studentId || "",
          studentName: data.studentName || "Unknown Student",
          studentEmail: data.studentEmail,
          studentAvatar: data.studentAvatar,
          submittedAt: data.submittedAt,
          files: data.files || [],
          notes: data.notes || "",
          score: data.score || data.evaluation?.score,
          feedback: data.feedback || data.evaluation?.feedback,
          status: data.status || 'submitted',
          solutionCode: data.solutionCode || "",
          evaluation: data.evaluation || {},
          communityId: data.communityId,
          acceptedAt: data.acceptedAt
        });
      });
      
      return submissionsData;
    } catch (error) {
      console.error("Error loading challenge submissions:", error);
      return [];
    }
  };

  // ============ АКТУАЛИЗИРАНА ФУНКЦИЯ ЗА ОЦЕНЯВАНЕ ============
  const handleGradeSubmission = async (
    challengeId: string,
    submissionId: string,
    _studentId: string,
    score: number,
    feedback: string
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      const submissionRef = doc(db, 'challengeSolutions', submissionId);
      const challengeRef = doc(db, 'challenges', challengeId);
      
      await updateDoc(submissionRef, {
        score: score,
        feedback: feedback,
        status: 'evaluated',
        evaluation: {
          score: score,
          feedback: feedback,
          evaluatedAt: serverTimestamp(),
          evaluatedBy: user.uid,
          evaluatedByName: userData?.fullName || user.email?.split('@')[0] || "Teacher"
        },
        updatedAt: serverTimestamp()
      });

      const challengeDoc = await getDoc(challengeRef);
      const challengeData = challengeDoc.data();
      const submissions = challengeData?.submissions || [];
      
      const updatedSubmissions = submissions.map((sub: any) => {
        if (sub.id === submissionId) {
          return {
            ...sub,
            score: score,
            feedback: feedback,
            status: 'evaluated',
            evaluation: {
              score: score,
              feedback: feedback,
              evaluatedAt: serverTimestamp(),
              evaluatedBy: user.uid,
              evaluatedByName: userData?.fullName || user.email?.split('@')[0] || "Teacher"
            }
          };
        }
        return sub;
      });

      await updateDoc(challengeRef, {
        submissions: updatedSubmissions,
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      setUploadStatus({ 
        message: t?.('submission_graded') || "✅ Submission graded! Challenge completed!", 
        type: "success" 
      });

      if (challengeData) {
        await sendChallengeNotification(
          challengeId,
          challengeData.title || "Challenge",
          challengeData.targetCommunityId,
          'completed'
        );
      }

      if (onChallengeStatusChange) {
        onChallengeStatusChange({
          id: `grade-${submissionId}-${Date.now()}`,
          type: 'submission_evaluated',
          title: t?.('challenge_completed') || 'Challenge Completed!',
          description: `${t?.('your_submission_received') || 'Your submission for'} "${challengeData?.title}" ${t?.('received') || 'received'} ${score}/${challengeData?.points || 50} ${t?.('points') || 'points'}`,
          challengeId: challengeId,
          fromCommunityId: selectedCommunityId || '',
          fromCommunityName: currentCommunity?.name || 'Your community',
          fromTeacherName: userData?.fullName || user.email?.split('@')[0] || "Teacher",
          targetCommunityId: selectedCommunityId || '',
          status: 'completed',
          timestamp: serverTimestamp(),
          read: false
        });
      }

      await loadChallengesForCommunity();
      
    } catch (error) {
      console.error("Error grading submission:", error);
      setUploadStatus({ 
        message: t?.('error_grading_submission') || "❌ Error grading submission!", 
        type: "error" 
      });
    } finally {
      setLoading(false);
      setShowGradeForm(false);
      setSelectedSubmission(null);
      setGradeForm({ score: 0, feedback: "" });
    }
  };

  // ============ ОБРАБОТЧИЦИ НА СЪБИТИЯ ============

  const handleCommunityChange = (communityId: string) => {
    console.log("🎯 TeacherChallenges: избрано community:", communityId);
    if (onCommunityChange) {
      onCommunityChange(communityId);
    }
    setShowCommunityDropdown(false);
  };

  const handleCreateChallenge = async () => {
    if (!user) {
      setUploadStatus({ message: t?.('must_be_logged_in') || "❌ You must be logged in!", type: "error" });
      return;
    }
    
    if (!selectedCommunityId) {
      setUploadStatus({ message: t?.('no_community_selected') || "❌ No community selected!", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const challengeRef = doc(collection(db, 'challenges'));
      
      const teacherName = userData?.fullName || 
                         (user?.email ? user.email.split('@')[0] : null) || 
                         t?.('teacher') || "Teacher";
      
      console.log("📝 Creating challenge for community:", selectedCommunityId);
      
      const newChallenge = {
        id: challengeRef.id,
        title: challengeForm.title,
        description: challengeForm.description,
        creatorCommunityId: selectedCommunityId,
        targetCommunityId: selectedCommunityId,
        createdBy: user.uid,
        createdByName: teacherName,
        status: 'pending',
        dueDate: challengeForm.dueDate,
        category: challengeForm.category,
        difficulty: challengeForm.difficulty,
        points: challengeForm.points,
        submissions: [],
        acceptedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(challengeRef, newChallenge);
      
      await updateDoc(doc(db, 'communities', selectedCommunityId), {
        challenges: arrayUnion(challengeRef.id)
      });
      
      await sendChallengeNotification(
        challengeRef.id,
        challengeForm.title,
        selectedCommunityId,
        'created'
      );
      
      if (onNewChallenge) {
        onNewChallenge({
          id: challengeRef.id,
          title: challengeForm.title,
          description: challengeForm.description,
          targetCommunityId: selectedCommunityId,
          status: 'pending',
          createdAt: new Date()
        });
      }
      
      setUploadStatus({ 
        message: `${t?.('challenge_created') || '✅ Challenge created for'} ${currentCommunity?.name || 'your community'}!`, 
        type: "success" 
      });
      
      setShowChallengeForm(false);
      resetChallengeForm();
      
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error("Error creating challenge:", error);
      setUploadStatus({ 
        message: t?.('error_creating_challenge') || "❌ Error creating challenge!", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetChallengeForm = () => {
    setChallengeForm({
      title: "",
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: "Programming",
      difficulty: "medium",
      points: 100
    });
  };

  useEffect(() => {
    resetChallengeForm();
  }, [selectedCommunityId]);

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      await updateDoc(doc(db, 'challenges', challengeId), { 
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      
      if (challenge) {
        await sendChallengeNotification(
          challengeId,
          challenge.title,
          challenge.targetCommunityId,
          'accepted'
        );
      }
      
      setUploadStatus({ 
        message: t?.('challenge_accepted') || "✅ Challenge accepted!", 
        type: "success" 
      });
      
    } catch (error) {
      console.error("Error accepting challenge:", error);
      setUploadStatus({ 
        message: t?.('error_accepting_challenge') || "❌ Error accepting challenge!", 
        type: "error" 
      });
    }
  };

  const handleRejectChallenge = async (challengeId: string) => {
    try {
      await updateDoc(doc(db, 'challenges', challengeId), { 
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      setUploadStatus({ 
        message: t?.('challenge_rejected') || "✅ Challenge rejected!", 
        type: "success" 
      });
      
      if (viewingChallengeSubmissions?.id === challengeId) {
        setViewingChallengeSubmissions(null);
      }
      
    } catch (error) {
      console.error("Error rejecting challenge:", error);
      setUploadStatus({ 
        message: t?.('error_rejecting_challenge') || "❌ Error rejecting challenge!", 
        type: "error" 
      });
    }
  };

  const handleChallengeResponse = async (
    challengeId: string, 
    responseContent: string, 
    solutionCode?: string
  ) => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challenge = challenges.find(c => c.id === challengeId);
      
      await updateDoc(challengeRef, {
        status: 'responded',
        updatedAt: serverTimestamp(),
        response: {
          respondedAt: serverTimestamp(),
          responderId: user.uid,
          responderName: userData.fullName || (user.email ? user.email.split('@')[0] : t?.('teacher') || "Teacher"),
          content: responseContent,
          solutionCode: solutionCode || ''
        }
      });

      if (challenge) {
        await sendChallengeNotification(
          challengeId,
          challenge.title,
          challenge.targetCommunityId,
          'responded'
        );
      }

      setUploadStatus({ 
        message: t?.('response_sent') || "✅ Response sent successfully!", 
        type: "success" 
      });
      
      setShowResponseForm(false);
      setChallengeResponseForm({ content: "", solutionCode: "" });
      setSelectedChallenge(null);
      
    } catch (error) {
      console.error("Error sending response:", error);
      setUploadStatus({ 
        message: t?.('error_sending_response') || "❌ Error sending response!", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!window.confirm(t?.('confirm_delete_challenge') || "Are you sure you want to delete this challenge?")) return;
    
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      
      if (challenge?.creatorCommunityId !== selectedCommunityId) {
        setUploadStatus({ 
          message: t?.('only_creator_can_delete') || "❌ Only the creator can delete this challenge!", 
          type: "error" 
        });
        return;
      }
      
      await deleteDoc(doc(db, 'challenges', challengeId));
      setUploadStatus({ 
        message: t?.('challenge_deleted') || "✅ Challenge deleted!", 
        type: "success" 
      });
    } catch (error) {
      console.error("Error deleting challenge:", error);
      setUploadStatus({ 
        message: t?.('error_deleting_challenge') || "❌ Error deleting challenge!", 
        type: "error" 
      });
    }
  };

  useEffect(() => {
    loadAllSystemUsers();
  }, []);

  const stats = {
    total: challenges.length,
    pending: challenges.filter(c => c.status === 'pending').length,
    accepted: challenges.filter(c => c.status === 'accepted').length,
    completed: challenges.filter(c => c.status === 'completed').length,
    responded: challenges.filter(c => c.status === 'responded').length,
    sent: challenges.filter(c => c.creatorCommunityId === selectedCommunityId).length,
    received: challenges.filter(c => c.targetCommunityId === selectedCommunityId && c.creatorCommunityId !== selectedCommunityId).length
  };

  if (!selectedCommunityId) {
    return (
      <div className={`rounded-2xl p-12 border text-center ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <GroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">
          {t?.('no_community_selected_title') || "No Community Selected"}
        </h3>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {t?.('no_community_selected_desc') || "Please select a community from the dropdown above to view and manage challenges."}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header with Community Dropdown */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">
              {t?.('challenges') || "Challenges"}
            </h2>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              } transition-colors`}
            >
              <GroupIcon className="w-4 h-4" />
              <span className="font-medium">{currentCommunity?.name || t?.('select_community') || 'Select community'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showCommunityDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowCommunityDropdown(false)}
                />
                
                <div className={`absolute top-full left-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-lg border shadow-lg z-50 ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="sticky top-0 p-3 border-b border-white/10 bg-inherit">
                    <h4 className="font-medium text-sm">{t?.('your_communities') || "Your Communities"}</h4>
                  </div>
                  <div className="p-2">
                    {myCommunities.map(community => (
                      <button
                        key={community.id}
                        onClick={() => handleCommunityChange(community.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-opacity-10 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        } ${community.id === selectedCommunityId ? 'bg-green-500/20' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          community.isPublic ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          <GroupIcon className={`w-4 h-4 ${
                            community.isPublic ? 'text-green-500' : 'text-blue-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{community.name}</div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {community.memberCount} {t?.('members') || 'members'}
                          </div>
                        </div>
                        {community.id === selectedCommunityId && (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex gap-2 mr-2">
            <span className={`px-3 py-1.5 rounded-lg text-sm ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
              📤 {stats.sent} {t?.('sent') || 'sent'}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-sm ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
              📥 {stats.received} {t?.('received') || 'received'}
            </span>
            <span className="px-3 py-1.5 rounded-lg text-sm bg-yellow-500/20 text-yellow-500">
              ⏳ {stats.pending} {t?.('pending') || 'pending'}
            </span>
          </div>
          
          <button
            onClick={() => {
              resetChallengeForm();
              setShowChallengeForm(true);
            }}
            disabled={!currentCommunity}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {t?.('create_challenge') || "Create Challenge"}
          </button>
        </div>
      </div>

      {uploadStatus.message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          uploadStatus.type === 'success' 
            ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
            : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
        }`}>
          {uploadStatus.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {uploadStatus.message}
          <button 
            onClick={() => setUploadStatus({ message: "", type: "" })}
            className="ml-auto hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}

      {!loading && challenges.length === 0 ? (
        <div className={`rounded-2xl p-12 border text-center ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">
            {t?.('no_challenges_yet') || "No challenges yet"}
          </h3>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {t?.('create_first_challenge_for') || "Create your first challenge for"} {currentCommunity?.name}!
          </p>
          <button
            onClick={() => setShowChallengeForm(true)}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {t?.('create_first_challenge') || "Create First Challenge"}
          </button>
        </div>
      ) : (
        <>
          {!loading && challenges.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => {
                const creatorCommunity = communities.find(c => c.id === challenge.creatorCommunityId);
                const targetCommunity = communities.find(c => c.id === challenge.targetCommunityId);
                const isMyChallenge = challenge.creatorCommunityId === selectedCommunityId;
                const isTargetingMe = challenge.targetCommunityId === selectedCommunityId && !isMyChallenge;
                
                let teacherDisplayName = challenge.createdByName;
                if (challenge.createdBy === user?.uid) {
                  teacherDisplayName = userData?.fullName || 
                                      (user?.email ? user.email.split('@')[0] : null) || 
                                      t?.('you') || "You";
                }

                const hasUngradedSubmissions = challenge.submissions?.some(
                  sub => sub.status === 'submitted'
                );
                
                return (
                  <motion.div
                    key={challenge.id}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    className={`rounded-2xl p-6 border ${
                      theme === 'dark'
                        ? `bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10 hover:border-white/20 ${
                            hasUngradedSubmissions ? 'ring-2 ring-green-500/50' : ''
                          }`
                        : `bg-white border-gray-200 hover:border-gray-300 ${
                            hasUngradedSubmissions ? 'ring-2 ring-green-400/50' : ''
                          }`
                    } backdrop-blur-xl transition-all`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          challenge.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                          challenge.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                          challenge.status === 'responded' ? 'bg-purple-500/20 text-purple-500' :
                          challenge.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold line-clamp-1">{challenge.title}</h3>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isMyChallenge ? '📤 ' + (t?.('sent') || 'Sent') : '📥 ' + (t?.('received') || 'Received')} • {challenge.category}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                        {t?.(challenge.difficulty) || challenge.difficulty}
                      </span>
                    </div>

                    <p className={`mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {challenge.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <GroupIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          {t?.('from') || "From"}: {creatorCommunity?.name || "Unknown"}
                          {isMyChallenge && ` (${t?.('you') || 'You'})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Target className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          {t?.('to') || "To"}: {targetCommunity?.name || "Unknown"}
                          {isTargetingMe && ` (${t?.('you') || 'You'})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          {t?.('due') || "Due"}: {challenge.dueDate || t?.('no_date') || "No date"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          {t?.('points') || "Points"}: {challenge.points}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          {t?.('teacher') || "Teacher"}: {teacherDisplayName}
                          {challenge.createdBy === user?.uid && ` (${t?.('you') || 'You'})`}
                        </span>
                      </div>
                      {hasUngradedSubmissions && (
                        <div className="flex items-center gap-2 text-sm text-green-500">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{t?.('needs_grading') || "⚠️ Needs grading!"}</span>
                        </div>
                      )}
                    </div>

                    {challenge.acceptedStudents && challenge.acceptedStudents.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">
                            {challenge.acceptedStudents.length} {t?.('student_accepted') || 'Student'} 
                            {challenge.acceptedStudents.length !== 1 ? 's' : ''} {t?.('accepted') || 'Accepted'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {challenge.acceptedStudents.slice(0, 3).map((student) => (
                            <div
                              key={student.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20"
                            >
                              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs">
                                {student.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <span className="text-xs font-medium">
                                {student.name?.split(' ')[0] || t?.('student') || 'Student'}
                              </span>
                            </div>
                          ))}
                          {challenge.acceptedStudents.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{challenge.acceptedStudents.length - 3} {t?.('more') || 'more'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                        {t?.(challenge.status) || challenge.status}
                        {isMyChallenge && challenge.status === 'pending' && ` • ${t?.('waiting') || 'Waiting'}`}
                        {isTargetingMe && challenge.status === 'pending' && ` • ${t?.('action_needed') || 'Action needed'}`}
                        {challenge.status === 'completed' && ` ✅ ${t?.('done') || 'Done'}`}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            const submissions = await loadChallengeSubmissions(challenge.id);
                            setViewingChallengeSubmissions({
                              ...challenge,
                              submissions: submissions
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            theme === 'dark' 
                              ? 'bg-white/5 hover:bg-white/10' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          } flex items-center gap-1`}
                          title={t?.('view_submissions') || "View submissions"}
                        >
                          <Eye className="w-4 h-4" />
                          {challenge.submissions?.length || 0}
                          {hasUngradedSubmissions && (
                            <span className="w-2 h-2 bg-green-500 rounded-full ml-1"></span>
                          )}
                        </button>
                        
                        {isTargetingMe && challenge.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptChallenge(challenge.id)}
                              className="px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {t?.('accept') || "Accept"}
                            </button>
                            <button
                              onClick={() => handleRejectChallenge(challenge.id)}
                              className="px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-red-500 to-pink-500 text-white flex items-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              {t?.('reject') || "Reject"}
                            </button>
                          </>
                        )}
                        
                        {isMyChallenge && (
                          <button
                            onClick={() => handleDeleteChallenge(challenge.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm ${
                              theme === 'dark' 
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' 
                                : 'bg-red-100 hover:bg-red-200 text-red-600'
                            } flex items-center gap-1`}
                          >
                            <X className="w-4 h-4" />
                            {t?.('delete') || "Delete"}
                          </button>
                        )}
                      </div>
                    </div>

                    {challenge.response && (
                      <ChallengeResponseDisplay 
                        response={challenge.response} 
                        theme={theme}
                        t={t}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Challenge Modal */}
      {showChallengeForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => {
            setShowChallengeForm(false);
            resetChallengeForm();
          }} />
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
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t?.('create_challenge') || "Create Challenge"}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t?.('for') || "For"}: {currentCommunity?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowChallengeForm(false);
                    resetChallengeForm();
                  }}
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
                    {t?.('challenge_title') || "Challenge Title"} *
                  </label>
                  <input
                    type="text"
                    value={challengeForm.title}
                    onChange={(e) => setChallengeForm({...challengeForm, title: e.target.value})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder={t?.('enter_challenge_title') || "Enter challenge title"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t?.('description') || "Description"} *
                  </label>
                  <textarea
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                    rows={4}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder={t?.('enter_description') || "Enter challenge description"}
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <GroupIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">
                      {t?.('community') || "Community"}
                    </span>
                  </div>
                  <p className="text-sm">
                    {t?.('challenge_will_be_created_for') || "Challenge will be created for"}: <strong>{currentCommunity?.name}</strong>
                  </p>
                  {currentCommunity?.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {currentCommunity.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('due_date') || "Due Date"}
                    </label>
                    <input
                      type="date"
                      value={challengeForm.dueDate}
                      onChange={(e) => setChallengeForm({...challengeForm, dueDate: e.target.value})}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t?.('points') || "Points"}
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={challengeForm.points}
                      onChange={(e) => setChallengeForm({...challengeForm, points: parseInt(e.target.value) || 50})}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t?.('difficulty') || "Difficulty"}
                  </label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                      <button
                        key={difficulty}
                        type="button"
                        onClick={() => setChallengeForm({...challengeForm, difficulty})}
                        className={`flex-1 py-2 rounded-lg capitalize ${
                          challengeForm.difficulty === difficulty
                            ? difficulty === 'easy' ? 'bg-green-500 text-white' :
                              difficulty === 'medium' ? 'bg-yellow-500 text-white' :
                              'bg-red-500 text-white'
                            : theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {t?.(difficulty) || difficulty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChallengeForm(false);
                    resetChallengeForm();
                  }}
                  className={`flex-1 py-3 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  } transition-colors`}
                >
                  {t?.('cancel') || "Cancel"}
                </button>
                <button
                  onClick={handleCreateChallenge}
                  disabled={!challengeForm.title.trim() || loading}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      {t?.('creating') || "Creating..."}
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      {t?.('create_challenge') || "Create Challenge"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* View Submissions Modal */}
      {viewingChallengeSubmissions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => setViewingChallengeSubmissions(null)} />
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
                    <FileCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {viewingChallengeSubmissions.title}
                    </h3>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {viewingChallengeSubmissions.submissions?.length || 0} {t?.('submissions') || 'submissions'} • {
                        viewingChallengeSubmissions.acceptedStudents?.length || 0
                      } {t?.('students_accepted') || 'students accepted'} • {t?.('max_points') || 'Max points'}: {viewingChallengeSubmissions.points}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingChallengeSubmissions(null)}
                  className={`p-2 rounded-lg ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {viewingChallengeSubmissions.acceptedStudents && viewingChallengeSubmissions.acceptedStudents.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-500" />
                    {t?.('students_who_accepted') || "Students who accepted this challenge"}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {viewingChallengeSubmissions.acceptedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-medium">
                          {student.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{student.name}</div>
                          <div className="text-xs opacity-70">
                            {t?.('accepted') || "Accepted"}: {formatDate(student.acceptedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                {viewingChallengeSubmissions.submissions && viewingChallengeSubmissions.submissions.length > 0 ? (
                  viewingChallengeSubmissions.submissions.map((submission, index) => {
                    const student = allSystemUsers.find(u => u.uid === submission.studentId);
                    const studentName = submission.studentName || 
                      student?.fullName || 
                      student?.username || 
                      t?.('unknown_student') || 'Unknown Student';
                    
                    const isEvaluated = submission.status === 'evaluated' || submission.score !== undefined;
                    
                    return (
                      <div
                        key={submission.id || index}
                        className={`p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {studentName}
                              </h4>
                              <div className="flex items-center gap-3 text-xs">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                  {t?.('submitted') || "Submitted"}: {formatDate(submission.submittedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(submission.status || 'submitted')}`}>
                              {t?.(submission.status || 'submitted') || submission.status || 'submitted'}
                            </span>
                            {isEvaluated && submission.score !== undefined && (
                              <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold">
                                {t?.('score') || "Score"}: {submission.score}/{viewingChallengeSubmissions.points}
                              </span>
                            )}
                          </div>
                        </div>

                        {submission.notes && (
                          <div className={`mb-3 p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{submission.notes}</p>
                          </div>
                        )}

                        {submission.solutionCode && (
                          <div className="mb-3">
                            <h5 className="font-medium mb-2 text-sm">{t?.('solution_code') || "Solution Code"}:</h5>
                            <div className={`p-3 rounded-lg max-h-32 overflow-y-auto font-mono text-xs ${
                              theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'
                            }`}>
                              <pre className="whitespace-pre-wrap break-words">
                                {submission.solutionCode.substring(0, 300)}
                                {submission.solutionCode.length > 300 ? '...' : ''}
                              </pre>
                            </div>
                            <button
                              onClick={() => {
                                const newWindow = window.open('', '_blank');
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${studentName}'s Solution</title>
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
                                      <body>${submission.solutionCode}</body>
                                    </html>
                                  `);
                                  newWindow.document.close();
                                }
                              }}
                              className="mt-2 text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" /> {t?.('view_full_code') || "View Full Code"}
                            </button>
                          </div>
                        )}

                        {submission.feedback && (
                          <div className={`mt-3 p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                          }`}>
                            <p className="text-sm">
                              <span className="font-medium">{t?.('feedback') || "Feedback"}:</span> {submission.feedback}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-white/10 flex gap-2 justify-end">
                          {!isEvaluated ? (
                            <button
                              onClick={() => {
                                setSelectedChallenge(viewingChallengeSubmissions);
                                setSelectedSubmission(submission);
                                setGradeForm({
                                  score: submission.score || 0,
                                  feedback: submission.feedback || ""
                                });
                                setShowGradeForm(true);
                              }}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all"
                            >
                              <Star className="w-4 h-4" />
                              {t?.('grade_submission') || "Grade Submission"}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedChallenge(viewingChallengeSubmissions);
                                setSelectedSubmission(submission);
                                setGradeForm({
                                  score: submission.score || 0,
                                  feedback: submission.feedback || ""
                                });
                                setShowGradeForm(true);
                              }}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium flex items-center gap-2 hover:from-yellow-600 hover:to-amber-600 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                              {t?.('update_grade') || "Update Grade"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-bold mb-2">{t?.('no_submissions_yet') || "No Submissions Yet"}</h4>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {t?.('no_submissions_desc') || "No students have submitted solutions for this challenge yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Grade Form Modal */}
      {showGradeForm && selectedChallenge && selectedSubmission && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => {
            setShowGradeForm(false);
            setSelectedSubmission(null);
            setGradeForm({ score: 0, feedback: "" });
          }} />
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
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {t?.('grade_submission') || "Grade Submission"}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedSubmission.studentName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowGradeForm(false);
                    setSelectedSubmission(null);
                    setGradeForm({ score: 0, feedback: "" });
                  }}
                  className={`p-2 rounded-lg ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t?.('score') || "Score"} (0-{selectedChallenge.points})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedChallenge.points}
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({...gradeForm, score: parseInt(e.target.value) || 0})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder={t?.('enter_score') || "Enter score"}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t?.('max_points') || "Max points"}: {selectedChallenge.points}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t?.('feedback') || "Feedback"}
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})}
                    rows={4}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder={t?.('provide_feedback') || "Provide feedback to the student..."}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowGradeForm(false);
                    setSelectedSubmission(null);
                    setGradeForm({ score: 0, feedback: "" });
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
                    if (selectedChallenge && selectedSubmission.id) {
                      handleGradeSubmission(
                        selectedChallenge.id,
                        selectedSubmission.id,
                        selectedSubmission.studentId,
                        gradeForm.score,
                        gradeForm.feedback
                      );
                    }
                  }}
                  disabled={gradeForm.score === undefined || gradeForm.score < 0 || gradeForm.score > selectedChallenge.points || loading}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      {t?.('saving') || "Saving..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {t?.('save_grade') || "Save Grade"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Response Form Modal */}
      {showResponseForm && selectedChallenge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => {
            setShowResponseForm(false);
            setSelectedChallenge(null);
            setChallengeResponseForm({ content: "", solutionCode: "" });
          }} />
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
                    <MessageCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {t?.('challenge_respond') || "Respond to Challenge"}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedChallenge.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setSelectedChallenge(null);
                    setChallengeResponseForm({ content: "", solutionCode: "" });
                  }}
                  className={`p-2 rounded-lg ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t?.('challenge_response_content') || "Response Content"} *
                  </label>
                  <textarea
                    value={challengeResponseForm.content}
                    onChange={(e) => setChallengeResponseForm({...challengeResponseForm, content: e.target.value})}
                    rows={4}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder={t?.('challenge_response_placeholder') || "Write your response to the challenge..."}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t?.('challenge_solution_code') || "Solution Code"} ({t?.('optional') || "optional"})
                  </label>
                  <textarea
                    value={challengeResponseForm.solutionCode}
                    onChange={(e) => setChallengeResponseForm({...challengeResponseForm, solutionCode: e.target.value})}
                    rows={6}
                    className={`w-full rounded-xl p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder={t?.('challenge_solution_code_placeholder') || "Enter your solution code here (optional)..."}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setSelectedChallenge(null);
                    setChallengeResponseForm({ content: "", solutionCode: "" });
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
                    if (selectedChallenge) {
                      handleChallengeResponse(
                        selectedChallenge.id,
                        challengeResponseForm.content,
                        challengeResponseForm.solutionCode
                      );
                    }
                  }}
                  disabled={!challengeResponseForm.content.trim() || loading}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      {t?.('sending') || "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t?.('challenge_send_response') || "Send Response"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
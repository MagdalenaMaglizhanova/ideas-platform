import React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Users as GroupIcon,
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
  Edit,
  TrendingUp,
  Trash2
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

interface ChallengeStats {
  totalSubmissions: number;
  pendingSubmissions: number;
  evaluatedCount: number;
  averageScore: number;
  completionRate: number;
  acceptedCount: number;
}

export interface Challenge {
  completedBy: string[];
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
  acceptedAt?: Record<string, any>;
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
  stats?: ChallengeStats;
  daysLeft?: number;
  isOverdue?: boolean;
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
    'joined': 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    'submitted': 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    'evaluated': 'bg-green-500/20 text-green-600 dark:text-green-400',
    'completed': 'bg-green-500/20 text-green-600 dark:text-green-400',
    'pending': 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    'accepted': 'bg-green-500/20 text-green-600 dark:text-green-400',
    'rejected': 'bg-red-500/20 text-red-600 dark:text-red-400',
    'responded': 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
  };
  return statusColorMap[status] || 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
};

const getSubmissionStatusColor = (status: string): string => {
  const statusColorMap: Record<string, string> = {
    'joined': 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    'submitted': 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    'evaluated': 'bg-green-500/20 text-green-600 dark:text-green-400',
    'completed': 'bg-green-500/20 text-green-600 dark:text-green-400'
  };
  return statusColorMap[status] || 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
};

const getDifficultyColor = (difficulty: string): string => {
  switch(difficulty) {
    case 'easy': return 'bg-green-500/20 text-green-600 dark:text-green-400';
    case 'medium': return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
    case 'hard': return 'bg-red-500/20 text-red-600 dark:text-red-400';
    default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400';
  }
};

const getDifficultyIcon = (difficulty: string): string => {
  switch(difficulty) {
    case 'easy': return '🟢';
    case 'medium': return '🟡';
    case 'hard': return '🔴';
    default: return '⚪';
  }
};

const formatDate = (timestamp: any, t?: any): string => {
  try {
    if (!timestamp) return t?.('no_date') || 'No date';
    if (timestamp?.toMillis) {
      return new Date(timestamp.toMillis()).toLocaleString();
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return t?.('invalid_date') || 'Invalid date';
  } catch {
    return t?.('invalid_date') || 'Invalid date';
  }
};

const formatRelativeTime = (dateString: string, t?: any): string => {
  try {
    const dueDate = new Date(dateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return t?.('overdue_by')?.replace('{days}', Math.abs(diffDays)) || `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return t?.('due_today') || 'Due today';
    if (diffDays === 1) return t?.('due_tomorrow') || 'Due tomorrow';
    return t?.('days_left')?.replace('{days}', diffDays) || `${diffDays} days left`;
  } catch {
    return t?.('invalid_date') || 'Invalid date';
  }
};

// ============ КОМПОНЕНТ ЗА СТАТИСТИЧЕСКА КАРТА ============
const StatsCard = ({ title, value, icon, color, theme}: { title: string; value: number; icon: React.ReactNode; color: 'blue' | 'green' | 'orange'; theme: string; t: any }) => {
  const colors = {
    blue: theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
    green: theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
    orange: theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600',
  };

  return (
    <div className={`rounded-2xl p-6 border ${
      theme === 'dark'
        ? 'bg-gray-900/80 border-white/10'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm opacity-70">{title}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
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
        <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-blue-600 dark:text-blue-400">
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
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {t?.('view_solution_code') || "View solution code"} →
        </button>
      )}
      <div className="text-xs opacity-70 mt-2">
        {t?.('challenge_response_from') || "Response from"} {response.responderName} • {formatDate(response.respondedAt, t)}
      </div>
    </div>
  );
};

// ============ МИГРАЦИЯ ЗА TEACHER NAMES ============
const fixTeacherNames = async (userId: string) => {
  try {
    console.log("🔧 Fixing teacher names in challenges...");
    
    const challengesQuery = query(
      collection(db, "challenges"),
      where("createdBy", "==", userId)
    );
    
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

// ============ МИГРАЦИЯ ЗА СТРУКТУРАТА НА CHALLENGES ============
const migrateChallengesStructure = async (communityId: string) => {
  try {
    console.log("🔄 Migrating challenges structure for community:", communityId);
    
    const challengesRef = collection(db, "challenges");
    const q = query(
      challengesRef,
      where("creatorCommunityId", "==", communityId)
    );
    
    const snapshot = await getDocs(q);
    let migratedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const updates: any = {};
      let needsUpdate = false;
      
      if (!data.completedBy) {
        updates.completedBy = [];
        needsUpdate = true;
      }
      
      if (!data.acceptedAt) {
        updates.acceptedAt = {};
        needsUpdate = true;
      }
      
      const solutionsQuery = query(
        collection(db, "challengeSolutions"),
        where("challengeId", "==", docSnapshot.id)
      );
      const solutionsSnapshot = await getDocs(solutionsQuery);
      
      const allStudentIds = new Set<string>();
      const evaluatedStudentIds = new Set<string>();
      const acceptedAtMap: Record<string, any> = {};
      
      solutionsSnapshot.forEach((solDoc) => {
        const solData = solDoc.data();
        const studentId = solData.studentId;
        
        if (studentId) {
          allStudentIds.add(studentId);
          
          if (solData.score !== undefined || solData.status === 'evaluated' || solData.status === 'completed') {
            evaluatedStudentIds.add(studentId);
          }
          
          if (solData.acceptedAt || solData.submittedAt) {
            acceptedAtMap[studentId] = solData.acceptedAt || solData.submittedAt;
          }
        }
      });
      
      if (data.submissions && Array.isArray(data.submissions)) {
        data.submissions.forEach((sub: any) => {
          if (sub.studentId) {
            allStudentIds.add(sub.studentId);
            
            if (sub.status === 'joined' || sub.status === 'submitted') {
              if (!acceptedAtMap[sub.studentId] && sub.submittedAt) {
                acceptedAtMap[sub.studentId] = sub.submittedAt;
              }
            }
            
            if (sub.status === 'evaluated' || sub.status === 'completed' || sub.score !== undefined) {
              evaluatedStudentIds.add(sub.studentId);
            }
          }
        });
      }
      
      const currentAcceptedBy = data.acceptedBy || [];
      if (currentAcceptedBy.length === 0 && allStudentIds.size > 0) {
        updates.acceptedBy = Array.from(allStudentIds);
        needsUpdate = true;
        console.log(`📝 Setting acceptedBy for challenge ${docSnapshot.id}:`, Array.from(allStudentIds));
      }
      
      const currentCompletedBy = data.completedBy || [];
      if (evaluatedStudentIds.size > 0) {
        const newCompletedBy = Array.from(new Set([...currentCompletedBy, ...Array.from(evaluatedStudentIds)]));
        if (JSON.stringify(currentCompletedBy) !== JSON.stringify(newCompletedBy)) {
          updates.completedBy = newCompletedBy;
          needsUpdate = true;
          console.log(`📝 Setting completedBy for challenge ${docSnapshot.id}:`, newCompletedBy);
        }
      }
      
      if (Object.keys(acceptedAtMap).length > 0) {
        const currentAcceptedAt = data.acceptedAt || {};
        const hasNewAcceptedAt = Object.keys(acceptedAtMap).some(
          key => JSON.stringify(acceptedAtMap[key]) !== JSON.stringify(currentAcceptedAt[key])
        );
        
        if (hasNewAcceptedAt) {
          updates.acceptedAt = { ...currentAcceptedAt, ...acceptedAtMap };
          needsUpdate = true;
        }
      }
      
      if (evaluatedStudentIds.size > 0 && data.status !== 'completed') {
        const allStudentsEvaluated = Array.from(allStudentIds).length > 0 && 
          Array.from(allStudentIds).every(id => evaluatedStudentIds.has(id));
        
        if (allStudentsEvaluated) {
          updates.status = 'completed';
          needsUpdate = true;
          console.log(`📝 Setting status to completed for challenge ${docSnapshot.id}`);
        }
      }
      
      if (needsUpdate) {
        await updateDoc(docSnapshot.ref, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        migratedCount++;
        console.log(`✅ Migrated challenge ${docSnapshot.id}`, updates);
      } else {
        console.log(`ℹ️ No updates needed for challenge ${docSnapshot.id}`);
      }
    }
    
    console.log(`🎉 Migration complete! Migrated ${migratedCount} challenges`);
    return migratedCount;
  } catch (error) {
    console.error("❌ Error during migration:", error);
    return 0;
  }
};

// ============ МИГРАЦИЯ ЗА СТАТУС НА SUBMISSIONS ============
const migrateSubmissionStatus = async (communityId: string) => {
  if (!communityId) return 0;
  
  try {
    console.log("🔄 Migrating submission statuses for community:", communityId);
    
    const challengesRef = collection(db, "challenges");
    const q = query(
      challengesRef,
      where("creatorCommunityId", "==", communityId)
    );
    
    const snapshot = await getDocs(q);
    let updatedCount = 0;
    
    for (const challengeDoc of snapshot.docs) {
      const data = challengeDoc.data();
      
      if (data.submissions && Array.isArray(data.submissions)) {
        let needsUpdate = false;
        const updatedSubmissions = data.submissions.map((sub: any) => {
          if (sub.solutionCode && sub.solutionCode.length > 10 && sub.status === 'joined') {
            needsUpdate = true;
            console.log(`📝 Changing status for ${sub.studentName} from 'joined' to 'submitted'`);
            return { ...sub, status: 'submitted' };
          }
          return sub;
        });
        
        if (needsUpdate) {
          await updateDoc(challengeDoc.ref, {
            submissions: updatedSubmissions,
            updatedAt: serverTimestamp()
          });
          updatedCount++;
          console.log(`✅ Updated statuses for challenge ${challengeDoc.id}`);
        }
      }
    }
    
    console.log(`🎉 Updated ${updatedCount} challenges with submission status migration`);
    return updatedCount;
    
  } catch (error) {
    console.error("❌ Error migrating statuses:", error);
    return 0;
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'submissions' | 'completion'>('dueDate');
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);

  const currentCommunity = communities.find(c => c.id === selectedCommunityId);
  const myCommunities = communities.filter(c => c.teacherId === user?.uid);
  
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: "Programming",
    difficulty: "medium" as "easy" | "medium" | "hard",
    points: 100
  });

  const [challengeResponseForm, setChallengeResponseForm] = useState({
    content: "",
    solutionCode: ""
  });

  // ============ ФУНКЦИЯ ЗА ИЗЧИСЛЯВАНЕ НА СТАТИСТИКА ============
  const calculateChallengeStats = (challenge: Challenge): ChallengeStats => {
    const submissions = challenge.submissions || [];
    const acceptedCount = challenge.acceptedBy?.length || 0;
    
    const totalSubmissions = submissions.length;
    const pendingSubmissions = submissions.filter(s => s.status === 'submitted').length;
    const evaluatedCount = submissions.filter(s => s.status === 'evaluated' || s.score !== undefined).length;
    
    const scores = submissions
      .filter(s => s.score !== undefined)
      .map(s => s.score || 0);
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;
    
    const completionRate = acceptedCount > 0 
      ? (evaluatedCount / acceptedCount) * 100 
      : 0;

    return {
      totalSubmissions,
      pendingSubmissions,
      evaluatedCount,
      averageScore,
      completionRate,
      acceptedCount
    };
  };

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
          actionUrl: '/teacher-dashboard?tab=challenges'
        });
      });

      await batch.commit();
      
      console.log(`✅ Challenge notifications sent to ${studentIds.length} students`);
      
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

  // ============ МИГРАЦИИ ============
  useEffect(() => {
    if (user && !isMigrating && selectedCommunityId) {
      setIsMigrating(true);
      Promise.all([
        fixTeacherNames(user.uid),
        migrateChallengesStructure(selectedCommunityId),
        migrateSubmissionStatus(selectedCommunityId)
      ]).finally(() => {
        setIsMigrating(false);
      });
    }
  }, [user, selectedCommunityId]);

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
            name: studentData?.fullName || (studentData?.email ? studentData.email.split('@')[0] : t?.('unknown_student') || "Unknown Student"),
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
        
        const solutionsQuery = query(
          collection(db, "challengeSolutions"),
          where("challengeId", "==", docSnapshot.id)
        );
        const solutionsSnapshot = await getDocs(solutionsQuery);
        const submissions: ChallengeSubmission[] = [];
        
        solutionsSnapshot.forEach((solDoc) => {
          const solData = solDoc.data();
          submissions.push({
            id: solDoc.id,
            studentId: solData.studentId || "",
            studentName: solData.studentName || t?.('unknown_student') || "Unknown Student",
            studentEmail: solData.studentEmail,
            studentAvatar: solData.studentAvatar,
            submittedAt: solData.submittedAt,
            files: solData.files || [],
            notes: solData.notes || "",
            score: solData.score || solData.evaluation?.score,
            feedback: solData.feedback || solData.evaluation?.feedback,
            status: solData.status || 'submitted',
            solutionCode: solData.solutionCode || "",
            evaluation: solData.evaluation || {},
            communityId: solData.communityId,
            acceptedAt: solData.acceptedAt
          });
        });
        
        // Добавяме legacy submissions от основния документ
        if (data.submissions && Array.isArray(data.submissions) && data.submissions.length > 0) {
          console.log(`📝 Found ${data.submissions.length} legacy submissions for challenge ${docSnapshot.id}`);
          
          data.submissions.forEach((legacySub: any) => {
            const alreadyExists = submissions.some(s => s.studentId === legacySub.studentId);
            
            if (!alreadyExists) {
              let status = legacySub.status || 'submitted';
              
              if (legacySub.solutionCode && legacySub.solutionCode.length > 10) {
                status = 'submitted';
                console.log(`📝 Setting status to 'submitted' for ${legacySub.studentName} (has solutionCode)`);
              }
              
              submissions.push({
                id: `legacy-${legacySub.studentId}-${docSnapshot.id}`,
                studentId: legacySub.studentId || "",
                studentName: legacySub.studentName || t?.('unknown_student') || "Unknown Student",
                studentEmail: legacySub.studentEmail,
                studentAvatar: legacySub.studentAvatar,
                submittedAt: legacySub.submittedAt,
                files: legacySub.files || [],
                notes: legacySub.notes || "",
                score: legacySub.score,
                feedback: legacySub.feedback,
                status: status,
                solutionCode: legacySub.solutionCode || "",
                evaluation: legacySub.evaluation || {},
                communityId: legacySub.communityId,
                acceptedAt: legacySub.acceptedAt
              });
            }
          });
        }
        
        console.log(`📊 Challenge ${docSnapshot.id} has ${submissions.length} total submissions`);
        console.log(`📊 Pending submissions: ${submissions.filter(s => s.status === 'submitted').length}`);
        
        const dueDate = data.dueDate ? new Date(data.dueDate) : null;
        const today = new Date();
        const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        const challenge: Challenge = {
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
          submissions: submissions,
          acceptedBy: data.acceptedBy || [],
          acceptedStudents: acceptedStudents,
          acceptedAt: data.acceptedAt || {},
          response: data.response,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          daysLeft: daysLeft || 0,
          isOverdue: daysLeft !== null ? daysLeft < 0 : false,
          completedBy: data.completedBy || []
        };
        
        challenge.stats = calculateChallengeStats(challenge);
        challengesData.push(challenge);
      }
      
      for (const docSnapshot of targetSnapshot.docs) {
        const data = docSnapshot.data();
        if (!challengesData.some(c => c.id === docSnapshot.id)) {
          
          const acceptedStudents = await loadAcceptedStudents(
            data.acceptedBy || [], 
            data.acceptedAt || {}
          );
          
          const solutionsQuery = query(
            collection(db, "challengeSolutions"),
            where("challengeId", "==", docSnapshot.id)
          );
          const solutionsSnapshot = await getDocs(solutionsQuery);
          const submissions: ChallengeSubmission[] = [];
          
          solutionsSnapshot.forEach((solDoc) => {
            const solData = solDoc.data();
            submissions.push({
              id: solDoc.id,
              studentId: solData.studentId || "",
              studentName: solData.studentName || t?.('unknown_student') || "Unknown Student",
              studentEmail: solData.studentEmail,
              studentAvatar: solData.studentAvatar,
              submittedAt: solData.submittedAt,
              files: solData.files || [],
              notes: solData.notes || "",
              score: solData.score || solData.evaluation?.score,
              feedback: solData.feedback || solData.evaluation?.feedback,
              status: solData.status || 'submitted',
              solutionCode: solData.solutionCode || "",
              evaluation: solData.evaluation || {},
              communityId: solData.communityId,
              acceptedAt: solData.acceptedAt
            });
          });
          
          if (data.submissions && Array.isArray(data.submissions) && data.submissions.length > 0) {
            console.log(`📝 Found ${data.submissions.length} legacy submissions for challenge ${docSnapshot.id}`);
            
            data.submissions.forEach((legacySub: any) => {
              const alreadyExists = submissions.some(s => s.studentId === legacySub.studentId);
              
              if (!alreadyExists) {
                let status = legacySub.status || 'submitted';
                
                if (legacySub.solutionCode && legacySub.solutionCode.length > 10) {
                  status = 'submitted';
                }
                
                submissions.push({
                  id: `legacy-${legacySub.studentId}-${docSnapshot.id}`,
                  studentId: legacySub.studentId || "",
                  studentName: legacySub.studentName || t?.('unknown_student') || "Unknown Student",
                  studentEmail: legacySub.studentEmail,
                  studentAvatar: legacySub.studentAvatar,
                  submittedAt: legacySub.submittedAt,
                  files: legacySub.files || [],
                  notes: legacySub.notes || "",
                  score: legacySub.score,
                  feedback: legacySub.feedback,
                  status: status,
                  solutionCode: legacySub.solutionCode || "",
                  evaluation: legacySub.evaluation || {},
                  communityId: legacySub.communityId,
                  acceptedAt: legacySub.acceptedAt
                });
              }
            });
          }
          
          const dueDate = data.dueDate ? new Date(data.dueDate) : null;
          const today = new Date();
          const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
          
          const challenge: Challenge = {
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
            submissions: submissions,
            acceptedBy: data.acceptedBy || [],
            acceptedStudents: acceptedStudents,
            acceptedAt: data.acceptedAt || {},
            response: data.response,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            daysLeft: daysLeft || 0,
            isOverdue: daysLeft !== null ? daysLeft < 0 : false,
            completedBy: data.completedBy || []
          };
          
          challenge.stats = calculateChallengeStats(challenge);
          challengesData.push(challenge);
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
        message: t?.('error_loading_challenges') || "❌ Error loading challenges!", 
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
          username: userData?.fullName || (userData?.email ? userData.email.split('@')[0] : `${t?.('user_prefix') || 'User'}_${docSnapshot.id.substring(0, 6)}`),
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

  const handleGradeSubmission = async (
    challengeId: string,
    submissionId: string,
    studentId: string,
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

      await updateDoc(challengeRef, {
        completedBy: arrayUnion(studentId),
        updatedAt: serverTimestamp()
      });

      const challengeDoc = await getDoc(challengeRef);
      const challengeData = challengeDoc.data();

      const solutionsQuery = query(
        collection(db, "challengeSolutions"),
        where("challengeId", "==", challengeId)
      );
      const solutionsSnapshot = await getDocs(solutionsQuery);
      const allEvaluated = solutionsSnapshot.docs.every(
        doc => doc.data().status === 'evaluated' || doc.data().status === 'completed'
      );

      if (allEvaluated) {
        await updateDoc(challengeRef, {
          status: 'completed',
          updatedAt: serverTimestamp()
        });
      }

      setUploadStatus({ 
        message: t?.('submission_graded') || "✅ Submission graded successfully!", 
        type: "success" 
      });

      if (challengeData && allEvaluated) {
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
          title: t?.('submission_graded') || 'Submission Graded!',
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
        completedBy: [],
        acceptedAt: {},
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

  const toggleChallengeDetails = (id: string) => {
    setExpandedChallenge(expandedChallenge === id ? null : id);
  };

  useEffect(() => {
    loadAllSystemUsers();
  }, []);

  const filteredChallenges = challenges
    .filter(c => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending') return c.status === 'pending';
      if (filterStatus === 'active') return c.status === 'accepted' || c.status === 'responded';
      if (filterStatus === 'completed') return c.status === 'completed';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'submissions') {
        return (b.stats?.totalSubmissions || 0) - (a.stats?.totalSubmissions || 0);
      }
      if (sortBy === 'completion') {
        return (b.stats?.completionRate || 0) - (a.stats?.completionRate || 0);
      }
      return 0;
    });

  const stats = {
    total: challenges.length,
    pending: challenges.filter(c => c.status === 'pending').length,
    accepted: challenges.filter(c => c.status === 'accepted').length,
    completed: challenges.filter(c => c.status === 'completed').length,
    responded: challenges.filter(c => c.status === 'responded').length,
    sent: challenges.filter(c => c.creatorCommunityId === selectedCommunityId).length,
    received: challenges.filter(c => c.targetCommunityId === selectedCommunityId && c.creatorCommunityId !== selectedCommunityId).length,
    totalSubmissions: challenges.reduce((sum, c) => sum + (c.stats?.totalSubmissions || 0), 0),
    pendingSubmissions: challenges.reduce((sum, c) => sum + (c.stats?.pendingSubmissions || 0), 0),
    averageCompletion: challenges.length > 0 
      ? challenges.reduce((sum, c) => sum + (c.stats?.completionRate || 0), 0) / challenges.length 
      : 0
  };

  if (!selectedCommunityId) {
    return (
      <div className={`rounded-2xl p-12 border text-center ${
        theme === 'dark'
          ? 'bg-gray-900/80 border-white/10'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                        } ${community.id === selectedCommunityId ? 'bg-blue-500/20' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          community.isPublic ? 'bg-green-500/20' : 'bg-blue-500/20'
                        }`}>
                          <GroupIcon className={`w-4 h-4 ${
                            community.isPublic ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{community.name}</div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {community.memberCount} {t?.('members') || 'members'}
                          </div>
                        </div>
                        {community.id === selectedCommunityId && (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
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
          <button
            onClick={() => {
              resetChallengeForm();
              setShowChallengeForm(true);
            }}
            disabled={!currentCommunity}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t?.('create_challenge') || "Create Challenge"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title={t?.('total_challenges') || "Total Challenges"}
          value={stats.total}
          icon={<Target className="w-5 h-5" />}
          color="blue"
          theme={theme}
          t={t}
        />
        <StatsCard
          title={t?.('active_challenges') || "Active"}
          value={stats.accepted + stats.responded}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
          theme={theme}
          t={t}
        />
        <StatsCard
          title={t?.('pending_challenges') || "Pending"}
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          color="orange"
          theme={theme}
          t={t}
        />
        <StatsCard
          title={t?.('total_submissions') || "Submissions"}
          value={stats.totalSubmissions}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          theme={theme}
          t={t}
        />
      </div>

      {/* Status Message */}
      {uploadStatus.message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
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

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {t?.('all') || "All"} ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filterStatus === 'pending'
                ? 'bg-blue-600 text-white'
                : theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {t?.('pending') || "Pending"} ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filterStatus === 'active'
                ? 'bg-blue-600 text-white'
                : theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {t?.('active') || "Active"} ({stats.accepted + stats.responded})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              filterStatus === 'completed'
                ? 'bg-blue-600 text-white'
                : theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            {t?.('completed') || "Completed"} ({stats.completed})
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-gray-100' 
              : 'bg-white border-gray-300 text-gray-900'
          } border`}
        >
          <option value="dueDate">{t?.('sort_by_due_date') || "Sort by Due Date"}</option>
          <option value="submissions">{t?.('sort_by_submissions') || "Sort by Submissions"}</option>
          <option value="completion">{t?.('sort_by_completion') || "Sort by Completion"}</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Challenges List */}
      {!loading && filteredChallenges.length === 0 ? (
        <div className={`rounded-2xl p-12 border text-center ${
          theme === 'dark'
            ? 'bg-gray-900/80 border-white/10'
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
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {t?.('create_first_challenge') || "Create First Challenge"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => {
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

            const hasPendingSubmissions = challenge.stats?.pendingSubmissions ? challenge.stats.pendingSubmissions > 0 : false;
            
            return (
              <motion.div
                key={challenge.id}
                layout
                className={`rounded-2xl border overflow-hidden ${
                  theme === 'dark'
                    ? `bg-gray-900/80 border-white/10 ${
                        hasPendingSubmissions ? 'ring-2 ring-orange-500/50' : ''
                      }`
                    : `bg-white border-gray-200 ${
                        hasPendingSubmissions ? 'ring-2 ring-orange-400/50' : ''
                      }`
                }`}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={() => toggleChallengeDetails(challenge.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      challenge.status === 'accepted' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      challenge.status === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      challenge.status === 'responded' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      challenge.status === 'rejected' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                      'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                    }`}>
                      <Target className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">{challenge.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(challenge.status)}`}>
                          {t?.(challenge.status) || challenge.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                          {getDifficultyIcon(challenge.difficulty)} {t?.(challenge.difficulty) || challenge.difficulty}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {creatorCommunity?.name} {isMyChallenge ? '(' + (t?.('you') || 'You') + ')' : ''} → {targetCommunity?.name} {isTargetingMe ? '(' + (t?.('you') || 'You') + ')' : ''} • {challenge.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs opacity-70">{t?.('accepted') || "Accepted"}</div>
                        <div className="font-bold text-sm">{challenge.acceptedBy?.length || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-70">{t?.('completed') || "Completed"}</div>
                        <div className="font-bold text-sm">{challenge.completedBy?.length || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-70">{t?.('completion') || "Completion"}</div>
                        <div className="font-bold text-sm">{((challenge.completedBy?.length || 0) / (challenge.acceptedBy?.length || 1) * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs opacity-70">{t?.('avg_score') || "Avg Score"}</div>
                        <div className="font-bold text-sm">{(challenge.stats?.averageScore || 0).toFixed(1)}</div>
                      </div>
                    </div>

                    <div className={`text-right min-w-[100px] ${
                      challenge.isOverdue ? 'text-red-600 dark:text-red-400' : 
                      challenge.daysLeft && challenge.daysLeft < 3 ? 'text-orange-600 dark:text-orange-400' : ''
                    }`}>
                      <div className="text-xs opacity-70">{t?.('due') || "Due"}</div>
                      <div className="font-bold text-sm">{challenge.dueDate ? new Date(challenge.dueDate).toLocaleDateString() : t?.('no_date') || 'No date'}</div>
                      <div className="text-xs">
                        {challenge.dueDate ? formatRelativeTime(challenge.dueDate, t) : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 min-w-[40px]">
                      <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-bold text-sm">{challenge.points}</span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async () => {
                          await loadChallengesForCommunity();
                          setViewingChallengeSubmissions(challenge);
                        }}
                        className={`p-1.5 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        } relative`}
                        title={t?.('view_submissions') || "View submissions"}
                      >
                        <Eye className="w-4 h-4" />
                        {hasPendingSubmissions && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                        <span className="ml-1 text-xs">{challenge.stats?.pendingSubmissions || 0}</span>
                      </button>
                      
                      {isTargetingMe && challenge.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptChallenge(challenge.id)}
                          className="p-1.5 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30"
                          title={t?.('accept') || "Accept"}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {isTargetingMe && challenge.status === 'accepted' && (
                        <button
                          onClick={() => {
                            setSelectedChallenge(challenge);
                            setShowResponseForm(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30"
                          title={t?.('respond') || "Respond"}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      
                      {isMyChallenge && (
                        <button
                          onClick={() => handleDeleteChallenge(challenge.id)}
                          className={`p-1.5 rounded-lg ${
                            theme === 'dark' 
                              ? 'hover:bg-white/10 text-red-400' 
                              : 'hover:bg-gray-100 text-red-500'
                          }`}
                          title={t?.('delete') || "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => toggleChallengeDetails(challenge.id)}
                        className={`p-1.5 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedChallenge === challenge.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedChallenge === challenge.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}
                    >
                      <div className="p-4 space-y-4">
                        <div>
                          <h4 className="font-medium mb-2 text-sm">{t?.('description') || "Description"}</h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {challenge.description}
                          </p>
                        </div>

                        {challenge.acceptedStudents && challenge.acceptedStudents.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                              <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                              {t?.('accepted_students') || "Accepted Students"} ({challenge.acceptedStudents.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {challenge.acceptedStudents.map((student) => {
                                const acceptedDate = challenge.acceptedAt?.[student.id] || student.acceptedAt;
                                return (
                                  <div
                                    key={student.id}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">
                                      {student.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="text-sm">{student.name}</span>
                                    {acceptedDate && (
                                      <span className="text-xs opacity-70">
                                        {formatDate(acceptedDate, t)}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {challenge.completedBy && challenge.completedBy.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                              {t?.('completed_students') || "Completed Students"} ({challenge.completedBy.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {challenge.completedBy.map((studentId) => {
                                const student = allSystemUsers.find(u => u.uid === studentId);
                                const studentName = student?.fullName || student?.username || studentId.substring(0, 8);
                                return (
                                  <div
                                    key={studentId}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">
                                      {studentName?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span className="text-sm">{studentName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs opacity-70 mb-1">{t?.('difficulty') || "Difficulty"}</div>
                            <div className={`font-medium text-sm ${
                              challenge.difficulty === 'easy' ? 'text-green-600 dark:text-green-400' :
                              challenge.difficulty === 'medium' ? 'text-orange-600 dark:text-orange-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {t?.(challenge.difficulty) || challenge.difficulty}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs opacity-70 mb-1">{t?.('category') || "Category"}</div>
                            <div className="font-medium text-sm">{challenge.category}</div>
                          </div>
                          <div>
                            <div className="text-xs opacity-70 mb-1">{t?.('created_by') || "Created by"}</div>
                            <div className="font-medium text-sm">{teacherDisplayName}</div>
                          </div>
                        </div>

                        {challenge.response && (
                          <ChallengeResponseDisplay 
                            response={challenge.response} 
                            theme={theme}
                            t={t}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
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
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
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
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                    placeholder={t?.('enter_description') || "Enter challenge description"}
                  />
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
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
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
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t?.('category') || "Category"}
                  </label>
                  <select
                    value={challengeForm.category}
                    onChange={(e) => setChallengeForm({...challengeForm, category: e.target.value})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } border`}
                  >
                    <option value="Programming">Programming</option>
                    <option value="Algorithms">Algorithms</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Database">Database</option>
                    <option value="AI">AI</option>
                    <option value="Design">Design</option>
                  </select>
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
                            ? difficulty === 'easy' ? 'bg-green-600 text-white' :
                              difficulty === 'medium' ? 'bg-orange-600 text-white' :
                              'bg-red-600 text-white'
                            : theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {getDifficultyIcon(difficulty)} {t?.(difficulty) || difficulty}
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
                  className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      {t?.('creating') || "Creating..."}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
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
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {viewingChallengeSubmissions.title}
                    </h3>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {viewingChallengeSubmissions.submissions?.length || 0} {t?.('submissions') || 'submissions'} • {
                        viewingChallengeSubmissions.submissions?.filter(s => s.status === 'submitted').length || 0
                      } {t?.('pending') || 'pending'} • {
                        viewingChallengeSubmissions.acceptedStudents?.length || 0
                      } {t?.('students_accepted') || 'students accepted'} • {
                        viewingChallengeSubmissions.completedBy?.length || 0
                      } {t?.('completed') || 'completed'} • {t?.('max_points') || 'Max points'}: {viewingChallengeSubmissions.points}
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
                    <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    {t?.('students_who_accepted') || "Students who accepted this challenge"}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {viewingChallengeSubmissions.acceptedStudents.map((student) => {
                      const acceptedDate = viewingChallengeSubmissions.acceptedAt?.[student.id] || student.acceptedAt;
                      return (
                        <div
                          key={student.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-medium">
                            {student.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{student.name}</div>
                            {acceptedDate && (
                              <div className="text-xs opacity-70">
                                {t?.('accepted') || "Accepted"}: {formatDate(acceptedDate, t)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                              {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {studentName}
                              </h4>
                              <div className="flex items-center gap-3 text-xs">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                  {t?.('submitted') || "Submitted"}: {formatDate(submission.submittedAt, t)}
                                </span>
                                {submission.status && (
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${getSubmissionStatusColor(submission.status)}`}>
                                    {t?.(submission.status) || submission.status}
                                  </span>
                                )}
                                {viewingChallengeSubmissions.completedBy?.includes(submission.studentId) && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-600 dark:text-green-400">
                                    ✓ {t?.('completed') || 'completed'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isEvaluated && submission.score !== undefined && (
                            <div className={`px-3 py-1 rounded-lg ${
                              submission.score >= viewingChallengeSubmissions.points * 0.8 ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                              submission.score >= viewingChallengeSubmissions.points * 0.5 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                              'bg-red-500/20 text-red-600 dark:text-red-400'
                            }`}>
                              <span className="font-bold">{submission.score}</span>/{viewingChallengeSubmissions.points}
                            </div>
                          )}
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
                              className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center gap-1"
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
                              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors"
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
                              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center gap-2 transition-colors"
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
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
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
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
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
                  } transition-colors`}
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
                  className="flex-1 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
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
                    className={`w-full rounded-xl p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
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
                  } transition-colors`}
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
                  className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
// components/TeacherAssignments.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, Edit, Trash2, Eye, Calendar, 
  GraduationCap, Star, FileText, Target,
  BookOpen, ListChecks, Database, Link,
  List, Tag, ImageIcon, FileCode, 
  CheckCircle, X, Trophy, FileTextIcon,
  TargetIcon
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
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from "firebase/firestore";

// Интерфейси - актуализирани с всички полета от оригинала
export interface Assignment {
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
  actionText?: string;
}

interface AssignmentFormData {
  title: string;
  description: string;
  objective: string;
  topic: string;
  subject: string;
  minFacts: number;
  minRules: number;
  minCombinedRules: number;
  minMenuItems: number;
  instructions: string[];
  dueDate: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  exampleCode: string;
  backgroundImage: string;
  category: string;
}

interface TeacherAssignmentsProps {
  teacherId: string;
  isTeacherOrAdmin: boolean;
  onStatsChange?: (stats: { total: number; active: number }) => void;
  onAssignmentsChange?: (assignments: Assignment[]) => void;
}

// Константи - точно както в оригинала
const assignmentBackgrounds = [
  "https://img.freepik.com/free-photo/clock-top-textbooks-teacher-desk_23-2148199985.jpg?semt=ais_hybrid&w=740&q=80",
  "https://naukatolubie.pl/app/uploads/2023/03/jak-szybciej-sie-uczyc-1023x550.png",
  "https://www.superprof.pl/blog/wp-content/uploads/2020/02/nauka-prawa-online.jpeg",
  "https://szkolawchmurze.pl/wp-content/uploads/2019/09/nauka-zdalna.jpg",
  "https://www.shutterstock.com/image-vector/cute-seamless-pattern-school-education-260nw-2571827227.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGpMHf5oEKL0seirtuqidIDIgyz1I0Lkt6QZrTwB1giA&s"
];

const categories = ["Design", "Programming", "Algorithms", "Data Science", "Database", "AI"];

// Константа за шаблонния код - за да не се повтаря
const EXPERT_SYSTEM_TEMPLATE = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                  %
%   EXPERT SYSTEM TEMPLATE                         %
%   ======================                         %
%   Subject: [SUBJECT]                             %
%   Topic: [TOPIC]                                 %
%   Student Name: [NAME]                           %
%   Class: [CLASS]                                 %
%   Date: [DATE]                                   %
%                                                  %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%%%%%%%%%%%%%%%%%%%%
% PROGRAM ENTRY POINT
%%%%%%%%%%%%%%%%%%%%%%%%%
start :-
    write('=== Expert System for [TOPIC] ==='), nl,
    write('1. Show all [TOPIC_ITEMS]'), nl,
    write('2. Search [TOPIC_ITEMS] by [CATEGORY]'), nl,
    write('3. Check if [TOPIC_ITEM] is [PROPERTY]'), nl,
    write('4. Information about [TOPIC]'), nl,
    write('5. Exit'), nl,
    read(Choice),
    process_choice(Choice).`;

const initialInstructions = [
  { id: 1, text: "The goal of the assignment is to create an expert system that collects, organizes, and uses knowledge from a school subject (biology, chemistry, or physics), applying logical rules to derive new information." },
  { id: 2, text: "Develop a working expert system on a topic chosen by the student from: Biology (e.g., insects, ecosystems, organs), Chemistry (e.g., substances, reactions, acids and bases), or Physics (e.g., motion, forces, electricity)." },
  { id: 3, text: "The system must be implemented in Prolog and start with the main predicate start/0." },
];

export default function TeacherAssignments({ teacherId, isTeacherOrAdmin, onStatsChange, onAssignmentsChange }: TeacherAssignmentsProps) {
  const { userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  // State - всички от оригинала
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [instructions, setInstructions] = useState(initialInstructions);

  // В initialState на формата, exampleCode вече съдържа шаблона
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormData>({
    title: "",
    description: "",
    objective: "",
    topic: "",
    subject: "biology",
    minFacts: 20,
    minRules: 5,
    minCombinedRules: 2,
    minMenuItems: 5,
    instructions: initialInstructions.map(inst => inst.text),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    difficulty: 'medium',
    points: 100,
    exampleCode: EXPERT_SYSTEM_TEMPLATE,
    backgroundImage: assignmentBackgrounds[0],
    category: "Programming"
  });

  // 🔥 АКТУАЛИЗИРАНА ФУНКЦИЯ: Изпращане на нотификации до всички ученици в НОВАТА КОЛЕКЦИЯ "notifications"
  const sendAssignmentNotifications = async (assignmentTitle: string, assignmentId: string) => {
    if (!teacherId || !userData) return;
    
    try {
      // Намерете всички общности на този учител
      const communitiesQuery = query(
        collection(db, "communities"),
        where("teacherId", "==", teacherId)
      );
      
      const communitiesSnapshot = await getDocs(communitiesQuery);
      const allStudentIds: string[] = [];
      
      // Съберете всички studentIds от всички общности
      communitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        const studentIds = data.studentIds || [];
        allStudentIds.push(...studentIds);
      });
      
      // Премахнете дублиращите се ID-та
      const uniqueStudentIds = [...new Set(allStudentIds)];
      
      console.log(`📢 Sending assignment notifications to ${uniqueStudentIds.length} students`);

      if (uniqueStudentIds.length === 0) {
        console.log("No students found in communities");
        return;
      }

      // Създаване на нотификации в НОВАТА КОЛЕКЦИЯ "notifications"
      const batch = writeBatch(db);
      
      uniqueStudentIds.forEach((studentId) => {
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
          userId: studentId,
          type: 'assignment',
          title: t?.('new_assignment') || '📚 Ново задание',
          message: `${t?.('teacher') || 'Учител'} ${userData.fullName || userData.email?.split('@')[0] || "Teacher"} ${t?.('created_new_assignment') || 'създаде ново задание'}: "${assignmentTitle}"`,
          timestamp: serverTimestamp(),
          read: false,
          data: {
            assignmentId: assignmentId,
            assignmentTitle: assignmentTitle,
            teacherId: teacherId,
            teacherName: userData.fullName || userData.email?.split('@')[0] || "Teacher"
          },
          actionUrl: '/dashboard/student?tab=assignments'
        });
      });

      await batch.commit();
      
      // Запазете и в activityLogs за проследяване (остава за история)
      await addDoc(collection(db, "activityLogs"), {
        userId: teacherId,
        userName: userData.fullName || userData.email?.split('@')[0] || "Teacher",
        action: t?.('assignment_created_action') || "Assignment Created",
        details: `${t?.('created_new_assignment') || 'Created new assignment'}: "${assignmentTitle}" ${t?.('and_notified') || 'and notified'} ${uniqueStudentIds.length} ${t?.('students') || 'students'}`,
        target: `assignment_${assignmentId}`,
        actionType: "assignment_created",
        timestamp: serverTimestamp(),
        metadata: {
          assignmentId: assignmentId,
          assignmentTitle: assignmentTitle,
          studentCount: uniqueStudentIds.length
        }
      });
      
      console.log(`✅ Assignment notifications sent to ${uniqueStudentIds.length} students`);
      
      // Покажете съобщение на учителя
      if (uniqueStudentIds.length > 0) {
        setUploadStatus(`✅ ${t?.('assignment_created') || 'Assignment created'}! ${uniqueStudentIds.length} ${t?.('students_notified') || 'students notified'}.`);
      }
      
    } catch (error) {
      console.error("Error sending assignment notifications:", error);
    }
  };

  // Функция за изпращане на updates
  const sendUpdates = (assignmentsData: Assignment[]) => {
    if (onStatsChange) {
      onStatsChange({
        total: assignmentsData.length,
        active: assignmentsData.filter(a => a.status === 'active').length
      });
    }
    
    if (onAssignmentsChange) {
      onAssignmentsChange(assignmentsData);
    }
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('assignments-updated', { 
        detail: assignmentsData 
      }));
    }
  };

  // Зареждане с onSnapshot
  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const q = query(
      collection(db, "assignments"),
      where("teacherId", "==", teacherId),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const assignmentsData: Assignment[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          assignmentsData.push({
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            objective: data.objective || '',
            topic: data.topic || '',
            subject: data.subject || '',
            requirements: data.requirements || {
              minFacts: 10,
              minRules: 5,
              minCombinedRules: 2,
              minMenuItems: 3
            },
            instructions: data.instructions || [],
            teacherId: data.teacherId,
            teacherName: data.teacherName || 'Teacher',
            createdAt: data.createdAt,
            dueDate: data.dueDate || new Date().toISOString().split('T')[0],
            status: data.status || 'active',
            difficulty: data.difficulty || 'medium',
            points: data.points || 100,
            exampleCode: data.exampleCode || EXPERT_SYSTEM_TEMPLATE,
            backgroundImage: data.backgroundImage || assignmentBackgrounds[Math.floor(Math.random() * assignmentBackgrounds.length)],
            category: data.category || categories[Math.floor(Math.random() * categories.length)],
            progress: data.progress || 0,
            actionText: data.actionText || t?.('view') || "View"
          });
        });
        
        setAssignments(assignmentsData);
        sendUpdates(assignmentsData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error loading assignments:", error);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [teacherId]);

  // В resetAssignmentForm, exampleCode вече съдържа шаблона
  const resetAssignmentForm = () => {
    setAssignmentForm({
      title: "",
      description: "",
      objective: "",
      topic: "",
      subject: "biology",
      minFacts: 20,
      minRules: 5,
      minCombinedRules: 2,
      minMenuItems: 5,
      instructions: initialInstructions.map(inst => inst.text),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      difficulty: 'medium',
      points: 100,
      exampleCode: EXPERT_SYSTEM_TEMPLATE,
      backgroundImage: assignmentBackgrounds[0],
      category: "Programming"
    });
    setInstructions(initialInstructions);
  };

  const handleCreateOrUpdateAssignment = async () => {
    if (!teacherId || !userData) {
      alert(t?.('login_as_teacher') || "Please login as a teacher!");
      return;
    }

    try {
      console.log("📝 Saving assignment with exampleCode:", {
        length: assignmentForm.exampleCode?.length,
        preview: assignmentForm.exampleCode?.substring(0, 100)
      });

      const assignmentData = {
        title: assignmentForm.title,
        description: assignmentForm.description,
        objective: assignmentForm.objective,
        topic: assignmentForm.topic,
        subject: assignmentForm.subject,
        requirements: {
          minFacts: assignmentForm.minFacts,
          minRules: assignmentForm.minRules,
          minCombinedRules: assignmentForm.minCombinedRules,
          minMenuItems: assignmentForm.minMenuItems
        },
        instructions: assignmentForm.instructions,
        teacherId: teacherId,
        teacherName: userData.fullName || userData.email?.split('@')[0] || t?.('teacher') || "Teacher",
        createdAt: serverTimestamp(),
        dueDate: assignmentForm.dueDate,
        status: 'active',
        difficulty: assignmentForm.difficulty,
        points: assignmentForm.points,
        exampleCode: assignmentForm.exampleCode,
        backgroundImage: assignmentForm.backgroundImage,
        category: assignmentForm.category,
        actionText: t?.('view') || "View"
      };

      if (editingAssignment) {
        await updateDoc(doc(db, "assignments", editingAssignment.id), assignmentData);
        setUploadStatus("✅ " + (t?.('assignment_updated') || "Assignment updated successfully!"));
        console.log("✅ Assignment updated with ID:", editingAssignment.id);
      } else {
        const docRef = await addDoc(collection(db, "assignments"), assignmentData);
        setUploadStatus("✅ " + (t?.('assignment_created') || "Assignment created successfully!"));
        console.log("✅ Assignment created with ID:", docRef.id);
        
        // ИЗПРАТЕТЕ НОТИФИКАЦИИ САМО ПРИ НОВО ЗАДАНИЕ (НЕ ПРИ РЕДАКТИРАНЕ)
        await sendAssignmentNotifications(assignmentForm.title, docRef.id);
      }

      setShowForm(false);
      setEditingAssignment(null);
      resetAssignmentForm();

      setTimeout(() => setUploadStatus(""), 3000);
    } catch (error) {
      console.error(t?.('save_assignment_error') || "Error saving assignment:", error);
      setUploadStatus("❌ " + (t?.('save_assignment_error') || "Error saving assignment!"));
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description,
      objective: assignment.objective,
      topic: assignment.topic,
      subject: assignment.subject,
      minFacts: assignment.requirements.minFacts,
      minRules: assignment.requirements.minRules,
      minCombinedRules: assignment.requirements.minCombinedRules,
      minMenuItems: assignment.requirements.minMenuItems,
      instructions: assignment.instructions,
      dueDate: assignment.dueDate,
      difficulty: assignment.difficulty,
      points: assignment.points,
      exampleCode: assignment.exampleCode || EXPERT_SYSTEM_TEMPLATE,
      backgroundImage: assignment.backgroundImage || assignmentBackgrounds[0],
      category: assignment.category || "Programming"
    });
    setShowForm(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm(t?.('confirm_delete_assignment') || "Are you sure you want to delete this assignment?")) return;

    try {
      await deleteDoc(doc(db, "assignments", assignmentId));
      setUploadStatus("✅ " + (t?.('assignment_deleted') || "Assignment deleted successfully!"));
      setTimeout(() => setUploadStatus(""), 3000);
    } catch (error) {
      console.error(t?.('delete_assignment_error') || "Error deleting assignment:", error);
      setUploadStatus("❌ " + (t?.('delete_assignment_error') || "Error deleting assignment!"));
      setTimeout(() => setUploadStatus(""), 3000);
    }
  };

  const addInstruction = () => {
    const newId = instructions.length > 0 ? Math.max(...instructions.map(i => i.id)) + 1 : 1;
    setInstructions([...instructions, { id: newId, text: "" }]);
  };

  const updateInstruction = (id: number, text: string) => {
    setInstructions(instructions.map(inst => 
      inst.id === id ? { ...inst, text } : inst
    ));
    setAssignmentForm({
      ...assignmentForm,
      instructions: instructions.map(inst => 
        inst.id === id ? text : inst.text
      )
    });
  };

  const removeInstruction = (id: number) => {
    setInstructions(instructions.filter(inst => inst.id !== id));
    setAssignmentForm({
      ...assignmentForm,
      instructions: instructions.filter(inst => inst.id !== id).map(inst => inst.text)
    });
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t?.('all_assignments') || "All Assignments"}</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {t?.('manage_create_assignments') || "Manage and create new assignments"}
          </p>
        </div>
        
        {isTeacherOrAdmin && (
          <button
            onClick={() => {
              setEditingAssignment(null);
              resetAssignmentForm();
              setShowForm(true);
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t?.('add_assignment') || "Add Assignment"}
          </button>
        )}
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

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState 
          theme={theme} 
          isTeacherOrAdmin={isTeacherOrAdmin}
          onCreateClick={() => {
            setEditingAssignment(null);
            resetAssignmentForm();
            setShowForm(true);
          }}
          t={t}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              theme={theme}
              isTeacherOrAdmin={isTeacherOrAdmin}
              onEdit={() => handleEditAssignment(assignment)}
              onDelete={() => handleDeleteAssignment(assignment.id)}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Assignment Form Modal */}
      {showForm && isTeacherOrAdmin && (
        <AssignmentFormModal
          theme={theme}
          editingAssignment={editingAssignment}
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          instructions={instructions}
          onAddInstruction={addInstruction}
          onUpdateInstruction={updateInstruction}
          onRemoveInstruction={removeInstruction}
          onCancel={() => {
            setShowForm(false);
            setEditingAssignment(null);
            resetAssignmentForm();
          }}
          onSave={handleCreateOrUpdateAssignment}
          t={t}
        />
      )}
    </div>
  );
}

// Компонент за празно състояние
function EmptyState({ theme, isTeacherOrAdmin, onCreateClick, t }: any) {
  return (
    <div className={`rounded-2xl p-12 border text-center ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
        : 'bg-white border-gray-200'
    }`}>
      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">{t?.('no_assignments_yet') || "No assignments yet"}</h3>
      <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {t?.('create_first_assignment') || "Create your first assignment to get started"}
      </p>
      {isTeacherOrAdmin && (
        <button
          onClick={onCreateClick}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          {t?.('create_first_assignment') || "Create First Assignment"}
        </button>
      )}
    </div>
  );
}

// Компонент за карта на assignment
function AssignmentCard({ assignment, theme, isTeacherOrAdmin, onEdit, onDelete, t }: any) {
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Design': return '🎨';
      case 'Programming': return '💻';
      case 'Algorithms': return '🧠';
      case 'Data Science': return '📊';
      default: return '🤖';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'hard': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <motion.div
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
            {getCategoryIcon(assignment.category)}
          </div>
          <div>
            <h3 className="font-bold">{assignment.title}</h3>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {assignment.category}
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(assignment.difficulty)}`}>
          {assignment.difficulty}
        </span>
      </div>

      <p className={`mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
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
          <Star className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
            {t?.('points') || "Points"}: {assignment.points}
          </span>
        </div>
      </div>

      {isTeacherOrAdmin ? (
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              theme === 'dark' 
                ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
            }`}
          >
            <Edit className="w-4 h-4 inline mr-1" /> {t?.('edit') || "Edit"}
          </button>
          <button
            onClick={onDelete}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              theme === 'dark' 
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                : 'bg-red-100 hover:bg-red-200 text-red-600'
            }`}
          >
            <Trash2 className="w-4 h-4 inline mr-1" /> {t?.('delete') || "Delete"}
          </button>
        </div>
      ) : (
        <button className={`w-full py-2 rounded-lg text-sm font-medium ${
          theme === 'dark' 
            ? 'bg-white/5 hover:bg-white/10' 
            : 'bg-gray-100 hover:bg-gray-200'
        }`}>
          <Eye className="w-4 h-4 inline mr-1" /> {assignment.actionText || t?.('view') || "View"}
        </button>
      )}
    </motion.div>
  );
}

// Компонент за модален прозорец на формата
function AssignmentFormModal({
  theme,
  editingAssignment,
  assignmentForm,
  setAssignmentForm,
  instructions,
  onAddInstruction,
  onUpdateInstruction,
  onRemoveInstruction,
  onCancel,
  onSave,
  t
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <FileTextIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {editingAssignment 
                    ? t?.('edit_assignment') || "Edit Assignment" 
                    : t?.('create_new_assignment') || "Create New Assignment"}
                </h3>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
              } transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Основни полета */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FileTextIcon className="w-4 h-4 inline mr-2" /> 
                  {t?.('assignment_title') || "Assignment Title"} *
                </label>
                <input
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                  placeholder={t?.('example_expert_system') || "Example: Creating an Expert System"}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <TargetIcon className="w-4 h-4 inline mr-2" /> 
                  {t?.('topic') || "Topic"} *
                </label>
                <input
                  type="text"
                  value={assignmentForm.topic}
                  onChange={(e) => setAssignmentForm({...assignmentForm, topic: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                  placeholder={t?.('example_insects') || "Example: Insects, Chemical Reactions, Electricity"}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <BookOpen className="w-4 h-4 inline mr-2" /> 
                  {t?.('subject') || "Subject"} *
                </label>
                <select
                  value={assignmentForm.subject}
                  onChange={(e) => setAssignmentForm({...assignmentForm, subject: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                    theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } border`}
                >
                  <option value="biology">{t?.('biology') || "Biology"}</option>
                  <option value="chemistry">{t?.('chemistry') || "Chemistry"}</option>
                  <option value="physics">{t?.('physics') || "Physics"}</option>
                  <option value="other">{t?.('other') || "Other"}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" /> 
                  {t?.('due_date') || "Due Date"} *
                </label>
                <input
                  type="date"
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                  className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Objective */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Target className="w-4 h-4 inline mr-2" /> 
                {t?.('objective') || "Objective"} *
              </label>
              <textarea
                value={assignmentForm.objective}
                onChange={(e) => setAssignmentForm({...assignmentForm, objective: e.target.value})}
                rows={4}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white border border-gray-300'
                }`}
                placeholder={t?.('describe_objective') || "Describe the objective of the assignment..."}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <FileText className="w-4 h-4 inline mr-2" /> 
                {t?.('description') || "Description"} *
              </label>
              <textarea
                value={assignmentForm.description}
                onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                rows={3}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white border border-gray-300'
                }`}
                placeholder={t?.('brief_description') || "Brief description of the assignment..."}
                required
              />
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">
                  <ListChecks className="w-4 h-4 inline mr-2" /> 
                  {t?.('instructions') || "Instructions"} *
                </label>
                <button
                  type="button"
                  onClick={onAddInstruction}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-1" /> 
                  {t?.('add_instruction') || "Add Instruction"}
                </button>
              </div>
              <div className="space-y-3">
                {instructions.map((instruction: any, index: number) => (
                  <div key={instruction.id} className="flex items-start gap-2">
                    <span className={`mt-3 px-2 py-1 rounded text-xs ${
                      theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      {index + 1}
                    </span>
                    <textarea
                      value={instruction.text}
                      onChange={(e) => onUpdateInstruction(instruction.id, e.target.value)}
                      rows={2}
                      className={`flex-1 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                      placeholder={t?.('enter_instruction') || "Enter instruction..."}
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveInstruction(instruction.id)}
                      className={`mt-3 p-2 rounded-lg ${
                        theme === 'dark' 
                          ? 'hover:bg-white/10 text-red-400' 
                          : 'hover:bg-gray-200 text-red-500'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Background Images */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <ImageIcon className="w-4 h-4 inline mr-2" /> 
                {t?.('background_image') || "Background Image"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {assignmentBackgrounds.map((image: string, index: number) => (
                  <div 
                    key={index}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 ${
                      assignmentForm.backgroundImage === image 
                        ? 'border-green-500' 
                        : theme === 'dark' ? 'border-white/10' : 'border-gray-300'
                    }`}
                    onClick={() => setAssignmentForm({...assignmentForm, backgroundImage: image})}
                  >
                    <img 
                      src={image} 
                      alt={`Option ${index + 1}`} 
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Tag className="w-4 h-4 inline mr-2" /> 
                {t?.('category') || "Category"}
              </label>
              <select
                value={assignmentForm.category}
                onChange={(e) => setAssignmentForm({...assignmentForm, category: e.target.value})}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 border-gray-700 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border`}
              >
                {categories.map((category: string) => (
                  <option key={category} value={category} className={theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Requirements */}
            <div>
              <h4 className="font-bold text-lg mb-4">
                <ListChecks className="w-5 h-5 inline mr-2" /> 
                {t?.('minimum_requirements') || "Minimum Requirements"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Database className="w-4 h-4 inline mr-2" /> 
                    {t?.('minimum_facts') || "Minimum Facts"}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={assignmentForm.minFacts}
                    onChange={(e) => setAssignmentForm({...assignmentForm, minFacts: parseInt(e.target.value)})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <List className="w-4 h-4 inline mr-2" /> 
                    {t?.('minimum_rules') || "Minimum Rules"}
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={assignmentForm.minRules}
                    onChange={(e) => setAssignmentForm({...assignmentForm, minRules: parseInt(e.target.value)})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Link className="w-4 h-4 inline mr-2" /> 
                    {t?.('combined_rules') || "Combined Rules"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={assignmentForm.minCombinedRules}
                    onChange={(e) => setAssignmentForm({...assignmentForm, minCombinedRules: parseInt(e.target.value)})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <List className="w-4 h-4 inline mr-2" /> 
                    {t?.('menu_items') || "Menu Items"}
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="20"
                    value={assignmentForm.minMenuItems}
                    onChange={(e) => setAssignmentForm({...assignmentForm, minMenuItems: parseInt(e.target.value)})}
                    className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border border-white/10' 
                        : 'bg-white border border-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <GraduationCap className="w-4 h-4 inline mr-2" /> 
                {t?.('difficulty') || "Difficulty"}
              </label>
              <div className="flex flex-wrap gap-4">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <label key={diff} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="difficulty"
                      value={diff}
                      checked={assignmentForm.difficulty === diff}
                      onChange={(e) => setAssignmentForm({...assignmentForm, difficulty: e.target.value as 'easy'})}
                      className="hidden"
                    />
                    <span className={`px-4 py-2 rounded-lg ${
                      assignmentForm.difficulty === diff 
                        ? diff === 'easy' ? 'bg-green-500 text-white' :
                          diff === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                    }`}>
                      {t?.(diff) || diff}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Trophy className="w-4 h-4 inline mr-2" /> 
                {t?.('points') || "Points"}
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={assignmentForm.points}
                onChange={(e) => setAssignmentForm({...assignmentForm, points: parseInt(e.target.value)})}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white border border-gray-300'
                }`}
              />
            </div>

            {/* Example Code - вече има шаблон по подразбиране! */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <FileCode className="w-4 h-4 inline mr-2" /> 
                {t?.('example_code') || "Example Code"} 
                <span className="text-xs ml-2 opacity-70">({t?.('optional') || "optional"})</span>
              </label>
              <textarea
                value={assignmentForm.exampleCode}
                onChange={(e) => setAssignmentForm({...assignmentForm, exampleCode: e.target.value})}
                rows={10}
                className={`w-full rounded-xl p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white border border-gray-300'
                }`}
                placeholder={t?.('example_code_placeholder') || "Enter Prolog code that students can start with..."}
              />
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {t?.('example_code_hint') || "This code will be pre-loaded in the editor when students start this assignment"}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={onCancel}
                className={`flex-1 py-3 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
              >
                {t?.('cancel') || "Cancel"}
              </button>
              <button
                onClick={onSave}
                disabled={!assignmentForm.title || !assignmentForm.objective}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5 inline mr-2" />
                {editingAssignment 
                  ? t?.('save_changes') || "Save Changes" 
                  : t?.('create_assignment') || "Create Assignment"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
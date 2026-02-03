import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Target, TrendingUp, Award, 
  Brain, Users as GroupIcon, Coffee, 
  Sparkles, ChevronRight,
  BarChart3, Menu, X,
  BookOpen, Calendar,
  CheckCircle, Upload, FileCode, FileText,
  Folder, Search, Download, Eye,
  Edit, Trash2, Star, MoreVertical,
  GraduationCap, FolderOpen, User,
  Plus, RefreshCw, FileUp,
  FileTextIcon,
  TargetIcon,
  FileCheck,
  ListChecks,
  ImageIcon,
  Tag,
  Database,
  Link,
  Trophy,
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
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { supabase } from "../services/supabase";

// Instruction type for the form
interface InstructionItem {
  id: number;
  text: string;
}

// Initialize with some default instructions
const initialInstructions: InstructionItem[] = [
  { id: 1, text: "The goal of the assignment is to create an expert system that collects, organizes, and uses knowledge from a school subject (biology, chemistry, or physics), applying logical rules to derive new information." },
  { id: 2, text: "Develop a working expert system on a topic chosen by the student from: Biology (e.g., insects, ecosystems, organs), Chemistry (e.g., substances, reactions, acids and bases), or Physics (e.g., motion, forces, electricity)." },
  { id: 3, text: "The system must be implemented in Prolog and start with the main predicate start/0." },
];

const folders = ["animals", "geography", "history", "mineralwater", "balkan"];

const courses = [
  { id: 1, title: "UI Design", description: "Learn design basics", progress: 70, color: "#FF6B8B", icon: "🎨" },
  { id: 2, title: "Programming", description: "Prolog fundamentals", progress: 45, color: "#36D1DC", icon: "💻" },
  { id: 3, title: "Algorithms", description: "Advanced logic", progress: 85, color: "#FFD166", icon: "🧠" },
  { id: 4, title: "Data Structures", description: "Master Prolog structures", progress: 30, color: "#9D4EDD", icon: "📊" },
  { id: 5, title: "Database Systems", description: "SQL and Prolog integration", progress: 60, color: "#4CC9F0", icon: "🗄️" },
  { id: 6, title: "AI & ML", description: "Artificial Intelligence basics", progress: 25, color: "#FF9E6D", icon: "🤖" },
];

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

const assignmentBackgrounds = [
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
];

const categories = ["Design", "Programming", "Algorithms", "Data Science", "Database", "AI"];

export default function TeacherDashboard() {
  
  const { user: _currentUser, userData } = useAuth();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState(folders[0]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submissions, setSubmissions] = useState<
    { id: string; name: string; date: string; status: string; code?: string }[]
  >([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingStudentFiles, setViewingStudentFiles] = useState<string | null>(null);
  
  // Grading states
  const [selectedPoints, setSelectedPoints] = useState<{[key: string]: number}>({});
  const [feedbackText, setFeedbackText] = useState<{[key: string]: string}>({});
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  
  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);
  
  // New items for today
  const [newItemsToday] = useState([
    { id: 1, title: t?.('challenge_algorithms') || "Algorithm Challenge", type: "assignment", time: "2 hours" },
    { id: 2, title: t?.('new_course_ml') || "New Course: Machine Learning", type: "course", time: "4 hours" },
    { id: 3, title: t?.('student_file_project') || "Student File: project.pl", type: "submission", time: "6 hours" },
    { id: 4, title: t?.('homework_check') || "Homework Check", type: "grading", time: "8 hours" },
  ]);

  // Form state
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
  exampleCode: `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
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
    process_choice(Choice).`,
  backgroundImage: assignmentBackgrounds[0],
  category: "Programming"
});
const [instructions, setInstructions] = useState<InstructionItem[]>(initialInstructions);
// Add instruction function
const addInstruction = () => {
  const newId = instructions.length > 0 ? Math.max(...instructions.map(i => i.id)) + 1 : 1;
  setInstructions([...instructions, { id: newId, text: "" }]);
};

// Update instruction function
const updateInstruction = (id: number, text: string) => {
  setInstructions(instructions.map(inst => 
    inst.id === id ? { ...inst, text } : inst
  ));
  // Update the form instructions as well
  setAssignmentForm({
    ...assignmentForm,
    instructions: instructions.map(inst => 
      inst.id === id ? text : inst.text
    )
  });
};

// Remove instruction function
const removeInstruction = (id: number) => {
  setInstructions(instructions.filter(inst => inst.id !== id));
  // Update the form instructions as well
  setAssignmentForm({
    ...assignmentForm,
    instructions: instructions.filter(inst => inst.id !== id).map(inst => inst.text)
  });
};

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
console.log(getStatusClass, getStatusText, getFileStatusText);
  // Handler functions for grading
  const handleQuickPoints = (studentId: string, points: number) => {
    setSelectedPoints(prev => ({
      ...prev,
      [studentId]: points
    }));
  };

  const handleSaveGrade = async (student: Student) => {
    const points = selectedPoints[student.username] || 0;
    const feedback = feedbackText[student.username] || "";
    try {
      console.log (feedback)
      console.log(`Saving grade for ${student.username}: ${points}/10`);
      alert(`${t?.('grade_saved') || 'Grade saved'}: ${points}/10 ${t?.('for') || 'for'} ${student.username}`);
      
      setStudents(prev => prev.map(s => 
        s.username === student.username 
          ? { ...s, averagePoints: points } 
          : s
      ));
    } catch (error) {
      console.error("Error saving grade:", error);
    }
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
    element.href = URL.createObjectURL(fileBlob);
    element.download = file.originalFileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

  // Load submissions
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

  // Load students
  useEffect(() => {
    if (selectedTab === "students" && (userData?.role === 'teacher' || userData?.role === 'admin')) {
      loadAllStudentsData();
    }
  }, [selectedTab, userData?.role]);

  // Load assignments
  useEffect(() => {
    if (selectedTab === "assignments" || selectedTab === "dashboard") {
      loadAssignments();
    }
  }, [selectedTab]);

  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const q = query(
        collection(db, "assignments"),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      const assignmentsData: Assignment[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        assignmentsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          objective: data.objective,
          topic: data.topic,
          subject: data.subject,
          requirements: data.requirements,
          instructions: data.instructions,
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          createdAt: data.createdAt,
          dueDate: data.dueDate,
          status: data.status || 'active',
          difficulty: data.difficulty || 'medium',
          points: data.points || 100,
          exampleCode: data.exampleCode,
          backgroundImage: data.backgroundImage || assignmentBackgrounds[Math.floor(Math.random() * assignmentBackgrounds.length)],
          category: data.category || categories[Math.floor(Math.random() * categories.length)],
          progress: data.progress || 0,
          actionText: t?.('view') || "View"
        });
      });
      
      setAssignments(assignmentsData);
    } catch (error) {
      console.error(t?.('load_assignments_error') || "Error loading assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleCreateOrUpdateAssignment = async () => {
    if (!user || !userData) {
      alert(t?.('login_as_teacher') || "Please login as a teacher!");
      return;
    }

    try {
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
        teacherId: user.uid,
        teacherName: userData.fullName || user.email?.split('@')[0] || t?.('teacher') || "Teacher",
        createdAt: serverTimestamp(),
        dueDate: assignmentForm.dueDate,
        status: 'active',
        difficulty: assignmentForm.difficulty,
        points: assignmentForm.points,
        exampleCode: assignmentForm.exampleCode,
        backgroundImage: assignmentForm.backgroundImage,
        category: assignmentForm.category
      };

      if (editingAssignment) {
        await updateDoc(doc(db, "assignments", editingAssignment.id), assignmentData);
        setUploadStatus("✅ " + (t?.('assignment_updated') || "Assignment updated successfully!"));
      } else {
        await addDoc(collection(db, "assignments"), assignmentData);
        setUploadStatus("✅ " + (t?.('assignment_created') || "Assignment created successfully!"));
      }

      await loadAssignments();
      setShowAssignmentForm(false);
      setEditingAssignment(null);
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
        instructions: [
          t?.('assignment_instructions_1') || "The project must contain:",
          t?.('assignment_instructions_2') || "Title section (comments) - subject, topic, student name, class, date",
          t?.('assignment_instructions_3') || "Knowledge base (facts) - minimum 20 facts related to the topic",
          t?.('assignment_instructions_4') || "Logical rules - minimum 5 rules that derive new information",
          t?.('assignment_instructions_5') || "User menu - main predicate start/0, menu with at least 5 choices",
          t?.('assignment_instructions_6') || "Working queries - the system must respond correctly"
        ],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        difficulty: 'medium',
        points: 100,
        exampleCode: "",
        backgroundImage: assignmentBackgrounds[0],
        category: "Programming"
      });

    } catch (error) {
      console.error(t?.('save_assignment_error') || "Error saving assignment:", error);
      setUploadStatus("❌ " + (t?.('save_assignment_error') || "Error saving assignment!"));
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
      exampleCode: assignment.exampleCode || "",
      backgroundImage: assignment.backgroundImage || assignmentBackgrounds[0],
      category: assignment.category || "Programming"
    });
    setShowAssignmentForm(true);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm(t?.('confirm_delete_assignment') || "Are you sure you want to delete this assignment?")) return;

    try {
      await deleteDoc(doc(db, "assignments", assignmentId));
      setUploadStatus("✅ " + (t?.('assignment_deleted') || "Assignment deleted successfully!"));
      await loadAssignments();
    } catch (error) {
      console.error(t?.('delete_assignment_error') || "Error deleting assignment:", error);
      setUploadStatus("❌ " + (t?.('delete_assignment_error') || "Error deleting assignment!"));
    }
  };

  const loadAllStudentsData = async () => {
    setLoadingStudents(true);
    try {
      console.log("🔄 " + (t?.('loading_students') || "Loading students..."));
      
      const currentUserRole = userData?.role;
      if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        console.log("❌ " + (t?.('no_access_rights') || "No access rights"));
        setStudents([]);
        return;
      }

      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      const usersData: Record<string, any> = {};
      const studentUserIds: string[] = [];
      
      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        usersData[doc.id] = user;
        
        if (user.role === 'student') {
          studentUserIds.push(doc.id);
        }
      });

      const codesQuery = query(collection(db, "prologCodes"));
      const codesSnapshot = await getDocs(codesQuery);
      
      const filesByStudent: Record<string, StudentFile[]> = {};
      
      codesSnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        
        if (studentUserIds.includes(userId)) {
          const studentName = data.studentName || 
                           data.username || 
                           usersData[userId]?.fullName || 
                           usersData[userId]?.email?.split('@')[0] || 
                           `Student_${userId.substring(0, 6)}`;
          
          const studentKey = studentName;
          
          if (!filesByStudent[studentKey]) {
            filesByStudent[studentKey] = [];
          }
          
          filesByStudent[studentKey].push({
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
      
      Object.keys(filesByStudent).forEach(studentKey => {
        const studentFiles = filesByStudent[studentKey];
        const sortedFiles = studentFiles.sort((a, b) => 
          new Date(b.createdAt?.toMillis?.() || 0).getTime() - 
          new Date(a.createdAt?.toMillis?.() || 0).getTime()
        );

        const user = Object.values(usersData).find(u => 
          u.fullName === studentKey || 
          u.email?.split('@')[0] === studentKey ||
          `Student_${u.uid?.substring(0, 6)}` === studentKey
        );

        const averagePoints = studentFiles.length > 0 
          ? studentFiles.reduce((sum, file) => sum + (file.points || 0), 0) / studentFiles.length
          : 0;

        studentsArray.push({
          username: studentKey,
          email: user?.email || "",
          class: user?.class || t?.('na') || "N/A",
          files: sortedFiles,
          totalFiles: studentFiles.length,
          lastUpload: sortedFiles.length > 0 
            ? new Date(sortedFiles[0].createdAt?.toMillis?.() || Date.now()).toLocaleDateString()
            : t?.('no_uploads') || "No uploaded files",
          role: 'student',
          averagePoints,
          status: averagePoints >= 7 ? 'active' : averagePoints >= 5 ? 'warning' : 'inactive'
        });
      });

      studentUserIds.forEach(userId => {
        const user = usersData[userId];
        if (user) {
          const studentName = user.fullName || 
                           user.email?.split('@')[0] || 
                           `Student_${userId.substring(0, 6)}`;
          
          const alreadyAdded = studentsArray.some(s => s.username === studentName);
          
          if (!alreadyAdded) {
            studentsArray.push({
              username: studentName,
              email: user.email || "",
              class: user.class || t?.('na') || "N/A",
              files: [],
              totalFiles: 0,
              lastUpload: t?.('no_uploads') || "No uploaded files",
              role: 'student',
              averagePoints: 0,
              status: 'inactive'
            });
          }
        }
      });

      studentsArray.sort((a, b) => b.totalFiles - a.totalFiles);
      setStudents(studentsArray);
      
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
      const { data: uploadData, error } = await supabase.storage
        .from("prolog-files")
        .upload(path, file, { 
          upsert: false,
          cacheControl: '3600',
          contentType: file.type || 'text/plain'
        });
console.log(uploadData, error);
      if (error) {
        if (error.message.includes('already exists')) {
          const newRandomId = Math.random().toString(36).substring(2, 8);
          const newFinalFileName = `${username}_${safeFileName}_${shortTimestamp}${newRandomId}.pl`;
          const newPath = `${folder}/${newFinalFileName}`;
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from("prolog-files")
            .upload(newPath, file, { 
              upsert: false,
              cacheControl: '3600'
            });
console.log(retryData, retryError);
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
        code: `File: ${originalName}`,
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

  // Calculate statistics
  const totalSubmissions = submissions.length;
  const successfulSubmissions = submissions.filter(s => s.status === "success").length;
  const fileUploads = submissions.filter(s => s.name.includes("File:")).length;
  const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;
  const activeAssignments = assignments.filter(a => a.status === "active").length;
  const completedAssignments = activeAssignments;
  const totalAssignmentsCount = assignments.length;
  const completionRate = totalAssignmentsCount > 0 ? Math.round((completedAssignments / totalAssignmentsCount) * 100) : 0;

  const topStudents = [...students]
    .sort((a, b) => (b.averagePoints || 0) - (a.averagePoints || 0))
    .slice(0, 5);
console.log(completionRate);
  const overallAverage = students.length > 0 
    ? (students.reduce((sum, s) => sum + (s.averagePoints || 0), 0) / students.length).toFixed(2)
    : "0.00";
console.log(overallAverage);
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

  // Navigation items - Променени имена
  const navItems = [
    { id: "dashboard", label: t?.('dashboard') || "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "courses", label: t?.('my_lessons') || "My Lessons", icon: <BookOpen className="w-5 h-5" /> },
    { id: "assignments", label: t?.('all_assignments') || "Assignments", icon: <FileText className="w-5 h-5" /> },
    { id: "submissions", label: t?.('submissions') || "Submissions", icon: <Folder className="w-5 h-5" /> },
    { id: "file-upload", label: t?.('upload_file') || "Upload File", icon: <FileCode className="w-5 h-5" /> },
  ];

  if (userData?.role === 'teacher' || userData?.role === 'admin') {
    navItems.splice(3, 0, { id: "students", label: t?.('students') || "Students", icon: <Users className="w-5 h-5" /> });
  }

  return (
    <div className={`flex min-h-screen ${currentTheme.background} ${currentTheme.text} pt-24`}>
      {/* Sidebar - Fixed positioning */}
<AnimatePresence>
  {isSidebarOpen && (
    <motion.div
  initial={{ x: -300 }}
  animate={{ x: 0 }}
  exit={{ x: -300 }}
  className={`fixed lg:sticky top-24 left-0 h-[calc(100vh-6rem)] w-64 ${currentTheme.sidebar} border-r backdrop-blur-xl z-40 lg:z-20`}
>
      <div className="p-10 h-full flex flex-col overflow-y-auto">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">
              {user?.email?.split('@')[0] || t?.('teacher') || "Teacher"}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "Teacher"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedTab(item.id);
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                selectedTab === item.id
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600"
                  : `${currentTheme.hover} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {(item.id === "courses" || item.id === "assignments" || item.id === "students") && (
                <span className={`ml-auto px-2 py-1 rounded-lg text-xs ${
                  theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                }`}>
                  {item.id === "courses" ? courses.length :
                   item.id === "assignments" ? assignments.length :
                   students.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className={`pt-6 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 ${
              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
            }`}>
              <div className="text-lg font-bold">{totalSubmissions}</div>
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t?.('submissions') || "Submissions"}</div>
            </div>
            <div className={`rounded-lg p-3 ${
              theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
            }`}>
              <div className="text-lg font-bold">{successRate}%</div>
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t?.('success_rate') || "Success"}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
        {/* Top Navigation */}
        <div className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-lg border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="overflow-y-auto h-[calc(100vh-64px)] p-6">
          {/* Dashboard Content */}
          {selectedTab === "dashboard" && (
            <>
              {/* Welcome Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <div className={`rounded-2xl p-6 border ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-gray-900/80 to-gray-800/80 border-white/10' 
                    : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                } backdrop-blur-xl`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                          {t?.('welcome_back') || "Welcome back"}, {userData?.fullName || user?.email?.split('@')[0] || "Teacher"}!
                        </h1>
                      </div>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        {t?.('what_to_teach') || "What do you want to teach today?"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium">
                        {t?.('explore_courses') || "Explore Courses"}
                      </button>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <input
                          type="text"
                          placeholder={t?.('search_placeholder') || "Search..."}
                          className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                            theme === 'dark' 
                              ? 'bg-white/5 border-white/10' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  { title: t?.('total_submissions') || "Total Submissions", value: totalSubmissions, color: "from-green-500 to-emerald-500", icon: FileCode },
                  { title: t?.('successful') || "Successful", value: successfulSubmissions, color: "from-blue-500 to-cyan-500", icon: CheckCircle },
                  { title: t?.('file_uploads') || "File Uploads", value: fileUploads, color: "from-purple-500 to-pink-500", icon: Upload },
                  { title: t?.('success_rate') || "Success Rate", value: `${successRate}%`, color: "from-amber-500 to-orange-500", icon: TrendingUp },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    className={`rounded-2xl p-6 border backdrop-blur-xl ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color}/20 flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${
                          stat.color.includes('green') ? 'text-green-400' :
                          stat.color.includes('blue') ? 'text-blue-400' :
                          stat.color.includes('purple') ? 'text-purple-400' :
                          'text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className={theme === 'dark' ? 'text-gray-300 text-sm' : 'text-gray-600 text-sm'}>{stat.title}</h3>
                        <div className="text-3xl font-bold">{stat.value}</div>
                      </div>
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {idx === 0 ? t?.('all_time_submissions') || "All time submissions" :
                       idx === 1 ? t?.('completed_submissions') || "Completed submissions" :
                       idx === 2 ? t?.('total_files_uploaded') || "Total files uploaded" :
                       t?.('overall_success_rate') || "Overall success rate"}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* New Items Today & Assignments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* New Items Today */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={`rounded-2xl p-6 border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  } backdrop-blur-xl`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold">{t?.('new_today') || "New Today"}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {newItemsToday.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                            theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.type === 'assignment' ? 'bg-blue-500/20 text-blue-500' :
                            item.type === 'course' ? 'bg-purple-500/20 text-purple-500' :
                            item.type === 'submission' ? 'bg-green-500/20 text-green-500' :
                            'bg-amber-500/20 text-amber-500'
                          }`}>
                            {item.type === 'assignment' ? '📝' :
                             item.type === 'course' ? '📚' :
                             item.type === 'submission' ? '📎' : '✏️'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {item.type === 'assignment' ? t?.('assignment') || 'Assignment' :
                                 item.type === 'course' ? t?.('course') || 'Course' :
                                 item.type === 'submission' ? t?.('file') || 'File' : t?.('grading') || 'Grading'}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                                {item.time} {t?.('ago') || "ago"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Assignments Section */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className={`rounded-2xl p-6 border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  } backdrop-blur-xl`}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold">{t?.('assignments') || "Assignments"}</h3>
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
                      {assignments.slice(0, 3).map((assignment) => (
                        <div
                          key={assignment.id}
                          className={`p-4 rounded-xl border ${
                            theme === 'dark' 
                              ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between mb-3">
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
                                <h4 className="font-medium">{assignment.title}</h4>
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
                          <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {assignment.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {t?.('due') || "Due"}: {assignment.dueDate}
                            </span>
                            <button className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
                              {t?.('view_details') || "View Details"} →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(userData?.role === 'teacher' || userData?.role === 'admin') && (
                      <button
                        onClick={() => setShowAssignmentForm(true)}
                        className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {t?.('add_new_assignment') || "Add New Assignment"}
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Top Students & AI Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Students */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className={`rounded-2xl p-6 border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  } backdrop-blur-xl`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-400" />
                      </div>
                      <h3 className="text-xl font-bold">🏆 {t?.('top_students') || "Top Students"}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {topStudents.map((student, index) => (
                        <div
                          key={student.username}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                            theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-500' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 text-gray-500' :
                            index === 2 ? 'bg-gradient-to-r from-amber-700/20 to-orange-500/20 text-amber-600' :
                            'bg-gradient-to-r from-gray-300/20 to-gray-400/20 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center text-green-600 font-semibold">
                                {student.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-medium">{student.username}</h4>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                    {t?.('avg') || "Avg"}: <span className="text-green-500">{student.averagePoints?.toFixed(1) || "0.0"}</span>
                                  </span>
                                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                    {t?.('files') || "Files"}: <span className="text-blue-500">{student.totalFiles}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* AI Recommendations */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className={`rounded-2xl p-6 border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  } backdrop-blur-xl`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold">{t?.('recommendations') || "Recommendations"}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <AnimatePresence>
                        {recommendations.map((rec) => (
                          <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
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
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Courses Tab - Променено на "Моите уроци" */}
          {selectedTab === "courses" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t?.('my_lessons') || "My Lessons"}</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t?.('manage_organize_lessons') || "Manage and organize your lessons"}</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t?.('add_new_lesson') || "Add New Lesson"}
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
                        {t?.('preview') || "Preview"}
                      </button>
                      <button className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                      } transition-colors`}>
                        {t?.('edit') || "Edit"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Tab - Променено да е за assignments */}
          {selectedTab === "assignments" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t?.('all_assignments') || "All Assignments"}</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t?.('manage_create_assignments') || "Manage and create new assignments"}</p>
                </div>
                <div className="flex gap-2">
                  {(userData?.role === 'teacher' || userData?.role === 'admin') && (
                    <button
                      onClick={() => setShowAssignmentForm(true)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t?.('add_assignment') || "Add Assignment"}
                    </button>
                  )}
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
                    {t?.('create_first_assignment') || "Create your first assignment to get started"}
                  </p>
                  {(userData?.role === 'teacher' || userData?.role === 'admin') && (
                    <button
                      onClick={() => setShowAssignmentForm(true)}
                      className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      {t?.('create_first_assignment') || "Create First Assignment"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map((assignment) => (
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
                          <Star className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            {t?.('points') || "Points"}: {assignment.points}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {(userData?.role === 'teacher' || userData?.role === 'admin') ? (
                          <>
                            <button
                              onClick={() => handleEditAssignment(assignment)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                theme === 'dark' 
                                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                              }`}
                            >
                              <Edit className="w-4 h-4 inline mr-1" /> {t?.('edit') || "Edit"}
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                theme === 'dark' 
                                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                                  : 'bg-red-100 hover:bg-red-200 text-red-600'
                              }`}
                            >
                              <Trash2 className="w-4 h-4 inline mr-1" /> {t?.('delete') || "Delete"}
                            </button>
                          </>
                        ) : (
                          <button className={`w-full py-2 rounded-lg text-sm font-medium ${
                            theme === 'dark' 
                              ? 'bg-white/5 hover:bg-white/10' 
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}>
                            <Eye className="w-4 h-4 inline mr-1" /> {t?.('view') || "View"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submissions Tab */}
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

          {/* File Upload Tab */}
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
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white border-gray-300'
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

          {/* Students Tab */}
          {selectedTab === "students" && (userData?.role === 'teacher' || userData?.role === 'admin') && (
            <div className="mb-8">
              <div className={`rounded-2xl p-6 border ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              } backdrop-blur-xl`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{t?.('students') || "Students"}</h2>
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
                          <th className="py-3 px-4 text-left font-medium">{t?.('last_upload') || "Last Upload"}</th>
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
                                
                              </div>
                            </td>
                            <td className="py-4 px-4">{student.lastUpload}</td>
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
                                  onClick={() => setEditingStudent(student.username)}
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
                                <button className={`p-2 rounded ${
                                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                } transition-colors`}>
                                  <MoreVertical className="w-4 h-4" />
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

          {/* Student Files Modal */}
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
                className={`relative w-full max-w-4xl rounded-2xl border overflow-hidden ${
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
                              onClick={() => downloadFile(file)}
                              className={`p-2 rounded-lg ${
                                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                              } transition-colors`}
                              title={t?.('download_file') || "Download File"}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {file.points !== undefined && (
                              <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs font-medium">
                                {file.points}/10
                              </span>
                            )}
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
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Grading Modal */}
          {editingStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/80" onClick={() => setEditingStudent(null)} />
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={`relative w-full max-w-2xl rounded-2xl border overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {t?.('grade_student') || "Grade Student"}: {editingStudent}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingStudent(null)}
                      className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4">{t?.('assign_points') || "Assign Points"}</h4>
                      <div className="flex flex-wrap gap-2">
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((points) => (
                          <button
                            key={points}
                            onClick={() => handleQuickPoints(editingStudent, points)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              selectedPoints[editingStudent] === points
                                ? 'bg-green-500 text-white'
                                : theme === 'dark' 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {points}
                          </button>
                        ))}
                      </div>
                      <div className={`mt-4 p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      }`}>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {t?.('selected_points') || "Selected Points"}:
                        </span>
                        <span className="ml-2 text-xl font-bold text-green-500">
                          {selectedPoints[editingStudent] || 0}/10
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-4">{t?.('feedback') || "Feedback"}</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          { text: t?.('excellent_work') || 'Excellent Work!', color: 'bg-green-500' },
                          { text: t?.('needs_correction') || 'Needs Correction', color: 'bg-yellow-500' },
                          { text: t?.('missing_requirements') || 'Missing Requirements', color: 'bg-red-500' },
                          { text: t?.('creative_solution') || 'Creative Solution', color: 'bg-blue-500' }
                        ].map((tag, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAddFeedbackTag(editingStudent, tag.text)}
                            className={`px-3 py-1 rounded-full text-sm text-white ${tag.color}`}
                          >
                            {tag.text}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackText[editingStudent] || ''}
                        onChange={(e) => setFeedbackText(prev => ({
                          ...prev,
                          [editingStudent]: e.target.value
                        }))}
                        placeholder={t?.('add_detailed_feedback') || "Add detailed feedback..."}
                        className={`w-full h-32 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none ${
                          theme === 'dark' 
                            ? 'bg-white/5 border border-white/10' 
                            : 'bg-white border border-gray-300'
                        }`}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingStudent(null)}
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
                          const student = students.find(s => s.username === editingStudent);
                          if (student) {
                            handleSaveGrade(student);
                          }
                          setEditingStudent(null);
                        }}
                        className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                      >
                        <CheckCircle className="w-5 h-5 inline mr-2" />
                        {t?.('save_grade') || "Save Grade"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Assignment Form Modal */}
          {showAssignmentForm && (userData?.role === 'teacher' || userData?.role === 'admin') && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
  >
    <div className="absolute inset-0 bg-black/80" onClick={() => setShowAssignmentForm(false)} />
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
                {editingAssignment ? t?.('edit_assignment') || "Edit Assignment" : t?.('create_new_assignment') || "Create New Assignment"}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAssignmentForm(false);
              setEditingAssignment(null);
            }}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
            } transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {uploadStatus && (
          <div className={`mb-6 p-3 rounded-lg ${
            uploadStatus.includes('✅') 
              ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
              : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
          }`}>
            {uploadStatus}
          </div>
        )}

        <div className="space-y-6">
          {/* Основна информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <FileTextIcon className="w-4 h-4 inline mr-2" /> {t?.('assignment_title') || "Assignment Title"} *
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
                <TargetIcon className="w-4 h-4 inline mr-2" /> {t?.('topic') || "Topic"} *
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
                <BookOpen className="w-4 h-4 inline mr-2" /> {t?.('subject') || "Subject"} *
              </label>
              <select
                value={assignmentForm.subject}
                onChange={(e) => setAssignmentForm({...assignmentForm, subject: e.target.value})}
                className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border border-white/10' 
                    : 'bg-white border border-gray-300'
                }`}
              >
                <option value="biology">{t?.('biology') || "Biology"}</option>
                <option value="chemistry">{t?.('chemistry') || "Chemistry"}</option>
                <option value="physics">{t?.('physics') || "Physics"}</option>
                <option value="other">{t?.('other') || "Other"}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" /> {t?.('due_date') || "Due Date"} *
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

          {/* Цел и описание */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Target className="w-4 h-4 inline mr-2" /> {t?.('objective') || "Objective"} *
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

          <div>
            <label className="block text-sm font-medium mb-2">
              <FileCheck className="w-4 h-4 inline mr-2" /> {t?.('description') || "Description"} *
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

          {/* Инструкции */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium">
                <ListChecks className="w-4 h-4 inline mr-2" /> {t?.('instructions') || "Instructions"} *
              </label>
              <button
                type="button"
                onClick={addInstruction}
                className={`px-3 py-1 rounded-lg text-sm ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-1" /> {t?.('add_instruction') || "Add Instruction"}
              </button>
            </div>
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={instruction.id} className="flex items-start gap-2">
                  <span className={`mt-3 px-2 py-1 rounded text-xs ${
                    theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                  }`}>
                    {index + 1}
                  </span>
                  <textarea
                    value={instruction.text}
                    onChange={(e) => updateInstruction(instruction.id, e.target.value)}
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
                    onClick={() => removeInstruction(instruction.id)}
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

          {/* Фонова снимка */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <ImageIcon className="w-4 h-4 inline mr-2" /> {t?.('background_image') || "Background Image"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {assignmentBackgrounds.map((image, index) => (
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

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Tag className="w-4 h-4 inline mr-2" /> {t?.('category') || "Category"}
            </label>
            <select
              value={assignmentForm.category}
              onChange={(e) => setAssignmentForm({...assignmentForm, category: e.target.value})}
              className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                theme === 'dark' 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-white border border-gray-300'
              }`}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Минимални изисквания */}
          <div>
            <h4 className="font-bold text-lg mb-4">
              <ListChecks className="w-5 h-5 inline mr-2" /> {t?.('minimum_requirements') || "Minimum Requirements"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Database className="w-4 h-4 inline mr-2" /> {t?.('minimum_facts') || "Minimum Facts"}
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
                  <List className="w-4 h-4 inline mr-2" /> {t?.('minimum_rules') || "Minimum Rules"}
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
                  <Link className="w-4 h-4 inline mr-2" /> {t?.('combined_rules') || "Combined Rules"}
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
                  <List className="w-4 h-4 inline mr-2" /> {t?.('menu_items') || "Menu Items"}
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

          {/* Трудност */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <GraduationCap className="w-4 h-4 inline mr-2" /> {t?.('difficulty') || "Difficulty"}
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="easy"
                  checked={assignmentForm.difficulty === 'easy'}
                  onChange={(e) => setAssignmentForm({...assignmentForm, difficulty: e.target.value as 'easy'})}
                  className="hidden"
                />
                <span className={`px-4 py-2 rounded-lg ${assignmentForm.difficulty === 'easy' ? 'bg-green-500 text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {t?.('easy') || "Easy"}
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="medium"
                  checked={assignmentForm.difficulty === 'medium'}
                  onChange={(e) => setAssignmentForm({...assignmentForm, difficulty: e.target.value as 'medium'})}
                  className="hidden"
                />
                <span className={`px-4 py-2 rounded-lg ${assignmentForm.difficulty === 'medium' ? 'bg-yellow-500 text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {t?.('medium') || "Medium"}
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={assignmentForm.difficulty === 'hard'}
                  onChange={(e) => setAssignmentForm({...assignmentForm, difficulty: e.target.value as 'hard'})}
                  className="hidden"
                />
                <span className={`px-4 py-2 rounded-lg ${assignmentForm.difficulty === 'hard' ? 'bg-red-500 text-white' : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {t?.('hard') || "Hard"}
                </span>
              </label>
            </div>
          </div>

          {/* Точки */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Trophy className="w-4 h-4 inline mr-2" /> {t?.('points') || "Points"}
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

          {/* Примерен код */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <FileCode className="w-4 h-4 inline mr-2" /> {t?.('example_code') || "Example Code"} ({t?.('optional') || "optional"})
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
              placeholder={t?.('example_code_placeholder') || "You can provide example Prolog code..."}
            />
          </div>

          {/* Бутони за действие */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowAssignmentForm(false);
                setEditingAssignment(null);
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
              onClick={handleCreateOrUpdateAssignment}
              disabled={!assignmentForm.title || !assignmentForm.objective}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5 inline mr-2" />
              {editingAssignment ? t?.('save_changes') || "Save Changes" : t?.('create_assignment') || "Create Assignment"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
)}
        </div>
      </div>
    </div>
  );
}
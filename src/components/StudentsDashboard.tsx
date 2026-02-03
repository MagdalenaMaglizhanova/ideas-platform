import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, BookOpen, FileText, Upload, History, 
  ChevronRight, Menu, X, BarChart3, Zap,
  Target, CheckCircle, AlertCircle,
  Eye, Plus,
  Calendar, Award, TrendingUp,
  GraduationCap, Brain, 
  Search, 
  Play, UploadCloud,
  Code,
  User,
  FileCode,
  Globe,
  Cpu,
  Database,
  Copy,
  RefreshCw
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
} from "firebase/firestore";

// Courses data
const courses = [
  { id: 1, title: "UI Design", description: "Learn design basics", progress: 70, color: "from-pink-500 to-rose-500", icon: "🎨" },
  { id: 2, title: "Programming", description: "Prolog fundamentals", progress: 45, color: "from-blue-500 to-cyan-500", icon: "💻" },
  { id: 3, title: "Algorithms", description: "Advanced logic", progress: 85, color: "from-amber-500 to-orange-500", icon: "🧠" },
  { id: 4, title: "Data Structures", description: "Master Prolog structures", progress: 30, color: "from-purple-500 to-violet-500", icon: "📊" },
  { id: 5, title: "Database Systems", description: "SQL and Prolog integration", progress: 60, color: "from-sky-500 to-blue-500", icon: "🗄️" },
  { id: 6, title: "AI & ML", description: "Artificial Intelligence basics", progress: 25, color: "from-green-500 to-emerald-500", icon: "🤖" },
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
    id: "animals",
    name: "Animals Knowledge Base",
    description: "Animal classification and characteristics",
    code: `start :-
    writeln('=== ANIMAL KNOWLEDGE BASE ==='),
    writeln('Animal expert system template'),
    nl.`
  },
  {
    id: "geography",
    name: "Geography Facts System",
    description: "Geographical data and relationships",
    code: `start :-
    writeln('=== GEOGRAPHY EXPERT SYSTEM ==='),
    writeln('Geographical facts and relationships'),
    nl.`
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
    nl.

%%%%%%%%%%%%%%%%%%%%%%%%%
% KNOWLEDGE BASE
%%%%%%%%%%%%%%%%%%%%%%%%%
% Add your facts and rules here

%%%%%%%%%%%%%%%%%%%%%%%%%
% UTILITY PREDICATES
%%%%%%%%%%%%%%%%%%%%%%%%%
% Add helper predicates here

%%%%%%%%%%%%%%%%%%%%%%%%%
% MAIN EXECUTION
%%%%%%%%%%%%%%%%%%%%%%%%%
:- initialization(main).

main :-
    writeln('Loading Expert System...'),
    start.`
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
  };
}

export default function StudentsDashboard() {
  const { user, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [code, setCode] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  const [codeMetadata, setCodeMetadata] = useState({
    domain: "",
    type: "Symbolic AI / Expert System",
    studentName: userData?.fullName || user?.email?.split('@')[0] || t('student') || "Student",
    dataArea: "",
    assignmentId: "",
    assignmentTitle: ""
  });

  const [submissions, setSubmissions] = useState<
    { id: string; name: string; date: string; status: string; code?: string; assignmentId?: string }[]
  >([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeRecommendation, setActiveRecommendation] = useState<number | null>(null);

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
      title: t('practice_makes_perfect') || "Practice Makes Perfect",
      description: t('practice_makes_perfect_desc') || "Try solving 3 new Prolog problems this week to improve your skills.",
      color: "from-purple-500 to-pink-500",
      action: t('start_now') || "Start Now"
    },
    {
      id: 2,
      icon: <Target className="w-5 h-5" />,
      title: t('complete_assignments_early') || "Complete Assignments Early",
      description: t('complete_assignments_early_desc') || "Submit your work 2 days before deadline for bonus points.",
      color: "from-blue-500 to-cyan-500",
      action: t('view_assignments') || "View Assignments"
    },
    {
      id: 3,
      icon: <Users className="w-5 h-5" />,
      title: t('join_study_group') || "Join Study Group",
      description: t('join_study_group_desc') || "Collaborate with classmates on complex Prolog projects.",
      color: "from-green-500 to-emerald-500",
      action: t('join_now') || "Join Now"
    }
  ];

  const navItems = [
    { id: "dashboard", label: t('dashboard') || "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "courses", label: t('my_courses') || "My Courses", icon: <BookOpen className="w-5 h-5" /> },
    { id: "assignments", label: t('assignments') || "Assignments", icon: <FileText className="w-5 h-5" /> },
    { id: "progress", label: t('progress') || "Progress", icon: <TrendingUp className="w-5 h-5" /> },
    { id: "upload", label: t('code_editor') || "Code Editor", icon: <Code className="w-5 h-5" /> },
    { id: "submissions", label: t('submissions') || "Submissions", icon: <History className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (selectedTab === "assignments" || selectedTab === "dashboard" || selectedTab === "upload") {
      loadAssignments();
    }
  }, [selectedTab, user]);

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
        code: doc.data().code,
        assignmentId: doc.data().assignmentId
      }));

      setSubmissions(data);
    });

    return () => unsub();
  }, [user]);

  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const q = query(
        collection(db, "assignments"),
        where("status", "==", "active"),
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

      assignmentsData.forEach(assignment => {
        const studentSubmission = submissions.find(sub => sub.assignmentId === assignment.id);
        if (studentSubmission) {
          assignment.studentProgress = {
            completed: true,
            submissionId: studentSubmission.id,
            submittedAt: new Date(),
            code: studentSubmission.code,
            requirementsMet: {
              facts: 15,
              rules: 4,
              combinedRules: 1,
              menuItems: 5
            }
          };
        }
      });
      
      setAssignments(assignmentsData);
    } catch (error) {
      console.error(t('load_assignments_error') || "Error loading assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const todaysTasks = assignments.map(assignment => {
    const isCompleted = assignment.studentProgress?.completed || false;
    const progress = isCompleted ? 100 : 0;
    
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
      dueTime: `${t('due') || "Due"}: ${new Date(assignment.dueDate).toLocaleDateString()}`,
      estimatedTime: `${assignment.requirements.minFacts}-${assignment.requirements.minFacts + 20} ${t('lines') || "lines"}`,
      priority: priority,
      priorityIcon: priorityIcon,
      completed: isCompleted,
      progress: progress,
      assignment: assignment
    };
  });

  const startTask = (taskId: string) => {
    const assignment = assignments.find(a => a.id === taskId);
    if (assignment) {
      setSelectedAssignment(taskId);
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
        studentName: userData?.fullName || user?.email?.split('@')[0] || t('student') || "Student",
        dataArea: assignment.subject,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title
      });
    }
  };

  const openTaskDetails = (taskId: string) => {
    const assignment = assignments.find(a => a.id === taskId);
    if (assignment) {
      alert(`${t('assignment') || "Assignment"}: ${assignment.title}\n${t('objective') || "Objective"}: ${assignment.objective}\n${t('requirements') || "Requirements"}:\n- ${t('facts') || "Facts"}: ${assignment.requirements.minFacts}\n- ${t('rules') || "Rules"}: ${assignment.requirements.minRules}\n- ${t('menu_items') || "Menu items"}: ${assignment.requirements.minMenuItems}`);
    }
  };

  const totalSubmissions = submissions.length;
  const successfulSubmissions = submissions.filter(s => s.status === "success").length;
  const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;
  const completedAssignments = assignments.filter(a => a.studentProgress?.completed).length;
  const totalAssignmentsCount = assignments.length;
  const completionRate = Math.round((completedAssignments / totalAssignmentsCount) * 100);

  const statsCards = [
    {
      title: t('total_submissions') || "Total Submissions",
      value: totalSubmissions,
      icon: <UploadCloud className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      description: t('all_time_submissions') || "All time submissions"
    },
    {
      title: t('success_rate') || "Success Rate",
      value: `${successRate}%`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      description: t('successful_executions') || "Successful executions"
    },
    {
      title: t('completed_tasks') || "Completed Tasks",
      value: completedAssignments,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      description: t('assignments_completed') || "Assignments completed"
    },
    {
      title: t('active_streak') || "Active Streak",
      value: "7 days",
      icon: <Zap className="w-6 h-6" />,
      color: "from-amber-500 to-orange-500",
      description: t('current_activity_streak') || "Current activity streak"
    }
  ];

  const generateHeader = () => {
    const studentName = codeMetadata.studentName || user?.email?.split('@')[0] || t('student') || "Student";
    const domain = codeMetadata.domain || t('expert_system') || "Expert System";
    const type = codeMetadata.type || "Symbolic AI / Expert System";
    const dataArea = codeMetadata.dataArea || t('general_knowledge') || "General Knowledge";
    const assignmentTitle = codeMetadata.assignmentTitle || t('general_assignment') || "General Assignment";
    
    return `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                  %
%   ${domain.toUpperCase()} KNOWLEDGE-BASED EXPERT SYSTEM           %
%   =====================================           %
%   ${t('domain') || "Domain"}: ${domain.padEnd(40)}%
%   ${t('type') || "Type"}: ${type.padEnd(42)}%
%   ${t('student') || "Student"}: ${studentName.padEnd(37)}%
%   ${t('data_area') || "Data Area"}: ${dataArea.padEnd(35)}%
%   ${t('assignment') || "Assignment"}: ${assignmentTitle.padEnd(33)}%
%   ${t('date') || "Date"}: ${new Date().toLocaleDateString().padEnd(38)}%
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "success": return t('status_success') || "Success";
      case "error": return t('status_error') || "Error";
      default: return t('status_pending') || "Pending";
    }
  };

  const handleUpload = async () => {
    if (!code.trim() || !user) return;

    if (!selectedAssignment && !codeMetadata.assignmentId) {
      setUploadStatus("❌ " + (t('select_assignment') || "Please select an assignment first!"));
      return;
    }

    let finalCode = code;
    if (!code.includes(generateHeader().split('\n')[2])) {
      finalCode = generateHeader() + "\n\n" + code;
    }

    try {
      await addDoc(collection(db, "prologCodes"), {
        userId: user.uid,
        title: `${t('prolog_submission') || "Prolog Submission"} - ${codeMetadata.assignmentTitle || codeMetadata.domain || t('expert_system') || "Expert System"}`,
        code: finalCode,
        status: Math.random() > 0.3 ? "success" : "error",
        metadata: codeMetadata,
        assignmentId: selectedAssignment || codeMetadata.assignmentId,
        assignmentTitle: codeMetadata.assignmentTitle,
        createdAt: serverTimestamp(),
        requirementsAnalysis: {
          factsCount: (finalCode.match(/\.\s*$/gm) || []).length,
          rulesCount: (finalCode.match(/:-/g) || []).length,
          menuItemsCount: (finalCode.match(/writeln.*[0-9]\./g) || []).length
        }
      });

      setCode("");
      setCodeMetadata({
        domain: "",
        type: "Symbolic AI / Expert System",
        studentName: userData?.fullName || user?.email?.split('@')[0] || t('student') || "Student",
        dataArea: "",
        assignmentId: "",
        assignmentTitle: ""
      });
      setSelectedAssignment("");
      setUploadStatus("✅ " + (t('upload_success') || "Code uploaded successfully!"));
      
      await loadAssignments();
      
    } catch (error) {
      console.error("Error uploading code:", error);
      setUploadStatus("❌ " + (t('upload_error') || "Error uploading code!"));
    }
  };

  // Update code header when metadata changes
  useEffect(() => {
    if (code && code.includes('KNOWLEDGE-BASED EXPERT SYSTEM')) {
      const header = generateHeader();
      const codeWithoutHeader = code.split('\n').filter(line => !line.includes('%   =')).slice(7).join('\n');
      setCode(header + '\n' + codeWithoutHeader);
    }
  }, [codeMetadata]);

  // Initialize code with header when tab changes to upload
  useEffect(() => {
    if (selectedTab === "upload" && !code && selectedAssignment) {
      const header = generateHeader();
      const basicTemplate = prologTemplates.find(t => t.id === "basic")?.code || "";
      const templateBody = basicTemplate.split('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\n')[1] || basicTemplate;
      setCode(header + "\n\n" + templateBody);
    }
  }, [selectedTab, selectedAssignment]);

  return (
    <div className={`flex min-h-screen ${currentTheme.background} ${currentTheme.text} pt-24`}>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed lg:sticky top-24 left-0 h-[calc(100vh-6rem)] w-64 ${currentTheme.sidebar} border-r backdrop-blur-xl z-40 lg:z-20`}
          >
            <div className="p-6 h-full flex flex-col overflow-y-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {user?.email?.split('@')[0] || t('student') || "Student"}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('student_account') || "Student Account"}
                  </p>
                </div>
              </div>

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
                    {(item.id === "courses" || item.id === "assignments") && (
                      <span className={`ml-auto px-2 py-1 rounded-lg text-xs ${
                        theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                      }`}>
                        {item.id === "courses" ? courses.length : assignments.length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              <div className={`pt-6 ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <div className="text-lg font-bold">{totalSubmissions}</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('submissions') || "Submissions"}</div>
                  </div>
                  <div className={`rounded-lg p-3 ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <div className="text-lg font-bold">{successRate}%</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t('success') || "Success"}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
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

        <div className="overflow-y-auto h-[calc(100vh-64px)] p-6">
          {/* Dashboard Content */}
          {selectedTab === "dashboard" && (
            <>
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
                          {t('welcome_back') || "Welcome back"}, {userData?.fullName || user?.email?.split('@')[0] || t('student') || "Student"}!
                        </h1>
                      </div>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        {t('what_to_learn') || "What do you want to learn today?"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium">
                        {t('explore_courses') || "Explore Courses"}
                      </button>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <input
                          type="text"
                          placeholder={t('search_placeholder') || "Search..."}
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, idx) => (
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
                        {stat.icon}
                      </div>
                      <div>
                        <h3 className={theme === 'dark' ? 'text-gray-300 text-sm' : 'text-gray-600 text-sm'}>{stat.title}</h3>
                        <div className="text-3xl font-bold">{stat.value}</div>
                      </div>
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {stat.description}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                        <Target className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold">🎯 {t('todays_tasks') || "Today's Tasks"}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {todaysTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                            theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {task.subjectIcon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{task.title}</h4>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {task.subject}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                                {task.dueTime}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => startTask(task.id)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              task.completed
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-blue-500/20 text-blue-500'
                            }`}
                          >
                            {task.completed ? t('review') || 'Review' : t('start') || 'Start'}
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {todaysTasks.length > 3 && (
                      <button
                        onClick={() => setSelectedTab("assignments")}
                        className={`w-full mt-6 py-2 rounded-lg ${
                          theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {t('view_all') || "View All"} <ChevronRight className="w-4 h-4 inline ml-1" />
                      </button>
                    )}
                  </div>
                </motion.div>

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
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold">{t('recommendations') || "Recommendations"}</h3>
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
                                <Zap className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`rounded-2xl p-6 border ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                } backdrop-blur-xl`}
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> {t('learning_progress') || "Learning Progress"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{t('assignment_completion') || "Assignment Completion"}</h4>
                      <span className="text-sm text-green-500">{completionRate}%</span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t('completed') || "Completed"}: {completedAssignments}
                      </span>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t('total') || "Total"}: {totalAssignmentsCount}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{t('success_rate_trend') || "Success Rate Trend"}</h4>
                      <span className="text-sm text-blue-500">{successRate}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${successRate}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t('successful') || "Successful"}: {successfulSubmissions}
                      </span>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t('total') || "Total"}: {totalSubmissions}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Courses Tab */}
          {selectedTab === "courses" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t('my_courses') || "My Courses"}</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t('continue_learning') || "Continue your learning journey"}</p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t('browse_courses') || "Browse Courses"}
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
                        style={{ 
                          background: `linear-gradient(135deg, ${course.color})`,
                          opacity: 0.9 
                        }}
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
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{t('progress') || "Progress"}</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                      }`}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${course.color})` }}
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
                        {t('view_course') || "View Course"}
                      </button>
                      <button className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                      } transition-colors`}>
                        {t('continue') || "Continue"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Tab */}
          {selectedTab === "assignments" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t('all_assignments') || "All Assignments"}</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {assignments.length} {t('assignments_found') || "assignments found"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <select className={`px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <option>{t('all_status') || "All Status"}</option>
                    <option>{t('pending') || "Pending"}</option>
                    <option>{t('completed') || "Completed"}</option>
                  </select>
                  <select className={`px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <option>{t('all_difficulty') || "All Difficulty"}</option>
                    <option>{t('easy') || "Easy"}</option>
                    <option>{t('medium') || "Medium"}</option>
                    <option>{t('hard') || "Hard"}</option>
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
                  <h3 className="text-xl font-bold mb-2">{t('no_assignments_yet') || "No assignments yet"}</h3>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('check_back_later') || "Check back later for new assignments"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {assignments.map((assignment) => {
                    const isCompleted = assignment.studentProgress?.completed || false;
                    
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
                              {t('due') || "Due"}: {assignment.dueDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {t('difficulty') || "Difficulty"}: {assignment.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Award className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {t('points') || "Points"}: {assignment.points}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {isCompleted ? (
                            <button
                              onClick={() => {
                                setSelectedTab("submissions");
                              }}
                              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                                theme === 'dark' 
                                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-600'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 inline mr-1" /> {t('completed') || "Completed"}
                            </button>
                          ) : (
                            <button
                              onClick={() => startTask(assignment.id)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm"
                            >
                              <Play className="w-4 h-4 inline mr-1" /> {t('start_work') || "Start Work"}
                            </button>
                          )}
                          <button
                            onClick={() => openTaskDetails(assignment.id)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                              theme === 'dark' 
                                ? 'bg-white/5 hover:bg-white/10' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <Eye className="w-4 h-4 inline mr-1" /> {t('details') || "Details"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Progress Tab */}
          {selectedTab === "progress" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{t('learning_progress') || "Learning Progress"}</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('track_achievements') || "Track your achievements and growth"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className={`px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    {t('week') || "Week"}
                  </button>
                  <button className={`px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white`}>
                    {t('month') || "Month"}
                  </button>
                  <button className={`px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    {t('year') || "Year"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: t('completion_rate') || "Completion Rate", value: `${completionRate}%`, icon: <TrendingUp className="w-6 h-6" />, color: "from-green-500 to-emerald-500" },
                  { label: t('total_submissions') || "Total Submissions", value: totalSubmissions, icon: <UploadCloud className="w-6 h-6" />, color: "from-blue-500 to-cyan-500" },
                  { label: t('success_rate') || "Success Rate", value: `${successRate}%`, icon: <CheckCircle className="w-6 h-6" />, color: "from-purple-500 to-pink-500" },
                  { label: t('streak_days') || "Streak Days", value: "7", icon: <Zap className="w-6 h-6" />, color: "from-amber-500 to-orange-500" },
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
                  <h3 className="text-lg font-bold mb-6">{t('assignment_progress') || "Assignment Progress"}</h3>
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
                  <h3 className="text-lg font-bold mb-6">{t('recent_activity') || "Recent Activity"}</h3>
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
                              {t('uploaded') || "Uploaded"}: <span className="font-medium">{sub.name}</span>
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

          {/* Upload Tab - UPDATED WITH METADATA FORM AND ASSIGNMENT INFO */}
          {selectedTab === "upload" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{t('upload_prolog_code') || "Upload Prolog Code"}</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('submit_assignments_projects') || "Submit your assignments and projects"}
                  </p>
                </div>
              </div>

              {/* Assignment Selection */}
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> {t('select_assignment') || "Select Assignment"}
                </h3>
                
                <div className="flex gap-4">
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
                          studentName: userData?.fullName || user?.email?.split('@')[0] || t('student') || "Student",
                          dataArea: assignment.subject,
                          assignmentId: assignment.id,
                          assignmentTitle: assignment.title
                        });
                      }
                    }}
                  >
                    <option value="">-- {t('choose_assignment') || "Choose an assignment"} --</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title} ({assignment.difficulty})
                      </option>
                    ))}
                  </select>
                  
                  <div className="relative">
                    <button
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                          : 'bg-white border-gray-300 hover:bg-gray-100'
                      }`}
                      onClick={() => setShowTemplates(!showTemplates)}
                    >
                      <FileCode className="w-5 h-5" />
                      {t('use_template') || "Use Template"}
                    </button>
                    
                    {showTemplates && (
                      <div className={`absolute top-full mt-2 w-64 rounded-lg border shadow-lg z-50 ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-200'
                      }`}>
                        {prologTemplates.map((template) => (
                          <button
                            key={template.id}
                            className={`w-full p-3 text-left hover:bg-opacity-10 hover:bg-green-500 ${
                              theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => applyTemplate(template.id)}
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {template.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              {selectedAssignment && (
                <div className={`rounded-2xl p-6 border backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> {t('assignment_info') || "Assignment Information"}
                  </h3>
                  
                  {(() => {
                    const assignment = assignments.find(a => a.id === selectedAssignment);
                    if (!assignment) return null;
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {t('title') || "Title"}
                            </div>
                            <div className="font-medium">{assignment.title}</div>
                          </div>
                          <div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {t('objective') || "Objective"}
                            </div>
                            <div className="font-medium">{assignment.objective}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t('requirements') || "Requirements"}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <div className={`px-3 py-2 rounded-lg ${
                              theme === 'dark' ? 'bg-green-500/10' : 'bg-green-100'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                <span>{assignment.requirements.minFacts} {t('facts') || "facts"}</span>
                              </div>
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${
                              theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-100'
                            }`}>
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                <span>{assignment.requirements.minRules} {t('rules') || "rules"}</span>
                              </div>
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${
                              theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-100'
                            }`}>
                              <div className="flex items-center gap-2">
                                <FileCode className="w-4 h-4" />
                                <span>{assignment.requirements.minMenuItems} {t('menu_items') || "menu items"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {t('due_date') || "Due Date"}
                            </div>
                            <div className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {t('difficulty') || "Difficulty"}
                            </div>
                            <div className="font-medium capitalize">{assignment.difficulty}</div>
                          </div>
                          <div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {t('points') || "Points"}
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
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5" /> {t('file_information') || "File Information"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Globe className="w-4 h-4 inline mr-1" /> {t('domain') || "Domain"}
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="e.g., Insects, Animals"
                      value={codeMetadata.domain}
                      onChange={(e) => setCodeMetadata({...codeMetadata, domain: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Cpu className="w-4 h-4 inline mr-1" /> {t('type') || "Type"}
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="Symbolic AI / Expert System"
                      value={codeMetadata.type}
                      onChange={(e) => setCodeMetadata({...codeMetadata, type: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <User className="w-4 h-4 inline mr-1" /> {t('student_name') || "Student Name"}
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="Your name"
                      value={codeMetadata.studentName}
                      onChange={(e) => setCodeMetadata({...codeMetadata, studentName: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Database className="w-4 h-4 inline mr-1" /> {t('data_area') || "Data Area"}
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="e.g., Biology, Geography"
                      value={codeMetadata.dataArea}
                      onChange={(e) => setCodeMetadata({...codeMetadata, dataArea: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Code Editor */}
              <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Code className="w-5 h-5" /> {t('code_editor') || "Code Editor"}
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
                        alert(t('header_copied') || "Header copied to clipboard!");
                      }}
                    >
                      <Copy className="w-3 h-3" /> {t('copy_header') || "Copy Header"}
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
                      <RefreshCw className="w-3 h-3" /> {t('update_header') || "Update Header"}
                    </button>
                  </div>
                </div>
                
                <textarea
                  className={`w-full h-96 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none ${
                    theme === 'dark' 
                      ? 'bg-white/5 border border-white/10' 
                      : 'bg-white border border-gray-300'
                  }`}
                  placeholder={`% ${t('write_prolog_code') || "Write your Prolog code here..."}\n% ${t('example') || "Example"}:\n% student(john, math).\n% teaches(prof_smith, math).`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleUpload}
                    disabled={!code.trim() || !selectedAssignment}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {t('submit_code') || "Submit Code"}
                  </button>
                  <button
                    onClick={() => setCode("")}
                    className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <X className="w-5 h-5" />
                    {t('clear') || "Clear"}
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

          {/* Submissions Tab */}
          {selectedTab === "submissions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{t('recent_submissions') || "Recent Submissions"}</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {submissions.length} {t('submissions_found') || "submissions found"}
                  </p>
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className={`rounded-2xl p-12 border text-center ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">{t('no_submissions_yet') || "No submissions yet"}</h3>
                  <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t('make_first_submission') || "Make your first submission to get started"}
                  </p>
                  <button
                    onClick={() => setSelectedTab("upload")}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
                  >
                    {t('upload_first_file') || "Upload Your First File"}
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
                        <div className="flex items-start justify-between">
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
                              {sub.code?.substring(0, 150)}...
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sub.status === 'success' ? 'bg-green-500/20 text-green-500' :
                              sub.status === 'error' ? 'bg-red-500/20 text-red-500' :
                              'bg-amber-500/20 text-amber-500'
                            }`}>
                              {getStatusText(sub.status)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
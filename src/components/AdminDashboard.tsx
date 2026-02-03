import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, UserCheck, UserX, 
  BarChart3, Activity, Zap,  Clock,
  TrendingUp, Database, Folder, Shield, 
  RefreshCw, Eye, Trash2, CheckCircle, 
  XCircle, Building, Award, Download,
  Plus, X, Search, 
  UserCog, FileCode, GraduationCap,
  Home, Crown, 
   Upload, 
  ChevronRight, 
  Copy, ExternalLink, FolderPlus,
  UserPlus, 
   File, Code,
   Key, BookOpen, Puzzle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { db } from "../services/firebase";
import { supabase } from "../services/supabase";
import {
  collection,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  limit,
  addDoc
} from "firebase/firestore";

// Interfaces
interface User {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  institution: string;
  status: 'active' | 'pending' | 'rejected' | 'suspended';
  createdAt: Date;
  isVerified: boolean;
  specialty?: string;
  grade?: string;
  teacherCode?: string;
  lastLogin?: Date;
  phone?: string;
  avatar?: string;
}

interface PrologCode {
  id: string;
  userId: string;
  username: string;
  title: string;
  storedFileName?: string;
  originalFileName?: string;
  displayName?: string;
  code: string;
  fileName?: string;
  filePath?: string;
  folder?: string;
  status: 'success' | 'error' | 'pending';
  createdAt: Date;
  uploadFormat?: string;
  executionTime?: number;
  errors?: string[];
  assignmentName?: string;
  assignmentId?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  dueDate?: Date;
  submissions?: number;
  status: 'active' | 'completed' | 'draft';
}

interface SupabaseFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  size: number;
  folder: string;
  fullPath: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    [key: string]: any;
  };
}

interface SupabaseFolder {
  size: number;
  name: string;
  fileCount: number;
  lastModified?: string;
  files?: SupabaseFile[];
}

interface SupabaseStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  lastUpdated: number | null;
  storageUsed: string;
}

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalSubmissions: number;
  totalFiles: number;
  pendingApprovals: number;
  successRate: number;
  activeToday: number;
  avgExecutionTime: number;
  storageUsage: number;
  monthlyGrowth: number;
}

interface ActivityLog {
  id: string;
  userId: string;
  user: string;
  userEmail: string;
  action: string;
  actionType: string;
  target: string;
  targetId: string;
  details: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

export default function AdminDashboard() {
  const { user: currentUser, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  console.log(t);
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [prologCodes, setPrologCodes] = useState<PrologCode[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);
  
  // Supabase Management State
  const [supabaseFiles, setSupabaseFiles] = useState<SupabaseFile[]>([]);
  const [supabaseFolders, setSupabaseFolders] = useState<SupabaseFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<SupabaseFile[]>([]);
  const [supabaseStats, setSupabaseStats] = useState<SupabaseStats>({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    lastUpdated: null,
    storageUsed: '0 MB'
  });
  
  // Form states
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [bucketResult, setBucketResult] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // UI states
  const [selectedView, setSelectedView] = useState<string>("overview");
  const [selectedFile, setSelectedFile] = useState<PrologCode | null>(null);
  const [selectedSupabaseFile, setSelectedSupabaseFile] = useState<SupabaseFile | null>(null);
  const [showFileModal, setShowFileModal] = useState<boolean>(false);
  const [showFileContentModal, setShowFileContentModal] = useState<boolean>(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
console.log(selectedFile, showFileModal)
  // Statistics
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalSubmissions: 0,
    totalFiles: 0,
    pendingApprovals: 0,
    successRate: 0,
    activeToday: 0,
    avgExecutionTime: 0,
    storageUsage: 0,
    monthlyGrowth: 0
  });

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Theme classes
  const themeClasses = {
    light: {
      background: "bg-gray-50",
      text: "text-gray-900",
      card: "bg-white border-gray-200",
      hover: "hover:bg-gray-100",
      input: "bg-white border-gray-300",
    },
    dark: {
      background: "bg-gray-900",
      text: "text-white",
      card: "bg-gray-800 border-gray-700",
      hover: "hover:bg-gray-700",
      input: "bg-gray-700 border-gray-600",
    }
  };

  const currentTheme = themeClasses[theme];

  // ADMIN VERIFICATION
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      try {
        setLoading(true);
        
        let isAdmin = false;
        
        // Check via context first
        if (userData && userData.role === 'admin') {
          isAdmin = true;
        } else {
          // Check Firestore directly
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userDataDirect = userDoc.data();
            if (userDataDirect.role === 'admin') {
              isAdmin = true;
            }
          }
        }
        
        if (isAdmin) {
          setIsAdminVerified(true);
          await loadAllData();
        } else {
          setIsAdminVerified(false);
        }
        
      } catch (error: any) {
        console.error("Error in admin access check:", error);
        setIsAdminVerified(false);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      checkAdminAccess();
    }
  }, [currentUser, userData]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      setUsers(usersData);
      
      // Load Prolog codes
      const codesQuery = query(collection(db, "prologCodes"), orderBy("createdAt", "desc"));
      const codesSnapshot = await getDocs(codesQuery);
      const codesData = codesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PrologCode));
      
      setPrologCodes(codesData);
      
      // Load assignments
      const assignmentsQuery = query(collection(db, "assignments"), orderBy("createdAt", "desc"));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
      
      setAssignments(assignmentsData);
      
      // Load files from Supabase
      await loadSupabaseFiles();
      
      // Load activity logs
      await loadActivityLogs();
      
      // Calculate statistics
      calculateStats(usersData, codesData);
      
      // Pending teachers
      const pending = usersData.filter(u => u.role === 'teacher' && u.status === 'pending');
      setPendingTeachers(pending);
      
    } catch (error: any) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      // Load real activity logs from Firestore
      const logsQuery = query(
        collection(db, "activityLogs"), 
        orderBy("timestamp", "desc"),
        limit(100)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const logsData: ActivityLog[] = [];
      
      logsSnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate() || new Date();
        
        logsData.push({
          id: doc.id,
          userId: data.userId || '',
          user: data.userName || data.user || 'System',
          userEmail: data.userEmail || '',
          action: data.action || 'Unknown action',
          actionType: data.actionType || 'info',
          target: data.target || '',
          targetId: data.targetId || '',
          details: data.details || '',
          timestamp: timestamp,
          icon: getActivityIcon(data.actionType || 'info'),
          color: getActivityColor(data.actionType || 'info')
        });
      });
      
      // If no logs, generate from existing data
      if (logsData.length === 0) {
        await generateActivityLogsFromData();
      } else {
        setActivityLogs(logsData);
      }
      
    } catch (error) {
      console.error("Error loading activity logs:", error);
      // Generate from existing data
      await generateActivityLogsFromData();
    }
  };

  const generateActivityLogsFromData = async () => {
    const generatedLogs: ActivityLog[] = [];
    const now = new Date();
    
    // Add user registration activities
    users.slice(0, 20).forEach(user => {
      generatedLogs.push({
        id: `user-${user.id}`,
        userId: user.id,
        user: user.fullName,
        userEmail: user.email,
        action: `User ${user.role} registered`,
        actionType: 'user_registered',
        target: user.institution,
        targetId: user.id,
        details: `New ${user.role} account created`,
        timestamp: user.createdAt || new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        icon: <UserPlus className="w-4 h-4" />,
        color: 'blue'
      });
    });
    
    // Add code submission activities
    prologCodes.slice(0, 30).forEach(code => {
      const user = users.find(u => u.id === code.userId) || { fullName: code.username, email: '' };
      
      generatedLogs.push({
        id: `code-${code.id}`,
        userId: code.userId,
        user: user.fullName,
        userEmail: user.email || '',
        action: 'Submitted Prolog code',
        actionType: 'code_submitted',
        target: code.title,
        targetId: code.id,
        details: `Status: ${code.status} • ${code.uploadFormat || 'manual input'}`,
        timestamp: code.createdAt || new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        icon: <Code className="w-4 h-4" />,
        color: code.status === 'success' ? 'green' : code.status === 'error' ? 'red' : 'amber'
      });
    });
    
    // Add assignment activities
    assignments.slice(0, 15).forEach(assignment => {
      const creator = users.find(u => u.id === assignment.createdBy) || { fullName: 'Teacher', email: '' };
      
      generatedLogs.push({
        id: `assignment-${assignment.id}`,
        userId: assignment.createdBy,
        user: creator.fullName,
        userEmail: creator.email || '',
        action: 'Created assignment',
        actionType: 'assignment_created',
        target: assignment.title,
        targetId: assignment.id,
        details: `Status: ${assignment.status} • ${assignment.submissions || 0} submissions`,
        timestamp: assignment.createdAt || new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        icon: <BookOpen className="w-4 h-4" />,
        color: 'indigo'
      });
    });
    
    // Add file upload activities
    supabaseFiles.slice(0, 20).forEach(file => {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      generatedLogs.push({
        id: `file-${file.id}`,
        userId: randomUser?.id || '',
        user: randomUser?.fullName || 'Unknown User',
        userEmail: randomUser?.email || '',
        action: 'Uploaded file to storage',
        actionType: 'file_uploaded',
        target: file.name,
        targetId: file.id,
        details: `Folder: ${file.folder} • Size: ${(file.size / 1024).toFixed(2)} KB`,
        timestamp: new Date(file.created_at) || new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        icon: <Upload className="w-4 h-4" />,
        color: 'cyan'
      });
    });
    
    // Add login activities
    users.filter(u => u.lastLogin).slice(0, 15).forEach(user => {
      generatedLogs.push({
        id: `login-${user.id}`,
        userId: user.id,
        user: user.fullName,
        userEmail: user.email,
        action: 'Logged in to system',
        actionType: 'user_login',
        target: 'Platform',
        targetId: user.id,
        details: `Role: ${user.role} • Status: ${user.status}`,
        timestamp: user.lastLogin || new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        icon: <Key className="w-4 h-4" />,
        color: 'purple'
      });
    });
    
    // Sort by timestamp
    const sortedLogs = generatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setActivityLogs(sortedLogs.slice(0, 100));
    
    // Save generated logs to Firestore
    try {
      for (const log of sortedLogs.slice(0, 50)) {
        await addDoc(collection(db, "activityLogs"), {
          userId: log.userId,
          userName: log.user,
          userEmail: log.userEmail,
          action: log.action,
          actionType: log.actionType,
          target: log.target,
          targetId: log.targetId,
          details: log.details,
          timestamp: serverTimestamp(),
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error("Error saving generated logs:", error);
    }
  };

  const getActivityIcon = (actionType: string): React.ReactNode => {
    switch (actionType) {
      case 'user_registered': return <UserPlus className="w-4 h-4" />;
      case 'code_submitted': return <Code className="w-4 h-4" />;
      case 'assignment_created': return <BookOpen className="w-4 h-4" />;
      case 'assignment_submitted': return <Puzzle className="w-4 h-4" />;
      case 'file_uploaded': return <Upload className="w-4 h-4" />;
      case 'file_downloaded': return <Download className="w-4 h-4" />;
      case 'file_deleted': return <Trash2 className="w-4 h-4" />;
      case 'folder_created': return <FolderPlus className="w-4 h-4" />;
      case 'user_login': return <Key className="w-4 h-4" />;
      case 'user_updated': return <UserCog className="w-4 h-4" />;
      case 'teacher_approved': return <UserCheck className="w-4 h-4" />;
      case 'teacher_rejected': return <UserX className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (actionType: string): string => {
    switch (actionType) {
      case 'user_registered': return 'blue';
      case 'code_submitted': return 'green';
      case 'assignment_created': return 'indigo';
      case 'assignment_submitted': return 'purple';
      case 'file_uploaded': return 'cyan';
      case 'file_downloaded': return 'blue';
      case 'file_deleted': return 'red';
      case 'folder_created': return 'teal';
      case 'user_login': return 'purple';
      case 'user_updated': return 'amber';
      case 'teacher_approved': return 'green';
      case 'teacher_rejected': return 'red';
      default: return 'gray';
    }
  };

  const calculateStats = (usersData: User[], codesData: PrologCode[]) => {
    const totalUsers = usersData.length;
    const totalStudents = usersData.filter(u => u.role === 'student').length;
    const totalTeachers = usersData.filter(u => u.role === 'teacher').length;
    const totalAdmins = usersData.filter(u => u.role === 'admin').length;
    const totalSubmissions = codesData.length;
    const successfulSubmissions = codesData.filter(c => c.status === 'success').length;
    const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;
    const pendingApprovals = usersData.filter(u => u.status === 'pending').length;
    
    // Calculate active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = usersData.filter(u => {
      if (!u.lastLogin) return false;
      return new Date(u.lastLogin) >= today;
    }).length;

    setStats(prev => ({
      ...prev,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalSubmissions,
      pendingApprovals,
      successRate,
      activeToday,
      totalFiles: supabaseStats.totalFiles
    }));
  };

  // Filtered data
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.institution.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredCodes = prologCodes.filter(code => {
    return code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           code.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredActivityLogs = activityLogs.filter(log => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'code') return log.actionType.includes('code') || log.actionType.includes('assignment');
    if (activityFilter === 'file') return log.actionType.includes('file') || log.actionType.includes('folder');
    if (activityFilter === 'user') return log.actionType.includes('user') || log.actionType.includes('teacher');
    return true;
  });

  // Supabase folder functions
  const createSupabaseFolder = async () => {
    if (!newFolderName.trim()) {
      setBucketResult("❌ Please enter a folder name");
      return;
    }

    try {
      // Create placeholder content
      const content = '# Placeholder for folder';
      
      // Try uploading as text/plain
      const { error } = await supabase.storage
        .from('prolog-files')
        .upload(`${newFolderName}/.folderplaceholder`, content, {
          upsert: false,
          contentType: 'text/plain'
        });
      
      if (error) throw error;
      
      setBucketResult(`✅ Folder "${newFolderName}" created successfully.`);
      setNewFolderName('');
      await refreshSupabaseData();
      
      // Add to activity logs
      await addActivityLog({
        action: 'Created new folder',
        actionType: 'folder_created',
        target: newFolderName,
        details: `Created folder "${newFolderName}" in storage`
      });
      
    } catch (error: any) {
      console.error("Error creating folder:", error);
      setBucketResult(`❌ Error creating folder: ${error.message}`);
    }
  };

  const refreshSupabaseData = async () => {
    try {
      // List all items in root
      const { data: rootItems, error } = await supabase.storage
        .from("prolog-files")
        .list("", { limit: 1000 });

      if (error) throw error;

      if (!rootItems || rootItems.length === 0) {
        setSupabaseFolders([]);
        setSupabaseStats({
          totalFiles: 0,
          totalFolders: 0,
          totalSize: 0,
          lastUpdated: null,
          storageUsed: '0 MB'
        });
        setSupabaseFiles([]);
        return;
      }

      const allFiles: SupabaseFile[] = [];
      const foldersMap = new Map<string, SupabaseFolder>();
      let totalSize = 0;
      let lastUpdated: number | null = null;
      
      // Process each item
      for (const item of rootItems) {
        if (!item.name) continue;
        
        if (item.id === null) { // It's a folder
          const folderName = item.name;
          
          // Get files from this folder
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from("prolog-files")
            .list(folderName, { limit: 1000 });
          
          const folderFileList: SupabaseFile[] = [];
          
          if (!folderError && folderFiles) {
            const prologFilesInFolder = folderFiles.filter(file => 
              file.name && !file.name.startsWith('.') && file.id !== null
            );
            
            prologFilesInFolder.forEach(file => {
              const metadata = file.metadata || {};
              const size = typeof metadata.size === 'number' ? metadata.size : 0;
              const mimetype = typeof metadata.mimetype === 'string' ? metadata.mimetype : 'application/x-prolog';
              
              const supabaseFile: SupabaseFile = {
                name: file.name || '',
                id: file.id || Math.random().toString(36).substring(2),
                created_at: file.created_at || new Date().toISOString(),
                updated_at: file.updated_at || new Date().toISOString(),
                size: size,
                folder: folderName,
                fullPath: `${folderName}/${file.name}`,
                metadata: { size, mimetype }
              };
              
              folderFileList.push(supabaseFile);
              allFiles.push(supabaseFile);
              
              totalSize += size;
              
              if (file.created_at) {
                const fileDate = new Date(file.created_at).getTime();
                if (!lastUpdated || fileDate > lastUpdated) {
                  lastUpdated = fileDate;
                }
              }
            });
          }
          
          const folderSize = folderFileList.reduce((sum, file) => sum + file.size, 0);
          
          foldersMap.set(folderName, {
            name: folderName,
            fileCount: folderFileList.length,
            size: folderSize,
            files: folderFileList,
            lastModified: folderFileList.length > 0 
              ? new Date(Math.max(...folderFileList.map(f => new Date(f.created_at).getTime()))).toISOString()
              : undefined
          });
        } else if (!item.name.startsWith('.')) {
          const metadata = item.metadata || {};
          const size = typeof metadata.size === 'number' ? metadata.size : 0;
          const mimetype = typeof metadata.mimetype === 'string' ? metadata.mimetype : 'application/x-prolog';
          
          const file: SupabaseFile = {
            name: item.name || '',
            id: item.id || Math.random().toString(36).substring(2),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            size: size,
            folder: 'root',
            fullPath: item.name || '',
            metadata: { size, mimetype }
          };
          
          allFiles.push(file);
          totalSize += size;
          
          if (item.created_at) {
            const fileDate = new Date(item.created_at).getTime();
            if (!lastUpdated || fileDate > lastUpdated) {
              lastUpdated = fileDate;
            }
          }
        }
      }
      
      const folderData = Array.from(foldersMap.values());
      
      setSupabaseFiles(allFiles);
      setSupabaseFolders(folderData);
      
      const storageUsed = totalSize < 1024 * 1024 
        ? `${(totalSize / 1024).toFixed(2)} KB`
        : totalSize < 1024 * 1024 * 1024
        ? `${(totalSize / (1024 * 1024)).toFixed(2)} MB`
        : `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      
      setSupabaseStats({
        totalFiles: allFiles.length,
        totalFolders: folderData.length,
        totalSize: totalSize,
        lastUpdated: lastUpdated,
        storageUsed: storageUsed
      });
      
      setBucketResult(`✅ Data refreshed. Found ${folderData.length} folders with ${allFiles.length} files.`);
      
    } catch (error: any) {
      console.error("Error loading Supabase files:", error);
      setBucketResult(`❌ Error refreshing data: ${error.message}`);
    }
  };

  const viewFolderFiles = async (folderName: string) => {
    try {
      const folder = supabaseFolders.find(f => f.name === folderName);
      
      if (folder && folder.files) {
        setSelectedFolder(folderName);
        setFolderFiles(folder.files);
      } else {
        const { data: files, error } = await supabase.storage
          .from('prolog-files')
          .list(folderName);
        
        if (error) throw error;
        
        const supabaseFiles: SupabaseFile[] = (files || [])
          .filter(file => file.name && !file.name.startsWith('.') && file.id)
          .map(file => ({
            name: file.name || '',
            id: file.id || Math.random().toString(36).substring(2),
            created_at: file.created_at || new Date().toISOString(),
            updated_at: file.updated_at || new Date().toISOString(),
            size: file.metadata?.size || 0,
            folder: folderName,
            fullPath: `${folderName}/${file.name}`,
            metadata: file.metadata
          }));
        
        setSelectedFolder(folderName);
        setFolderFiles(supabaseFiles);
      }
      
    } catch (error: any) {
      setBucketResult(`❌ Error loading folder ${folderName}: ${error.message}`);
    }
  };

  const viewFileContent = async (file: SupabaseFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('prolog-files')
        .download(file.fullPath);
      
      if (error) throw error;
      
      const text = await data.text();
      setFileContent(text);
      setSelectedSupabaseFile(file);
      setShowFileContentModal(true);
      
      await addActivityLog({
        action: 'Viewed file content',
        actionType: 'file_viewed',
        target: file.name,
        details: `Viewed file "${file.name}" from folder "${file.folder}"`
      });
      
    } catch (error: any) {
      setBucketResult(`❌ Error loading file content: ${error.message}`);
    }
  };

  const deleteFileInFolder = async (fileName: string) => {
    if (!selectedFolder || !confirm(`Delete ${fileName}? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase.storage
        .from('prolog-files')
        .remove([`${selectedFolder}/${fileName}`]);
      
      if (error) throw error;
      
      setBucketResult(`✅ File "${fileName}" deleted successfully.`);
      await viewFolderFiles(selectedFolder);
      await refreshSupabaseData();
      
      await addActivityLog({
        action: 'Deleted file from storage',
        actionType: 'file_deleted',
        target: fileName,
        details: `Deleted file "${fileName}" from folder "${selectedFolder}"`
      });
      
    } catch (error: any) {
      setBucketResult(`❌ Error deleting file: ${error.message}`);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('prolog-files')
        .download(filePath);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await addActivityLog({
        action: 'Downloaded file',
        actionType: 'file_downloaded',
        target: fileName,
        details: `Downloaded file "${fileName}"`
      });
      
    } catch (error: any) {
      setBucketResult(`❌ Error downloading file: ${error.message}`);
    }
  };

  const copyFileUrl = (fileName: string) => {
    if (!selectedFolder) return;
    console.log(copyFileUrl)
    const { data } = supabase.storage
      .from('prolog-files')
      .getPublicUrl(`${selectedFolder}/${fileName}`);
    
    if (data.publicUrl) {
      navigator.clipboard.writeText(data.publicUrl);
      setBucketResult('✅ File URL copied to clipboard!');
      
      addActivityLog({
        action: 'Copied file URL',
        actionType: 'file_url_copied',
        target: fileName,
        details: `Copied URL for file "${fileName}"`
      });
    }
  };

  const loadSupabaseFiles = async () => {
    try {
      await refreshSupabaseData();
    } catch (error) {
      console.error("Error loading Supabase files:", error);
      // Fallback to codes data
      const filesFromCodes = prologCodes.filter(code => 
        code.fileName || code.filePath || code.originalFileName || code.storedFileName
      );
      
      const fallbackFiles: SupabaseFile[] = filesFromCodes.map((code, index) => {
        const fileName = code.fileName || code.originalFileName || code.storedFileName || code.title || `file-${index}.pl`;
        let folder = code.folder || 'submissions';
        
        if (code.filePath && code.filePath.includes('/')) {
          const pathParts = code.filePath.split('/');
          if (pathParts.length > 1) {
            folder = pathParts[0];
          }
        }
        
        return {
          name: fileName,
          id: code.id || `fallback-${index}`,
          created_at: code.createdAt?.toString() || new Date().toISOString(),
          updated_at: code.createdAt?.toString() || new Date().toISOString(),
          size: code.code?.length || 0,
          folder: folder,
          fullPath: code.filePath || fileName,
          metadata: { 
            size: code.code?.length || 0, 
            mimetype: 'application/x-prolog' 
          }
        };
      });
      
      setSupabaseFiles(fallbackFiles);
    }
  };

  const viewCodeInNewTab = (code: PrologCode) => {
    const codeBlob = new Blob([code.code], { type: 'text/plain' });
    const codeUrl = URL.createObjectURL(codeBlob);
    window.open(codeUrl, '_blank');
    
    addActivityLog({
      action: 'Viewed code in new tab',
      actionType: 'code_viewed',
      target: code.title,
      details: `Viewed Prolog code "${code.title}" in new tab`
    });
  };

  const openFileModal = (code: PrologCode) => {
    setSelectedFile(code);
    setShowFileModal(true);
  };

  // Add activity log helper
  const addActivityLog = async (logData: {
    action: string;
    actionType: string;
    target: string;
    details: string;
    targetId?: string;
  }) => {
    try {
      const activityLog = {
        userId: currentUser?.uid || '',
        userName: userData?.fullName || currentUser?.email?.split('@')[0] || 'Admin',
        userEmail: currentUser?.email || '',
        action: logData.action,
        actionType: logData.actionType,
        target: logData.target,
        targetId: logData.targetId || '',
        details: logData.details,
        timestamp: serverTimestamp(),
        createdAt: new Date()
      };
      
      // Add to Firestore
      await addDoc(collection(db, "activityLogs"), activityLog);
      
      // Update local state
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        userId: activityLog.userId,
        user: activityLog.userName,
        userEmail: activityLog.userEmail,
        action: activityLog.action,
        actionType: activityLog.actionType,
        target: activityLog.target,
        targetId: activityLog.targetId,
        details: activityLog.details,
        timestamp: new Date(),
        icon: getActivityIcon(activityLog.actionType),
        color: getActivityColor(activityLog.actionType)
      };
      
      setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]);
      
    } catch (error) {
      console.error("Error adding activity log:", error);
    }
  };

  // Approval functions
  const approveTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, "users", teacherId), {
        status: "active",
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.uid,
        isVerified: true
      });
      
      const teacher = users.find(u => u.id === teacherId);
      
      await addActivityLog({
        action: 'Approved teacher',
        actionType: 'teacher_approved',
        target: teacher?.fullName || teacherId,
        targetId: teacherId,
        details: `Approved teacher "${teacher?.fullName}" (${teacher?.email})`
      });
      
      await loadAllData();
      
    } catch (error) {
      console.error("Error approving teacher:", error);
    }
  };

  const rejectTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, "users", teacherId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.uid
      });
      
      const teacher = users.find(u => u.id === teacherId);
      
      await addActivityLog({
        action: 'Rejected teacher',
        actionType: 'teacher_rejected',
        target: teacher?.fullName || teacherId,
        targetId: teacherId,
        details: `Rejected teacher "${teacher?.fullName}" (${teacher?.email})`
      });
      
      await loadAllData();
      
    } catch (error) {
      console.error("Error rejecting teacher:", error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    if (userId === currentUser?.uid) {
      return;
    }

    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await updateDoc(doc(db, "users", userId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid
      });
      
      const user = users.find(u => u.id === userId);
      
      await addActivityLog({
        action: `Changed user status to ${newStatus}`,
        actionType: 'user_updated',
        target: user?.fullName || userId,
        targetId: userId,
        details: `Changed status of user "${user?.fullName}" from ${currentStatus} to ${newStatus}`
      });
      
      await loadAllData();
      
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.uid) {
      return;
    }

    try {
      // Delete user's codes
      const userCodes = prologCodes.filter(code => code.userId === userId);
      for (const code of userCodes) {
        try {
          await deleteDoc(doc(db, "prologCodes", code.id));
        } catch (codeError) {
          console.error(`Error deleting code ${code.id}:`, codeError);
        }
      }
      
      // Delete user
      await deleteDoc(doc(db, "users", userId));
      
      await addActivityLog({
        action: 'Deleted user account',
        actionType: 'user_deleted',
        target: userName,
        targetId: userId,
        details: `Deleted user account "${userName}" and all associated data`
      });
      
      await loadAllData();
      
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      change: `+${stats.monthlyGrowth}%`,
      description: "Registered users"
    },
    {
      title: "Active Today",
      value: stats.activeToday,
      icon: <Activity className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      change: `${Math.round((stats.activeToday / stats.totalUsers) * 100)}%`,
      description: "Active in last 24h"
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: <Clock className="w-6 h-6" />,
      color: "from-amber-500 to-orange-500",
      change: "Requires attention",
      description: "Waiting for review"
    },
    {
      title: "Success Rate",
      value: `${stats.successRate}%`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      change: `${stats.avgExecutionTime}ms avg`,
      description: "Code execution"
    }
  ];

  // Navigation items with correct badges
  const navItems = [
    { 
      id: "overview", 
      label: "Overview", 
      icon: <BarChart3 className="w-5 h-5" />,
      badge: null
    },
    { 
      id: "users", 
      label: "Users", 
      icon: <Users className="w-5 h-5" />, 
      badge: stats.totalUsers
    },
    { 
      id: "teachers", 
      label: "Teachers", 
      icon: <GraduationCap className="w-5 h-5" />, 
      badge: stats.totalTeachers
    },
    { 
      id: "submissions", 
      label: "Submissions", 
      icon: <FileCode className="w-5 h-5" />, 
      badge: stats.totalSubmissions
    },
    { 
      id: "storage", 
      label: "Storage", 
      icon: <Database className="w-5 h-5" />,
      badge: supabaseStats.totalFiles
    },
    { 
      id: "activity", 
      label: "Activity", 
      icon: <Activity className="w-5 h-5" />,
      badge: activityLogs.length
    },
  ];

  // Load supabase data when storage tab is selected
  useEffect(() => {
    if (selectedView === "storage") {
      refreshSupabaseData();
    }
  }, [selectedView]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${currentTheme.background}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className={`${currentTheme.text}`}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdminVerified) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${currentTheme.background}`}>
        <div className="text-center max-w-md p-8 rounded-2xl border backdrop-blur-xl">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Administrator privileges required to access this panel.
          </p>
          <button 
            onClick={() => window.location.href = "/"}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2 mx-auto"
          >
            <Home className="w-5 h-5" /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-24 pb-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <span>Admin Dashboard</span>
            </h1>
            <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back, {userData?.fullName || "Administrator"}!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={loadAllData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedView(item.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  selectedView === item.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    selectedView === item.id
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

        {/* Overview View */}
        {selectedView === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
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
                      stat.change.includes('+') 
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

            {/* User Distribution */}
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" /> User Distribution
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Students', value: stats.totalStudents, color: 'from-blue-500 to-cyan-500', percent: stats.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0 },
                  { label: 'Teachers', value: stats.totalTeachers, color: 'from-purple-500 to-pink-500', percent: stats.totalUsers > 0 ? (stats.totalTeachers / stats.totalUsers) * 100 : 0 },
                  { label: 'Admins', value: stats.totalAdmins, color: 'from-green-500 to-emerald-500', percent: stats.totalUsers > 0 ? (stats.totalAdmins / stats.totalUsers) * 100 : 0 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                        {item.label}
                      </span>
                      <span className="font-medium">
                        {item.value} ({item.percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5" /> Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setSelectedView("teachers")}
                  disabled={pendingTeachers.length === 0}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    pendingTeachers.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]'
                  } ${theme === 'dark' 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <UserCheck className="w-6 h-6 text-green-500 mb-2" />
                  <div className="font-medium">Approve Teachers</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {pendingTeachers.length} pending
                  </div>
                </button>

                <button 
                  onClick={() => setSelectedView("storage")}
                  className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Database className="w-6 h-6 text-blue-500 mb-2" />
                  <div className="font-medium">Manage Storage</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {supabaseStats.totalFiles} files
                  </div>
                </button>

                <button 
                  onClick={() => setSelectedView("activity")}
                  className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Activity className="w-6 h-6 text-purple-500 mb-2" />
                  <div className="font-medium">View Activity</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activityLogs.length} logs
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users View */}
        {selectedView === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {filteredUsers.length} users found
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Administrators</option>
                </select>
                
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(user => (
                <div key={user.id} className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      user.role === 'student'
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20'
                        : user.role === 'teacher'
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20'
                        : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20'
                    }`}>
                      {user.role === 'student' ? <GraduationCap className="w-6 h-6 text-blue-400" /> :
                       user.role === 'teacher' ? <Users className="w-6 h-6 text-purple-400" /> :
                       <Shield className="w-6 h-6 text-green-400" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{user.fullName}</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Role:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-green-500/20 text-green-500' :
                        user.role === 'teacher' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-purple-500/20 text-purple-500'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === 'active' ? 'bg-green-500/20 text-green-500' :
                        user.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                        user.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Institution:</span>
                      <span className="text-right">{user.institution}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.status)}
                      disabled={user.id === currentUser?.uid}
                      className={`flex-1 py-2 rounded-lg text-sm ${
                        user.status === 'active'
                          ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30'
                          : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30'
                      } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.fullName)}
                      disabled={user.id === currentUser?.uid}
                      className={`flex-1 py-2 rounded-lg text-sm bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teachers View */}
        {selectedView === "teachers" && (
          <div className="space-y-8">
            {/* Pending Teachers */}
            {pendingTeachers.length > 0 && (
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-amber-500" /> Pending Approval
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingTeachers.map(teacher => (
                    <div key={teacher.id} className={`p-6 rounded-xl border ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-bold">{teacher.fullName}</div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {teacher.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Building className="w-4 h-4 inline mr-2" /> {teacher.institution}
                        </div>
                        {teacher.specialty && (
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Award className="w-4 h-4 inline mr-2" /> {teacher.specialty}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveTeacher(teacher.id)}
                          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => rejectTeacher(teacher.id)}
                          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Teachers */}
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" /> All Teachers ({stats.totalTeachers})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users
                  .filter(u => u.role === 'teacher')
                  .map(teacher => (
                    <div key={teacher.id} className={`p-6 rounded-xl border ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="font-bold">{teacher.fullName}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          teacher.status === 'active' ? 'bg-green-500/20 text-green-500' :
                          teacher.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                          teacher.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {teacher.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Building className="w-4 h-4 inline mr-2" /> {teacher.institution}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Last login: {teacher.lastLogin ? new Date(teacher.lastLogin).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleUserStatus(teacher.id, teacher.status)}
                        disabled={teacher.id === currentUser?.uid}
                        className={`w-full py-2 rounded-lg text-sm ${
                          teacher.status === 'active'
                            ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30'
                            : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30'
                        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {teacher.status === 'active' ? 'Suspend Teacher' : 'Activate Teacher'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Submissions View */}
        {selectedView === "submissions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Code Submissions</h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {filteredCodes.length} submissions found
                </p>
              </div>
              
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {prologCodes.filter(c => c.status === 'success').length}
                </div>
                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Successful</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold text-red-500 mb-2">
                  {prologCodes.filter(c => c.status === 'error').length}
                </div>
                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Errors</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold text-amber-500 mb-2">
                  {prologCodes.filter(c => c.status === 'pending').length}
                </div>
                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Pending</div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCodes.map(code => (
                <div key={code.id} className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold mb-1">{code.title}</h4>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Users className="w-4 h-4 inline mr-1" /> {code.username}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      code.status === 'success' ? 'bg-green-500/20 text-green-500' :
                      code.status === 'error' ? 'bg-red-500/20 text-red-500' :
                      'bg-amber-500/20 text-amber-500'
                    }`}>
                      {code.status}
                    </span>
                  </div>
                  
                  <div className={`mb-4 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-32 ${
                    theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'
                  }`}>
                    <pre className="whitespace-pre-wrap break-words">
                      {code.code.substring(0, 150)}...
                    </pre>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                      {new Date(code.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openFileModal(code)}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                        } transition-colors`}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => viewCodeInNewTab(code)}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                        } transition-colors`}
                        title="Open in New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code.code);
                          addActivityLog({
                            action: 'Code copied to clipboard',
                            actionType: 'code_copied',
                            target: code.title,
                            details: `Copied code "${code.title}" to clipboard`
                          });
                        }}
                        className={`p-2 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                        } transition-colors`}
                        title="Copy Code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage View - ПОДОБРЕНА ВЕРСИЯ */}
        {selectedView === "storage" && (
          <div className="space-y-8">
            {/* Create Folder */}
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FolderPlus className="w-5 h-5" /> Create New Folder
              </h3>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}
                />
                <button 
                  onClick={createSupabaseFolder}
                  disabled={!newFolderName.trim()}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-2" /> Create
                </button>
              </div>
              <button 
                onClick={refreshSupabaseData}
                className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
              >
                <RefreshCw className="w-4 h-4" /> Refresh Storage Data
              </button>
            </div>

            {/* Storage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold mb-2">{supabaseStats.totalFolders}</div>
                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Folders</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold mb-2">{supabaseStats.totalFiles}</div>
                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Files</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold mb-2">{supabaseStats.storageUsed}</div>
                <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Storage Used</div>
              </div>
            </div>

            {/* Folders Section */}
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Folder className="w-5 h-5" /> 
                  Folders ({supabaseFolders.length})
                  {selectedFolder && (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-purple-400">{selectedFolder}</span>
                    </>
                  )}
                </h3>
                {selectedFolder && (
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      theme === 'dark' 
                        ? 'bg-white/10 hover:bg-white/20' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Back to All Folders
                  </button>
                )}
              </div>

              {selectedFolder ? (
                // Files in selected folder
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {folderFiles.length} files in this folder
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadFile(`${selectedFolder}/all-files.zip`, `${selectedFolder}.zip`)}
                        className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                          theme === 'dark' 
                            ? 'bg-blue-500/20 hover:bg-blue-500/30' 
                            : 'bg-blue-100 hover:bg-blue-200'
                        } text-blue-500`}
                      >
                        <Download className="w-3 h-3" /> Download All
                      </button>
                    </div>
                  </div>
                  
                  {folderFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {folderFiles.map((file, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors`}>
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              file.name.endsWith('.pl') 
                                ? 'bg-purple-500/20 text-purple-400'
                                : file.name.endsWith('.txt')
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              <File className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate" title={file.name}>
                                {file.name}
                              </div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {(file.size / 1024).toFixed(2)} KB • {new Date(file.created_at).toLocaleDateString()}
                              </div>
                              {file.metadata?.mimetype && (
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {file.metadata.mimetype}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => viewFileContent(file)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-500 hover:from-blue-500/30 hover:to-cyan-500/30 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => downloadFile(file.fullPath, file.name)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteFileInFolder(file.name)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        No files found in this folder
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // All folders list
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supabaseFolders.map((folder, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    } transition-colors`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Folder className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{folder.name}</div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {folder.fileCount} files • {(folder.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => viewFolderFiles(folder.name)}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-500 hover:from-blue-500/30 hover:to-cyan-500/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> View Files ({folder.fileCount})
                        </button>
                        {folder.lastModified && (
                          <div className={`text-xs text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            Updated: {new Date(folder.lastModified).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Root files (outside folders) */}
            {!selectedFolder && (
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <File className="w-5 h-5" /> Root Files
                </h3>
                {supabaseFiles.filter(f => f.folder === 'root').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supabaseFiles
                      .filter(f => f.folder === 'root')
                      .map((file, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors`}>
                          <div className="flex items-center gap-3 mb-3">
                            <File className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium truncate">{file.name}</div>
                              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {(file.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadFile(file.fullPath, file.name)}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30 transition-colors text-sm"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      No files in root directory
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Result Message */}
            {bucketResult && (
              <div className={`rounded-xl p-4 ${
                bucketResult.includes('✅') 
                  ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                  : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
              }`}>
                <div className="flex justify-between items-center">
                  <span>{bucketResult}</span>
                  <button onClick={() => setBucketResult('')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity View - ПОДОБРЕНА ВЕРСИЯ */}
        {selectedView === "activity" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6" /> Activity Logs
                </h2>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {filteredActivityLogs.length} activities found
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                <select 
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="all">All Activities</option>
                  <option value="user">User Activities</option>
                  <option value="code">Code & Assignments</option>
                  <option value="file">Files & Storage</option>
                </select>
                
                <button
                  onClick={loadActivityLogs}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter(l => l.actionType.includes('user')).length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      User Activities
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Code className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter(l => l.actionType.includes('code') || l.actionType.includes('assignment')).length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Code Submissions
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <File className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter(l => l.actionType.includes('file') || l.actionType.includes('folder')).length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      File Activities
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter(l => l.actionType.includes('login')).length}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Logins
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Logs */}
            <div className={`rounded-2xl border backdrop-blur-xl ${currentTheme.card}`}>
              <div className="divide-y">
                {filteredActivityLogs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        log.color === 'green' ? 'bg-green-500/20 text-green-500' :
                        log.color === 'red' ? 'bg-red-500/20 text-red-500' :
                        log.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                        log.color === 'purple' ? 'bg-purple-500/20 text-purple-500' :
                        log.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-500' :
                        log.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-500' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {log.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold">{log.action}</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span className="font-medium">{log.user}</span> • {log.userEmail}
                            </p>
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            log.actionType.includes('user') ? 'bg-blue-500/20 text-blue-500' :
                            log.actionType.includes('code') ? 'bg-green-500/20 text-green-500' :
                            log.actionType.includes('file') ? 'bg-cyan-500/20 text-cyan-500' :
                            log.actionType.includes('login') ? 'bg-purple-500/20 text-purple-500' :
                            'bg-gray-500/20 text-gray-500'
                          }`}>
                            {log.actionType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                          <div className="font-medium mb-1">{log.target}</div>
                          {log.details && (
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredActivityLogs.length === 0 && (
                  <div className="p-8 text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      No activities found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Content Modal */}
        {showFileContentModal && selectedSupabaseFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ${currentTheme.card}`}>
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedSupabaseFile.name}</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Folder: {selectedSupabaseFile.folder} • Size: {(selectedSupabaseFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => setShowFileContentModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto">
                <pre className={`p-6 font-mono text-sm whitespace-pre-wrap ${theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'}`}>
                  {fileContent}
                </pre>
              </div>
              
              <div className="p-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => downloadFile(selectedSupabaseFile.fullPath, selectedSupabaseFile.name)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={() => setShowFileContentModal(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
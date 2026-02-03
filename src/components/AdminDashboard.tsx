import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCheck, UserX, UserCog, 
  FileText, FileCode, Folder, Database, 
  BarChart3, Activity, Zap, Settings,
  Search, Filter, Download, Eye, Edit,
  Trash2, CheckCircle, XCircle, Clock,
  AlertCircle, Plus, RefreshCw, Shield,
  Home, Crown, Server, HardDrive, 
  TrendingUp, TrendingDown, Calendar,
  Mail, Building, GraduationCap,
  Award, Target, Clock as ClockIcon,
  FileUp, Link, Copy, ExternalLink,
  MoreVertical, ChevronRight, Menu, X,
  BarChart, PieChart, LineChart, Upload,
  FolderPlus, CheckSquare, Square,
  DownloadCloud, UploadCloud, Cpu,
  Smartphone, Globe, CreditCard,
  Bell, BellOff, Key, Lock
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
  serverTimestamp
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

interface ChartData {
  labels: string[];
  data: number[];
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export default function AdminDashboard() {
  const { user: currentUser, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  console.log(t);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [prologCodes, setPrologCodes] = useState<PrologCode[]>([]);
  const [supabaseFiles, setSupabaseFiles] = useState<SupabaseFile[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);
  const [_activeUsers, setActiveUsers] = useState<User[]>([]);
  
  // Supabase Management State
  const [supabaseFolders, setSupabaseFolders] = useState<SupabaseFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<any[]>([]);
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Chart data
  const [userGrowthData, setUserGrowthData] = useState<ChartData>({ labels: [], data: [] });
  const [_submissionTrendData, setSubmissionTrendData] = useState<ChartData>({ labels: [], data: [] });
  const [successRateData, setSuccessRateData] = useState<ChartData>({ labels: [], data: [] });

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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    { id: '1', user: 'System', action: 'Database backup completed', target: 'Server', timestamp: new Date(), icon: 'Database', color: 'green' },
    { id: '2', user: 'John Doe', action: 'Uploaded new file', target: 'project.pl', timestamp: new Date(Date.now() - 3600000), icon: 'Upload', color: 'blue' },
    { id: '3', user: 'Jane Smith', action: 'Account suspended', target: 'User #456', timestamp: new Date(Date.now() - 7200000), icon: 'UserX', color: 'red' },
    { id: '4', user: 'System', action: 'Daily report generated', target: 'Analytics', timestamp: new Date(Date.now() - 10800000), icon: 'BarChart', color: 'purple' },
  ]);

  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Theme classes
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
      
      // Load files from Supabase
      await loadSupabaseFiles();
      
      // Calculate statistics
      calculateStats(usersData, codesData);
      
      // Calculate chart data
      calculateChartData(usersData, codesData);
      
      // Pending teachers
      const pending = usersData.filter(u => u.role === 'teacher' && u.status === 'pending');
      setPendingTeachers(pending);
      
      // Active users (last 24 hours)
      const active = usersData.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return lastLogin > yesterday;
      });
      setActiveUsers(active);
      
      // Update activity logs with real data
      const newLogs: ActivityLog[] = [
        ...activityLogs,
        { 
          id: '5', 
          user: currentUser?.email?.split('@')[0] || 'Admin', 
          action: 'Refreshed dashboard data', 
          target: 'All systems', 
          timestamp: new Date(), 
          icon: 'RefreshCw', 
          color: 'blue' 
        }
      ];
      setActivityLogs(newLogs);
      
    } catch (error: any) {
      console.error("Error loading admin data:", error);
      // Don't show alert, handle gracefully
    } finally {
      setLoading(false);
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
    
    // Calculate average execution time
    const validExecutionTimes = codesData
      .filter(c => c.executionTime && c.executionTime > 0)
      .map(c => c.executionTime!);
    const avgExecutionTime = validExecutionTimes.length > 0 
      ? Math.round(validExecutionTimes.reduce((a, b) => a + b, 0) / validExecutionTimes.length)
      : 0;

    // Calculate storage usage percentage (mock for now)
    const storageUsage = supabaseStats.totalSize > 0 
      ? Math.min(Math.round((supabaseStats.totalSize / (1024 * 1024 * 100)) * 100), 100) // Assuming 100MB max
      : 0;

    // Calculate monthly growth (mock for now)
    const monthlyGrowth = usersData.length > 10 
      ? Math.round((activeToday / usersData.length) * 100) - 50 
      : 25;

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
      avgExecutionTime,
      storageUsage,
      monthlyGrowth
    }));
  };

  const calculateChartData = (usersData: User[], codesData: PrologCode[]) => {
    // User growth data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    const userCounts = Array(7).fill(0);
    usersData.forEach(user => {
      const createdDate = new Date(user.createdAt);
      const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) {
        userCounts[6 - daysAgo]++;
      }
    });
    
    // Calculate cumulative sum
    let cumulative = 0;
    const cumulativeUserCounts = userCounts.map(count => {
      cumulative += count;
      return cumulative;
    });
    
    setUserGrowthData({
      labels: last7Days,
      data: cumulativeUserCounts
    });

    // Submission trend data (last 7 days)
    const submissionCounts = Array(7).fill(0);
    codesData.forEach(code => {
      const createdDate = new Date(code.createdAt);
      const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) {
        submissionCounts[6 - daysAgo]++;
      }
    });

    setSubmissionTrendData({
      labels: last7Days,
      data: submissionCounts
    });

    // Success rate data (last 7 days)
    const successRates = Array(7).fill(0);
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - (6 - i));
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayCodes = codesData.filter(code => {
        const codeDate = new Date(code.createdAt);
        return codeDate >= dayStart && codeDate < dayEnd;
      });
      
      if (dayCodes.length > 0) {
        const successful = dayCodes.filter(code => code.status === 'success').length;
        successRates[i] = Math.round((successful / dayCodes.length) * 100);
      }
    }

    setSuccessRateData({
      labels: last7Days,
      data: successRates
    });
  };

  // Filtered data based on search and filters
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
           code.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (code.folder && code.folder.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Supabase folder functions
  const createSupabaseFolder = async () => {
    if (!newFolderName.trim()) {
      setBucketResult("❌ Please enter a folder name");
      return;
    }

    try {
      // Create placeholder file to create folder
      const dummyFile = new File(['# Placeholder for folder'], '.folderplaceholder', { 
        type: 'text/plain' 
      });
      
      const { data, error } = await supabase.storage
        .from('prolog-files')
        .upload(`${newFolderName}/.folderplaceholder`, dummyFile, {
          upsert: false
        });
      
      if (error) throw error;
      console.log(data);
      setBucketResult(`✅ Folder "${newFolderName}" created successfully.`);
      setNewFolderName('');
      await refreshSupabaseData();
    } catch (error: any) {
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
      const folders = new Set<string>();
      let totalSize = 0;
      let lastUpdated: number | null = null;
      
      // Process each item
      for (const item of rootItems) {
        if (!item.name) continue;
        
        if (item.id === null) { // It's a folder
          folders.add(item.name);
          
          // Get files from this folder
          const { data: folderFiles, error: folderError } = await supabase.storage
            .from("prolog-files")
            .list(item.name, { limit: 1000 });
          
          if (!folderError && folderFiles) {
            const prologFilesInFolder = folderFiles.filter(file => 
              file.name && (file.name.endsWith('.pl') || file.name.endsWith('.txt')) && file.id !== null
            );
            
            prologFilesInFolder.forEach(file => {
              const metadata = file.metadata || {};
              const size = typeof metadata.size === 'number' ? metadata.size : 0;
              const mimetype = typeof metadata.mimetype === 'string' ? metadata.mimetype : 'application/x-prolog';
              
              allFiles.push({
                name: file.name || '',
                id: file.id || Math.random().toString(36).substring(2),
                created_at: file.created_at || new Date().toISOString(),
                updated_at: file.updated_at || new Date().toISOString(),
                size: size,
                folder: item.name,
                fullPath: `${item.name}/${file.name}`,
                metadata: { size, mimetype }
              });
              
              totalSize += size;
              
              if (file.created_at) {
                const fileDate = new Date(file.created_at).getTime();
                if (!lastUpdated || fileDate > lastUpdated) {
                  lastUpdated = fileDate;
                }
              }
            });
          }
        } else if (item.name.endsWith('.pl') || item.name.endsWith('.txt')) {
          const metadata = item.metadata || {};
          const size = typeof metadata.size === 'number' ? metadata.size : 0;
          const mimetype = typeof metadata.mimetype === 'string' ? metadata.mimetype : 'application/x-prolog';
          
          allFiles.push({
            name: item.name || '',
            id: item.id || Math.random().toString(36).substring(2),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            size: size,
            folder: 'root',
            fullPath: item.name || '',
            metadata: { size, mimetype }
          });
          
          totalSize += size;
          
          if (item.created_at) {
            const fileDate = new Date(item.created_at).getTime();
            if (!lastUpdated || fileDate > lastUpdated) {
              lastUpdated = fileDate;
            }
          }
        }
      }
      
      // Prepare folder data
      const folderData: SupabaseFolder[] = Array.from(folders).map(folderName => {
        const folderFiles = allFiles.filter(f => f.folder === folderName);
        const folderSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
        
        return {
          name: folderName,
          fileCount: folderFiles.length,
          size: folderSize,
          lastModified: folderFiles.length > 0 
            ? new Date(Math.max(...folderFiles.map(f => new Date(f.created_at).getTime()))).toISOString()
            : undefined
        };
      });
      
      setSupabaseFiles(allFiles);
      setSupabaseFolders(folderData);
      
      const storageUsed = totalSize < 1024 * 1024 
        ? `${(totalSize / 1024).toFixed(2)} KB`
        : `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
      
      setSupabaseStats({
        totalFiles: allFiles.length,
        totalFolders: folders.size,
        totalSize: totalSize,
        lastUpdated: lastUpdated,
        storageUsed: storageUsed
      });
      
      setBucketResult(`✅ Data refreshed. Found ${folders.size} folders with ${allFiles.length} files.`);
      
    } catch (error: any) {
      console.error("Error loading Supabase files:", error);
      setBucketResult(`❌ Error refreshing data: ${error.message}`);
    }
  };

  const viewFolderFiles = async (folderName: string) => {
    try {
      const { data: files, error } = await supabase.storage
        .from('prolog-files')
        .list(folderName);
      
      if (error) throw error;
      
      setSelectedFolder(folderName);
      setFolderFiles(files || []);
      
    } catch (error: any) {
      setBucketResult(`❌ Error loading folder ${folderName}: ${error.message}`);
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
    } catch (error: any) {
      // Show notification instead of alert
      setBucketResult(`❌ Error downloading file: ${error.message}`);
    }
  };

  const copyFileUrl = (fileName: string) => {
    if (!selectedFolder) return;
    
    const { data } = supabase.storage
      .from('prolog-files')
      .getPublicUrl(`${selectedFolder}/${fileName}`);
    
    if (data.publicUrl) {
      navigator.clipboard.writeText(data.publicUrl);
      setBucketResult('✅ File URL copied to clipboard!');
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
        let folder = code.folder || 'unknown';
        
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

  const approveTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, "users", teacherId), {
        status: "active",
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.uid,
        isVerified: true
      });
      
      await loadAllData();
      setBucketResult("✅ Teacher approved successfully!");
      
      // Add to activity logs
      const teacher = users.find(u => u.id === teacherId);
      if (teacher) {
        setActivityLogs(prev => [{
          id: Date.now().toString(),
          user: currentUser?.email?.split('@')[0] || 'Admin',
          action: 'Approved teacher',
          target: teacher.fullName,
          timestamp: new Date(),
          icon: 'UserCheck',
          color: 'green'
        }, ...prev]);
      }
    } catch (error) {
      console.error("Error approving teacher:", error);
      setBucketResult("❌ Error approving teacher!");
    }
  };

  const rejectTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, "users", teacherId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.uid
      });
      
      await loadAllData();
      setBucketResult("✅ Teacher rejected!");
      
      // Add to activity logs
      const teacher = users.find(u => u.id === teacherId);
      if (teacher) {
        setActivityLogs(prev => [{
          id: Date.now().toString(),
          user: currentUser?.email?.split('@')[0] || 'Admin',
          action: 'Rejected teacher',
          target: teacher.fullName,
          timestamp: new Date(),
          icon: 'UserX',
          color: 'red'
        }, ...prev]);
      }
    } catch (error) {
      console.error("Error rejecting teacher:", error);
      setBucketResult("❌ Error rejecting teacher!");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    if (userId === currentUser?.uid) {
      setBucketResult("❌ You cannot change your own status!");
      return;
    }

    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await updateDoc(doc(db, "users", userId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid
      });
      
      await loadAllData();
      setBucketResult(`✅ User status changed to ${newStatus}`);
      
      // Add to activity logs
      const user = users.find(u => u.id === userId);
      if (user) {
        setActivityLogs(prev => [{
          id: Date.now().toString(),
          user: currentUser?.email?.split('@')[0] || 'Admin',
          action: `Changed user status to ${newStatus}`,
          target: user.fullName,
          timestamp: new Date(),
          icon: newStatus === 'active' ? 'UserCheck' : 'UserX',
          color: newStatus === 'active' ? 'green' : 'red'
        }, ...prev]);
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      setBucketResult("❌ Error changing status!");
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.uid) {
      setBucketResult("❌ You cannot delete your own account!");
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
      
      await loadAllData();
      setBucketResult("✅ User deleted successfully!");
      
      // Add to activity logs
      setActivityLogs(prev => [{
        id: Date.now().toString(),
        user: currentUser?.email?.split('@')[0] || 'Admin',
        action: 'Deleted user account',
        target: userName,
        timestamp: new Date(),
        icon: 'Trash2',
        color: 'red'
      }, ...prev]);
      
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      setBucketResult("❌ Error deleting user!");
    }
  };

  const deleteCode = async (codeId: string, codeName: string) => {
    try {
      await deleteDoc(doc(db, "prologCodes", codeId));
      await loadAllData();
      setBucketResult("✅ Code deleted successfully!");
      
      // Add to activity logs
      setActivityLogs(prev => [{
        id: Date.now().toString(),
        user: currentUser?.email?.split('@')[0] || 'Admin',
        action: 'Deleted code submission',
        target: codeName,
        timestamp: new Date(),
        icon: 'FileText',
        color: 'red'
      }, ...prev]);
    } catch (error) {
      console.error("Error deleting code:", error);
      setBucketResult("❌ Error deleting code!");
    }
  };

  const deleteFile = async (filePath: string, fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from("prolog-files")
        .remove([filePath]);

      if (error) throw error;

      // Delete from Firestore if exists
      const codeToDelete = prologCodes.find(code => code.filePath === filePath);
      if (codeToDelete) {
        await deleteDoc(doc(db, "prologCodes", codeToDelete.id));
      }

      await loadAllData();
      setBucketResult("✅ File deleted successfully!");
      
      // Add to activity logs
      setActivityLogs(prev => [{
        id: Date.now().toString(),
        user: currentUser?.email?.split('@')[0] || 'Admin',
        action: 'Deleted storage file',
        target: fileName,
        timestamp: new Date(),
        icon: 'Trash2',
        color: 'red'
      }, ...prev]);
    } catch (error) {
      console.error("Error deleting file:", error);
      setBucketResult("❌ Error deleting file!");
    }
  };

  useEffect(() => {
    if (selectedTab === "supabase") {
      refreshSupabaseData();
    }
  }, [selectedTab]);

  // Helper function to get icon component
  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Users, UserCheck, UserX, UserCog, FileText, FileCode, Folder, Database,
      BarChart3, Activity, Zap, Settings, Search, Filter, Download, Eye, Edit,
      Trash2, CheckCircle, XCircle, Clock, AlertCircle, Plus, RefreshCw, Shield,
      Home, Crown, Server, HardDrive, TrendingUp, TrendingDown, Calendar,
      Mail, Building, GraduationCap, Award, Target, ClockIcon, FileUp, Link,
      Copy, ExternalLink, MoreVertical, ChevronRight, Menu, X, BarChart,
      PieChart, LineChart, Upload, FolderPlus, CheckSquare, Square,
      DownloadCloud, UploadCloud, Cpu, Smartphone, Globe, CreditCard,
      Bell, BellOff, Key, Lock
    };
    return icons[iconName] || Activity;
  };

  // Navigation items
  const navItems = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "users", label: "Users", icon: <Users className="w-5 h-5" />, badge: stats.pendingApprovals },
    { id: "teachers", label: "Teachers", icon: <GraduationCap className="w-5 h-5" />, badge: pendingTeachers.length },
    { id: "codes", label: "Submissions", icon: <FileCode className="w-5 h-5" />, badge: stats.totalSubmissions },
    { id: "files", label: "File Manager", icon: <Folder className="w-5 h-5" />, badge: supabaseStats.totalFiles },
    { id: "storage", label: "Storage", icon: <Database className="w-5 h-5" /> },
    { id: "analytics", label: "Analytics", icon: <LineChart className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

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
    <div className={`flex min-h-screen ${currentTheme.background} ${currentTheme.text} pt-16`}>
      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 ${currentTheme.sidebar} border-r backdrop-blur-xl z-40 lg:z-20`}
          >
            <div className="p-6 h-full flex flex-col overflow-y-auto">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold">IDEAS Admin</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Management Panel
                  </p>
                </div>
              </div>

              {/* User Profile */}
              <div className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{userData?.fullName || "Administrator"}</h4>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {currentUser?.email || "admin@ideas.com"}
                    </p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-medium text-center ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <Shield className="w-3 h-3 inline mr-1" /> Administrator
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1 flex-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedTab(item.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                      selectedTab === item.id
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-600"
                        : `${currentTheme.hover} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>

              {/* System Status */}
              <div className={`pt-6 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>System Status</span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-green-500">Online</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Storage</span>
                    <span>{supabaseStats.storageUsed}</span>
                  </div>
                  <button 
                    onClick={loadAllData}
                    className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0 lg:ml-64' : 'ml-0'}`}>
        {/* Top Navigation */}
        <div className={`sticky top-0 z-30 ${theme === 'dark' ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-lg border-b ${
          theme === 'dark' ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-bold">
                {navItems.find(item => item.id === selectedTab)?.label || "Dashboard"}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === 'dark' 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <button 
                onClick={loadAllData}
                className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          {/* Overview Tab */}
          {selectedTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, idx) => (
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
                    <div className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{stat.title}</div>
                    <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {stat.description}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick Stats & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`lg:col-span-2 rounded-2xl p-6 border backdrop-blur-xl ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5" /> User Distribution
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Students', value: stats.totalStudents, color: 'from-blue-500 to-cyan-500', percent: (stats.totalStudents / stats.totalUsers) * 100 },
                      { label: 'Teachers', value: stats.totalTeachers, color: 'from-purple-500 to-pink-500', percent: (stats.totalTeachers / stats.totalUsers) * 100 },
                      { label: 'Admins', value: stats.totalAdmins, color: 'from-green-500 to-emerald-500', percent: (stats.totalAdmins / stats.totalUsers) * 100 },
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
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
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
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`rounded-2xl p-6 border backdrop-blur-xl ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Recent Activity
                  </h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {activityLogs.map((log) => {
                      const Icon = getIconComponent(log.icon);
                      return (
                        <div key={log.id} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            log.color === 'green' ? 'bg-green-500/20 text-green-500' :
                            log.color === 'red' ? 'bg-red-500/20 text-red-500' :
                            log.color === 'blue' ? 'bg-blue-500/20 text-blue-500' :
                            'bg-purple-500/20 text-purple-500'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{log.user}</span> {log.action}
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}> {log.target}</span>
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                              {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`rounded-2xl p-6 border backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setSelectedTab("teachers")}
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
                    onClick={() => setSelectedTab("users")}
                    className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <UserCog className="w-6 h-6 text-blue-500 mb-2" />
                    <div className="font-medium">Manage Users</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {stats.totalUsers} total users
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedTab("files")}
                    className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Folder className="w-6 h-6 text-amber-500 mb-2" />
                    <div className="font-medium">File Manager</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {supabaseStats.totalFiles} files
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedTab("analytics")}
                    className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart className="w-6 h-6 text-purple-500 mb-2" />
                    <div className="font-medium">View Analytics</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Detailed insights
                    </div>
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Users Tab */}
          {selectedTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {filteredUsers.length} users found
                  </p>
                </div>
                <div className="flex gap-3">
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

              <div className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                        <th className="py-4 px-6 text-left font-medium">User</th>
                        <th className="py-4 px-6 text-left font-medium">Role</th>
                        <th className="py-4 px-6 text-left font-medium">Status</th>
                        <th className="py-4 px-6 text-left font-medium">Institution</th>
                        <th className="py-4 px-6 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className={`border-b ${theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                {user.role === 'student' ? <GraduationCap className="w-5 h-5 text-purple-400" /> :
                                 user.role === 'teacher' ? <Users className="w-5 h-5 text-blue-400" /> :
                                 <Shield className="w-5 h-5 text-green-400" />}
                              </div>
                              <div>
                                <div className="font-medium">{user.fullName}</div>
                                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-green-500/20 text-green-500' :
                              user.role === 'teacher' ? 'bg-blue-500/20 text-blue-500' :
                              'bg-purple-500/20 text-purple-500'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-green-500/20 text-green-500' :
                              user.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                              user.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                              'bg-gray-500/20 text-gray-500'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">{user.institution}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className={`p-2 rounded-lg ${
                                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                } transition-colors`}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleUserStatus(user.id, user.status)}
                                className={`p-2 rounded-lg ${
                                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                } transition-colors`}
                                title={user.status === 'active' ? 'Suspend' : 'Activate'}
                                disabled={user.id === currentUser?.uid}
                              >
                                {user.status === 'active' ? 
                                  <UserX className="w-4 h-4" /> : 
                                  <UserCheck className="w-4 h-4" />
                                }
                              </button>
                              <button
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteModal(true);
                                }}
                                className={`p-2 rounded-lg ${
                                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                } transition-colors`}
                                title="Delete User"
                                disabled={user.id === currentUser?.uid}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Teachers Tab */}
          {selectedTab === "teachers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Teacher Management</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {pendingTeachers.length} pending approval
                  </p>
                </div>
              </div>

              {pendingTeachers.length > 0 && (
                <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Pending Approval
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingTeachers.map(teacher => (
                      <div key={teacher.id} className={`p-4 rounded-xl border ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium">{teacher.fullName}</div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
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
                            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm"
                          >
                            <CheckCircle className="w-4 h-4 inline mr-2" /> Approve
                          </button>
                          <button
                            onClick={() => rejectTeacher(teacher.id)}
                            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-sm"
                          >
                            <XCircle className="w-4 h-4 inline mr-2" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Teachers */}
              <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" /> All Teachers ({stats.totalTeachers})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                        <th className="py-4 px-6 text-left font-medium">Teacher</th>
                        <th className="py-4 px-6 text-left font-medium">Status</th>
                        <th className="py-4 px-6 text-left font-medium">Institution</th>
                        <th className="py-4 px-6 text-left font-medium">Last Login</th>
                        <th className="py-4 px-6 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => u.role === 'teacher')
                        .map(teacher => (
                          <tr key={teacher.id} className={`border-b ${theme === 'dark' ? 'border-white/10 hover:bg-white/5' : 'border-gray-100 hover:bg-gray-50'}`}>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                  <Users className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                  <div className="font-medium">{teacher.fullName}</div>
                                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {teacher.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                teacher.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                teacher.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                teacher.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                                'bg-gray-500/20 text-gray-500'
                              }`}>
                                {teacher.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">{teacher.institution}</td>
                            <td className="py-4 px-6">
                              {teacher.lastLogin ? new Date(teacher.lastLogin).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleUserStatus(teacher.id, teacher.status)}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                  } transition-colors`}
                                >
                                  {teacher.status === 'active' ? 
                                    <UserX className="w-4 h-4" /> : 
                                    <UserCheck className="w-4 h-4" />
                                  }
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {selectedTab === "codes" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Code Submissions</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {filteredCodes.length} submissions found
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats */}
                <div className={`lg:col-span-3 rounded-2xl border p-6 backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500">
                        {prologCodes.filter(c => c.status === 'success').length}
                      </div>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500">
                        {prologCodes.filter(c => c.status === 'error').length}
                      </div>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-500">
                        {prologCodes.filter(c => c.status === 'pending').length}
                      </div>
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Pending</div>
                    </div>
                  </div>
                </div>

                {/* Submissions List */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCodes.map(code => (
                      <div key={code.id} className={`p-4 rounded-xl border ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium mb-1">{code.title}</h4>
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
                        
                        <div className={`mb-4 p-3 rounded-lg font-mono text-sm overflow-hidden ${
                          theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'
                        }`}>
                          {code.code.substring(0, 100)}...
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            {new Date(code.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(code.code);
                                setBucketResult("✅ Code copied to clipboard!");
                              }}
                              className={`p-2 rounded-lg ${
                                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                              } transition-colors`}
                              title="Copy Code"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCode(code.id, code.title)}
                              className={`p-2 rounded-lg ${
                                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                              } transition-colors`}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {selectedTab === "files" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">File Manager</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {supabaseStats.totalFiles} files in storage
                  </p>
                </div>
                <button 
                  onClick={loadSupabaseFiles}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  } transition-colors`}
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>

              <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                {supabaseFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Files Found</h3>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      No files have been uploaded to storage yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supabaseFiles.map(file => (
                      <div key={file.id} className={`p-4 rounded-xl border ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                            <FileCode className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium truncate">{file.name}</div>
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Folder: {file.folder}
                            </div>
                          </div>
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} mb-3`}>
                          {(file.size / 1024).toFixed(2)} KB • {new Date(file.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadFile(file.fullPath, file.name)}
                            className={`flex-1 py-2 rounded-lg text-sm ${
                              theme === 'dark' 
                                ? 'bg-white/5 hover:bg-white/10' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors`}
                          >
                            <Download className="w-4 h-4 inline mr-2" /> Download
                          </button>
                          <button
                            onClick={() => deleteFile(file.fullPath, file.name)}
                            className={`flex-1 py-2 rounded-lg text-sm bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30 transition-colors`}
                          >
                            <Trash2 className="w-4 h-4 inline mr-2" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Storage Tab */}
          {selectedTab === "storage" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Storage Management</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {supabaseStats.totalFolders} folders • {supabaseStats.totalFiles} files
                  </p>
                </div>
              </div>

              {/* Create Folder */}
              <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5" /> Create New Folder
                </h3>
                <div className="flex gap-3">
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
              </div>

              {/* Folders List */}
              <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Folder className="w-5 h-5" /> Existing Folders
                </h3>
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
                      <button
                        onClick={() => viewFolderFiles(folder.name)}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-500 hover:from-blue-500/30 hover:to-cyan-500/30 transition-colors"
                      >
                        <Eye className="w-4 h-4 inline mr-2" /> View Files
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Folder View Modal */}
              {selectedFolder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedFolder(null)} />
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className={`relative w-full max-w-4xl rounded-2xl border ${
                      theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                            <Folder className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">Files in {selectedFolder}</h3>
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                              {folderFiles.length} files
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFolder(null)}
                          className={`p-2 rounded-lg ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                          } transition-colors`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {folderFiles.map((file, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${
                            theme === 'dark' 
                              ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          } transition-colors`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileCode className="w-5 h-5 text-green-500" />
                                <div>
                                  <div className="font-medium">{file.name}</div>
                                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {(file.metadata?.size || 0) / 1024} KB
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => copyFileUrl(file.name)}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                  } transition-colors`}
                                  title="Copy URL"
                                >
                                  <Link className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteFileInFolder(file.name)}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                  } transition-colors`}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
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

          {/* Analytics Tab */}
          {selectedTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Platform Analytics</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Detailed insights and metrics
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> User Growth (Last 7 days)
                  </h3>
                  <div className="h-64 flex items-end gap-2">
                    {userGrowthData.data.map((value, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {userGrowthData.labels[idx]}
                        </div>
                        <div className="w-full flex justify-center">
                          <div 
                            className="w-3/4 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${(value / Math.max(...userGrowthData.data, 1)) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs mt-2 font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Rate Chart */}
                <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5" /> Success Rate Trend
                  </h3>
                  <div className="h-64 relative">
                    <div className="absolute inset-0 flex items-end">
                      {successRateData.data.map((value, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-3/4 bg-gradient-to-t from-green-500 to-emerald-500 rounded-t-lg transition-all hover:opacity-80"
                            style={{ height: `${value}%` }}
                          />
                          <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {successRateData.labels[idx]}
                          </div>
                          <div className="text-xs font-medium">{value}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className="text-lg font-bold mb-6">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.successRate}%</div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.avgExecutionTime}ms</div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Avg Execution Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.activeToday}</div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Active Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{stats.storageUsage}%</div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Storage Usage</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {selectedTab === "settings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">System Settings</h2>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    Configure platform settings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Settings */}
                <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <UserCog className="w-5 h-5" /> User Settings
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Auto-approve students', defaultChecked: true },
                      { label: 'Require email verification', defaultChecked: true },
                      { label: 'Enable two-factor authentication', defaultChecked: false },
                      { label: 'Notify on new user registration', defaultChecked: true },
                    ].map((setting, idx) => (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            defaultChecked={setting.defaultChecked}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${
                            setting.defaultChecked 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : theme === 'dark' ? 'bg-white/10' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              setting.defaultChecked ? 'left-5' : 'left-1'
                            }`} />
                          </div>
                        </div>
                        <span className="flex-1">{setting.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Upload Settings */}
                <div className={`rounded-2xl border p-6 backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Upload Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Max file size (MB)
                      </label>
                      <input
                        type="number"
                        defaultValue="10"
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Allowed file types
                      </label>
                      <input
                        type="text"
                        defaultValue=".pl, .txt"
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="sr-only"
                        />
                        <div className="w-10 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                          <div className="absolute top-1 left-5 w-4 h-4 rounded-full bg-white" />
                        </div>
                      </div>
                      <span>Auto-check syntax</span>
                    </label>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className={`lg:col-span-2 rounded-2xl border p-6 backdrop-blur-xl ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5" /> Notification Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Email notifications for new users', defaultChecked: true },
                      { label: 'Daily activity reports', defaultChecked: true },
                      { label: 'Weekly analytics emails', defaultChecked: false },
                      { label: 'Real-time alerts', defaultChecked: true },
                    ].map((setting, idx) => (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            defaultChecked={setting.defaultChecked}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${
                            setting.defaultChecked 
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                              : theme === 'dark' ? 'bg-white/10' : 'bg-gray-300'
                          }`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              setting.defaultChecked ? 'left-5' : 'left-1'
                            }`} />
                          </div>
                        </div>
                        <span>{setting.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium">
                  <CheckCircle className="w-5 h-5 inline mr-2" /> Save Settings
                </button>
                <button className={`px-6 py-3 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-gray-100 hover:bg-gray-200'
                } transition-colors`}>
                  Reset to Default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowUserModal(false)} />
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    {selectedUser.role === 'student' ? <GraduationCap className="w-6 h-6 text-purple-400" /> :
                     selectedUser.role === 'teacher' ? <Users className="w-6 h-6 text-blue-400" /> :
                     <Shield className="w-6 h-6 text-green-400" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.fullName}</h3>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserModal(false)}
                  className={`p-2 rounded-lg ${
                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  } transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Role:</span>
                  <span className="font-medium">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedUser.status === 'active' ? 'bg-green-500/20 text-green-500' :
                    selectedUser.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                    selectedUser.status === 'suspended' ? 'bg-red-500/20 text-red-500' :
                    'bg-gray-500/20 text-gray-500'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Institution:</span>
                  <span className="font-medium">{selectedUser.institution}</span>
                </div>
                {selectedUser.specialty && (
                  <div className="flex justify-between">
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Specialty:</span>
                    <span className="font-medium">{selectedUser.specialty}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Joined:</span>
                  <span className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Verified:</span>
                  <span className="font-medium">{selectedUser.isVerified ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => toggleUserStatus(selectedUser.id, selectedUser.status)}
                  className={`flex-1 py-3 rounded-lg ${
                    selectedUser.status === 'active'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500'
                  } text-white font-medium`}
                >
                  {selectedUser.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setUserToDelete(selectedUser);
                    setShowDeleteModal(true);
                    setShowUserModal(false);
                  }}
                  className={`flex-1 py-3 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowDeleteModal(false)} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className={`relative w-full max-w-md rounded-2xl border ${
              theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
            }`}
          >
            <div className="p-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Confirm Deletion</h3>
              <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Are you sure you want to delete {userToDelete.fullName}?
                <br />
                <span className="text-sm">This action cannot be undone.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className={`flex-1 py-3 rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-white/5 hover:bg-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  } transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(userToDelete.id, userToDelete.fullName)}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
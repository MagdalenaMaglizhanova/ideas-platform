import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion} from "framer-motion";
import { collection, getDocs} from "firebase/firestore";
import { db } from "../services/firebase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

// Icons import
import {
  MessageSquare,
  Code as CodeIcon,
  FileCode,
  Download,
  Copy,
  X,
  Database,
  Globe,
  RefreshCw,
  Play,
  Terminal,
  Brain,
  HelpCircle,
  User as UserIcon,
  Trash2,
  List,
  LogOut,
  Users,
  FileText,
  File,
  FolderOpen,
  Edit,
  Save,
  Eye
} from "lucide-react";

interface Message {
  user: boolean;
  text: string;
  id: string;
  timestamp: Date;
  type?: 'system' | 'query' | 'result' | 'file_list';
}

interface PrologCode {
  id: string;
  code: string;
  title?: string;
  domain?: string;
  fileName?: string;
  filePath?: string;
  folder?: string;
}

interface FileInfo {
  name: string;
  size?: number;
  loaded: boolean;
}

// Helper function to generate ID without uuid
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Hook for session management
const usePrologSession = () => {
  const { user } = useAuth();
  
  const getSessionId = (): string => {
    // За логнати потребители - използваме Firebase UID
    if (user?.uid) {
      return user.uid;
    }
    
    // За анонимни потребители - отделен localStorage ключ
    let sessionId = localStorage.getItem('prolog_main_session_id');
    if (!sessionId) {
      sessionId = generateId();
      localStorage.setItem('prolog_main_session_id', sessionId);
    }
    return sessionId;
  };

  const sessionId = getSessionId();
  const userId = sessionId;

  const clearSession = async (): Promise<void> => {
    // Изчистваме само анонимната сесия
    if (!user) {
      localStorage.removeItem('prolog_main_session_id');
    }
    
    try {
      await fetch("https://prolog-api-server-1.onrender.com/prolog/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  return {
    userId,
    sessionId,
    clearSession
  };
};

export default function PrologChat() {
  const { codeId } = useParams<{ codeId?: string }>();
  const { user } = useAuth();
  const { userId, sessionId, clearSession } = usePrologSession();
  console.log(user)
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allCodes, setAllCodes] = useState<PrologCode[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "code">("chat");
  const [fileNameInput, setFileNameInput] = useState("");
  const [loadedFiles, setLoadedFiles] = useState<FileInfo[]>([]);
  
  // New state for current file code viewer
  const [currentFileCode, setCurrentFileCode] = useState<string>("");
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [isLoadingCode, setIsLoadingCode] = useState<boolean>(false);
  const [codeViewMode, setCodeViewMode] = useState<"view" | "edit">("view");
  const [editedCode, setEditedCode] = useState<string>("");
  const [_uploadFolder, setUploadFolder] = useState<string>("");
  const [activeSessions, setActiveSessions] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const codeViewerRef = useRef<HTMLDivElement>(null);
  
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const topRef = useRef<HTMLDivElement>(null);
console.log(language)
  // Initialize session on component mount
  useEffect(() => {
    initSession();
    return () => {
      endSession();
    };
  }, []);

  const initSession = async (): Promise<void> => {
    try {
      await fetch("https://prolog-api-server-1.onrender.com/prolog/init-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error("Error initializing session:", error);
    }
  };

  const endSession = async (): Promise<void> => {
    try {
      await fetch("https://prolog-api-server-1.onrender.com/prolog/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const getActiveSessions = async (): Promise<void> => {
    try {
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/list-sessions");
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data.sessions?.length || 0);
      }
    } catch (error) {
      console.error("Error getting sessions:", error);
    }
  };

  useEffect(() => {
    getActiveSessions();
    const interval = setInterval(getActiveSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  // Domains configuration
  const domains = [
    { 
      id: "animals", 
      label: t('animals') || 'Animals', 
      color: "#FF6B8B"
    },
    { 
      id: "history", 
      label: t('history') || 'History', 
      color: "#36D1DC"
    },
    { 
      id: "geography", 
      label: t('geography') || 'Geography', 
      color: "#FFD166"
    },
    { 
      id: "mineralwater", 
      label: t('mineral_water') || 'Mineral Water', 
      color: "#9D4EDD"
    },
    { 
      id: "balkan", 
      label: t('balkan') || 'Central Balkan', 
      color: "#7BDF7B"
    }
  ];

  // System commands
  const systemCommands = [
    { 
      label: t('help') || 'Help', 
      query: "help", 
      icon: <HelpCircle className="w-4 h-4" />,
      gradient: "from-blue-500 to-cyan-500",
      tooltip: t('help_tooltip') || 'Show help information'
    },
    { 
      label: t('load_all') || 'Load All', 
      query: "load_all", 
      icon: <Download className="w-4 h-4" />,
      gradient: "from-emerald-500 to-green-500",
      tooltip: t('load_all_tooltip') || 'Load all Prolog files'
    },
    { 
      label: t('list_files') || 'List Files', 
      query: "list_files", 
      icon: <List className="w-4 h-4" />,
      gradient: "from-rose-500 to-pink-500",
      tooltip: t('list_files_tooltip') || 'List all loaded files'
    },
    { 
      label: t('clear_facts') || 'Clear Facts', 
      query: "clear_all_facts", 
      icon: <Trash2 className="w-4 h-4" />,
      gradient: "from-red-500 to-rose-500",
      tooltip: t('clear_facts_tooltip') || 'Clear all loaded facts'
    },
    { 
      label: t('current_file') || 'Current File', 
      query: "current_file", 
      icon: <FileCode className="w-4 h-4" />,
      gradient: "from-purple-500 to-violet-500",
      tooltip: t('current_file_tooltip') || 'Show current active file'
    },
    { 
      label: t('list_predicates') || 'List Predicates', 
      query: "list_predicates", 
      icon: <CodeIcon className="w-4 h-4" />,
      gradient: "from-cyan-500 to-teal-500",
      tooltip: t('list_predicates_tooltip') || 'List all available predicates'
    },
  ];

  // File commands
  const fileCommands = [
    { 
      label: t('consult_file') || 'Consult File', 
      query: `consult_file('${fileNameInput}')`, 
      icon: <Play className="w-4 h-4" />,
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      label: t('reconsult_file') || 'Reconsult File', 
      query: `reconsult_file('${fileNameInput}')`, 
      icon: <RefreshCw className="w-4 h-4" />,
      gradient: "from-purple-500 to-violet-500"
    },
  ];

  // Load all Prolog codes from database
  useEffect(() => {
    async function loadAllCodes() {
      try {
        const snapshot = await getDocs(collection(db, "prologCodes"));
        const codes: PrologCode[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          code: docSnap.data().code || "",
          title: docSnap.data().title,
          domain: docSnap.data().domain || "general",
          fileName: docSnap.data().fileName,
          filePath: docSnap.data().filePath,
          folder: docSnap.data().folder
        }));
        setAllCodes(codes);

        if (codeId) {
          const specific = codes.find(c => c.id === codeId);
          if (specific && specific.domain) {
            setSelectedDomain(specific.domain);
            loadDomain(specific.domain);
          }
        }
      } catch (err) {
        console.error("Failed to load Prolog codes:", err);
      }
    }
    loadAllCodes();
  }, [codeId]);

  useEffect(() => {
    if (selectedDomain) {
      setUploadFolder(selectedDomain);
    }
  }, [selectedDomain]);

  // Parse file list from Prolog output
  const parseFileList = (output: string): FileInfo[] => {
    const files: FileInfo[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Look for lines containing .pl files
      if (line.includes('.pl')) {
        const match = line.match(/[a-zA-Z0-9_-]+\.pl/g);
        if (match) {
          match.forEach(file => {
            if (!files.find(f => f.name === file)) {
              files.push({ name: file, loaded: true });
            }
          });
        }
      }
    }
    
    return files;
  };

  // Handle file click to consult it and load its code
  const handleFileClick = async (fileName: string) => {
    // First consult the file
    await sendQuery(`consult_file('${fileName}')`);
    
    // Then try to load its code from the database
    loadFileCode(fileName);
    
    // Removed automatic tab switching - user stays on current tab
  };

  // Load file code from database
  const loadFileCode = (fileName: string) => {
    setIsLoadingCode(true);
    
    // Find the file in allCodes
    const fileCode = allCodes.find(code => 
      code.fileName === fileName || code.title === fileName
    );
    
    if (fileCode) {
      setCurrentFileCode(fileCode.code);
      setCurrentFileName(fileCode.title || fileName);
      setEditedCode(fileCode.code);
    } else {
      // If not found in database, try to get from Prolog
      // This would require a new API endpoint to get file content
      setCurrentFileCode(`% File: ${fileName}\n% Content not available in database\n% Please upload the file to view its code`);
      setCurrentFileName(fileName);
      setEditedCode(`% File: ${fileName}\n% Content not available in database\n% Please upload the file to view its code`);
    }
    
    setIsLoadingCode(false);
  };

  // Handle current_file command response
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.user && lastMessage.text.includes('Active file:')) {
      const match = lastMessage.text.match(/Active file: (.+\.pl)/);
      if (match && match[1]) {
        loadFileCode(match[1]);
      }
    }
  }, [messages]);

  const loadDomain = async (domain: string): Promise<void> => {
    setIsLoadingDomain(true);
    setSelectedDomain(domain);
    setLoadedFiles([]);

    const thinkingMsg: Message = {
      user: false,
      text: `Loading ${domain} domain...`,
      id: "domain-loading-" + Date.now().toString(),
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/select-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          domain,
          userId 
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // Parse files from response
      let fileList: FileInfo[] = [];
      if (data.files && typeof data.files === 'object' && data.files.files) {
        fileList = data.files.files.map((f: string) => ({ name: f, loaded: true }));
      } else if (data.fileList && Array.isArray(data.fileList)) {
        fileList = data.fileList.map((f: string) => ({ name: f, loaded: true }));
      } else if (typeof data.files === 'string') {
        fileList = parseFileList(data.files);
      }

      setLoadedFiles(fileList);

      // Format the message with file list
      const fileListText = fileList.length > 0 
        ? `\n\n📁 **Loaded Files (${fileList.length}):**\n${fileList.map(f => `  • \`${f.name}\``).join('\n')}`
        : '';

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== thinkingMsg.id),
        {
          user: false,
          text: `✅ **${domain} domain ready**${fileListText}\n\nType \`list_files.\` to see files or \`help.\` for commands.`,
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'system'
        }
      ]);

      // Automatically list files after domain load
      setTimeout(() => {
        sendQuery("list_files");
      }, 500);

    } catch (err: any) {
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== thinkingMsg.id),
        {
          user: false,
          text: `❌ **Error loading ${domain} domain:** ${err.message}`,
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'system'
        }
      ]);
      setSelectedDomain(null);
    } finally {
      setIsLoadingDomain(false);
    }
  };

  const sendQuery = async (customQuery?: string): Promise<void> => {
    const finalQuery = customQuery ?? query;
    if (!finalQuery.trim() || isLoading || !selectedDomain) return;

    if (finalQuery.trim() === "clear." || finalQuery.trim() === "clear") {
      setMessages([]);
      setQuery("");
      return;
    }

    if (finalQuery.trim() === "examples.") {
      const examples = [
        "**Examples:**",
        "1. `animal(X).` - Find all animals",
        "2. `mammal(X).` - Find all mammals",
        "3. `country(X).` - Find all countries",
        "4. `capital(Country, Capital).` - Find capitals",
        "5. `help.` - Show help",
        "6. `list_files.` - List loaded files"
      ];
      
      setMessages(prev => [...prev, {
        user: false,
        text: examples.join('\n'),
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'system'
      }]);
      setQuery("");
      return;
    }

    const userMsg: Message = {
      user: true,
      text: finalQuery,
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'query'
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    
    await sendDomainQuery(finalQuery);
  };

  const sendDomainQuery = async (queryText: string): Promise<void> => {
    if (!selectedDomain) return;
    
    setIsLoading(true);

    const thinkingMsg: Message = {
      user: false,
      text: "Thinking",
      id: "thinking-" + Date.now().toString(),
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, thinkingMsg]);

    let dotCount = 1;
    const dotInterval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      const dots = ".".repeat(dotCount);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === thinkingMsg.id ? { 
            ...msg, 
            text: `Thinking${dots}` 
          } : msg
        )
      );
    }, 500);

    try {
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          command: queryText,
          userId 
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      clearInterval(dotInterval);
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMsg.id));
      
      // Check if this is a list_files command to update loaded files
      if (queryText === 'list_files' && data.output) {
        const files = parseFileList(data.output);
        if (files.length > 0) {
          setLoadedFiles(files);
        }
      }
      
      const resultText = data.output || data.error || "✓ Done";
      
      const botMsg: Message = {
        user: false,
        text: resultText,
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'result'
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      clearInterval(dotInterval);
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMsg.id));
      setMessages(prev => [...prev, {
        user: false,
        text: `❌ **Connection error:** ${err.message}`,
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'system'
      }]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const handleNewSession = async (): Promise<void> => {
    await clearSession();
    setMessages([]);
    setSelectedDomain(null);
    setLoadedFiles([]);
    setCurrentFileCode("");
    setCurrentFileName("");
    await initSession();
  };

  const clearChat = (): void => {
    setMessages([]);
  };

  const formatCode = (code: string): string =>
    code
      .split("\n")
      .map(line => {
        if (line.trim().startsWith("%")) return `<span class="text-green-600 dark:text-green-400">${line}</span>`;
        if (line.includes(":-")) return `<span class="text-purple-600 dark:text-purple-400">${line}</span>`;
        if (line.trim().endsWith(".")) return `<span class="text-blue-600 dark:text-blue-400">${line}</span>`;
        if (line.includes("?-")) return `<span class="text-orange-600 dark:text-orange-400">${line}</span>`;
        return line;
      })
      .join("\n");

  const getFilteredCodes = (): PrologCode[] => {
    if (!selectedDomain) return allCodes;
    return allCodes.filter(code => code.domain === selectedDomain);
  };

  // Handle code edit
  const handleEditCode = () => {
    setCodeViewMode("edit");
  };

  const handleSaveCode = () => {
    setCurrentFileCode(editedCode);
    setCodeViewMode("view");
    // Here you would also send the updated code to the server
    // This would require a new API endpoint
  };

  const handleCancelEdit = () => {
    setEditedCode(currentFileCode);
    setCodeViewMode("view");
  };

  // Theme classes - премахнати scrollbar класове
  const themeClasses = {
    light: {
      background: "bg-gray-50",
      text: "text-gray-900",
      sidebar: "bg-white border-gray-200",
      card: "bg-white border-gray-200",
      input: "bg-white border-gray-300",
      hover: "hover:bg-gray-100",
      modal: "bg-white",
      tableRow: "hover:bg-gray-50",
      textSecondary: "text-gray-600",
      textTertiary: "text-gray-500",
      border: "border-gray-200",
      fileItem: "bg-gray-50 hover:bg-gray-100",
      fileLink: "text-blue-600 hover:text-blue-800 hover:underline",
      success: "text-green-600",
      error: "text-red-600",
      codeBg: "bg-gray-50",
      codeBorder: "border-gray-200"
    },
    dark: {
      background: "bg-gray-900",
      text: "text-white",
      sidebar: "bg-gray-800 border-gray-700",
      card: "bg-gray-800 border-gray-700",
      input: "bg-gray-700 border-gray-600",
      hover: "hover:bg-gray-700",
      modal: "bg-gray-800",
      tableRow: "hover:bg-gray-700/50",
      textSecondary: "text-gray-300",
      textTertiary: "text-gray-400",
      border: "border-gray-700",
      fileItem: "bg-gray-700/50 hover:bg-gray-700",
      fileLink: "text-blue-400 hover:text-blue-300 hover:underline",
      success: "text-green-400",
      error: "text-red-400",
      codeBg: "bg-gray-900",
      codeBorder: "border-gray-700"
    }
  };

  const currentTheme = themeClasses[theme];

  // Stats
  const stats = {
    totalQueries: messages.filter(m => m.user).length,
    totalFiles: getFilteredCodes().length,
    systemMessages: messages.filter(m => m.type === 'system').length,
    activeDomain: selectedDomain || "None",
    sessionId: sessionId.substring(0, 8),
    loadedFilesCount: loadedFiles.length
  };

  return (
    <div ref={topRef} className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-20 md:pt-24`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-blue-400" />
              </div>
              <span>Prolog AI Assistant</span>
            </h1>
            <p className={`mt-2 ${currentTheme.textSecondary}`}>
              {t('domain_based_knowledge') || "Multi-user Prolog environment"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Session info */}
            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <Users className="w-4 h-4" />
              <span className="text-sm">{activeSessions} active</span>
            </div>
            <div className={`px-3 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <span className="text-sm">Session: {stats.sessionId}...</span>
            </div>
            <button
              onClick={handleNewSession}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
              title="Start new session"
            >
              <LogOut className="w-4 h-4" /> New Session
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "chat", label: "Chat Assistant", icon: <MessageSquare className="w-5 h-5" /> },
              { id: "code", label: "Code Viewer", icon: <FileCode className="w-5 h-5" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as "chat" | "code")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : theme === 'dark'
                    ? 'bg-white/5 hover:bg-white/10'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Your Queries",
              value: stats.totalQueries,
              icon: <MessageSquare className="w-6 h-6" />,
              color: "from-blue-500 to-cyan-500",
              description: "This session"
            },
            {
              title: "Code Files",
              value: stats.totalFiles,
              icon: <FileCode className="w-6 h-6" />,
              color: "from-green-500 to-emerald-500",
              description: "Available"
            },
            {
              title: "Loaded Files",
              value: stats.loadedFilesCount,
              icon: <FileText className="w-6 h-6" />,
              color: "from-purple-500 to-pink-500",
              description: "In memory"
            },
            {
              title: "Active Domain",
              value: stats.activeDomain,
              icon: <Database className="w-6 h-6" />,
              color: "from-amber-500 to-orange-500",
              description: "Current"
            }
          ].map((stat, idx) => (
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
                  theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                }`}>
                  {stat.description}
                </span>
              </div>
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className={currentTheme.textSecondary}>{stat.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Domains */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Knowledge Domains</h3>
              </div>

              <div className="space-y-3">
                {domains.map(domain => (
                  <motion.button
                    key={domain.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => loadDomain(domain.id)}
                    disabled={isLoadingDomain}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                      selectedDomain === domain.id
                        ? 'ring-2 ring-opacity-50 scale-[1.02]'
                        : `${currentTheme.hover}`
                    } ${currentTheme.border} ${
                      selectedDomain === domain.id ? domain.color : ''
                    }`}
                    style={{
                      borderColor: selectedDomain === domain.id ? domain.color : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-semibold">{domain.label}</div>
                        {selectedDomain === domain.id && (
                          <div className={`text-xs mt-1 ${currentTheme.textTertiary}`}>
                            {stats.loadedFilesCount} files loaded
                          </div>
                        )}
                      </div>
                      {selectedDomain === domain.id && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {selectedDomain && loadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-6 p-4 rounded-xl ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/30' 
                      : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
                  } border`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm">Loaded Files ({loadedFiles.length})</span>
                  </div>
                  {/* FIXED: No scrollbars - just flex wrap */}
                  <div className="flex flex-wrap gap-2">
                    {loadedFiles.map((file, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        className="flex-shrink-0"
                      >
                        <button
                          onClick={() => handleFileClick(file.name)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${currentTheme.fileItem} ${currentTheme.fileLink} transition-colors`}
                          title={`Click to consult ${file.name}`}
                        >
                          <File className="w-3 h-3 flex-shrink-0" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => sendQuery("list_files")}
                      className={`text-xs flex items-center gap-1 ${currentTheme.fileLink}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh file list
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="space-y-6">
                {/* System Commands */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">System Commands</h3>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        Quick commands to interact with the system
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                    {systemCommands.map((cmd, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendQuery(cmd.query)}
                        disabled={isLoading || isLoadingDomain || !selectedDomain}
                        className={`group p-3 rounded-xl text-white flex flex-col items-center gap-2 transition-all duration-300 
                          disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${cmd.gradient} 
                          hover:shadow-lg`}
                        title={cmd.tooltip}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          {cmd.icon}
                        </div>
                        <span className="font-medium text-xs text-center">{cmd.label}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* File Commands */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <FileCode className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="font-bold">File Commands</h4>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={fileNameInput}
                        onChange={e => setFileNameInput(e.target.value)}
                        placeholder="filename.pl"
                        className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                        disabled={isLoading || isLoadingDomain || !selectedDomain}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && fileNameInput.trim()) {
                            handleFileClick(fileNameInput.trim());
                            setFileNameInput("");
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        {fileCommands.map((cmd, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (fileNameInput.trim()) {
                                handleFileClick(fileNameInput.trim());
                                setFileNameInput("");
                              }
                            }}
                            disabled={isLoading || isLoadingDomain || !selectedDomain || !fileNameInput.trim()}
                            className={`px-4 py-3 rounded-xl text-white flex items-center gap-2 bg-gradient-to-r ${cmd.gradient} 
                              hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {cmd.icon}
                            <span className="font-medium text-sm">{cmd.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Chat Messages - добавен max-height и overflow-y-auto само тук */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`rounded-2xl border backdrop-blur-xl overflow-hidden ${currentTheme.card}`}
                >
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold">Chat Assistant</h3>
                      </div>
                      <button
                        onClick={clearChat}
                        className={`px-4 py-2 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-white/5 hover:bg-white/10' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        } transition-colors flex items-center gap-2`}
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Chat
                      </button>
                    </div>
                  </div>

                  {/* Контейнер за съобщенията - само той има скрол */}
                  <div 
                    ref={messagesContainerRef}
                    className="h-[500px] overflow-y-auto p-6"
                  >
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                          <MessageSquare className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Start a Conversation</h3>
                        <p className={`mb-6 ${currentTheme.textSecondary}`}>
                          Select a domain and enter Prolog queries to interact with the knowledge base
                        </p>
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                          {systemCommands.slice(0, 4).map((cmd, idx) => (
                            <button
                              key={idx}
                              onClick={() => sendQuery(cmd.query)}
                              disabled={isLoading || isLoadingDomain || !selectedDomain}
                              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                                theme === 'dark' 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              } disabled:opacity-50`}
                            >
                              {cmd.icon}
                              {cmd.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(msg => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.user ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${msg.user ? 'ml-auto' : ''}`}>
                              <div className={`rounded-2xl p-4 ${
                                msg.user
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                  : theme === 'dark' 
                                    ? 'bg-gray-800/50 border border-gray-700'
                                    : 'bg-gray-50 border border-gray-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {msg.user ? (
                                    <UserIcon className="w-4 h-4" />
                                  ) : msg.type === 'system' ? (
                                    <Terminal className="w-4 h-4" />
                                  ) : msg.type === 'file_list' ? (
                                    <FileText className="w-4 h-4" />
                                  ) : (
                                    <Brain className="w-4 h-4" />
                                  )}
                                  <span className="text-xs font-medium opacity-80">
                                    {msg.user ? 'You' : 
                                     msg.type === 'system' ? 'System' : 
                                     msg.type === 'file_list' ? 'Files' : 'Assistant'}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap text-sm font-mono">
                                  {msg.text.split("\n").map((line, i) => {
                                    // Check if line contains a filename that should be clickable
                                    const fileMatch = line.match(/`([a-zA-Z0-9_-]+\.pl)`/);
                                    if (fileMatch) {
                                      const parts = line.split('`');
                                      return (
                                        <div key={i} className={line.startsWith('  •') ? 'ml-4' : ''}>
                                          {parts.map((part, j) => {
                                            if (j % 2 === 1) { // This is the filename
                                              return (
                                                <button
                                                  key={j}
                                                  onClick={() => handleFileClick(part)}
                                                  className={`${currentTheme.fileLink} font-bold`}
                                                >
                                                  {part}
                                                </button>
                                              );
                                            }
                                            return <span key={j}>{part}</span>;
                                          })}
                                        </div>
                                      );
                                    }
                                    return <div key={i} className={line.startsWith('  •') ? 'ml-4' : ''}>{line}</div>;
                                  })}
                                </div>
                                <div className={`text-xs mt-2 ${
                                  msg.user ? 'text-blue-200' : currentTheme.textTertiary
                                }`}>
                                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                          isLoadingDomain ? "Loading domain..." :
                          !selectedDomain ? "Select a domain first..." :
                          `Enter Prolog query (${selectedDomain})...`
                        }
                        className={`w-full px-5 py-3 pr-14 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                        disabled={isLoading || isLoadingDomain || !selectedDomain}
                      />
                      <button
                        onClick={() => sendQuery()}
                        disabled={isLoading || isLoadingDomain || !query.trim() || !selectedDomain}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                          isLoading || isLoadingDomain || !query.trim() || !selectedDomain
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg text-white'
                        }`}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-medium">Send</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className={`text-xs mt-2 flex items-center gap-2 ${currentTheme.textTertiary}`}>
                      <div className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        <span>Press Enter to send</span>
                      </div>
                      {selectedDomain && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            <span>Connected to: <span className="font-bold">{selectedDomain}</span></span>
                          </div>
                        </>
                      )}
                      {loadedFiles.length > 0 && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => sendQuery("list_files")}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{loadedFiles.length} files loaded</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Code Viewer Tab */}
            {activeTab === "code" && (
              <div className="space-y-6">
                {/* Code Viewer Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {currentFileName || "No File Selected"}
                        </h3>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>
                          {currentFileName ? "Current consulted file" : "Click on a file to view its code"}
                        </p>
                      </div>
                    </div>
                    
                    {currentFileName && (
                      <div className="flex gap-2">
                        {codeViewMode === "view" ? (
                          <>
                            <button
                              onClick={handleEditCode}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                theme === 'dark' 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              } transition-colors`}
                              title="Edit code"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => navigator.clipboard.writeText(currentFileCode)}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                theme === 'dark' 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              } transition-colors`}
                              title="Copy code"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={handleSaveCode}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 bg-green-500 text-white hover:bg-green-600 transition-colors`}
                              title="Save changes"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                theme === 'dark' 
                                  ? 'bg-white/5 hover:bg-white/10' 
                                  : 'bg-gray-100 hover:bg-gray-200'
                              } transition-colors`}
                              title="Cancel edit"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Info Bar */}
                  {currentFileName && (
                    <div className={`flex items-center gap-4 text-sm ${currentTheme.textSecondary} p-3 rounded-lg ${currentTheme.fileItem}`}>
                      <div className="flex items-center gap-1">
                        <File className="w-4 h-4" />
                        <span>{currentFileName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="w-4 h-4" />
                        <span>{selectedDomain}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CodeIcon className="w-4 h-4" />
                        <span>{(currentFileCode.match(/\n/g) || '').length + 1} lines</span>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Code Display - без скрол */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`rounded-2xl border backdrop-blur-xl overflow-hidden ${currentTheme.card}`}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CodeIcon className="w-4 h-4" />
                      <span className="font-medium">Source Code</span>
                    </div>
                    {currentFileName && (
                      <button
                        onClick={() => sendQuery(`consult_file('${currentFileName}')`)}
                        className={`text-xs flex items-center gap-1 px-3 py-1 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        } transition-colors`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reconsult
                      </button>
                    )}
                  </div>

                  <div 
                    ref={codeViewerRef}
                    className="p-4"
                  >
                    {isLoadingCode ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
                          <p className={currentTheme.textSecondary}>Loading code...</p>
                        </div>
                      </div>
                    ) : !currentFileName ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12">
                        <FileCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No File Selected</h3>
                        <p className={`mb-6 ${currentTheme.textSecondary}`}>
                          Click on a file from the sidebar or use `consult_file/1` to view its code
                        </p>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Go to Chat
                        </button>
                      </div>
                    ) : codeViewMode === "view" ? (
                      <pre className="font-mono text-sm leading-relaxed overflow-visible">
                        <code dangerouslySetInnerHTML={{ 
                          __html: formatCode(currentFileCode)
                        }} />
                      </pre>
                    ) : (
                      <textarea
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value)}
                        className={`w-full h-full min-h-[400px] font-mono text-sm p-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                          theme === 'dark' 
                            ? 'bg-gray-900 border-gray-700 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                        spellCheck={false}
                      />
                    )}
                  </div>

                  {/* Line count and info footer */}
                  {currentFileName && codeViewMode === "view" && (
                    <div className={`p-3 border-t ${currentTheme.border} text-xs ${currentTheme.textTertiary} flex items-center justify-between`}>
                      <div className="flex items-center gap-4">
                        <span>Lines: {(currentFileCode.match(/\n/g) || '').length + 1}</span>
                        <span>Characters: {currentFileCode.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        <span>Read-only mode</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
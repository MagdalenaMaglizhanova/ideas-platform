import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion} from "framer-motion";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { supabase } from "../services/supabase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

// Icons import
import {
  MessageSquare,
  Code as CodeIcon,
  FileCode,
  UploadCloud,
  Download,
  Copy,
  X,
  CheckCircle,
  Database,
  Globe,
  RefreshCw,
  Play,
  Terminal,
  Brain,
  HelpCircle,
  Bell,
  User as UserIcon,
  ExternalLink,
  Trash2,
  List
} from "lucide-react";

interface Message {
  user: boolean;
  text: string;
  id: string;
  timestamp: Date;
  type?: 'system' | 'query' | 'result';
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

export default function PrologChat() {
  const { codeId } = useParams<{ codeId?: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allCodes, setAllCodes] = useState<PrologCode[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "code">("chat");
  const [fileNameInput, setFileNameInput] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [_uploadFolder, setUploadFolder] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  console.log(language)
  const topRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  // Domains configuration with improved styling
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

  // System commands with improved styling
  const systemCommands = [
    { 
      label: t('help') || 'Help', 
      query: "help", 
      icon: <HelpCircle className="w-4 h-4" />,
      color: "#4A90E2",
      gradient: "from-blue-500 to-cyan-500",
      tooltip: t('help_tooltip') || 'Show help information'
    },
    { 
      label: t('load_all') || 'Load All', 
      query: "load_all", 
      icon: <Download className="w-4 h-4" />,
      color: "#50C878",
      gradient: "from-emerald-500 to-green-500",
      tooltip: t('load_all_tooltip') || 'Load all Prolog files'
    },
    { 
      label: t('list_files') || 'List Files', 
      query: "list_files", 
      icon: <List className="w-4 h-4" />,
      color: "#FF6B8B",
      gradient: "from-rose-500 to-pink-500",
      tooltip: t('list_files_tooltip') || 'List all loaded files'
    },
    { 
      label: t('clear_facts') || 'Clear Facts', 
      query: "clear_all_facts", 
      icon: <Trash2 className="w-4 h-4" />,
      color: "#FF4757",
      gradient: "from-red-500 to-rose-500",
      tooltip: t('clear_facts_tooltip') || 'Clear all loaded facts'
    },
    { 
      label: t('current_file') || 'Current File', 
      query: "current_file", 
      icon: <FileCode className="w-4 h-4" />,
      color: "#9D4EDD",
      gradient: "from-purple-500 to-violet-500",
      tooltip: t('current_file_tooltip') || 'Show current active file'
    },
    { 
      label: t('list_predicates') || 'List Predicates', 
      query: "list_predicates", 
      icon: <CodeIcon className="w-4 h-4" />,
      color: "#36D1DC",
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
      color: "#4A90E2",
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      label: t('reconsult_file') || 'Reconsult File', 
      query: `reconsult_file('${fileNameInput}')`, 
      icon: <RefreshCw className="w-4 h-4" />,
      color: "#9D4EDD",
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

  const loadDomain = async (domain: string) => {
    setIsLoadingDomain(true);
    setSelectedDomain(domain);

    const thinkingMsg: Message = {
      user: false,
      text: t('loading_domain') ? `${t('loading_domain')} ${domain}...` : `Loading ${domain} domain...`,
      id: "domain-loading-" + Date.now().toString(),
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/select-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== thinkingMsg.id),
        {
          user: false,
          text: data.message || `✅ ${domain} domain loaded successfully. Ready for queries.`,
          id: Date.now().toString(),
          timestamp: new Date(),
          type: 'system'
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== thinkingMsg.id),
        {
          user: false,
          text: `❌ Error loading ${domain} domain: ${err.message}`,
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

  const sendQuery = async (customQuery?: string) => {
    const finalQuery = customQuery ?? query;
    if (!finalQuery.trim() || isLoading || !selectedDomain) return;

    if (finalQuery.trim() === "clear." || finalQuery.trim() === "clear") {
      setMessages([]);
      setQuery("");
      return;
    }

    if (finalQuery.trim() === "examples.") {
      const examples = [
        "Examples:",
        "1. animal(X).",
        "2. mammal(X).",
        "3. country(X).",
        "4. capital(Country, Capital).",
        "5. help.",
        "6. list_files."
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

  const sendDomainQuery = async (queryText: string) => {
    if (!selectedDomain) return;
    
    setIsLoading(true);

    const thinkingMsg: Message = {
      user: false,
      text: t('thinking') || "Thinking",
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
            text: `${t('thinking') || 'Thinking'}${dots}` 
          } : msg
        )
      );
    }, 500);

    try {
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: queryText })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      clearInterval(dotInterval);
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMsg.id));
      
      const resultText = data.output || data.error || data.message || "No response from server";
      
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
        text: `❌ Connection error: ${err.message}`,
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'system'
      }]);
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedDomain(null);
  };

  const formatCode = (code: string) =>
    code
      .split("\n")
      .map(line => {
        if (line.trim().startsWith("%")) return `<span class="text-green-600">${line}</span>`;
        if (line.includes(":-")) return `<span class="text-purple-600">${line}</span>`;
        if (line.trim().endsWith(".")) return `<span class="text-blue-600">${line}</span>`;
        if (line.includes("?-")) return `<span class="text-orange-600">${line}</span>`;
        return line;
      })
      .join("\n");

  const getFilteredCodes = () => {
    if (!selectedDomain) return allCodes;
    return allCodes.filter(code => code.domain === selectedDomain);
  };

  // File upload handlers
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
      setUploadFile(droppedFile);
    } else {
      setUploadStatus("❌ Only .pl files allowed");
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !user || !selectedDomain) {
      setUploadStatus("❌ No file selected, user not logged in, or domain not selected");
      return;
    }

    if (!uploadFile.name.toLowerCase().endsWith('.pl')) {
      setUploadStatus("❌ Only .pl files allowed");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading file...");

    try {
      const username = user.email ? user.email.split('@')[0] : 'anonymous';
      const originalName = uploadFile.name;
      const fileNameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
      
      const safeFileName = fileNameWithoutExt
        .replace(/[^a-zA-Z0-9а-яА-Я\s\-_]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .substring(0, 50);
        
      const shortTimestamp = Date.now().toString().slice(-4);
      const randomId = Math.random().toString(36).substring(2, 6);
      
      let finalFileName = `${username}_${safeFileName}_${shortTimestamp}${randomId}.pl`;
      const path = `${selectedDomain}/${finalFileName}`;

      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from("prolog-files")
        .upload(path, uploadFile, { 
          upsert: false,
          cacheControl: '3600',
          contentType: uploadFile.type || 'text/plain'
        });

      if (uploadError) {
        if (uploadError.message.includes('already exists')) {
          const newRandomId = Math.random().toString(36).substring(2, 8);
          const newFinalFileName = `${username}_${safeFileName}_${shortTimestamp}${newRandomId}.pl`;
          const newPath = `${selectedDomain}/${newFinalFileName}`;
          
          const { error: retryError } = await supabase.storage
            .from("prolog-files")
            .upload(newPath, uploadFile, { 
              upsert: false,
              cacheControl: '3600'
            });
            
          if (retryError) {
            throw new Error(retryError.message);
          }
          
          finalFileName = newFinalFileName;
        } else {
          throw new Error(uploadError.message);
        }
      }

      const fileText = await uploadFile.text();

      await addDoc(collection(db, "prologCodes"), {
        userId: user.uid,
        username: username,
        title: originalName,
        storedFileName: finalFileName,
        originalFileName: originalName,
        displayName: `${username}/${originalName}`,
        code: fileText,
        fileName: finalFileName,
        filePath: path,
        folder: selectedDomain,
        domain: selectedDomain,
        fileSize: uploadFile.size,
        uploadFormat: "username_original_id.pl",
        timestamp: shortTimestamp,
        randomId: randomId,
        status: "success",
        createdAt: serverTimestamp()
      });

      const newCode: PrologCode = {
        id: Date.now().toString(),
        code: fileText,
        title: originalName,
        domain: selectedDomain,
        fileName: finalFileName,
        filePath: path,
        folder: selectedDomain
      };
      
      setAllCodes(prev => [newCode, ...prev]);
      setUploadStatus(`✅ File "${originalName}" uploaded to ${selectedDomain} domain`);
      setUploadFile(null);
      
      const fileInput = document.getElementById('fileUploadInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      setUploadStatus(`❌ Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Theme classes similar to StudentsDashboard
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
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
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
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
    }
  };

  const currentTheme = themeClasses[theme];

  // Stats for dashboard
  const stats = {
    totalQueries: messages.filter(m => m.user).length,
    totalFiles: getFilteredCodes().length,
    systemMessages: messages.filter(m => m.type === 'system').length,
    activeDomain: selectedDomain || "None"
  };

  return (
    <div ref={topRef} className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-20 md:pt-24`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              {t('domain_based_knowledge') || "Domain-based knowledge interaction system"}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (activeTab === "chat") {
                  setMessages([]);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
            }`}>
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "chat", label: "Chat Assistant", icon: <MessageSquare className="w-5 h-5" /> },
              { id: "code", label: "Code Files", icon: <FileCode className="w-5 h-5" /> },
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
              title: "Total Queries",
              value: stats.totalQueries,
              icon: <MessageSquare className="w-6 h-6" />,
              color: "from-blue-500 to-cyan-500",
              description: "Queries sent"
            },
            {
              title: "Code Files",
              value: stats.totalFiles,
              icon: <FileCode className="w-6 h-6" />,
              color: "from-green-500 to-emerald-500",
              description: "Available files"
            },
            {
              title: "System Messages",
              value: stats.systemMessages,
              icon: <Terminal className="w-6 h-6" />,
              color: "from-purple-500 to-pink-500",
              description: "System interactions"
            },
            {
              title: "Active Domain",
              value: stats.activeDomain,
              icon: <Database className="w-6 h-6" />,
              color: "from-amber-500 to-orange-500",
              description: "Current domain"
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
                        
                      </div>
                      {selectedDomain === domain.id && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {selectedDomain && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-6 p-4 rounded-xl ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-800/30' 
                      : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
                  } border`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm">Active Domain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    
                    <span className="font-bold text-sm capitalize">{selectedDomain}</span>
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
                            sendQuery(`consult_file('${fileNameInput.trim()}')`);
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
                                sendQuery(cmd.query);
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

                {/* Chat Messages */}
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

                  <div 
                    ref={messagesContainerRef}
                    className={`h-[400px] overflow-y-auto p-6 ${currentTheme.scrollbar}`}
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
                                  ) : (
                                    <Brain className="w-4 h-4" />
                                  )}
                                  <span className="text-xs font-medium opacity-80">
                                    {msg.user ? 'You' : msg.type === 'system' ? 'System' : 'Assistant'}
                                  </span>
                                </div>
                                <div className="whitespace-pre-wrap text-sm">
                                  {msg.text.split("\n").map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))}
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
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Code Tab */}
            {activeTab === "code" && (
              <div className="space-y-6">
                {/* Upload Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Upload Prolog Files</h3>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        Upload .pl files to the selected domain
                      </p>
                    </div>
                  </div>

                  <div 
                    className={`rounded-xl p-8 border-2 border-dashed text-center transition-colors ${
                      isDragging 
                        ? 'border-green-500 bg-green-500/5' 
                        : currentTheme.border
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${
                      theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <p className="text-lg mb-2">Drag & drop your .pl file here</p>
                    <p className={`mb-4 ${currentTheme.textTertiary}`}>or</p>
                    
                    <input
                      id="fileUploadInput"
                      type="file"
                      accept=".pl"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="fileUploadInput"
                      className={`inline-block px-6 py-3 rounded-lg cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-white/5 hover:bg-white/10' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      Browse Files
                    </label>
                    
                    {uploadFile && (
                      <div className={`mt-4 p-4 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-700/50' 
                          : 'bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileCode className="text-green-500" />
                            <div>
                              <div className="font-medium">{uploadFile.name}</div>
                              <div className={`text-sm ${currentTheme.textTertiary}`}>
                                {(uploadFile.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setUploadFile(null)}
                            className={`p-2 rounded-lg ${
                              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <button
                        onClick={handleFileUpload}
                        disabled={!uploadFile || isUploading || !selectedDomain}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto ${
                          !uploadFile || isUploading || !selectedDomain
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg text-white'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            Upload to {selectedDomain || "Domain"}
                          </>
                        )}
                      </button>
                    </div>
                    
                    {uploadStatus && (
                      <div className={`mt-4 p-3 rounded-lg text-sm ${
                        uploadStatus.includes('✅') 
                          ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                          : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
                      }`}>
                        {uploadStatus}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Code Files Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`rounded-2xl border backdrop-blur-xl overflow-hidden ${currentTheme.card}`}
                >
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <FileCode className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Code Files</h3>
                          <p className={`text-sm ${currentTheme.textSecondary}`}>
                            {selectedDomain 
                              ? `Files in ${selectedDomain} domain` 
                              : "Select a domain to view files"}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg ${
                        theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                      }`}>
                        <span className="text-sm font-medium">
                          {getFilteredCodes().length} files
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 ${currentTheme.scrollbar}`}>
                    {!selectedDomain ? (
                      <div className="text-center py-12">
                        <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Domain Selected</h3>
                        <p className={`mb-6 ${currentTheme.textSecondary}`}>
                          Select a domain from the sidebar to view its code files
                        </p>
                      </div>
                    ) : getFilteredCodes().length === 0 ? (
                      <div className="text-center py-12">
                        <FileCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Files Found</h3>
                        <p className={`mb-6 ${currentTheme.textSecondary}`}>
                          Upload files to the {selectedDomain} domain to see them here
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getFilteredCodes().map(code => (
                          <motion.div
                            key={code.id}
                            whileHover={{ scale: 1.02 }}
                            className={`rounded-xl p-4 border ${
                              theme === 'dark' 
                                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50' 
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } transition-colors`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                  <FileCode className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                  <h4 className="font-bold mb-1">{code.title || code.id}</h4>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className={`px-2 py-1 rounded ${
                                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                      {code.domain || 'general'}
                                    </span>
                                    {code.fileName && (
                                      <span className={`px-2 py-1 rounded ${
                                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                      }`}>
                                        {code.fileName.length > 20 ? code.fileName.substring(0, 20) + '...' : code.fileName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => navigator.clipboard.writeText(code.code)}
                                className={`p-2 rounded-lg ${
                                  theme === 'dark' 
                                    ? 'hover:bg-white/10' 
                                    : 'hover:bg-gray-200'
                                }`}
                                title="Copy code"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className={`rounded-lg p-3 mb-3 ${
                              theme === 'dark' 
                                ? 'bg-gray-900/50' 
                                : 'bg-gray-100'
                            }`}>
                              <pre className={`text-sm font-mono overflow-x-auto ${currentTheme.scrollbar}`}>
                                <code dangerouslySetInnerHTML={{ 
                                  __html: formatCode(code.code.substring(0, 150) + (code.code.length > 150 ? '...' : ''))
                                }} />
                              </pre>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const fullCodeWindow = window.open('', '_blank');
                                  if (fullCodeWindow) {
                                    fullCodeWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>${code.title || code.id} - Prolog Code</title>
                                          <style>
                                            body { 
                                              font-family: monospace; 
                                              padding: 20px; 
                                              background: ${theme === 'dark' ? '#1a1a1a' : '#f5f5f5'}; 
                                              color: ${theme === 'dark' ? '#e0e0e0' : '#333'};
                                            }
                                            pre { 
                                              background: ${theme === 'dark' ? '#2d2d2d' : 'white'}; 
                                              padding: 20px; 
                                              border-radius: 5px; 
                                              overflow-x: auto;
                                            }
                                          </style>
                                        </head>
                                        <body>
                                          <h2>${code.title || code.id}</h2>
                                          <pre>${code.code}</pre>
                                        </body>
                                      </html>
                                    `);
                                  }
                                }}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                                  theme === 'dark' 
                                    ? 'bg-white/5 hover:bg-white/10' 
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Full Code
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
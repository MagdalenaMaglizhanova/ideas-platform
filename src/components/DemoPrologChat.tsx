import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../services/supabase";
import { useTheme } from "../context/ThemeContext";

interface Message {
  user: boolean;
  text: string;
  id: string;
  timestamp: Date;
  type?: 'system' | 'query' | 'result' | 'demo' | 'info';
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

// Demo commands - modernized version
const demoCommands = [
  { 
    label: "Start Demo", 
    query: "start",
    icon: "fas fa-rocket",
    gradient: "from-purple-500 to-pink-500",
    badge: "primary"
  },
  { 
    label: "Platform Info", 
    query: "platform_info(_, _)",
    icon: "fas fa-info-circle",
    gradient: "from-blue-500 to-cyan-500",
    badge: "info"
  },
  { 
    label: "Run Test", 
    query: "test_query",
    icon: "fas fa-vial",
    gradient: "from-emerald-500 to-teal-500",
    badge: "success"
  },
  { 
    label: "List Topics", 
    query: "list_educational_topics",
    icon: "fas fa-book-open",
    gradient: "from-orange-500 to-amber-500",
    badge: "warning"
  },
  { 
    label: "Clear Chat", 
    query: "clear",
    icon: "fas fa-broom",
    gradient: "from-gray-500 to-slate-600",
    badge: "secondary"
  }
];

// Platform stats
const platformStats = [
  { label: "API Status", value: "Connected", icon: "fas fa-plug", color: "text-green-500" },
  { label: "Storage", value: "Active", icon: "fas fa-database", color: "text-blue-500" },
  { label: "Response Time", value: "< 1s", icon: "fas fa-bolt", color: "text-yellow-500" },
  { label: "Test Files", value: "0 files", icon: "fas fa-file-code", color: "text-purple-500" }
];

export default function EnhancedPrologChat() {
  const { theme } = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      user: false,
      text: `# Welcome to Prolog AI Assistant\n\n**Interactive Prolog Environment** with real-time query execution\n\n### 📋 Available Commands:\n• **start** - Initialize the demo environment\n• **platform_info** - Show system details\n• **test_query** - Execute a test query\n• **demo_menu** - Interactive demo menu\n\n### 🔗 Connected Services:\n- Prolog API Server\n- Supabase Storage\n- Real-time Database`,
      id: "welcome-" + Date.now(),
      timestamp: new Date(),
      type: 'demo'
    }
  ]);
  
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "info">("chat");
  const [testFiles, setTestFiles] = useState<PrologCode[]>([]);
  const [_isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [stats, setStats] = useState(platformStats);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  // Load test files
  useEffect(() => {
    loadTestFiles();
  }, []);

  const loadTestFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('prolog_codes')
        .select('*')
        .eq('domain', 'test')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const codes: PrologCode[] = data.map(item => ({
          id: item.id.toString(),
          code: item.code || "",
          title: item.title,
          domain: item.domain || "test",
          fileName: item.file_name,
          filePath: item.file_path,
          folder: item.folder || "test"
        }));
        
        setTestFiles(codes);
        updateStats("Test Files", `${codes.length} files`);
        if (codes.length > 0) {
          addSystemMessage(`📁 Loaded ${codes.length} test file(s) from database`);
        }
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const updateStats = (label: string, value: string) => {
    setStats(prev => prev.map(stat => 
      stat.label === label ? { ...stat, value } : stat
    ));
  };

  const addSystemMessage = (text: string) => {
    const msg: Message = {
      user: false,
      text,
      id: "system-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, msg]);
  };

  const sendQuery = async (customQuery?: string) => {
    const finalQuery = customQuery ?? query;
    if (!finalQuery.trim() || isLoading) return;

    if (finalQuery.trim() === "clear" || finalQuery.trim() === "clear.") {
      setMessages([{
        user: false,
        text: `# Welcome to Prolog AI Assistant\n\n**Interactive Prolog Environment** with real-time query execution\n\n### 📋 Available Commands:\n• **start** - Initialize the demo environment\n• **platform_info** - Show system details\n• **test_query** - Execute a test query\n• **demo_menu** - Interactive demo menu\n\n### 🔗 Connected Services:\n- Prolog API Server\n- Supabase Storage\n- Real-time Database`,
        id: "welcome-" + Date.now(),
        timestamp: new Date(),
        type: 'demo'
      }]);
      setQuery("");
      return;
    }

    const userMsg: Message = {
      user: true,
      text: finalQuery,
      id: "user-" + Date.now(),
      timestamp: new Date(),
      type: 'query'
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    
    await sendToPrologAPI(finalQuery);
  };

  const sendToPrologAPI = async (queryText: string) => {
    setIsLoading(true);
    addSystemMessage("🔄 Processing your query...");

    try {
      const queryToSend = queryText.endsWith('.') ? queryText : queryText + '.';
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: queryToSend, domain: "test" })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const resultText = data.output || data.error || data.message || "No response from server";
      
      const botMsg: Message = {
        user: false,
        text: resultText,
        id: "result-" + Date.now(),
        timestamp: new Date(),
        type: 'result'
      };
      setMessages(prev => [...prev.filter(m => !m.text.includes("🔄")), botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        user: false,
        text: `❌ **Connection Error**\n\n${err.message}\n\nUsing demonstration mode...`,
        id: "error-" + Date.now(),
        timestamp: new Date(),
        type: 'system'
      };
      setMessages(prev => [...prev.filter(m => !m.text.includes("🔄")), errorMsg]);
      
      // Fallback mock response
      setTimeout(() => {
        const mockResponse = getMockResponse(queryText);
        const mockMsg: Message = {
          user: false,
          text: mockResponse,
          id: "mock-" + Date.now(),
          timestamp: new Date(),
          type: 'result'
        };
        setMessages(prev => [...prev, mockMsg]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockResponse = (queryText: string): string => {
    const cleanQuery = queryText.toLowerCase().replace('.', '');
    
    if (cleanQuery.includes("start")) {
      return `# 🎯 Demo Mode Activated\n\n## System Status:\n✓ **Prolog API**: Connected\n✓ **Supabase**: Active\n✓ **Database**: Synced\n✓ **Files**: ${testFiles.length} loaded\n\n## Next Steps:\n1. Try \`demo_menu\` for interactive options\n2. Use \`test_query\` for functionality test\n3. Type \`platform_info\` for system details`;
    }
    
    if (cleanQuery.includes("demo_menu")) {
      return `# 📱 Interactive Menu\n\n## Select an option:\n\n### 1️⃣ Platform Information\n   Detailed system specs and status\n\n### 2️⃣ Test Queries\n   Execute sample Prolog queries\n\n### 3️⃣ File Management\n   View and manage test files\n\n### 4️⃣ API Testing\n   Test Prolog API connections\n\n### 5️⃣ Knowledge Base\n   Explore loaded Prolog facts\n\nType the number (1-5) to continue:`;
    }
    
    return `# 📊 Query Result\n\n**Query:** \`${queryText}\`\n\n**Status:** ✅ Processed\n\n**Response from Prolog API:**\nThis is a demonstration response. In production, this would contain actual Prolog query results from the knowledge base.\n\n**Execution time:** < 1ms\n**Database:** test domain`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  // Theme configuration
  const themeClasses = {
    light: {
      background: "bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30",
      card: "bg-white/90 backdrop-blur-sm border border-gray-200/80 shadow-lg",
      input: "bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      textTertiary: "text-gray-500",
      hover: "hover:bg-gray-100/90 hover:shadow-md transition-all duration-200",
      border: "border-gray-200",
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100/50"
    },
    dark: {
      background: "bg-gradient-to-br from-gray-900 via-blue-950/30 to-purple-950/30",
      card: "bg-gray-800/90 backdrop-blur-sm border border-gray-700/80 shadow-xl",
      input: "bg-gray-700 border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
      text: "text-gray-100",
      textSecondary: "text-gray-300",
      textTertiary: "text-gray-400",
      hover: "hover:bg-gray-700/90 hover:shadow-lg transition-all duration-200",
      border: "border-gray-700",
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50"
    }
  };

  const currentTheme = themeClasses[theme];

  // Format message text with markdown-like syntax
  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-4 mb-2 text-blue-500 dark:text-blue-400">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-3 mb-2 dark:text-gray-100">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mt-2 mb-1 dark:text-gray-200">{line.substring(4)}</h3>;
      }
      if (line.includes('✓')) {
        return (
          <div key={i} className="flex items-center my-1">
            <span className="text-green-500 mr-2">✓</span>
            <span className="dark:text-gray-300">{line.replace('✓', '')}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={i} className="flex items-start my-1 ml-2">
            <span className="text-blue-500 dark:text-blue-400 mr-2 mt-1">•</span>
            <span className="dark:text-gray-300">{line.substring(2)}</span>
          </div>
        );
      }
      if (line.includes('`')) {
        const parts = line.split('`');
        return (
          <div key={i} className="my-1 dark:text-gray-300">
            {parts.map((part, idx) => 
              idx % 2 === 0 ? part : (
                <code key={idx} className={`px-1.5 py-0.5 rounded font-mono text-sm ${
                  theme === 'dark' ? 'bg-gray-700 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  {part}
                </code>
              )
            )}
          </div>
        );
      }
      return <div key={i} className="my-1 dark:text-gray-300">{line}</div>;
    });
  };

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} transition-colors duration-300 pt-16 md:pt-20`}>
      {/* Main Container */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 mb-6 ${currentTheme.card} border`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Prolog AI Assistant
                </h1>
                <p className={`${currentTheme.textSecondary} mt-1`}>
                  Interactive Prolog environment with real-time execution
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-3 rounded-xl border ${currentTheme.card}`}
                >
                  <div className="flex items-center gap-2">
                    <i className={`${stat.icon} ${stat.color}`}></i>
                    <div className="text-xs font-medium dark:text-gray-300">{stat.label}</div>
                  </div>
                  <div className="text-lg font-bold mt-1 dark:text-gray-100">{stat.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Chat */}
          <div className="lg:w-2/3 flex flex-col">
            
            {/* Tab Navigation - Само Chat и Info */}
            <div className="flex mb-6">
              {[
                { id: "chat", label: "Chat Assistant", icon: "fas fa-comment-dots" },
                { id: "info", label: "Platform Info", icon: "fas fa-info-circle" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex-1 px-6 py-4 flex items-center justify-center gap-3 transition-all duration-300 ${
                    activeTab === tab.id
                      ? `text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-purple-500`
                      : `${currentTheme.textSecondary} ${currentTheme.hover}`
                  } ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10' : ''}`}
                >
                  <i className={`${tab.icon} ${activeTab === tab.id ? 'text-blue-400' : ''}`}></i>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1"
              >
                
                {/* Chat Tab */}
                {activeTab === "chat" && (
                  <div className={`rounded-2xl ${currentTheme.card} border overflow-hidden flex flex-col h-[600px]`}>
                    
                    {/* Quick Commands */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        {demoCommands.map((cmd, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => sendQuery(cmd.query)}
                            disabled={isLoading}
                            className={`group relative px-4 py-2.5 rounded-xl text-white flex items-center gap-2 
                              disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${cmd.gradient} 
                              hover:shadow-lg transition-all duration-300 overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></div>
                            <i className={`${cmd.icon} relative z-10`}></i>
                            <span className="font-medium text-sm relative z-10">{cmd.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Messages Container */}
                    <div 
                      ref={messagesContainerRef}
                      className={`flex-1 overflow-y-auto p-4 ${currentTheme.scrollbar}`}
                    >
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.user ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] ${msg.user ? 'ml-auto' : ''}`}>
                              <div className={`flex gap-3 ${msg.user ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  msg.user 
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                                    : msg.type === 'system' 
                                    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                                    : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                                }`}>
                                  <i className={`fas fa-${
                                    msg.user ? 'user' : 
                                    msg.type === 'system' ? 'cog' : 
                                    'robot'
                                  } text-white text-sm`}></i>
                                </div>

                                {/* Message Bubble */}
                                <div className={`rounded-2xl p-4 ${
                                  msg.user
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                    : msg.type === 'demo'
                                    ? theme === 'dark' 
                                      ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-800/50' 
                                      : 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200'
                                    : msg.type === 'system'
                                    ? theme === 'dark' 
                                      ? 'bg-gray-800/50 border border-gray-700' 
                                      : 'bg-gray-100 border border-gray-300'
                                    : theme === 'dark' 
                                      ? 'bg-blue-900/20 border border-blue-800/30' 
                                      : 'bg-blue-50 border border-blue-200'
                                }`}>
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    {formatMessage(msg.text)}
                                  </div>
                                  <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
                                    msg.user ? 'border-blue-400/30' : theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                                  }`}>
                                    <span className="text-xs opacity-75 dark:text-gray-400">
                                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {!msg.user && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                                        msg.type === 'demo' 
                                          ? 'bg-blue-500/20 text-blue-400' 
                                          : msg.type === 'system'
                                          ? 'bg-gray-500/20 text-gray-400'
                                          : 'bg-green-500/20 text-green-400'
                                      }`}>
                                        {msg.type === 'demo' ? 'DEMO' : msg.type === 'system' ? 'SYSTEM' : 'ASSISTANT'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <input
                          type="text"
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Enter Prolog query (e.g., start, demo_menu, platform_info)..."
                          className={`w-full px-5 py-3 pr-14 rounded-xl ${currentTheme.input} focus:outline-none transition-all duration-300`}
                          disabled={isLoading}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendQuery()}
                          disabled={isLoading || !query.trim()}
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2.5 rounded-xl 
                            flex items-center gap-2 transition-all duration-300 ${
                            isLoading || !query.trim()
                              ? 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg text-white'
                          }`}
                        >
                          {isLoading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane"></i>
                              <span className="font-medium">Send</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className={`text-xs flex items-center gap-2 ${currentTheme.textTertiary}`}>
                          <i className="fas fa-lightbulb"></i>
                          <span>Press Enter to send • Connected to Prolog API</span>
                        </div>
                        <div className={`text-xs ${currentTheme.textTertiary}`}>
                          {messages.filter(m => m.user).length} queries
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Tab */}
                {activeTab === "info" && (
                  <div className={`rounded-2xl ${currentTheme.card} border p-6`}>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 dark:text-gray-100">
                      <i className="fas fa-info-circle text-blue-500"></i>
                      Platform Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-bold mb-3 dark:text-gray-200">System Architecture</h3>
                        <div className="space-y-3">
                          <div className={`p-3 rounded-lg border ${currentTheme.border}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-server text-green-500"></i>
                              <span className="font-semibold dark:text-gray-300">Prolog API Server</span>
                            </div>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>
                              Real-time Prolog query execution with REST API
                            </p>
                          </div>
                          
                          <div className={`p-3 rounded-lg border ${currentTheme.border}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-database text-blue-500"></i>
                              <span className="font-semibold dark:text-gray-300">Supabase Database</span>
                            </div>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>
                              PostgreSQL database for storing Prolog codes and metadata
                            </p>
                          </div>
                          
                          <div className={`p-3 rounded-lg border ${currentTheme.border}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-cloud text-purple-500"></i>
                              <span className="font-semibold dark:text-gray-300">Supabase Storage</span>
                            </div>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>
                              Cloud storage for .pl file management
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold mb-3 dark:text-gray-200">Features</h3>
                        <ul className="space-y-2">
                          {[
                            "Real Prolog query execution",
                            "Interactive chat interface",
                            "Dark/Light theme support",
                            "Real-time response streaming",
                            "Command history",
                            "System monitoring"
                          ].map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <i className="fas fa-check text-green-500"></i>
                              <span className="dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        
                        <div className={`mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border ${currentTheme.border}`}>
                          <h4 className="font-bold mb-2 dark:text-gray-200">Quick Start</h4>
                          <p className={`text-sm mb-3 ${currentTheme.textSecondary}`}>Try these commands:</p>
                          <div className="space-y-1">
                            <code className={`block px-3 py-1 rounded font-mono text-sm ${
                              theme === 'dark' ? 'bg-gray-700 text-blue-300' : 'bg-gray-800 text-blue-100'
                            }`}>
                              start
                            </code>
                            <code className={`block px-3 py-1 rounded font-mono text-sm ${
                              theme === 'dark' ? 'bg-gray-700 text-blue-300' : 'bg-gray-800 text-blue-100'
                            }`}>
                              demo_menu
                            </code>
                            <code className={`block px-3 py-1 rounded font-mono text-sm ${
                              theme === 'dark' ? 'bg-gray-700 text-blue-300' : 'bg-gray-800 text-blue-100'
                            }`}>
                              platform_info(_, _)
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 flex flex-col gap-6">
            
            {/* Connection Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-5 ${currentTheme.card} border`}
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-gray-200">
                <i className="fas fa-network-wired text-green-500"></i>
                Connection Status
              </h3>
              
              <div className="space-y-3">
                {[
                  { service: "Prolog API", status: "Connected", color: "green" },
                  { service: "Supabase", status: "Active", color: "blue" },
                  { service: "Database", status: "Synced", color: "purple" },
                  { service: "WebSocket", status: "Ready", color: "cyan" }
                ].map((conn, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${currentTheme.hover}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${conn.color}-500`}></div>
                      <span className="dark:text-gray-300">{conn.service}</span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {conn.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl p-5 ${currentTheme.card} border`}
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-gray-200">
                <i className="fas fa-bolt text-yellow-500"></i>
                Quick Actions
              </h3>
              
              <div className="space-y-2">
                {[
                  { label: "Load Files", action: loadTestFiles, icon: "fas fa-download" },
                  { label: "Test Connection", action: () => sendQuery("platform_info(_, _)"), icon: "fas fa-wifi" },
                  { label: "Clear Chat", action: () => sendQuery("clear"), icon: "fas fa-broom" },
                  { label: "View System Log", action: () => console.log("System log"), icon: "fas fa-scroll" }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.action}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-200 ${currentTheme.hover} dark:text-gray-300`}
                  >
                    <i className={`${action.icon} text-blue-500`}></i>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-5 ${currentTheme.card} border`}
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-gray-200">
                <i className="fas fa-history text-purple-500"></i>
                Recent Activity
              </h3>
              
              <div className="space-y-3">
                {messages.slice(-3).reverse().map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        msg.user 
                          ? 'bg-blue-500/20 text-blue-500 dark:text-blue-400' 
                          : 'bg-green-500/20 text-green-500 dark:text-green-400'
                      }`}>
                        {msg.user ? 'You' : 'System'}
                      </span>
                      <span className={`text-xs ${currentTheme.textTertiary}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`truncate ${currentTheme.textSecondary}`}>
                      {msg.text.split('\n')[0].substring(0, 50)}...
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`mt-6 rounded-xl ${currentTheme.card} border p-4`}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium dark:text-gray-300">Prolog AI Assistant v2.0</p>
                <p className={`text-xs ${currentTheme.textTertiary}`}>Test Environment</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className={currentTheme.textTertiary}>Queries:</span>
                <span className="ml-1 font-bold dark:text-gray-300">{messages.filter(m => m.user).length}</span>
              </div>
              <div className="text-sm">
                <span className={currentTheme.textTertiary}>Status:</span>
                <span className="ml-1 font-bold text-green-500">Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
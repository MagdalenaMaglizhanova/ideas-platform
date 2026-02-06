import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../services/supabase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// Icons import
import {
  MessageSquare,
  Code as CodeIcon,
  FileCode,
  Download,
  Play,
  Terminal,
  Brain,
  HelpCircle,
  User as UserIcon,
  Trash2,
  List,
  Database,
  Globe,
  CheckCircle,
  RefreshCw,
  Cpu,
  Zap
} from "lucide-react";

interface Message {
  user: boolean;
  text: string;
  id: string;
  timestamp: Date;
  type?: 'system' | 'query' | 'result';
}

export default function PrologTestChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);
  const [fileNameInput, setFileNameInput] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { theme } = useTheme();
  const { t } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  // System commands
  const systemCommands = [
    { 
      label: 'Help', 
      query: "help", 
      icon: <HelpCircle className="w-4 h-4" />,
      color: "#4A90E2",
      gradient: "from-blue-500 to-cyan-500",
      tooltip: 'Show help information'
    },
    { 
      label: 'Load Test', 
      query: "load_all", 
      icon: <Download className="w-4 h-4" />,
      color: "#50C878",
      gradient: "from-emerald-500 to-green-500",
      tooltip: 'Load all Prolog files from test domain'
    },
    { 
      label: 'List Files', 
      query: "list_files", 
      icon: <List className="w-4 h-4" />,
      color: "#FF6B8B",
      gradient: "from-rose-500 to-pink-500",
      tooltip: 'List all loaded files'
    },
    { 
      label: 'Clear Facts', 
      query: "clear_all_facts", 
      icon: <Trash2 className="w-4 h-4" />,
      color: "#FF4757",
      gradient: "from-red-500 to-rose-500",
      tooltip: 'Clear all loaded facts'
    },
    { 
      label: 'Current File', 
      query: "current_file", 
      icon: <FileCode className="w-4 h-4" />,
      color: "#9D4EDD",
      gradient: "from-purple-500 to-violet-500",
      tooltip: 'Show current active file'
    },
    { 
      label: 'List Predicates', 
      query: "list_predicates", 
      icon: <CodeIcon className="w-4 h-4" />,
      color: "#36D1DC",
      gradient: "from-cyan-500 to-teal-500",
      tooltip: 'List all available predicates'
    },
  ];

  // File commands
  const fileCommands = [
    { 
      label: 'Consult File', 
      query: `consult_file('${fileNameInput}')`, 
      icon: <Play className="w-4 h-4" />,
      color: "#4A90E2",
      gradient: "from-blue-500 to-cyan-500"
    },
    { 
      label: 'Reconsult File', 
      query: `reconsult_file('${fileNameInput}')`, 
      icon: <RefreshCw className="w-4 h-4" />,
      color: "#9D4EDD",
      gradient: "from-purple-500 to-violet-500"
    },
  ];

  const loadDomain = async () => {
    setIsLoadingDomain(true);
    setSelectedDomain("test");

    const thinkingMsg: Message = {
      user: false,
      text: `Loading test domain...`,
      id: "domain-loading-" + Date.now().toString(),
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/select-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: "test" })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      setMessages(prev => [
        ...prev.filter(msg => msg.id !== thinkingMsg.id),
        {
          user: false,
          text: data.message || `✅ Test domain loaded successfully. Ready for queries.`,
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
          text: `❌ Error loading test domain: ${err.message}`,
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
        "Test domain examples:",
        "1. help.",
        "2. list_files.",
        "3. consult_file('test.pl').",
        "4. current_file.",
        "5. list_predicates."
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

  const stats = {
    totalQueries: messages.filter(m => m.user).length,
    systemMessages: messages.filter(m => m.type === 'system').length,
    activeDomain: selectedDomain || "None",
    responseTime: "0.5s"
  };

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-20 md:pt-24`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-blue-400" />
              </div>
              <span>Prolog Test Assistant</span>
            </h1>
            <p className={`mt-2 ${currentTheme.textSecondary}`}>
              Test domain knowledge interaction system
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setMessages([]);
              }}
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

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total Queries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center`}>
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <span className={`text-sm px-2 py-1 rounded-lg ${
                theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                Queries sent
              </span>
            </div>
            <div className="text-3xl font-bold mb-2">{stats.totalQueries}</div>
            <div className={currentTheme.textSecondary}>Total Queries</div>
          </motion.div>

          {/* Card 2: System Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center`}>
                <Terminal className="w-6 h-6 text-purple-400" />
              </div>
              <span className={`text-sm px-2 py-1 rounded-lg ${
                theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                System interactions
              </span>
            </div>
            <div className="text-3xl font-bold mb-2">{stats.systemMessages}</div>
            <div className={currentTheme.textSecondary}>System Messages</div>
          </motion.div>

          {/* Card 3: Active Domain */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center`}>
                <Database className="w-6 h-6 text-amber-400" />
              </div>
              <span className={`text-sm px-2 py-1 rounded-lg ${
                theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                Current domain
              </span>
            </div>
            <div className="text-3xl font-bold mb-2">{stats.activeDomain}</div>
            <div className={currentTheme.textSecondary}>Active Domain</div>
          </motion.div>

          {/* Card 4: Test Domain Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card} cursor-pointer hover:scale-[1.02] transition-transform duration-300 ${
              selectedDomain === "test" ? 'ring-2 ring-green-500/50' : ''
            }`}
            onClick={loadDomain}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center`}>
                {selectedDomain === "test" ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <Globe className="w-6 h-6 text-green-400" />
                )}
              </div>
              <span className={`text-sm px-2 py-1 rounded-lg ${
                theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                Click to connect
              </span>
            </div>
            <div className="text-3xl font-bold mb-2">
              {isLoadingDomain ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Loading...
                </span>
              ) : (
                selectedDomain === "test" ? "Connected" : "Test Domain"
              )}
            </div>
            <div className={`flex items-center gap-2 ${currentTheme.textSecondary}`}>
              {selectedDomain === "test" ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Ready for queries</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Connect to test knowledge base</span>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Main Chat Area - Full Width */}
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
                  placeholder="test.pl"
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

          {/* Chat Messages - Bigger Area */}
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
                  <div>
                    <h3 className="text-xl font-bold">Test Chat Assistant</h3>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      {selectedDomain ? `Connected to ${selectedDomain} domain` : "Connect to test domain first"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedDomain && (
                    <button
                      onClick={loadDomain}
                      disabled={isLoadingDomain}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        theme === 'dark'
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      } disabled:opacity-50`}
                    >
                      <Globe className="w-4 h-4" />
                      {isLoadingDomain ? "Connecting..." : "Connect Test Domain"}
                    </button>
                  )}
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
            </div>

            <div 
              ref={messagesContainerRef}
              className={`h-[600px] overflow-y-auto p-6 ${currentTheme.scrollbar}`}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  {!selectedDomain ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                        <Globe className="w-8 h-8 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Connect to Test Domain</h3>
                      <p className={`mb-6 ${currentTheme.textSecondary}`}>
                        Click the "Test Domain" card above or the "Connect Test Domain" button to start
                      </p>
                      <button
                        onClick={loadDomain}
                        disabled={isLoadingDomain}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                          theme === 'dark'
                            ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        } disabled:opacity-50`}
                      >
                        <Globe className="w-5 h-5" />
                        {isLoadingDomain ? "Connecting..." : "Connect Test Domain"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Start Testing</h3>
                      <p className={`mb-6 ${currentTheme.textSecondary}`}>
                        Connected to test domain. Use commands above or enter Prolog queries below
                      </p>
                      <div className="grid grid-cols-2 gap-3 max-w-md">
                        {systemCommands.slice(0, 4).map((cmd, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendQuery(cmd.query)}
                            disabled={isLoading}
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
                    </>
                  )}
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
                    !selectedDomain ? "Connect to test domain first..." :
                    `Enter Prolog query (test)...`
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
      </div>
    </div>
  );
}
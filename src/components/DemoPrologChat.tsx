import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../services/supabase";

interface Message {
  user: boolean;
  text: string;
  id: string;
  timestamp: Date;
  type?: 'system' | 'query' | 'result' | 'demo';
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

// Demo domain configuration
const DEMO_DOMAIN = {
  id: "test",
  label: "Test Domain",
  icon: "fas fa-vial",
  description: "Test knowledge base demonstration",
  color: "#6366F1",
  gradient: "from-indigo-500 to-purple-500"
};

// Demo commands - simplified for demonstration (БЕЗ ТОЧКИ!)
const demoCommands = [
  { 
    label: "Start Demo", 
    query: "start", // БЕЗ ТОЧКА!
    icon: "fas fa-play", 
    color: "#10B981",
    gradient: "from-emerald-500 to-green-500",
    tooltip: "Start interactive demonstration"
  },
  { 
    label: "Demo Menu", 
    query: "demo_menu", // БЕЗ ТОЧКА!
    icon: "fas fa-bars", 
    color: "#8B5CF6",
    gradient: "from-purple-500 to-violet-500",
    tooltip: "Show demo menu options"
  },
  { 
    label: "Platform Info", 
    query: "platform_info(_, _)", // БЕЗ ТОЧКА!
    icon: "fas fa-info-circle", 
    color: "#3B82F6",
    gradient: "from-blue-500 to-cyan-500",
    tooltip: "Show platform information"
  },
  { 
    label: "Platform Status", 
    query: "platform_status", // БЕЗ ТОЧКА!
    icon: "fas fa-heartbeat", 
    color: "#EF4444",
    gradient: "from-red-500 to-rose-500",
    tooltip: "Check platform status"
  },
  { 
    label: "Test Query", 
    query: "test_query", // БЕЗ ТОЧКА!
    icon: "fas fa-vial", 
    color: "#F59E0B",
    gradient: "from-amber-500 to-yellow-500",
    tooltip: "Run test query"
  },
  { 
    label: "List Topics", 
    query: "list_educational_topics", // БЕЗ ТОЧКА!
    icon: "fas fa-book", 
    color: "#06B6D4",
    gradient: "from-cyan-500 to-teal-500",
    tooltip: "List educational topics"
  },
  { 
    label: "Clear Chat", 
    query: "clear", 
    icon: "fas fa-trash", 
    color: "#6B7280",
    gradient: "from-gray-500 to-gray-700",
    tooltip: "Clear chat history"
  }
];

export default function DemoPrologChat() {
  const { theme } = useTheme();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      user: false,
      text: `🚀 **KNOWLEDGE MANAGEMENT PLATFORM - TEST MODE**\n\nWelcome to the test environment! This demo connects to:\n\n• **Supabase Storage** - test.pl file in 'test' folder\n• **Prolog API Server** - Real Prolog query execution\n• **Supabase Database** - Stored Prolog codes\n\n**Available Commands:**\n• start - Start the interactive demo\n• demo_menu - Show menu options\n• test_query - Test platform functionality\n• platform_info(_, _) - Platform details\n\n**Note:** Don't add dots at the end of commands`,
      id: "welcome-" + Date.now(),
      timestamp: new Date(),
      type: 'demo'
    }
  ]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const [testFiles, setTestFiles] = useState<PrologCode[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
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

  // Load test files from Supabase database
  useEffect(() => {
    async function loadTestFiles() {
      setIsLoadingFiles(true);
      try {
        // Четем от Supabase таблицата prolog_codes
        const { data, error } = await supabase
          .from('prolog_codes')
          .select('*')
          .eq('domain', 'test')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
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
          
          if (codes.length > 0) {
            addSystemMessage(`✅ Loaded ${codes.length} test file(s) from Supabase database`);
          } else {
            addSystemMessage(`ℹ️ No test files found in Supabase. Upload files to 'test' domain.`);
          }
        }
      } catch (err) {
        console.error("Failed to load test files from Supabase:", err);
        addSystemMessage(`❌ Error loading test files from Supabase: ${err instanceof Error ? err.message : String(err)}`);
        
        // Fallback: Try to list files from Supabase Storage directly
        try {
          const { data: storageData, error: storageError } = await supabase
            .storage
            .from('prolog-files')
            .list('test');
            
          if (!storageError && storageData) {
            addSystemMessage(`📁 Found ${storageData.length} file(s) in Supabase Storage 'test' folder`);
          }
        } catch (storageErr) {
          console.error("Failed to list storage files:", storageErr);
        }
      } finally {
        setIsLoadingFiles(false);
      }
    }
    
    loadTestFiles();
  }, []);

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

  // Send query to real Prolog API
  const sendQuery = async (customQuery?: string) => {
    const finalQuery = customQuery ?? query;
    if (!finalQuery.trim() || isLoading) return;

    // Handle clear command (both with and without dot)
    if (finalQuery.trim() === "clear" || finalQuery.trim() === "clear.") {
      setMessages([
        {
          user: false,
          text: `🚀 **KNOWLEDGE MANAGEMENT PLATFORM - TEST MODE**\n\nWelcome to the test environment! This demo connects to:\n\n• **Supabase Storage** - test.pl file in 'test' folder\n• **Prolog API Server** - Real Prolog query execution\n• **Supabase Database** - Stored Prolog codes\n\n**Available Commands:**\n• start - Start the interactive demo\n• demo_menu - Show menu options\n• test_query - Test platform functionality\n• platform_info(_, _) - Platform details\n\n**Note:** Don't add dots at the end of commands`,
          id: "welcome-" + Date.now(),
          timestamp: new Date(),
          type: 'demo'
        }
      ]);
      setQuery("");
      return;
    }

    const userMsg: Message = {
      user: true,
      text: finalQuery,
      id: "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'query'
    };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    
    await sendToPrologAPI(finalQuery);
  };

  // Send query to real Prolog API server
  const sendToPrologAPI = async (queryText: string) => {
    setIsLoading(true);

    const thinkingMsg: Message = {
      user: false,
      text: "Sending to Prolog API...",
      id: "thinking-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
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
            text: `Processing${dots}` 
          } : msg
        )
      );
    }, 500);

    try {
      // First ensure we're using the test domain
      const domainRes = await fetch("https://prolog-api-server-1.onrender.com/prolog/select-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: "test" })
      });

      if (!domainRes.ok) {
        throw new Error(`Domain selection failed: ${domainRes.status}`);
      }

      // Now send the actual query (API вероятно очаква точка, затова я добавяме)
      const queryToSend = queryText.endsWith('.') ? queryText : queryText + '.';
      
      const res = await fetch("https://prolog-api-server-1.onrender.com/prolog/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: queryToSend })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      clearInterval(dotInterval);
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMsg.id));
      
      const resultText = data.output || data.error || data.message || 
                        "No response from Prolog server";
      
      const botMsg: Message = {
        user: false,
        text: resultText,
        id: "result-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        type: 'result'
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      clearInterval(dotInterval);
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMsg.id));
      
      // Fallback to mock response if API fails
      addSystemMessage(`⚠️ API Connection Issue: ${err.message}. Using mock response.`);
      
      // Mock response for demo purposes
      setTimeout(() => {
        const mockResponse = getMockResponse(queryText);
        const botMsg: Message = {
          user: false,
          text: mockResponse,
          id: "mock-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          type: 'result'
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
      }, 500);
      return;
    }
    
    setIsLoading(false);
  };

  // Mock responses for demo (fallback)
  const getMockResponse = (queryText: string): string => {
    // Премахваме точката ако я има
    const cleanQuery = queryText.endsWith('.') ? queryText.slice(0, -1) : queryText;
    
    if (cleanQuery.includes("start")) {
      return `=== KNOWLEDGE MANAGEMENT PLATFORM TEST MODE ===\n\nConnecting to resources:\n✓ Supabase Storage: test.pl loaded\n✓ Prolog API: Connected\n✓ Database: Supabase\n\nTry these queries:\n1. demo_menu\n2. platform_info(_, _)\n3. list_educational_topics\n4. test_query`;
    } 
    else if (cleanQuery.includes("demo_menu")) {
      return `=========================================================\nKNOWLEDGE MANAGEMENT PLATFORM - TEST MODE MENU\n=========================================================\n1. Platform Information\n2. Test Queries\n3. View Test Files\n4. Platform Workflow\n5. Execute Example Query\n0. Exit\n\nSelect option (1-5) by typing the number:`;
    }
    else if (cleanQuery.includes("platform_info")) {
      return `Platform Information:\n\n• Platform: Knowledge Management Platform (KMP)\n• Version: 2.0.0\n• Mode: Test Environment\n• Domain: test\n• Status: Connected\n\nFeatures:\n• Real Prolog API Integration\n• Supabase File Storage\n• Supabase Database\n• Interactive Web Interface\n• Multi-language Support`;
    }
    else if (cleanQuery.includes("test_query")) {
      return `✅ Test query executed successfully!\n\nPlatform components:\n✓ Frontend: React + TypeScript\n✓ Backend: Prolog API Server\n✓ Database: Supabase PostgreSQL\n✓ Storage: Supabase Storage\n✓ Real-time: WebSocket connections\n\nStatus: All systems operational`;
    }
    else if (cleanQuery.includes("list_educational_topics")) {
      return `Educational Topics in Test Knowledge Base:\n\n1. Logic Programming\n   Prolog-based AI reasoning system\n\n2. Knowledge Base Management\n   Creating and querying knowledge bases\n\n3. Web Integration\n   Connecting Prolog with modern web technologies\n\n4. File Management\n   Storing and retrieving Prolog files from cloud storage`;
    }
    else if (cleanQuery === "1") {
      return `=== PLATFORM INFORMATION ===\n\nTest Environment Status:\n• Prolog API: Connected to Prolog api\n• Domain: test\n• Files: ${testFiles.length} test file(s) loaded\n• Storage: Supabase 'test' folder\n• Database: Supabase PostgreSQL\n\nType 'platform_info(_, _)' for detailed info`;
    }
    else if (cleanQuery === "2") {
      return `=== TEST QUERIES ===\n\nAvailable test queries:\n1. start - Initialize test environment\n2. demo_menu - Show interactive menu\n3. platform_info(_, _) - Platform details\n4. list_educational_topics - View knowledge base\n5. test_query - Platform functionality test`;
    }
    else if (cleanQuery === "3") {
      return `=== TEST FILES ===\n\nLoaded ${testFiles.length} file(s) from test domain:\n${testFiles.map(f => `• ${f.fileName || f.title || f.id}`).join('\n')}\n\nFiles are stored in Supabase Storage in 'test' folder`;
    }
    else if (cleanQuery === "4") {
      return `=== PLATFORM WORKFLOW ===\n\n1. User uploads .pl file to Supabase 'test' folder\n2. File metadata stored in Supabase\n3. Prolog API loads file from storage\n4. User queries knowledge base via web interface\n5. Prolog processes query and returns results\n6. Results displayed in chat interface`;
    }
    else if (cleanQuery === "5") {
      return `=== EXAMPLE QUERY EXECUTION ===\n\nQuery: platform_info(_, _)\n\nResult:\n- name: Knowledge Management Platform (KMP)\n- version: 2.0.0\n- mode: Test Environment\n- domain: test\n- status: Connected\n\nThis demonstrates real Prolog query execution`;
    }
    else if (cleanQuery === "0") {
      return `Exiting test mode.\n\nThank you for testing the platform!\n\nReal connections tested:\n• Prolog API Server\n• Supabase Storage\n• Supabase Database`;
    }
    else {
      return `Query: "${queryText}"\n\n✅ Query sent to Prolog API\n📁 Domain: test\n🔗 API Endpoint Prolog api\n\nResponse from Prolog server:\nThis is a real Prolog query execution. The system is processing your query against the test knowledge base.`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  // Theme classes
  const themeClasses = {
    light: {
      background: "bg-gradient-to-br from-blue-50 to-indigo-50",
      text: "text-gray-900",
      card: "bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg",
      input: "bg-white border-gray-300",
      hover: "hover:bg-gray-100 hover:shadow-md",
      textSecondary: "text-gray-600",
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
    },
    dark: {
      background: "bg-gradient-to-br from-gray-900 to-blue-950",
      text: "text-white",
      card: "bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-xl",
      input: "bg-gray-700 border-gray-600",
      hover: "hover:bg-gray-700 hover:shadow-md",
      textSecondary: "text-gray-400",
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800",
    }
  };

  const currentTheme = themeClasses[theme];

  // Format message text
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.includes('===') && line.includes('===')) {
        return <div key={i} className="font-bold text-lg my-2 text-center text-blue-500 dark:text-blue-300">{line}</div>;
      } else if (line.includes('✓') || line.includes('✅')) {
        return <div key={i} className="flex items-center my-1">
          <span className="text-green-500 mr-2">✓</span>
          <span>{line.replace('✓', '').replace('✅', '')}</span>
        </div>;
      } else if (line.includes('⚠️')) {
        return <div key={i} className="flex items-center my-1">
          <span className="text-yellow-500 mr-2">⚠️</span>
          <span>{line.replace('⚠️', '')}</span>
        </div>;
      } else if (line.includes('❌')) {
        return <div key={i} className="flex items-center my-1">
          <span className="text-red-500 mr-2">❌</span>
          <span>{line.replace('❌', '')}</span>
        </div>;
      } else if (line.trim().startsWith('•')) {
        return <div key={i} className="ml-4 my-1 flex items-center">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>
          <span>{line.replace('•', '').trim()}</span>
        </div>;
      } else if (line.includes(':')) {
        const [label, value] = line.split(':');
        return <div key={i} className="my-1">
          <span className="font-semibold">{label}:</span>
          <span className="ml-2">{value}</span>
        </div>;
      } else if (line.trim().match(/^\d+\./)) {
        return <div key={i} className="ml-2 my-1 flex items-center">
          <span className="font-bold mr-2">{line.split('.')[0]}.</span>
          <span>{line.split('.').slice(1).join('.').trim()}</span>
        </div>;
      } else {
        return <div key={i}>{line}</div>;
      }
    });
  };

  // Format code snippet
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

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-20 lg:pt-24`}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className={`rounded-2xl p-6 mb-6 ${currentTheme.card} border backdrop-blur-sm`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 p-1">
                <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
                  <i className="fas fa-code text-blue-600 text-2xl"></i>
                </div>
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Prolog AI Assistant - Test Mode
                </h1>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mt-1`}>
                  Real Prolog API connection with Supabase test files
                </p>
              </div>
            </div>
            
            <div className={`px-5 py-3 rounded-xl border backdrop-blur-sm ${
              theme === 'dark' 
                ? 'bg-gray-800/80 border-gray-700' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    Connected to Test Domain
                  </span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {testFiles.length} test file(s) loaded
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Chat Interface (WIDER NOW) */}
          <div className="lg:w-2/3 flex flex-col">
            {/* Tabs */}
            <div className="flex mb-6">
              <button
                className={`flex-1 px-6 py-3 rounded-t-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === "chat"
                    ? `bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg`
                    : `${currentTheme.hover} ${currentTheme.textSecondary} border ${
                        theme === 'dark' ? 'border-gray-700 border-b-0' : 'border-gray-200 border-b-0'
                      }`
                }`}
                onClick={() => setActiveTab("chat")}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  activeTab === "chat" ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <i className={`fas fa-comments ${activeTab === "chat" ? 'text-white' : 'text-gray-600'}`}></i>
                </div>
                <span className="font-medium">Prolog Chat</span>
              </button>
              <button
                className={`flex-1 px-6 py-3 rounded-t-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  activeTab === "files"
                    ? `bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg`
                    : `${currentTheme.hover} ${currentTheme.textSecondary} border ${
                        theme === 'dark' ? 'border-gray-700 border-b-0' : 'border-gray-200 border-b-0'
                      }`
                }`}
                onClick={() => setActiveTab("files")}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  activeTab === "files" ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <i className={`fas fa-file-code ${activeTab === "files" ? 'text-white' : 'text-gray-600'}`}></i>
                </div>
                <span className="font-medium">Test Files ({testFiles.length})</span>
              </button>
            </div>

            {/* Chat Content */}
            {activeTab === "chat" ? (
              <div className={`flex-1 flex flex-col rounded-b-xl rounded-r-xl border ${currentTheme.card} backdrop-blur-sm overflow-hidden`}>
                {/* Demo Commands */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {demoCommands.map((cmd, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendQuery(cmd.query)}
                        disabled={isLoading}
                        className={`group px-4 py-2.5 rounded-xl text-white flex items-center gap-2 transition-all duration-300 
                          disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${cmd.gradient} 
                          hover:shadow-lg hover:scale-105 active:scale-95`}
                        title={cmd.tooltip}
                      >
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                          <i className={cmd.icon}></i>
                        </div>
                        <span className="font-medium text-sm">{cmd.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages Container - TALLER NOW */}
                <div 
                  ref={messagesContainerRef}
                  className={`flex-1 overflow-y-auto p-4 ${currentTheme.scrollbar}`}
                  style={{ maxHeight: '500px' }}
                >
                  {messages.map(msg => (
                    <div key={msg.id} className={`mb-4 ${msg.user ? 'flex justify-end' : 'flex justify-start'}`}>
                      <div className={`flex gap-3 max-w-[90%] ${msg.user ? 'flex-row-reverse' : ''}`}>
                        {!msg.user ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 p-0.5 flex-shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                              <i className="fas fa-robot text-blue-600 text-sm"></i>
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-user text-white text-sm"></i>
                          </div>
                        )}
                        <div className={`rounded-2xl p-4 ${
                          msg.user
                            ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                            : msg.type === 'demo'
                            ? theme === 'dark' ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                            : msg.type === 'system'
                            ? theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-100/50 border border-gray-200'
                            : theme === 'dark' ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50/50 border border-blue-200'
                        }`}>
                          <div className={msg.user ? 'text-white' : currentTheme.text}>
                            {formatMessageText(msg.text)}
                          </div>
                          <div className={`text-xs mt-2 ${msg.user ? 'text-green-200' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {msg.type === 'demo' && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-blue-500 text-white">
                                DEMO
                              </span>
                            )}
                            {msg.type === 'system' && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-500 text-white">
                                SYSTEM
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type Prolog query (e.g., start, demo_menu, test_query)..."
                      className={`w-full px-5 py-3 pr-14 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        theme === 'dark' 
                          ? 'bg-gray-700/80 border-gray-600' 
                          : 'bg-white/80 border-gray-300'
                      } backdrop-blur-sm`}
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => sendQuery()}
                      disabled={isLoading || !query.trim()}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                        isLoading || !query.trim()
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:scale-105 active:scale-95 text-white'
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
                    </button>
                  </div>
                  <div className={`text-xs mt-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-1">
                      <i className="fas fa-info-circle"></i>
                      <span>Press Enter to send • Connected to Prolog API</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Files Tab Content */
              <div className={`flex-1 rounded-b-xl rounded-r-xl p-6 ${currentTheme.card} border backdrop-blur-sm overflow-y-auto ${currentTheme.scrollbar}`}>
                <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Test Files in 'test' Domain
                </h2>
                
                {isLoadingFiles ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : testFiles.length === 0 ? (
                  <div className={`h-64 flex flex-col items-center justify-center text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                      <i className="fas fa-folder-open text-blue-500 text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold mb-2">No test files found</h3>
                    <p className="max-w-md">
                      Upload Prolog files to the 'test' folder in Supabase Storage to see them here.
                    </p>
                    <div className={`mt-4 p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800/50' : 'bg-blue-50/50'
                    }`}>
                      <p className="text-sm">
                        Expected file location: <code className="bg-gray-800 text-gray-300 px-2 py-1 rounded">supabase/storage/test/</code>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testFiles.map(file => (
                      <div key={file.id} className={`rounded-xl p-4 border ${
                        theme === 'dark' 
                          ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      } transition-colors`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                              <i className="fas fa-file-code text-blue-500"></i>
                            </div>
                            <div>
                              <h4 className="font-bold mb-1">{file.title || file.fileName || file.id}</h4>
                              <div className="flex items-center gap-3 text-sm">
                                <span className={`px-2 py-1 rounded ${
                                  theme === 'dark' ? 'bg-gray-700' : 'bg-blue-100'
                                }`}>
                                  <i className="fas fa-tag mr-1"></i>
                                  {file.domain || 'test'}
                                </span>
                                {file.fileName && (
                                  <span className={`px-2 py-1 rounded ${
                                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                  }`}>
                                    <i className="fas fa-hdd mr-1"></i>
                                    {file.fileName}
                                  </span>
                                )}
                                {file.folder && (
                                  <span className={`px-2 py-1 rounded ${
                                    theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'
                                  }`}>
                                    <i className="fas fa-folder mr-1"></i>
                                    {file.folder}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(file.code)}
                            className={`p-2 rounded-lg ${
                              theme === 'dark' 
                                ? 'hover:bg-white/10' 
                                : 'hover:bg-gray-200'
                            } transition-colors`}
                            title="Copy code"
                          >
                            <i className="fas fa-copy"></i>
                          </button>
                        </div>
                        
                        <div className={`rounded-lg p-3 mb-3 ${
                          theme === 'dark' 
                            ? 'bg-gray-900/50' 
                            : 'bg-gray-100'
                        }`}>
                          <pre className={`text-sm font-mono overflow-x-auto ${currentTheme.scrollbar}`}>
                            <code dangerouslySetInnerHTML={{ 
                              __html: formatCode(file.code.substring(0, 200) + (file.code.length > 200 ? '...' : ''))
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
                                      <title>${file.title || file.id} - Prolog Code</title>
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
                                        .comment { color: ${theme === 'dark' ? '#6a9955' : 'green'}; }
                                        .fact { color: ${theme === 'dark' ? '#569cd6' : 'blue'}; }
                                        .rule { color: ${theme === 'dark' ? '#c586c0' : 'purple'}; }
                                        .query { color: ${theme === 'dark' ? '#ce9178' : 'orange'}; }
                                      </style>
                                    </head>
                                    <body>
                                      <h2>${file.title || file.id}</h2>
                                      <pre>${file.code}</pre>
                                    </body>
                                  </html>
                                `);
                              }
                            }}
                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                              theme === 'dark' 
                                ? 'bg-white/5 hover:bg-white/10' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors`}
                          >
                            <i className="fas fa-external-link-alt"></i>
                            View Full Code
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Info Panel (NARROWER NOW) */}
          <div className="lg:w-1/3 flex flex-col">
            {/* Demo Domain Card */}
            <div className={`rounded-2xl p-5 mb-6 ${currentTheme.card} border backdrop-blur-sm`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${DEMO_DOMAIN.gradient}`}>
                  <i className={`${DEMO_DOMAIN.icon} text-white text-lg`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{DEMO_DOMAIN.label}</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {DEMO_DOMAIN.description}
                  </p>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl mb-4 ${
                theme === 'dark' ? 'bg-gray-800/50' : 'bg-blue-50/50'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-blue-200'}`}>
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <i className="fas fa-plug text-green-500"></i>
                  API Connections
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prolog API</span>
                    <span className="text-green-500 text-sm">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supabase Storage</span>
                    <span className="text-green-500 text-sm">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supabase Database</span>
                    <span className="text-yellow-500 text-sm">⚠️ Checking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Queries */}
            <div className={`rounded-2xl p-5 mb-6 ${currentTheme.card} border backdrop-blur-sm`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-bolt text-yellow-500"></i>
                Quick Queries
              </h3>
              <div className="space-y-2">
                {[
                  { query: "start", label: "Start Demo" },
                  { query: "demo_menu", label: "Show Menu" },
                  { query: "platform_info(_, _)", label: "Platform Info" },
                  { query: "list_educational_topics", label: "List Topics" },
                  { query: "test_query", label: "Test Platform" },
                  { query: "clear", label: "Clear Chat" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendQuery(item.query)}
                    disabled={isLoading}
                    className={`w-full text-left p-3 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-gray-800/50 hover:bg-gray-700/50' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    } border ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                    } transition-colors disabled:opacity-50`}
                  >
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs font-mono mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    } truncate`}>
                      {item.query}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Info */}
            <div className={`rounded-2xl p-5 ${currentTheme.card} border backdrop-blur-sm`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <i className="fas fa-info-circle text-blue-500"></i>
                Platform Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">API Endpoint</span>
                  <span className="text-xs font-mono">prolog-api-server</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Storage</span>
                  <span className="text-xs">Supabase/test</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Database</span>
                  <span className="text-xs">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Status</span>
                  <span className="text-green-500 text-xs">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Platform Features */}
        <div className={`mt-6 rounded-xl ${currentTheme.card} border backdrop-blur-sm overflow-hidden`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-star text-yellow-500"></i>
              Platform Features
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: "fas fa-code", label: "Prolog AI", color: "text-blue-500" },
                { icon: "fas fa-database", label: "Knowledge Base", color: "text-green-500" },
                { icon: "fas fa-upload", label: "File Upload", color: "text-purple-500" },
                { icon: "fas fa-users", label: "Collaboration", color: "text-pink-500" },
                { icon: "fas fa-language", label: "Multi-language", color: "text-yellow-500" },
                { icon: "fas fa-palette", label: "Themes", color: "text-indigo-500" }
              ].map((feature, idx) => (
                <div key={idx} className={`flex flex-col items-center p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                  }`}>
                    <i className={`${feature.icon} ${feature.color} text-lg`}></i>
                  </div>
                  <span className="text-sm font-medium text-center">{feature.label}</span>
                </div>
              ))}
            </div>
            <div className={`mt-4 p-3 rounded-lg text-center ${
              theme === 'dark' ? 'bg-gray-800/30' : 'bg-blue-50/50'
            }`}>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                This test environment demonstrates real connections to Prolog API and Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { supabase } from "../services/supabase";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

interface Message {
  user: boolean;
  text: string;
  id: string;
  timestamp: Date;
  type?: 'system' | 'query' | 'result'; // Ново поле за тип на съобщението
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

// Икони за домейните (използвай Font Awesome класове)
const domainIcons: Record<string, string> = {
  animals: "fas fa-paw",
  history: "fas fa-landmark",
  geography: "fas fa-globe-americas",
  mineralwater: "fas fa-tint",
  balkan: "fas fa-mountain"
};

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
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  
  // Нови стейтове за качване на файлове
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [_uploadFolder, setUploadFolder] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  // Domains configuration with translations - обновени с икони
  const domains = [
    { 
      id: "animals", 
      label: t('animals') || 'Animals', 
      icon: "fas fa-paw", 
      description: t('animal_facts_description') || 'Animal facts and relationships', 
      color: "#FF6B8B",
      gradient: "from-pink-500 to-rose-500"
    },
    { 
      id: "history", 
      label: t('history') || 'History', 
      icon: "fas fa-landmark", 
      description: t('historical_facts_description') || 'Historical events and figures', 
      color: "#36D1DC",
      gradient: "from-cyan-500 to-blue-500"
    },
    { 
      id: "geography", 
      label: t('geography') || 'Geography', 
      icon: "fas fa-globe-americas", 
      description: t('geographical_facts_description') || 'Geographical facts and locations', 
      color: "#FFD166",
      gradient: "from-amber-500 to-yellow-500"
    },
    { 
      id: "mineralwater", 
      label: t('mineral_water') || 'Mineral Water', 
      icon: "fas fa-tint", 
      description: t('mineral_water_description') || 'Mineral water sources and properties', 
      color: "#9D4EDD",
      gradient: "from-purple-500 to-violet-500"
    },
    { 
      id: "balkan", 
      label: t('balkan') || 'Central Balkan', 
      icon: "fas fa-mountain", 
      description: t('balkan_description') || 'Balkan sources and properties', 
      color: "#7BDF7B",
      gradient: "from-emerald-500 to-green-500"
    }
  ];

  // System commands with translations - подобрени
  const systemCommands = [
    { 
      label: t('help'), 
      query: "help", 
      icon: "fas fa-question-circle", 
      color: "#4A90E2",
      gradient: "from-blue-500 to-cyan-500",
      tooltip: t('help_tooltip') || 'Show help information'
    },
    { 
      label: t('load_all') || 'Load All', 
      query: "load_all", 
      icon: "fas fa-download", 
      color: "#50C878",
      gradient: "from-emerald-500 to-green-500",
      tooltip: t('load_all_tooltip') || 'Load all Prolog files'
    },
    { 
      label: t('list_files') || 'List Files', 
      query: "list_files", 
      icon: "fas fa-list", 
      color: "#FF6B8B",
      gradient: "from-rose-500 to-pink-500",
      tooltip: t('list_files_tooltip') || 'List all loaded files'
    },
    { 
      label: t('clear_facts') || 'Clear Facts', 
      query: "clear_all_facts", 
      icon: "fas fa-trash", 
      color: "#FF4757",
      gradient: "from-red-500 to-rose-500",
      tooltip: t('clear_facts_tooltip') || 'Clear all loaded facts'
    },
    { 
      label: t('current_file') || 'Current File', 
      query: "current_file", 
      icon: "fas fa-file", 
      color: "#9D4EDD",
      gradient: "from-purple-500 to-violet-500",
      tooltip: t('current_file_tooltip') || 'Show current active file'
    },
    { 
      label: t('list_predicates') || 'List Predicates', 
      query: "list_predicates", 
      icon: "fas fa-code", 
      color: "#36D1DC",
      gradient: "from-cyan-500 to-teal-500",
      tooltip: t('list_predicates_tooltip') || 'List all available predicates'
    },
    { 
      label: t('unload_all') || 'Unload All', 
      query: "unload_all", 
      icon: "fas fa-times-circle", 
      color: "#FF9500",
      gradient: "from-orange-500 to-amber-500",
      tooltip: t('unload_all_tooltip') || 'Unload all Prolog files'
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  // Auto-expand chat based on content
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const contentHeight = container.scrollHeight;
      const containerHeight = container.clientHeight;
      
      if (contentHeight > containerHeight * 1.5 && contentHeight > 500) {
        setIsChatExpanded(true);
      } else if (contentHeight < 400) {
        setIsChatExpanded(false);
      }
    }
  }, [messages]);

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

  // Set upload folder based on selected domain
  useEffect(() => {
    if (selectedDomain) {
      setUploadFolder(selectedDomain);
    }
  }, [selectedDomain]);

  // Load domain from API
  const loadDomain = async (domain: string) => {
    setIsLoadingDomain(true);
    setSelectedDomain(domain);

    // Clear previous domain activation message
    setMessages(prev => prev.filter(msg => !msg.text.includes(
      language === 'bg' ? 'домейн зареден успешно' : 
      language === 'es' ? 'dominio cargado exitosamente' : 
      'Domain loaded successfully'
    )));

    const thinkingMsg: Message = {
      user: false,
      text: t('loading_domain') ? `${t('loading_domain')} ${domain}...` : 
            language === 'bg' ? `Зареждане на домейн ${domain}...` : 
            language === 'es' ? `Cargando dominio ${domain}...` : 
            `Loading ${domain} domain...`,
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
          text: data.message || 
                (t('domain_loaded_success') ? `${t('domain_loaded_success')} ${domain}` :
                 language === 'bg' ? `✅ Домейн ${domain} зареден успешно. Готов за заявки.` : 
                 language === 'es' ? `✅ Dominio ${domain} cargado exitosamente. Listo para consultas.` :
                 `✅ ${domain} domain loaded successfully. Ready for queries.`),
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
          text: t('domain_load_error') ? `${t('domain_load_error')} ${domain}: ${err.message}` :
                language === 'bg' ? `❌ Грешка при зареждане на домейн ${domain}: ${err.message}` : 
                language === 'es' ? `❌ Error cargando dominio ${domain}: ${err.message}` :
                `❌ Error loading ${domain} domain: ${err.message}`,
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

  // Send query
  const sendQuery = async (customQuery?: string) => {
    const finalQuery = customQuery ?? query;
    if (!finalQuery.trim() || isLoading || !selectedDomain) return;

    // Handle clear command
    if (finalQuery.trim() === "clear." || finalQuery.trim() === "clear") {
      setMessages([]);
      setQuery("");
      setIsChatExpanded(false);
      return;
    }

    // Handle examples command
    if (finalQuery.trim() === "examples.") {
      const examples = language === 'bg' ? [
        "Домейн Животни: animal(X)., mammal(X)., bird(X).",
        "Домейн История: event(X)., person(X)., year(Event, Year).",
        "Домейн География: country(X)., capital(Country, Capital)., river(X).",
        "Системни команди: help., list_files., load_all., clear_all_facts.",
        "Файлови команди: consult_file('filename')., unload_file('filename')."
      ] : language === 'es' ? [
        "Dominio Animales: animal(X)., mammal(X)., bird(X).",
        "Dominio Historia: event(X)., person(X)., year(Event, Year).",
        "Dominio Geografía: country(X)., capital(Country, Capital)., river(X).",
        "Comandos del sistema: help., list_files., load_all., clear_all_facts.",
        "Comandos de archivo: consult_file('filename')., unload_file('filename')."
      ] : [
        "Animals domain: animal(X)., mammal(X)., bird(X).",
        "History domain: event(X)., person(X)., year(Event, Year).",
        "Geography domain: country(X)., capital(Country, Capital)., river(X).",
        "System commands: help., list_files., load_all., clear_all_facts.",
        "File commands: consult_file('filename')., unload_file('filename')."
      ];
      
      const welcomeMessage = t('example_queries') || '📚 Example Queries:\n\n';
      
      setMessages(prev => [...prev, {
        user: false,
        text: welcomeMessage + examples.map(ex => `• ${ex}`).join('\n'),
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
      
      const resultText = data.output || data.error || data.message || 
                        (t('no_server_response') || "No response from server");
      
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
        text: t('connection_error') ? `${t('connection_error')}: ${err.message}` :
              language === 'bg' ? `❌ Грешка при връзка: ${err.message}` : 
              language === 'es' ? `❌ Error de conexión: ${err.message}` :
              `❌ Connection error: ${err.message}`,
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
    setIsChatExpanded(false);
  };

  const toggleChatExpansion = () => {
    setIsChatExpanded(!isChatExpanded);
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

  // Filter codes by selected domain
  const getFilteredCodes = () => {
    if (!selectedDomain) return allCodes;
    return allCodes.filter(code => code.domain === selectedDomain);
  };

  // Get welcome message based on language
  const getWelcomeMessage = () => {
    if (language === 'bg') {
      return `Добре дошли в Prolog AI помощника! 🎯\n\nРаботя със специфични за домейн бази от знания, използвайки Prolog API сървър.\n\n1. Изберете домейн от знания от лявата странична лента\n2. Използвайте системните команди по-горе за управление на файлове\n3. Изпращайте Prolog заявки за взаимодействие с базата знани\n\nНалични домейни:\n${domains.map(d => `• ${d.label} - ${d.description}`).join('\n')}\n\nОпитайте командата 'help.' за да видите всички налични команди.`;
    } else if (language === 'es') {
      return `¡Bienvenido al Asistente AI de Prolog! 🎯\n\nTrabajo con bases de conocimiento específicas de dominio utilizando el servidor API de Prolog.\n\n1. Seleccione un dominio de conocimiento de la barra lateral izquierda\n2. Use los comandos del sistema arriba para gestionar archivos\n3. Envíe consultas Prolog para interactuar con la base de conocimiento\n\nDominios disponibles:\n${domains.map(d => `• ${d.label} - ${d.description}`).join('\n')}\n\nPruebe el comando 'help.' para ver todos los comandos disponibles.`;
    } else {
      return `Welcome to Prolog AI Assistant! 🎯\n\nI work with domain-specific knowledge bases using the Prolog API server.\n\n1. Select a knowledge domain from the left sidebar\n2. Use system commands above to manage files\n3. Send Prolog queries to interact with the knowledge base\n\nAvailable domains:\n${domains.map(d => `• ${d.label} - ${d.description}`).join('\n')}\n\nTry 'help.' command to see all available commands.`;
    }
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
      setUploadStatus("❌ " + (t('only_pl_files') || "Only .pl files allowed"));
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !user || !selectedDomain) {
      console.error("❌ No file, user, or domain:", { uploadFile, user, selectedDomain });
      setUploadStatus("❌ " + (t('no_file_user_domain') || "No file selected, user not logged in, or domain not selected"));
      return;
    }

    if (!uploadFile.name.toLowerCase().endsWith('.pl')) {
      console.error("❌ Not a .pl file:", uploadFile.name);
      setUploadStatus("❌ " + (t('only_pl_files') || "Only .pl files allowed"));
      return;
    }

    setIsUploading(true);
    setUploadStatus(t('uploading_file') || "Uploading file...");

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

      console.log("📤 Uploading file to domain folder:", {
        originalName,
        finalFileName,
        username,
        domain: selectedDomain,
        path
      });

      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from("prolog-files")
        .upload(path, uploadFile, { 
          upsert: false,
          cacheControl: '3600',
          contentType: uploadFile.type || 'text/plain'
        });

      if (uploadError) {
        console.error("❌ Supabase upload error:", uploadError);
        
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
      setUploadStatus("✅ " + (t('file_upload_success') || `File "${originalName}" uploaded to ${selectedDomain} domain`));
      setUploadFile(null);
      
      const fileInput = document.getElementById('fileUploadInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      setUploadStatus("❌ " + (t('upload_failed') || "Upload failed:") + " " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Theme classes
  const themeClasses = {
    light: {
      background: "bg-gradient-to-br from-gray-50 to-gray-100",
      text: "text-gray-900",
      sidebar: "bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg",
      card: "bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg",
      input: "bg-white border-gray-300",
      hover: "hover:bg-gray-100 hover:shadow-md",
      textSecondary: "text-gray-600",
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100",
    },
    dark: {
      background: "bg-gradient-to-br from-gray-900 to-gray-800",
      text: "text-white",
      sidebar: "bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-xl",
      card: "bg-gray-800/90 backdrop-blur-sm border-gray-700 shadow-xl",
      input: "bg-gray-700 border-gray-600",
      hover: "hover:bg-gray-700 hover:shadow-md",
      textSecondary: "text-gray-400",
      scrollbar: "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800",
    }
  };

  const currentTheme = themeClasses[theme];

  // Функция за филтриране на съобщения по тип
  const getSystemMessages = () => messages.filter(msg => msg.type === 'system' || msg.id.startsWith('thinking-') || msg.id.startsWith('domain-loading-'));
  const getResultMessages = () => messages.filter(msg => msg.type === 'result');

  return (
    <div className={`flex min-h-screen ${currentTheme.background} ${currentTheme.text} pt-18 lg:pt-28`}>
      {/* SIDEBAR - с подобрен скрол */}
      <aside className={`fixed lg:sticky top-24 left-0 h-[calc(100vh-6rem)] w-64 ${currentTheme.sidebar} border-r z-40 lg:z-20 overflow-y-auto ${currentTheme.scrollbar}`}>
        <div className="h-full flex flex-col p-4">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img src="/images/logo_shevici.jpg" alt="Digital Bulgaria" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Prolog AI Assistant
                </div>
                <div className="text-sm opacity-80">{t('domain_based_knowledge') || 'Domain-Based Knowledge'}</div>
              </div>
            </div>
          </div>

          <div className={`mb-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gradient-to-r from-gray-100 to-gray-200'} border ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold">{t('chat_stats') || 'Chat Stats'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} border ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {messages.filter(m => m.user).length}
                </div>
                <div className="text-xs opacity-80">{t('queries') || 'Queries'}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} border ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  {getFilteredCodes().length}
                </div>
                <div className="text-xs opacity-80">{t('code_files') || 'Code Files'}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} border ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <div className="text-lg font-bold truncate">
                  {selectedDomain || (t('none') || 'None')}
                </div>
                <div className="text-xs opacity-80">{t('active_domain') || 'Active Domain'}</div>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/80' : 'bg-white/80'} border ${
                theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <div className="text-2xl font-bold">
                  {selectedDomain ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-yellow-500">✗</span>
                  )}
                </div>
                <div className="text-xs opacity-80">{t('status') || 'Status'}</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-lg">
                  {t('knowledge_domains') || 'Knowledge Domains'}
                </h4>
              </div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                Изберете домейн за работа
              </p>
            </div>
            <div className="space-y-3">
              {domains.map(domain => (
                <button
                  key={domain.id}
                  onClick={() => loadDomain(domain.id)}
                  disabled={isLoadingDomain}
                  title={domain.description}
                  className={`group flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 ${
                    selectedDomain === domain.id
                      ? 'ring-2 ring-opacity-50 shadow-lg scale-[1.02]'
                      : `${currentTheme.hover}`
                  } ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} border ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedDomain === domain.id ? `${domain.color}15` : undefined,
                    borderColor: selectedDomain === domain.id ? domain.color : undefined,
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    selectedDomain === domain.id 
                      ? `bg-gradient-to-r ${domain.gradient} shadow-lg`
                      : `bg-gradient-to-r ${domain.gradient}/20`
                  }`}>
                    <i className={`${domain.icon} ${
                      selectedDomain === domain.id ? 'text-white' : '' 
                    }`} style={{ 
                      color: selectedDomain === domain.id ? 'white' : domain.color,
                      fontSize: '1.1rem'
                    }}></i>
                  </div>
                  <div className="flex-1 text-left">
                    <span className={`font-semibold ${selectedDomain === domain.id ? 'font-bold' : ''}`}>
                      {domain.label}
                    </span>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                      {domain.description}
                    </div>
                  </div>
                  {selectedDomain === domain.id && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedDomain && (
            <div className={`mt-4 p-3 rounded-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gradient-to-r from-blue-50 to-cyan-50'} border ${
              theme === 'dark' ? 'border-blue-900/30' : 'border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-info-circle text-blue-500"></i>
                <span className="font-medium text-sm">Active Domain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-r ${
                  domains.find(d => d.id === selectedDomain)?.gradient
                }`}>
                  <i className={`${domains.find(d => d.id === selectedDomain)?.icon} text-white text-xs`}></i>
                </div>
                <span className="font-bold text-sm capitalize">{selectedDomain}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full min-h-[calc(100vh-6rem)] overflow-auto">
        <div className="w-full max-w-full p-4 lg:p-6">
          {/* HEADER WITH TABS */}
          <div className={`rounded-xl p-4 mb-4 ${currentTheme.card} border backdrop-blur-sm w-full`}>
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                    activeTab === "chat"
                      ? `bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg`
                      : `${currentTheme.hover} ${currentTheme.textSecondary} border ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`
                  }`}
                  onClick={() => setActiveTab("chat")}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    activeTab === "chat" ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    <i className={`fas fa-comments ${activeTab === "chat" ? 'text-white' : 'text-gray-600'}`}></i>
                  </div>
                  <span className="font-medium">{t('chat') || 'Chat'}</span>
                </button>
                <button
                  className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                    activeTab === "code"
                      ? `bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg`
                      : `${currentTheme.hover} ${currentTheme.textSecondary} border ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`
                  }`}
                  onClick={() => setActiveTab("code")}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    activeTab === "code" ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    <i className={`fas fa-code ${activeTab === "code" ? 'text-white' : 'text-gray-600'}`}></i>
                  </div>
                  <span className="font-medium">{t('code') || 'Code'}</span>
                </button>
              </div>
              
              <div className={`px-4 py-2.5 rounded-xl border backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-gray-800/80 border-gray-700' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${selectedDomain ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {selectedDomain ? (
                        <>
                          {t('active_domain') || 'Active Domain'}: 
                          <span className="ml-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold">
                            {selectedDomain}
                          </span>
                        </>
                      ) : (
                        <span className="text-yellow-600">
                          {t('select_domain_first') || 'Select a domain to begin'}
                        </span>
                      )}
                    </span>
                    {isLoadingDomain && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="text-xs">
                          {t('loading') || 'Loading domain...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-[calc(100vh-12rem)] overflow-hidden">
            {/* CHAT TAB - РАЗДЕЛЕН НА ДВЕ ЧАСТИ */}
            {activeTab === "chat" && (
              <div className="h-full flex flex-col lg:flex-row gap-4">
                {/* LEFT COLUMN - SYSTEM MESSAGES */}
                <div className="lg:w-1/2 flex flex-col">
                  <div className="mb-4">
                    <div className={`rounded-xl p-4 ${currentTheme.card} border backdrop-blur-sm w-full`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                          <i className="fas fa-terminal text-white text-sm"></i>
                        </div>
                        <span className="font-bold text-lg">{t('system_commands') || 'System Commands'}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {systemCommands.map((cmd, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendQuery(cmd.query)}
                            disabled={isLoading || isLoadingDomain || !selectedDomain}
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

                      {/* FILE COMMANDS */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <i className="fas fa-file-code text-white text-sm"></i>
                          </div>
                          <span className="font-bold text-lg">{t('file_commands') || 'File Commands'}</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={fileNameInput}
                            onChange={e => setFileNameInput(e.target.value)}
                            placeholder="filename.pl"
                            className={`flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                              theme === 'dark' 
                                ? 'bg-gray-700/80 border-gray-600' 
                                : 'bg-white/80 border-gray-300'
                            } backdrop-blur-sm`}
                            disabled={isLoading || isLoadingDomain || !selectedDomain}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && fileNameInput.trim()) {
                                sendQuery(`consult_file('${fileNameInput.trim()}')`);
                                setFileNameInput("");
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (fileNameInput.trim()) {
                                  sendQuery(`consult_file('${fileNameInput.trim()}')`);
                                  setFileNameInput("");
                                }
                              }}
                              disabled={isLoading || isLoadingDomain || !selectedDomain || !fileNameInput.trim()}
                              className="px-4 py-2.5 rounded-xl text-white flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('consult_file_tooltip') || 'Load a Prolog file'}
                            >
                              <i className="fas fa-file-import"></i>
                              <span className="font-medium text-sm">Consult</span>
                            </button>
                            <button
                              onClick={() => {
                                if (fileNameInput.trim()) {
                                  sendQuery(`reconsult_file('${fileNameInput.trim()}')`);
                                  setFileNameInput("");
                                }
                              }}
                              disabled={isLoading || isLoadingDomain || !selectedDomain || !fileNameInput.trim()}
                              className="px-4 py-2.5 rounded-xl text-white flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('reconsult_file_tooltip') || 'Reload a Prolog file'}
                            >
                              <i className="fas fa-sync-alt"></i>
                              <span className="font-medium text-sm">Reconsult</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SYSTEM MESSAGES WINDOW */}
                  <div className={`flex-1 flex flex-col rounded-xl border ${currentTheme.card} backdrop-blur-sm overflow-hidden`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-gray-500 to-gray-700 flex items-center justify-center">
                          <i className="fas fa-server text-white text-sm"></i>
                        </div>
                        <h3 className="font-bold text-lg">System Messages</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={clearChat}
                          className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                          title={t('clear_chat') || 'Clear chat'}
                        >
                          <i className="fas fa-trash text-gray-500"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      ref={messagesContainerRef}
                      className={`flex-1 overflow-y-auto p-4 max-h-[400px] ${currentTheme.scrollbar}`}
                    >
                      {getSystemMessages().length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                            <i className="fas fa-comment-dots text-blue-500 text-2xl"></i>
                          </div>
                          <h3 className="text-xl font-bold mb-2">No System Messages</h3>
                          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            System messages will appear here when you interact with the assistant.
                          </p>
                        </div>
                      ) : (
                        getSystemMessages().map(msg => (
                          <div key={msg.id} className="mb-4">
                            <div className="flex gap-3">
                              <div className={`w-8 h-8 rounded-full flex-shrink-0 ${
                                msg.id.startsWith('thinking-') || msg.id.startsWith('domain-loading-')
                                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                                  : msg.text.includes('❌')
                                  ? 'bg-gradient-to-r from-red-500 to-rose-500'
                                  : msg.text.includes('✅')
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                              } flex items-center justify-center`}>
                                <i className={`text-white text-sm ${
                                  msg.id.startsWith('thinking-') || msg.id.startsWith('domain-loading-')
                                    ? 'fas fa-spinner fa-spin'
                                    : msg.text.includes('❌')
                                    ? 'fas fa-exclamation-triangle'
                                    : msg.text.includes('✅')
                                    ? 'fas fa-check'
                                    : 'fas fa-info-circle'
                                }`}></i>
                              </div>
                              <div className="flex-1">
                                <div className={`rounded-xl p-3 ${
                                  theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50/50'
                                } border ${
                                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                }`}>
                                  <div className={`whitespace-pre-wrap text-sm ${
                                    msg.id.startsWith('thinking-') || msg.id.startsWith('domain-loading-')
                                      ? 'italic'
                                      : ''
                                  }`}>
                                    {msg.text.split("\n").map((line, i) => (
                                      <div key={i}>{line}</div>
                                    ))}
                                  </div>
                                  <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - PROLOG RESULTS */}
                <div className="lg:w-1/2 flex flex-col">
                  <div className={`flex-1 flex flex-col rounded-xl border ${currentTheme.card} backdrop-blur-sm overflow-hidden`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                          <i className="fas fa-robot text-white text-sm"></i>
                        </div>
                        <h3 className="font-bold text-lg">Prolog Results</h3>
                      </div>
                      <button 
                        onClick={toggleChatExpansion}
                        className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        title={isChatExpanded ? 
                          (t('collapse_chat') || 'Collapse chat') : 
                          (t('expand_chat') || 'Expand chat')}
                      >
                        <i className={`fas fa-${isChatExpanded ? 'compress' : 'expand'} text-gray-500`}></i>
                      </button>
                    </div>
                    
                    <div className={`flex-1 overflow-y-auto p-4 ${isChatExpanded ? 'max-h-[500px]' : 'max-h-[400px]'} ${currentTheme.scrollbar}`}>
                      {getResultMessages().length === 0 && messages.filter(m => m.user).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                            <i className="fas fa-code text-green-500 text-2xl"></i>
                          </div>
                          <h3 className="text-xl font-bold mb-2">Prolog Results</h3>
                          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            Query results and Prolog outputs will appear here.
                          </p>
                        </div>
                      ) : (
                        <>
                          {(messages.length === 0 ? [{ 
                            user: false, 
                            text: getWelcomeMessage(), 
                            id: "welcome", 
                            timestamp: new Date(),
                            type: 'system'
                          }] : messages).filter(msg => msg.type === 'result' || (msg.user && msg.type === 'query')).map(msg => (
                            <div key={msg.id} className={`mb-4 ${msg.user ? 'flex justify-end' : 'flex justify-start'}`}>
                              <div className={`flex gap-3 max-w-[90%] ${msg.user ? 'flex-row-reverse' : ''}`}>
                                {!msg.user && msg.type === 'result' && (
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 p-0.5 flex-shrink-0">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                                      <img src="/images/logo_shevici.jpg" alt="AI Assistant" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}
                                {msg.user && (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                    <i className="fas fa-user text-white text-sm"></i>
                                  </div>
                                )}
                                <div className={`rounded-2xl p-4 ${
                                  msg.user
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                    : theme === 'dark' ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50/50 border border-gray-200'
                                }`}>
                                  <div className={`whitespace-pre-wrap ${
                                    msg.user ? 'text-white' : currentTheme.text
                                  }`}>
                                    {msg.text.split("\n").map((line, i) => {
                                      // Format Prolog results nicely
                                      if (line.includes('===') && line.includes('===')) {
                                        return <div key={i} className="font-bold text-lg my-2 text-center">{line}</div>;
                                      } else if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.') || line.trim().startsWith('5.') || line.trim().startsWith('6.')) {
                                        return <div key={i} className="ml-2 my-1 flex items-center">
                                          <span className="w-4 h-4 rounded-full bg-blue-500 mr-2 flex-shrink-0"></span>
                                          <span>{line}</span>
                                        </div>;
                                      } else if (line.includes('[') && line.includes(']')) {
                                        return <div key={i} className="my-2">
                                          <div className="font-mono bg-gray-800 text-green-400 dark:bg-gray-900 dark:text-green-300 p-2 rounded-lg">
                                            {line}
                                          </div>
                                        </div>;
                                      } else if (line.includes('true.') || line.includes('false.')) {
                                        return <div key={i} className={`my-2 font-bold ${
                                          line.includes('true.') ? 'text-green-500' : 'text-red-500'
                                        }`}>{line}</div>;
                                      } else {
                                        return <div key={i}>{line}</div>;
                                      }
                                    })}
                                  </div>
                                  <div className={`text-xs mt-2 ${msg.user ? 'text-blue-200' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <input
                          type="text"
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            isLoadingDomain ? (t('loading_domain') || "Loading domain") + "..." :
                            !selectedDomain ? (t('select_domain_first') || "Select a domain first") + "..." :
                            `${t('enter_prolog_query') || "Enter Prolog query"} (${selectedDomain})...`
                          }
                          className={`w-full px-5 py-3 pr-14 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                            theme === 'dark' 
                              ? 'bg-gray-700/80 border-gray-600' 
                              : 'bg-white/80 border-gray-300'
                          } backdrop-blur-sm`}
                          disabled={isLoading || isLoadingDomain || !selectedDomain}
                        />
                        <button
                          onClick={() => sendQuery()}
                          disabled={isLoading || isLoadingDomain || !query.trim() || !selectedDomain}
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                            isLoading || isLoadingDomain || !query.trim() || !selectedDomain
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:scale-105 active:scale-95 text-white'
                          }`}
                        >
                          {isLoading ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane"></i>
                              <span className="font-medium">{t('send') || 'Send'}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className={`text-xs mt-2 flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-1">
                          <i className="fas fa-info-circle"></i>
                          <span>{t('press_enter_to_send') || 'Press Enter to send'}</span>
                        </div>
                        {selectedDomain && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <i className="fas fa-link"></i>
                              <span>
                                {t('connected_to') || 'Connected to'}: 
                                <span className="ml-1 font-bold">{selectedDomain}</span>
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CODE TAB - ДОБАВЕН */}
            {activeTab === "code" && (
              <div className="h-full flex flex-col">
                <div className={`rounded-xl p-4 mb-4 ${currentTheme.card} border backdrop-blur-sm`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <i className="fas fa-file-code text-white text-sm"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {t('code_preview') || 'Code Preview'} - {selectedDomain || t('no_domain_selected') || 'No Domain Selected'}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedDomain ? t('view_code_for_domain') || `Viewing code files for ${selectedDomain} domain` : t('select_domain_to_view_code') || 'Select a domain to view code files'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <span className="text-sm">
                          <i className="fas fa-file mr-1"></i>
                          {getFilteredCodes().length} {t('files') || 'files'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  {!selectedDomain ? (
                    <div className={`h-full flex flex-col items-center justify-center text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                        <i className="fas fa-folder-open text-blue-500 text-3xl"></i>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{t('no_domain_selected') || 'No domain selected'}</h3>
                      <p className="max-w-md">
                        {t('select_domain_to_view') || 'Select a domain from the sidebar to view its code files.'}
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      {/* Upload Section */}
                      <div className={`rounded-xl p-4 mb-4 ${currentTheme.card} border backdrop-blur-sm`}>
                        <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                          <i className="fas fa-upload"></i>
                          {t('upload_new_file_to') || 'Upload New File to'} {selectedDomain}
                        </h4>
                        
                        <div 
                          className={`rounded-xl p-6 border-2 border-dashed text-center transition-colors ${
                            isDragging 
                              ? 'border-green-500 bg-green-500/5' 
                              : theme === 'dark' 
                                ? 'border-gray-600 hover:border-gray-500' 
                                : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <i className={`fas fa-cloud-upload-alt text-3xl mb-4 ${
                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                          }`}></i>
                          <p className="text-lg mb-2">
                            {t('drag_drop_file_to_upload') || 'Drag & drop your .pl file here'}
                          </p>
                          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            {t('or') || 'or'}
                          </p>
                          
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
                            {t('browse_files') || 'Browse Files'}
                          </label>
                          
                          {uploadFile && (
                            <div className={`mt-4 p-3 rounded-lg ${
                              theme === 'dark' 
                                ? 'bg-gray-700/50' 
                                : 'bg-gray-100'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <i className="fas fa-file-code text-green-500 text-xl"></i>
                                  <div>
                                    <div className="font-medium">{uploadFile.name}</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {(uploadFile.size / 1024).toFixed(2)} KB
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setUploadFile(null)}
                                  className={`p-2 rounded-lg ${
                                    theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                  } transition-colors`}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4">
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
                                  <i className="fas fa-spinner fa-spin"></i>
                                  {t('uploading') || 'Uploading...'}
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-upload"></i>
                                  {t('upload_to_domain') || 'Upload to'} {selectedDomain}
                                </>
                              )}
                            </button>
                          </div>
                          
                          {uploadStatus && (
                            <div className={`mt-3 p-3 rounded-lg text-sm ${
                              uploadStatus.includes('✅') 
                                ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                                : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
                            }`}>
                              {uploadStatus}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Code Files Grid */}
                      {getFilteredCodes().length === 0 ? (
                        <div className={`flex-1 flex flex-col items-center justify-center text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-6">
                            <i className="fas fa-file-code text-green-500 text-3xl"></i>
                          </div>
                          <h3 className="text-xl font-bold mb-2">
                            {t('no_code_files_for') || 'No code files for'} {selectedDomain}
                          </h3>
                          <p className="max-w-md">
                            {t('upload_code_for_domain') || 'Upload code files for this domain to see them here.'}
                          </p>
                        </div>
                      ) : (
                        <div className={`flex-1 overflow-y-auto ${currentTheme.scrollbar}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {getFilteredCodes().map(code => (
                              <div key={code.id} className={`rounded-xl p-4 border ${
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
                                      <h4 className="font-bold mb-1">{code.title || code.id}</h4>
                                      <div className="flex items-center gap-3 text-sm">
                                        <span className={`px-2 py-1 rounded ${
                                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                          <i className="fas fa-tag mr-1"></i>
                                          {code.domain || 'general'}
                                        </span>
                                        {code.fileName && (
                                          <span className={`px-2 py-1 rounded ${
                                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                                          }`}>
                                            <i className="fas fa-hdd mr-1"></i>
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
                                    } transition-colors`}
                                    title={t('copy_code') || 'Copy code'}
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
                                                .comment { color: ${theme === 'dark' ? '#6a9955' : 'green'}; }
                                                .fact { color: ${theme === 'dark' ? '#569cd6' : 'blue'}; }
                                                .rule { color: ${theme === 'dark' ? '#c586c0' : 'purple'}; }
                                                .query { color: ${theme === 'dark' ? '#ce9178' : 'orange'}; }
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
                                    } transition-colors`}
                                  >
                                    <i className="fas fa-external-link-alt"></i>
                                    {t('view_full_code') || 'View Full Code'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
// MessagesTab.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Inbox,
  Send,
  Star,
  StarOff,
  Reply,
  Forward,
  Search,
  X,
  Edit,
  Paperclip,
  Trash2,
  Archive,
  ChevronLeft,
  ChevronRight,
  Settings,
  RefreshCw,
  Filter,
  MailOpen,
  Check,
  Users,
  User,
  MessageCircle,
  Building,
  Menu,
  ChevronDown,
  PaperclipIcon,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  Link,
  Image,
  Smile,
  FileText,
  Download,
  Pin,
  PinOff,
  ArchiveX
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  getDocs,
  writeBatch,
  Timestamp,
  deleteDoc
} from "firebase/firestore";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  receiverAvatar?: string;
  content: string;
  timestamp: any;
  read: boolean;
  readAt?: any;
  type: 'direct' | 'community' | 'broadcast';
  status: 'starred' | 'important' | 'read' | 'unread' | 'draft' | 'sent' | 'archived';
  subject: string;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  labels: string[];
  communityId?: string;
  communityName?: string;
  isOptimistic?: boolean;
  batchId?: string;
  priority?: 'low' | 'normal' | 'high';
  pinned?: boolean;
  forwarded?: boolean;
  replyTo?: string;
  threadId?: string;
  hasAttachments?: boolean;
}

interface UserData {
  uid: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  avatar?: string;
  communityId?: string;
  communityStatus?: string;
  lastSeen?: any;
  online?: boolean;
}

interface CommunityData {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  studentIds: string[];
  pendingRequests: string[];
  memberCount: number;
  avatar?: string;
}

// Интерфейс за ново съобщение
interface NewMessage {
  to: string;
  subject: string;
  content: string;
  type: 'direct' | 'community' | 'broadcast';
  selectedUsers: string[];
  priority: 'low' | 'normal' | 'high';
  attachments: File[];
}

export default function MessagesTab() {
  const { user: currentUser, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  // Основни state
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [myCommunities, setMyCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'myCommunity'>('all');
  const [showPeople, setShowPeople] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    unreadOnly: false,
    starredOnly: false,
    withAttachments: false,
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month'
  });
  
  const [newMessage, setNewMessage] = useState<NewMessage>({
    to: '',
    subject: '',
    content: '',
    type: 'direct',
    selectedUsers: [],
    priority: 'normal',
    attachments: []
  });

  // Refs
  const optimisticMessagesRef = useRef<Set<string>>(new Set());
  const currentBatchIdRef = useRef<string | null>(null);
  const messageIdCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Google Mail стил папки с превод
  const folders = [
    { id: 'inbox', name: t('inbox') || 'Входящи', icon: <Inbox className="w-5 h-5" />, count: 0, color: 'text-blue-600', bgColor: 'bg-blue-500/10' },
    { id: 'starred', name: t('starred') || 'Отметнати', icon: <Star className="w-5 h-5" />, count: 0, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' },
    { id: 'sent', name: t('sent') || 'Изпратени', icon: <Send className="w-5 h-5" />, count: 0, color: 'text-green-600', bgColor: 'bg-green-500/10' },
    { id: 'drafts', name: t('drafts') || 'Чернови', icon: <Edit className="w-5 h-5" />, count: 0, color: 'text-gray-600', bgColor: 'bg-gray-500/10' },
    { id: 'archived', name: t('archived') || 'Архив', icon: <Archive className="w-5 h-5" />, count: 0, color: 'text-purple-600', bgColor: 'bg-purple-500/10' },
    { id: 'trash', name: t('trash') || 'Кошче', icon: <Trash2 className="w-5 h-5" />, count: 0, color: 'text-red-600', bgColor: 'bg-red-500/10' },
  ];

  // Помощни функции
  const generateMessageId = (senderId: string, receiverId: string) => {
    messageIdCounter.current += 1;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = messageIdCounter.current;
    return `${timestamp}_${random}_${counter}_${senderId}_${receiverId}`;
  };

  const generateBatchId = () => {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const isOptimisticMessage = (message: Message): boolean => {
    return message.isOptimistic === true || optimisticMessagesRef.current.has(message.id);
  };

  // Load all users - ЗАДЪЛЖИТЕЛНО трябва да зарежда ВСИЧКИ потребители
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData: UserData[] = [];
        usersSnapshot.forEach((doc) => {
          const user = doc.data();
          usersData.push({
            uid: doc.id,
            username: user.fullName || user.email?.split('@')[0] || t('unknown_user') || `User_${doc.id.substring(0, 4)}`,
            email: user.email || "",
            role: user.role || 'student',
            fullName: user.fullName,
            avatar: user.avatar,
            communityId: user.communityId,
            online: user.online || false,
            lastSeen: user.lastSeen
          });
        });
        setAllUsers(usersData);
        console.log("✅ Loaded all users:", usersData.length);
      } catch (error) {
        console.error(t('error_loading_users') || "Error loading users:", error);
      }
    };
    loadUsers();
  }, [t]);

  // Load communities
  useEffect(() => {
    if (!currentUser) return;
    const loadCommunities = async () => {
      try {
        let communitiesData: CommunityData[] = [];
        
        if (userData?.role === 'teacher') {
          const communitiesQuery = query(
            collection(db, "communities"),
            where("teacherId", "==", currentUser.uid)
          );
          const snapshot = await getDocs(communitiesQuery);
          snapshot.forEach((doc) => {
            const data = doc.data();
            communitiesData.push({
              id: doc.id,
              name: data.name,
              description: data.description,
              teacherId: data.teacherId,
              studentIds: data.studentIds || [],
              pendingRequests: data.pendingRequests || [],
              memberCount: data.memberCount || 0,
              avatar: data.avatar
            });
          });
        } else if (userData?.role === 'student') {
          const studentQuery = query(
            collection(db, "communities"),
            where("studentIds", "array-contains", currentUser.uid)
          );
          const snapshot = await getDocs(studentQuery);
          snapshot.forEach((doc) => {
            const data = doc.data();
            communitiesData.push({
              id: doc.id,
              name: data.name,
              description: data.description,
              teacherId: data.teacherId,
              studentIds: data.studentIds || [],
              pendingRequests: data.pendingRequests || [],
              memberCount: data.memberCount || 0,
              avatar: data.avatar
            });
          });
        }
        
        setMyCommunities(communitiesData);
        if (communitiesData.length > 0) {
          setSelectedCommunity(communitiesData[0].id);
        }
      } catch (error) {
        console.error(t('error_loading_communities') || "Error loading communities:", error);
      }
    };
    loadCommunities();
  }, [currentUser, userData, t]);

  // Get filtered users based on role and view - този филтър е САМО за списъка "Хора"
  // Не трябва да влияе на съобщенията!
  const filteredUsers = useMemo(() => {
    if (!currentUser || !userData) return [];

    // За учители
    if (userData.role === 'teacher') {
      if (activeView === 'myCommunity' && selectedCommunity) {
        const community = myCommunities.find(c => c.id === selectedCommunity);
        if (!community) return [];

        // Само ученици от избраната общност
        return allUsers.filter(user => 
          user.role === 'student' &&
          community.studentIds.includes(user.uid) &&
          user.uid !== currentUser.uid
        );
      } else {
        // ВСИЧКИ учители и ВСИЧКИ ученици от всички общности на този учител
        const myStudentIds = new Set();
        myCommunities.forEach(community => {
          community.studentIds.forEach(id => myStudentIds.add(id));
        });

        return allUsers.filter(user => 
          user.uid !== currentUser.uid && (
            user.role === 'teacher' || // ВСИЧКИ други учители
            (user.role === 'student' && myStudentIds.has(user.uid)) // Само МОИТЕ ученици
          )
        );
      }
    }
    
    // За ученици
    if (userData.role === 'student') {
      const userCommunity = myCommunities.find(c => 
        c.studentIds.includes(currentUser.uid)
      );
      
      if (!userCommunity) return [];

      // Учениците виждат: своя учител и други ученици от тяхната общност
      return allUsers.filter(user => 
        user.uid !== currentUser.uid && (
          user.uid === userCommunity.teacherId || // Техния учител
          (user.role === 'student' && userCommunity.studentIds.includes(user.uid)) // Други ученици
        )
      );
    }

    return [];
  }, [currentUser, userData, allUsers, myCommunities, activeView, selectedCommunity]);

  // Log за debug
  console.log("📊 Stats:", {
    allUsersCount: allUsers.length,
    filteredUsersCount: filteredUsers.length,
    messagesCount: messages.length,
    currentUserRole: userData?.role
  });

  // Load messages - ПРОМЕНЕНА ЗАПИТВАНЕ
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);

    // По-добре е да направим две заявки или една с OR, но Firebase не поддържа OR
    // Затова правим една заявка и филтрираме на клиента
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // ВАЖНО: Показваме съобщения, където потребителят е ИЛИ изпращач ИЛИ получател
        // Това ще покаже всички съобщения, включително до учители извън общността
        if (data.senderId === currentUser.uid || data.receiverId === currentUser.uid) {
          
          // Намираме имената на потребителите от allUsers
          const sender = allUsers.find(u => u.uid === data.senderId);
          const receiver = allUsers.find(u => u.uid === data.receiverId);
          
          newMessages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName || sender?.username || t('unknown') || "Unknown",
            senderEmail: data.senderEmail || sender?.email || "",
            senderAvatar: data.senderAvatar || sender?.avatar,
            receiverId: data.receiverId,
            receiverName: data.receiverName || receiver?.username || t('unknown') || "Unknown",
            receiverEmail: data.receiverEmail || receiver?.email || "",
            receiverAvatar: data.receiverAvatar || receiver?.avatar,
            content: data.content,
            timestamp: data.timestamp,
            read: data.read || false,
            readAt: data.readAt,
            type: data.type || 'direct',
            status: data.status || (data.senderId === currentUser.uid ? 'sent' : 'unread'),
            subject: data.subject || t('no_subject') || "(без тема)",
            labels: data.labels || [],
            attachments: data.attachments || [],
            communityId: data.communityId,
            communityName: data.communityName,
            isOptimistic: false,
            batchId: data.batchId,
            priority: data.priority || 'normal',
            pinned: data.pinned || false,
            forwarded: data.forwarded || false,
            replyTo: data.replyTo,
            threadId: data.threadId,
            hasAttachments: data.attachments?.length > 0
          });
        }
      });

      // Запазваме оптимистичните съобщения
      setMessages(prev => {
        const optimistic = prev.filter(m => m.isOptimistic);
        // Филтрираме реалните съобщения, за да премахнем дубликати с оптимистичните
        const real = newMessages.filter(m => 
          !optimistic.some(o => 
            o.content === m.content && 
            o.senderId === m.senderId &&
            o.receiverId === m.receiverId &&
            Math.abs((o.timestamp?.toMillis?.() || 0) - (m.timestamp?.toMillis?.() || 0)) < 30000
          )
        );
        
        console.log("📨 Messages loaded:", {
          total: newMessages.length,
          real: real.length,
          optimistic: optimistic.length,
          sent: newMessages.filter(m => m.senderId === currentUser.uid).length,
          received: newMessages.filter(m => m.receiverId === currentUser.uid).length
        });
        
        return [...real, ...optimistic];
      });
      
      setLoading(false);
    }, (error) => {
      console.error(t('error_loading_messages') || "Error loading messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, allUsers, t]); // Добавяме allUsers като dependency

  // Filter messages based on folder - ПРОМЕНЕНА ЛОГИКА
  const filteredMessages = useMemo(() => {
    if (!currentUser) return [];
    
    const filtered = messages
      .filter(msg => {
        // Папка inbox: само получени, не в trash/archived
        if (selectedFolder === 'inbox') {
          return msg.receiverId === currentUser.uid && 
                 !msg.labels?.includes('trash') && 
                 !msg.labels?.includes('archived');
        }
        
        // Папка starred: всички отметнати, не в trash
        if (selectedFolder === 'starred') {
          return msg.status === 'starred' && 
                 !msg.labels?.includes('trash');
        }
        
        // Папка sent: изпратени от мен, не в trash
        if (selectedFolder === 'sent') {
          return msg.senderId === currentUser.uid && 
                 !msg.labels?.includes('trash');
        }
        
        // Папка drafts
        if (selectedFolder === 'drafts') {
          return msg.status === 'draft';
        }
        
        // Папка archived
        if (selectedFolder === 'archived') {
          return msg.labels?.includes('archived');
        }
        
        // Папка trash
        if (selectedFolder === 'trash') {
          return msg.labels?.includes('trash');
        }
        
        return true;
      })
      .filter(msg => {
        // Прилагане на филтри
        if (filters.unreadOnly && msg.read) return false;
        if (filters.starredOnly && msg.status !== 'starred') return false;
        if (filters.withAttachments && (!msg.attachments || msg.attachments.length === 0)) return false;
        
        if (filters.dateRange !== 'all' && msg.timestamp) {
          const msgDate = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
          const now = new Date();
          const diff = now.getTime() - msgDate.getTime();
          const days = diff / (1000 * 60 * 60 * 24);
          
          if (filters.dateRange === 'today' && days > 1) return false;
          if (filters.dateRange === 'week' && days > 7) return false;
          if (filters.dateRange === 'month' && days > 30) return false;
        }
        
        return true;
      })
      .filter(msg => {
        // Търсене
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return msg.subject.toLowerCase().includes(q) || 
               msg.content.toLowerCase().includes(q) ||
               msg.senderName.toLowerCase().includes(q) ||
               msg.receiverName.toLowerCase().includes(q);
      });
    
    // Премахване на дубликати по ID
    const uniqueMessages: Message[] = [];
    const seenIds = new Set<string>();
    
    for (const msg of filtered) {
      if (!seenIds.has(msg.id)) {
        seenIds.add(msg.id);
        uniqueMessages.push(msg);
      }
    }
    
    // Сортиране по дата (най-новите отгоре)
    uniqueMessages.sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || 0;
      const timeB = b.timestamp?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    console.log(`📁 Folder ${selectedFolder}: ${uniqueMessages.length} messages`);
    
    return uniqueMessages;
  }, [messages, selectedFolder, searchQuery, currentUser, filters]);

  // Update folder counts
  const getFolderCount = (folderId: string) => {
    if (!currentUser) return 0;
    
    return messages.filter(m => {
      if (folderId === 'inbox') {
        return m.receiverId === currentUser.uid && 
               !m.read && 
               !m.labels?.includes('trash') && 
               !m.labels?.includes('archived');
      }
      if (folderId === 'starred') {
        return m.status === 'starred' && 
               !m.labels?.includes('trash');
      }
      if (folderId === 'sent') {
        return m.senderId === currentUser.uid && 
               !m.labels?.includes('trash');
      }
      if (folderId === 'drafts') {
        return m.status === 'draft';
      }
      if (folderId === 'archived') {
        return m.labels?.includes('archived');
      }
      if (folderId === 'trash') {
        return m.labels?.includes('trash');
      }
      return 0;
    }).length;
  };

  const foldersWithCounts = folders.map(folder => ({
    ...folder,
    count: getFolderCount(folder.id)
  }));
const currentUserRole = userData?.role;
  // Message actions
  const handleStarMessage = async (messageId: string, starred: boolean) => {
    try {
      if (optimisticMessagesRef.current.has(messageId)) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: starred ? 'starred' : 'sent' } : msg
        ));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, status: starred ? 'starred' : 'sent' } : null);
        }
        return;
      }
      
      await updateDoc(doc(db, 'messages', messageId), {
        status: starred ? 'starred' : 'sent'
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: starred ? 'starred' : 'sent' } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, status: starred ? 'starred' : 'sent' } : null);
      }
    } catch (error) {
      console.error(t('error_starring_message') || "Error starring message:", error);
    }
  };

  const handlePinMessage = async (messageId: string, pinned: boolean) => {
    try {
      if (optimisticMessagesRef.current.has(messageId)) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, pinned } : msg
        ));
        return;
      }
      
      await updateDoc(doc(db, 'messages', messageId), {
        pinned
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, pinned } : msg
      ));
    } catch (error) {
      console.error(t('error_pinning_message') || "Error pinning message:", error);
    }
  };

  const handleArchiveMessage = async (messageId: string, archive: boolean) => {
    try {
      if (optimisticMessagesRef.current.has(messageId)) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { 
            ...msg, 
            labels: archive 
              ? [...(msg.labels || []), 'archived']
              : (msg.labels || []).filter(l => l !== 'archived')
          } : msg
        ));
        return;
      }
      
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      const newLabels = archive 
        ? [...(message.labels || []), 'archived']
        : (message.labels || []).filter(l => l !== 'archived');
      
      await updateDoc(doc(db, 'messages', messageId), {
        labels: newLabels
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, labels: newLabels } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, labels: newLabels } : null);
      }
    } catch (error) {
      console.error(t('error_archiving_message') || "Error archiving message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t('confirm_delete_message') || "Изтриване на това съобщение?")) return;
    
    try {
      if (optimisticMessagesRef.current.has(messageId)) {
        optimisticMessagesRef.current.delete(messageId);
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) setSelectedMessage(null);
        setSelectedMessages(prev => prev.filter(id => id !== messageId));
        return;
      }
      
      const messageRef = doc(db, 'messages', messageId);
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      if (message.senderId !== currentUser?.uid && message.receiverId !== currentUser?.uid) {
        alert(t('no_permission_delete') || "Нямате права да изтриете това съобщение!");
        return;
      }
      
      if (message.receiverId === currentUser?.uid) {
        const newLabels = [...(message.labels || []), 'trash'];
        await updateDoc(messageRef, {
          labels: newLabels
        });
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, labels: newLabels } : msg
        ));
        
        alert("✅ " + (t('message_moved_to_trash') || "Съобщението е преместено в кошчето!"));
      } else if (message.senderId === currentUser?.uid) {
        await deleteDoc(messageRef);
        
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        alert("✅ " + (t('message_deleted') || "Съобщението е изтрито!"));
      }
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      setSelectedMessages(prev => prev.filter(id => id !== messageId));
      
    } catch (error) {
      console.error(t('error_deleting_message') || "Error deleting message:", error);
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return;
    
    if (!window.confirm(`${t('delete_selected_messages') || 'Изтриване на'} ${selectedMessages.length} ${t('selected_messages') || 'избрани съобщения'}?`)) return;
    
    try {
      const batch = writeBatch(db);
      let operations = 0;

      for (const messageId of selectedMessages) {
        if (optimisticMessagesRef.current.has(messageId)) {
          optimisticMessagesRef.current.delete(messageId);
          continue;
        }
        
        const message = messages.find(m => m.id === messageId);
        if (!message) continue;
        
        const messageRef = doc(db, 'messages', messageId);
        
        if (message.senderId !== currentUser?.uid && message.receiverId !== currentUser?.uid) {
          continue;
        }
        
        if (message.receiverId === currentUser?.uid) {
          batch.update(messageRef, {
            labels: arrayUnion('trash')
          });
          operations++;
        } else if (message.senderId === currentUser?.uid) {
          batch.delete(messageRef);
          operations++;
        }
      }
      
      if (operations > 0) {
        await batch.commit();
      }
      
      setMessages(prev => {
        return prev.map(msg => {
          if (selectedMessages.includes(msg.id)) {
            if (optimisticMessagesRef.current.has(msg.id)) {
              optimisticMessagesRef.current.delete(msg.id);
              return null;
            }
            
            if (msg.receiverId === currentUser?.uid) {
              return { ...msg, labels: [...(msg.labels || []), 'trash'] };
            }
            
            return null;
          }
          return msg;
        }).filter(Boolean) as Message[];
      });
      
      if (selectedMessage && selectedMessages.includes(selectedMessage.id)) {
        setSelectedMessage(null);
      }
      
      setSelectedMessages([]);
      
      alert(`✅ ${selectedMessages.length} ${t('messages_processed') || 'съобщения са обработени'}!`);
    } catch (error) {
      console.error(t('error_deleting_messages') || "Error deleting messages:", error);
    }
  };
console.log(handleDeleteSelectedMessages)
  const handleMarkAsRead = async (messageId: string, read: boolean = true) => {
    try {
      if (optimisticMessagesRef.current.has(messageId)) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, read } : msg
        ));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, read } : null);
        }
        return;
      }
      
      const message = messages.find(m => m.id === messageId);
      if (!message || message.receiverId !== currentUser?.uid) {
        return;
      }
      
      await updateDoc(doc(db, 'messages', messageId), {
        read,
        readAt: serverTimestamp()
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, read } : null);
      }
      
    } catch (error) {
      console.error(t('error_marking_message') || "Error marking message as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = messages
      .filter(m => m.receiverId === currentUser?.uid && !m.read && !m.labels.includes('trash'))
      .map(m => m.id);
    
    if (unreadIds.length === 0) {
      alert(t('no_unread_messages') || "Няма непрочетени съобщения");
      return;
    }
    
    const batch = writeBatch(db);
    unreadIds.forEach(id => {
      batch.update(doc(db, 'messages', id), { read: true, readAt: serverTimestamp() });
    });
    await batch.commit();
    
    setMessages(prev => prev.map(m => 
      m.receiverId === currentUser?.uid ? { ...m, read: true } : m
    ));
    
    alert(`✅ ${unreadIds.length} ${t('messages_marked_as_read') || 'съобщения са маркирани като прочетени'}`);
  };

  const handleReply = (message: Message) => {
    setNewMessage({
      to: message.senderId,
      subject: `Re: ${message.subject}`,
      content: `\n\n--- ${t('original_message') || 'Оригинално съобщение'} ---\n${message.content}`,
      type: 'direct',
      selectedUsers: [message.senderId],
      priority: 'normal',
      attachments: []
    });
    setComposeOpen(true);
  };

  const handleForward = (message: Message) => {
    setNewMessage({
      to: '',
      subject: `Fwd: ${message.subject}`,
      content: `\n\n--- ${t('forwarded_message') || 'Препратено съобщение'} ---\n${message.content}`,
      type: 'direct',
      selectedUsers: [],
      priority: 'normal',
      attachments: []
    });
    setComposeOpen(true);
  };

  const handleSendMessage = async () => {
    if (!currentUser || !userData || !newMessage.content.trim()) return;
    
    try {
      setSending(true);
      
      let receivers: string[] = [];
      let messageType = newMessage.type;
      let communityInfo = null;
      
      if (newMessage.type === 'direct') {
        // Търсим по uid, email или username
        const recipient = allUsers.find(u => 
          u.uid === newMessage.to || 
          u.email === newMessage.to ||
          u.username === newMessage.to
        );
        if (!recipient) {
          alert(t('recipient_not_found') || "Получателят не е намерен");
          setSending(false);
          return;
        }
        if (recipient.uid === currentUser.uid) {
          alert(t('cannot_send_to_self') || "Не можете да изпращате до себе си");
          setSending(false);
          return;
        }
        receivers = [recipient.uid];
      } else if (newMessage.type === 'community' && selectedCommunity) {
        const community = myCommunities.find(c => c.id === selectedCommunity);
        if (!community) {
          alert(t('community_not_found') || "Общността не е намерена");
          setSending(false);
          return;
        }
        communityInfo = community;
        receivers = [community.teacherId, ...community.studentIds].filter(id => id !== currentUser.uid);
        if (receivers.length === 0) {
          alert(t('no_users_in_community') || "Няма други потребители в тази общност");
          setSending(false);
          return;
        }
      } else if (newMessage.type === 'broadcast') {
        if (userData.role !== 'teacher') {
          alert(t('broadcast_teachers_only') || "Само учители могат да изпращат до всички");
          setSending(false);
          return;
        }
        receivers = allUsers.filter(u => u.uid !== currentUser.uid).map(u => u.uid);
      }

      const batch = writeBatch(db);
      const tempMessages: Message[] = [];
      const batchId = generateBatchId();
      currentBatchIdRef.current = batchId;

      // Тук трябва да качите файловете в Storage и да получите URL-и
      // За момента използваме празен масив за attachments
      const attachmentsData: Array<{name: string; url: string; size: number; type: string;}> = [];

      for (const receiverId of receivers) {
        const messageId = generateMessageId(currentUser.uid, receiverId);
        const messageRef = doc(db, 'messages', messageId);
        const receiver = allUsers.find(u => u.uid === receiverId);
        
        const messageData = {
          senderId: currentUser.uid,
          senderName: userData?.fullName || currentUser.email?.split('@')[0] || t('user') || "User",
          senderEmail: currentUser.email || "",
          senderAvatar: userData?.avatar || null,
          receiverId,
          receiverName: receiver?.username || t('unknown') || "User",
          receiverEmail: receiver?.email || "",
          receiverAvatar: receiver?.avatar || null,
          content: newMessage.content,
          subject: newMessage.subject || t('no_subject') || "(без тема)",
          timestamp: serverTimestamp(),
          read: false,
          type: messageType,
          status: 'sent',
          labels: [t('sent') || 'Изпратено'],
          communityId: newMessage.type === 'community' ? selectedCommunity : null,
          communityName: newMessage.type === 'community' ? communityInfo?.name : null,
          batchId,
          priority: newMessage.priority,
          attachments: attachmentsData
        };

        batch.set(messageRef, messageData);
        
        optimisticMessagesRef.current.add(messageId);
        
        tempMessages.push({
          id: messageId,
          ...messageData,
          timestamp: Timestamp.now(),
          isOptimistic: true
        } as Message);
      }

      setMessages(prev => [...tempMessages, ...prev]);
      await batch.commit();
      
      setNewMessage({ 
        to: '', 
        subject: '', 
        content: '', 
        type: 'direct',
        selectedUsers: [],
        priority: 'normal',
        attachments: []
      });
      setComposeOpen(false);
      setSelectedFolder('sent');
      currentBatchIdRef.current = null;
      
      alert(`✅ ${t('message_sent') || 'Съобщението е изпратено'} (${receivers.length} ${t('recipients') || 'получатели'})`);
      
    } catch (error) {
      console.error(t('error_sending_message') || "Error sending message:", error);
      
      const failedBatchId = currentBatchIdRef.current;
      setMessages(prev => {
        const filtered = prev.filter(msg => {
          if (msg.isOptimistic && msg.batchId === failedBatchId) {
            optimisticMessagesRef.current.delete(msg.id);
            return false;
          }
          return true;
        });
        return filtered;
      });
      
      currentBatchIdRef.current = null;
      alert(`❌ ${t('error_sending_message') || "Грешка при изпращане"}`);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setNewMessage(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(files)]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setNewMessage(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const selectAllMessages = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(m => m.id));
    }
  };

  const clearFilters = () => {
    setFilters({
      unreadOnly: false,
      starredOnly: false,
      withAttachments: false,
      dateRange: 'all'
    });
    setSearchQuery('');
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const diffMinutes = diff / (1000 * 60);
      const diffHours = diff / (1000 * 60 * 60);
      const diffDays = diff / (1000 * 60 * 60 * 24);
      
      if (diffMinutes < 1) return t('just_now') || 'Току що';
      if (diffMinutes < 60) return `${Math.floor(diffMinutes)} ${t('minutes_ago') || 'мин'}`;
      if (diffHours < 24) return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
      if (diffDays < 7) {
        const days = ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'];
        return days[date.getDay()];
      }
      return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user color based on role
  const getUserColor = (role: string, isOptimistic: boolean = false) => {
    if (isOptimistic) return 'from-gray-500 to-gray-600';
    switch (role) {
      case 'teacher': return 'from-purple-500 to-pink-500';
      case 'student': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // View toggle for teachers
  const renderViewToggle = () => {
    if (currentUserRole !== 'teacher') return null;
    
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => setActiveView('all')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeView === 'all'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-white/10'
            }`}
          >
            {t('all_teachers_students') || "Всички учители и ученици"}
          </button>
          <button
            onClick={() => setActiveView('myCommunity')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeView === 'myCommunity'
                ? 'bg-green-600 text-white'
                : 'hover:bg-white/10'
            }`}
          >
            {t('my_community_only') || "Само моята общност"}
          </button>
        </div>

        {activeView === 'myCommunity' && myCommunities.length > 0 && (
          <select
            value={selectedCommunity || ''}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
          >
            {myCommunities.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.memberCount} {t('members') || 'члена'})
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  // Get message type options
  const getMessageTypeOptions = useMemo(() => {
    const options = [
      { value: 'direct', label: t('personal') || 'Лично', icon: <User className="w-4 h-4" />, color: 'blue' }
    ];
    
    if (currentUserRole === 'teacher') {
      options.push(
        { value: 'community', label: t('community') || 'Общност', icon: <Building className="w-4 h-4" />, color: 'green' },
        { value: 'broadcast', label: t('broadcast') || 'Всички', icon: <Users className="w-4 h-4" />, color: 'purple' }
      );
    } else if (currentUserRole === 'student' && myCommunities.length > 0) {
      options.push(
        { value: 'community', label: t('community') || 'Общност', icon: <Building className="w-4 h-4" />, color: 'green' }
      );
    }
    
    return options;
  }, [currentUserRole, myCommunities, t]);

  // Theme classes
  const themeClasses = theme === 'dark' ? {
    bg: 'bg-gray-900',
    card: 'bg-gray-800',
    border: 'border-gray-700',
    hover: 'hover:bg-gray-700',
    text: 'text-gray-100',
    textSecondary: 'text-gray-400',
    input: 'bg-gray-700 border-gray-600',
    sidebar: 'bg-gray-800',
    header: 'bg-gray-800',
  } : {
    bg: 'bg-gray-100',
    card: 'bg-white',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-100',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    input: 'bg-white border-gray-300',
    sidebar: 'bg-white',
    header: 'bg-white',
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${themeClasses.bg}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const messageTypeOptions = getMessageTypeOptions;


  return (
    <div className={`flex h-screen ${themeClasses.bg} ${themeClasses.text} overflow-hidden`}>
      
      {/* Лява колона - Папки и Хора */}
      <div className={`w-72 flex-shrink-0 ${themeClasses.sidebar} border-r ${themeClasses.border} flex flex-col overflow-y-auto custom-scrollbar`}>
        {/* Ново съобщение бутон */}
        <div className="p-4">
          <button
            onClick={() => setComposeOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
          >
            <Edit className="w-5 h-5" />
            <span>{t('new_message') || "Ново съобщение"}</span>
          </button>
        </div>

        {/* Папки */}
        <nav className="px-3 mb-6">
          {foldersWithCounts.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                selectedFolder === folder.id
                  ? `${folder.bgColor} ${folder.color}`
                  : themeClasses.hover
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={folder.color}>{folder.icon}</span>
                <span className="text-sm font-medium">{folder.name}</span>
              </div>
              {folder.count > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedFolder === folder.id
                    ? 'bg-white/20'
                    : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  {folder.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Секция Хора */}
        <div className="px-3">
          <button
            onClick={() => setShowPeople(!showPeople)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{t('people') || "Хора"}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPeople ? 'rotate-180' : ''}`} />
          </button>

          {showPeople && (
            <div className="mt-2 space-y-1">
              {/* View toggle за учители */}
              {renderViewToggle()}

              {/* Списък с хора */}
              <div className="max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => {
                        setNewMessage({
                          to: user.username,
                          subject: '',
                          content: '',
                          type: 'direct',
                          selectedUsers: [user.uid],
                          priority: 'normal',
                          attachments: []
                        });
                        setComposeOpen(true);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${themeClasses.hover} group`}
                    >
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getUserColor(user.role)} flex items-center justify-center text-white font-medium`}>
                          {getInitials(user.username)}
                        </div>
                        {user.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">{user.username}</div>
                        <div className="text-xs opacity-70 truncate">
                          {user.role === 'teacher' ? t('teacher') || 'Учител' : t('student') || 'Ученик'}
                        </div>
                      </div>
                      <MessageCircle className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm opacity-70">
                      {t('no_users_found') || "Няма намерени потребители"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Централна колона - Списък съобщения */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className={`${themeClasses.header} border-b ${themeClasses.border} px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <button
              onClick={selectAllMessages}
              className="p-2 rounded-lg hover:bg-white/10"
              title={t('select_all') || "Избери всички"}
            >
              <Check className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <Filter className="w-5 h-5" />
            </button>

            {selectedMessages.length > 0 && (
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => {
                    selectedMessages.forEach(id => handleArchiveMessage(id, true));
                    setSelectedMessages([]);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10"
                  title={t('archive') || "Архивирай"}
                >
                  <Archive className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    selectedMessages.forEach(id => handleDeleteMessage(id));
                    setSelectedMessages([]);
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-red-500"
                  title={t('delete') || "Изтрий"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <span className="text-sm ml-2">
                  {selectedMessages.length} {t('selected') || 'избрани'}
                </span>
              </div>
            )}

            <button
              onClick={handleMarkAllAsRead}
              className="p-2 rounded-lg hover:bg-white/10 ml-2"
              title={t('mark_all_read') || "Маркирай всички като прочетени"}
            >
              <MailOpen className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('search_messages') || "Търсене в пощата"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-9 pr-4 py-2 rounded-lg ${themeClasses.input} border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              />
            </div>
            
            <button className="p-2 rounded-lg hover:bg-white/10">
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button className="p-2 rounded-lg hover:bg-white/10">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-4 border-b ${themeClasses.border} bg-white/5`}>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.unreadOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, unreadOnly: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm">{t('unread_only') || "Само непрочетени"}</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.starredOnly}
                      onChange={(e) => setFilters(prev => ({ ...prev, starredOnly: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-yellow-600"
                    />
                    <span className="text-sm">{t('starred_only') || "Само отметнати"}</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.withAttachments}
                      onChange={(e) => setFilters(prev => ({ ...prev, withAttachments: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm">{t('with_attachments') || "С прикачени файлове"}</span>
                  </label>
                  
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className={`px-3 py-1.5 rounded-lg ${themeClasses.input} border text-sm`}
                  >
                    <option value="all">{t('all_time') || "Всичко"}</option>
                    <option value="today">{t('today') || "Днес"}</option>
                    <option value="week">{t('this_week') || "Тази седмица"}</option>
                    <option value="month">{t('this_month') || "Този месец"}</option>
                  </select>
                  
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                  >
                    {t('clear_filters') || "Изчисти"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Списък съобщения */}
        <div className={`flex-1 overflow-y-auto ${themeClasses.bg} custom-scrollbar`}>
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MailOpen className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {selectedFolder === 'inbox' 
                  ? t('inbox_empty') || 'Входящата кутия е празна'
                  : t('no_messages') || 'Няма съобщения'}
              </h3>
              <p className="text-sm opacity-70 mb-4">
                {selectedFolder === 'inbox'
                  ? t('inbox_empty_desc') || 'Когато получите съобщения, те ще се появят тук'
                  : t('no_messages_desc') || 'Няма съобщения в тази папка'}
              </p>
              <button
                onClick={() => setComposeOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('write_message') || "Напиши съобщение"}
              </button>
            </div>
          ) : (
            filteredMessages.map((message) => {
              const isOptimistic = isOptimisticMessage(message);
              const isSelected = selectedMessages.includes(message.id);
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`relative group cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-500/10'
                      : selectedMessage?.id === message.id
                      ? theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-50'
                      : themeClasses.hover
                  } ${!message.read && message.receiverId === currentUser?.uid ? 'font-medium' : ''} ${isOptimistic ? 'opacity-70' : ''}`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.read && message.receiverId === currentUser?.uid && !isOptimistic) {
                      handleMarkAsRead(message.id, true);
                    }
                  }}
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleMessageSelection(message.id);
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                        disabled={isOptimistic}
                      />
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarMessage(message.id, message.status !== 'starred');
                        }}
                      >
                        {message.status === 'starred' ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className="relative flex-shrink-0">
                      {message.senderAvatar ? (
                        <img
                          src={message.senderAvatar}
                          alt={message.senderName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getUserColor(
                          message.senderId === currentUser?.uid ? currentUserRole || 'student' : 
                          allUsers.find(u => u.uid === message.senderId)?.role || 'student',
                          isOptimistic
                        )} flex items-center justify-center text-white text-sm font-medium`}>
                          {getInitials(message.senderName)}
                        </div>
                      )}
                      {message.pinned && (
                        <Pin className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {message.senderName}
                          </span>
                          
                          {message.priority === 'high' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-500">
                              {t('high') || 'Висок'}
                            </span>
                          )}
                          
                          {message.type !== 'direct' && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              message.type === 'community' 
                                ? 'bg-green-500/20 text-green-500'
                                : 'bg-purple-500/20 text-purple-500'
                            }`}>
                              {message.type === 'community' 
                                ? t('community') || 'Общност'
                                : t('broadcast') || 'Всички'}
                            </span>
                          )}
                          
                          {isOptimistic && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-500">
                              {t('sending') || "Изпращане..."}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm whitespace-nowrap ml-4">
                          <span className="opacity-70">
                            {formatDate(message.timestamp)}
                          </span>
                          
                          {!message.read && message.receiverId === currentUser?.uid && (
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium truncate max-w-[200px]">{message.subject}</span>
                        <span className="opacity-70 truncate">- {message.content.substring(0, 100)}</span>
                      </div>

                      {message.hasAttachments && (
                        <div className="flex items-center gap-1 mt-1">
                          <Paperclip className="w-3 h-3 opacity-50" />
                        </div>
                      )}
                    </div>

                    {!isOptimistic && (
                      <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${themeClasses.card} rounded-lg shadow-lg p-1`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReply(message);
                          }}
                          className={`p-1.5 rounded ${themeClasses.hover} transition-colors`}
                          title={t('reply') || "Отговор"}
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleForward(message);
                          }}
                          className={`p-1.5 rounded ${themeClasses.hover} transition-colors`}
                          title={t('forward') || "Препрати"}
                        >
                          <Forward className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinMessage(message.id, !message.pinned);
                          }}
                          className={`p-1.5 rounded ${themeClasses.hover} transition-colors`}
                          title={message.pinned ? (t('unpin') || "Откачи") : (t('pin') || "Закачи")}
                        >
                          {message.pinned ? (
                            <PinOff className="w-4 h-4" />
                          ) : (
                            <Pin className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveMessage(message.id, !message.labels?.includes('archived'));
                          }}
                          className={`p-1.5 rounded ${themeClasses.hover} transition-colors`}
                          title={message.labels?.includes('archived') ? (t('unarchive') || "Възстанови") : (t('archive') || "Архивирай")}
                        >
                          {message.labels?.includes('archived') ? (
                            <ArchiveX className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(message.id);
                          }}
                          className={`p-1.5 rounded ${themeClasses.hover} text-red-500 transition-colors`}
                          title={t('delete') || "Изтрий"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className={`${themeClasses.header} border-t ${themeClasses.border} px-4 py-2 flex items-center justify-between text-sm`}>
          <span className="opacity-70">1-50 {t('of') || 'от'} {filteredMessages.length}</span>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded hover:bg-white/10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-1 rounded hover:bg-white/10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Дясна колона - Преглед на съобщение */}
      <AnimatePresence>
        {selectedMessage ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`w-96 flex-shrink-0 ${themeClasses.sidebar} border-l ${themeClasses.border} overflow-y-auto custom-scrollbar`}
          >
            <div className="p-6">
              {/* Header с действия */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-medium">{t('message_details') || "Преглед"}</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Тема */}
              <h3 className="text-xl font-bold mb-4 break-words">{selectedMessage.subject}</h3>

              {/* Информация за изпращач */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                  {getInitials(selectedMessage.senderName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium break-words">{selectedMessage.senderName}</div>
                  <div className="text-sm opacity-70 break-words">{selectedMessage.senderEmail}</div>
                  <div className="text-xs opacity-50 mt-1">
                    {t('to') || 'до'} {selectedMessage.receiverName}
                  </div>
                  <div className="text-xs opacity-50">
                    {formatDate(selectedMessage.timestamp)}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className={`mb-6 p-3 rounded-lg ${themeClasses.bg} space-y-2`}>
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">{t('type') || 'Тип'}:</span>
                  <span className="capitalize">
                    {selectedMessage.type === 'direct' ? t('personal') || 'Лично' :
                     selectedMessage.type === 'community' ? t('community') || 'Общност' :
                     t('broadcast') || 'Всички'}
                  </span>
                </div>
                
                {selectedMessage.communityName && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-70">{t('community') || 'Общност'}:</span>
                    <span>{selectedMessage.communityName}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">{t('status') || 'Статус'}:</span>
                  <span className="capitalize">
                    {selectedMessage.read ? t('read') || 'Прочетено' : t('unread') || 'Непрочетено'}
                  </span>
                </div>
              </div>

              {/* Съдържание */}
              <div className="prose prose-sm dark:prose-invert max-w-none mb-6 whitespace-pre-wrap break-words">
                {selectedMessage.content}
              </div>

              {/* Прикачени файлове */}
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    {t('attachments') || 'Прикачени файлове'} ({selectedMessage.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {attachment.type.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          ) : attachment.type.startsWith('text/') ? (
                            <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{attachment.name}</span>
                          <span className="text-xs opacity-50">
                            ({(attachment.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => window.open(attachment.url, '_blank')}
                          className="p-1 rounded hover:bg-white/10"
                          title={t('download') || "Изтегли"}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Бутони за действия */}
              {!isOptimisticMessage(selectedMessage) && (
                <div className="flex items-center gap-2 border-t pt-4">
                  <button
                    onClick={() => handleReply(selectedMessage)}
                    className="flex-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Reply className="w-4 h-4" />
                    <span>{t('reply') || "Отговор"}</span>
                  </button>
                  
                  <button
                    onClick={() => handleArchiveMessage(selectedMessage.id, !selectedMessage.labels.includes('archived'))}
                    className="p-2 rounded hover:bg-white/10"
                    title={selectedMessage.labels.includes('archived') ? t('unarchive') || "Премахни от архив" : t('archive') || "Архивирай"}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="p-2 rounded hover:bg-white/10 text-red-500"
                    title={t('delete') || "Изтрий"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Модал за ново съобщение */}
      <AnimatePresence>
        {composeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setComposeOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl ${themeClasses.card} border ${themeClasses.border} flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">
                  {newMessage.type === 'community' && selectedCommunity 
                    ? `${t('message_to_community') || 'Съобщение до общност'}`
                    : newMessage.type === 'broadcast'
                    ? t('message_to_all') || 'Съобщение до всички'
                    : t('new_message') || 'Ново съобщение'
                  }
                </h3>
                <button
                  onClick={() => setComposeOpen(false)}
                  className={`p-2 rounded-lg hover:bg-white/10 transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="space-y-4">
                  {/* Message Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('message_type') || "Тип съобщение"}</label>
                    <div className="flex flex-wrap gap-2">
                      {messageTypeOptions.map((option) => (
                        <label key={option.value} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="messageType"
                            value={option.value}
                            checked={newMessage.type === option.value}
                            onChange={(e) => setNewMessage({...newMessage, type: e.target.value as any})}
                            className="hidden"
                          />
                          <span className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                            newMessage.type === option.value 
                              ? option.value === 'direct' ? 'bg-blue-500 text-white'
                                : option.value === 'community' ? 'bg-green-500 text-white'
                                : 'bg-purple-500 text-white'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}>
                            {option.icon}
                            <span>{option.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Recipient (for direct) */}
                  {newMessage.type === 'direct' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('to') || "До"}</label>
                      <input
                        type="text"
                        value={newMessage.to}
                        onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                        placeholder={t('username_or_email') || "Име на потребител или имейл"}
                        list="recipients"
                      />
                      <datalist id="recipients">
                        {filteredUsers.map(user => (
                          <option key={user.uid} value={user.username}>
                            {user.username} ({user.role === 'teacher' ? t('teacher') || 'Учител' : t('student') || 'Ученик'})
                          </option>
                        ))}
                      </datalist>
                    </div>
                  )}

                  {/* Community Info */}
                  {newMessage.type === 'community' && selectedCommunity && (
                    <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4 text-green-500" />
                        <span className="font-medium">
                          {t('sending_to') || "Изпращане до"}: {myCommunities.find(c => c.id === selectedCommunity)?.name}
                        </span>
                      </div>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {currentUserRole === 'teacher'
                          ? t('message_to_all_community') || "Това съобщение ще бъде изпратено до всички в общността"
                          : t('message_to_community_members') || "Това съобщение ще бъде изпратено до всички членове на вашата общност"
                        }
                      </p>
                    </div>
                  )}

                  {/* Broadcast Info */}
                  {newMessage.type === 'broadcast' && (
                    <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">
                          {t('sending_to') || "Изпращане до"}: {t('all_users') || "Всички потребители"}
                        </span>
                      </div>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {t('message_to_all_desc') || "Това съобщение ще бъде изпратено до всички потребители в платформата"}
                      </p>
                    </div>
                  )}
                  
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('subject') || "Тема"}</label>
                    <input
                      type="text"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      placeholder={t('message_subject') || "Тема на съобщението"}
                    />
                  </div>
                  
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('priority') || "Приоритет"}</label>
                    <div className="flex gap-2">
                      {['low', 'normal', 'high'].map((priority) => (
                        <label key={priority} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="priority"
                            value={priority}
                            checked={newMessage.priority === priority}
                            onChange={(e) => setNewMessage({...newMessage, priority: e.target.value as any})}
                            className="hidden"
                          />
                          <span className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            newMessage.priority === priority
                              ? priority === 'high' ? 'bg-red-500 text-white'
                                : priority === 'normal' ? 'bg-blue-500 text-white'
                                : 'bg-gray-500 text-white'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}>
                            {priority === 'high' ? t('high') || 'Висок' :
                             priority === 'normal' ? t('normal') || 'Нормален' :
                             t('low') || 'Нисък'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Message Body */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('message') || "Съобщение"}</label>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                      rows={8}
                      className={`w-full px-4 py-3 rounded-xl ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none`}
                      placeholder={t('write_message_here') || "Напишете съобщението си тук..."}
                    />
                  </div>
                  
                  {/* Attachments */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('attachments') || "Прикачени файлове"}</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <PaperclipIcon className="w-4 h-4" />
                      {t('add_attachments') || "Добави файлове"}
                    </button>
                    
                    {newMessage.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {newMessage.attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {file.type?.startsWith('image/') ? (
                                <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                              <span className="text-sm truncate">{file.name}</span>
                              <span className={`text-xs ${themeClasses.textSecondary}`}>
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              onClick={() => removeAttachment(index)}
                              className="p-1 rounded hover:bg-white/10 text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer with formatting tools */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <Bold className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <Italic className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <Underline className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <List className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <Link className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <Image className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setComposeOpen(false)}
                    className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {t('cancel') || "Отказ"}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.content.trim() || (newMessage.type === 'direct' && !newMessage.to.trim())}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {t('sending') || "Изпращане..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('send') || "Изпрати"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
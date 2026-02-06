// MessagesTab.tsx - Коригиран за уникални ключове и разрешения
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
  EyeOff,
  Users,
  User,
  MessageCircle,
  BookOpen,
  GraduationCap,
  Building
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
  getDoc,
  Timestamp,
  deleteDoc // Добавено за изтриване
} from "firebase/firestore";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  content: string;
  timestamp: any;
  read: boolean;
  type: 'direct' | 'community' | 'broadcast';
  status: 'starred' | 'important' | 'read' | 'unread' | 'draft' | 'sent';
  subject: string;
  attachments?: string[];
  labels: string[];
  communityId?: string;
  communityName?: string;
  isOptimistic?: boolean;
  batchId?: string;
}

interface UserData {
  uid: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  communityId?: string;
  communityStatus?: string;
}

interface CommunityData {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  studentIds: string[];
  pendingRequests: string[];
  memberCount: number;
}

export default function MessagesTab() {
  const { user: currentUser, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
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
  const [activeView, setActiveView] = useState<'all' | 'myCommunity'>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: '',
    type: 'direct' as 'direct' | 'community' | 'broadcast',
    selectedUsers: [] as string[]
  });

  // Ref за следење на optimistic съобщения
  const optimisticMessagesRef = useRef<Set<string>>(new Set());
  const currentBatchIdRef = useRef<string | null>(null);
  const messageIdCounter = useRef(0); // Брояч за уникални ID

  // Folders configuration
  const folders = [
    { id: 'inbox', name: t?.('inbox') || 'Входящи', icon: <Inbox className="w-5 h-5" />, color: 'text-blue-500' },
    { id: 'starred', name: t?.('starred') || 'Отметнати', icon: <Star className="w-5 h-5" />, color: 'text-yellow-500' },
    { id: 'sent', name: t?.('sent') || 'Изпратени', icon: <Send className="w-5 h-5" />, color: 'text-green-500' },
    { id: 'drafts', name: t?.('drafts') || 'Чернови', icon: <BookOpen className="w-5 h-5" />, color: 'text-gray-500' },
    { id: 'trash', name: t?.('trash') || 'Кошче', icon: <Trash2 className="w-5 h-5" />, color: 'text-gray-500' },
  ];

  // Генериране на уникално ID за съобщение
  const generateMessageId = (senderId: string, receiverId: string) => {
    messageIdCounter.current += 1;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = messageIdCounter.current;
    
    return `${timestamp}_${random}_${counter}_${senderId}_${receiverId}`;
  };

  // Генериране на batch ID
  const generateBatchId = () => {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Load all users
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersData: UserData[] = [];
        usersSnapshot.forEach((doc) => {
          const user = doc.data();
          usersData.push({
            uid: doc.id,
            username: user.fullName || user.email?.split('@')[0] || t?.('unknown_user') || `User_${doc.id.substring(0, 6)}`,
            email: user.email || "",
            role: user.role || 'student',
            fullName: user.fullName,
            communityId: user.communityId,
            communityStatus: user.communityStatus
          });
        });
        
        setAllUsers(usersData);
      } catch (error) {
        console.error(t?.('error_loading_users') || "Error loading users:", error);
      }
    };

    loadAllUsers();
  }, [t]);

  // Load my communities based on role
  useEffect(() => {
    if (!currentUser || allUsers.length === 0) return;

    const loadMyCommunities = async () => {
      try {
        const currentUserData = allUsers.find(u => u.uid === currentUser.uid);
        const currentUserRole = currentUserData?.role;
        
        let communitiesData: CommunityData[] = [];
        
        if (currentUserRole === 'teacher') {
          // Teacher: Load communities they created
          const teacherCommunitiesQuery = query(
            collection(db, "communities"),
            where("teacherId", "==", currentUser.uid)
          );
          
          const teacherSnapshot = await getDocs(teacherCommunitiesQuery);
          
          teacherSnapshot.forEach((doc) => {
            const data = doc.data();
            communitiesData.push({
              id: doc.id,
              name: data.name,
              description: data.description,
              teacherId: data.teacherId,
              studentIds: data.studentIds || [],
              pendingRequests: data.pendingRequests || [],
              memberCount: data.memberCount || 0
            });
          });
        } else if (currentUserRole === 'student') {
          // Student: Load their community
          const currentUserData = allUsers.find(u => u.uid === currentUser.uid);
          
          if (currentUserData?.communityId) {
            // Load specific community
            const communityRef = doc(db, "communities", currentUserData.communityId);
            const communityDoc = await getDoc(communityRef);
            
            if (communityDoc.exists()) {
              const data = communityDoc.data();
              communitiesData.push({
                id: communityDoc.id,
                name: data.name,
                description: data.description,
                teacherId: data.teacherId,
                studentIds: data.studentIds || [],
                pendingRequests: data.pendingRequests || [],
                memberCount: data.memberCount || 0
              });
            }
          } else {
            // Try to find community where student is a member
            const studentCommunitiesQuery = query(
              collection(db, "communities"),
              where("studentIds", "array-contains", currentUser.uid)
            );
            
            const studentSnapshot = await getDocs(studentCommunitiesQuery);
            
            studentSnapshot.forEach((doc) => {
              const data = doc.data();
              communitiesData.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                teacherId: data.teacherId,
                studentIds: data.studentIds || [],
                pendingRequests: data.pendingRequests || [],
                memberCount: data.memberCount || 0
              });
            });
          }
        }

        setMyCommunities(communitiesData);
        
        if (communitiesData.length > 0 && !selectedCommunity) {
          setSelectedCommunity(communitiesData[0].id);
        }
      } catch (error) {
        console.error(t?.('error_loading_communities') || "Error loading communities:", error);
      }
    };

    loadMyCommunities();
  }, [currentUser, allUsers, t, selectedCommunity]);

  // Функция за идентифициране на optimistic съобщения
  const isOptimisticMessage = (message: Message): boolean => {
    return message.isOptimistic === true || optimisticMessagesRef.current.has(message.id);
  };

  // Load messages с правилна optimistic поддръжка
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    
    // Query за всички съобщения, които са свързани с текущия потребител
    const messagesQuery = query(
      collection(db, "messages"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = [];
      const messageIds = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Проверяваме дали потребителят е свързан със съобщението
        if (data.senderId === currentUser.uid || data.receiverId === currentUser.uid) {
          // Проверка за дублиране на ID
          if (messageIds.has(doc.id)) {
            console.warn("Duplicate message ID detected:", doc.id);
            return;
          }
          
          messageIds.add(doc.id);
          
          newMessages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName || t?.('unknown') || "Неизвестен",
            senderEmail: data.senderEmail || "",
            receiverId: data.receiverId,
            receiverName: data.receiverName || t?.('unknown') || "Неизвестен",
            receiverEmail: data.receiverEmail || "",
            content: data.content,
            timestamp: data.timestamp,
            read: data.read || false,
            type: data.type || 'direct',
            status: data.status || (data.senderId === currentUser.uid ? 'sent' : 'unread'),
            subject: data.subject || t?.('no_subject') || "Без тема",
            labels: data.labels || [],
            attachments: data.attachments || [],
            communityId: data.communityId,
            communityName: data.communityName,
            isOptimistic: false,
            batchId: data.batchId
          });
        }
      });

      // Актуализираме съобщенията с правилна логика за optimistic съобщения
      setMessages(prev => {
        // Филтрираме optimistic съобщения, които вече са получени
        const filteredOptimistic = prev.filter(msg => {
          if (!isOptimisticMessage(msg)) return true;
          
          // Проверяваме дали това optimistic съобщение вече е получено
          const isAlreadyReceived = newMessages.some(newMsg => {
            // Проверка по съдържание и получател/изпращач
            const contentMatch = newMsg.content === msg.content;
            const senderMatch = newMsg.senderId === msg.senderId;
            const receiverMatch = newMsg.receiverId === msg.receiverId;
            const timeDiff = Math.abs(
              (newMsg.timestamp?.toMillis?.() || 0) - 
              (msg.timestamp?.toMillis?.() || 0)
            ) < 30000; // 30 секунди толеранс
            
            return contentMatch && senderMatch && receiverMatch && timeDiff;
          });
          
          // Премахваме от ref ако е получено
          if (isAlreadyReceived) {
            optimisticMessagesRef.current.delete(msg.id);
          }
          
          return !isAlreadyReceived;
        });
        
        // Комбинираме новите съобщения с останалите optimistic
        const combined = [...newMessages, ...filteredOptimistic];
        
        // Премахваме дублиращи се по ID (в случай че има optimistic с еднакво ID)
        const uniqueMessages = combined.reduce((acc, current) => {
          if (!acc.some(msg => msg.id === current.id)) {
            acc.push(current);
          } else if (current.isOptimistic) {
            // Ако има дублиране и текущото е optimistic, заменяме го
            const existingIndex = acc.findIndex(msg => msg.id === current.id);
            if (existingIndex !== -1 && !acc[existingIndex].isOptimistic) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, [] as Message[]);
        
        // Сортираме по timestamp
        return uniqueMessages.sort((a, b) => {
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });
      });
      
      setLoading(false);
    }, (error) => {
      console.error(t?.('error_loading_messages') || "Error loading messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, t]);

  // Get current user data
  const currentUserData = useMemo(() => 
    allUsers.find(u => u.uid === currentUser?.uid),
    [allUsers, currentUser]
  );
  
  const currentUserRole = currentUserData?.role;
  const currentUserCommunityId = currentUserData?.communityId;

  // Get users based on role and active view
  const getFilteredUsers = useMemo(() => {
    if (!currentUserData) return [];

    // If teacher
    if (currentUserRole === 'teacher') {
      if (activeView === 'myCommunity' && selectedCommunity) {
        // Teacher sees students from selected community
        const community = myCommunities.find(c => c.id === selectedCommunity);
        if (!community) return [];

        return allUsers.filter(user => 
          user.role === 'student' &&
          community.studentIds.includes(user.uid) &&
          user.uid !== currentUser?.uid
        );
      } else {
        // Teacher sees all other teachers and their own students
        const myStudents = new Set();
        
        // Collect all students from teacher's communities
        myCommunities.forEach(community => {
          community.studentIds.forEach(studentId => {
            myStudents.add(studentId);
          });
        });

        return allUsers.filter(user => 
          user.uid !== currentUser?.uid && (
            user.role === 'teacher' ||
            (user.role === 'student' && myStudents.has(user.uid))
          )
        );
      }
    }
    
    // If student
    if (currentUserRole === 'student') {
      // Student only sees their own community members
      const userCommunity = myCommunities.find(c => 
        c.id === currentUserCommunityId || 
        c.studentIds.includes(currentUser?.uid || '')
      );
      
      if (!userCommunity) return [];

      return allUsers.filter(user => 
        user.uid !== currentUser?.uid && (
          // Teacher from community
          user.uid === userCommunity.teacherId ||
          // Other students from community
          (user.role === 'student' && userCommunity.studentIds.includes(user.uid))
        )
      );
    }

    return allUsers.filter(user => user.uid !== currentUser?.uid);
  }, [currentUserData, currentUserRole, currentUserCommunityId, myCommunities, allUsers, activeView, selectedCommunity, currentUser]);

  // Get communities for dropdown based on role
  const getAvailableCommunities = useMemo(() => {
    if (currentUserRole === 'teacher') {
      return myCommunities;
    } else if (currentUserRole === 'student') {
      return myCommunities.filter(community => 
        community.id === currentUserCommunityId || 
        community.studentIds.includes(currentUser?.uid || '')
      );
    }
    return [];
  }, [currentUserRole, myCommunities, currentUserCommunityId, currentUser]);

  // Filter messages based on selected folder
  const filteredMessages = useMemo(() => {
    const filtered = messages.filter(message => {
      const isSent = message.senderId === currentUser?.uid;
      const isReceived = message.receiverId === currentUser?.uid;
      
      if (selectedFolder === 'inbox') {
        return isReceived && !message.labels?.includes(t?.('trash') || 'Кошче');
      }
      if (selectedFolder === 'starred') {
        return message.status === 'starred' && !message.labels?.includes(t?.('trash') || 'Кошче');
      }
      if (selectedFolder === 'sent') {
        return isSent && !message.labels?.includes(t?.('trash') || 'Кошче');
      }
      if (selectedFolder === 'drafts') {
        return message.status === 'draft' && !message.labels?.includes(t?.('trash') || 'Кошче');
      }
      if (selectedFolder === 'trash') {
        return message.labels?.includes(t?.('trash') || 'Кошче');
      }
      return true;
    }).filter(message => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        message.subject?.toLowerCase().includes(query) ||
        message.content.toLowerCase().includes(query) ||
        message.senderName.toLowerCase().includes(query) ||
        message.receiverName?.toLowerCase().includes(query)
      );
    });
    
    // Уникални съобщения по ID за крайния филтър
    const uniqueMessages: Message[] = [];
    const seenIds = new Set<string>();
    
    for (const message of filtered) {
      if (!seenIds.has(message.id)) {
        seenIds.add(message.id);
        uniqueMessages.push(message);
      }
    }
    
    return uniqueMessages;
  }, [messages, selectedFolder, searchQuery, currentUser, t]);

  const filteredUsers = getFilteredUsers;
  const availableCommunities = getAvailableCommunities;

  // Get statistics
  const unreadCount = useMemo(() => 
    messages.filter(m => !m.read && m.receiverId === currentUser?.uid).length,
    [messages, currentUser]
  );
  
  const sentCount = useMemo(() =>
    messages.filter(m => m.senderId === currentUser?.uid && !isOptimisticMessage(m)).length,
    [messages, currentUser]
  );
  
  const communityMembers = useMemo(() => 
    selectedCommunity 
      ? myCommunities.find(c => c.id === selectedCommunity)?.memberCount || 0
      : 0,
    [selectedCommunity, myCommunities]
  );

  // Handle sending message
  const handleSendMessage = async () => {
    if (!currentUser || !currentUserData) {
      alert(t?.('login_required') || "Моля, влезте в профила си!");
      return;
    }

    if (!newMessage.content.trim()) {
      alert(t?.('message_content_required') || "Моля, въведете съдържание на съобщението!");
      return;
    }

    try {
      setSending(true);
      
      let receivers: UserData[] = [];
      let communityInfo = null;
      
      if (newMessage.type === 'direct') {
        if (!newMessage.to.trim()) {
          alert(t?.('recipient_required') || "Моля, изберете получател!");
          setSending(false);
          return;
        }
        
        const recipient = allUsers.find(u => 
          u.email === newMessage.to || 
          u.username === newMessage.to ||
          u.uid === newMessage.to
        );
        
        if (!recipient) {
          alert(t?.('recipient_not_found') || "Получателят не е намерен!");
          setSending(false);
          return;
        }
        
        if (recipient.uid === currentUser.uid) {
          alert(t?.('cannot_send_to_self') || "Не можете да изпращате съобщения до себе си!");
          setSending(false);
          return;
        }

        // Check permissions based on role
        if (currentUserRole === 'teacher') {
          // Teacher can send to:
          // 1. All teachers
          // 2. Their own students
          const isMyStudent = myCommunities.some(community => 
            community.studentIds.includes(recipient.uid)
          );
          
          if (recipient.role !== 'teacher' && !isMyStudent) {
            alert(t?.('cannot_send_to_student') || "Можете да изпращате съобщения само на своите ученици и други учители!");
            setSending(false);
            return;
          }
        } else if (currentUserRole === 'student') {
          // Student can send to:
          // 1. Their teacher
          // 2. Other students from their community
          const userCommunity = myCommunities.find(c => 
            c.id === currentUserCommunityId || 
            c.studentIds.includes(currentUser.uid || '')
          );
          
          if (!userCommunity) {
            alert(t?.('not_in_community') || "Не сте в общност!");
            setSending(false);
            return;
          }
          
          const isSameCommunity = 
            recipient.uid === userCommunity.teacherId ||
            userCommunity.studentIds.includes(recipient.uid);
          
          if (!isSameCommunity) {
            alert(t?.('cannot_send_outside_community') || "Можете да изпращате съобщения само на потребители от вашата общност!");
            setSending(false);
            return;
          }
        }
        
        receivers = [recipient];
      } 
      else if (newMessage.type === 'community') {
        if (!selectedCommunity) {
          alert(t?.('select_community') || "Моля, изберете общност!");
          setSending(false);
          return;
        }
        
        communityInfo = myCommunities.find(c => c.id === selectedCommunity);
        if (!communityInfo) {
          alert(t?.('community_not_found') || "Общността не е намерена!");
          setSending(false);
          return;
        }

        // Check if user has permission to send to this community
        if (currentUserRole === 'teacher') {
          const isMyCommunity = myCommunities.some(c => c.id === selectedCommunity);
          if (!isMyCommunity) {
            alert(t?.('not_your_community') || "Не можете да изпращате до тази общност!");
            setSending(false);
            return;
          }
        } else if (currentUserRole === 'student') {
          const isMyCommunity = 
            currentUserCommunityId === selectedCommunity ||
            myCommunities.some(c => c.id === selectedCommunity && c.studentIds.includes(currentUser?.uid || ''));
          
          if (!isMyCommunity) {
            alert(t?.('not_your_community') || "Не сте член на тази общност!");
            setSending(false);
            return;
          }
        }
        
        // Get users from the community
        receivers = allUsers.filter(user => 
          (communityInfo!.studentIds.includes(user.uid) || 
           communityInfo!.teacherId === user.uid) &&
          user.uid !== currentUser.uid
        );
        
        if (receivers.length === 0) {
          alert(t?.('no_users_in_community') || "Няма други потребители в тази общност!");
          setSending(false);
          return;
        }
      }
      else if (newMessage.type === 'broadcast') {
        // Broadcast only for teachers
        if (currentUserRole !== 'teacher') {
          alert(t?.('broadcast_teachers_only') || "Само учители могат да изпращат до всички!");
          setSending(false);
          return;
        }
        
        // Teacher sends to all users (except themselves)
        receivers = allUsers.filter(user => user.uid !== currentUser.uid);
        
        if (receivers.length === 0) {
          alert(t?.('no_other_users') || "Няма други потребители в системата!");
          setSending(false);
          return;
        }
      } else {
        alert(t?.('invalid_message_type') || "Невалиден тип съобщение!");
        setSending(false);
        return;
      }

      const currentUserName = currentUserData.fullName || currentUserData.username || currentUser.email?.split('@')[0] || t?.('user') || "Потребител";
      const currentUserEmail = currentUserData.email || currentUser.email || "";
      
      // Създаваме временен timestamp
      const tempTimestamp = Timestamp.now();
      
      // Генерираме batch ID
      const batchId = generateBatchId();
      currentBatchIdRef.current = batchId;
      
      // Създаваме batch
      const batch = writeBatch(db);
      const tempMessages: Message[] = [];
      
      for (const receiver of receivers) {
        const messageId = generateMessageId(currentUser.uid, receiver.uid);
        const messageRef = doc(db, 'messages', messageId);
        
        const messageData = {
          id: messageId,
          senderId: currentUser.uid,
          senderName: currentUserName,
          senderEmail: currentUserEmail,
          receiverId: receiver.uid,
          receiverName: receiver.username,
          receiverEmail: receiver.email,
          content: newMessage.content.trim(),
          subject: newMessage.subject.trim() || t?.('no_subject') || "Без тема",
          timestamp: serverTimestamp(),
          read: false,
          type: newMessage.type,
          status: 'sent',
          labels: [t?.('sent') || 'Изпратено'],
          communityId: newMessage.type === 'community' ? selectedCommunity : null,
          communityName: newMessage.type === 'community' ? communityInfo?.name : null,
          batchId: batchId
        };
        
        batch.set(messageRef, messageData);
        
        // Добавяме в optimistic ref
        optimisticMessagesRef.current.add(messageId);
        
        // Добавяме временно съобщение
        tempMessages.push({
          ...messageData,
          timestamp: tempTimestamp,
          isOptimistic: true
        } as Message);
      }

      // Добавяме временните съобщения
      setMessages(prev => {
        const newMessages = [...tempMessages, ...prev];
        return newMessages.sort((a, b) => {
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });
      });
      
      // Преминаваме към папка "sent"
      setSelectedFolder('sent');
      
      // Изпращаме batch
      await batch.commit();
      
      // Успешно изпратено
      setNewMessage({ 
        to: '', 
        subject: '', 
        content: '', 
        type: 'direct',
        selectedUsers: [] 
      });
      setComposeOpen(false);
      currentBatchIdRef.current = null;
      
      // Success message
      const messageText = t?.('message_sent_to') || 'Съобщението е изпратено до';
      const recipientsText = receivers.length !== 1 
        ? t?.('recipients') || 'получатели' 
        : t?.('recipient') || 'получател';
      alert(`✅ ${messageText} ${receivers.length} ${recipientsText}!`);
      
    } catch (error: any) {
      console.error(t?.('error_sending_message') || "Грешка при изпращане на съобщение:", error);
      
      // Грешка при изпращане
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
      
      const errorText = t?.('error_sending_message') || "Грешка при изпращане на съобщение";
      const tryAgainText = t?.('try_again') || "Моля, опитайте отново.";
      alert(`❌ ${errorText}: ${error.message || tryAgainText}`);
    } finally {
      setSending(false);
    }
  };

  // Handle message actions
  const handleStarMessage = async (messageId: string, starred: boolean) => {
    try {
      // Не обновяваме optimistic съобщения
      if (optimisticMessagesRef.current.has(messageId)) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: starred ? 'starred' : 'read' } : msg
        ));
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, status: starred ? 'starred' : 'read' } : null);
        }
        return;
      }
      
      await updateDoc(doc(db, 'messages', messageId), {
        status: starred ? 'starred' : 'read'
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: starred ? 'starred' : 'read' } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, status: starred ? 'starred' : 'read' } : null);
      }
    } catch (error) {
      console.error(t?.('error_starring_message') || "Грешка при отметване на съобщение:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t?.('confirm_delete_message') || "Изтриване на това съобщение?")) return;
    
    try {
      // За optimistic съобщения просто ги премахваме
      if (optimisticMessagesRef.current.has(messageId)) {
        optimisticMessagesRef.current.delete(messageId);
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
        
        setSelectedMessages(prev => prev.filter(id => id !== messageId));
        return;
      }
      
      // За Firestore съобщения - използваме deleteDoc или updateDoc в зависимост от правата
      const messageRef = doc(db, 'messages', messageId);
      
      // Проверка дали потребителят има права да изтрие съобщението
      const message = messages.find(m => m.id === messageId);
      if (!message) return;
      
      // Потребителят може да изтрие само своите съобщения
      if (message.senderId !== currentUser?.uid && message.receiverId !== currentUser?.uid) {
        alert(t?.('no_permission_delete') || "Нямате права да изтриете това съобщение!");
        return;
      }
      
      // Ако е получател - маркираме като изтрито (trash), ако е изпращач - изтриваме напълно
      if (message.receiverId === currentUser?.uid) {
        // Получателят може само да премести в кошче
        await updateDoc(messageRef, {
          labels: arrayUnion(t?.('trash') || 'Кошче')
        });
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, labels: [...(msg.labels || []), t?.('trash') || 'Кошче'] } : msg
        ));
        
        alert("✅ " + (t?.('message_moved_to_trash') || "Съобщението е преместено в кошчето!"));
      } else if (message.senderId === currentUser?.uid) {
        // Изпращачът може да изтрие напълно
        await deleteDoc(messageRef);
        
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        alert("✅ " + (t?.('message_deleted') || "Съобщението е изтрито!"));
      }
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      setSelectedMessages(prev => prev.filter(id => id !== messageId));
      
    } catch (error: any) {
      console.error(t?.('error_deleting_message') || "Грешка при изтриване на съобщение:", error);
      
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        alert("❌ " + (t?.('no_permission_delete') || "Нямате права да изтриете това съобщение!"));
      } else {
        alert("❌ " + (t?.('error_deleting_message') || "Грешка при изтриване на съобщение!"));
      }
    }
  };

  const handleDeleteSelectedMessages = async () => {
    if (selectedMessages.length === 0) return;
    
    if (!window.confirm(`${t?.('delete_selected_messages') || 'Изтриване на'} ${selectedMessages.length} ${t?.('selected_messages') || 'избрани съобщения'}?`)) return;
    
    try {
      const batch = writeBatch(db);
      let hasOptimistic = false;
      let operations = 0;
   
      for (const messageId of selectedMessages) {
        if (optimisticMessagesRef.current.has(messageId)) {
          hasOptimistic = true;
          continue;
        }
        
        const message = messages.find(m => m.id === messageId);
        if (!message) continue;
        
        const messageRef = doc(db, 'messages', messageId);
        
        // Потребителят може да изтрие само своите съобщения
        if (message.senderId !== currentUser?.uid && message.receiverId !== currentUser?.uid) {
          continue;
        }
        
        if (message.receiverId === currentUser?.uid) {
          // Получател - премества в кошче
          batch.update(messageRef, {
            labels: arrayUnion(t?.('trash') || 'Кошче')
          });
          operations++;
        } else if (message.senderId === currentUser?.uid) {
          // Изпращач - изтрива напълно
          batch.delete(messageRef);
          operations++;
        }
      }
      
      if (operations > 0) {
        await batch.commit();
      }
      
      // Актуализираме локалното състояние
      setMessages(prev => {
        return prev.map(msg => {
          if (selectedMessages.includes(msg.id)) {
            if (optimisticMessagesRef.current.has(msg.id)) {
              optimisticMessagesRef.current.delete(msg.id);
              return null;
            }
            
            // Ако е получател, маркираме като кошче
            if (msg.receiverId === currentUser?.uid) {
              return { ...msg, labels: [...(msg.labels || []), t?.('trash') || 'Кошче'] };
            }
            
            // Ако е изпращач, премахваме съобщението
            return null;
          }
          return msg;
        }).filter(Boolean) as Message[];
      });
      
      if (selectedMessage && selectedMessages.includes(selectedMessage.id)) {
        setSelectedMessage(null);
      }
      
      setSelectedMessages([]);
      
      alert(`✅ ${selectedMessages.length} ${t?.('messages_processed') || 'съобщения са обработени'}!`);
    } catch (error: any) {
      console.error(t?.('error_deleting_messages') || "Грешка при изтриване на съобщения:", error);
      
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        alert("❌ " + (t?.('no_permission_delete') || "Нямате права да изтриете тези съобщения!"));
      } else {
        alert("❌ " + (t?.('error_deleting_messages') || "Грешка при изтриване на съобщения!"));
      }
    }
  };

  const handleMarkAsRead = async (messageId: string, read: boolean = true) => {
    try {
      // За optimistic съобщения само обновяваме локално
      if (optimisticMessagesRef.current.has(messageId)) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, read: read } : msg
        ));
        
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, read: read } : null);
        }
        return;
      }
      
      // Проверка дали потребителят е получател
      const message = messages.find(m => m.id === messageId);
      if (!message || message.receiverId !== currentUser?.uid) {
        return;
      }
      
      await updateDoc(doc(db, 'messages', messageId), {
        read: read
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read: read } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, read: read } : null);
      }
      
    } catch (error) {
      console.error(t?.('error_marking_message') || "Грешка при маркиране на съобщение:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadMessages = messages.filter(m => 
        !m.read && 
        m.receiverId === currentUser?.uid &&
        !optimisticMessagesRef.current.has(m.id)
      );
      
      if (unreadMessages.length === 0) {
        alert(t?.('no_unread_messages') || "Няма непрочетени съобщения!");
        return;
      }
      console.log(userData, handleMarkAllAsRead)
      const batch = writeBatch(db);
      
      for (const msg of unreadMessages) {
        const messageRef = doc(db, 'messages', msg.id);
        batch.update(messageRef, { read: true });
      }
      
      await batch.commit();
      
      setMessages(prev => prev.map(msg => 
        msg.receiverId === currentUser?.uid && !optimisticMessagesRef.current.has(msg.id) 
          ? { ...msg, read: true } 
          : msg
      ));
      
      alert(`✅ ${unreadMessages.length} ${t?.('messages_marked_as_read') || 'съобщения са маркирани като прочетени'}!`);
    } catch (error) {
      console.error(t?.('error_marking_messages') || "Грешка при маркиране на съобщения:", error);
      alert("❌ " + (t?.('error_marking_messages') || "Грешка при маркиране на съобщения!"));
    }
  };

  // Handle message selection
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

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
      } else if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['Нед', 'Пон', 'Вт', 'Ср', 'Чет', 'Пет', 'Съб'];
        return days[date.getDay()];
      } else {
        return date.toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return '';
    }
  };

  // Get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  // Update view toggle based on role
  useEffect(() => {
    if (currentUserRole === 'student') {
      // Students only see 'myCommunity' view
      setActiveView('myCommunity');
    }
  }, [currentUserRole]);

  // Get message type options based on role
  const getMessageTypeOptions = useMemo(() => {
    const options = [
      { value: 'direct', label: t?.('personal') || 'Лично', icon: <User className="w-4 h-4" /> }
    ];
    
    if (currentUserRole === 'teacher') {
      options.push(
        { value: 'community', label: t?.('community') || 'Общност', icon: <Building className="w-4 h-4" /> },
        { value: 'broadcast', label: t?.('broadcast') || 'Всички', icon: <Users className="w-4 h-4" /> }
      );
    } else if (currentUserRole === 'student' && availableCommunities.length > 0) {
      options.push(
        { value: 'community', label: t?.('community') || 'Общност', icon: <Building className="w-4 h-4" /> }
      );
    }
    
    return options;
  }, [currentUserRole, availableCommunities, t]);

  // Theme classes
  const themeClasses = {
    light: {
      bg: "bg-gray-50",
      card: "bg-white",
      border: "border-gray-200",
      hover: "hover:bg-gray-100",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      input: "bg-white border-gray-300",
    },
    dark: {
      bg: "bg-gray-900",
      card: "bg-gray-800",
      border: "border-gray-700",
      hover: "hover:bg-gray-700",
      text: "text-white",
      textSecondary: "text-gray-400",
      input: "bg-gray-700 border-gray-600",
    }
  };

  const currentTheme = themeClasses[theme];

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${currentTheme.bg}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={currentTheme.textSecondary}>{t?.('loading_messages') || "Зареждане на съобщения..."}</p>
        </div>
      </div>
    );
  }

  // Render header based on role
  const renderHeader = () => {
    if (currentUserRole === 'teacher') {
      return (
        <>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t?.('teacher_messages') || "Съобщения - Учител"}</h1>
            <p className={`${currentTheme.textSecondary} text-sm md:text-base`}>
              {unreadCount} {t?.('unread') || 'непрочетени'} • {sentCount} {t?.('sent') || 'изпратени'} • {myCommunities.length} {t?.('communities') || 'общности'}
            </p>
          </div>
        </>
      );
    } else if (currentUserRole === 'student') {
      return (
        <>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t?.('student_messages') || "Съобщения - Ученик"}</h1>
            <p className={`${currentTheme.textSecondary} text-sm md:text-base`}>
              {unreadCount} {t?.('unread') || 'непрочетени'} • {sentCount} {t?.('sent') || 'изпратени'} • {communityMembers} {t?.('in_my_community') || 'в моята общност'}
            </p>
          </div>
        </>
      );
    }
    
    return (
      <>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t?.('messages_center') || "Център за Съобщения"}</h1>
          <p className={`${currentTheme.textSecondary} text-sm md:text-base`}>
            {unreadCount} {t?.('unread') || 'непрочетени'} • {sentCount} {t?.('sent') || 'изпратени'}
          </p>
        </div>
      </>
    );
  };

  // Render view toggle based on role
  const renderViewToggle = () => {
    if (currentUserRole === 'student') {
      // Students only see their community
      return null;
    }
    
    return (
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className={`rounded-xl p-1 ${currentTheme.card} ${currentTheme.border} border flex flex-wrap`}>
          <button
            onClick={() => setActiveView('all')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1 md:gap-2 text-sm md:text-base ${
              activeView === 'all'
                ? 'bg-blue-500 text-white'
                : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <Users className="w-3 h-3 md:w-4 md:h-4" />
            <span>{t?.('all') || "Всички"}</span>
          </button>
          <button
            onClick={() => setActiveView('myCommunity')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1 md:gap-2 text-sm md:text-base ${
              activeView === 'myCommunity'
                ? 'bg-green-500 text-white'
                : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <Building className="w-3 h-3 md:w-4 md:h-4" />
            <span>{t?.('my_community') || "Моята общност"}</span>
          </button>
        </div>

        {activeView === 'myCommunity' && availableCommunities.length > 0 && (
          <select
            value={selectedCommunity || ''}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className={`rounded-xl px-3 py-2 ${currentTheme.input} border text-sm md:text-base min-w-[200px]`}
          >
            {availableCommunities.map(community => (
              <option key={community.id} value={community.id}>
                {community.name} ({community.memberCount})
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  // Render user statistics panel
  const renderUserStatsPanel = () => {
    const myStudentsCount = filteredUsers.filter(u => u.role === 'student').length;
    const otherTeachersCount = filteredUsers.filter(u => u.role === 'teacher').length;
    
    return (
      <div className={`rounded-2xl ${currentTheme.card} ${currentTheme.border} border p-4 mb-6`}>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {currentUserRole === 'teacher' && activeView === 'all' 
            ? t?.('available_recipients') || 'Налични получатели'
            : currentUserRole === 'teacher' && activeView === 'myCommunity'
            ? t?.('community_students') || 'Ученици от общността'
            : t?.('my_community_members') || 'Членове на моята общност'
          }
        </h3>
        
        <div className="space-y-3">
          {currentUserRole === 'teacher' && activeView === 'all' && (
            <>
              <div className="flex items-center justify-between">
                <span className={currentTheme.textSecondary}>{t?.('other_teachers') || "Други учители"}:</span>
                <span className="font-bold text-blue-500">
                  {otherTeachersCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={currentTheme.textSecondary}>{t?.('my_students') || "Моите ученици"}:</span>
                <span className="font-bold text-green-500">
                  {myStudentsCount}
                </span>
              </div>
            </>
          )}
          
          {(currentUserRole === 'teacher' && activeView === 'myCommunity') || currentUserRole === 'student' ? (
            <>
              <div className="flex items-center justify-between">
                <span className={currentTheme.textSecondary}>{t?.('community_teacher') || "Учител на общност"}:</span>
                <span className="font-bold text-purple-500">
                  {filteredUsers.filter(u => u.role === 'teacher').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={currentTheme.textSecondary}>{t?.('community_students') || "Ученици в общност"}:</span>
                <span className="font-bold text-green-500">
                  {filteredUsers.filter(u => u.role === 'student').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={currentTheme.textSecondary}>{t?.('total') || "Общо"}:</span>
                <span className="font-bold">
                  {filteredUsers.length}
                </span>
              </div>
            </>
          ) : null}
          
          {currentUserRole === 'teacher' && activeView === 'myCommunity' && selectedCommunity && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                  setNewMessage({
                    to: '',
                    subject: '',
                    content: '',
                    type: 'community',
                    selectedUsers: []
                  });
                  setComposeOpen(true);
                }}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {t?.('message_to_community') || "Съобщение до общността"}
              </button>
            </div>
          )}
          
          {currentUserRole === 'teacher' && activeView === 'all' && (
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                  setNewMessage({
                    to: '',
                    subject: '',
                    content: '',
                    type: 'broadcast',
                    selectedUsers: []
                  });
                  setComposeOpen(true);
                }}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                {t?.('message_to_all') || "Съобщение до всички"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render user list header
  const renderUserListHeader = () => {
    if (currentUserRole === 'teacher' && activeView === 'all') {
      return t?.('teachers_and_my_students') || 'Учители и мои ученици';
    } else if (currentUserRole === 'teacher' && activeView === 'myCommunity') {
      return t?.('community_students') || 'Ученици от общността';
    } else if (currentUserRole === 'student') {
      return t?.('my_community_members') || 'Членове на моята общност';
    }
    return t?.('user_list') || 'Списък с потребители';
  };

  const messageTypeOptions = getMessageTypeOptions;

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {renderHeader()}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            
            <button
              onClick={() => setComposeOpen(true)}
              className="px-4 py-2 md:px-6 md:py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <Edit className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline">{t?.('new_message') || "Ново съобщение"}</span>
              <span className="inline md:hidden">{t?.('new') || "Ново"}</span>
            </button>
          </div>
        </div>

        {/* View Toggle */}
        {renderViewToggle()}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Users & Communities */}
          <div className="w-full lg:w-80 flex-shrink-0">
            {/* User Statistics */}
            {renderUserStatsPanel()}

            {/* User List */}
            <div className={`rounded-2xl ${currentTheme.card} ${currentTheme.border} border p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{renderUserListHeader()}</h3>
                <span className={`text-sm ${currentTheme.textSecondary}`}>
                  {filteredUsers.length} {t?.('found') || 'намерени'}
                </span>
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.uid}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      currentTheme.hover
                    }`}
                    onClick={() => {
                      setNewMessage({
                        to: user.username,
                        subject: '',
                        content: '',
                        type: 'direct',
                        selectedUsers: [user.uid]
                      });
                      setComposeOpen(true);
                    }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      user.role === 'teacher' 
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-500'
                        : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-500'
                    }`}>
                      {getUserInitials(user.username)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.username}</div>
                      <div className={`text-sm truncate ${currentTheme.textSecondary}`}>
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.role === 'teacher'
                            ? 'bg-purple-500/20 text-purple-500'
                            : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {user.role === 'teacher' ? t?.('teacher') || 'Учител' : t?.('student') || 'Ученик'}
                        </span>
                        {user.communityId && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                            {t?.('community') || "Общност"}
                          </span>
                        )}
                      </div>
                    </div>
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className={currentTheme.textSecondary}>
                      {currentUserRole === 'teacher' && activeView === 'myCommunity'
                        ? t?.('no_students_in_community') || "Няма ученици в тази общност"
                        : currentUserRole === 'student'
                        ? t?.('no_community_members') || "Няма други членове в вашата общност"
                        : t?.('no_users_found') || "Няма намерени потребители"
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Section - Folders & Messages */}
          <div className="flex-1">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Folders */}
              <div className="w-full lg:w-64 flex-shrink-0">
                <div className={`rounded-2xl ${currentTheme.card} ${currentTheme.border} border p-4 mb-6`}>
                  <div className="space-y-1">
                    {folders.map((folder) => {
                      let count = 0;
                      
                      if (folder.id === 'inbox') {
                        count = messages.filter(m => 
                          m.receiverId === currentUser?.uid && 
                          !m.read && 
                          !m.labels?.includes(t?.('trash') || 'Кошче') &&
                          !isOptimisticMessage(m)
                        ).length;
                      } else if (folder.id === 'starred') {
                        count = messages.filter(m => m.status === 'starred').length;
                      } else if (folder.id === 'sent') {
                        count = messages.filter(m => 
                          m.senderId === currentUser?.uid && 
                          !m.labels?.includes(t?.('trash') || 'Кошче')
                        ).length;
                      } else if (folder.id === 'trash') {
                        count = messages.filter(m => m.labels?.includes(t?.('trash') || 'Кошче')).length;
                      } else if (folder.id === 'drafts') {
                        count = messages.filter(m => m.status === 'draft').length;
                      }
                      
                      return (
                        <button
                          key={folder.id}
                          onClick={() => setSelectedFolder(folder.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                            selectedFolder === folder.id
                              ? theme === 'dark' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-blue-50 text-blue-600'
                              : `${currentTheme.hover}`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={folder.color}>
                              {folder.icon}
                            </div>
                            <span className="font-medium">{folder.name}</span>
                          </div>
                          {count > 0 && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1">
                {/* Search Bar */}
                <div className={`rounded-2xl ${currentTheme.card} ${currentTheme.border} border p-4 mb-6`}>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 relative w-full">
                      <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
                      <input
                        type="text"
                        placeholder={t?.('search_messages') || "Търсене на съобщения..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl ${currentTheme.input} border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={selectAllMessages}
                        className={`px-4 py-2 rounded-lg ${currentTheme.hover} flex-1 md:flex-none`}
                      >
                        {selectedMessages.length === filteredMessages.length ? t?.('deselect') || 'Отмени' : t?.('select_all') || 'Избери всички'}
                      </button>
                      {selectedMessages.length > 0 && (
                        <button
                          onClick={handleDeleteSelectedMessages}
                          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 flex-1 md:flex-none"
                        >
                          <Trash2 className="w-4 h-4 inline mr-2" />
                          {t?.('delete') || "Изтрий"} ({selectedMessages.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages List */}
                <div className={`rounded-2xl ${currentTheme.card} ${currentTheme.border} border overflow-hidden`}>
                  {filteredMessages.length === 0 ? (
                    <div className="py-16 text-center">
                      <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">
                        {selectedFolder === 'inbox' 
                          ? t?.('no_new_messages') || 'Нямате нови съобщения' 
                          : t?.('no_messages_found') || 'Няма намерени съобщения'}
                      </h3>
                      <p className={`mb-6 ${currentTheme.textSecondary}`}>
                        {selectedFolder === 'inbox' 
                          ? t?.('no_messages_inbox') || 'Когато получите съобщения, те ще се появят тук'
                          : t?.('try_different_folder') || 'Опитайте с различна папка или търсене'}
                      </p>
                      <button
                        onClick={() => setComposeOpen(true)}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
                      >
                        <Edit className="w-5 h-5 inline mr-2" />
                        {t?.('new_message') || "Ново съобщение"}
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                      {filteredMessages.map((message) => {
                        const isOptimistic = isOptimisticMessage(message);
                        
                        return (
                          <div
                            key={`${message.id}_${message.timestamp?.toMillis?.() || message.timestamp}`}
                            className={`flex items-center gap-4 p-4 cursor-pointer transition-colors group ${
                              selectedMessage?.id === message.id
                                ? theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                                : `${currentTheme.hover}`
                            } ${!message.read && message.receiverId === currentUser?.uid ? 'font-semibold' : ''} ${
                              isOptimistic ? 'opacity-70' : ''
                            }`}
                            onClick={() => {
                              setSelectedMessage(message);
                              if (!message.read && message.receiverId === currentUser?.uid && !isOptimistic) {
                                handleMarkAsRead(message.id, true);
                              }
                            }}
                          >
                            {/* Checkbox */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedMessages.includes(message.id)}
                                onChange={() => toggleMessageSelection(message.id)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={isOptimistic}
                              />
                            </div>
                            
                            {/* Star */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStarMessage(message.id, message.status !== 'starred');
                              }}
                              className="p-1"
                            >
                              {message.status === 'starred' ? (
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                              ) : (
                                <StarOff className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            
                            {/* Sender Avatar */}
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                                isOptimistic
                                  ? 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-500'
                                  : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400'
                              }`}>
                                {getUserInitials(message.senderName)}
                              </div>
                            </div>
                            
                            {/* Message Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col md:flex-row md:items-center justify-between mb-1 gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate font-medium">
                                    {message.senderId === currentUser?.uid 
                                      ? `${t?.('me') || 'Аз'} → ${message.receiverName}` 
                                      : message.senderName}
                                  </span>
                                  {isOptimistic && (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-500">
                                      {t?.('sending') || "Изпращане..."}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-sm ${currentTheme.textSecondary} whitespace-nowrap`}>
                                  {formatDate(message.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium truncate">
                                  {message.subject || t?.('no_subject') || 'Без тема'}
                                </span>
                                {message.type === 'community' && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-500">
                                    {t?.('community') || "Общност"}
                                  </span>
                                )}
                                {message.type === 'broadcast' && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-500">
                                    {t?.('broadcast') || "Всички"}
                                  </span>
                                )}
                                {message.labels?.map((label) => (
                                  <span
                                    key={label}
                                    className={`px-2 py-0.5 rounded-full text-xs ${
                                      label === t?.('important') || label === 'Важно'
                                        ? 'bg-red-500/20 text-red-500'
                                        : label === t?.('sent') || label === 'Изпратено'
                                        ? 'bg-blue-500/20 text-blue-500'
                                        : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                                    }`}
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                              <p className={`text-sm truncate ${currentTheme.textSecondary}`}>
                                {message.content.substring(0, 120)}
                                {message.content.length > 120 && '...'}
                              </p>
                            </div>
                            
                            {/* Quick Actions */}
                            {!isOptimistic && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!message.read && message.receiverId === currentUser?.uid && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(message.id, true);
                                    }}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                    title={t?.('mark_as_read') || "Маркирай като прочетено"}
                                  >
                                    <EyeOff className="w-4 h-4" />
                                  </button>
                                )}
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(message.id);
                                  }}
                                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-red-500"
                                  title={t?.('delete_message') || "Изтрий съобщение"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Message Detail Panel */}
          <AnimatePresence>
            {selectedMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full lg:w-96 flex-shrink-0 mt-6 lg:mt-0"
              >
                <div className={`rounded-2xl ${currentTheme.card} ${currentTheme.border} border p-4 lg:p-6 sticky top-6`}>
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-xl font-bold">{t?.('message') || "Съобщение"}</h2>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className={`p-2 rounded-lg ${currentTheme.hover}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Subject */}
                    <div>
                      <h3 className="text-lg font-bold mb-4">{selectedMessage.subject}</h3>
                      
                      {/* Sender Info */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${
                          isOptimisticMessage(selectedMessage)
                            ? 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-500'
                            : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600'
                        }`}>
                          {getUserInitials(selectedMessage.senderName)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">
                            {selectedMessage.senderId === currentUser?.uid 
                              ? t?.('me') || 'Аз'
                              : selectedMessage.senderName
                            }
                          </div>
                          <div className={`text-sm ${currentTheme.textSecondary}`}>
                            {t?.('to') || 'до'} {selectedMessage.receiverId === currentUser?.uid 
                              ? t?.('me') || 'мен'
                              : selectedMessage.receiverName
                            }
                          </div>
                          <div className={`text-sm ${currentTheme.textSecondary}`}>
                            {formatDate(selectedMessage.timestamp)}
                          </div>
                          {selectedMessage.type !== 'direct' && (
                            <div className="mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                selectedMessage.type === 'community' 
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-purple-500/20 text-purple-500'
                              }`}>
                                {selectedMessage.type === 'community' 
                                  ? t?.('community_message') || 'Съобщение до общност'
                                  : t?.('broadcast_message') || 'Съобщение до всички'}
                              </span>
                              {selectedMessage.communityName && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-500">
                                  {selectedMessage.communityName}
                                </span>
                              )}
                            </div>
                          )}
                          {isOptimisticMessage(selectedMessage) && (
                            <div className="mt-2">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-500">
                                {t?.('sending') || "Изпраща се..."}
                              </span>
                            </div>
                          )}
                        </div>
                        {!selectedMessage.read && selectedMessage.receiverId === currentUser?.uid && !isOptimisticMessage(selectedMessage) && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-500">
                            {t?.('new') || "Ново"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Message Content */}
                    <div className={`border-t pt-6 ${currentTheme.border}`}>
                      <div className={`prose dark:prose-invert max-w-none whitespace-pre-wrap ${
                        isOptimisticMessage(selectedMessage) ? 'opacity-70' : ''
                      }`}>
                        {selectedMessage.content}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {!isOptimisticMessage(selectedMessage) && (
                      <div className={`border-t pt-6 ${currentTheme.border}`}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setNewMessage({
                                to: selectedMessage.senderId,
                                subject: `Re: ${selectedMessage.subject}`,
                                content: `\n\n--- ${t?.('original_message') || 'Оригинално съобщение'} ---\n${selectedMessage.content}`,
                                type: 'direct',
                                selectedUsers: [selectedMessage.senderId]
                              });
                              setComposeOpen(true);
                              setSelectedMessage(null);
                            }}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
                          >
                            <Reply className="w-4 h-4 inline mr-2" />
                            {t?.('reply') || "Отговор"}
                          </button>
                          
                          <button
                            onClick={() => {
                              setNewMessage({
                                to: '',
                                subject: `Fwd: ${selectedMessage.subject}`,
                                content: `\n\n--- ${t?.('forwarded_message') || 'Препратено съобщение'} ---\n${selectedMessage.content}`,
                                type: 'direct',
                                selectedUsers: []
                              });
                              setComposeOpen(true);
                              setSelectedMessage(null);
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Forward className="w-4 h-4 inline mr-2" />
                            {t?.('forward') || "Препрати"}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMessage(selectedMessage.id)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                          >
                            <Trash2 className="w-4 h-4 inline mr-2" />
                            {t?.('delete') || "Изтрий"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {composeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4"
          >
            <div 
              className="absolute inset-0 bg-black/80" 
              onClick={() => setComposeOpen(false)}
            />
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl ${currentTheme.card} border ${currentTheme.border} flex flex-col`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">
                  {newMessage.type === 'community' && selectedCommunity 
                    ? `${t?.('message_to_community') || 'Съобщение до общност'}`
                    : newMessage.type === 'broadcast'
                    ? t?.('message_to_all') || 'Съобщение до всички'
                    : t?.('new_message') || 'Ново съобщение'
                  }
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setComposeOpen(false)}
                    className={`p-2 rounded-lg ${currentTheme.hover}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="space-y-4">
                  {/* Message Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">{t?.('message_type') || "Тип съобщение"}</label>
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
                          <span className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm ${
                            newMessage.type === option.value 
                              ? option.value === 'direct' ? 'bg-blue-500 text-white'
                                : option.value === 'community' ? 'bg-green-500 text-white'
                                : 'bg-purple-500 text-white'
                              : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                          }`}>
                            {option.icon}
                            <span>{option.label}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Recipient Info */}
                  {newMessage.type === 'community' && selectedCommunity ? (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4" />
                        <span className="font-medium">
                          {t?.('sending_to') || "Изпращане до"}: {myCommunities.find(c => c.id === selectedCommunity)?.name}
                        </span>
                      </div>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        {currentUserRole === 'teacher'
                          ? t?.('message_to_all_community') || "Това съобщение ще бъде изпратено до всички в общността"
                          : t?.('message_to_community_members') || "Това съобщение ще бъде изпратено до всички членове на вашата общност"
                        }
                      </p>
                    </div>
                  ) : newMessage.type === 'broadcast' ? (
                    <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">
                          {t?.('sending_to') || "Изпращане до"}: {t?.('all_users') || "Всички потребители"}
                        </span>
                      </div>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        {t?.('message_to_all_desc') || "Това съобщение ще бъде изпратено до всички потребители в платформата"}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">{t?.('to') || "До"}</label>
                      <input
                        type="text"
                        value={newMessage.to}
                        onChange={(e) => setNewMessage({...newMessage, to: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl ${currentTheme.input} border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                        placeholder={t?.('username_or_email') || "Име на потребител или имейл"}
                        list="recipients"
                      />
                      <datalist id="recipients">
                        {filteredUsers.map(user => (
                          <option key={user.uid} value={user.username}>
                            {user.username} ({user.role === 'teacher' ? t?.('teacher') || 'Учител' : t?.('student') || 'Ученик'})
                          </option>
                        ))}
                      </datalist>
                    </div>
                  )}
                  
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t?.('subject') || "Тема"}</label>
                    <input
                      type="text"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl ${currentTheme.input} border focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                      placeholder={t?.('message_subject') || "Тема на съобщението"}
                    />
                  </div>
                  
                  {/* Message Body */}
                  <div>
                    <label className="block text-sm font-medium mb-2">{t?.('message') || "Съобщение"}</label>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                      rows={8}
                      className={`w-full px-4 py-3 rounded-xl ${currentTheme.input} border focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none`}
                      placeholder={t?.('write_message_here') || "Напишете съобщението си тук..."}
                    />
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Fixed at bottom */}
              <div className="flex items-center justify-between p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    type="button"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setComposeOpen(false)}
                    className={`px-4 py-2 rounded-lg ${currentTheme.hover}`}
                    type="button"
                  >
                    {t?.('cancel') || "Отказ"}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.content.trim() || (newMessage.type === 'direct' && !newMessage.to.trim())}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    type="button"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        {t?.('sending') || "Изпращане..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t?.('send') || "Изпрати"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
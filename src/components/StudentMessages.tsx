// StudentMessages.tsx
import { useState, useEffect } from "react";
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
  Trash2,
  Users,
  MessageCircle,
  ChevronRight
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
  or
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
}

interface CommunityData {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  studentIds: string[];
  memberCount: number;
}

interface UserData {
  uid: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
}

export default function StudentMessages() {
  const { user: currentUser, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [_selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [myCommunity, setMyCommunity] = useState<CommunityData | null>(null);
  const [communityMembers, setCommunityMembers] = useState<UserData[]>([]);
  
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: '',
    type: 'direct' as 'direct' | 'community',
    selectedUser: ''
  });

  // Зареждане на общността на ученика
  useEffect(() => {
    if (!currentUser) return;

    const loadStudentCommunity = async () => {
      try {
        // Намиране на общността, в която е ученикът
        const communitiesQuery = query(
          collection(db, "communities"),
          where("studentIds", "array-contains", currentUser.uid)
        );
        
        const snapshot = await getDocs(communitiesQuery);
        
        if (!snapshot.empty) {
          const communityDoc = snapshot.docs[0];
          const data = communityDoc.data();
          
          const community: CommunityData = {
            id: communityDoc.id,
            name: data.name,
            description: data.description,
            teacherId: data.teacherId,
            studentIds: data.studentIds || [],
            memberCount: data.memberCount || 0
          };
          
          setMyCommunity(community);
          
          // Зареждане на членовете на общността
          const members: UserData[] = [];
          
          // Добавяне на текущия потребител
          const currentUserName = userData?.fullName || currentUser.email?.split('@')[0] || t?.('me') || "Аз";
          members.push({
            uid: currentUser.uid,
            username: currentUserName,
            email: currentUser.email || "",
            role: 'student',
            fullName: userData?.fullName
          });
          
          // Добавяне на учителя
          const teacherDoc = await getDoc(doc(db, "users", community.teacherId));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            const teacherName = teacherData.fullName || teacherData.email?.split('@')[0] || t?.('teacher') || "Учител";
            members.push({
              uid: teacherDoc.id,
              username: teacherName,
              email: teacherData.email || "",
              role: 'teacher',
              fullName: teacherData.fullName
            });
          }
          
          // Добавяне на учениците
          for (const studentId of community.studentIds) {
            if (studentId !== currentUser.uid) {
              const studentDoc = await getDoc(doc(db, "users", studentId));
              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                const studentName = studentData.fullName || studentData.email?.split('@')[0] || t?.('student') || "Ученик";
                members.push({
                  uid: studentDoc.id,
                  username: studentName,
                  email: studentData.email || "",
                  role: 'student',
                  fullName: studentData.fullName
                });
              }
            }
          }
          
          setCommunityMembers(members);
        }
      } catch (error) {
        console.error(t?.('error_loading_community') || "Грешка при зареждане на общността:", error);
      }
    };

    loadStudentCommunity();
  }, [currentUser, t, userData]);

  // Зареждане на съобщенията
 // Зареждане на съобщенията
useEffect(() => {
  if (!currentUser) return;

  setLoading(true);
  
  // Заявка за ВСИЧКИ съобщения, свързани с потребителя
  const messagesQuery = query(
    collection(db, "messages"),
    or(
      where("receiverId", "==", currentUser.uid),
      where("senderId", "==", currentUser.uid)
    ),
    orderBy("timestamp", "desc")
  );

  const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
    const messagesData: Message[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Проверка дали съобщението е от общността на ученика
      const isFromCommunity = myCommunity && (
        data.communityId === myCommunity.id ||
        (myCommunity.studentIds.includes(data.senderId) && 
         myCommunity.studentIds.includes(data.receiverId)) ||
        data.senderId === myCommunity.teacherId ||
        data.receiverId === myCommunity.teacherId
      );
      
      // Добавяме само ако е от нашата общност или няма общност
      if (isFromCommunity || !data.communityId) {
        const isSent = data.senderId === currentUser.uid;
        
        messagesData.push({
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
          status: data.status || (isSent ? 'sent' : 'unread'),
          subject: data.subject || t?.('no_subject') || "Без тема",
          labels: data.labels || [],
          attachments: data.attachments || [],
          communityId: data.communityId,
          communityName: data.communityName
        });
      }
    });

    setMessages(messagesData);
    setLoading(false);
  }, (error) => {
    console.error(t?.('error_loading_messages') || "Грешка при зареждане на съобщения:", error);
    setLoading(false);
  });

  return () => unsubscribe();
}, [currentUser, t, myCommunity]);

  // Филтриране на съобщенията
  const filteredMessages = messages.filter(message => {
    const isSent = message.senderId === currentUser?.uid;
    const isReceived = message.receiverId === currentUser?.uid;
    
    if (selectedFolder === 'inbox') {
      return isReceived && !message.labels?.includes(t?.('trash') || 'trash');
    }
    if (selectedFolder === 'starred') {
      return message.status === 'starred' && !message.labels?.includes(t?.('trash') || 'trash');
    }
    if (selectedFolder === 'sent') {
      return isSent && !message.labels?.includes(t?.('trash') || 'trash');
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

  // Статистики
  const unreadCount = messages.filter(m => !m.read && m.receiverId === currentUser?.uid).length;

  // Изпращане на съобщение
  const handleSendMessage = async () => {
    if (!currentUser || !myCommunity) {
      alert(t?.('login_required') || "Моля, влезте в профила си!");
      return;
    }

    if (!newMessage.content.trim()) {
      alert(t?.('message_content_required') || "Моля, въведете съдържание на съобщението!");
      return;
    }

    if (newMessage.type === 'direct' && !newMessage.selectedUser) {
      alert(t?.('recipient_required') || "Моля, изберете получател!");
      return;
    }

    try {
      setSending(true);
      
      let receivers: UserData[] = [];
      
      if (newMessage.type === 'direct') {
        const recipient = communityMembers.find(u => u.uid === newMessage.selectedUser);
        if (!recipient) {
          alert(t?.('recipient_not_found') || "Получателят не е намерен!");
          setSending(false);
          return;
        }
        
        receivers = [recipient];
      } else if (newMessage.type === 'community') {
        // Съобщение до цялата общност (без себе си)
        receivers = communityMembers.filter(member => member.uid !== currentUser.uid);
      }

      const currentUserName = userData?.fullName || currentUser.email?.split('@')[0] || t?.('student') || "Ученик";
      const currentUserEmail = userData?.email || currentUser.email || "";
      
      const batch = writeBatch(db);
      
      for (const receiver of receivers) {
        const messageId = `${Date.now()}_${currentUser.uid}_${receiver.uid}`;
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
          communityId: newMessage.type === 'community' ? myCommunity.id : null,
          communityName: newMessage.type === 'community' ? myCommunity.name : null
        };
        
        batch.set(messageRef, messageData);
      }

      await batch.commit();
      
      setNewMessage({ 
        to: '', 
        subject: '', 
        content: '', 
        type: 'direct',
        selectedUser: '' 
      });
      setComposeOpen(false);
      
      alert(`✅ ${t?.('message_sent_to') || 'Съобщението е изпратено до'} ${receivers.length} ${t?.('recipients') || 'получатели'}!`);
      
    } catch (error: any) {
      console.error(t?.('error_sending_message') || "Грешка при изпращане на съобщение:", error);
      alert(`❌ ${t?.('error_sending_message') || "Грешка при изпращане на съобщение"}: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  // Маркиране на съобщение като прочетено
  const handleMarkAsRead = async (messageId: string, read: boolean = true) => {
    try {
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

  // Отметване на съобщение
  const handleStarMessage = async (messageId: string, starred: boolean) => {
    try {
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

  // Изтриване на съобщение
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm(t?.('confirm_delete_message') || "Изтриване на това съобщение?")) return;
    
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        labels: arrayUnion(t?.('trash') || 'trash')
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, labels: [...(msg.labels || []), t?.('trash') || 'trash'] } : msg
      ));
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      
      setSelectedMessages(prev => prev.filter(id => id !== messageId));
      
      alert(`✅ ${t?.('message_moved_to_trash') || "Съобщението е преместено в кошчето"}!`);
    } catch (error) {
      console.error(t?.('error_deleting_message') || "Грешка при изтриване на съобщение:", error);
      alert(`❌ ${t?.('error_deleting_message') || "Грешка при изтриване на съобщение"}!`);
    }
  };

  // Отговор на съобщение
  const handleReply = () => {
    if (!selectedMessage) return;
    
    setNewMessage({
      to: selectedMessage.senderId,
      subject: `Re: ${selectedMessage.subject}`,
      content: `\n\n--- ${t?.('original_message') || 'Оригинално съобщение'} ---\n${selectedMessage.content}`,
      type: 'direct',
      selectedUser: selectedMessage.senderId
    });
    setComposeOpen(true);
    setSelectedMessage(null);
  };

  // Препращане на съобщение
  const handleForward = () => {
    if (!selectedMessage) return;
    
    setNewMessage({
      to: '',
      subject: `Fwd: ${selectedMessage.subject}`,
      content: `\n\n--- ${t?.('forwarded_message') || 'Препратено съобщение'} ---\n${selectedMessage.content}`,
      type: 'direct',
      selectedUser: ''
    });
    setComposeOpen(true);
    setSelectedMessage(null);
  };

  // Форматиране на датата
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

  const themeClasses = {
    light: {
      bg: "bg-gray-50",
      card: "bg-white",
      border: "border-gray-200",
      hover: "hover:bg-gray-100",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      input: "bg-white border-gray-300",
      modal: "bg-white",
    },
    dark: {
      bg: "bg-gray-900",
      card: "bg-gray-800",
      border: "border-gray-700",
      hover: "hover:bg-gray-700",
      text: "text-white",
      textSecondary: "text-gray-400",
      input: "bg-gray-700 border-gray-600",
      modal: "bg-gray-800",
    }
  };

  // Safe access to theme classes
  const getThemeClass = (key: keyof typeof themeClasses.light) => {
    const themeKey = theme as keyof typeof themeClasses;
    return themeClasses[themeKey]?.[key] || themeClasses.light[key];
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${getThemeClass('bg')}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={getThemeClass('textSecondary')}>
            {t?.('loading_messages') || "Зареждане на съобщения..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getThemeClass('bg')} ${getThemeClass('text')} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Хедър */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {t?.('student_messages') || "Съобщения - Ученик"}
              </h1>
              <p className={`${getThemeClass('textSecondary')} text-sm md:text-base`}>
                {unreadCount} {t?.('unread') || 'непрочетени'} • {myCommunity?.name || t?.('no_community') || "Без общност"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setComposeOpen(true)}
              className="px-4 py-2 md:px-6 md:py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <Edit className="w-4 h-4 md:w-5 md:h-5" />
              <span>{t?.('new_message') || "Ново съобщение"}</span>
            </button>
          </div>
        </div>

        {/* Основно съдържание */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Лява колона - Членове на общността */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl ${getThemeClass('card')} ${getThemeClass('border')} border p-4 mb-6 sticky top-6`}>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" /> 
                {t?.('community_members') || "Членове на общността"}
              </h3>
              
              <div className="space-y-3">
                {myCommunity ? (
                  <>
                    {/* Учител */}
                    {communityMembers
                      .filter(member => member.role === 'teacher')
                      .map(teacher => (
                        <div
                          key={teacher.uid}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${getThemeClass('hover')}`}
                          onClick={() => {
                            setNewMessage({
                              to: teacher.username,
                              subject: '',
                              content: '',
                              type: 'direct',
                              selectedUser: teacher.uid
                            });
                            setComposeOpen(true);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center font-semibold text-purple-500">
                            {teacher.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{teacher.username}</div>
                            <div className={`text-sm ${getThemeClass('textSecondary')}`}>
                              {t?.('teacher') || "Учител"}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    
                    {/* Ученици (без текущия потребител) */}
                    {communityMembers
                      .filter(member => member.role === 'student' && member.uid !== currentUser?.uid)
                      .map(student => (
                        <div
                          key={student.uid}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${getThemeClass('hover')}`}
                          onClick={() => {
                            setNewMessage({
                              to: student.username,
                              subject: '',
                              content: '',
                              type: 'direct',
                              selectedUser: student.uid
                            });
                            setComposeOpen(true);
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center font-semibold text-blue-500">
                            {student.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{student.username}</div>
                            <div className={`text-sm ${getThemeClass('textSecondary')}`}>
                              {t?.('student') || "Ученик"}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    
                    {/* Бутон за съобщение до цялата общност */}
                    <button
                      onClick={() => {
                        setNewMessage({
                          to: '',
                          subject: '',
                          content: '',
                          type: 'community',
                          selectedUser: ''
                        });
                        setComposeOpen(true);
                      }}
                      className="w-full mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 font-medium flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors"
                      disabled={!myCommunity}
                    >
                      <Users className="w-4 h-4" />
                      {t?.('message_to_community') || "Съобщение до цялата общност"}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className={getThemeClass('textSecondary')}>
                      {t?.('not_in_community') || "Не сте член на общност"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Дясна колона - Съобщения и преглед */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Панел със съобщения */}
              <div className="lg:col-span-2">
                {/* Папки */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                  {[
                    { id: 'inbox', name: t?.('inbox') || 'Входящи', icon: <Inbox className="w-5 h-5" /> },
                    { id: 'starred', name: t?.('starred') || 'Отметнати', icon: <Star className="w-5 h-5" /> },
                    { id: 'sent', name: t?.('sent') || 'Изпратени', icon: <Send className="w-5 h-5" /> },
                  ].map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap ${
                        selectedFolder === folder.id
                          ? 'bg-green-500 text-white'
                          : getThemeClass('hover')
                      }`}
                    >
                      {folder.icon}
                      <span>{folder.name}</span>
                      {folder.id === 'inbox' && unreadCount > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs bg-white/20">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Търсене */}
                <div className={`rounded-2xl ${getThemeClass('card')} ${getThemeClass('border')} border p-4 mb-6`}>
                  <div className="relative">
                    <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${getThemeClass('textSecondary')}`} />
                    <input
                      type="text"
                      placeholder={t?.('search_messages') || "Търсене на съобщения..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl ${getThemeClass('input')} border focus:outline-none focus:ring-2 focus:ring-green-500/50`}
                    />
                  </div>
                </div>

                {/* Списък със съобщения */}
                <div className={`rounded-2xl ${getThemeClass('card')} ${getThemeClass('border')} border overflow-hidden`}>
                  {filteredMessages.length === 0 ? (
                    <div className="py-16 text-center">
                      <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">
                        {selectedFolder === 'inbox' 
                          ? t?.('no_new_messages') || 'Нямате нови съобщения' 
                          : t?.('no_messages_found') || 'Няма намерени съобщения'}
                      </h3>
                      <p className={`mb-6 ${getThemeClass('textSecondary')}`}>
                        {selectedFolder === 'inbox' 
                          ? t?.('no_messages_inbox') || 'Когато получите съобщения, те ще се появят тук'
                          : t?.('try_different_folder') || 'Опитайте с различна папка или търсене'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                      {filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 cursor-pointer ${getThemeClass('hover')} ${
                            selectedMessage?.id === message.id 
                              ? theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
                              : ''
                          } ${
                            !message.read && message.receiverId === currentUser?.uid ? 'font-semibold' : ''
                          }`}
                          onClick={() => {
                            setSelectedMessage(message);
                            if (!message.read && message.receiverId === currentUser?.uid) {
                              handleMarkAsRead(message.id, true);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center font-semibold">
                              {message.senderName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between mb-1">
                                <span className="truncate">
                                  {message.senderId === currentUser?.uid 
                                    ? `${t?.('me') || 'Аз'} → ${message.receiverName}` 
                                    : message.senderName}
                                </span>
                                <span className={`text-sm ${getThemeClass('textSecondary')} whitespace-nowrap`}>
                                  {formatDate(message.timestamp)}
                                </span>
                              </div>
                              <div className="font-medium mb-1 truncate">
                                {message.subject}
                              </div>
                              <p className={`text-sm truncate ${getThemeClass('textSecondary')}`}>
                                {message.content.substring(0, 100)}...
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {message.type === 'community' && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-500">
                                    {t?.('community') || "Общност"}
                                  </span>
                                )}
                                {!message.read && message.receiverId === currentUser?.uid && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-500">
                                    {t?.('new') || "Ново"}
                                  </span>
                                )}
                                {message.status === 'starred' && (
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Панел за преглед на избрано съобщение */}
              <div className="lg:col-span-1">
                <AnimatePresence>
                  {selectedMessage ? (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`rounded-2xl ${getThemeClass('card')} ${getThemeClass('border')} border p-6 sticky top-6`}
                    >
                      {/* Хедър на съобщението */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{selectedMessage.subject}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={getThemeClass('textSecondary')}>
                              {t?.('from') || "От"}:
                            </span>
                            <span className="font-medium">
                              {selectedMessage.senderId === currentUser?.uid 
                                ? t?.('me') || 'Аз'
                                : selectedMessage.senderName}
                            </span>
                            <span className={getThemeClass('textSecondary')}>•</span>
                            <span className={getThemeClass('textSecondary')}>
                              {formatDate(selectedMessage.timestamp)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedMessage(null)}
                          className={`p-2 rounded-lg ${getThemeClass('hover')}`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Информация за получателя */}
                      <div className={`p-3 rounded-lg mb-6 ${
                        theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'
                      }`}>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={getThemeClass('textSecondary')}>
                            {t?.('to') || "До"}:
                          </span>
                          <span className="font-medium">
                            {selectedMessage.receiverId === currentUser?.uid 
                              ? t?.('me') || 'Аз'
                              : selectedMessage.receiverName}
                          </span>
                          {selectedMessage.type === 'community' && (
                            <>
                              <span className={getThemeClass('textSecondary')}>•</span>
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-500">
                                {t?.('community') || "Общност"}: {selectedMessage.communityName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Съдържание на съобщението */}
                      <div className={`border-t pt-6 ${getThemeClass('border')}`}>
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                          {selectedMessage.content}
                        </div>
                      </div>

                      {/* Бутони за действия */}
                      <div className={`border-t pt-6 ${getThemeClass('border')}`}>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleReply}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                          >
                            <Reply className="w-4 h-4" />
                            {t?.('reply') || "Отговор"}
                          </button>
                          
                          <button
                            onClick={handleForward}
                            className={`px-4 py-2 rounded-lg border ${getThemeClass('border')} ${getThemeClass('hover')} flex items-center gap-2`}
                          >
                            <Forward className="w-4 h-4" />
                            {t?.('forward') || "Препрати"}
                          </button>
                          
                          <button
                            onClick={() => handleStarMessage(
                              selectedMessage.id, 
                              selectedMessage.status !== 'starred'
                            )}
                            className={`px-4 py-2 rounded-lg border ${getThemeClass('border')} ${getThemeClass('hover')} flex items-center gap-2`}
                          >
                            {selectedMessage.status === 'starred' ? (
                              <>
                                <StarOff className="w-4 h-4" />
                                {t?.('remove_star') || "Премахни отметка"}
                              </>
                            ) : (
                              <>
                                <Star className="w-4 h-4" />
                                {t?.('star') || "Отмети"}
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMessage(selectedMessage.id)}
                            className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t?.('delete') || "Изтрий"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`rounded-2xl ${getThemeClass('card')} ${getThemeClass('border')} border p-6 sticky top-6 text-center`}
                    >
                      <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">
                        {t?.('select_message') || "Изберете съобщение"}
                      </h3>
                      <p className={getThemeClass('textSecondary')}>
                        {t?.('select_message_to_view') || "Изберете съобщение от списъка, за да го разгледате"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модален прозорец за съставяне на съобщение */}
      <AnimatePresence>
        {composeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setComposeOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl rounded-2xl shadow-2xl ${getThemeClass('modal')} border ${getThemeClass('border')}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Хедър на модала */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold">
                  {newMessage.type === 'community'
                    ? `${t?.('message_to_community') || 'Съобщение до общност'}: ${myCommunity?.name}`
                    : t?.('new_message') || 'Ново съобщение'}
                </h3>
                <button 
                  onClick={() => setComposeOpen(false)} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Съдържание на модала */}
              <div className="p-6 space-y-4">
                {/* Тип съобщение */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewMessage({...newMessage, type: 'direct'})}
                    className={`px-4 py-2 rounded-lg ${
                      newMessage.type === 'direct'
                        ? 'bg-green-500 text-white'
                        : getThemeClass('hover')
                    }`}
                  >
                    {t?.('personal') || "Лично съобщение"}
                  </button>
                  <button
                    onClick={() => setNewMessage({...newMessage, type: 'community'})}
                    className={`px-4 py-2 rounded-lg ${
                      newMessage.type === 'community'
                        ? 'bg-green-500 text-white'
                        : getThemeClass('hover')
                    }`}
                    disabled={!myCommunity}
                  >
                    {t?.('to_community') || "До общността"}
                  </button>
                </div>

                {/* Получател (само за лични съобщения) */}
                {newMessage.type === 'direct' && (
                  <div>
                    <label className="block mb-2 font-medium">
                      {t?.('to') || "До"}:
                    </label>
                    <select
                      value={newMessage.selectedUser}
                      onChange={(e) => setNewMessage({...newMessage, selectedUser: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${getThemeClass('input')}`}
                    >
                      <option value="">{t?.('select_recipient') || "Изберете получател"}</option>
                      {communityMembers
                        .filter(member => member.uid !== currentUser?.uid)
                        .map(member => (
                          <option key={member.uid} value={member.uid}>
                            {member.role === 'teacher' ? '👨‍🏫 ' : '👨‍🎓 '}
                            {member.username} ({member.role === 'teacher' ? t?.('teacher') || 'Учител' : t?.('student') || 'Ученик'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Тема */}
                <div>
                  <label className="block mb-2 font-medium">
                    {t?.('subject') || "Тема"}:
                  </label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${getThemeClass('input')}`}
                    placeholder={t?.('message_subject') || "Тема на съобщението"}
                  />
                </div>

                {/* Съдържание */}
                <div>
                  <label className="block mb-2 font-medium">
                    {t?.('message') || "Съобщение"}:
                  </label>
                  <textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                    rows={6}
                    className={`w-full px-4 py-2 rounded-lg border ${getThemeClass('input')} resize-none`}
                    placeholder={t?.('write_message_here') || "Напишете съобщението си тук..."}
                  />
                </div>
              </div>

              {/* Бутони за действие */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setComposeOpen(false)}
                  className={`px-4 py-2 rounded-lg ${getThemeClass('hover')}`}
                >
                  {t?.('cancel') || "Отказ"}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !newMessage.content.trim() || (newMessage.type === 'direct' && !newMessage.selectedUser)}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      {t?.('sending') || "Изпращане..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t?.('send') || "Изпрати"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
  Check,
  Crown,
  Home,
  MessageSquare,
  BarChart3,
  Zap,
  Lightbulb,
  Code,
  Users,
  Bot,
  Bell,
  UserPlus,
  MessageCircle,
  Award,
  FileCheck,
  GraduationCap,
  BookOpen,
  Mail,
  Send,
  Target
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

// Интерфейс за нотификации (общ за всички роли)
interface Notification {
  type: string;
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
  read?: boolean;
  timestamp?: any;
  data?: {
    senderId?: string;
    // Добавени липсващите типове
    type: 'join_request' | 'message' | 'grade' | 'challenge' | 'assignment' | 'system' | 'lesson' | 'challenge_response' | 'submission_evaluated' | 'challenge_submission' | 'challenge_accepted' | 'challenge_rejected' | 'challenge_completed' | 'assignment_submission' | 'direct';
    studentId?: string;
    studentName?: string;
    communityId?: string;
    communityName?: string;
    messageId?: string;
    senderName?: string;
    content?: string;
    points?: number;
    fileId?: string;
    fileName?: string;
    challengeId?: string;
    challengeTitle?: string;
    assignmentId?: string;
    assignmentTitle?: string;
    lessonId?: string;
    lessonTitle?: string;
    score?: number;
    feedback?: string;
    teacherName?: string;
  };
  actionUrl?: string;
}

// Интерфейс за съобщения
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
  communityId?: string;
  content: string;
  timestamp: any;
  read: boolean;
  // Добавен 'direct' към типа
  type: 'direct' | 'community' | 'broadcast';
}

interface HeaderProps {
  isScrolled: boolean;
  // Общи props
  userRole?: 'teacher' | 'student' | 'admin';
  
  // Props за учител
  notifications?: Notification[];
  unreadCount?: number;
  onNotificationClick?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationAction?: (notification: Notification) => void;
  
  // Props за ученик
  studentNotifications?: Notification[];
  studentUnreadCount?: number;
  onStudentNotificationClick?: (notificationId: string) => Promise<void>;
  onStudentMarkAllAsRead?: () => void;
  onStudentNotificationAction?: (notification: Notification) => void;
  
  // Props за съобщения (общи)
  messages?: Message[];
  unreadMessagesCount?: number;
  onMessageClick?: (messageId: string) => void;
  onMarkAllMessagesAsRead?: () => void;
  onSendMessage?: (recipientId: string, content: string) => void;
}

// Дефинираме интерфейс за навигационни елементи
interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  alwaysVisible?: boolean;
  noAuthRequired?: boolean;
  requiresAuth?: boolean;
  badge?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  isScrolled,
  userRole = 'teacher', // по подразбиране teacher за обратна съвместимост
  
  // Teacher props
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAllAsRead,
  onNotificationAction,
  
  // Student props
  studentNotifications = [],
  studentUnreadCount = 0,
  onStudentNotificationClick,
  onStudentMarkAllAsRead,
  onStudentNotificationAction,
  
  // Message props
  messages = [],
  unreadMessagesCount = 0,
  onMessageClick,
  onMarkAllMessagesAsRead,
  onSendMessage
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('all');
  const [messageContent, setMessageContent] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, languageOptions, currentLanguage, t } = useLanguage();

  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Избор на правилните нотификации според ролята
  const activeNotifications = userRole === 'student' ? studentNotifications : notifications;
  const activeUnreadCount = userRole === 'student' ? studentUnreadCount : unreadCount;
  const activeOnNotificationClick = userRole === 'student' ? onStudentNotificationClick : onNotificationClick;
  const activeOnMarkAllAsRead = userRole === 'student' ? onStudentMarkAllAsRead : onMarkAllAsRead;
  const activeOnNotificationAction = userRole === 'student' ? onStudentNotificationAction : onNotificationAction;
console.log(activeOnNotificationAction)
  // Проверка дали сме на home страницата
  const isHomePage = location.pathname === '/';

  // Определяне на цвета според темата
  const getThemeColors = () => {
    // На home страницата винаги използваме тъмна тема
    if (isHomePage) {
      return {
        bg: isScrolled ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)',
        text: isScrolled ? 'text-gray-100' : 'text-gray-300',
        border: isScrolled ? 'border-gray-700' : 'border-gray-800',
        hover: 'hover:text-white'
      };
    } else {
      // На другите страници следваме избраната тема
      if (theme === 'dark') {
        return {
          bg: isScrolled ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)',
          text: isScrolled ? 'text-gray-100' : 'text-gray-300',
          border: isScrolled ? 'border-gray-700' : 'border-gray-800',
          hover: 'hover:text-white'
        };
      } else {
        return {
          bg: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
          text: isScrolled ? 'text-gray-800' : 'text-gray-700',
          border: isScrolled ? 'border-gray-200' : 'border-gray-300',
          hover: 'hover:text-gray-900'
        };
      }
    }
  };

  const themeColors = getThemeColors();

  // Функция за определяне на правилния dashboard път
  const getDashboardPath = () => {
    if (!user) {
      return "/login";
    }
    
    if (!userData) {
      return "/login";
    }
    
    // Проверка за неодобрени учители
    if (userData.role === 'teacher' && userData.status === 'pending') {
      return "/teacher/pending";
    }
    
    switch (userData.role) {
      case 'admin':
        return "/admin-dashboard";
      case 'teacher':
        return "/teacher-dashboard";
      case 'student':
        return "/students-dashboard";
      default:
        return "/teacher-dashboard";
    }
  };

  const getDashboardLabel = () => {
    if (!userData) return t('dashboard') || "Dashboard";
    
    if (userData.role === 'admin') {
      return t('admin_dashboard') || "Admin Dashboard";
    } else if (userData.role === 'teacher') {
      if (userData.status === 'pending') {
        return t('pending_approval') || "Pending Approval";
      }
      return t('teacher_dashboard') || "Teacher Dashboard";
    } else if (userData.role === 'student') {
      return t('student_dashboard') || "Student Dashboard";
    } else {
      return t('dashboard') || "Dashboard";
    }
  };

  const isDashboardActive = () => {
    const dashboardPaths = [
      '/teacher-dashboard',
      '/admin-dashboard',
      '/students-dashboard',
      '/document-editor',
      '/lesson-planner'
    ];
    return dashboardPaths.includes(location.pathname);
  };

  const handleNavClick = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      setIsUserMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

// Функция за обработка на клик върху нотификация
const handleNotificationClick = async (notification: Notification) => {
  try {
    console.log('🔔 Notification clicked:', notification);
    
    // Маркирай като прочетена
    if (activeOnNotificationClick) {
      await activeOnNotificationClick(notification.id);
    }
    
    // 🔥 ОПРАВЕНА ЛОГИКА ЗА НАВИГАЦИЯ 🔥
    
    // 1. Първо провери дали има actionUrl
    if (notification.actionUrl) {
      console.log('➡️ Using actionUrl:', notification.actionUrl);
      
      // 🔥 КЛЮЧОВО: Ако actionUrl е за teacher-dashboard, но сме ученик, промени го
      let finalUrl = notification.actionUrl;
      
      if (userRole === 'student' && notification.actionUrl.includes('/teacher-dashboard')) {
        // Замени teacher-dashboard с students-dashboard
        finalUrl = notification.actionUrl.replace('/teacher-dashboard', '/students-dashboard');
        console.log('🔄 Adjusted URL for student:', finalUrl);
      }
      
      if (finalUrl.startsWith('http')) {
        window.location.href = finalUrl;
      } else {
        navigate(finalUrl);
      }
      setIsNotificationsOpen(false);
      return;
    }
    
    // 2. Определи типа на нотификацията
    const type = notification.type;
    console.log('➡️ Notification type:', type);
    
    // 3. Навигация според типа и ролята
    if (userRole === 'student') {
      // ⭐ НАВИГАЦИЯ ЗА УЧЕНИК ⭐
      switch (type) {
        case 'assignment':
        case 'assignment_submission':
        case 'new_assignment':
          console.log('📋 Navigating to assignments tab');
          navigate('/students-dashboard?tab=assignments');
          break;
          
        case 'challenge':
        case 'challenge_submission':
        case 'challenge_accepted':
        case 'challenge_rejected':
        case 'challenge_completed':
        case 'challenge_response':
        case 'new_challenge':
          console.log('🏆 Navigating to challenges tab');
          navigate('/students-dashboard?tab=challenges');
          break;
          
        case 'grade':
        case 'submission_evaluated':
        case 'new_grade':
          console.log('📊 Navigating to grades tab');
          navigate('/students-dashboard?tab=grades');
          break;
          
        case 'message':
        case 'direct':
        case 'new_message':
          console.log('💬 Navigating to messages tab');
          navigate('/students-dashboard?tab=messages');
          break;
          
        case 'lesson':
        case 'new_lesson':
          console.log('📚 Navigating to lessons tab');
          navigate('/students-dashboard?tab=lessons');
          break;
          
        case 'join_request':
        case 'community':
          console.log('👥 Navigating to communities tab');
          navigate('/students-dashboard?tab=communities');
          break;
          
        case 'system':
        default:
          console.log('🏠 Navigating to dashboard home');
          navigate('/students-dashboard');
          break;
      }
    } 
    else {
      // ⭐ НАВИГАЦИЯ ЗА УЧИТЕЛ ⭐
      switch (type) {
        case 'assignment':
        case 'assignment_submission':
        case 'new_assignment':
          console.log('📋 Navigating to assignments tab');
          navigate('/teacher-dashboard?tab=assignments');
          break;
          
        case 'challenge':
        case 'challenge_submission':
        case 'challenge_accepted':
        case 'challenge_rejected':
        case 'challenge_completed':
        case 'challenge_response':
        case 'new_challenge':
          console.log('🏆 Navigating to challenges tab');
          navigate('/teacher-dashboard?tab=challenges');
          break;
          
        case 'join_request':
          console.log('👥 Navigating to communities tab (pending requests)');
          navigate('/teacher-dashboard?tab=communities');
          break;
          
        case 'grade':
        case 'submission_evaluated':
          console.log('📊 Navigating to grades tab');
          navigate('/teacher-dashboard?tab=grades');
          break;
          
        case 'message':
        case 'direct':
        case 'new_message':
          console.log('💬 Navigating to messages tab');
          navigate('/teacher-dashboard?tab=messages');
          break;
          
        case 'lesson':
        case 'new_lesson':
          console.log('📚 Navigating to lessons tab');
          navigate('/teacher-dashboard?tab=lessons');
          break;
          
        case 'system':
        default:
          console.log('🏠 Navigating to dashboard home');
          navigate('/teacher-dashboard');
          break;
      }
    }
    
    // Затвори падащото меню
    setIsNotificationsOpen(false);
    
  } catch (error) {
    console.error('Error handling notification click:', error);
    setIsNotificationsOpen(false);
  }
};

  // Функция за обработка на клик върху съобщение
  const handleMessageClick = (messageId: string) => {
    if (onMessageClick) {
      onMessageClick(messageId);
    }
    setIsMessagesOpen(false);
  };

  // Функция за изпращане на съобщение
  const handleSendMessage = () => {
    if (!messageContent.trim() || !onSendMessage) return;
    
    onSendMessage(selectedRecipient, messageContent);
    setMessageContent('');
    setIsMessagingModalOpen(false);
  };

  // Функция за получаване на икона според типа нотификация (за ученик)
  const getStudentNotificationIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    const type = notification.data?.type;
    switch (type) {
      case 'grade':
      case 'submission_evaluated':
        return <GraduationCap className="w-4 h-4" />;
      case 'assignment':
      case 'assignment_submission':
        return <FileCheck className="w-4 h-4" />;
      case 'challenge':
      case 'challenge_submission':
      case 'challenge_accepted':
      case 'challenge_completed':
      case 'challenge_response':
        return <Target className="w-4 h-4" />;
      case 'message':
      case 'direct':
        return <MessageCircle className="w-4 h-4" />;
      case 'lesson':
        return <BookOpen className="w-4 h-4" />;
      case 'system':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Функция за получаване на цвят според типа нотификация (за ученик)
  const getStudentNotificationColor = (notification: Notification) => {
    if (notification.color) return notification.color;
    
    const type = notification.data?.type;
    switch (type) {
      case 'grade':
      case 'submission_evaluated':
        return '#22C55E'; // зелено
      case 'assignment':
      case 'assignment_submission':
        return '#3B82F6'; // синьо
      case 'challenge':
      case 'challenge_submission':
      case 'challenge_accepted':
      case 'challenge_completed':
        return '#A855F7'; // лилаво
      case 'message':
      case 'direct':
        return '#3B82F6'; // синьо
      case 'lesson':
        return '#22C55E'; // зелено
      case 'system':
        return '#6B7280'; // сиво
      default:
        return '#6B7280'; // сиво
    }
  };

  // Функция за получаване на икона според типа нотификация (за учител)
  const getTeacherNotificationIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    const type = notification.data?.type;
    switch (type) {
      case 'join_request':
        return <UserPlus className="w-4 h-4" />;
      case 'message':
        return <MessageCircle className="w-4 h-4" />;
      case 'grade':
        return <GraduationCap className="w-4 h-4" />;
      case 'challenge':
        return <Award className="w-4 h-4" />;
      case 'assignment':
        return <FileCheck className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Функция за получаване на цвят според типа нотификация (за учител)
  const getTeacherNotificationColor = (notification: Notification) => {
    if (notification.color) return notification.color;
    
    const type = notification.data?.type;
    switch (type) {
      case 'join_request':
        return '#F97316'; // оранжево
      case 'message':
        return '#3B82F6'; // синьо
      case 'grade':
        return '#22C55E'; // зелено
      case 'challenge':
        return '#A855F7'; // лилаво
      case 'assignment':
        return '#EC4899'; // розово
      default:
        return '#6B7280'; // сиво
    }
  };

  // Избор на правилните функции според ролята
  const getNotificationIcon = (notification: Notification) => {
    if (userRole === 'student') {
      return getStudentNotificationIcon(notification);
    } else {
      return getTeacherNotificationIcon(notification);
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (userRole === 'student') {
      return getStudentNotificationColor(notification);
    } else {
      return getTeacherNotificationColor(notification);
    }
  };

  // Функция за форматиране на timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('just_now') || 'Just now';
    if (diffMins < 60) return `${diffMins} ${t('minutes_ago') || 'min ago'}`;
    if (diffHours < 24) return `${diffHours} ${t('hours_ago') || 'hours ago'}`;
    if (diffDays < 7) return `${diffDays} ${t('days_ago') || 'days ago'}`;
    
    return date.toLocaleDateString();
  };

  // Функция за определяне на навигационните елементи според ролята
  const getNavItems = (): NavItem[] => {
    // Ако потребителят не е логнат, показваме само публичните елементи
    if (!user) {
      return [
        { 
          name: t('home') || "Home", 
          icon: <Home className="w-4 h-4" />,
          path: '/',
          color: 'from-blue-500 to-cyan-500',
          alwaysVisible: true,
          noAuthRequired: true
        },
        { 
          name: getDashboardLabel(), 
          icon: <BarChart3 className="w-4 h-4" />,
          path: getDashboardPath(),
          color: 'from-blue-500 to-cyan-500',
          requiresAuth: true,
          badge: userData?.status === 'pending' ? 'PENDING' : 
                 userData?.role === 'admin' ? 'ADMIN' :
                 userData?.role === 'teacher' ? 'TEACHER' :
                 userData?.role === 'student' ? 'STUDENT' : ''
        },
        { 
          name: t('prolog') || "Prolog", 
          icon: <Code className="w-4 h-4" />,
          path: '/prolog-guide',
          color: 'from-blue-500 to-cyan-500',
          alwaysVisible: true,
          noAuthRequired: true
        },
        { 
          name: t('about_us') || "About Us", 
          icon: <Users className="w-4 h-4" />,
          path: '/about-us',
          color: 'from-blue-500 to-cyan-500',
          alwaysVisible: true,
          noAuthRequired: true
        },
        { 
          name: t('prolog_demo') || "Prolog Demo", 
          icon: <Bot className="w-4 h-4" />,
          path: '/demo-prolog-chat',
          color: 'from-blue-500 to-cyan-500',
          alwaysVisible: true,
          noAuthRequired: true
        }
      ];
    }

    // Ако потребителят е логнат, показваме само специфичните за ролята му елементи
    switch (userData?.role) {
      case 'admin':
        return [
          { 
            name: t('home') || "Home", 
            icon: <Home className="w-4 h-4" />,
            path: '/',
            color: 'from-blue-500 to-cyan-500',
            alwaysVisible: true,
            noAuthRequired: true
          },
          { 
            name: getDashboardLabel(), 
            icon: <BarChart3 className="w-4 h-4" />,
            path: getDashboardPath(),
            color: 'from-blue-500 to-cyan-500',
            requiresAuth: true,
            badge: 'ADMIN'
          },
          { 
            name: t('prolog_chat') || "Prolog Chat", 
            icon: <MessageSquare className="w-4 h-4" />,
            path: '/prolog-chat',
            color: 'from-blue-500 to-cyan-500',
            requiresAuth: true
          }
        ];
      
      case 'teacher':
        return [
          { 
            name: t('home') || "Home", 
            icon: <Home className="w-4 h-4" />,
            path: '/',
            color: 'from-blue-500 to-cyan-500',
            alwaysVisible: true,
            noAuthRequired: true
          },
          { 
            name: getDashboardLabel(), 
            icon: <BarChart3 className="w-4 h-4" />,
            path: getDashboardPath(),
            color: 'from-blue-500 to-cyan-500',
            requiresAuth: true,
            badge: userData?.status === 'pending' ? 'PENDING' : 'TEACHER'
          },
          { 
            name: t('prolog_chat') || "Prolog Chat", 
            icon: <MessageSquare className="w-4 h-4" />,
            path: '/prolog-chat',
            color: 'from-blue-500 to-cyan-500',
            requiresAuth: true
          }
        ];
      
      case 'student':
        return [
          { 
            name: t('home') || "Home", 
            icon: <Home className="w-4 h-4" />,
            path: '/',
            color: 'from-blue-500 to-cyan-500',
            alwaysVisible: true,
            noAuthRequired: true
          },
          { 
            name: getDashboardLabel(), 
            icon: <BarChart3 className="w-4 h-4" />,
            path: getDashboardPath(),
            color: 'from-blue-500 to-cyan-500',
            requiresAuth: true,
            badge: 'STUDENT'
          },
          { 
            name: t('prolog_chat') || "Prolog Chat", 
            icon: <MessageSquare className="w-4 h-4" />,
            path: '/prolog-chat',
            color: 'from-blue-500 to-cyan-500',
            requiresAuth: true
          }
        ];
      
      default:
        return [
          { 
            name: t('home') || "Home", 
            icon: <Home className="w-4 h-4" />,
            path: '/',
            color: 'from-blue-500 to-cyan-500',
            alwaysVisible: true,
            noAuthRequired: true
          },
          { 
            name: getDashboardLabel(), 
            icon: <BarChart3 className="w-4 h-4" />,
            path: getDashboardPath(),
            color: 'from-blue-500 to-cyan-500',
            requiresAuth: true
          }
        ];
    }
  };

  const navItems = getNavItems();

  // Филтрирай навигацията според автентикацията
  const filteredNavItems = navItems.filter(item => 
    !item.requiresAuth || (item.requiresAuth && user) || item.noAuthRequired
  );

  const getFlagEmoji = (code: string) => {
    switch (code) {
      case 'en': return '🇺🇸';
      case 'bg': return '🇧🇬';
      case 'es': return '🇪🇸';
      default: return '🌐';
    }
  };

  // Стайлинг според темата
  const headerBackground = {
    backgroundColor: themeColors.bg,
    borderColor: isHomePage ? 'rgba(255, 255, 255, 0.1)' : 
                 (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)'
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && 
          !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (userMenuRef.current && 
          !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && 
          !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (messagesRef.current && 
          !messagesRef.current.contains(event.target as Node)) {
        setIsMessagesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Основен хедър */}
      <motion.nav 
        className="fixed top-4 left-4 right-4 z-50"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative">
          {/* Елипсовидна форма зад хедъра с тема */}
          <motion.div
            className="absolute inset-0 rounded-[9999px]"
            style={headerBackground}
            animate={{ 
              boxShadow: isHomePage || theme === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                : '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05) inset'
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Вътрешен градиент при hover */}
            <div className="absolute inset-0 rounded-[9999px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className={`absolute inset-0 rounded-[9999px] bg-gradient-to-r ${
                isHomePage || theme === 'dark' ? 'from-blue-500/5 via-cyan-500/3 to-transparent' : 'from-blue-500/10 via-cyan-500/5 to-transparent'
              }`} />
            </div>
          </motion.div>

          {/* Съдържание на хедъра */}
          <div className="relative z-10 py-4 px-8 lg:px-12">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              {/* Лого и име */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isHomePage || theme === 'dark'
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                      : 'bg-gradient-to-br from-yellow-400 to-orange-400'
                  }`}>
                    <Lightbulb className={`w-6 h-6 ${isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                  </div>
                  {isScrolled && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      
                    </motion.div>
                  )}
                </div>
                <motion.div className="flex flex-col">
                  <motion.span 
                    className={`text-2xl font-bold bg-gradient-to-r ${
                      isHomePage || theme === 'dark'
                        ? 'from-blue-400 to-cyan-300' 
                        : 'from-blue-600 to-cyan-500'
                    } bg-clip-text text-transparent`}
                    animate={isScrolled ? { scale: 0.95 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    IDEAS
                  </motion.span>
                  {isScrolled && (
                    <motion.span
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs ${
                        isHomePage || theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'
                      }`}
                    >
                      {t('innovation_platform') || "Innovation Platform"}
                    </motion.span>
                  )}
                </motion.div>
              </motion.div>

              {/* Desktop Navigation */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="hidden lg:flex items-center gap-4"
              >
                {filteredNavItems.map((item) => (
                  <motion.button
                    key={item.name}
                    onClick={() => handleNavClick(item.path)}
                    className={`relative group transition-colors ${themeColors.text} ${themeColors.hover}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())
                          ? `bg-gradient-to-r from-blue-500 to-cyan-500 text-white`
                          : isHomePage || theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="text-left flex items-center gap-2">
                        <span className="relative z-10 font-medium">{item.name}</span>
                        {item.badge && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`px-1.5 py-0.5 text-xs rounded-full font-bold ${
                              item.badge === 'ADMIN'
                                ? isHomePage || theme === 'dark'
                                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900'
                                : item.badge === 'TEACHER'
                                ? isHomePage || theme === 'dark'
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900'
                                : item.badge === 'PENDING'
                                ? isHomePage || theme === 'dark'
                                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900'
                                : item.badge === 'STUDENT'
                                ? isHomePage || theme === 'dark'
                                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                                  : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-gray-900'
                                : isHomePage || theme === 'dark'
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900'
                            }`}
                          >
                            {item.badge}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    {(isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())) && (
                      <motion.span
                        className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"
                        layoutId="active-underline"
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>

              {/* Controls + Auth */}
              <motion.div 
                className="hidden lg:flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Theme Toggle - Скриваме го на home страницата */}
                {!isHomePage && (
                  <motion.button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg border ${themeColors.border} ${
                      theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    } transition-colors`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={theme === 'light' ? (t('dark_mode') || "Dark Mode") : (t('light_mode') || "Light Mode")}
                  >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  </motion.button>
                )}

                {/* Language Selector */}
                <div className="relative" ref={languageMenuRef}>
                  <motion.button
                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${themeColors.border} ${
                      isHomePage || theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    } transition-colors`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">{getFlagEmoji(language)}</span>
                    <span className="font-medium">{currentLanguage?.label}</span>
                    <ChevronDown size={16} className={`transition-transform ${isLanguageMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isLanguageMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className={`absolute right-0 mt-2 w-48 ${
                          isHomePage || theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                        } backdrop-blur-xl rounded-xl shadow-2xl border ${
                          isHomePage || theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        } overflow-hidden`}
                      >
                        {languageOptions.map((option) => (
                          <button
                            key={option.code}
                            onClick={() => {
                              setLanguage(option.code as any);
                              setIsLanguageMenuOpen(false);
                            }}
                            className={`flex items-center justify-between w-full px-4 py-3 ${
                              isHomePage || theme === 'dark'
                                ? 'hover:bg-gray-800 text-gray-100'
                                : 'hover:bg-gray-100 text-gray-800'
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{option.flag}</span>
                              <span className="font-medium">{option.name}</span>
                            </div>
                            {language === option.code && (
                              <Check size={16} className="text-green-500" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Messages - само за логнати потребители */}
                {user && (
                  <div className="relative" ref={messagesRef}>
                    <motion.button
                      onClick={() => setIsMessagesOpen(!isMessagesOpen)}
                      className={`relative p-2 rounded-lg border ${themeColors.border} ${
                        isHomePage || theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      } transition-colors`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={t('messages') || "Messages"}
                    >
                      <Mail size={20} />
                      {unreadMessagesCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                          style={{ backgroundColor: '#3B82F6' }}
                        >
                          {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                        </motion.span>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {isMessagesOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className={`absolute right-0 mt-2 w-96 ${
                            isHomePage || theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                          } backdrop-blur-xl rounded-xl shadow-2xl border ${
                            isHomePage || theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          } overflow-hidden`}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className={`font-bold ${
                                isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {t('messages') || 'Messages'}
                              </h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setIsMessagesOpen(false);
                                    setIsMessagingModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                  title={t('new_message') || "New Message"}
                                >
                                  <Send size={16} />
                                </button>
                                {unreadMessagesCount > 0 && onMarkAllMessagesAsRead && (
                                  <button
                                    onClick={() => {
                                      onMarkAllMessagesAsRead();
                                      setIsMessagesOpen(false);
                                    }}
                                    className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                  >
                                    {t('mark_all_read') || 'Mark all read'}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {messages.length === 0 ? (
                                <div className="text-center py-8">
                                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                  <p className={`text-sm ${isHomePage || theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('no_messages') || 'No messages'}
                                  </p>
                                </div>
                              ) : (
                                messages.slice(0, 5).map((message) => (
                                  <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                      !message.read 
                                        ? isHomePage || theme === 'dark'
                                          ? 'bg-blue-500/10 hover:bg-blue-500/20' 
                                          : 'bg-blue-50 hover:bg-blue-100'
                                        : isHomePage || theme === 'dark'
                                          ? 'hover:bg-white/5' 
                                          : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleMessageClick(message.id)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isHomePage || theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                                      }`}>
                                        <MessageCircle className="w-4 h-4" style={{ color: '#3B82F6' }} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <h4 className={`font-medium text-sm ${
                                            isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                                          }`}>
                                            {message.senderName}
                                          </h4>
                                          {!message.read && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                          )}
                                        </div>
                                        <p className={`text-xs mt-1 line-clamp-2 ${
                                          isHomePage || theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                          {message.content}
                                        </p>
                                        {message.timestamp && (
                                          <p className={`text-xs mt-2 ${
                                            isHomePage || theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                          }`}>
                                            {formatTimestamp(message.timestamp)}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                ))
                              )}
                              
                              {messages.length > 5 && (
                                <button
                                  onClick={() => {
                                    setIsMessagesOpen(false);
                                    navigate(userRole === 'student' ? '/students-dashboard?tab=messages' : '/teacher-dashboard?tab=messages');
                                  }}
                                  className="w-full mt-2 py-2 text-sm text-center opacity-70 hover:opacity-100 transition-opacity"
                                >
                                  {t('view_all') || 'View all'} ({messages.length})
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Notifications - за всички логнати потребители (вече без ограничение за учител) */}
                {user && (
                  <div className="relative" ref={notificationsRef}>
                    <motion.button
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className={`relative p-2 rounded-lg border ${themeColors.border} ${
                        isHomePage || theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                      } transition-colors`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={t('notifications') || "Notifications"}
                    >
                      <Bell size={20} />
                      {activeUnreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white"
                          style={{ backgroundColor: '#EF4444' }}
                        >
                          {activeUnreadCount > 9 ? '9+' : activeUnreadCount}
                        </motion.span>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {isNotificationsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className={`absolute right-0 mt-2 w-96 ${
                            isHomePage || theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                          } backdrop-blur-xl rounded-xl shadow-2xl border ${
                            isHomePage || theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          } overflow-hidden`}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className={`font-bold ${
                                isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {t('notifications') || 'Notifications'}
                                {userRole === 'student' && (
                                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500">
                                    Student
                                  </span>
                                )}
                              </h3>
                              {activeUnreadCount > 0 && activeOnMarkAllAsRead && (
                                <button
                                  onClick={() => {
                                    activeOnMarkAllAsRead();
                                    setIsNotificationsOpen(false);
                                  }}
                                  className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                  {t('mark_all_read') || 'Mark all read'}
                                </button>
                              )}
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {activeNotifications.length === 0 ? (
                                <div className="text-center py-8">
                                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                  <p className={`text-sm ${isHomePage || theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('no_notifications') || 'No notifications'}
                                  </p>
                                  {userRole === 'student' && (
                                    <p className={`text-xs mt-2 ${isHomePage || theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {t('student_notifications_info') || 'Get notified about grades, challenges and new lessons'}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                activeNotifications.slice(0, 10).map((notification) => (
                                  <motion.div
                                    key={notification.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                      !notification.read 
                                        ? isHomePage || theme === 'dark'
                                          ? 'bg-white/10 hover:bg-white/15' 
                                          : 'bg-gray-100 hover:bg-gray-200'
                                        : isHomePage || theme === 'dark'
                                          ? 'hover:bg-white/5' 
                                          : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ 
                                          backgroundColor: `${getNotificationColor(notification)}20`,
                                          color: getNotificationColor(notification)
                                        }}
                                      >
                                        {getNotificationIcon(notification)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <h4 className={`font-medium text-sm ${
                                            isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                                          }`}>
                                            {notification.title}
                                          </h4>
                                          {!notification.read && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                          )}
                                        </div>
                                        <p className={`text-xs mt-1 line-clamp-2 ${
                                          isHomePage || theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                          {notification.description}
                                        </p>
                                        {notification.timestamp && (
                                          <p className={`text-xs mt-2 ${
                                            isHomePage || theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                          }`}>
                                            {formatTimestamp(notification.timestamp)}
                                          </p>
                                        )}
                                        
                                        {/* Показване на допълнителна информация за ученически нотификации */}
                                        {userRole === 'student' && notification.data && (
                                          <div className="mt-1">
                                            {notification.data.score !== undefined && (
                                              <span className={`inline-block px-2 py-0.5 rounded text-xs mr-1 ${
                                                notification.data.score >= 80 ? 'bg-green-500/20 text-green-500' :
                                                notification.data.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                                                'bg-red-500/20 text-red-500'
                                              }`}>
                                                {notification.data.score}%
                                              </span>
                                            )}
                                            {notification.data.points !== undefined && (
                                              <span className="inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 text-xs">
                                                +{notification.data.points} pts
                                              </span>
                                            )}
                                            {notification.data.teacherName && (
                                              <span className="inline-block px-2 py-0.5 rounded bg-purple-500/20 text-purple-500 text-xs ml-1">
                                                {notification.data.teacherName}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                ))
                              )}
                              
                              {activeNotifications.length > 10 && (
                                <div className="text-center pt-2">
                                  <span className={`text-xs ${isHomePage || theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    +{activeNotifications.length - 10} {t('more') || 'more'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Auth Buttons / User Menu */}
                {!user ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-full border ${
                        isHomePage || theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                      } font-medium ${
                        isHomePage || theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      } transition-colors`}
                      onClick={() => navigate('/login')}
                    >
                      <span className="flex items-center gap-2">
                        <User size={16} />
                        {t('sign_in') || "Sign In"}
                      </span>
                    </motion.button>

                    <motion.button
                      whileHover={{ 
                        scale: 1.05,
                        boxShadow: isHomePage || theme === 'dark'
                          ? "0 10px 30px rgba(59, 130, 246, 0.3)"
                          : "0 10px 30px rgba(59, 130, 246, 0.2)"
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium relative group overflow-hidden"
                      onClick={() => navigate('/register')}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center gap-2">
                        <Zap size={16} />
                        {t('get_started') || "Get Started"}
                      </span>
                    </motion.button>
                  </>
                ) : (
                  <div className="relative" ref={userMenuRef}>
                    <motion.button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${themeColors.border} ${
                        isHomePage || theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                      } transition-colors`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        userData?.role === 'admin'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                          : userData?.role === 'teacher'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : userData?.role === 'student'
                          ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}>
                        <User size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${
                            isHomePage || theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {user.email?.split('@')[0]}
                          </span>
                          {userData?.role === 'admin' && (
                            <Crown size={14} className="text-yellow-500" />
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          userData?.role === 'admin'
                            ? isHomePage || theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                            : userData?.role === 'teacher'
                            ? isHomePage || theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            : userData?.role === 'student'
                            ? isHomePage || theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                            : isHomePage || theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {userData?.role === 'admin' ? 'Admin' : 
                           userData?.role === 'teacher' ? 'Teacher' : 
                           userData?.role === 'student' ? 'Student' : 'User'}
                        </span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform ${
                        isHomePage || theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      } ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className={`absolute right-0 mt-2 w-64 ${
                            isHomePage || theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                          } backdrop-blur-xl rounded-xl shadow-2xl border ${
                            isHomePage || theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          } overflow-hidden`}
                        >
                          <div className={`p-4 border-b ${
                            isHomePage || theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                userData?.role === 'admin'
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : userData?.role === 'teacher'
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : userData?.role === 'student'
                                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                              }`}>
                                <User size={24} className="text-white" />
                              </div>
                              <div>
                                <h4 className={`font-semibold ${
                                  isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {user.email}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                    userData?.role === 'admin'
                                      ? isHomePage || theme === 'dark'
                                        ? 'bg-yellow-900 text-yellow-300' 
                                        : 'bg-yellow-100 text-yellow-800'
                                      : userData?.role === 'teacher'
                                      ? isHomePage || theme === 'dark'
                                        ? 'bg-green-900 text-green-300'
                                        : 'bg-green-100 text-green-800'
                                      : userData?.role === 'student'
                                      ? isHomePage || theme === 'dark'
                                        ? 'bg-indigo-900 text-indigo-300'
                                        : 'bg-indigo-100 text-indigo-800'
                                      : isHomePage || theme === 'dark'
                                        ? 'bg-blue-900 text-blue-300'
                                        : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {userData?.role === 'admin' ? 'Administrator' : 
                                     userData?.role === 'teacher' ? 'Teacher' : 
                                     userData?.role === 'student' ? 'Student' : 'User'}
                                  </span>
                                  {userData?.isVerified && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                      isHomePage || theme === 'dark'
                                        ? 'bg-blue-900 text-blue-300'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      ✓ Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-2">
                            <button
                              onClick={() => {
                                navigate(getDashboardPath());
                                setIsUserMenuOpen(false);
                              }}
                              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg ${
                                isHomePage || theme === 'dark'
                                  ? 'hover:bg-gray-800 text-gray-300'
                                  : 'hover:bg-gray-100 text-gray-700'
                              } transition-colors`}
                            >
                              <BarChart3 size={18} />
                              <span className="font-medium">{getDashboardLabel()}</span>
                            </button>

                            <button
                              onClick={() => {
                                navigate('/profile');
                                setIsUserMenuOpen(false);
                              }}
                              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg ${
                                isHomePage || theme === 'dark'
                                  ? 'hover:bg-gray-800 text-gray-300'
                                  : 'hover:bg-gray-100 text-gray-700'
                              } transition-colors`}
                            >
                              <User size={18} />
                              <span className="font-medium">My Profile</span>
                            </button>

                            <button
                              onClick={handleLogout}
                              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg mt-2 ${
                                isHomePage || theme === 'dark'
                                  ? 'hover:bg-red-900/20 text-red-400'
                                  : 'hover:bg-red-50 text-red-600'
                              } transition-colors`}
                            >
                              <LogOut size={18} />
                              <span className="font-medium">{t('logout') || "Logout"}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`lg:hidden p-2 rounded-lg border ${themeColors.border} ${
                  isHomePage || theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isMenuOpen ? (
                  <X size={24} />
                ) : (
                  <Menu size={24} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Messaging Modal */}
      <AnimatePresence>
        {isMessagingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={() => setIsMessagingModalOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80" />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg rounded-2xl border ${
                isHomePage || theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              } overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20">
                      <Send className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${
                        isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('new_message') || 'New Message'}
                      </h3>
                      <p className={`text-sm opacity-70 ${
                        isHomePage || theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {t('send_message_to') || 'Send message to'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMessagingModalOpen(false)}
                    className={`p-2 rounded-lg ${
                      isHomePage || theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isHomePage || theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('recipient') || 'Recipient'}
                    </label>
                    <select
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isHomePage || theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } border`}
                    >
                      <option value="all">📢 {t('all_students') || 'All Students'}</option>
                      <option value="community">👥 {t('my_communities') || 'My Communities'}</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isHomePage || theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('message') || 'Message'}
                    </label>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={5}
                      className={`w-full rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isHomePage || theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } border`}
                      placeholder={t('type_message_here') || 'Type your message here...'}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsMessagingModalOpen(false)}
                      className={`flex-1 py-3 rounded-lg ${
                        isHomePage || theme === 'dark'
                          ? 'bg-gray-800 hover:bg-gray-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      } transition-colors`}
                    >
                      {t('cancel') || 'Cancel'}
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim()}
                      className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium disabled:opacity-50 transition-all hover:shadow-lg"
                    >
                      <Send className="w-5 h-5 inline mr-2" />
                      {t('send') || 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 left-4 right-4 z-50 lg:hidden"
          >
            <div 
              className="backdrop-blur-xl rounded-2xl p-6 border shadow-2xl"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isHomePage || theme === 'dark'
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderColor: isHomePage || theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
                boxShadow: isHomePage || theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                  : '0 20px 60px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="space-y-4">
                {/* Mobile Controls */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Theme Toggle - скриваме го на home страницата */}
                  {!isHomePage && (
                    <button
                      onClick={toggleTheme}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${
                        theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                      } ${
                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {theme === 'light' ? (t('dark_mode') || "Dark Mode") : (t('light_mode') || "Light Mode")}
                      </span>
                    </button>
                  )}

                  {/* Messages Button Mobile */}
                  {user && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsMessagingModalOpen(true);
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${
                        isHomePage || theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                      } ${
                        isHomePage || theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors relative`}
                    >
                      <Mail size={20} />
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white bg-blue-500">
                          {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                        </span>
                      )}
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {t('messages') || "Messages"}
                      </span>
                    </button>
                  )}

                  <div className="relative col-span-2">
                    <button
                      onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                      className={`flex items-center justify-center gap-2 w-full p-3 rounded-xl border ${
                        isHomePage || theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                      } ${
                        isHomePage || theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <span className="text-lg">{getFlagEmoji(language)}</span>
                      <span className={`font-medium ${
                        isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{currentLanguage?.label}</span>
                      <ChevronDown size={16} />
                    </button>

                    {isLanguageMenuOpen && (
                      <div className={`absolute top-full left-0 right-0 mt-2 ${
                        isHomePage || theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                      } backdrop-blur-xl rounded-xl border ${
                        isHomePage || theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                      } overflow-hidden`}>
                        {languageOptions.map((option) => (
                          <button
                            key={option.code}
                            onClick={() => {
                              setLanguage(option.code as any);
                              setIsLanguageMenuOpen(false);
                            }}
                            className={`flex items-center justify-between w-full px-4 py-3 ${
                              isHomePage || theme === 'dark'
                                ? 'hover:bg-white/10 text-white'
                                : 'hover:bg-gray-100 text-gray-900'
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{option.flag}</span>
                              <span className="font-medium">{option.name}</span>
                            </div>
                            {language === option.code && (
                              <Check size={16} className={isHomePage || theme === 'dark' ? 'text-green-400' : 'text-green-500'} />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="space-y-2">
                  {filteredNavItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.path)}
                      className={`block w-full text-left p-4 rounded-xl transition-all ${
                        isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())
                          ? `bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30`
                          : isHomePage || theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())
                              ? `bg-gradient-to-r from-blue-500 to-cyan-500 text-white`
                              : isHomePage || theme === 'dark' ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.icon}
                          </div>
                          <div>
                            <h3 className={`font-medium ${
                              isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())
                                ? `text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500`
                                : isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </h3>
                          </div>
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                            item.badge === 'ADMIN'
                              ? isHomePage || theme === 'dark'
                                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900'
                              : item.badge === 'TEACHER'
                              ? isHomePage || theme === 'dark'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900'
                              : item.badge === 'PENDING'
                              ? isHomePage || theme === 'dark'
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900'
                              : item.badge === 'STUDENT'
                              ? isHomePage || theme === 'dark'
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                                : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-gray-900'
                              : isHomePage || theme === 'dark'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Mobile Auth Section */}
                <div className="pt-4 border-t border-white/10">
                  {!user ? (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          navigate('/login');
                          setIsMenuOpen(false);
                        }}
                        className={`p-4 rounded-xl border ${
                          isHomePage || theme === 'dark' ? 'border-white/20' : 'border-gray-300'
                        } ${
                          isHomePage || theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
                        } font-medium transition-all`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <User size={20} />
                          {t('sign_in') || "Sign In"}
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/register');
                          setIsMenuOpen(false);
                        }}
                        className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Zap size={20} />
                          {t('get_started') || "Get Started"}
                        </div>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={`p-4 rounded-xl ${
                        isHomePage || theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      } mb-3`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            userData?.role === 'admin'
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : userData?.role === 'teacher'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : userData?.role === 'student'
                              ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                          }`}>
                            <User size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold ${
                              isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                            } text-sm`}>
                              {user.email}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                userData?.role === 'admin'
                                  ? isHomePage || theme === 'dark'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-yellow-500/20 text-yellow-700'
                                  : userData?.role === 'teacher'
                                  ? isHomePage || theme === 'dark'
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-green-500/20 text-green-700'
                                  : userData?.role === 'student'
                                  ? isHomePage || theme === 'dark'
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : 'bg-indigo-500/20 text-indigo-700'
                                  : isHomePage || theme === 'dark'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-blue-500/20 text-blue-700'
                              }`}>
                                {userData?.role === 'admin' ? 'Admin' : 
                                 userData?.role === 'teacher' ? 'Teacher' : 
                                 userData?.role === 'student' ? 'Student' : 'User'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            navigate(getDashboardPath());
                            setIsMenuOpen(false);
                          }}
                          className={`p-3 rounded-xl ${
                            isHomePage || theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
                          } ${
                            isHomePage || theme === 'dark' ? 'text-white' : 'text-gray-900'
                          } font-medium transition-all`}
                        >
                          Dashboard
                        </button>

                        <button
                          onClick={handleLogout}
                          className={`p-3 rounded-xl ${
                            isHomePage || theme === 'dark'
                              ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300' 
                              : 'bg-red-100 hover:bg-red-200 text-red-600'
                          } font-medium transition-all flex items-center justify-center gap-2`}
                        >
                          <LogOut size={18} />
                          {t('logout') || "Logout"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
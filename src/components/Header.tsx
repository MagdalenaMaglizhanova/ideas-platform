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
  Bot
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface HeaderProps {
  isScrolled: boolean;
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

const Header: React.FC<HeaderProps> = ({ isScrolled }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, languageOptions, currentLanguage, t } = useLanguage();

  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Определяне на цвета според темата
  const getThemeColors = () => {
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
    if (userData?.role === 'admin') {
      return t('admin_dashboard') || "Admin Dashboard";
    } else if (userData?.role === 'teacher') {
      return t('teacher_dashboard') || "Teacher Dashboard";
    } else if (userData?.role === 'student') {
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
          name: t('prolog') || "Prolog", 
          icon: <Code className="w-4 h-4" />,
          path: '/prolog-guide',
          color: 'from-amber-500 to-orange-500',
          alwaysVisible: true,
          noAuthRequired: true
        },
        { 
          name: t('about_us') || "About Us", 
          icon: <Users className="w-4 h-4" />,
          path: '/about-us',
          color: 'from-purple-500 to-pink-500',
          alwaysVisible: true,
          noAuthRequired: true
        },
        { 
          name: t('prolog_demo') || "Prolog Demo", 
          icon: <Bot className="w-4 h-4" />,
          path: '/demo-prolog-chat',
          color: 'from-green-500 to-emerald-500',
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
            color: 'from-yellow-500 to-orange-500',
            requiresAuth: true,
            badge: 'ADMIN'
          },
          { 
            name: t('prolog_chat') || "Prolog Chat", 
            icon: <MessageSquare className="w-4 h-4" />,
            path: '/prolog-chat',
            color: 'from-violet-500 to-purple-500',
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
            color: 'from-green-500 to-emerald-500',
            requiresAuth: true,
            badge: 'TEACHER'
          },
          { 
            name: t('prolog_chat') || "Prolog Chat", 
            icon: <MessageSquare className="w-4 h-4" />,
            path: '/prolog-chat',
            color: 'from-violet-500 to-purple-500',
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
            color: 'from-indigo-500 to-blue-500',
            requiresAuth: true,
            badge: 'STUDENT'
          },
          { 
            name: t('prolog_chat') || "Prolog Chat", 
            icon: <MessageSquare className="w-4 h-4" />,
            path: '/prolog-chat',
            color: 'from-violet-500 to-purple-500',
            requiresAuth: true
          }
        ];
      
      default:
        // По подразбиране за логнати потребители без специфична роля
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
    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
              boxShadow: theme === 'dark'
                ? '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
                : '0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05) inset'
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Вътрешен градиент при hover */}
            <div className="absolute inset-0 rounded-[9999px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className={`absolute inset-0 rounded-[9999px] bg-gradient-to-r ${
                theme === 'dark' ? 'from-blue-500/5 via-cyan-500/3 to-transparent' : 'from-blue-500/10 via-cyan-500/5 to-transparent'
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
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500' 
                      : 'bg-gradient-to-br from-yellow-400 to-orange-400'
                  }`}>
                    <Lightbulb className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
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
                      theme === 'dark' 
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
                        theme === 'dark' ? 'text-cyan-300' : 'text-cyan-600'
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
                          ? `bg-gradient-to-r ${item.color} text-white`
                          : theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
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
                                ? theme === 'dark'
                                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                                  : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900'
                                : item.badge === 'TEACHER'
                                ? theme === 'dark'
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900'
                                : theme === 'dark'
                                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                                  : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-gray-900'
                            }`}
                          >
                            {item.badge}
                          </motion.span>
                        )}
                      </div>
                    </div>
                    {(isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())) && (
                      <motion.span
                        className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r ${item.color}`}
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
                {/* Theme Toggle */}
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

                {/* Language Selector */}
                <div className="relative" ref={languageMenuRef}>
                  <motion.button
                    onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${themeColors.border} ${
                      theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
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
                          theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                        } backdrop-blur-xl rounded-xl shadow-2xl border ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
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
                              theme === 'dark'
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

                {/* Auth Buttons / User Menu */}
                {!user ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-full border ${
                        theme === 'dark' ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                      } font-medium ${
                        theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
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
                        boxShadow: theme === 'dark' 
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
                        theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
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
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {user.email?.split('@')[0]}
                          </span>
                          {userData?.role === 'admin' && (
                            <Crown size={14} className="text-yellow-500" />
                          )}
                        </div>
                        <span className={`text-xs font-medium ${
                          userData?.role === 'admin'
                            ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                            : userData?.role === 'teacher'
                            ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                            : userData?.role === 'student'
                            ? theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'
                            : theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {userData?.role === 'admin' ? 'Admin' : 
                           userData?.role === 'teacher' ? 'Teacher' : 
                           userData?.role === 'student' ? 'Student' : 'User'}
                        </span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      } ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className={`absolute right-0 mt-2 w-64 ${
                            theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                          } backdrop-blur-xl rounded-xl shadow-2xl border ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          } overflow-hidden`}
                        >
                          <div className={`p-4 border-b ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
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
                                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {user.email}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                    userData?.role === 'admin'
                                      ? theme === 'dark' 
                                        ? 'bg-yellow-900 text-yellow-300' 
                                        : 'bg-yellow-100 text-yellow-800'
                                      : userData?.role === 'teacher'
                                      ? theme === 'dark'
                                        ? 'bg-green-900 text-green-300'
                                        : 'bg-green-100 text-green-800'
                                      : userData?.role === 'student'
                                      ? theme === 'dark'
                                        ? 'bg-indigo-900 text-indigo-300'
                                        : 'bg-indigo-100 text-indigo-800'
                                      : theme === 'dark'
                                        ? 'bg-blue-900 text-blue-300'
                                        : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {userData?.role === 'admin' ? 'Administrator' : 
                                     userData?.role === 'teacher' ? 'Teacher' : 
                                     userData?.role === 'student' ? 'Student' : 'User'}
                                  </span>
                                  {userData?.isVerified && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                      theme === 'dark'
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
                                theme === 'dark'
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
                                theme === 'dark'
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
                                theme === 'dark'
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
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
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
                backgroundColor: theme === 'dark'
                  ? 'rgba(15, 23, 42, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                borderColor: theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.1)',
                boxShadow: theme === 'dark'
                  ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                  : '0 20px 60px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="space-y-4">
                {/* Mobile Controls */}
                <div className="grid grid-cols-2 gap-3 mb-4">
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

                  <div className="relative">
                    <button
                      onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                      className={`flex items-center justify-center gap-2 w-full p-3 rounded-xl border ${
                        theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                      } ${
                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                    >
                      <span className="text-lg">{getFlagEmoji(language)}</span>
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{currentLanguage?.label}</span>
                      <ChevronDown size={16} />
                    </button>

                    {isLanguageMenuOpen && (
                      <div className={`absolute top-full left-0 right-0 mt-2 ${
                        theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'
                      } backdrop-blur-xl rounded-xl border ${
                        theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                      } overflow-hidden`}>
                        {languageOptions.map((option) => (
                          <button
                            key={option.code}
                            onClick={() => {
                              setLanguage(option.code as any);
                              setIsLanguageMenuOpen(false);
                            }}
                            className={`flex items-center justify-between w-full px-4 py-3 ${
                              theme === 'dark'
                                ? 'hover:bg-white/10 text-white'
                                : 'hover:bg-gray-100 text-gray-900'
                            } transition-colors`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{option.flag}</span>
                              <span className="font-medium">{option.name}</span>
                            </div>
                            {language === option.code && (
                              <Check size={16} className={theme === 'dark' ? 'text-green-400' : 'text-green-500'} />
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
                          ? `bg-gradient-to-r ${item.color}/20 border ${
                              theme === 'dark' 
                                ? `${item.color.replace('from-', 'border-').replace('to-', '')}/30`
                                : `${item.color.replace('from-', 'border-').replace('to-', '')}/50`
                            }`
                          : theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())
                              ? `bg-gradient-to-r ${item.color} text-white`
                              : theme === 'dark' ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.icon}
                          </div>
                          <div>
                            <h3 className={`font-medium ${
                              isActive(item.path) || (item.path === getDashboardPath() && isDashboardActive())
                                ? `text-transparent bg-clip-text bg-gradient-to-r ${item.color}` 
                                : theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {item.name}
                            </h3>
                          </div>
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                            item.badge === 'ADMIN'
                              ? theme === 'dark'
                                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white'
                                : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900'
                              : item.badge === 'TEACHER'
                              ? theme === 'dark'
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900'
                              : theme === 'dark'
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                                : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-gray-900'
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
                          theme === 'dark' ? 'border-white/20' : 'border-gray-300'
                        } ${
                          theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:bg-gray-100'
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
                        theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
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
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            } text-sm`}>
                              {user.email}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                userData?.role === 'admin'
                                  ? theme === 'dark'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-yellow-500/20 text-yellow-700'
                                  : userData?.role === 'teacher'
                                  ? theme === 'dark'
                                    ? 'bg-green-500/20 text-green-300'
                                    : 'bg-green-500/20 text-green-700'
                                  : userData?.role === 'student'
                                  ? theme === 'dark'
                                    ? 'bg-indigo-500/20 text-indigo-300'
                                    : 'bg-indigo-500/20 text-indigo-700'
                                  : theme === 'dark'
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
                            theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
                          } ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          } font-medium transition-all`}
                        >
                          Dashboard
                        </button>

                        <button
                          onClick={handleLogout}
                          className={`p-3 rounded-xl ${
                            theme === 'dark' 
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
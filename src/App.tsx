import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAnimation } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Dashboard from './components/Dashboard';
import DigitalBulgariaInitiative from './components/DigitalBulgariaInitiative'; // Импортиране на новия компонент
import Footer from './components/Footer';
import Background from './components/Background';
import TeacherDashboard from './components/TeacherDashboard';
import LessonPlanner from './components/LessonPlanner';
import Login from './components/Login';
import Register from './components/Register';
import PrologChat from './components/PrologChat';
import AdminDashboard from './components/AdminDashboard';
import StudentsDashboard from './components/StudentsDashboard';
import PrologGuide from './components/PrologGuide';
import DemoPrologChat from './components/DemoPrologChat';
import AboutUs from './components/AboutUs';
import TeacherPending from './components/TeacherPending';


const teamPhotos = {
  pic1: '/images/Picture1.png',
  pic2: '/images/Picture2.png', 
  pic3: '/images/Picture4.png'
};

// Компонент за начална страница
const HomePage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
      setMousePosition({
        x: (e as MouseEvent).clientX / window.innerWidth,
        y: (e as MouseEvent).clientY / window.innerHeight,
      });
    };

    controls.start({
      y: [0, -10, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    });

    window.addEventListener('mousemove', handleMouseMove as EventListener);
    return () => window.removeEventListener('mousemove', handleMouseMove as EventListener);
  }, [controls]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Background mousePosition={mousePosition} />
      <main className="relative z-10 pt-16">
        <Hero />
        <DigitalBulgariaInitiative />
        <Features />
        <div className="px-6 lg:px-12">
          <Dashboard isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
        </div>
      </main>
    </div>
  );
};

// Защитен маршрут за автентикация
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | null;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = null,
  allowedRoles 
}) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace={true} />;
  }
  
  // Проверка за конкретна роля
  if (requiredRole && userData?.role !== requiredRole) {
    return <Navigate to="/" replace={true} />;
  }
  
  // Проверка за множество роли
  if (allowedRoles && !allowedRoles.includes(userData?.role || '')) {
    return <Navigate to="/" replace={true} />;
  }
  
  return <>{children}</>;
};

// Главен App компонент със всички провайдъри
const AppContent = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  console.log('AppContent - Current path:', location.pathname);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header isScrolled={isScrolled} />
      
      <Routes>
        {/* Публични маршрути */}
        <Route path="/" element={<HomePage />} />
        <Route path="/prolog-guide" element={<PrologGuide />} />
        <Route path="/about-us" element={<AboutUs {...teamPhotos} />} />
        <Route path="/demo-prolog-chat" element={<DemoPrologChat />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Маршрут за чакащи одобрение учители */}
        <Route path="/teacher/pending" element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherPending />
          </ProtectedRoute>
        } />
        
        {/* Защитени маршрути за учители */}
        <Route path="/teacher-dashboard" element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/lesson-planner" element={
          <ProtectedRoute requiredRole="teacher">
            <LessonPlanner />
          </ProtectedRoute>
        } />
        
        {/* Защитен маршрут за уроците */}
        <Route path="/lessons" element={
          <ProtectedRoute requiredRole="teacher">
            <LessonPlanner />
          </ProtectedRoute>
        } />
        
        
        {/* Защитени маршрути за админи */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Защитени маршрути за студенти */}
        <Route path="/students-dashboard" element={
          <ProtectedRoute requiredRole="student">
            <StudentsDashboard />
          </ProtectedRoute>
        } />

        {/* Защитен маршрут за Prolog чата (достъпен за всички логнати) */}
        <Route path="/prolog-chat" element={
          <ProtectedRoute>
            <PrologChat />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route за debugging */}
        <Route path="*" element={
          <div className="pt-32 text-center">
            <h1 className="text-4xl font-bold text-red-400 mb-4">Route not found: {location.pathname}</h1>
            <p className="text-gray-400">Check your routing configuration</p>
            <button 
              onClick={() => window.history.back()} 
              className="mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
            >
              Go Back
            </button>
          </div>
        } />
      </Routes>
      
      {isHomePage && <Footer isScrolled={isScrolled} />}
    </div>
  );
};

// Основният App компонент, който увива всичко в провайдърите
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
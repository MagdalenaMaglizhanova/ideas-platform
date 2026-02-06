// src/components/TeacherPending.tsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clock, 
  GraduationCap, 
  CheckCircle, 
  Mail,
  Shield,
  Users,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";

const TeacherPending = () => {
  const { user, userData, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Проверяваме дали учителят вече е одобрен
  // Коригирания useEffect
  useEffect(() => {
    // Проверяваме дали статусът е активен (approved), а не 'pending'
    if (userData?.status === 'active') {
      navigate('/teacher-dashboard');
    }
  }, [userData, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20 p-4">
      {/* Добавен pt-20 за да се компенсира header-а */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 md:p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold">
                    {t?.('teacher_pending_approval') || "Очакване на одобрение"}
                  </h1>
                  <p className="text-blue-100 mt-1 text-sm md:text-base">
                    {t?.('welcome_teacher') || "Добре дошли, учителю!"}
                  </p>
                </div>
              </div>
              <Clock className="w-6 h-6 md:w-8 md:h-8 opacity-80" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-center mb-6 md:mb-8">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                  <Clock className="w-10 h-10 md:w-12 md:h-12 text-blue-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-3">
                {t?.('account_under_review') || "Вашият акаунт е в процес на одобрение"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 md:text-lg mb-4 md:mb-6">
                {t?.('admin_approval_needed') || "Вашият акаунт трябва да бъде одобрен от администратор, преди да получите достъп до учителския панел."}
              </p>
            </div>

            {/* Status Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className={`p-4 rounded-xl border-2 ${userData ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-900/30'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${userData ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center`}>
                    {userData ? (
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm md:text-base">
                    {t?.('step_1') || "Създаване на профил"}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                  {userData 
                    ? t?.('profile_created') || "Профилът ви е създаден успешно"
                    : t?.('create_profile') || "Създаване на учителски профил"
                  }
                </p>
              </div>

              <div className={`p-4 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-900/20`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center`}>
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm md:text-base">
                    {t?.('step_2') || "Одобрение от администратор"}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                  {t?.('awaiting_admin_approval') || "Вашият акаунт чака одобрение от администратор"}
                </p>
              </div>

              <div className={`p-4 rounded-xl border-2 border-gray-300 bg-gray-50 dark:bg-gray-900/30`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm md:text-base">
                    {t?.('step_3') || "Достъп до панела"}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                  {t?.('access_dashboard') || "Ще получите достъп до всички учителски функции"}
                </p>
              </div>
            </div>

            {/* User Info */}
            {userData && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-blue-200 dark:border-blue-800">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3 md:mb-4">
                  {t?.('your_information') || "Вашата информация"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{t?.('full_name') || "Име"}</p>
                    <p className="font-medium text-gray-800 dark:text-white text-sm md:text-base">{userData.fullName || "Не е попълнено"}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{t?.('email') || "Имейл"}</p>
                    <p className="font-medium text-gray-800 dark:text-white text-sm md:text-base break-all">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{t?.('institution') || "Училище/Институция"}</p>
                    <p className="font-medium text-gray-800 dark:text-white text-sm md:text-base">{userData.institution || "Не е попълнено"}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{t?.('status') || "Статус"}</p>
                    <span className="inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      <Clock className="w-3 h-3 mr-1" />
                      {t?.('pending_approval') || "Чака одобрение"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
              <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3">
                {t?.('what_happens_next') || "Какво следва?"}
              </h3>
              <ul className="space-y-2 md:space-y-3">
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                    {t?.('step1_description') || "Администраторът ще прегледа вашата регистрация"}
                  </p>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                    {t?.('step2_description') || "Ще получите имейл, когато акаунтът ви бъде одобрен"}
                  </p>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                    {t?.('step3_description') || "След одобрение ще имате пълен достъп до учителския панел"}
                  </p>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                {t?.('refresh_status') || "Провери статуса"}
              </button>
              
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-white font-medium rounded-xl hover:from-gray-400 hover:to-gray-500 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-300 text-sm md:text-base"
              >
                {t?.('logout') || "Изход"}
              </button>
              
              <button
                onClick={() => navigate("/contact")}
                className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 text-sm md:text-base"
              >
                {t?.('contact_admin') || "Свържете се с нас"}
              </button>
            </div>

            {/* Estimated Time */}
            <div className="mt-6 md:mt-8 text-center">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                ⏱️ {t?.('estimated_approval_time') || "Одобрението обикновено отнема 24-48 часа в работни дни"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TeacherPending;
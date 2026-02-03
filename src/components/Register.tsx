import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Rocket, 
  TrendingUp, 
  Users,
  Lightbulb,
  AlertCircle,
  Shield,
  ArrowRight,
  User,
  School,
  GraduationCap,
  Building,
  Award,
  Layers,
  UserCog
} from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [institution, setInstitution] = useState("");
  const [grade, setGrade] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Валидационни съобщения
    const validationMessages = {
      passwordMismatch: t('password_mismatch') || "Passwords don't match",
      passwordTooShort: t('password_too_short') || "Password must be at least 6 characters",
      nameRequired: t('name_required') || "Please enter your full name",
      institutionRequired: t('institution_required') || "Please enter your institution",
      emailRequired: t('email_required') || "Please enter your email",
      emailInvalid: t('invalid_email') || "Please enter a valid email address"
    };

    // Валидации
    if (!fullName.trim()) {
      setError(validationMessages.nameRequired);
      return;
    }

    if (!institution.trim()) {
      setError(validationMessages.institutionRequired);
      return;
    }

    if (!email.trim()) {
      setError(validationMessages.emailRequired);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(validationMessages.emailInvalid);
      return;
    }

    if (password !== confirmPassword) {
      setError(validationMessages.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      setError(validationMessages.passwordTooShort);
      return;
    }

    setIsLoading(true);

    try {
      // Създаване на потребител
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Базови данни за потребител
      const userData: any = {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        role: role,
        institution: institution,
        language: language,
        theme: theme,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        emailVerified: false,
      };

      // Добавяне на специфични полета според ролята
      if (role === "student") {
        userData.grade = grade || null;
        userData.enrolledCourses = [];
        userData.completedLessons = [];
        userData.completedAssignments = [];
        userData.points = 0;
        userData.level = 1;
        userData.currentProjects = [];
        userData.badges = [];
        userData.streak = 0;
        userData.teacherId = null;
        userData.classId = null;
        userData.status = "active";
      } else if (role === "teacher") {
        userData.specialty = specialty || null;
        userData.createdLessons = [];
        userData.createdAssignments = [];
        userData.createdProjects = [];
        userData.studentIds = [];
        userData.classes = [];
        userData.isVerified = false;
        userData.teacherCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        userData.status = "pending";
      }

      // Записване в Firestore
      await setDoc(doc(db, "users", user.uid), userData);

      // Съобщение за успех
      let successMessage = "";
      if (language === 'bg') {
        successMessage = `Успешна регистрация! Добре дошли в IDEAS като ${role === 'student' ? 'ученик' : 'учител'}.`;
        if (role === 'teacher') {
          successMessage += " Профилът ви ще бъде прегледан преди активиране.";
        }
      } else if (language === 'es') {
        successMessage = `¡Registro exitoso! Bienvenido a IDEAS como ${role === 'student' ? 'estudiante' : 'profesor'}.`;
        if (role === 'teacher') {
          successMessage += " Tu perfil será revisado antes de la activación.";
        }
      } else {
        successMessage = `Registration successful! Welcome to IDEAS as a ${role}.`;
        if (role === 'teacher') {
          successMessage += " Your profile will be reviewed before activation.";
        }
      }

      // Пренасочване според ролята
      setTimeout(() => {
        if (role === "student") {
          navigate("/dashboard/student");
        } else {
          navigate("/teacher/pending");
        }
      }, 1500);

    } catch (err: any) {
      // Грешки от Firebase
      let errorMessage = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = t('email_in_use') || "Email already in use";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t('invalid_email') || "Invalid email address";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = t('password_weak') || "Password is too weak";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const benefits = [
    {
      icon: <Rocket className="w-5 h-5" />,
      text: t('access_projects') || "Access your projects"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      text: t('track_progress') || "Track your progress"
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: t('collaborate_peers') || "Collaborate with peers"
    }
  ];

  return (
    <div className={`min-h-screen pt-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Background effects - ABSOLUTELY IDENTICAL TO LOGIN */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900' 
            : 'bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50'
        }`} />
        
        {/* Animated shapes - IDENTICAL TO LOGIN */}
        <motion.div
          className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full ${
            theme === 'dark' 
              ? 'bg-blue-500/10' 
              : 'bg-blue-400/10'
          } blur-3xl`}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full ${
            theme === 'dark' 
              ? 'bg-purple-500/10' 
              : 'bg-purple-400/10'
          } blur-3xl`}
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-6xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left side - Branding - IDENTICAL TO LOGIN */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col justify-center"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-br from-yellow-400 to-orange-400'
                }`}>
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    IDEAS
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {t('innovation_platform') || "Innovation Platform"}
                  </p>
                </div>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  {t('join_community') || "Join the"}
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  IDEAS Platform
                </span>
              </h2>

              <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('register_description') || "Start your journey in AI-powered STEM education and explore interactive programming concepts."}
              </p>

              {/* Benefits - IDENTICAL STYLE TO LOGIN */}
              <div className="space-y-4 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`flex items-center gap-3 p-4 rounded-xl ${
                      theme === 'dark'
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white border border-gray-200 shadow-sm'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`p-2 rounded-lg ${
                      theme === 'dark'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {benefit.icon}
                    </div>
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      {benefit.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Security badges - IDENTICAL TO LOGIN */}
              <div className={`p-6 rounded-2xl ${
                theme === 'dark'
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <Shield className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {t('secure_login') || "Secure & Encrypted"}
                  </span>
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('security_description') || "Your data is protected with industry-standard encryption and security protocols."}
                </p>
              </div>
            </motion.div>

            {/* Right side - Register Form - SIMILAR STRUCTURE TO LOGIN */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center"
            >
              <div className={`w-full max-w-md rounded-2xl p-8 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                  : 'bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl'
              }`}>
                {/* Form Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {t('create_account') || "Create Your Account"}
                    </span>
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('start_journey') || "Start your STEM learning journey today"}
                  </p>
                </div>

                {/* Error Message - IDENTICAL TO LOGIN */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                        theme === 'dark'
                          ? 'bg-red-500/10 border border-red-500/20'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`} />
                      <span className={theme === 'dark' ? 'text-red-300' : 'text-red-600'}>
                        {error}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Register Form */}
                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('full_name') || "Full Name"}
                      </div>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('enter_full_name') || "Enter your full name"}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } transition-all outline-none`}
                      required
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4" />
                        {t('select_role') || "Select Your Role"}
                      </div>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`p-4 rounded-lg border transition-all ${
                          role === 'student'
                            ? theme === 'dark'
                              ? 'bg-blue-500/20 border-blue-500 text-white'
                              : 'bg-blue-100 border-blue-500 text-blue-700'
                            : theme === 'dark'
                              ? 'bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <GraduationCap className="w-5 h-5" />
                          <span className="text-sm font-medium">{t('student') || "Student"}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`p-4 rounded-lg border transition-all ${
                          role === 'teacher'
                            ? theme === 'dark'
                              ? 'bg-blue-500/20 border-blue-500 text-white'
                              : 'bg-blue-100 border-blue-500 text-blue-700'
                            : theme === 'dark'
                              ? 'bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <School className="w-5 h-5" />
                          <span className="text-sm font-medium">{t('teacher') || "Teacher"}</span>
                        </div>
                      </button>
                    </div>
                    {role === 'teacher' && (
                      <div className={`mt-3 p-3 rounded-lg text-sm ${
                        theme === 'dark'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>{t('teacher_approval_note') || "Teacher profiles require admin approval"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Institution */}
                  <div>
                    <label htmlFor="institution" className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {t('institution') || "Institution"}
                      </div>
                    </label>
                    <input
                      type="text"
                      id="institution"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder={t('enter_institution') || "School/University/Institution"}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } transition-all outline-none`}
                      required
                    />
                  </div>

                  {/* Student/Teacher Specific Fields */}
                  <AnimatePresence>
                    {role === 'student' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div>
                          <label htmlFor="grade" className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              {t('grade_course') || "Grade/Course"}
                            </div>
                          </label>
                          <input
                            type="text"
                            id="grade"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder={t('enter_grade') || "Grade/Course (optional)"}
                            className={`w-full px-4 py-3 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                            } transition-all outline-none`}
                          />
                        </div>
                      </motion.div>
                    )}

                    {role === 'teacher' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div>
                          <label htmlFor="specialty" className={`block text-sm font-medium mb-2 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4" />
                              {t('specialty') || "Specialty"}
                            </div>
                          </label>
                          <input
                            type="text"
                            id="specialty"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder={t('enter_specialty') || "Subject/Specialty (optional)"}
                            className={`w-full px-4 py-3 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                            } transition-all outline-none`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email - IDENTICAL TO LOGIN */}
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {t('email_address') || "Email Address"}
                      </div>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('enter_email') || "Enter your email"}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } transition-all outline-none`}
                      required
                    />
                  </div>

                  {/* Password - IDENTICAL TO LOGIN */}
                  <div>
                    <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t('password') || "Password"}
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('create_password') || "Create a password (min. 6 characters)"}
                        className={`w-full px-4 py-3 rounded-lg border pr-12 ${
                          theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        } transition-all outline-none`}
                        required
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-gray-300'
                            : 'text-gray-500 hover:text-gray-700'
                        } transition-colors`}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {t('confirm_password') || "Confirm Password"}
                      </div>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('confirm_password_placeholder') || "Confirm your password"}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      } transition-all outline-none`}
                      required
                    />
                  </div>

                  {/* Terms Agreement */}
                  <div className="space-y-3">
                    <label className={`flex items-start gap-3 cursor-pointer ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <input
                        type="checkbox"
                        required
                        className={`w-4 h-4 mt-1 rounded ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-blue-500'
                            : 'bg-white border-gray-300 text-blue-600'
                        } focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <span className="text-sm">
                        {t('i_agree_to') || "I agree to the "}
                        <button type="button" className={`font-medium ${
                          theme === 'dark'
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-600 hover:text-blue-700'
                        } transition-colors`}>
                          {t('terms_of_service') || "Terms of Service"}
                        </button>
                        {t('and') || " and "}
                        <button type="button" className={`font-medium ${
                          theme === 'dark'
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-600 hover:text-blue-700'
                        } transition-colors`}>
                          {t('privacy_policy') || "Privacy Policy"}
                        </button>
                      </span>
                    </label>
                    <label className={`flex items-start gap-3 cursor-pointer ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <input
                        type="checkbox"
                        defaultChecked
                        className={`w-4 h-4 mt-1 rounded ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-blue-500'
                            : 'bg-white border-gray-300 text-blue-600'
                        } focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <span className="text-sm">
                        {t('send_updates') || "Send me educational resources and updates"}
                      </span>
                    </label>
                  </div>

                  {/* Submit Button - SIMILAR STYLE TO LOGIN */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    className={`w-full py-4 px-6 rounded-xl font-medium text-white relative overflow-hidden ${
                      isLoading
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/30'
                    } transition-all duration-300`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('creating_account') || "Creating Account..."}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <UserPlus className="w-5 h-5" />
                        <span>{t('create_ideas_account') || "Create IDEAS Account"}</span>
                      </div>
                    )}
                  </motion.button>

                  {/* Divider - IDENTICAL TO LOGIN */}
                  <div className="relative">
                    <div className={`absolute inset-0 flex items-center ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                    }`}>
                      <div className="w-full border-t"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className={`px-4 ${
                        theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                      }`}>
                        {t('already_have_account') || "Already have an account?"}
                      </span>
                    </div>
                  </div>

                  {/* Login Link - REVERSE OF LOGIN'S REGISTER LINK */}
                  <Link
                    to="/login"
                    className={`block w-full py-3 px-6 rounded-xl border text-center font-medium transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-gray-700 text-gray-300 hover:bg-white/5 hover:border-gray-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <ArrowRight className="w-5 h-5" />
                      <span>{t('sign_in_existing') || "Sign In to Existing Account"}</span>
                    </div>
                  </Link>
                </form>

                {/* Footer - IDENTICAL TO LOGIN */}
                <div className={`mt-8 pt-6 border-t ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <p className={`text-center text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {t('terms_agreement') || "By continuing, you agree to our "}
                    <button className={`font-medium ${
                      theme === 'dark'
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-700'
                    } transition-colors`}>
                      {t('terms_of_service') || "Terms of Service"}
                    </button>
                    {t('and') || " and "}
                    <button className={`font-medium ${
                      theme === 'dark'
                        ? 'text-blue-400 hover:text-blue-300'
                        : 'text-blue-600 hover:text-blue-700'
                    } transition-colors`}>
                      {t('privacy_policy') || "Privacy Policy"}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
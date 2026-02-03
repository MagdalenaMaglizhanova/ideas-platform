import { useState} from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Rocket, 
  TrendingUp, 
  Users,
  Lightbulb,
  AlertCircle,
  Shield
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Вземане на Firestore данни за потребителя
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        setError("User data not found. Please register first.");
        return;
      }

      const userData = userSnap.data();
      console.log("User data from Firestore:", userData);

      // ✅ ПРОВЕРКА ЗА РОЛЯ И СТАТУС И ПРЕНАСОЧВАНЕ
      if (!userData.role) {
        setError("User role not defined. Please contact administrator.");
        return;
      }

      // ПРЕНАСОЧВАНЕ СПОРЕД РОЛЯ
     if (userData.role === 'admin') {
  // Администратор → /teacher-dashboard (временно)
  navigate("/teacher-dashboard");
} 
else if (userData.role === 'teacher') {
  // Учител → проверка за статус
  if (userData.status === 'pending') {
    // Този route не съществува, пренасочете към teacher-dashboard
    navigate("/teacher-dashboard");
  } else if (userData.status === 'active') {
    // Активен учител → /teacher-dashboard (това е единственият съществуващ dashboard)
    navigate("/teacher-dashboard");
  } else if (userData.status === 'rejected') {
    setError("Your teacher account has been rejected. Please contact administrator.");
  } else {
    // По подразбиране за учители
    navigate("/teacher-dashboard");
  }
}
else if (userData.role === 'student') {
  navigate("/students-dashboard");
}
else {
  // Ако няма дефинирана роля, към /teacher-dashboard
  navigate("/teacher-dashboard");
}
    } catch (err: any) {
      // Преводи на грешките
      let errorMessage = err.message;
      if (err.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password";
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = "User not found. Please register first.";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Wrong password. Please try again.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
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
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900' 
            : 'bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50'
        }`} />
        
        {/* Animated shapes */}
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
            {/* Left side - Branding */}
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
                  {t('welcome_back') || "Welcome Back to"}
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  IDEAS Platform
                </span>
              </h2>

              <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {t('login_description') || "Continue your journey in AI-powered STEM education and explore interactive programming concepts."}
              </p>

              {/* Benefits */}
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

              {/* Security badges */}
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

            {/* Right side - Login Form */}
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
                      {t('sign_in_account') || "Sign In to Your Account"}
                    </span>
                  </h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {t('enter_credentials') || "Enter your credentials to continue learning"}
                  </p>
                </div>

                {/* Error Message */}
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

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {t('email_address') || "Email Address"}
                      </div>
                    </label>
                    <div className="relative">
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
                  </div>

                  {/* Password Input */}
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
                        placeholder={t('enter_password') || "Enter your password"}
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

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between">
                    <label className={`flex items-center gap-2 cursor-pointer ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <input
                        type="checkbox"
                        className={`w-4 h-4 rounded ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-blue-500'
                            : 'bg-white border-gray-300 text-blue-600'
                        } focus:ring-2 focus:ring-blue-500/20`}
                      />
                      <span className="text-sm">{t('remember_me') || "Remember me"}</span>
                    </label>
                    <button
                      type="button"
                      className={`text-sm font-medium ${
                        theme === 'dark'
                          ? 'text-blue-400 hover:text-blue-300'
                          : 'text-blue-600 hover:text-blue-700'
                      } transition-colors`}
                    >
                      {t('forgot_password') || "Forgot password?"}
                    </button>
                  </div>

                  {/* Submit Button */}
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
                        <span>{t('signing_in') || "Signing In..."}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <LogIn className="w-5 h-5" />
                        <span>{t('sign_in_ideas') || "Sign In to IDEAS"}</span>
                      </div>
                    )}
                  </motion.button>

                  {/* Divider */}
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
                        {t('new_to_ideas') || "New to IDEAS?"}
                      </span>
                    </div>
                  </div>

                  {/* Register Link */}
                  <Link
                    to="/register"
                    className={`block w-full py-3 px-6 rounded-xl border text-center font-medium transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-gray-700 text-gray-300 hover:bg-white/5 hover:border-gray-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <UserPlus className="w-5 h-5" />
                      <span>{t('create_account') || "Create an Account"}</span>
                    </div>
                  </Link>
                </form>

                {/* Footer */}
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
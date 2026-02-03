import React, { useState, type JSX, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, BookOpen, Users, TrendingUp, 
  Activity, Play, Pause, Maximize2, Minimize2, School,
  FileText, Globe, Cpu, Shield
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface DashboardProps {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
}

interface Metric {
  labelKey: string;
  value: number | string;
  change: string;
  color: string;
  icon: JSX.Element;
}

type DashboardKey = 'schools' | 'knowledge' | 'education';

interface DashboardItem {
  titleKey: string;
  icon: JSX.Element;
  color: string;
  metrics: Metric[];
  chartData: number[];
}

interface DashboardData {
  schools: DashboardItem;
  knowledge: DashboardItem;
  education: DashboardItem;
}

const Dashboard: React.FC<DashboardProps> = ({ isFullscreen, setIsFullscreen }) => {
  const { t } = useLanguage();
  const [activeDashboard, setActiveDashboard] = useState<DashboardKey>('schools');
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Dashboard ключове
  const dashboardKeys: DashboardKey[] = ['schools', 'knowledge', 'education'];
  
  const getDashboardName = (key: DashboardKey): string => {
    const translations: Record<DashboardKey, string> = {
      schools: t('dashboard_schools') || 'Училища и Потребители',
      knowledge: t('dashboard_knowledge') || 'Бази Знания',
      education: t('dashboard_education') || 'Образователни Материали'
    };
    return translations[key];
  };

  // Статистики - измислени данни
  const statistics = {
    totalSchools: 156,
    activeSchools: 142,
    registeredUsers: 4873,
    activeUsers: 4321,
    knowledgeBases: 342,
    biologyBases: 45,
    geographyBases: 38,
    mathematicsBases: 67,
    chemistryBases: 29,
    physicsBases: 41,
    historyBases: 36,
    literatureBases: 31,
    languageBases: 55
  };

  const dashboards: DashboardData = {
    schools: {
      titleKey: 'dashboard_schools',
      icon: <School className="w-5 h-5" />,
      color: "from-blue-400 to-cyan-500",
      metrics: [
        { 
          labelKey: 'total_schools', 
          value: statistics.totalSchools, 
          change: "+12%", 
          color: "bg-blue-400",
          icon: <School className="w-4 h-4" />
        },
        { 
          labelKey: 'active_schools_dash', 
          value: statistics.activeSchools, 
          change: "+8%", 
          color: "bg-cyan-400",
          icon: <Activity className="w-4 h-4" />
        },
        { 
          labelKey: 'registered_users', 
          value: statistics.registeredUsers, 
          change: "+18%", 
          color: "bg-indigo-400",
          icon: <Users className="w-4 h-4" />
        },
        { 
          labelKey: 'active_users_dash', 
          value: statistics.activeUsers, 
          change: "+15%", 
          color: "bg-purple-400",
          icon: <TrendingUp className="w-4 h-4" />
        }
      ],
      chartData: [120, 128, 135, 142, 148, 152, 156]
    },
    knowledge: {
      titleKey: 'dashboard_knowledge',
      icon: <Database className="w-5 h-5" />,
      color: "from-green-400 to-emerald-500",
      metrics: [
        { 
          labelKey: 'total_knowledge_bases', 
          value: statistics.knowledgeBases, 
          change: "+23%", 
          color: "bg-green-400",
          icon: <Database className="w-4 h-4" />
        },
        { 
          labelKey: 'biology_bases', 
          value: statistics.biologyBases, 
          change: "+15%", 
          color: "bg-emerald-400",
          icon: <Globe className="w-4 h-4" />
        },
        { 
          labelKey: 'geography_bases', 
          value: statistics.geographyBases, 
          change: "+12%", 
          color: "bg-lime-400",
          icon: <Globe className="w-4 h-4" />
        },
        { 
          labelKey: 'mathematics_bases', 
          value: statistics.mathematicsBases, 
          change: "+28%", 
          color: "bg-teal-400",
          icon: <Cpu className="w-4 h-4" />
        }
      ],
      chartData: [250, 275, 295, 312, 325, 335, 342]
    },
    education: {
      titleKey: 'dashboard_education',
      icon: <BookOpen className="w-5 h-5" />,
      color: "from-purple-400 to-pink-500",
      metrics: [
        { 
          labelKey: 'chemistry_bases', 
          value: statistics.chemistryBases, 
          change: "+10%", 
          color: "bg-purple-400",
          icon: <BookOpen className="w-4 h-4" />
        },
        { 
          labelKey: 'physics_bases', 
          value: statistics.physicsBases, 
          change: "+18%", 
          color: "bg-pink-400",
          icon: <BookOpen className="w-4 h-4" />
        },
        { 
          labelKey: 'history_bases', 
          value: statistics.historyBases, 
          change: "+9%", 
          color: "bg-rose-400",
          icon: <BookOpen className="w-4 h-4" />
        },
        { 
          labelKey: 'literature_bases', 
          value: statistics.literatureBases, 
          change: "+11%", 
          color: "bg-orange-400",
          icon: <FileText className="w-4 h-4" />
        }
      ],
      chartData: [85, 92, 98, 103, 112, 125, 136]
    }
  };

  // Автоматично превключване на dashboard-ите
  useEffect(() => {
    let intervalId: number | null = null;
    
    if (isPlaying) {
      intervalId = window.setInterval(() => {
        setActiveDashboard(current => {
          const currentIndex = dashboardKeys.indexOf(current);
          const nextIndex = (currentIndex + 1) % dashboardKeys.length;
          return dashboardKeys[nextIndex];
        });
      }, 5000);
    }
    
    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: "spring" }}
      className={`relative mb-32 ${isFullscreen ? 'fixed inset-0 z-50 p-8 bg-black/95 backdrop-blur-lg' : 'w-[90%] max-w-6xl mx-auto'}`}
    >
      <div className="bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl rounded-3xl border border-white/20 p-1">
        <div className="bg-gray-900/50 rounded-2xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="text-gray-300 font-mono flex items-center gap-2 text-sm md:text-base">
                <Database className="w-4 h-4" />
                <span>platform.ideas.edu</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-green-400 text-sm"
                >
                  ● {t('live_status') || 'НА ЖИВО'}
                </motion.span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex gap-2 bg-white/5 rounded-xl p-1">
                {dashboardKeys.map((key) => (
                  <motion.button
                    key={key}
                    onClick={() => {
                      setActiveDashboard(key);
                      setIsPlaying(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeDashboard === key 
                        ? `bg-gradient-to-r ${dashboards[key].color} text-white` 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {dashboards[key].icon}
                    <span className="hidden lg:inline">{getDashboardName(key)}</span>
                    <span className="lg:hidden">
                      {key === 'schools' ? t('schools_short') || 'Училища' : 
                       key === 'knowledge' ? t('knowledge_short') || 'Бази' : 
                       t('education_short') || 'Материали'}
                    </span>
                  </motion.button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setIsPlaying(!isPlaying)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </motion.button>
                
                <motion.button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Мобилни бутони */}
          <div className="md:hidden flex gap-2 mb-4">
            {dashboardKeys.map((key) => (
              <motion.button
                key={key}
                onClick={() => {
                  setActiveDashboard(key);
                  setIsPlaying(false);
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeDashboard === key 
                    ? `bg-gradient-to-r ${dashboards[key].color} text-white` 
                    : 'text-gray-400 hover:text-white bg-white/5'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {dashboards[key].icon}
                {key === 'schools' ? t('schools_short') || 'Училища' : 
                 key === 'knowledge' ? t('knowledge_short') || 'Бази' : 
                 t('education_short') || 'Материали'}
              </motion.button>
            ))}
          </div>
          
          {/* Индикатор за текущия dashboard */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold">
                {t(dashboards[activeDashboard].titleKey as any) || getDashboardName(activeDashboard)}
              </h2>
              {isPlaying && (
                <div className="text-xs md:text-sm text-green-400">
                  {t('auto_rotate') || 'Автоматично превключване'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dashboardKeys.map((key, index) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveDashboard(key);
                    setIsPlaying(false);
                  }}
                  className={`text-xs hover:text-white transition-colors ${
                    activeDashboard === key ? 'text-green-400 font-medium' : 'text-gray-400'
                  }`}
                >
                  {index > 0 && <span className="text-gray-600 mx-1">•</span>}
                  {getDashboardName(key).split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDashboard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 md:space-y-6"
            >
              {/* Статистики */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {dashboards[activeDashboard].metrics.map((metric, index) => (
                  <motion.div
                    key={metric.labelKey}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${metric.color.replace('bg-', 'bg-')}/10`}>
                          {metric.icon}
                        </div>
                        <span className="text-gray-400 text-xs md:text-sm">
                          {t(metric.labelKey as any) || metric.labelKey}
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${metric.color}`} />
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xl md:text-2xl font-bold">{metric.value}</span>
                      <span className={`text-xs md:text-sm ${metric.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {metric.change}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* График и допълнителна информация */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Графика */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-2">
                    <h3 className="text-base md:text-lg font-semibold">
                      {activeDashboard === 'schools' ? t('growth_trend_schools') || 'Растеж на училищата' :
                       activeDashboard === 'knowledge' ? t('growth_trend_knowledge') || 'Растеж на базите знания' :
                       t('growth_trend_education') || 'Растеж на материалите'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                      <Activity className="w-4 h-4" />
                      <span>{t('last_7_days') || 'Последните 7 дни'}</span>
                    </div>
                  </div>
                  <div className="h-48 md:h-64 flex items-end gap-1">
                    {dashboards[activeDashboard].chartData.map((value, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${(value / Math.max(...dashboards[activeDashboard].chartData)) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.05 }}
                        className={`flex-1 bg-gradient-to-t ${activeDashboard === 'schools' ? 'from-blue-500/30 to-cyan-500/80' :
                                         activeDashboard === 'knowledge' ? 'from-green-500/30 to-emerald-500/80' :
                                         'from-purple-500/30 to-pink-500/80'} rounded-t`}
                        whileHover={{ scaleY: 1.1 }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Допълнителни статистики */}
                <div className="space-y-4 md:space-y-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold">94.2%</div>
                        <div className="text-xs md:text-sm text-gray-400">
                          {t('platform_activity') || 'Активност на платформата'}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: "94.2%" }}
                        transition={{ duration: 2, delay: 1 }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Database className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold">{statistics.languageBases}</div>
                        <div className="text-xs md:text-sm text-gray-400">
                          {t('language_bases') || 'Бази по езици'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs md:text-sm text-gray-400">
                      <span className="text-green-400">+12</span> {t('this_month') || 'този месец'}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Shield className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold">100%</div>
                        <div className="text-xs md:text-sm text-gray-400">
                          {t('data_security') || 'Сигурност на данните'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Последна активност */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/10">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
                  {t('recent_activity') || 'Последна Активност'}
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {[
                    t('activity_new_school') || 'Ново училище се присъедини',
                    t('activity_knowledge_base') || 'Създадена нова база знания по математика',
                    t('activity_new_materials') || 'Качени нови учебни материали',
                    t('activity_user_registered') || 'Регистрирани 24 нови потребителя'
                  ].map((activity, index) => (
                    <motion.div
                      key={activity}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 text-xs md:text-sm"
                    >
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="truncate">{activity}</span>
                      <span className="text-gray-400 ml-auto text-xs flex-shrink-0">
                        {index * 5 + 2} {t('minutes_ago') || 'мин'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
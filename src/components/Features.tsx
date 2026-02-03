import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Добавен import
import { useLanguage } from '../context/LanguageContext';
import { Database, Search, ArrowRight, Users, BookOpen } from 'lucide-react';

const Features = () => {
  const { t } = useLanguage();
  const navigate = useNavigate(); // Добавено

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="text-center px-6 lg:px-12 py-16"
    >
      {/* Две карти за различни типове потребители */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto"
      >
        {/* Карта 1: Създаване на бази знания */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-blue-900/30 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all relative overflow-hidden"
        >
          {/* Фонов градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5" />
          
          {/* Иконка и заглавие */}
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Database className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-white">
              {t('create_knowledge_title') || 'Създавайте Бази Знания'}
            </h3>
            
            <p className="text-gray-300 mb-6 text-lg">
              {t('create_knowledge_desc') || 'Създайте структурирани бази знания от вашите учебни материали и организирайте информацията за вашите класове.'}
            </p>
            
            {/* Преимущества */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-gray-300 text-left">
                  {t('create_feature_1') || 'Структуриране на учебни материали'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-gray-300 text-left">
                  {t('create_feature_2') || 'Семантични връзки между концепции'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-gray-300 text-left">
                  {t('create_feature_3') || 'Категоризация и тагове'}
                </span>
              </div>
            </div>
            
            {/* Бутон */}
            <motion.button
              onClick={() => navigate('/prolog-guide')} // Променено на navigate
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group"
            >
              <span>{t('start_creating') || 'Започнете да създавате'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        {/* Карта 2: Използване на бази знания */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-purple-900/30 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 hover:border-purple-400/40 transition-all relative overflow-hidden"
        >
          {/* Фонов градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/5" />
          
          {/* Иконка и заглавие */}
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-white">
              {t('use_knowledge_title') || 'Използвайте Бази Знания'}
            </h3>
            
            <p className="text-gray-300 mb-6 text-lg">
              {t('use_knowledge_desc') || 'Търсете и използвайте вече създадени бази знания за вашите образователни проекти и изследвания.'}
            </p>
            
            {/* Преимущества */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-gray-300 text-left">
                  {t('use_feature_1') || 'Бързо търсене в базите знания'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-gray-300 text-left">
                  {t('use_feature_2') || 'Персонализирани препоръки'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-gray-300 text-left">
                  {t('use_feature_3') || 'Достъп до общността знания'}
                </span>
              </div>
            </div>
            
            {/* Бутон - оправен */}
            <motion.button
              onClick={() => navigate('/prolog-guide')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white hover:shadow-xl hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-3 group"
            >
              <span>{t('start_using') || 'Започнете да използвате'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Информация под картите */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/10 max-w-4xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Общо бази знания */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">342+</div>
              <div className="text-gray-400 text-sm">{t('total_knowledge_bases') || 'Бази знания'}</div>
            </div>
          </div>

          {/* Активни създатели */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">4873+</div>
              <div className="text-gray-400 text-sm">{t('active_creators') || 'Активни създатели'}</div>
            </div>
          </div>

          {/* Образователни теми */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">12+</div>
              <div className="text-gray-400 text-sm">{t('educational_topics') || 'Образователни теми'}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Features;
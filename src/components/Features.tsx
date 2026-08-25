import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Database, Search, ArrowRight} from 'lucide-react';

const Features = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
        {/* Карта 1: Създаване на бази знания - СИНЯ */}
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
            
            {/* Бутон - СИН */}
            <motion.button
              onClick={() => navigate('/prolog-guide')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group"
            >
              <span>{t('start_creating') || 'Започнете да създавате'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        {/* Карта 2: Използване на бази знания - ОРАНЖЕВА (като логото на хедъра) */}
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          className="bg-gradient-to-br from-orange-900/30 via-orange-800/20 to-orange-900/30 backdrop-blur-xl rounded-2xl p-8 border border-orange-500/20 hover:border-orange-400/40 transition-all relative overflow-hidden"
        >
          {/* Фонов градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-500/5" />
          
          {/* Иконка и заглавие */}
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-6">
              {/* Използвам същия градиент като логото в хедъра: от жълто към оранжево */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-white">
              {t('use_knowledge_title') || 'Използвайте Бази Знания'}
            </h3>
            
            <p className="text-gray-300 mb-6 text-lg">
              {t('use_knowledge_desc') || 'Търсете и използвайте вече създадени бази знания за вашите образователни проекти и изследвания.'}
            </p>
            
            {/* Бутон - ОРАНЖЕВ (същия градиент като admin/pending badges) */}
            <motion.button
              onClick={() => navigate('/demo-prolog-chat')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl font-semibold text-white hover:shadow-xl hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-3 group"
            >
              <span>{t('start_using') || 'Започнете да използвате'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Features;
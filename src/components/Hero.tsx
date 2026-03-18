import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
  const { t } = useLanguage();

  return (
    <div className="relative z-10 pt-32 pb-32 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-blue-400" // Променено от green-400 на blue-400
          />
          <span className="text-sm">{t('innovation_platform') || 'Иновационна платформа'}</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Acronym */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-lg md:text-xl text-gray-300 mb-4 font-medium"
        >
          IDEAS - {t('ideas_acronym') || 'Intelligent Data Educational Analysis System'}
        </motion.p>

        {/* Главно заглавие */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
        >
          {t('hero_title_part1') || 'Transform Education'}
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-white bg-clip-text text-transparent"> {/* Променено от green/emerald на blue/cyan */}
            {t('hero_title_part2') || 'with AI-Powered Learning'}
          </span>
        </motion.h1>

        {/* Описание */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-300 max-w-2xl mx-auto mb-12"
        >
          {t('hero_description') || 'Empower students with logical programming and artificial intelligence concepts through interactive, hands-on STEM projects.'}
        </motion.p>

        {/* Бутони */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center mb-20"
        >
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full font-semibold text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center gap-2 group" // Променено от green/emerald на blue/cyan
            >
              <span>{t('get_started_free') || 'Get Started Free'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>

          <a 
            href="/demo-prolog-chat" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full font-semibold hover:bg-white/10 transition-all"
            >
              {t('view_demos') || 'View Demos'}
            </motion.button>
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
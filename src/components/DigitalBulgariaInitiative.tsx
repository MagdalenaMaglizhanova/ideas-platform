import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { ArrowRight, ArrowDown } from 'lucide-react';
import logoShevici from '../../public/images/logo_shevici.jpg';

const DigitalBulgariaInitiative = () => {
  const { language } = useLanguage();

  // Текст за инициативата на три езика
  const initiativeText = {
    bg: '„Digital Bulgaria in Prolog“ се отнася до образователна и научноизследователска инициатива в България, част от международното движение „Prolog Education and Thinking“. Проектът цели да популяризира логическото програмиране и изкуствения интелект сред ученици и студенти чрез езика Prolog.',
    en: '"Digital Bulgaria in Prolog" refers to an educational and research initiative in Bulgaria, part of the international movement "Prolog Education and Thinking". The project aims to promote logical programming and artificial intelligence among students through the Prolog language.',
    es: '"Bulgaria Digital en Prolog" se refiere a una iniciativa educativa y de investigación en Bulgaria, parte del movimiento internacional "Prolog Education and Thinking". El proyecto tiene como objetivo promover la programación lógica y la inteligencia artificial entre estudiantes a través del lenguaje Prolog.'
  };

  const initiativeTitle = {
    bg: 'Digital Bulgaria in Prolog',
    en: 'Digital Bulgaria in Prolog',
    es: 'Bulgaria Digital en Prolog'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full px-6 lg:px-12 py-12"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-gradient-to-r from-gray-900/50 via-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10">
          
          {/* Лого със стрелка */}
          <div className="relative flex flex-col md:flex-row items-center gap-4 md:gap-8">
            {/* Лого */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-500/30">
                <img 
                  src={logoShevici} 
                  alt="Digital Bulgaria in Prolog Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Стрелка (различна за мобилен и десктоп) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="md:hidden"
            >
              <ArrowDown className="w-8 h-8 text-blue-400 animate-bounce" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="hidden md:block"
            >
              <ArrowRight className="w-10 h-10 text-blue-400" />
            </motion.div>
          </div>

          {/* Текст */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex-1 text-center md:text-left"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {initiativeTitle[language] || initiativeTitle.bg}
            </h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              {initiativeText[language] || initiativeText.bg}
            </p>
            
            {/* Декоративна линия */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mt-6 mx-auto md:mx-0"
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DigitalBulgariaInitiative;
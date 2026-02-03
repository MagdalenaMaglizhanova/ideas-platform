import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { 
  Lightbulb, 
  Github, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Home, 
  MessageSquare, 
  ChartLine, 
  BookOpen,  
  Shield, 
  FileText, 
  Cookie
} from 'lucide-react';

interface FooterProps {
  isScrolled: boolean;
}

const Footer: React.FC<FooterProps> = ({ isScrolled }) => {
  const { t } = useLanguage();

  const socialLinks = [
    { name: 'GitHub', url: 'https://github.com', icon: <Github className="w-4 h-4" /> },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: <Linkedin className="w-4 h-4" /> },
    { name: 'Twitter', url: 'https://twitter.com', icon: <Twitter className="w-4 h-4" /> },
    { name: 'Facebook', url: 'https://facebook.com', icon: <Facebook className="w-4 h-4" /> },
    { name: 'Instagram', url: 'https://instagram.com', icon: <Instagram className="w-4 h-4" /> }
  ];

  const platformLinks = [
    { nameKey: 'home', href: '/', icon: <Home className="w-4 h-4" /> },
    { nameKey: 'topics', href: '/topics', icon: <MessageSquare className="w-4 h-4" /> },
    { nameKey: 'submissions', href: '/submissions', icon: <ChartLine className="w-4 h-4" /> },
    { nameKey: 'dashboard', href: '/dashboard', icon: <ChartLine className="w-4 h-4" /> },
    { nameKey: 'documentation', href: '/docs', icon: <BookOpen className="w-4 h-4" /> }
  ];

  const supportLinks = [
    { nameKey: 'help_center', href: '/help', icon: <ChartLine className="w-4 h-4" /> },
    { nameKey: 'contact_us', href: '/contact', icon: <ChartLine className="w-4 h-4" /> },
    { nameKey: 'privacy_policy', href: '/privacy', icon: <Shield className="w-4 h-4" /> },
    { nameKey: 'terms_of_service', href: '/terms', icon: <FileText className="w-4 h-4" /> },
    { nameKey: 'cookies', href: '/cookies', icon: <Cookie className="w-4 h-4" /> }
  ];

  return (
    <footer className="relative z-10 py-12 px-6 lg:px-12 border-t border-white/10 bg-gradient-to-t from-black/80 to-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Основен съдържание */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Лого и описание */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={isScrolled ? { scale: 0.9 } : { scale: 1 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center"
              >
                <Lightbulb className="w-6 h-6 text-white" />
              </motion.div>
              <motion.span 
                className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent"
                animate={isScrolled ? { scale: 0.9 } : { scale: 1 }}
              >
                IDEAS
              </motion.span>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer_description') || 'Empowering the next generation of innovators through logical programming and AI education. Transforming STEM learning worldwide.'}
            </p>
            
            {/* Социални мрежи */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.name}
                >
                  <div className="text-gray-400 group-hover:text-white transition-colors">
                    {social.icon}
                  </div>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Платформа */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">
              {t('footer_platform') || 'Platform'}
            </h4>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <motion.li
                  key={link.nameKey}
                  whileHover={{ x: 5 }}
                >
                  <Link 
                    to={link.href}
                    className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm group"
                  >
                    <div className="group-hover:scale-110 transition-transform">
                      {link.icon}
                    </div>
                    <span>{t(link.nameKey as any)}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Поддръжка */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">
              {t('footer_support') || 'Support'}
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <motion.li
                  key={link.nameKey}
                  whileHover={{ x: 5 }}
                >
                  <Link 
                    to={link.href}
                    className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm group"
                  >
                    <div className="group-hover:scale-110 transition-transform">
                      {link.icon}
                    </div>
                    <span>{t(link.nameKey as any)}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Бързи линкове */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">
              {t('quick_links') || 'Quick Links'}
            </h4>
            <div className="space-y-3">
              <motion.a
                href="/register"
                whileHover={{ x: 5 }}
                className="block text-gray-400 hover:text-white transition-colors text-sm group"
              >
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:scale-125 transition-transform" />
                  {t('get_started_free') || 'Get Started Free'}
                </span>
              </motion.a>
              <motion.a
                href="/demo"
                whileHover={{ x: 5 }}
                className="block text-gray-400 hover:text-white transition-colors text-sm group"
              >
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:scale-125 transition-transform" />
                  {t('schedule_demo') || 'Schedule Demo'}
                </span>
              </motion.a>
              <motion.a
                href="/community"
                whileHover={{ x: 5 }}
                className="block text-gray-400 hover:text-white transition-colors text-sm group"
              >
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
                  {t('explore_community') || 'Explore Community'}
                </span>
              </motion.a>
            </div>
          </div>
        </div>

        {/* Долен раздел */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Авторски права */}
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>© {new Date().getFullYear()} IDEAS Platform. {t('all_rights_reserved') || 'All rights reserved.'}</p>
              <p className="mt-2 text-gray-500">
                {t('made_with_love') || 'Made with ❤️ for education'}
              </p>
            </div>
            
            {/* Легални линкове */}
            <div className="flex gap-6">
              {[
                { nameKey: 'privacy', href: '/privacy' },
                { nameKey: 'terms', href: '/terms' },
                { nameKey: 'cookies', href: '/cookies' }
              ].map((link) => (
                <Link
                  key={link.nameKey}
                  to={link.href}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t(link.nameKey as any)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
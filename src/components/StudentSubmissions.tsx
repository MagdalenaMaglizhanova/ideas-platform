// src/components/student/StudentSubmissions.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  History, Download as DownloadIcon, Eye, 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Submission {
  id: string;
  name: string;
  date: string;
  status: string;
  code?: string;
  assignmentId?: string;
  assignmentTitle?: string;
  grade?: {
    score?: number;
    feedback?: string;
    gradedAt?: any;
    gradedBy?: string;
  };
}

interface StudentSubmissionsProps {
  submissions: Submission[];
  theme: 'light' | 'dark';
  onNewSubmission: () => void;
  onDownloadCode: (code: string, filename: string) => void;
  onViewGrade: (submission: Submission) => void;
}

const StudentSubmissions: React.FC<StudentSubmissionsProps> = ({
  submissions,
  theme,
  onNewSubmission,
  onDownloadCode,
  onViewGrade
}) => {
  const { t } = useLanguage();

  const themeClasses = {
    light: {
      card: "bg-white border-gray-200",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      textMuted: "text-gray-500",
      border: "border-gray-200",
      hover: "hover:bg-gray-50",
      bgMuted: "bg-gray-50"
    },
    dark: {
      card: "bg-gray-800 border-gray-700",
      text: "text-white",
      textSecondary: "text-gray-400",
      textMuted: "text-gray-500",
      border: "border-gray-700",
      hover: "hover:bg-gray-700",
      bgMuted: "bg-gray-700/50"
    }
  };

  const currentTheme = themeClasses[theme];
console.log(theme, currentTheme);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-500';
      case 'error': return 'bg-red-500/20 text-red-500';
      default: return 'bg-amber-500/20 text-amber-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return t?.('status_success') || "Success";
      case 'error': return t?.('status_error') || "Error";
      default: return t?.('status_pending') || "Pending";
    }
  };

  if (submissions.length === 0) {
    return (
      <div className={`rounded-2xl p-12 border text-center ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">
          {t?.('no_submissions_yet') || "No submissions yet"}
        </h3>
        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {t?.('make_first_submission') || "Make your first submission to get started"}
        </p>
        <button
          onClick={onNewSubmission}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium"
        >
          {t?.('upload_first_file') || "Upload Your First File"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => {
        const assignment = sub.assignmentTitle ? { title: sub.assignmentTitle } : null;
        
        return (
          <motion.div
            key={sub.id}
            whileHover={{ scale: 1.01, translateY: -2 }}
            className={`rounded-2xl p-6 border ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                : 'bg-white border-gray-200'
            } backdrop-blur-xl`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-bold">{sub.name}</h4>
                  {assignment && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      {assignment.title}
                    </span>
                  )}
                </div>
                <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {sub.date}
                </p>
                <div className={`p-3 rounded-lg font-mono text-sm overflow-hidden ${
                  theme === 'dark' ? 'bg-black/30' : 'bg-gray-100'
                }`}>
                  <pre className="whitespace-pre-wrap break-words">
                    {sub.code?.substring(0, 200)}...
                  </pre>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(sub.status)}`}>
                    {getStatusText(sub.status)}
                  </span>
                  
                  {sub.grade?.score && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                      sub.grade.score >= 80 ? 'bg-green-500/20 text-green-500' :
                      sub.grade.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {t?.('grade') || "Grade"}: {sub.grade.score}%
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                  <button
                    onClick={() => onDownloadCode(sub.code || '', sub.name)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <DownloadIcon className="w-4 h-4" />
                    {t?.('download') || "Download"}
                  </button>
                  
                  {sub.grade && (
                    <button
                      onClick={() => onViewGrade(sub)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                        theme === 'dark' 
                          ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      {t?.('view_grade') || "View Grade"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StudentSubmissions;
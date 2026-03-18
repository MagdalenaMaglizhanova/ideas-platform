// src/components/student/StudentAssignments.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Calendar, GraduationCap, Award, CheckCircle, 
  Play, Eye, Code, Download, X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Assignment {
  id: string;
  title: string;
  description: string;
  objective: string;
  topic: string;
  subject: string;
  requirements: {
    minFacts: number;
    minRules: number;
    minCombinedRules: number;
    minMenuItems: number;
  };
  instructions: string[];
  teacherId: string;
  teacherName: string;
  createdAt: any;
  dueDate: string;
  status: 'active' | 'draft' | 'archived';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  exampleCode?: string;
  backgroundImage?: string;
  category?: string;
  progress?: number;
  studentProgress?: {
    completed: boolean;
    submissionId?: string;
    submittedAt?: any;
    code?: string;
    requirementsMet?: {
      facts: number;
      rules: number;
      combinedRules: number;
      menuItems: number;
    };
    grade?: {
      score?: number;
      feedback?: string;
      gradedAt?: any;
      gradedBy?: string;
    };
  };
}

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

interface StudentAssignmentsProps {
  assignments: Assignment[];
  submissions: Submission[];
  theme: 'light' | 'dark';
  loading?: boolean;
  onViewDetails: (assignmentId: string) => void;
  onStartAssignment: (assignmentId: string) => void;
  onViewGrade: (submission: Submission) => void;
}

// Константи за категории и икони
const assignmentBackgrounds = [
  "https://img.freepik.com/free-photo/clock-top-textbooks-teacher-desk_23-2148199985.jpg?semt=ais_hybrid&w=740&q=80",
  "https://naukatolubie.pl/app/uploads/2023/03/jak-szybciej-sie-uczyc-1023x550.png",
  "https://www.superprof.pl/blog/wp-content/uploads/2020/02/nauka-prawa-online.jpeg",
  "https://szkolawchmurze.pl/wp-content/uploads/2019/09/nauka-zdalna.jpg",
  "https://www.shutterstock.com/image-vector/cute-seamless-pattern-school-education-260nw-2571827227.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGpMHf5oEKL0seirtuqidIDIgyz1I0Lkt6QZrTwB1giA&s"
];

const prologTemplates = [
  {
    id: "basic",
    name: "Basic Prolog Template",
    description: "Simple template with start predicate",
    code: `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                  %
%   YOUR KNOWLEDGE-BASED EXPERT SYSTEM             %
%   =====================================           %
%   Domain: [Your Domain Here]                      %
%   Type: Symbolic AI / Expert System               %
%   Student: [Your Name Here]                       %
%   Data Area: [Your Data Area Here]                %
%   Assignment: [Your Assignment Here]              %
%   Date: [Current Date]                            %
%                                                  %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


%%%%%%%%%%%%%%%%%%%%%%%%%
% PROGRAM ENTRY POINT
%%%%%%%%%%%%%%%%%%%%%%%%%
start :-
    writeln('=== EXPERT SYSTEM ==='),
    writeln('System started successfully.'),
    nl.`
  }
];

const EXPERT_SYSTEM_TEMPLATE = `%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%                                                  %
%   EXPERT SYSTEM TEMPLATE                         %
%   ======================                         %
%   Subject: [SUBJECT]                             %
%   Topic: [TOPIC]                                 %
%   Student Name: [NAME]                           %
%   Class: [CLASS]                                 %
%   Date: [DATE]                                   %
%                                                  %
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

%%%%%%%%%%%%%%%%%%%%%%%%%
% PROGRAM ENTRY POINT
%%%%%%%%%%%%%%%%%%%%%%%%%
start :-
    write('=== Expert System for [TOPIC] ==='), nl,
    write('1. Show all [TOPIC_ITEMS]'), nl,
    write('2. Search [TOPIC_ITEMS] by [CATEGORY]'), nl,
    write('3. Check if [TOPIC_ITEM] is [PROPERTY]'), nl,
    write('4. Information about [TOPIC]'), nl,
    write('5. Exit'), nl,
    read(Choice),
    process_choice(Choice).`;

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({
  assignments,
  submissions,
  theme,
  loading = false,
  onStartAssignment,
  onViewGrade
}) => {
  const { t } = useLanguage();
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const themeClasses = {
    light: {
      card: "bg-white border-gray-200",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      textMuted: "text-gray-500",
      border: "border-gray-200",
      hover: "hover:bg-gray-50",
      bgMuted: "bg-gray-50",
      modalBg: "bg-white",
      modalBorder: "border-gray-200"
    },
    dark: {
      card: "bg-gray-800 border-gray-700",
      text: "text-white",
      textSecondary: "text-gray-400",
      textMuted: "text-gray-500",
      border: "border-gray-700",
      hover: "hover:bg-gray-700",
      bgMuted: "bg-gray-700/50",
      modalBg: "bg-gray-900",
      modalBorder: "border-gray-700"
    }
  };

  const currentTheme = themeClasses[theme];
console.log(currentTheme, prologTemplates);
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'hard': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'design': return '🎨';
      case 'programming': return '💻';
      case 'algorithms': return '🧠';
      case 'data science': return '📊';
      case 'database': return '🗄️';
      case 'ai': return '🤖';
      default: return '📚';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'design': return 'bg-pink-500/20 text-pink-500';
      case 'programming': return 'bg-blue-500/20 text-blue-500';
      case 'algorithms': return 'bg-purple-500/20 text-purple-500';
      case 'data science': return 'bg-green-500/20 text-green-500';
      case 'database': return 'bg-amber-500/20 text-amber-500';
      case 'ai': return 'bg-indigo-500/20 text-indigo-500';
      default: return 'bg-amber-500/20 text-amber-500';
    }
  };

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const handleStartAssignment = (assignment: Assignment) => {
    // Проверка дали има exampleCode, ако не - използваме шаблона
    if (!assignment.exampleCode) {
      assignment.exampleCode = EXPERT_SYSTEM_TEMPLATE;
    }
    onStartAssignment(assignment.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={`rounded-2xl p-12 border text-center ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">{t?.('no_assignments_yet') || "No assignments yet"}</h3>
        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {t?.('check_back_later') || "Check back later for new assignments"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assignments.map((assignment) => {
          const isCompleted = assignment.studentProgress?.completed || false;
          const evaluation = assignment.studentProgress?.grade;
          const backgroundImage = assignment.backgroundImage || assignmentBackgrounds[Math.floor(Math.random() * assignmentBackgrounds.length)];
          
          return (
            <motion.div
              key={assignment.id}
              whileHover={{ scale: 1.02, translateY: -5 }}
              className={`rounded-2xl overflow-hidden border ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                  : 'bg-white border-gray-200'
              } backdrop-blur-xl`}
            >
              {/* Картинка в хедъра - като в стария код */}
              {backgroundImage && (
                <div className="relative h-32 w-full overflow-hidden">
                  <img 
                    src={backgroundImage} 
                    alt={assignment.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assignment.difficulty)}`}>
                      {assignment.difficulty}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(assignment.category || 'General')}`}>
                        {getCategoryIcon(assignment.category || 'General')}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{assignment.title}</h3>
                        <p className="text-xs opacity-80">{assignment.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ако няма картинка, показваме стандартния хедър */}
              {!backgroundImage && (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(assignment.category || 'General')}`}>
                        {getCategoryIcon(assignment.category || 'General')}
                      </div>
                      <div>
                        <h3 className="font-bold">{assignment.title}</h3>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {assignment.category}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(assignment.difficulty)}`}>
                      {assignment.difficulty}
                    </span>
                  </div>
                </div>
              )}

              {/* Основно съдържание */}
              <div className="p-6 pt-4">
                <p className={`mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {assignment.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                      {t?.('due') || "Due"}: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                      {t?.('difficulty') || "Difficulty"}: {assignment.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                    <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                      {t?.('points') || "Points"}: {assignment.points}
                    </span>
                  </div>
                  {evaluation?.score && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-500' : 'text-green-600'}`} />
                      <span className={`font-medium ${
                        evaluation.score >= 80 ? 'text-green-500' :
                        evaluation.score >= 60 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {t?.('grade') || "Grade"}: {evaluation.score}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleViewDetails(assignment)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                      theme === 'dark' 
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    {t?.('view_details') || "View Details"}
                  </button>
                  
                  {isCompleted ? (
                    <button
                      onClick={() => {
                        const submission = submissions.find(sub => sub.assignmentId === assignment.id);
                        if (submission) {
                          onViewGrade(submission);
                        } else {
                          const fakeSubmission: Submission = {
                            id: `assignment_${assignment.id}`,
                            name: assignment.title,
                            date: new Date().toLocaleString(),
                            status: "completed",
                            assignmentId: assignment.id,
                            assignmentTitle: assignment.title
                          };
                          onViewGrade(fakeSubmission);
                        }
                      }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                        theme === 'dark' 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-green-100 hover:bg-green-200 text-green-600'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" /> 
                      {assignment.studentProgress?.grade?.score ? 
                        `${t?.('view_grade') || 'View Grade'} (${assignment.studentProgress.grade.score}%)` : 
                        t?.('completed') || "Completed"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartAssignment(assignment)}
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" /> {t?.('start') || "Start"}
                    </button>
                  )}
                </div>

                {/* Показване на шаблонния код ако има */}
                {assignment.exampleCode && !isCompleted && (
                  <div className="mt-4">
                    <button
                      onClick={() => setExpandedAssignment(expandedAssignment === assignment.id ? null : assignment.id)}
                      className={`w-full py-2 px-3 rounded-lg text-xs flex items-center justify-between ${
                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      <span className="flex items-center gap-2">
                        <Code className="w-3 h-3" />
                        {t?.('view_template') || "View Template Code"}
                      </span>
                      <span>{expandedAssignment === assignment.id ? '▼' : '▶'}</span>
                    </button>
                    
                    {expandedAssignment === assignment.id && (
                      <div className={`mt-2 p-3 rounded-lg overflow-x-auto ${
                        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
                      }`}>
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {assignment.exampleCode.substring(0, 300)}...
                        </pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(assignment.exampleCode || '');
                            alert(t?.('code_copied') || 'Code copied to clipboard!');
                          }}
                          className={`mt-2 px-3 py-1 rounded text-xs flex items-center gap-1 ${
                            theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          <Download className="w-3 h-3" />
                          {t?.('copy_code') || "Copy Code"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Модален прозорец за детайли на заданието - като в стария код */}
      {showDetailsModal && selectedAssignment && (
        <AssignmentDetailsModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAssignment(null);
          }}
          onStart={() => {
            handleStartAssignment(selectedAssignment);
            setShowDetailsModal(false);
            setSelectedAssignment(null);
          }}
          theme={theme}
          t={t}
        />
      )}
    </>
  );
};

// Компонент за детайлен изглед на заданието
interface AssignmentDetailsModalProps {
  assignment: Assignment;
  onClose: () => void;
  onStart: () => void;
  theme: 'light' | 'dark';
  t: any;
}

const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  assignment,
  onClose,
  onStart,
  theme,
  t
}) => {
  const backgroundImage = assignment.backgroundImage || assignmentBackgrounds[Math.floor(Math.random() * assignmentBackgrounds.length)];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/80';
      case 'medium': return 'bg-yellow-500/80';
      case 'hard': return 'bg-red-500/80';
      default: return 'bg-gray-500/80';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
          theme === 'dark' 
            ? 'bg-gray-900 border-white/10' 
            : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header с картинка */}
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={backgroundImage} 
            alt={assignment.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold">{assignment.title}</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(assignment.difficulty)}`}>
                {assignment.difficulty}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="px-3 py-1 rounded-full bg-white/20">
                {assignment.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t?.('due') || "Due"}: {new Date(assignment.dueDate).toLocaleDateString()}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 flex items-center gap-1">
                <Award className="w-3 h-3" />
                {assignment.points} {t?.('points') || "pts"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Objective */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-blue-500">🎯</span>
              {t?.('objective') || "Objective"}
            </h3>
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <p className="text-lg">{assignment.objective}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              {t?.('description') || "Description"}
            </h3>
            <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {assignment.description}
            </p>
          </div>

          {/* Topic & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-500">📚</span>
                <span className="font-medium">{t?.('topic') || "Topic"}</span>
              </div>
              <p className="text-lg">{assignment.topic}</p>
            </div>
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{t?.('subject') || "Subject"}</span>
              </div>
              <p className="text-lg capitalize">{assignment.subject}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-amber-500">📋</span>
              {t?.('requirements') || "Requirements"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'
              }`}>
                <span className="text-2xl font-bold text-blue-500">{assignment.requirements.minFacts}</span>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('facts') || "Facts"}
                </div>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50'
              }`}>
                <span className="text-2xl font-bold text-green-500">{assignment.requirements.minRules}</span>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('rules') || "Rules"}
                </div>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50'
              }`}>
                <span className="text-2xl font-bold text-purple-500">{assignment.requirements.minCombinedRules}</span>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('combined_rules') || "Combined Rules"}
                </div>
              </div>
              <div className={`p-4 rounded-lg text-center ${
                theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-50'
              }`}>
                <span className="text-2xl font-bold text-amber-500">{assignment.requirements.minMenuItems}</span>
                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t?.('menu_items') || "Menu Items"}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {assignment.instructions && assignment.instructions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-indigo-500">📝</span>
                {t?.('instructions') || "Instructions"}
              </h3>
              <div className="space-y-3">
                {assignment.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {index + 1}
                    </span>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example Code */}
          {assignment.exampleCode && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-500" />
                {t?.('example_code') || "Example Code"}
              </h3>
              <div className={`p-4 rounded-lg overflow-x-auto ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {assignment.exampleCode}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(assignment.exampleCode || '');
                    alert(t?.('code_copied') || 'Code copied to clipboard!');
                  }}
                  className={`mt-3 px-3 py-1 rounded text-sm flex items-center gap-1 ${
                    theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {t?.('copy_code') || "Copy Code"}
                </button>
              </div>
            </div>
          )}

          {/* Start button */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {t?.('cancel') || "Cancel"}
            </button>
            <button
              onClick={onStart}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {assignment.studentProgress?.completed 
                ? t?.('continue_work') || "Continue Work"
                : t?.('start_assignment') || "Start Assignment"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentAssignments;
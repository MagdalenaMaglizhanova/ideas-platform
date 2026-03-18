// src/components/student/StudentChallenges.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Group as GroupIcon, Calendar, Trophy, Users, 
  CheckCircle, Clock, Code, Award, 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorCommunityId: string;
  targetCommunityId: string;
  createdBy: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  dueDate?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  submissions: any[];
  createdAt: any;
  studentGrade?: {
    score: number;
    feedback?: string;
    gradedAt?: any;
  };
}

interface ChallengeSolution {
  id: string;
  challengeId: string;
  studentId: string;
  studentName?: string;
  solutionCode: string;
   status: 'submitted' | 'evaluated' | 'joined';
  score?: number;
  feedback?: string;
  evaluatedAt?: any;
  evaluatedBy?: string;
  evaluatedByName?: string;
  submittedAt: any;
  updatedAt: any;
  challengeTitle?: string;
  challengeDescription?: string;
  createdAt?: any;
}

interface Community {
  id: string;
  name: string;
}

interface StudentChallengesProps {
  challenges: Challenge[];
  challengeSolutions: ChallengeSolution[];
  communities: Community[];
  user: any;
  userData: any;
  theme: 'light' | 'dark';
  loadingSolutions?: boolean;
  onJoinChallenge: (challengeId: string) => Promise<void>;
  onSolveChallenge: (challengeId: string, solutionCode?: string) => void;
  generateChallengeTemplate: (challenge: Challenge) => string;
}

const StudentChallenges: React.FC<StudentChallengesProps> = ({
  challenges,
  challengeSolutions,
  communities,
  user,
  theme,
  loadingSolutions = false,
  onJoinChallenge,
  onSolveChallenge,
  generateChallengeTemplate
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'hard': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'completed': return 'bg-blue-500/20 text-blue-500';
      case 'rejected': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {loadingSolutions && (
        <div className={`rounded-2xl p-4 border backdrop-blur-xl ${currentTheme.card} mb-4`}>
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500"></div>
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {t?.('loading_solutions') || "Loading your solutions..."}
            </span>
          </div>
        </div>
      )}
      
      <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5" /> {t?.('active_challenges') || "Active Challenges"} ({challenges.length})
        </h3>
        
        {challenges.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold mb-2">
              {t?.('no_challenges_yet') || "No challenges yet"}
            </h4>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {t?.('no_challenges_description') || "No active challenges for your communities."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const creatorCommunity = communities.find(c => c.id === challenge.creatorCommunityId);
              
              const challengeSolution = challengeSolutions?.find((s) => 
                s.challengeId === challenge.id && s.studentId === user?.uid
              );
              
              const hasJoined = !!challengeSolution;
              
              const studentGrade = challengeSolution && challengeSolution.score !== undefined ? {
                score: challengeSolution.score * 10,
                feedback: challengeSolution.feedback,
                gradedAt: challengeSolution.evaluatedAt || challengeSolution.updatedAt,
                evaluatedBy: challengeSolution.evaluatedBy,
                evaluatedByName: challengeSolution.evaluatedByName,
                status: challengeSolution.status
              } : null;
              
              const hasGrade = studentGrade && studentGrade.score !== undefined && studentGrade.score !== null;

              return (
                <motion.div
                  key={challenge.id}
                  id={`challenge-${challenge.id}`}
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-white/10'
                      : 'bg-white border-gray-200'
                  } ${hasGrade ? 'ring-2 ring-offset-2 ring-green-500/30' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(challenge.status)}`}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">{challenge.title}</h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {challenge.category}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {challenge.description}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <GroupIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('from') || "From"}: {creatorCommunity?.name || t?.('unknown') || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('due') || "Due"}: {challenge.dueDate || t?.('not_specified') || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('points') || "Points"}: {challenge.points}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {t?.('participants') || "Participants"}: {challenge.submissions?.length || 0}
                      </span>
                    </div>
                    
                    {challengeSolution && (
                      <div className="flex items-center gap-2 text-sm">
                        {challengeSolution.status === 'evaluated' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {t?.('solution_status') || "Status"}: {
                            challengeSolution.status === 'evaluated' 
                              ? (t?.('evaluated') || "Evaluated") 
                              : (t?.('pending_evaluation') || "Pending Evaluation")
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {hasGrade && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium text-sm">{t?.('your_grade') || "Your Grade"}:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xl font-bold ${
                            studentGrade.score >= 80 ? 'text-green-500' :
                            studentGrade.score >= 60 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}>
                            {studentGrade.score}%
                          </span>
                          {studentGrade.feedback && (
                            <button
                              onClick={() => {
                                alert(`${t?.('feedback') || "Feedback"}: ${studentGrade.feedback}`);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs ${
                                theme === 'dark' 
                                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                              }`}
                            >
                              {t?.('view_feedback') || "Feedback"}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className={`h-1.5 rounded-full overflow-hidden ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <div
                            className={`h-full rounded-full ${
                              studentGrade.score >= 80 ? 'bg-green-500' :
                              studentGrade.score >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${studentGrade.score}%` }}
                          />
                        </div>
                      </div>
                      
                      {studentGrade.evaluatedByName && (
                        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {t?.('evaluated_by') || "Evaluated by"}: {studentGrade.evaluatedByName}
                        </p>
                      )}
                      
                      {studentGrade.gradedAt && (
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          {t?.('graded_on') || "Graded on"}: {
                            studentGrade.gradedAt?.toDate 
                              ? new Date(studentGrade.gradedAt.toDate()).toLocaleDateString()
                              : new Date(studentGrade.gradedAt).toLocaleDateString()
                          }
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    {hasJoined ? (
                      <>
                        <span className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                          theme === 'dark' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          {t?.('joined') || "Joined"}
                        </span>
                        <button
                          onClick={() => {
                            const codeToSet = challengeSolution?.solutionCode || generateChallengeTemplate(challenge);
                            onSolveChallenge(challenge.id, codeToSet);
                          }}
                          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium text-sm"
                        >
                          <Code className="w-4 h-4 inline mr-1" />
                          {hasGrade ? t?.('view_solution') || "View Solution" : t?.('solve_now') || "Solve Now"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onJoinChallenge(challenge.id)}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm"
                      >
                        {t?.('join_challenge') || "Join Challenge"}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentChallenges;
// src/components/student/StudentCodeEditor.tsx
import React from 'react';
import { 
  Code, Upload, X, RefreshCw, Copy, FileText, 
  Database, Globe, User, Cpu, Target, AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Assignment {
  id: string;
  title: string;
  topic: string;
  subject: string;
  difficulty: string;
  exampleCode?: string;
}

interface Challenge {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  dueDate?: string;
  description: string;
}

interface CodeMetadata {
  domain: string;
  type: string;
  studentName: string;
  dataArea: string;
  assignmentId: string;
  assignmentTitle: string;
}

interface StudentCodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  codeMetadata: CodeMetadata;
  setCodeMetadata: (metadata: CodeMetadata) => void;
  assignments: Assignment[];
  challenges: Challenge[];
  selectedAssignment: string;
  setSelectedAssignment: (id: string) => void;
  selectedChallengeId: string;
  isChallengeMode: boolean;
  setIsChallengeMode: (mode: boolean) => void;
  uploadStatus: string;
  setUploadStatus: (status: string) => void;
  theme: 'light' | 'dark';
  userData: any;
  user: any;
  generateHeader: () => string;
  onUpload: () => Promise<void>;
  onSwitchToChallenges: () => void;
  onViewChallengeDetails: (challengeId: string) => void;
}

const StudentCodeEditor: React.FC<StudentCodeEditorProps> = ({
  code,
  setCode,
  codeMetadata,
  setCodeMetadata,
  assignments,
  challenges,
  selectedAssignment,
  setSelectedAssignment,
  selectedChallengeId,
  isChallengeMode,
  setIsChallengeMode,
  uploadStatus,
  setUploadStatus,
  theme,
  generateHeader,
  onUpload,
  onSwitchToChallenges,
  onViewChallengeDetails
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
      bgMuted: "bg-gray-50",
      input: "bg-white border-gray-300",
      codeBg: "bg-white"
    },
    dark: {
      card: "bg-gray-800 border-gray-700",
      text: "text-white",
      textSecondary: "text-gray-400",
      textMuted: "text-gray-500",
      border: "border-gray-700",
      hover: "hover:bg-gray-700",
      bgMuted: "bg-gray-700/50",
      input: "bg-gray-700 border-gray-600",
      codeBg: "bg-gray-800"
    }
  };

  const currentTheme = themeClasses[theme];

  const handleCopyCode = () => {
    if (code.trim()) {
      navigator.clipboard.writeText(code);
      alert(t?.('code_copied') || "Code copied to clipboard!");
    } else {
      alert(t?.('no_code_to_copy') || "No code to copy!");
    }
  };

  const handleUpdateHeader = () => {
    const header = generateHeader();
    setCode(header + "\n\n" + (code.split('\n').slice(7).join('\n') || ""));
  };

  const getCurrentChallenge = () => {
    return challenges.find(c => c.id === selectedChallengeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t?.('upload_prolog_code') || "Upload Prolog Code"}</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            {isChallengeMode 
              ? t?.('submit_challenge_solution') || "Submit your challenge solution"
              : t?.('submit_assignments_projects') || "Submit your assignments and projects"}
          </p>
        </div>
        
        {isChallengeMode && (
          <div className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium flex items-center gap-2`}>
            <Target className="w-4 h-4" />
            {t?.('challenge_mode') || "Challenge Mode"}
          </div>
        )}
      </div>

      <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> 
          {isChallengeMode 
            ? t?.('current_challenge') || "Current Challenge"
            : t?.('select_assignment') || "Select Assignment"}
        </h3>
        
        {isChallengeMode ? (
          <div className="space-y-4">
            {selectedChallengeId ? (
              <>
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-100 border border-blue-200'
                }`}>
                  <div className="font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {(() => {
                      const challenge = getCurrentChallenge();
                      return challenge?.title || codeMetadata.assignmentTitle || t?.('active_challenge') || "Active Challenge";
                    })()}
                  </div>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t?.('challenge_id') || "Challenge ID"}: {selectedChallengeId}
                  </p>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('challenge_mode_active') || "You are in challenge mode. Your solution will be submitted as a challenge solution."}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewChallengeDetails(selectedChallengeId)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {t?.('view_details') || "View Details"}
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsChallengeMode(false);
                      setSelectedAssignment("");
                      setCode("");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                        : 'bg-red-100 hover:bg-red-200 text-red-600'
                    }`}
                  >
                    {t?.('exit_challenge_mode') || "Exit Challenge Mode"}
                  </button>
                </div>
              </>
            ) : (
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-100 border border-amber-200'
              }`}>
                <div className="font-medium flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  {t?.('no_challenge_selected') || "No challenge selected!"}
                </div>
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t?.('select_challenge_first_desc') || "You are in challenge mode but no challenge is selected. Please:"}
                </p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={onSwitchToChallenges}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm"
                  >
                    {t?.('go_to_challenges') || "Go to Challenges"}
                  </button>
                  <button
                    onClick={() => setIsChallengeMode(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {t?.('switch_to_assignments') || "Switch to Assignments"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
            >
              <option value="">-- {t?.('choose_assignment') || "Choose an assignment"} --</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title} ({assignment.difficulty})
                </option>
              ))}
            </select>
            
            <button
              onClick={onSwitchToChallenges}
              className={`px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                theme === 'dark' 
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }`}
            >
              <Target className="w-4 h-4" />
              {t?.('switch_to_challenges') || "Work on Challenges"}
            </button>
          </div>
        )}
      </div>

      {selectedAssignment && !isChallengeMode && (
        <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" /> {t?.('assignment_info') || "Assignment Information"}
          </h3>
          
          {(() => {
            const assignment = assignments.find(a => a.id === selectedAssignment);
            if (!assignment) return null;
            
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t?.('title') || "Title"}
                    </div>
                    <div className="font-medium">{assignment.title}</div>
                  </div>
                  <div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t?.('topic') || "Topic"}
                    </div>
                    <div className="font-medium">{assignment.topic}</div>
                  </div>
                </div>
                
                <div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('subject') || "Subject"}
                  </div>
                  <div className="font-medium">{assignment.subject}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" /> {t?.('file_information') || "File Information"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Globe className="w-4 h-4 inline mr-1" /> {t?.('domain') || "Domain"}
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="e.g., Insects, Animals"
              value={codeMetadata.domain}
              onChange={(e) => setCodeMetadata({...codeMetadata, domain: e.target.value})}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Cpu className="w-4 h-4 inline mr-1" /> {t?.('type') || "Type"}
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Symbolic AI / Expert System"
              value={codeMetadata.type}
              onChange={(e) => setCodeMetadata({...codeMetadata, type: e.target.value})}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <User className="w-4 h-4 inline mr-1" /> {t?.('student_name') || "Student Name"}
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder={t?.('your_name') || "Your name"}
              value={codeMetadata.studentName}
              onChange={(e) => setCodeMetadata({...codeMetadata, studentName: e.target.value})}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <Database className="w-4 h-4 inline mr-1" /> {t?.('data_area') || "Data Area"}
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500/50 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="e.g., Biology, Geography"
              value={codeMetadata.dataArea}
              onChange={(e) => setCodeMetadata({...codeMetadata, dataArea: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-6 backdrop-blur-xl ${currentTheme.card}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Code className="w-5 h-5" /> {t?.('code_editor') || "Code Editor"}
          </h3>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={handleCopyCode}
            >
              <Copy className="w-3 h-3" /> {t?.('copy_code') || "Copy Code"}
            </button>
            <button
              className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={handleUpdateHeader}
            >
              <RefreshCw className="w-3 h-3" /> {t?.('update_header') || "Update Header"}
            </button>
          </div>
        </div>
        
        <textarea
          className={`w-full h-96 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border border-gray-300'
          }`}
          placeholder={`% ${t?.('write_prolog_code') || "Write your Prolog code here..."}\n% ${t?.('example') || "Example"}:\n% student(john, math).\n% teaches(prof_smith, math).`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={onUpload}
            disabled={!code.trim() || (!isChallengeMode && !selectedAssignment) || (isChallengeMode && !selectedChallengeId)}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {isChallengeMode 
              ? t?.('submit_solution') || "Submit Solution" 
              : t?.('submit_code') || "Submit Code"}
          </button>
          <button
            onClick={() => setCode("")}
            className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 ${
              theme === 'dark' 
                ? 'bg-white/5 hover:bg-white/10' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
            {t?.('clear') || "Clear"}
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className={`rounded-xl p-4 ${
          uploadStatus.includes('✅') 
            ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
            : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
        }`}>
          <div className="flex justify-between items-center">
            <span>{uploadStatus}</span>
            <button onClick={() => setUploadStatus('')}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCodeEditor;
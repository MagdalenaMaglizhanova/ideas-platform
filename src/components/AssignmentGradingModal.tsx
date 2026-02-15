// components/AssignmentGradingModal.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, CheckCircle, X, Star, MessageCircle,
  Download, Eye, GraduationCap
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

interface StudentFile {
  id: string;
  username: string;
  originalFileName: string;
  storedFileName: string;
  code: string;
  createdAt: any;
  folder: string;
  fileSize: number;
  displayName: string;
  userId: string;
  studentName?: string;
  status?: string;
  points?: number;
  feedback?: string;
}

interface GradingData {
  points: number;
  feedback: string;
  assignmentId: string;
  fileId: string;
  studentId: string;
  // Не се изпраща gradedAt от тук!
}
interface AssignmentGradingModalProps {
  studentName: string;
  studentId: string;
  files: StudentFile[];
  assignmentId?: string;
  onClose: () => void;
  onSave: (gradingData: GradingData) => Promise<void>;
}

export default function AssignmentGradingModal({
  studentName,
  studentId,
  files,
  assignmentId = "general",
  onClose,
  onSave
}: AssignmentGradingModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const [selectedFile, setSelectedFile] = useState<StudentFile | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // ДЕБЪГ: Проверете какви файлове получавате
  useEffect(() => {
    console.log("AssignmentGradingModal - ДЕБЪГ:", {
      studentName,
      studentId,
      totalFiles: files.length,
      assignmentId,
      files: files.map(f => ({
        id: f.id,
        name: f.originalFileName,
        folder: f.folder,
        hasPoints: f.points !== undefined,
        points: f.points
      }))
    });
  }, []);

  // Показваме ВСИЧКИ файлове на ученика
  const assignmentFiles = files;

  // Автоматично избиране на първия файл
  useEffect(() => {
    if (assignmentFiles.length > 0 && !selectedFile) {
      setSelectedFile(assignmentFiles[0]);
      setPoints(assignmentFiles[0].points || 0);
      setFeedback(assignmentFiles[0].feedback || "");
    }
  }, [assignmentFiles]);

  const handleSaveGrade = async () => {
  if (!selectedFile) return;

  try {
    setSaving(true);
    
    // Правилното GradingData - само необходимите данни
    const gradingData = {
      points,
      feedback,
      assignmentId,
      fileId: selectedFile.id,
      studentId
      // НЕ ПРАЩАЙТЕ gradedAt ТУК!
    };

    await onSave(gradingData);
    
    setUploadStatus("✅ Grade saved successfully!");
    
    // Актуализирай локалния state
    setSelectedFile({
      ...selectedFile,
      points: points,
      feedback: feedback
    });
    
    // Затвори модала след успешно запазване (по избор)
    // setTimeout(() => onClose(), 1000);
    
  } catch (error) {
    console.error("Error saving grade:", error);
    setUploadStatus("❌ Error saving grade!");
  } finally {
    setSaving(false);
  }
};

  const downloadFile = (file: StudentFile) => {
  const element = document.createElement('a');
  const fileBlob = new Blob([file.code], { type: 'text/plain' });
  
  const fileName = file.originalFileName.endsWith('.pl') 
    ? file.originalFileName 
    : `${file.originalFileName}.pl`;
  
  element.href = URL.createObjectURL(fileBlob);
  element.download = fileName;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

  const openFileInNewTab = (file: StudentFile) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${file.originalFileName}</title>
            <style>
              body { 
                font-family: monospace; 
                margin: 20px; 
                background: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
                color: ${theme === 'dark' ? '#ffffff' : '#000000'};
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>${file.code}</body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const quickFeedbackTags = [
    { text: t?.('excellent_work') || "Excellent work!", color: "bg-green-500" },
    { text: t?.('needs_correction') || "Needs correction", color: "bg-yellow-500" },
    { text: t?.('missing_requirements') || "Missing requirements", color: "bg-red-500" },
    { text: t?.('creative_solution') || "Creative solution", color: "bg-blue-500" },
    { text: t?.('good_logic') || "Good logic structure", color: "bg-purple-500" },
    { text: t?.('improve_comments') || "Improve comments", color: "bg-indigo-500" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={`relative w-full max-w-5xl h-[90vh] rounded-2xl border overflow-hidden flex flex-col ${
          theme === 'dark' ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header - фиксирана височина */}
        <div className="p-4 border-b border-white/10 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold truncate">
                  {t?.('grade_assignment') || "Grade Assignment"} - {studentName}
                </h3>
                <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {assignmentFiles.length} {t?.('files') || "files"} • {selectedFile ? `Selected: ${selectedFile.originalFileName}` : "No file selected"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg flex-shrink-0 ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content - flex-grow за да запълва останалото място */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - File List (по-малък) */}
          <div className="w-1/4 border-r border-white/10 dark:border-gray-700 overflow-y-auto">
            <div className="p-3">
              <h4 className="font-bold text-sm mb-3">
                {t?.('student_files') || "Student Files"} ({assignmentFiles.length})
              </h4>
              
              {assignmentFiles.length === 0 ? (
                <div className={`p-3 rounded-lg text-center ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                }`}>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('no_files_found') || "No files found"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {assignmentFiles.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedFile(file);
                        setPoints(file.points || 0);
                        setFeedback(file.feedback || "");
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-all text-sm ${
                        selectedFile?.id === file.id
                          ? theme === 'dark' 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-green-100 border border-green-300'
                          : theme === 'dark' 
                            ? 'bg-white/5 hover:bg-white/10' 
                            : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="font-medium truncate">
                            {file.originalFileName.length > 20 
                              ? `${file.originalFileName.substring(0, 20)}...` 
                              : file.originalFileName}
                          </span>
                        </div>
                        {file.points !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                            file.points >= 9 ? 'bg-green-500/20 text-green-500' :
                            file.points >= 7 ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {file.points}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Grading (по-голям) */}
          <div className="w-3/4 overflow-y-auto">
            <div className="p-4">
              {selectedFile ? (
                <div className="space-y-4">
                  {/* Selected File Info - компактно */}
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate">{selectedFile.originalFileName}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            {(selectedFile.fileSize / 1024).toFixed(1)} KB
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            {selectedFile.folder}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            {new Date(selectedFile.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => openFileInNewTab(selectedFile)}
                          className={`p-1.5 rounded ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                          }`}
                          title={t?.('view_code') || "View Code"}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => downloadFile(selectedFile)}
                          className={`p-1.5 rounded ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                          }`}
                          title={t?.('download_file') || "Download File"}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Compact Code Preview */}
                  <div className={`rounded-lg overflow-hidden border ${
                    theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                  }`}>
                    <div className={`p-2 border-b text-xs ${
                      theme === 'dark' ? 'border-white/10 bg-gray-800' : 'border-gray-200 bg-gray-100'
                    }`}>
                      <span className="font-mono">{t?.('code_preview') || "Code Preview"}</span>
                    </div>
                    <div className={`p-3 max-h-40 overflow-y-auto font-mono text-xs ${
                      theme === 'dark' ? 'bg-black/30' : 'bg-gray-50'
                    }`}>
                      <pre className="whitespace-pre-wrap break-words">
                        {selectedFile.code.substring(0, 300)}
                        {selectedFile.code.length > 300 ? '...' : ''}
                      </pre>
                    </div>
                  </div>

                  {/* Points Selection - компактно */}
                  <div>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {t?.('assign_points') || "Points"} (0-10)
                    </h4>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((point) => (
                        <button
                          key={point}
                          onClick={() => setPoints(point)}
                          className={`px-3 py-1.5 rounded text-sm transition-all ${
                            points === point
                              ? 'bg-green-500 text-white'
                              : theme === 'dark' 
                                ? 'bg-white/5 hover:bg-white/10' 
                                : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {point}
                        </button>
                      ))}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t?.('selected_points') || "Selected"}:</span>
                        <span className="text-xl font-bold text-green-500">{points}/10</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden mt-2 ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
                      }`}>
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${points * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feedback - компактно */}
                  <div>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {t?.('feedback') || "Feedback"}
                    </h4>
                    
                    {/* Quick Feedback Tags - компактни */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {quickFeedbackTags.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFeedback(prev => 
                            prev ? `${prev}\n${tag.text}` : tag.text
                          )}
                          className={`px-2 py-1 rounded-full text-xs text-white ${tag.color}`}
                        >
                          {tag.text.length > 15 ? `${tag.text.substring(0, 15)}...` : tag.text}
                        </button>
                      ))}
                    </div>
                    
                    {/* Feedback Textarea */}
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={t?.('add_detailed_feedback') || "Add detailed feedback..."}
                      className={`w-full h-32 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none ${
                        theme === 'dark' 
                          ? 'bg-white/5 border border-white/10' 
                          : 'bg-white border border-gray-300'
                      }`}
                    />
                  </div>

                  {/* Status & Actions */}
                  {uploadStatus && (
                    <div className={`p-2 rounded-lg text-sm ${
                      uploadStatus.includes('✅') 
                        ? theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
                        : theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700'
                    }`}>
                      {uploadStatus}
                    </div>
                  )}

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-white/10 dark:border-gray-700">
                    <button
                      onClick={onClose}
                      className={`flex-1 py-2.5 rounded-lg text-sm ${
                        theme === 'dark' 
                          ? 'bg-white/5 hover:bg-white/10' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      disabled={saving}
                    >
                      {t?.('cancel') || "Cancel"}
                    </button>
                    <button
                      onClick={handleSaveGrade}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          {t?.('saving') || "Saving..."}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          {t?.('save_grade') || "Save Grade"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-md font-bold mb-2">{t?.('no_file_selected') || "No File Selected"}</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t?.('select_file_to_grade') || "Select a file from the list to grade"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
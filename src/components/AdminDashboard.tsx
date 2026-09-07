import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  BarChart3,
  Activity,
  Zap,
  Clock,
  TrendingUp,
  Database,
  Folder,
  Shield,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Building,
  Award,
  Download,
  Plus,
  X,
  Search,
  UserCog,
  FileCode,
  GraduationCap,
  Home,
  Crown,
  Upload,
  ChevronRight,
  Copy,
  ExternalLink,
  FolderPlus,
  UserPlus,
  File,
  Code,
  Key,
  BookOpen,
  Puzzle,
  ChevronDown,
  ChevronUp,
  Video,
  Image,
  Tag,
  FileText,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { db } from "../services/firebase";
import { supabase } from "../services/supabase";
import {
  collection,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  limit,
  addDoc,
} from "firebase/firestore";
import mammoth from "mammoth";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

// ============================================
// INTERFACES (съществуващи + нови за Word Import)
// ============================================
interface HasImages {
  images: WordImage[];
  content: string;
}

interface ImportedSublesson extends HasImages {
  sublesson_number: number;
  title: string;
  // content и images идват от HasImages
}

interface ImportedLesson extends HasImages {
  lesson_number: number;
  title: string;
  // content и images идват от HasImages
  sublessons: ImportedSublesson[];
}
interface User {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  role: "student" | "teacher" | "admin";
  institution: string;
  status: "active" | "pending" | "rejected" | "suspended";
  createdAt: Date;
  isVerified: boolean;
  specialty?: string;
  grade?: string;
  teacherCode?: string;
  lastLogin?: Date;
  phone?: string;
  avatar?: string;
}

interface PrologCode {
  id: string;
  userId: string;
  username: string;
  title: string;
  storedFileName?: string;
  originalFileName?: string;
  displayName?: string;
  code: string;
  fileName?: string;
  filePath?: string;
  folder?: string;
  status: "success" | "error" | "pending";
  createdAt: Date;
  uploadFormat?: string;
  executionTime?: number;
  errors?: string[];
  assignmentName?: string;
  assignmentId?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  dueDate?: Date;
  submissions?: number;
  status: "active" | "completed" | "draft";
}

interface SupabaseFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  size: number;
  folder: string;
  fullPath: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    [key: string]: any;
  };
}

interface SupabaseFolder {
  size: number;
  name: string;
  fileCount: number;
  lastModified?: string;
  files?: SupabaseFile[];
}

interface SupabaseStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  lastUpdated: number | null;
  storageUsed: string;
}

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalSubmissions: number;
  totalFiles: number;
  pendingApprovals: number;
  successRate: number;
  activeToday: number;
  avgExecutionTime: number;
  storageUsage: number;
  monthlyGrowth: number;
}

interface ActivityLog {
  id: string;
  userId: string;
  user: string;
  userEmail: string;
  action: string;
  actionType: string;
  target: string;
  targetId: string;
  details: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

// LESSON INTERFACES
interface LessonTranslation {
  id: string;
  lesson_id: string;
  language: "en" | "bg" | "es";
  title: string;
  content: string;
  description?: string;
  video_url?: string;
  duration?: string;
  example_code?: string;
  example_output?: string;
  tags?: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface Lesson {
  id: string;
  slug: string;
  lesson_number: number;
  sublesson_number?: number;
  order_index: number;
  type: "video" | "text" | "puzzle" | "extra";
  created_at: string;
  updated_at: string;
  translations: LessonTranslation[];
}

// --- Нови интерфейси за Word Import ---
interface WordImage {
  src: string;
  caption: string;
}

interface WordElement {
  type: "title" | "heading1" | "heading2" | "heading3" | "paragraph" | "list" | "table" | "image" | "caption";
  text?: string;
  content?: string;
  src?: string;
}

// ============================================
// КОМПОНЕНТ
// ============================================

export default function AdminDashboard() {
  const { user: currentUser, userData } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  console.log(t);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [prologCodes, setPrologCodes] = useState<PrologCode[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<User[]>([]);

  // Supabase Management State
  const [supabaseFiles, setSupabaseFiles] = useState<SupabaseFile[]>([]);
  const [supabaseFolders, setSupabaseFolders] = useState<SupabaseFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<SupabaseFile[]>([]);
  const [supabaseStats, setSupabaseStats] = useState<SupabaseStats>({
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    lastUpdated: null,
    storageUsed: "0 MB",
  });

  // LESSONS STATE
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showLessonModal, setShowLessonModal] = useState<boolean>(false);
  const [lessonSearchQuery, setLessonSearchQuery] = useState<string>("");
  const [lessonTypeFilter, setLessonTypeFilter] = useState<string>("all");

  // IMAGE UPLOAD STATE
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadingForLanguage, setUploadingForLanguage] = useState<string | null>(null);

  // VIDEO UPLOAD STATE
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [uploadingVideoForLanguage, setUploadingVideoForLanguage] = useState<string | null>(null);

  // ---------- WORD IMPORT STATE ----------
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedDocxFile, setSelectedDocxFile] = useState<File | null>(null);
  const [importLanguage, setImportLanguage] = useState<"en" | "bg" | "es">("bg");
  const [parsedLessons, setParsedLessons] = useState<ImportedLesson[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState<string>("");

  // LESSON FORM STATE
  const [lessonFormData, setLessonFormData] = useState<{
    slug: string;
    lessonNumber: number;
    sublessonNumber?: number;
    orderIndex: number;
    type: "video" | "text" | "puzzle" | "extra";
    translations: {
      en: {
        title: string;
        content: string;
        description: string;
        videoUrl: string;
        duration: string;
        exampleCode: string;
        exampleOutput: string;
        tags: string[];
        imageUrl: string;
      };
      bg: {
        title: string;
        content: string;
        description: string;
        videoUrl: string;
        duration: string;
        exampleCode: string;
        exampleOutput: string;
        tags: string[];
        imageUrl: string;
      };
      es: {
        title: string;
        content: string;
        description: string;
        videoUrl: string;
        duration: string;
        exampleCode: string;
        exampleOutput: string;
        tags: string[];
        imageUrl: string;
      };
    };
  }>({
    slug: "",
    lessonNumber: 1,
    sublessonNumber: undefined,
    orderIndex: 0,
    type: "text",
    translations: {
      en: {
        title: "",
        content: "",
        description: "",
        videoUrl: "",
        duration: "",
        exampleCode: "",
        exampleOutput: "",
        tags: [],
        imageUrl: "",
      },
      bg: {
        title: "",
        content: "",
        description: "",
        videoUrl: "",
        duration: "",
        exampleCode: "",
        exampleOutput: "",
        tags: [],
        imageUrl: "",
      },
      es: {
        title: "",
        content: "",
        description: "",
        videoUrl: "",
        duration: "",
        exampleCode: "",
        exampleOutput: "",
        tags: [],
        imageUrl: "",
      },
    },
  });

  // FORM UI STATE
  const [activeLanguageTab, setActiveLanguageTab] = useState<"en" | "bg" | "es">("en");
  const [expandedSections, setExpandedSections] = useState<{
    basic: boolean;
    content: boolean;
    media: boolean;
    advanced: boolean;
  }>({
    basic: true,
    content: true,
    media: false,
    advanced: false,
  });
  const [formErrors, setFormErrors] = useState<{
    slug?: string;
    title?: string;
    content?: string;
  }>({});

  // Form states
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [bucketResult, setBucketResult] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // UI states
  const [selectedView, setSelectedView] = useState<string>("overview");
  const [selectedFile, setSelectedFile] = useState<PrologCode | null>(null);
  const [selectedSupabaseFile, setSelectedSupabaseFile] = useState<SupabaseFile | null>(null);
  const [showFileModal, setShowFileModal] = useState<boolean>(false);
  const [showFileContentModal, setShowFileContentModal] = useState<boolean>(false);
  const [fileContent, setFileContent] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  console.log(selectedFile, showFileModal);

  // Statistics
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalSubmissions: 0,
    totalFiles: 0,
    pendingApprovals: 0,
    successRate: 0,
    activeToday: 0,
    avgExecutionTime: 0,
    storageUsage: 0,
    monthlyGrowth: 0,
  });

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Theme classes
  const themeClasses = {
    light: {
      background: "bg-gray-50",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      subtitle: "text-gray-500",
      card: "bg-white border-gray-200",
      hover: "hover:bg-gray-100",
      input: "bg-white border-gray-300",
    },
    dark: {
      background: "bg-gray-900",
      text: "text-white",
      textSecondary: "text-gray-400",
      subtitle: "text-gray-300",
      card: "bg-gray-800 border-gray-700",
      hover: "hover:bg-gray-700",
      input: "bg-gray-700 border-gray-600",
    },
  };

  const currentTheme = themeClasses[theme];

  // ============================================
  // ADMIN VERIFICATION
  // ============================================

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      try {
        setLoading(true);

        let isAdmin = false;

        if (userData && userData.role === "admin") {
          isAdmin = true;
        } else {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userDataDirect = userDoc.data();
            if (userDataDirect.role === "admin") {
              isAdmin = true;
            }
          }
        }

        if (isAdmin) {
          setIsAdminVerified(true);
          await loadAllData();
        } else {
          setIsAdminVerified(false);
        }
      } catch (error: any) {
        console.error("Error in admin access check:", error);
        setIsAdminVerified(false);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      checkAdminAccess();
    }
  }, [currentUser, userData]);

  const loadAllData = async () => {
    try {
      setLoading(true);

      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as User)
      );
      setUsers(usersData);

      const codesQuery = query(collection(db, "prologCodes"), orderBy("createdAt", "desc"));
      const codesSnapshot = await getDocs(codesQuery);
      const codesData = codesSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as PrologCode)
      );
      setPrologCodes(codesData);

      const assignmentsQuery = query(collection(db, "assignments"), orderBy("createdAt", "desc"));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Assignment)
      );
      setAssignments(assignmentsData);

      await loadSupabaseFiles();
      await loadLessons();
      await loadActivityLogs();

      calculateStats(usersData, codesData);

      const pending = usersData.filter((u) => u.role === "teacher" && u.status === "pending");
      setPendingTeachers(pending);
    } catch (error: any) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // WORD IMPORT FUNCTIONS (НОВА ВЕРСИЯ)
  // ============================================

  /**
   * Премахва водеща номерация от текст (напр. "1.", "1.1.", "2.1.1." и т.н.)
   */
  const cleanTitle = (text: string): string => {
    if (!text) return text;
    return text.replace(/^\d+(\.\d+)*\.?\s*/, '');
  };

  /**
   * Транслитерация на кирилица към латиница за slug
   */
  const transliterateCyrillic = (text: string): string => {
    const map: Record<string, string> = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sht",
      ъ: "a",
      ь: "y",
      ю: "yu",
      я: "ya",
      А: "A",
      Б: "B",
      В: "V",
      Г: "G",
      Д: "D",
      Е: "E",
      Ж: "Zh",
      З: "Z",
      И: "I",
      Й: "Y",
      К: "K",
      Л: "L",
      М: "M",
      Н: "N",
      О: "O",
      П: "P",
      Р: "R",
      С: "S",
      Т: "T",
      У: "U",
      Ф: "F",
      Х: "H",
      Ц: "Ts",
      Ч: "Ch",
      Ш: "Sh",
      Щ: "Sht",
      Ъ: "A",
      Ь: "Y",
      Ю: "Yu",
      Я: "Ya",
    };
    return text
      .split("")
      .map((ch) => map[ch] || ch)
      .join("");
  };

  /**
   * Парсва .docx файл, връща заглавие на курса и масив от елементи
   */
  const parseDocxFileAdvanced = async (file: File): Promise<{ courseTitle: string; elements: WordElement[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          // Мапваме Word стилове към HTML класове
          const styleMap = [
            "p[style-name='Title'] => h1.title",
            "p[style-name='Heading 1'] => h1",
            "p[style-name='Heading 2'] => h2",
            "p[style-name='Heading 3'] => h3",
            "p[style-name='Caption'] => p.caption",
            "p[style-name='Normal'] => p",
          ];

          const result = await mammoth.convertToHtml(
            { arrayBuffer },
            {
              styleMap,
              convertImage: mammoth.images.imgElement((image) => {
                return image.read("base64").then((imageBuffer) => {
                  return {
                    src: `data:${image.contentType};base64,${imageBuffer}`,
                  };
                });
              }),
            }
          );

          const html = result.value;
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const body = doc.body;

          // Конфигурираме Turndown с GFM поддръжка
          const turndownService = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
          });
          turndownService.use(gfm);

          const elements: WordElement[] = [];
          let courseTitle = "";

          // Рекурсивно обхождане на DOM
          const processNode = (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const tag = el.tagName.toLowerCase();

              // --- Title ---
              if (tag === "h1" && el.classList.contains("title")) {
                courseTitle = cleanTitle(el.textContent?.trim() || "");
                return;
              }

              // --- Heading 1 ---
              if (tag === "h1") {
                const text = el.textContent?.trim() || "";
                elements.push({ type: "heading1", text });
                return;
              }

              // --- Heading 2 ---
              if (tag === "h2") {
                const text = el.textContent?.trim() || "";
                elements.push({ type: "heading2", text });
                return;
              }

              // --- Heading 3 ---
              if (tag === "h3") {
                const text = el.textContent?.trim() || "";
                elements.push({ type: "heading3", text });
                return;
              }

              // --- Image (дори вътре в <p>) ---
              if (tag === "img") {
                const src = el.getAttribute("src");
                if (src && src.startsWith("data:")) {
                  elements.push({ type: "image", src });
                }
                return;
              }

              // --- Caption ---
              if (tag === "p" && el.classList.contains("caption")) {
                const text = el.textContent?.trim() || "";
                elements.push({ type: "caption", text });
                return;
              }

              // --- Paragraph, List, Table, Div ---
              if (tag === "p" || tag === "ul" || tag === "ol" || tag === "table" || tag === "div") {
                // Проверяваме за изображения вътре
                const images = el.querySelectorAll("img");
                if (images.length > 0) {
                  // Извличаме текста без изображенията
                  const clone = el.cloneNode(true) as HTMLElement;
                  clone.querySelectorAll("img").forEach((img) => img.remove());
                  const textContent = clone.innerHTML.trim();
                  if (textContent) {
                    const markdown = turndownService.turndown(textContent);
                    if (markdown.trim()) {
                      let type: WordElement["type"] = "paragraph";
                      if (tag === "ul" || tag === "ol") type = "list";
                      else if (tag === "table") type = "table";
                      elements.push({ type, content: markdown });
                    }
                  }
                  // Добавяме изображенията отделно
                  images.forEach((img) => {
                    const src = img.getAttribute("src");
                    if (src && src.startsWith("data:")) {
                      elements.push({ type: "image", src });
                    }
                  });
                } else {
                  // Няма изображения – конвертираме целия блок
                  const markdown = turndownService.turndown(el.outerHTML);
                  if (markdown.trim()) {
                    let type: WordElement["type"] = "paragraph";
                    if (tag === "ul" || tag === "ol") type = "list";
                    else if (tag === "table") type = "table";
                    elements.push({ type, content: markdown });
                  }
                }
                return;
              }

              // За други тагове – обхождаме децата
              for (const child of Array.from(el.childNodes)) {
                processNode(child);
              }
            }
          };

          for (const child of Array.from(body.childNodes)) {
            processNode(child);
          }

          // Ако нямаме заглавие, но първият елемент е heading1, ползваме него (изчистен)
          if (!courseTitle && elements.length > 0 && elements[0].type === "heading1") {
            courseTitle = cleanTitle(elements[0].text || "");
            elements.shift();
          }

          resolve({ courseTitle, elements });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Изгражда йерархия от уроци от списък с елементи
   */
  const buildLessonsFromElementsAdvanced = (elements: WordElement[]): ImportedLesson[] => {
    const lessons: ImportedLesson[] = [];
    let currentMain: ImportedLesson | null = null;
    let currentSub: ImportedSublesson | null = null;
    let mainCounter = 0;
    let subCounter = 0;

    let contentBuffer = "";

    type LastImage = {
      lesson: ImportedLesson | ImportedSublesson;
      index: number;
    };

    let lastImage: LastImage | null = null;

    const getLastImage = (): LastImage | null => {
      return lastImage;
    };

    const addContentToCurrent = (content: string, isImage?: boolean, imageSrc?: string) => {
      if (currentSub) {
        currentSub.content += content;
        if (isImage && imageSrc) {
          const idx = currentSub.images.length;
          currentSub.images.push({ src: imageSrc, caption: "" });
          currentSub.content += `\n\n![${idx}](${imageSrc})\n\n`;
          lastImage = { lesson: currentSub, index: idx };
        }
      } else if (currentMain) {
        currentMain.content += content;
        if (isImage && imageSrc) {
          const idx = currentMain.images.length;
          currentMain.images.push({ src: imageSrc, caption: "" });
          currentMain.content += `\n\n![${idx}](${imageSrc})\n\n`;
          lastImage = { lesson: currentMain, index: idx };
        }
      } else {
        contentBuffer += content;
      }
    };

    for (const el of elements) {
      switch (el.type) {
        case "heading1": {
          mainCounter++;
          subCounter = 0;
          currentMain = {
            lesson_number: mainCounter,
            title: cleanTitle(el.text || `Lesson ${mainCounter}`),
            content: "",
            images: [],
            sublessons: [],
          };
          lessons.push(currentMain);
          currentSub = null;
          lastImage = null;
          if (contentBuffer) {
            currentMain.content += contentBuffer + "\n\n";
            contentBuffer = "";
          }
          break;
        }

        case "heading2": {
          if (!currentMain) {
            mainCounter++;
            currentMain = {
              lesson_number: mainCounter,
              title: `Lesson ${mainCounter}`,
              content: "",
              images: [],
              sublessons: [],
            };
            lessons.push(currentMain);
          }
          subCounter++;
          currentSub = {
            sublesson_number: subCounter,
            title: cleanTitle(el.text || `Sublesson ${subCounter}`),
            content: "",
            images: [],
          };
          currentMain.sublessons.push(currentSub);
          lastImage = null;
          break;
        }

        case "heading3": {
          if (currentSub) {
            currentSub.content += `### ${el.text}\n\n`;
          } else if (currentMain) {
            currentMain.content += `### ${el.text}\n\n`;
          } else {
            contentBuffer += `### ${el.text}\n\n`;
          }
          break;
        }

        case "paragraph":
        case "list":
        case "table": {
          addContentToCurrent(el.content || "");
          break;
        }

        case "image": {
          addContentToCurrent("", true, el.src);
          break;
        }

        case "caption": {
          const imageRef = getLastImage();

          if (imageRef !== null) {
            const { lesson, index } = imageRef;
            const image = lesson.images[index];

            if (image) {
              const caption = el.text || "";

              image.caption = caption;

              const oldMarker = `![${index}](${image.src})`;
              const newMarker = `![${caption}](${image.src})`;

              lesson.content = lesson.content.replace(
                oldMarker,
                newMarker
              );
            }

            lastImage = null;
          } else {
            addContentToCurrent(`*${el.text || ""}*\n\n`);
          }

          break;
        }
      }
    }

    if (contentBuffer && lessons.length > 0) {
      const lastMain = lessons[lessons.length - 1];
      if (lastMain.sublessons.length > 0) {
        lastMain.sublessons[lastMain.sublessons.length - 1].content += contentBuffer;
      } else {
        lastMain.content += contentBuffer;
      }
    }

    for (const main of lessons) {
      if (main.content && main.sublessons.length === 0) {
        const newSub: ImportedSublesson = {
          sublesson_number: 1,
          title: main.title || `Lesson ${main.lesson_number}`,
          content: main.content,
          images: main.images,
        };
        main.sublessons.push(newSub);
        main.content = "";
      } else if (main.content && main.sublessons.length > 0) {
        main.sublessons[0].content = main.content + "\n\n" + main.sublessons[0].content;
        main.content = "";
      }
    }

    return lessons;
  };

  /**
   * Качва изображенията за даден урок в Supabase
   */
  const uploadImagesForLesson = async (lessonData: ImportedSublesson | ImportedLesson) => {
    const imagePromises = lessonData.images.map(async (img: WordImage, idx: number) => {
      const base64 = img.src.split(",")[1];
      const mime = img.src.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";
      const fileExt = mime.split("/")[1];
      const fileName = `lesson-${Date.now()}-${idx}.${fileExt}`;
      const filePath = `lessons/images/${fileName}`;

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });

      const { error } = await supabase.storage.from("prolog-files").upload(filePath, blob, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from("prolog-files").getPublicUrl(filePath);

      return { oldSrc: img.src, newUrl: urlData.publicUrl, caption: img.caption };
    });

    return await Promise.all(imagePromises);
  };

  // ============================================
  // ОБНОВЕНА ФУНКЦИЯ saveImportedLessons - с добавена поддръжка на courseTitle
  // ============================================
  /**
   * Записва импортираните уроци в Supabase, като едновременно записва и заглавието на курса
   * като специален урок с lesson_number = 0.
   */
  const saveImportedLessons = async (
    lessonsData: ImportedLesson[],
    language: "en" | "bg" | "es",
    courseTitle: string   // ← нов параметър
  ) => {
    // --- 0. Запис/ъпдейт на заглавието на курса чрез sentinel lesson_number = 0 ---
    if (courseTitle && courseTitle.trim()) {
      const { data: existingCourseLesson } = await supabase
        .from("lessons")
        .select("id")
        .eq("lesson_number", 0)
        .is("sublesson_number", null)
        .maybeSingle();

      let courseLessonId: string;

      if (existingCourseLesson) {
        courseLessonId = existingCourseLesson.id;
      } else {
        const { data: newCourseLesson, error: courseLessonError } = await supabase
          .from("lessons")
          .insert({
            slug: "course-info",
            lesson_number: 0,
            sublesson_number: null,
            order_index: -1,
            type: "text",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (courseLessonError) throw courseLessonError;
        courseLessonId = newCourseLesson.id;
      }

      const { data: existingCourseTranslation } = await supabase
        .from("lesson_translations")
        .select("id")
        .eq("lesson_id", courseLessonId)
        .eq("language", language)
        .maybeSingle();

      if (existingCourseTranslation) {
        await supabase
          .from("lesson_translations")
          .update({ title: courseTitle, updated_at: new Date().toISOString() })
          .eq("id", existingCourseTranslation.id);
      } else {
        await supabase.from("lesson_translations").insert({
          lesson_id: courseLessonId,
          language: language,
          title: courseTitle,
          content: "",
          description: "",
          image_url: null,
          video_url: null,
          duration: null,
          example_code: null,
          example_output: null,
          tags: [],
        });
      }
    }

    // --- Останалата част за запис на реалните уроци (без промяна) ---
    for (const main of lessonsData) {
      // --- 1. Създаваме главен урок (sublesson_number = null) ---
      const slugBase = transliterateCyrillic(main.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const mainSlug = `${main.lesson_number}-${slugBase || "lesson"}`;

      // Качваме изображенията на главния урок
      const mainImageResults = await uploadImagesForLesson(main);
      let mainContent = main.content || "";
      for (const img of mainImageResults) {
        mainContent = mainContent.replace(img.oldSrc, img.newUrl);
      }
      const mainImageUrl = mainImageResults.length > 0 ? mainImageResults[0].newUrl : null;

      const mainPayload = {
        slug: mainSlug,
        lesson_number: main.lesson_number,
        sublesson_number: null,   // ← това прави урока "главен"
        order_index: main.lesson_number * 100,
        type: "text",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: mainLessonData, error: mainLessonError } = await supabase
        .from("lessons")
        .insert(mainPayload)
        .select()
        .single();
      if (mainLessonError) throw mainLessonError;

      // Превод на главния урок
      const mainTranslationPayload = {
        lesson_id: mainLessonData.id,
        language: language,
        title: main.title,
        content: mainContent,
        description: "",
        image_url: mainImageUrl,
        video_url: null,
        duration: null,
        example_code: null,
        example_output: null,
        tags: [],
      };
      const { error: mainTransError } = await supabase
        .from("lesson_translations")
        .insert(mainTranslationPayload);
      if (mainTransError) throw mainTransError;

      // --- 2. Създаваме подуроците ---
      for (const sub of main.sublessons) {
        const subSlugBase = transliterateCyrillic(sub.title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const subSlug = `${main.lesson_number}-${sub.sublesson_number}-${subSlugBase || "lesson"}`;

        const subImageResults = await uploadImagesForLesson(sub);
        let subContent = sub.content || "";
        for (const img of subImageResults) {
          subContent = subContent.replace(img.oldSrc, img.newUrl);
        }
        const subImageUrl = subImageResults.length > 0 ? subImageResults[0].newUrl : null;

        const subPayload = {
          slug: subSlug,
          lesson_number: main.lesson_number,
          sublesson_number: sub.sublesson_number,
          order_index: main.lesson_number * 100 + sub.sublesson_number,
          type: "text",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: subLessonData, error: subLessonError } = await supabase
          .from("lessons")
          .insert(subPayload)
          .select()
          .single();
        if (subLessonError) throw subLessonError;

        const subTranslationPayload = {
          lesson_id: subLessonData.id,
          language: language,
          title: sub.title,
          content: subContent,
          description: "",
          image_url: subImageUrl,
          video_url: null,
          duration: null,
          example_code: null,
          example_output: null,
          tags: [],
        };
        const { error: subTransError } = await supabase
          .from("lesson_translations")
          .insert(subTranslationPayload);
        if (subTransError) throw subTransError;
      }
    }
    return true;
  };

  // ============================================
  // IMAGE UPLOAD FUNCTIONS (съществуващи)
  // ============================================

  const uploadLessonImage = async (file: File, language: string) => {
    try {
      setUploadingImage(true);
      setUploadingForLanguage(language);
      setUploadProgress(0);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lessons/images/${fileName}`;

      const { error } = await supabase.storage.from("prolog-files").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) throw error;

      setUploadProgress(100);

      const { data: urlData } = supabase.storage.from("prolog-files").getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      const markdownImage = `\n\n![${file.name}](${imageUrl})\n`;

      setLessonFormData((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          [language]: {
            ...prev.translations[language as "en" | "bg" | "es"],
            content: prev.translations[language as "en" | "bg" | "es"].content + markdownImage,
            imageUrl: imageUrl,
          },
        },
      }));

      setBucketResult(`✅ Image "${file.name}" uploaded successfully!`);
      setUploadingImage(false);
      setUploadingForLanguage(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setBucketResult(`❌ Error uploading image: ${error.message}`);
      setUploadingImage(false);
      setUploadingForLanguage(null);
      setUploadProgress(0);
    }
  };

  // VIDEO UPLOAD FUNCTIONS (съществуващи)
  const uploadLessonVideo = async (file: File, language: string) => {
    try {
      setUploadingVideo(true);
      setUploadingVideoForLanguage(language);
      setVideoUploadProgress(0);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lessons/videos/${fileName}`;

      const { error } = await supabase.storage.from("prolog-files").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) throw error;

      setVideoUploadProgress(100);

      const { data: urlData } = supabase.storage.from("prolog-files").getPublicUrl(filePath);
      const videoUrl = urlData.publicUrl;

      setLessonFormData((prev) => ({
        ...prev,
        translations: {
          ...prev.translations,
          [language]: {
            ...prev.translations[language as "en" | "bg" | "es"],
            videoUrl: videoUrl,
          },
        },
      }));

      setBucketResult(`✅ Video "${file.name}" uploaded successfully!`);
      setUploadingVideo(false);
      setUploadingVideoForLanguage(null);
      setVideoUploadProgress(0);
    } catch (error: any) {
      console.error("Error uploading video:", error);
      setBucketResult(`❌ Error uploading video: ${error.message}`);
      setUploadingVideo(false);
      setUploadingVideoForLanguage(null);
      setVideoUploadProgress(0);
    }
  };

  // ============================================
  // FORM VALIDATION
  // ============================================

  const validateLessonForm = (): boolean => {
    const errors: typeof formErrors = {};
    let isValid = true;

    if (!lessonFormData.slug.trim()) {
      errors.slug = "Slug is required";
      isValid = false;
    }

    if (!lessonFormData.translations.en.title.trim()) {
      errors.title = "English title is required";
      isValid = false;
    }

    if (!lessonFormData.translations.en.content.trim()) {
      errors.content = "English content is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // ============================================
  // TOGGLE SECTIONS
  // ============================================

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ============================================
  // LANGUAGE HELPERS
  // ============================================

  const languageFlags = {
    en: "🇬🇧",
    bg: "🇧🇬",
    es: "🇪🇸",
  };

  const languageNames = {
    en: "English",
    bg: "Български",
    es: "Español",
  };

  const getLanguageStatus = (lang: "en" | "bg" | "es") => {
    const t = lessonFormData.translations[lang];
    const fields = [t.title, t.content];
    const filled = fields.filter((f) => f && f.trim().length > 0).length;
    return { filled, total: fields.length };
  };

  // ============================================
  // LESSONS MANAGEMENT (съществуващи функции)
  // ============================================

  const loadLessons = async () => {
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(
          `
          *,
          translations:lesson_translations(*)
        `
        )
        .order("order_index", { ascending: true });

      if (lessonsError) throw lessonsError;

      setLessons(lessonsData || []);
    } catch (error) {
      console.error("Error loading lessons:", error);
    }
  };

  const resetLessonForm = () => {
    setLessonFormData({
      slug: "",
      lessonNumber: 1,
      sublessonNumber: undefined,
      orderIndex: 0,
      type: "text",
      translations: {
        en: {
          title: "",
          content: "",
          description: "",
          videoUrl: "",
          duration: "",
          exampleCode: "",
          exampleOutput: "",
          tags: [],
          imageUrl: "",
        },
        bg: {
          title: "",
          content: "",
          description: "",
          videoUrl: "",
          duration: "",
          exampleCode: "",
          exampleOutput: "",
          tags: [],
          imageUrl: "",
        },
        es: {
          title: "",
          content: "",
          description: "",
          videoUrl: "",
          duration: "",
          exampleCode: "",
          exampleOutput: "",
          tags: [],
          imageUrl: "",
        },
      },
    });
    setEditingLesson(null);
    setFormErrors({});
  };

  const saveLesson = async () => {
    if (!validateLessonForm()) {
      setBucketResult("❌ Please fix the errors before saving");
      return;
    }

    try {
      if (!lessonFormData.slug.trim()) {
        setBucketResult("❌ Please enter a slug");
        return;
      }
      if (!lessonFormData.translations.en.title.trim()) {
        setBucketResult("❌ Please enter an English title");
        return;
      }
      if (!lessonFormData.translations.en.content.trim()) {
        setBucketResult("❌ Please enter English content");
        return;
      }

      const lessonPayload = {
        slug: lessonFormData.slug,
        lesson_number: lessonFormData.lessonNumber,
        sublesson_number: lessonFormData.sublessonNumber || null,
        order_index: lessonFormData.orderIndex,
        type: lessonFormData.type,
        updated_at: new Date().toISOString(),
      };

      let lessonId: string;

      if (editingLesson) {
        const { error: updateError } = await supabase
          .from("lessons")
          .update(lessonPayload)
          .eq("id", editingLesson.id);

        if (updateError) throw updateError;
        lessonId = editingLesson.id;
      } else {
        const { data: newLesson, error: insertError } = await supabase
          .from("lessons")
          .insert({
            ...lessonPayload,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;
        lessonId = newLesson.id;
      }

      const languages = ["en", "bg", "es"] as const;
      for (const lang of languages) {
        const translation = lessonFormData.translations[lang];

        if (editingLesson) {
          const existingTranslation = editingLesson.translations.find((t) => t.language === lang);
          if (existingTranslation) {
            const { error: updateTransError } = await supabase
              .from("lesson_translations")
              .update({
                title: translation.title || `${lang === "en" ? "Untitled" : ""}`,
                content: translation.content || "",
                description: translation.description || null,
                video_url: translation.videoUrl || null,
                duration: translation.duration || null,
                example_code: translation.exampleCode || null,
                example_output: translation.exampleOutput || null,
                tags: translation.tags || [],
                image_url: translation.imageUrl || null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingTranslation.id);

            if (updateTransError) throw updateTransError;
          } else {
            const { error: insertTransError } = await supabase
              .from("lesson_translations")
              .insert({
                lesson_id: lessonId,
                language: lang,
                title: translation.title || `${lang === "en" ? "Untitled" : ""}`,
                content: translation.content || "",
                description: translation.description || null,
                video_url: translation.videoUrl || null,
                duration: translation.duration || null,
                example_code: translation.exampleCode || null,
                example_output: translation.exampleOutput || null,
                tags: translation.tags || [],
                image_url: translation.imageUrl || null,
              });

            if (insertTransError) throw insertTransError;
          }
        } else {
          const { error: insertTransError } = await supabase
            .from("lesson_translations")
            .insert({
              lesson_id: lessonId,
              language: lang,
              title: translation.title || `${lang === "en" ? "Untitled" : ""}`,
              content: translation.content || "",
              description: translation.description || null,
              video_url: translation.videoUrl || null,
              duration: translation.duration || null,
              example_code: translation.exampleCode || null,
              example_output: translation.exampleOutput || null,
              tags: translation.tags || [],
              image_url: translation.imageUrl || null,
            });

          if (insertTransError) throw insertTransError;
        }
      }

      await addActivityLog({
        action: editingLesson ? "Updated lesson" : "Created new lesson",
        actionType: editingLesson ? "lesson_updated" : "lesson_created",
        target: lessonFormData.translations.en.title || lessonFormData.slug,
        details: `${editingLesson ? "Updated" : "Created"} lesson "${lessonFormData.slug}"`,
      });

      setShowLessonModal(false);
      resetLessonForm();
      await loadLessons();
      setBucketResult(`✅ Lesson "${lessonFormData.slug}" saved successfully!`);
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      setBucketResult(`❌ Error saving lesson: ${error.message}`);
    }
  };

  const deleteLesson = async (lesson: Lesson) => {
    const englishTitle = lesson.translations.find((t) => t.language === "en")?.title || lesson.slug;
    if (!confirm(`Delete lesson "${englishTitle}"? This will delete all translations.`)) {
      return;
    }

    try {
      const { error: deleteTransError } = await supabase
        .from("lesson_translations")
        .delete()
        .eq("lesson_id", lesson.id);

      if (deleteTransError) throw deleteTransError;

      const { error: deleteError } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lesson.id);

      if (deleteError) throw deleteError;

      await addActivityLog({
        action: "Deleted lesson",
        actionType: "lesson_deleted",
        target: lesson.slug,
        details: `Deleted lesson "${lesson.slug}"`,
      });

      await loadLessons();
      setBucketResult(`✅ Lesson "${englishTitle}" deleted successfully!`);
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      setBucketResult(`❌ Error deleting lesson: ${error.message}`);
    }
  };

  const editLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);

    const getTranslation = (lang: "en" | "bg" | "es") => {
      return lesson.translations.find((t) => t.language === lang) || {
        title: "",
        content: "",
        description: "",
        video_url: "",
        duration: "",
        example_code: "",
        example_output: "",
        tags: [],
        image_url: "",
      };
    };

    const en = getTranslation("en");
    const bg = getTranslation("bg");
    const es = getTranslation("es");

    setLessonFormData({
      slug: lesson.slug,
      lessonNumber: lesson.lesson_number,
      sublessonNumber: lesson.sublesson_number || undefined,
      orderIndex: lesson.order_index,
      type: lesson.type,
      translations: {
        en: {
          title: en.title || "",
          content: en.content || "",
          description: en.description || "",
          videoUrl: en.video_url || "",
          duration: en.duration || "",
          exampleCode: en.example_code || "",
          exampleOutput: en.example_output || "",
          tags: en.tags || [],
          imageUrl: en.image_url || "",
        },
        bg: {
          title: bg.title || "",
          content: bg.content || "",
          description: bg.description || "",
          videoUrl: bg.video_url || "",
          duration: bg.duration || "",
          exampleCode: bg.example_code || "",
          exampleOutput: bg.example_output || "",
          tags: bg.tags || [],
          imageUrl: bg.image_url || "",
        },
        es: {
          title: es.title || "",
          content: es.content || "",
          description: es.description || "",
          videoUrl: es.video_url || "",
          duration: es.duration || "",
          exampleCode: es.example_code || "",
          exampleOutput: es.example_output || "",
          tags: es.tags || [],
          imageUrl: es.image_url || "",
        },
      },
    });
    setShowLessonModal(true);
  };

  // ============================================
  // ФИЛТРИРАНЕ НА УРОЦИТЕ – ПРОПУСКАМЕ СЕНТИНЕЛА (lesson_number === 0)
  // ============================================
  const filteredLessons = lessons.filter((lesson) => {
    // Пропускаме сентинела (заглавие на курса)
    if (lesson.lesson_number === 0) return false;

    const englishTitle = lesson.translations.find((t) => t.language === "en")?.title || lesson.slug;
    const matchesSearch =
      englishTitle.toLowerCase().includes(lessonSearchQuery.toLowerCase()) ||
      lesson.slug.toLowerCase().includes(lessonSearchQuery.toLowerCase());
    const matchesType = lessonTypeFilter === "all" || lesson.type === lessonTypeFilter;
    return matchesSearch && matchesType;
  });

  const mainLessons = filteredLessons;

  // ============================================
  // ACTIVITY LOGS
  // ============================================

  const loadActivityLogs = async () => {
    try {
      const logsQuery = query(
        collection(db, "activityLogs"),
        orderBy("timestamp", "desc"),
        limit(100)
      );

      const logsSnapshot = await getDocs(logsQuery);
      const logsData: ActivityLog[] = [];

      logsSnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate() || new Date();

        logsData.push({
          id: doc.id,
          userId: data.userId || "",
          user: data.userName || data.user || "System",
          userEmail: data.userEmail || "",
          action: data.action || "Unknown action",
          actionType: data.actionType || "info",
          target: data.target || "",
          targetId: data.targetId || "",
          details: data.details || "",
          timestamp: timestamp,
          icon: getActivityIcon(data.actionType || "info"),
          color: getActivityColor(data.actionType || "info"),
        });
      });

      if (logsData.length === 0) {
        await generateActivityLogsFromData();
      } else {
        setActivityLogs(logsData);
      }
    } catch (error) {
      console.error("Error loading activity logs:", error);
      await generateActivityLogsFromData();
    }
  };

  const generateActivityLogsFromData = async () => {
    const generatedLogs: ActivityLog[] = [];
    const now = new Date();

    users.slice(0, 20).forEach((user) => {
      generatedLogs.push({
        id: `user-${user.id}`,
        userId: user.id,
        user: user.fullName,
        userEmail: user.email,
        action: `User ${user.role} registered`,
        actionType: "user_registered",
        target: user.institution,
        targetId: user.id,
        details: `New ${user.role} account created`,
        timestamp: user.createdAt || new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        icon: <UserPlus className="w-4 h-4" />,
        color: "blue",
      });
    });

    prologCodes.slice(0, 30).forEach((code) => {
      const user = users.find((u) => u.id === code.userId) || { fullName: code.username, email: "" };

      generatedLogs.push({
        id: `code-${code.id}`,
        userId: code.userId,
        user: user.fullName,
        userEmail: user.email || "",
        action: "Submitted Prolog code",
        actionType: "code_submitted",
        target: code.title,
        targetId: code.id,
        details: `Status: ${code.status} • ${code.uploadFormat || "manual input"}`,
        timestamp:
          code.createdAt || new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        icon: <Code className="w-4 h-4" />,
        color: code.status === "success" ? "green" : code.status === "error" ? "red" : "amber",
      });
    });

    assignments.slice(0, 15).forEach((assignment) => {
      const creator = users.find((u) => u.id === assignment.createdBy) || {
        fullName: "Teacher",
        email: "",
      };

      generatedLogs.push({
        id: `assignment-${assignment.id}`,
        userId: assignment.createdBy,
        user: creator.fullName,
        userEmail: creator.email || "",
        action: "Created assignment",
        actionType: "assignment_created",
        target: assignment.title,
        targetId: assignment.id,
        details: `Status: ${assignment.status} • ${assignment.submissions || 0} submissions`,
        timestamp:
          assignment.createdAt ||
          new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        icon: <BookOpen className="w-4 h-4" />,
        color: "indigo",
      });
    });

    supabaseFiles.slice(0, 20).forEach((file) => {
      const randomUser = users[Math.floor(Math.random() * users.length)];

      generatedLogs.push({
        id: `file-${file.id}`,
        userId: randomUser?.id || "",
        user: randomUser?.fullName || "Unknown User",
        userEmail: randomUser?.email || "",
        action: "Uploaded file to storage",
        actionType: "file_uploaded",
        target: file.name,
        targetId: file.id,
        details: `Folder: ${file.folder} • Size: ${(file.size / 1024).toFixed(2)} KB`,
        timestamp:
          new Date(file.created_at) ||
          new Date(now.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        icon: <Upload className="w-4 h-4" />,
        color: "cyan",
      });
    });

    users
      .filter((u) => u.lastLogin)
      .slice(0, 15)
      .forEach((user) => {
        generatedLogs.push({
          id: `login-${user.id}`,
          userId: user.id,
          user: user.fullName,
          userEmail: user.email,
          action: "Logged in to system",
          actionType: "user_login",
          target: "Platform",
          targetId: user.id,
          details: `Role: ${user.role} • Status: ${user.status}`,
          timestamp:
            user.lastLogin || new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
          icon: <Key className="w-4 h-4" />,
          color: "purple",
        });
      });

    const sortedLogs = generatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setActivityLogs(sortedLogs.slice(0, 100));

    try {
      for (const log of sortedLogs.slice(0, 50)) {
        await addDoc(collection(db, "activityLogs"), {
          userId: log.userId,
          userName: log.user,
          userEmail: log.userEmail,
          action: log.action,
          actionType: log.actionType,
          target: log.target,
          targetId: log.targetId,
          details: log.details,
          timestamp: serverTimestamp(),
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error saving generated logs:", error);
    }
  };

  const getActivityIcon = (actionType: string): React.ReactNode => {
    switch (actionType) {
      case "user_registered":
        return <UserPlus className="w-4 h-4" />;
      case "code_submitted":
        return <Code className="w-4 h-4" />;
      case "assignment_created":
        return <BookOpen className="w-4 h-4" />;
      case "assignment_submitted":
        return <Puzzle className="w-4 h-4" />;
      case "file_uploaded":
        return <Upload className="w-4 h-4" />;
      case "file_downloaded":
        return <Download className="w-4 h-4" />;
      case "file_deleted":
        return <Trash2 className="w-4 h-4" />;
      case "folder_created":
        return <FolderPlus className="w-4 h-4" />;
      case "user_login":
        return <Key className="w-4 h-4" />;
      case "user_updated":
        return <UserCog className="w-4 h-4" />;
      case "teacher_approved":
        return <UserCheck className="w-4 h-4" />;
      case "teacher_rejected":
        return <UserX className="w-4 h-4" />;
      case "lesson_created":
        return <BookOpen className="w-4 h-4" />;
      case "lesson_updated":
        return <BookOpen className="w-4 h-4" />;
      case "lesson_deleted":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (actionType: string): string => {
    switch (actionType) {
      case "user_registered":
        return "blue";
      case "code_submitted":
        return "green";
      case "assignment_created":
        return "indigo";
      case "assignment_submitted":
        return "purple";
      case "file_uploaded":
        return "cyan";
      case "file_downloaded":
        return "blue";
      case "file_deleted":
        return "red";
      case "folder_created":
        return "teal";
      case "user_login":
        return "purple";
      case "user_updated":
        return "amber";
      case "teacher_approved":
        return "green";
      case "teacher_rejected":
        return "red";
      case "lesson_created":
        return "indigo";
      case "lesson_updated":
        return "amber";
      case "lesson_deleted":
        return "red";
      default:
        return "gray";
    }
  };

  // ============================================
  // STATISTICS
  // ============================================

  const calculateStats = (usersData: User[], codesData: PrologCode[]) => {
    const totalUsers = usersData.length;
    const totalStudents = usersData.filter((u) => u.role === "student").length;
    const totalTeachers = usersData.filter((u) => u.role === "teacher").length;
    const totalAdmins = usersData.filter((u) => u.role === "admin").length;
    const totalSubmissions = codesData.length;
    const successfulSubmissions = codesData.filter((c) => c.status === "success").length;
    const successRate = totalSubmissions > 0 ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;
    const pendingApprovals = usersData.filter((u) => u.status === "pending").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = usersData.filter((u) => {
      if (!u.lastLogin) return false;
      return new Date(u.lastLogin) >= today;
    }).length;

    setStats((prev) => ({
      ...prev,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalSubmissions,
      pendingApprovals,
      successRate,
      activeToday,
      totalFiles: supabaseStats.totalFiles,
    }));
  };

  // ============================================
  // SUPABASE STORAGE FUNCTIONS (съществуващи)
  // ============================================

  const createSupabaseFolder = async () => {
    if (!newFolderName.trim()) {
      setBucketResult("❌ Please enter a folder name");
      return;
    }

    try {
      const content = "# Placeholder for folder";

      const { error } = await supabase.storage
        .from("prolog-files")
        .upload(`${newFolderName}/.folderplaceholder`, content, {
          upsert: false,
          contentType: "text/plain",
        });

      if (error) throw error;

      setBucketResult(`✅ Folder "${newFolderName}" created successfully.`);
      setNewFolderName("");
      await refreshSupabaseData();

      await addActivityLog({
        action: "Created new folder",
        actionType: "folder_created",
        target: newFolderName,
        details: `Created folder "${newFolderName}" in storage`,
      });
    } catch (error: any) {
      console.error("Error creating folder:", error);
      setBucketResult(`❌ Error creating folder: ${error.message}`);
    }
  };

  const refreshSupabaseData = async () => {
    try {
      setBucketResult("🔄 Loading storage data...");
      console.log("🔍 Directly fetching from bucket: prolog-files");

      const { data: rootItems, error } = await supabase.storage
        .from("prolog-files")
        .list("", { limit: 1000 });

      if (error) {
        console.error("❌ Error:", error);

        const alternativeNames = ["prolog_files", "prologfiles", "lessons", "files"];

        for (const altName of alternativeNames) {
          console.log(`🔄 Trying alternative bucket: ${altName}`);
          const { data: altData, error: altError } = await supabase.storage
            .from(altName)
            .list("", { limit: 10 });

          if (!altError && altData) {
            console.log(`✅ Found bucket: ${altName}`);
            setBucketResult(`✅ Connected to bucket: ${altName}`);
            return;
          }
        }

        setBucketResult(`❌ Error: ${error.message}. Please check bucket name.`);
        return;
      }

      console.log("✅ Success! Items:", rootItems?.length || 0);

      if (!rootItems || rootItems.length === 0) {
        setSupabaseFolders([]);
        setSupabaseStats({
          totalFiles: 0,
          totalFolders: 0,
          totalSize: 0,
          lastUpdated: null,
          storageUsed: "0 MB",
        });
        setBucketResult("✅ Connected. No files found.");
        return;
      }

      const allFiles: SupabaseFile[] = [];
      const foldersMap = new Map<string, SupabaseFolder>();
      let totalSize = 0;

      for (const item of rootItems) {
        if (!item.name) continue;
        if (item.name.startsWith(".")) continue;

        const isFolder = item.id === null || item.id === undefined;

        if (isFolder) {
          const folderName = item.name;
          console.log(`📁 Processing folder: ${folderName}`);

          const { data: folderFiles, error: folderError } = await supabase.storage
            .from("prolog-files")
            .list(folderName, { limit: 1000 });

          const folderFileList: SupabaseFile[] = [];

          if (!folderError && folderFiles) {
            const validFiles = folderFiles.filter(
              (file) => file.name && !file.name.startsWith(".") && file.id !== null && file.id !== undefined
            );

            validFiles.forEach((file) => {
              const size = file.metadata?.size || 0;
              folderFileList.push({
                name: file.name || "",
                id: file.id || Math.random().toString(36).substring(2),
                created_at: file.created_at || new Date().toISOString(),
                updated_at: file.updated_at || new Date().toISOString(),
                size: size,
                folder: folderName,
                fullPath: `${folderName}/${file.name}`,
                metadata: file.metadata || {},
              });
              totalSize += size;
            });
          }

          foldersMap.set(folderName, {
            name: folderName,
            fileCount: folderFileList.length,
            size: folderFileList.reduce((sum, f) => sum + f.size, 0),
            files: folderFileList,
          });

          allFiles.push(...folderFileList);
        } else {
          const size = item.metadata?.size || 0;
          allFiles.push({
            name: item.name,
            id: item.id || Math.random().toString(36).substring(2),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            size: size,
            folder: "root",
            fullPath: item.name,
            metadata: item.metadata || {},
          });
          totalSize += size;
        }
      }

      const folderData = Array.from(foldersMap.values());

      console.log(`📊 Found ${folderData.length} folders, ${allFiles.length} files`);

      setSupabaseFiles(allFiles);
      setSupabaseFolders(folderData);

      const storageUsed =
        totalSize < 1024 * 1024
          ? `${(totalSize / 1024).toFixed(2)} KB`
          : `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;

      setSupabaseStats({
        totalFiles: allFiles.length,
        totalFolders: folderData.length,
        totalSize: totalSize,
        lastUpdated: Date.now(),
        storageUsed: storageUsed,
      });

      setBucketResult(`✅ Found ${folderData.length} folders with ${allFiles.length} files`);
    } catch (error: any) {
      console.error("❌ Error:", error);
      setBucketResult(`❌ Error: ${error.message}`);
    }
  };

  const viewFolderFiles = async (folderName: string) => {
    try {
      console.log(`📁 Opening folder: ${folderName}`);

      const folder = supabaseFolders.find((f) => f.name === folderName);

      if (folder && folder.files && folder.files.length > 0) {
        console.log(`  Using cached files: ${folder.files.length} files`);
        setSelectedFolder(folderName);
        setFolderFiles(folder.files);
        return;
      }

      console.log(`  Fetching files from Supabase for: ${folderName}`);
      const { data: files, error } = await supabase.storage
        .from("prolog-files")
        .list(folderName, { limit: 1000 });

      if (error) throw error;

      console.log(`  Found ${files?.length || 0} items in ${folderName}`);

      const supabaseFiles: SupabaseFile[] = (files || [])
        .filter((file) => file.name && !file.name.startsWith(".") && file.id !== null && file.id !== undefined)
        .map((file) => ({
          name: file.name || "",
          id: file.id || Math.random().toString(36).substring(2),
          created_at: file.created_at || new Date().toISOString(),
          updated_at: file.updated_at || new Date().toISOString(),
          size: file.metadata?.size || 0,
          folder: folderName,
          fullPath: `${folderName}/${file.name}`,
          metadata: file.metadata || {},
        }));

      setSelectedFolder(folderName);
      setFolderFiles(supabaseFiles);

      if (supabaseFiles.length === 0) {
        setBucketResult(`📂 Folder "${folderName}" is empty`);
      } else {
        setBucketResult(`📄 Found ${supabaseFiles.length} files in "${folderName}"`);
      }
    } catch (error: any) {
      console.error(`❌ Error loading folder ${folderName}:`, error);
      setBucketResult(`❌ Error loading folder: ${error.message}`);
      setSelectedFolder(null);
      setFolderFiles([]);
    }
  };

  const viewFileContent = async (file: SupabaseFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("prolog-files")
        .download(file.fullPath);

      if (error) throw error;

      const text = await data.text();
      setFileContent(text);
      setSelectedSupabaseFile(file);
      setShowFileContentModal(true);

      await addActivityLog({
        action: "Viewed file content",
        actionType: "file_viewed",
        target: file.name,
        details: `Viewed file "${file.name}" from folder "${file.folder}"`,
      });
    } catch (error: any) {
      setBucketResult(`❌ Error loading file content: ${error.message}`);
    }
  };

  const deleteFileInFolder = async (fileName: string) => {
    if (!selectedFolder || !confirm(`Delete ${fileName}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase.storage
        .from("prolog-files")
        .remove([`${selectedFolder}/${fileName}`]);

      if (error) throw error;

      setBucketResult(`✅ File "${fileName}" deleted successfully.`);
      await viewFolderFiles(selectedFolder);
      await refreshSupabaseData();

      await addActivityLog({
        action: "Deleted file from storage",
        actionType: "file_deleted",
        target: fileName,
        details: `Deleted file "${fileName}" from folder "${selectedFolder}"`,
      });
    } catch (error: any) {
      setBucketResult(`❌ Error deleting file: ${error.message}`);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("prolog-files")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await addActivityLog({
        action: "Downloaded file",
        actionType: "file_downloaded",
        target: fileName,
        details: `Downloaded file "${fileName}"`,
      });
    } catch (error: any) {
      setBucketResult(`❌ Error downloading file: ${error.message}`);
    }
  };

  const copyFileUrl = (fileName: string) => {
    if (!selectedFolder) return;
    console.log(copyFileUrl);
    const { data } = supabase.storage
      .from("prolog-files")
      .getPublicUrl(`${selectedFolder}/${fileName}`);

    if (data.publicUrl) {
      navigator.clipboard.writeText(data.publicUrl);
      setBucketResult("✅ File URL copied to clipboard!");

      addActivityLog({
        action: "Copied file URL",
        actionType: "file_url_copied",
        target: fileName,
        details: `Copied URL for file "${fileName}"`,
      });
    }
  };

  const loadSupabaseFiles = async () => {
    try {
      await refreshSupabaseData();
    } catch (error) {
      console.error("Error loading Supabase files:", error);
      setSupabaseFolders([]);
      setSupabaseFiles([]);
      setSupabaseStats({
        totalFiles: 0,
        totalFolders: 0,
        totalSize: 0,
        lastUpdated: null,
        storageUsed: "0 MB",
      });
    }
  };

  const viewCodeInNewTab = (code: PrologCode) => {
    const codeBlob = new Blob([code.code], { type: "text/plain" });
    const codeUrl = URL.createObjectURL(codeBlob);
    window.open(codeUrl, "_blank");

    addActivityLog({
      action: "Viewed code in new tab",
      actionType: "code_viewed",
      target: code.title,
      details: `Viewed Prolog code "${code.title}" in new tab`,
    });
  };

  const openFileModal = (code: PrologCode) => {
    setSelectedFile(code);
    setShowFileModal(true);
  };

  // ============================================
  // ADD ACTIVITY LOG HELPER
  // ============================================

  const addActivityLog = async (logData: {
    action: string;
    actionType: string;
    target: string;
    details: string;
    targetId?: string;
  }) => {
    try {
      const activityLog = {
        userId: currentUser?.uid || "",
        userName: userData?.fullName || currentUser?.email?.split("@")[0] || "Admin",
        userEmail: currentUser?.email || "",
        action: logData.action,
        actionType: logData.actionType,
        target: logData.target,
        targetId: logData.targetId || "",
        details: logData.details,
        timestamp: serverTimestamp(),
        createdAt: new Date(),
      };

      await addDoc(collection(db, "activityLogs"), activityLog);

      const newLog: ActivityLog = {
        id: Date.now().toString(),
        userId: activityLog.userId,
        user: activityLog.userName,
        userEmail: activityLog.userEmail,
        action: activityLog.action,
        actionType: activityLog.actionType,
        target: activityLog.target,
        targetId: activityLog.targetId,
        details: activityLog.details,
        timestamp: new Date(),
        icon: getActivityIcon(activityLog.actionType),
        color: getActivityColor(activityLog.actionType),
      };

      setActivityLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    } catch (error) {
      console.error("Error adding activity log:", error);
    }
  };

  // ============================================
  // TEACHER APPROVALS & USER MANAGEMENT
  // ============================================

  const approveTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, "users", teacherId), {
        status: "active",
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.uid,
        isVerified: true,
      });

      const teacher = users.find((u) => u.id === teacherId);

      await addActivityLog({
        action: "Approved teacher",
        actionType: "teacher_approved",
        target: teacher?.fullName || teacherId,
        targetId: teacherId,
        details: `Approved teacher "${teacher?.fullName}" (${teacher?.email})`,
      });

      await loadAllData();
    } catch (error) {
      console.error("Error approving teacher:", error);
    }
  };

  const rejectTeacher = async (teacherId: string) => {
    try {
      await updateDoc(doc(db, "users", teacherId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.uid,
      });

      const teacher = users.find((u) => u.id === teacherId);

      await addActivityLog({
        action: "Rejected teacher",
        actionType: "teacher_rejected",
        target: teacher?.fullName || teacherId,
        targetId: teacherId,
        details: `Rejected teacher "${teacher?.fullName}" (${teacher?.email})`,
      });

      await loadAllData();
    } catch (error) {
      console.error("Error rejecting teacher:", error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    if (userId === currentUser?.uid) {
      return;
    }

    try {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await updateDoc(doc(db, "users", userId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid,
      });

      const user = users.find((u) => u.id === userId);

      await addActivityLog({
        action: `Changed user status to ${newStatus}`,
        actionType: "user_updated",
        target: user?.fullName || userId,
        targetId: userId,
        details: `Changed status of user "${user?.fullName}" from ${currentStatus} to ${newStatus}`,
      });

      await loadAllData();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.uid) {
      return;
    }

    try {
      const userCodes = prologCodes.filter((code) => code.userId === userId);
      for (const code of userCodes) {
        try {
          await deleteDoc(doc(db, "prologCodes", code.id));
        } catch (codeError) {
          console.error(`Error deleting code ${code.id}:`, codeError);
        }
      }

      await deleteDoc(doc(db, "users", userId));

      await addActivityLog({
        action: "Deleted user account",
        actionType: "user_deleted",
        target: userName,
        targetId: userId,
        details: `Deleted user account "${userName}" and all associated data`,
      });

      await loadAllData();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // ============================================
  // FILTERS AND NAV
  // ============================================

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.institution.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredCodes = prologCodes.filter((code) => {
    return (
      code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredActivityLogs = activityLogs.filter((log) => {
    if (activityFilter === "all") return true;
    if (activityFilter === "code")
      return log.actionType.includes("code") || log.actionType.includes("assignment");
    if (activityFilter === "file")
      return log.actionType.includes("file") || log.actionType.includes("folder");
    if (activityFilter === "user")
      return log.actionType.includes("user") || log.actionType.includes("teacher");
    return true;
  });

  // Stats cards
  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      change: `+${stats.monthlyGrowth}%`,
      description: "Registered users",
    },
    {
      title: "Active Today",
      value: stats.activeToday,
      icon: <Activity className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      change: `${Math.round((stats.activeToday / stats.totalUsers) * 100)}%`,
      description: "Active in last 24h",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: <Clock className="w-6 h-6" />,
      color: "from-amber-500 to-orange-500",
      change: "Requires attention",
      description: "Waiting for review",
    },
    {
      title: "Success Rate",
      value: `${stats.successRate}%`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      change: `${stats.avgExecutionTime}ms avg`,
      description: "Code execution",
    },
  ];

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="w-5 h-5" />,
      badge: null,
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      badge: stats.totalUsers,
    },
    {
      id: "teachers",
      label: "Teachers",
      icon: <GraduationCap className="w-5 h-5" />,
      badge: stats.totalTeachers,
    },
    {
      id: "submissions",
      label: "Submissions",
      icon: <FileCode className="w-5 h-5" />,
      badge: stats.totalSubmissions,
    },
    {
      id: "storage",
      label: "Storage",
      icon: <Database className="w-5 h-5" />,
      badge: supabaseStats.totalFiles,
    },
    {
      id: "lessons",
      label: "Lessons",
      icon: <BookOpen className="w-5 h-5" />,
      badge: lessons.length,
    },
    {
      id: "activity",
      label: "Activity",
      icon: <Activity className="w-5 h-5" />,
      badge: activityLogs.length,
    },
  ];

  useEffect(() => {
    if (selectedView === "storage") {
      refreshSupabaseData();
    }
  }, [selectedView]);

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${currentTheme.background}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className={`${currentTheme.text}`}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdminVerified) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${currentTheme.background}`}>
        <div className="text-center max-w-md p-8 rounded-2xl border backdrop-blur-xl">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className={`mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Administrator privileges required to access this panel.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2 mx-auto"
          >
            <Home className="w-5 h-5" /> Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background} ${currentTheme.text} pt-24 pb-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <span>Admin Dashboard</span>
            </h1>
            <p className={`mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Welcome back, {userData?.fullName || "Administrator"}!
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadAllData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                theme === "dark" ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
              } transition-colors`}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedView(item.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  selectedView === item.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    : theme === "dark"
                    ? "bg-white/5 hover:bg-white/10"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      selectedView === item.id
                        ? "bg-white/20 text-white"
                        : theme === "dark"
                        ? "bg-white/10"
                        : "bg-gray-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================ */}
        {/* OVERVIEW VIEW */}
        {/* ============================================ */}
        {selectedView === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color}/20 flex items-center justify-center`}
                    >
                      {stat.icon}
                    </div>
                    <span
                      className={`text-sm px-2 py-1 rounded-lg ${
                        stat.change.includes("+")
                          ? "bg-green-500/20 text-green-500"
                          : stat.change.includes("Requires")
                          ? "bg-amber-500/20 text-amber-500"
                          : theme === "dark"
                          ? "bg-white/10"
                          : "bg-gray-100"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {stat.title}
                  </div>
                  <div className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    {stat.description}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-5 h-5" /> User Distribution
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Students",
                    value: stats.totalStudents,
                    color: "from-blue-500 to-cyan-500",
                    percent: stats.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0,
                  },
                  {
                    label: "Teachers",
                    value: stats.totalTeachers,
                    color: "from-purple-500 to-pink-500",
                    percent: stats.totalUsers > 0 ? (stats.totalTeachers / stats.totalUsers) * 100 : 0,
                  },
                  {
                    label: "Admins",
                    value: stats.totalAdmins,
                    color: "from-green-500 to-emerald-500",
                    percent: stats.totalUsers > 0 ? (stats.totalAdmins / stats.totalUsers) * 100 : 0,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
                        {item.label}
                      </span>
                      <span className="font-medium">
                        {item.value} ({item.percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                      }`}
                    >
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5" /> Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setSelectedView("teachers")}
                  disabled={pendingTeachers.length === 0}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    pendingTeachers.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-[1.02]"
                  } ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <UserCheck className="w-6 h-6 text-green-500 mb-2" />
                  <div className="font-medium">Approve Teachers</div>
                  <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {pendingTeachers.length} pending
                  </div>
                </button>

                <button
                  onClick={() => setSelectedView("storage")}
                  className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Database className="w-6 h-6 text-blue-500 mb-2" />
                  <div className="font-medium">Manage Storage</div>
                  <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {supabaseStats.totalFiles} files
                  </div>
                </button>

                <button
                  onClick={() => setSelectedView("lessons")}
                  className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
                  <div className="font-medium">Manage Lessons</div>
                  <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {lessons.length} lessons
                  </div>
                </button>

                <button
                  onClick={() => setSelectedView("activity")}
                  className={`p-4 rounded-xl border text-left hover:scale-[1.02] transition-all ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Activity className="w-6 h-6 text-purple-500 mb-2" />
                  <div className="font-medium">View Activity</div>
                  <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {activityLogs.length} logs
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* USERS VIEW */}
        {/* ============================================ */}
        {selectedView === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  {filteredUsers.length} users found
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                      theme === "dark"
                        ? "bg-white/5 border-white/10"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Administrators</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <div key={user.id} className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user.role === "student"
                          ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20"
                          : user.role === "teacher"
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                          : "bg-gradient-to-r from-green-500/20 to-emerald-500/20"
                      }`}
                    >
                      {user.role === "student" ? (
                        <GraduationCap className="w-6 h-6 text-blue-400" />
                      ) : user.role === "teacher" ? (
                        <Users className="w-6 h-6 text-purple-400" />
                      ) : (
                        <Shield className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{user.fullName}</h4>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                        Role:
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-green-500/20 text-green-500"
                            : user.role === "teacher"
                            ? "bg-blue-500/20 text-blue-500"
                            : "bg-purple-500/20 text-purple-500"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                        Status:
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-500/20 text-green-500"
                            : user.status === "pending"
                            ? "bg-amber-500/20 text-amber-500"
                            : user.status === "suspended"
                            ? "bg-red-500/20 text-red-500"
                            : "bg-gray-500/20 text-gray-500"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                        Institution:
                      </span>
                      <span className="text-right">{user.institution}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.status)}
                      disabled={user.id === currentUser?.uid}
                      className={`flex-1 py-2 rounded-lg text-sm ${
                        user.status === "active"
                          ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30"
                          : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30"
                      } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {user.status === "active" ? "Suspend" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.fullName)}
                      disabled={user.id === currentUser?.uid}
                      className={`flex-1 py-2 rounded-lg text-sm bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TEACHERS VIEW */}
        {/* ============================================ */}
        {selectedView === "teachers" && (
          <div className="space-y-8">
            {pendingTeachers.length > 0 && (
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-amber-500" /> Pending Approval
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className={`p-6 rounded-xl border ${
                        theme === "dark"
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-bold">{teacher.fullName}</div>
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {teacher.email}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          <Building className="w-4 h-4 inline mr-2" /> {teacher.institution}
                        </div>
                        {teacher.specialty && (
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            <Award className="w-4 h-4 inline mr-2" /> {teacher.specialty}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approveTeacher(teacher.id)}
                          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => rejectTeacher(teacher.id)}
                          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" /> All Teachers ({stats.totalTeachers})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users
                  .filter((u) => u.role === "teacher")
                  .map((teacher) => (
                    <div
                      key={teacher.id}
                      className={`p-6 rounded-xl border ${
                        theme === "dark"
                          ? "bg-white/5 border-white/10"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="font-bold">{teacher.fullName}</div>
                            <div
                              className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            teacher.status === "active"
                              ? "bg-green-500/20 text-green-500"
                              : teacher.status === "pending"
                              ? "bg-amber-500/20 text-amber-500"
                              : teacher.status === "suspended"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          <Building className="w-4 h-4 inline mr-2" /> {teacher.institution}
                        </div>
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          Last login:{" "}
                          {teacher.lastLogin
                            ? new Date(teacher.lastLogin).toLocaleDateString()
                            : "Never"}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleUserStatus(teacher.id, teacher.status)}
                        disabled={teacher.id === currentUser?.uid}
                        className={`w-full py-2 rounded-lg text-sm ${
                          teacher.status === "active"
                            ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30"
                            : "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30"
                        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {teacher.status === "active" ? "Suspend Teacher" : "Activate Teacher"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* SUBMISSIONS VIEW */}
        {/* ============================================ */}
        {selectedView === "submissions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Code Submissions</h2>
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  {filteredCodes.length} submissions found
                </p>
              </div>

              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {prologCodes.filter((c) => c.status === "success").length}
                </div>
                <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Successful</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold text-red-500 mb-2">
                  {prologCodes.filter((c) => c.status === "error").length}
                </div>
                <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Errors</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold text-amber-500 mb-2">
                  {prologCodes.filter((c) => c.status === "pending").length}
                </div>
                <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Pending</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCodes.map((code) => (
                <div key={code.id} className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold mb-1">{code.title}</h4>
                      <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        <Users className="w-4 h-4 inline mr-1" /> {code.username}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        code.status === "success"
                          ? "bg-green-500/20 text-green-500"
                          : code.status === "error"
                          ? "bg-red-500/20 text-red-500"
                          : "bg-amber-500/20 text-amber-500"
                      }`}
                    >
                      {code.status}
                    </span>
                  </div>

                  <div
                    className={`mb-4 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-32 ${
                      theme === "dark" ? "bg-black/30" : "bg-gray-100"
                    }`}
                  >
                    <pre className="whitespace-pre-wrap break-words">
                      {code.code.substring(0, 150)}...
                    </pre>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                      {new Date(code.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openFileModal(code)}
                        className={`p-2 rounded-lg ${
                          theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"
                        } transition-colors`}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => viewCodeInNewTab(code)}
                        className={`p-2 rounded-lg ${
                          theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"
                        } transition-colors`}
                        title="Open in New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code.code);
                          addActivityLog({
                            action: "Code copied to clipboard",
                            actionType: "code_copied",
                            target: code.title,
                            details: `Copied code "${code.title}" to clipboard`,
                          });
                        }}
                        className={`p-2 rounded-lg ${
                          theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"
                        } transition-colors`}
                        title="Copy Code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* STORAGE VIEW */}
        {/* ============================================ */}
        {selectedView === "storage" && (
          <div className="space-y-8">
            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FolderPlus className="w-5 h-5" /> Create New Folder
              </h3>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                />
                <button
                  onClick={createSupabaseFolder}
                  disabled={!newFolderName.trim()}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-2" /> Create
                </button>
              </div>
              <button
                onClick={refreshSupabaseData}
                className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 ${
                  theme === "dark"
                    ? "bg-white/5 hover:bg-white/10"
                    : "bg-gray-100 hover:bg-gray-200"
                } transition-colors`}
              >
                <RefreshCw className="w-4 h-4" /> Refresh Storage Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold mb-2">{supabaseStats.totalFolders}</div>
                <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Folders</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold mb-2">{supabaseStats.totalFiles}</div>
                <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Files</div>
              </div>
              <div className={`rounded-2xl p-6 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <div className="text-3xl font-bold mb-2">{supabaseStats.storageUsed}</div>
                <div className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Storage Used</div>
              </div>
            </div>

            <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Folders ({supabaseFolders.length})
                  {selectedFolder && (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-purple-400">{selectedFolder}</span>
                    </>
                  )}
                </h3>
                {selectedFolder && (
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      theme === "dark"
                        ? "bg-white/10 hover:bg-white/20"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Back to All Folders
                  </button>
                )}
              </div>

              {selectedFolder ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {folderFiles.length} files in this folder
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          downloadFile(`${selectedFolder}/all-files.zip`, `${selectedFolder}.zip`)
                        }
                        className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                          theme === "dark"
                            ? "bg-blue-500/20 hover:bg-blue-500/30"
                            : "bg-blue-100 hover:bg-blue-200"
                        } text-blue-500`}
                      >
                        <Download className="w-3 h-3" /> Download All
                      </button>
                    </div>
                  </div>

                  {folderFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {folderFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border ${
                            theme === "dark"
                              ? "bg-white/5 border-white/10 hover:bg-white/10"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          } transition-colors`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                file.name.endsWith(".pl")
                                  ? "bg-purple-500/20 text-purple-400"
                                  : file.name.endsWith(".txt")
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              <File className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate" title={file.name}>
                                {file.name}
                              </div>
                              <div
                                className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                              >
                                {(file.size / 1024).toFixed(2)} KB •{" "}
                                {new Date(file.created_at).toLocaleDateString()}
                              </div>
                              {file.metadata?.mimetype && (
                                <div
                                  className={`text-xs ${
                                    theme === "dark" ? "text-gray-500" : "text-gray-500"
                                  }`}
                                >
                                  {file.metadata.mimetype}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => viewFileContent(file)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-500 hover:from-blue-500/30 hover:to-cyan-500/30 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => downloadFile(file.fullPath, file.name)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteFileInFolder(file.name)}
                              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-500 hover:from-red-500/30 hover:to-pink-500/30 transition-colors text-sm flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                        No files found in this folder
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supabaseFolders.map((folder, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        theme === "dark"
                          ? "bg-white/5 border-white/10 hover:bg-white/10"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      } transition-colors`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                          <Folder className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{folder.name}</div>
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {folder.fileCount} files • {(folder.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => viewFolderFiles(folder.name)}
                          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-500 hover:from-blue-500/30 hover:to-cyan-500/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" /> View Files ({folder.fileCount})
                        </button>
                        {folder.lastModified && (
                          <div
                            className={`text-xs text-center ${
                              theme === "dark" ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            Updated: {new Date(folder.lastModified).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!selectedFolder && (
              <div className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <File className="w-5 h-5" /> Root Files
                </h3>
                {supabaseFiles.filter((f) => f.folder === "root").length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supabaseFiles
                      .filter((f) => f.folder === "root")
                      .map((file, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border ${
                            theme === "dark"
                              ? "bg-white/5 border-white/10 hover:bg-white/10"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          } transition-colors`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <File className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium truncate">{file.name}</div>
                              <div
                                className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                              >
                                {(file.size / 1024).toFixed(2)} KB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadFile(file.fullPath, file.name)}
                            className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 hover:from-green-500/30 hover:to-emerald-500/30 transition-colors text-sm"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                      No files in root directory
                    </p>
                  </div>
                )}
              </div>
            )}

            {bucketResult && (
              <div
                className={`rounded-xl p-4 ${
                  bucketResult.includes("✅")
                    ? theme === "dark"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-green-100 text-green-700"
                    : theme === "dark"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{bucketResult}</span>
                  <button onClick={() => setBucketResult("")}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* LESSONS VIEW */}
        {/* ============================================ */}
        {selectedView === "lessons" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" /> Lesson Management
                </h2>
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  {filteredLessons.length} lessons found
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={lessonSearchQuery}
                    onChange={(e) => setLessonSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                      theme === "dark"
                        ? "bg-white/5 border-white/10"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <select
                  value={lessonTypeFilter}
                  onChange={(e) => setLessonTypeFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="all">All Types</option>
                  <option value="text">Text</option>
                  <option value="video">Video</option>
                  <option value="puzzle">Puzzle</option>
                  <option value="extra">Extra</option>
                </select>

                <button
                  onClick={() => {
                    resetLessonForm();
                    setShowLessonModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> New Lesson
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Import from Word
                </button>
              </div>
            </div>

            {mainLessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mainLessons.map((lesson) => {
                  const enTranslation = lesson.translations.find((t) => t.language === "en");
                  const bgTranslation = lesson.translations.find((t) => t.language === "bg");
                  const subLessons = filteredLessons.filter(
                    (l) =>
                      l.lesson_number === lesson.lesson_number &&
                      l.sublesson_number &&
                      l.sublesson_number > 0
                  );

                  return (
                    <div key={lesson.id} className={`rounded-2xl p-6 border backdrop-blur-xl ${currentTheme.card}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                lesson.type === "video"
                                  ? "bg-red-500/20 text-red-500"
                                  : lesson.type === "text"
                                  ? "bg-blue-500/20 text-blue-500"
                                  : lesson.type === "puzzle"
                                  ? "bg-amber-500/20 text-amber-500"
                                  : "bg-purple-500/20 text-purple-500"
                              }`}
                            >
                              {lesson.type}
                            </span>
                            <span
                              className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}
                            >
                              #{lesson.lesson_number}
                              {subLessons.length > 0 && (
                                <span className="ml-1 text-purple-400">
                                  ({subLessons.length} sub-pages)
                                </span>
                              )}
                            </span>
                          </div>
                          <h4 className="font-bold text-lg">
                            {enTranslation?.title || lesson.slug}
                          </h4>
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            slug: {lesson.slug}
                          </div>
                          {bgTranslation?.title && (
                            <div className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                              🇧🇬 {bgTranslation.title}
                            </div>
                          )}
                          {enTranslation?.tags && enTranslation.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {enTranslation.tags.slice(0, 3).map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {enTranslation.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{enTranslation.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          {enTranslation?.image_url && (
                            <div className="mt-2">
                              <img
                                src={enTranslation.image_url}
                                alt={enTranslation.title}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => editLesson(lesson)}
                            className={`p-2 rounded-lg ${
                              theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"
                            } transition-colors`}
                            title="Edit"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLesson(lesson)}
                            className={`p-2 rounded-lg ${
                              theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-200"
                            } transition-colors text-red-500`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div
                        className={`mb-4 p-3 rounded-lg text-sm ${
                          theme === "dark" ? "bg-black/30" : "bg-gray-100"
                        }`}
                      >
                        <div className="line-clamp-3">
                          {enTranslation?.content?.substring(0, 150) || "No content"}...
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className={theme === "dark" ? "text-gray-500" : "text-gray-500"}>
                          Order: {lesson.order_index}
                          {subLessons.length > 0 && (
                            <span className="ml-2 text-purple-400">
                              {subLessons.length} sub-pages
                            </span>
                          )}
                        </div>
                        <div className={theme === "dark" ? "text-gray-500" : "text-gray-500"}>
                          {new Date(lesson.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-2xl p-12 border backdrop-blur-xl text-center ${currentTheme.card}`}>
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-xl font-bold mb-2">No Lessons Found</h3>
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  Create your first lesson by clicking the "New Lesson" button above.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* LESSON MODAL */}
        {/* ============================================ */}
        {showLessonModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className={`rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col ${currentTheme.card}`}>
              <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-inherit z-10">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                    {editingLesson ? "Edit Lesson" : "Create New Lesson"}
                  </h3>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {editingLesson ? `Editing: ${editingLesson.slug}` : "Fill in the lesson details below"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLessonModal(false);
                    resetLessonForm();
                    setFormErrors({});
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div
                  className={`rounded-xl border ${
                    theme === "dark" ? "border-white/10" : "border-gray-200"
                  } overflow-hidden`}
                >
                  <button
                    onClick={() => toggleSection("basic")}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="font-medium">Basic Settings</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          theme === "dark" ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        Required
                      </span>
                    </div>
                    {expandedSections.basic ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedSections.basic && (
                    <div className="p-4 pt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Slug (URL identifier) *
                          </label>
                          <input
                            type="text"
                            value={lessonFormData.slug}
                            onChange={(e) => {
                              setLessonFormData((prev) => ({ ...prev, slug: e.target.value }));
                              if (formErrors.slug)
                                setFormErrors((prev) => ({ ...prev, slug: undefined }));
                            }}
                            placeholder="e.g., introduction-to-facts"
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                              formErrors.slug ? "border-red-500" : ""
                            } ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-300"}`}
                          />
                          {formErrors.slug && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.slug}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Lesson Type *
                          </label>
                          <select
                            value={lessonFormData.type}
                            onChange={(e) =>
                              setLessonFormData((prev) => ({
                                ...prev,
                                type: e.target.value as any,
                              }))
                            }
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                              theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-gray-900"
                            }`}
                          >
                            <option value="text" className={theme === "dark" ? "bg-gray-700 text-white" : ""}>
                              📝 Text
                            </option>
                            <option value="video" className={theme === "dark" ? "bg-gray-700 text-white" : ""}>
                              🎬 Video
                            </option>
                            <option value="puzzle" className={theme === "dark" ? "bg-gray-700 text-white" : ""}>
                              🧩 Puzzle
                            </option>
                            <option value="extra" className={theme === "dark" ? "bg-gray-700 text-white" : ""}>
                              ⭐ Extra
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Lesson Number *
                          </label>
                          <input
                            type="number"
                            value={lessonFormData.lessonNumber}
                            onChange={(e) =>
                              setLessonFormData((prev) => ({
                                ...prev,
                                lessonNumber: parseInt(e.target.value) || 1,
                              }))
                            }
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                              theme === "dark"
                                ? "bg-white/5 border-white/10"
                                : "bg-white border-gray-300"
                            }`}
                          />
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Sub-Lesson Number
                          </label>
                          <input
                            type="number"
                            value={lessonFormData.sublessonNumber || ""}
                            onChange={(e) =>
                              setLessonFormData((prev) => ({
                                ...prev,
                                sublessonNumber: e.target.value ? parseInt(e.target.value) : undefined,
                              }))
                            }
                            placeholder="Optional"
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                              theme === "dark"
                                ? "bg-white/5 border-white/10"
                                : "bg-white border-gray-300"
                            }`}
                          />
                          <p
                            className={`text-xs mt-1 ${
                              theme === "dark" ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            Use 1, 2, 3... for sub-pages
                          </p>
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Order Index *
                          </label>
                          <input
                            type="number"
                            value={lessonFormData.orderIndex}
                            onChange={(e) =>
                              setLessonFormData((prev) => ({
                                ...prev,
                                orderIndex: parseInt(e.target.value) || 0,
                              }))
                            }
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                              theme === "dark"
                                ? "bg-white/5 border-white/10"
                                : "bg-white border-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl border ${
                    theme === "dark" ? "border-white/10" : "border-gray-200"
                  } overflow-hidden`}
                >
                  <button
                    onClick={() => toggleSection("content")}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="font-medium">Content</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          theme === "dark" ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        Required
                      </span>
                    </div>
                    {expandedSections.content ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedSections.content && (
                    <div className="p-4 pt-0">
                      <div className="flex gap-2 border-b mb-4">
                        {(["en", "bg", "es"] as const).map((lang) => {
                          const status = getLanguageStatus(lang);
                          const isActive = activeLanguageTab === lang;
                          const isComplete = status.filled === status.total;

                          return (
                            <button
                              key={lang}
                              onClick={() => setActiveLanguageTab(lang)}
                              className={`px-4 py-2.5 font-medium transition-all flex items-center gap-2 ${
                                isActive
                                  ? "border-b-2 border-purple-500 text-purple-500"
                                  : theme === "dark"
                                  ? "text-gray-400 hover:text-white"
                                  : "text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <span>{languageFlags[lang]}</span>
                              <span>{languageNames[lang]}</span>
                              {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {lang === "en" && <span className="text-red-500 text-xs">*</span>}
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Title {activeLanguageTab === "en" && "*"}
                          </label>
                          <input
                            type="text"
                            value={lessonFormData.translations[activeLanguageTab].title}
                            onChange={(e) => {
                              setLessonFormData((prev) => ({
                                ...prev,
                                translations: {
                                  ...prev.translations,
                                  [activeLanguageTab]: {
                                    ...prev.translations[activeLanguageTab],
                                    title: e.target.value,
                                  },
                                },
                              }));
                              if (formErrors.title && activeLanguageTab === "en") {
                                setFormErrors((prev) => ({ ...prev, title: undefined }));
                              }
                            }}
                            placeholder={`Title (${activeLanguageTab})`}
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                              formErrors.title && activeLanguageTab === "en" ? "border-red-500" : ""
                            } ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-300"}`}
                          />
                          {formErrors.title && activeLanguageTab === "en" && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.title}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Description
                          </label>
                          <input
                            type="text"
                            value={lessonFormData.translations[activeLanguageTab].description || ""}
                            onChange={(e) =>
                              setLessonFormData((prev) => ({
                                ...prev,
                                translations: {
                                  ...prev.translations,
                                  [activeLanguageTab]: {
                                    ...prev.translations[activeLanguageTab],
                                    description: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="Brief description (optional)"
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                              theme === "dark"
                                ? "bg-white/5 border-white/10"
                                : "bg-white border-gray-300"
                            }`}
                          />
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Content (Markdown) {activeLanguageTab === "en" && "*"}
                          </label>
                          <textarea
                            value={lessonFormData.translations[activeLanguageTab].content}
                            onChange={(e) => {
                              setLessonFormData((prev) => ({
                                ...prev,
                                translations: {
                                  ...prev.translations,
                                  [activeLanguageTab]: {
                                    ...prev.translations[activeLanguageTab],
                                    content: e.target.value,
                                  },
                                },
                              }));
                              if (formErrors.content && activeLanguageTab === "en") {
                                setFormErrors((prev) => ({ ...prev, content: undefined }));
                              }
                            }}
                            placeholder={`Write your lesson content in Markdown (${activeLanguageTab})`}
                            rows={8}
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm ${
                              formErrors.content && activeLanguageTab === "en" ? "border-red-500" : ""
                            } ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-gray-300"}`}
                          />
                          {formErrors.content && activeLanguageTab === "en" && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors.content}
                            </p>
                          )}
                          <p
                            className={`text-xs mt-1 ${
                              theme === "dark" ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            Supports Markdown formatting. Images can be added via the Media section below.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl border ${
                    theme === "dark" ? "border-white/10" : "border-gray-200"
                  } overflow-hidden`}
                >
                  <button
                    onClick={() => toggleSection("media")}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Image className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="font-medium">Media</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          theme === "dark" ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        Optional
                      </span>
                    </div>
                    {expandedSections.media ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedSections.media && (
                    <div className="p-4 pt-0 space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <Image className="w-4 h-4 inline mr-1" /> Image
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            id={`image-upload-${activeLanguageTab}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadLessonImage(file, activeLanguageTab);
                              }
                              e.target.value = "";
                            }}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                          <label
                            htmlFor={`image-upload-${activeLanguageTab}`}
                            className={`px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-all ${
                              uploadingImage && uploadingForLanguage === activeLanguageTab
                                ? "bg-gray-500 cursor-not-allowed opacity-50"
                                : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg text-white"
                            }`}
                          >
                            {uploadingImage && uploadingForLanguage === activeLanguageTab ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                {uploadProgress}%
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Upload Image
                              </>
                            )}
                          </label>
                          {lessonFormData.translations[activeLanguageTab].imageUrl && (
                            <div className="flex items-center gap-2">
                              <img
                                src={lessonFormData.translations[activeLanguageTab].imageUrl}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                              <button
                                onClick={() => {
                                  setLessonFormData((prev) => ({
                                    ...prev,
                                    translations: {
                                      ...prev.translations,
                                      [activeLanguageTab]: {
                                        ...prev.translations[activeLanguageTab],
                                        imageUrl: "",
                                      },
                                    },
                                  }));
                                }}
                                className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-500/10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {!lessonFormData.translations[activeLanguageTab].imageUrl && (
                            <input
                              type="text"
                              value={lessonFormData.translations[activeLanguageTab].imageUrl || ""}
                              onChange={(e) =>
                                setLessonFormData((prev) => ({
                                  ...prev,
                                  translations: {
                                    ...prev.translations,
                                    [activeLanguageTab]: {
                                      ...prev.translations[activeLanguageTab],
                                      imageUrl: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="Or enter image URL"
                              className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm ${
                                theme === "dark"
                                  ? "bg-white/5 border-white/10"
                                  : "bg-white border-gray-300"
                              }`}
                            />
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          <Video className="w-4 h-4 inline mr-1" /> Video
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            accept="video/*"
                            id={`video-upload-${activeLanguageTab}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                uploadLessonVideo(file, activeLanguageTab);
                              }
                              e.target.value = "";
                            }}
                            className="hidden"
                            disabled={uploadingVideo}
                          />
                          <label
                            htmlFor={`video-upload-${activeLanguageTab}`}
                            className={`px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-sm transition-all ${
                              uploadingVideo && uploadingVideoForLanguage === activeLanguageTab
                                ? "bg-gray-500 cursor-not-allowed opacity-50"
                                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg text-white"
                            }`}
                          >
                            {uploadingVideo && uploadingVideoForLanguage === activeLanguageTab ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                {videoUploadProgress}%
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Upload Video
                              </>
                            )}
                          </label>
                          {lessonFormData.translations[activeLanguageTab].videoUrl && (
                            <div className="flex items-center gap-2 flex-1">
                              <span
                                className={`text-sm truncate ${
                                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {lessonFormData.translations[activeLanguageTab].videoUrl}
                              </span>
                              <button
                                onClick={() => {
                                  setLessonFormData((prev) => ({
                                    ...prev,
                                    translations: {
                                      ...prev.translations,
                                      [activeLanguageTab]: {
                                        ...prev.translations[activeLanguageTab],
                                        videoUrl: "",
                                      },
                                    },
                                  }));
                                }}
                                className="text-red-500 hover:text-red-600 p-1 rounded-lg hover:bg-red-500/10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {!lessonFormData.translations[activeLanguageTab].videoUrl && (
                            <input
                              type="text"
                              value={lessonFormData.translations[activeLanguageTab].videoUrl || ""}
                              onChange={(e) =>
                                setLessonFormData((prev) => ({
                                  ...prev,
                                  translations: {
                                    ...prev.translations,
                                    [activeLanguageTab]: {
                                      ...prev.translations[activeLanguageTab],
                                      videoUrl: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="Or enter video URL (YouTube, Vimeo, etc.)"
                              className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm ${
                                theme === "dark"
                                  ? "bg-white/5 border-white/10"
                                  : "bg-white border-gray-300"
                              }`}
                            />
                          )}
                        </div>
                        <input
                          type="text"
                          value={lessonFormData.translations[activeLanguageTab].duration || ""}
                          onChange={(e) =>
                            setLessonFormData((prev) => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                [activeLanguageTab]: {
                                  ...prev.translations[activeLanguageTab],
                                  duration: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="Duration e.g. 5:30"
                          className={`w-full mt-2 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm ${
                            theme === "dark"
                              ? "bg-white/5 border-white/10"
                              : "bg-white border-gray-300"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`rounded-xl border ${
                    theme === "dark" ? "border-white/10" : "border-gray-200"
                  } overflow-hidden`}
                >
                  <button
                    onClick={() => toggleSection("advanced")}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="font-medium">Advanced</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          theme === "dark" ? "bg-white/10" : "bg-gray-100"
                        }`}
                      >
                        Optional
                      </span>
                    </div>
                    {expandedSections.advanced ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedSections.advanced && (
                    <div className="p-4 pt-0 space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Tags
                        </label>
                        <input
                          type="text"
                          value={lessonFormData.translations[activeLanguageTab].tags?.join(", ") || ""}
                          onChange={(e) =>
                            setLessonFormData((prev) => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                [activeLanguageTab]: {
                                  ...prev.translations[activeLanguageTab],
                                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                                },
                              },
                            }))
                          }
                          placeholder="e.g. facts, basics, recursion"
                          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                            theme === "dark"
                              ? "bg-white/5 border-white/10"
                              : "bg-white border-gray-300"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Example Code
                          </label>
                          <textarea
                            value={lessonFormData.translations[activeLanguageTab].exampleCode || ""}
                            onChange={(e) =>
                              setLessonFormData((prev) => ({
                                ...prev,
                                translations: {
                                  ...prev.translations,
                                  [activeLanguageTab]: {
                                    ...prev.translations[activeLanguageTab],
                                    exampleCode: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="Prolog code example"
                            rows={4}
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm ${
                              theme === "dark"
                                ? "bg-gray-900 border-gray-700 text-gray-100"
                                : "bg-gray-900 border-gray-700 text-gray-100"
                            }`}
                          />
                        </div>
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Expected Output
                          </label>
                          <textarea
                            value={lessonFormData.translations[activeLanguageTab].exampleOutput || ""}
                            onChange={(e) =>
                              setLessonFormData((prev) => ({
                                ...prev,
                                translations: {
                                  ...prev.translations,
                                  [activeLanguageTab]: {
                                    ...prev.translations[activeLanguageTab],
                                    exampleOutput: e.target.value,
                                  },
                                },
                              }))
                            }
                            placeholder="Expected output"
                            rows={4}
                            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm ${
                              theme === "dark"
                                ? "bg-gray-900 border-gray-700 text-gray-100"
                                : "bg-gray-900 border-gray-700 text-gray-100"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t flex justify-between items-center sticky bottom-0 bg-inherit">
                <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {editingLesson ? "Updating existing lesson" : "Creating new lesson"}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowLessonModal(false);
                      resetLessonForm();
                      setFormErrors({});
                    }}
                    className="px-6 py-2 rounded-lg border hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveLesson}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-shadow"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {editingLesson ? "Update Lesson" : "Create Lesson"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODAL FOR WORD IMPORT (НОВ) */}
        {/* ============================================ */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ${currentTheme.card}`}>
              <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-inherit z-10">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Upload className="w-6 h-6 text-indigo-400" />
                    Import Lessons from Word
                  </h3>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Upload a .docx file with structured headings (Title, Heading 1, Heading 2, Normal, Caption)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedDocxFile(null);
                    setParsedLessons([]);
                    setImportResult("");
                    setCourseTitle("");
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {!parsedLessons.length ? (
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Choose .docx file
                      </label>
                      <input
                        type="file"
                        accept=".docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedDocxFile(file);
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Target Language
                      </label>
                      <select
                        value={importLanguage}
                        onChange={(e) => setImportLanguage(e.target.value as "en" | "bg" | "es")}
                        className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="en">English</option>
                        <option value="bg">Български</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <button
                      onClick={async () => {
                        if (!selectedDocxFile) {
                          setImportResult("❌ Please select a file.");
                          return;
                        }
                        setImportLoading(true);
                        setImportResult("");
                        try {
                          const { courseTitle, elements } = await parseDocxFileAdvanced(selectedDocxFile);
                          setCourseTitle(courseTitle);
                          const lessons = buildLessonsFromElementsAdvanced(elements);
                          setParsedLessons(lessons);
                          const totalSubs = lessons.reduce((acc: number, m: any) => acc + m.sublessons.length, 0);
                          setImportResult(`✅ Parsed ${lessons.length} main sections and ${totalSubs} sublessons.`);
                        } catch (error: any) {
                          setImportResult(`❌ Error parsing file: ${error.message}`);
                        } finally {
                          setImportLoading(false);
                        }
                      }}
                      disabled={!selectedDocxFile || importLoading}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {importLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {importLoading ? "Parsing..." : "Parse & Preview"}
                    </button>
                    {importResult && (
                      <div
                        className={`p-3 rounded-lg ${
                          importResult.includes("✅")
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {importResult}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className={`p-4 rounded-xl border ${currentTheme.card}`}>
                      <h4 className={`font-bold text-lg ${currentTheme.text}`}>
                        Course: {courseTitle || "(untitled)"}
                      </h4>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        Total main lessons: {parsedLessons.length}
                      </p>
                    </div>

                    {parsedLessons.map((main, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${currentTheme.card}`}>
                        <h5 className={`font-bold ${currentTheme.text}`}>
                          {main.lesson_number}. {main.title}
                        </h5>
                        <ul className="mt-2 space-y-1">
                          {main.sublessons.map((sub: any, sidx: number) => (
                            <li
                              key={sidx}
                              className={`text-sm flex items-start gap-2 ${currentTheme.textSecondary}`}
                            >
                              <span className="font-mono">
                                {main.lesson_number}.{sub.sublesson_number}
                              </span>
                              <span>{sub.title}</span>
                              {sub.images.length > 0 && (
                                <span className="text-xs text-purple-500">
                                  ({sub.images.length} image{sub.images.length > 1 ? "s" : ""})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-xs text-gray-400 truncate max-w-full">
                          {main.sublessons.map((s: any) => s.content).join(" ").substring(0, 150)}...
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setParsedLessons([]);
                          setCourseTitle("");
                          setImportResult("");
                        }}
                        className="px-6 py-2 rounded-lg border hover:bg-white/5 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {
                          setImportLoading(true);
                          setImportResult("Saving...");
                          try {
                            // ПРЕДАВАМЕ И courseTitle
                            await saveImportedLessons(parsedLessons, importLanguage, courseTitle);
                            setImportResult("✅ Lessons imported successfully!");
                            await loadAllData();
                            setShowImportModal(false);
                            setParsedLessons([]);
                            setSelectedDocxFile(null);
                            setCourseTitle("");
                          } catch (error: any) {
                            setImportResult(`❌ Error saving: ${error.message}`);
                          } finally {
                            setImportLoading(false);
                          }
                        }}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm & Save
                      </button>
                    </div>
                    {importResult && (
                      <div
                        className={`p-3 rounded-lg ${
                          importResult.includes("✅")
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {importResult}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ACTIVITY VIEW */}
        {/* ============================================ */}
        {selectedView === "activity" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6" /> Activity Logs
                </h2>
                <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                  {filteredActivityLogs.length} activities found
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                      theme === "dark"
                        ? "bg-white/5 border-white/10"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <option value="all">All Activities</option>
                  <option value="user">User Activities</option>
                  <option value="code">Code & Assignments</option>
                  <option value="file">Files & Storage</option>
                </select>

                <button
                  onClick={loadActivityLogs}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    theme === "dark"
                      ? "bg-white/5 hover:bg-white/10"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter((l) => l.actionType.includes("user")).length}
                    </div>
                    <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      User Activities
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Code className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter(
                        (l) =>
                          l.actionType.includes("code") ||
                          l.actionType.includes("assignment") ||
                          l.actionType.includes("lesson")
                      ).length}
                    </div>
                    <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Content Activities
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <File className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter(
                        (l) => l.actionType.includes("file") || l.actionType.includes("folder")
                      ).length}
                    </div>
                    <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      File Activities
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${currentTheme.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {activityLogs.filter((l) => l.actionType.includes("login")).length}
                    </div>
                    <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Logins
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border backdrop-blur-xl ${currentTheme.card}`}>
              <div className="divide-y">
                {filteredActivityLogs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          log.color === "green"
                            ? "bg-green-500/20 text-green-500"
                            : log.color === "red"
                            ? "bg-red-500/20 text-red-500"
                            : log.color === "blue"
                            ? "bg-blue-500/20 text-blue-500"
                            : log.color === "purple"
                            ? "bg-purple-500/20 text-purple-500"
                            : log.color === "cyan"
                            ? "bg-cyan-500/20 text-cyan-500"
                            : log.color === "indigo"
                            ? "bg-indigo-500/20 text-indigo-500"
                            : log.color === "amber"
                            ? "bg-amber-500/20 text-amber-500"
                            : "bg-gray-500/20 text-gray-500"
                        }`}
                      >
                        {log.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold">{log.action}</h4>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              <span className="font-medium">{log.user}</span> • {log.userEmail}
                            </p>
                          </div>
                          <div className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                            {log.timestamp.toLocaleDateString()}{" "}
                            {log.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <div className="mb-3">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              log.actionType.includes("user")
                                ? "bg-blue-500/20 text-blue-500"
                                : log.actionType.includes("code") ||
                                  log.actionType.includes("assignment") ||
                                  log.actionType.includes("lesson")
                                ? "bg-green-500/20 text-green-500"
                                : log.actionType.includes("file")
                                ? "bg-cyan-500/20 text-cyan-500"
                                : log.actionType.includes("login")
                                ? "bg-purple-500/20 text-purple-500"
                                : "bg-gray-500/20 text-gray-500"
                            }`}
                          >
                            {log.actionType.replace("_", " ").toUpperCase()}
                          </span>
                        </div>

                        <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}>
                          <div className="font-medium mb-1">{log.target}</div>
                          {log.details && (
                            <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredActivityLogs.length === 0 && (
                  <div className="p-8 text-center">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
                      No activities found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* FILE CONTENT MODAL */}
        {/* ============================================ */}
        {showFileContentModal && selectedSupabaseFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ${currentTheme.card}`}>
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedSupabaseFile.name}</h3>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Folder: {selectedSupabaseFile.folder} • Size:{" "}
                    {(selectedSupabaseFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => setShowFileContentModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <pre
                  className={`p-6 font-mono text-sm whitespace-pre-wrap ${
                    theme === "dark" ? "bg-black/30" : "bg-gray-100"
                  }`}
                >
                  {fileContent}
                </pre>
              </div>

              <div className="p-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => downloadFile(selectedSupabaseFile.fullPath, selectedSupabaseFile.name)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={() => setShowFileContentModal(false)}
                  className="px-4 py-2 rounded-lg border"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
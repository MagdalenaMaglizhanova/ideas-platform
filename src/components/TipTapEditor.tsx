// components/SimpleTipTapEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, Heading1, Heading2, Heading3, 
  List, ListOrdered, Link as LinkIcon, 
  Image as ImageIcon, Code, Quote, Undo, Redo 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SimpleTipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const SimpleTipTapEditor = ({ content, onChange, placeholder = 'Start writing...' }: SimpleTipTapEditorProps) => {
  const { theme } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4 ${
          theme === 'dark' 
            ? 'prose-invert bg-gray-800 text-white' 
            : 'bg-white text-gray-900'
        }`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${
      theme === 'dark' 
        ? 'border-gray-700 bg-gray-900' 
        : 'border-gray-300 bg-white'
    }`}>
      {/* Simple Toolbar */}
      <div className={`flex flex-wrap items-center gap-1 p-3 border-b ${
        theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
      }`}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive('bold') ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive('italic') ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded ${editor.isActive('link') ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={addImage}
          className={`p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded ${editor.isActive('codeBlock') ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-blue-500 text-white' : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        
        <div className="flex-1" />
        
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={`p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={`p-2 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      
      <EditorContent editor={editor} />
    </div>
  );
};

export default SimpleTipTapEditor;
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link2,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText().trim();
      console.log('TipTap content updated:', { html, text, textLength: text.length });
      onChange(html);
      
      // Force a re-render to ensure form validation updates
      setTimeout(() => {
        const event = new Event('input', { bubbles: true });
        editor.view.dom.dispatchEvent(event);
      }, 0);
    },
    onCreate: ({ editor }) => {
      console.log('TipTap editor created with content:', editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none p-4 min-h-[150px]',
      },
    },
  });

  // Sync content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      console.log('Syncing TipTap content:', content);
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Add additional event listeners to ensure form validation triggers
  React.useEffect(() => {
    if (editor) {
      const handleTransaction = () => {
        const html = editor.getHTML();
        const text = editor.getText().trim();
        console.log('TipTap transaction:', { html, text, textLength: text.length });
        onChange(html);
      };

      editor.on('transaction', handleTransaction);
      editor.on('blur', handleTransaction);
      editor.on('focus', handleTransaction);

      return () => {
        editor.off('transaction', handleTransaction);
        editor.off('blur', handleTransaction);
        editor.off('focus', handleTransaction);
      };
    }
  }, [editor, onChange]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter the URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <Button
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-testid="editor-button-bold"
        >
          <Bold className="w-4 h-4" />
        </Button>
        
        <Button
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-testid="editor-button-italic"
        >
          <Italic className="w-4 h-4" />
        </Button>
        
        <Button
          variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-testid="editor-button-strike"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
        
        <Button
          variant={editor.isActive('code') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          data-testid="editor-button-code"
        >
          <Code className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <Button
          variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-testid="editor-button-h1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-testid="editor-button-h2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        
        <Button
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-testid="editor-button-h3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-testid="editor-button-bullet-list"
        >
          <List className="w-4 h-4" />
        </Button>
        
        <Button
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-testid="editor-button-ordered-list"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        
        <Button
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-testid="editor-button-quote"
        >
          <Quote className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Links */}
        <Button
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={addLink}
          data-testid="editor-button-link"
        >
          <Link2 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          data-testid="editor-button-undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          data-testid="editor-button-redo"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="rich-text-editor">
        <EditorContent 
          editor={editor} 
          className="min-h-[150px] max-h-[400px] overflow-y-auto"
          data-testid="rich-text-editor-content"
        />
      </div>
    </div>
  );
}

//Tiptap.tsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';

//tiptap
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import './tiptap.css'

import { common, createLowlight } from 'lowlight';

interface TiptapProps {
  content: string;
  setEditor: (editor: Editor | null) => void;
}

const Tiptap = ({ content, setEditor }: TiptapProps) => {
  const lowlight = createLowlight(common);
  const editor = useEditor({
    editorProps: {
        attributes: {
          class: 'prose m-5 focus:outline-none',
        },
      },
    extensions: [
      StarterKit,
      Highlight,
      Image.configure({ inline: true, allowBase64: true }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: content,
  });

  useEffect(() => {
    setEditor(editor);
    return () => {
      setEditor(null);
    };
  }, [editor, setEditor]);

  useEffect(() => {
    if (content && editor) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);
  
  return (
    <div className="border-2">
      <EditorContent
        id="tiptap"
        editor={editor}
        onClick={() => editor?.commands.focus()}
      />
    </div>
  );
};

export default Tiptap;
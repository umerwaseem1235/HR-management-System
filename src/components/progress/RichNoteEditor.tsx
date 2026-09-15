'use client';

import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code2,
  Link2,
  Minus,
} from 'lucide-react';
import { QUICK_EMOJI, stripHtml } from './progress-utils';

/** Lightweight rich-text note editor — project-themed toolbar over a contentEditable area. */
export default function RichNoteEditor({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Uncontrolled after mount — React must not rewrite innerHTML on each
  // keystroke or the caret jumps. Remounted via key when switching entries.
  const initialHtml = useRef(value);

  const setRef = (el: HTMLDivElement | null) => {
    ref.current = el;
    if (el && !el.dataset.init) {
      el.innerHTML = initialHtml.current;
      el.dataset.init = '1';
    }
  };

  const emit = () => {
    onChange(ref.current?.innerHTML ?? '');
  };

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    try {
      document.execCommand(command, false, arg);
    } catch {
      // Unsupported command — ignore
    }
    emit();
  };

  const insertEmoji = (emoji: string) => {
    ref.current?.focus();
    try {
      document.execCommand('insertText', false, emoji);
    } catch {
      // Fallback: append
      onChange(`${value}${emoji}`);
    }
    emit();
  };

  const addLink = () => {
    const url = window.prompt('Enter link URL (https://…)');
    if (url && url.trim()) run('createLink', url.trim());
  };

  const toolBtn =
    'flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-[#EAF2F4] hover:text-[#024fa7] cursor-pointer';
  const divider = <span className="mx-0.5 h-5 w-px bg-[#D6E4E8]" />;

  return (
    <div>
      <div className={`overflow-hidden rounded-lg border bg-white transition-colors ${error ? 'border-red-500' : 'border-[#D6E4E8] focus-within:border-[#024fa7] focus-within:ring-2 focus-within:ring-[#024fa7]/20'}`}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[#D6E4E8] bg-[#F8FBFC] px-2 py-1.5">
          <button type="button" title="Bold" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('bold')}><Bold size={15} /></button>
          <button type="button" title="Italic" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('italic')}><Italic size={15} /></button>
          <button type="button" title="Underline" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('underline')}><Underline size={15} /></button>
          {divider}
          <button type="button" title="Bullet list" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertUnorderedList')}><List size={15} /></button>
          <button type="button" title="Numbered list" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertOrderedList')}><ListOrdered size={15} /></button>
          {divider}
          <button type="button" title="Heading 1" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'H1')}><Heading1 size={15} /></button>
          <button type="button" title="Heading 2" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'H2')}><Heading2 size={15} /></button>
          {divider}
          <button type="button" title="Quote" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'BLOCKQUOTE')}><Quote size={15} /></button>
          <button type="button" title="Code" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('formatBlock', 'PRE')}><Code2 size={15} /></button>
          <button type="button" title="Link" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={addLink}><Link2 size={15} /></button>
          <button type="button" title="Divider" className={toolBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => run('insertHorizontalRule')}><Minus size={15} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-1 border-b border-[#D6E4E8] bg-white px-3 py-1.5">
          {QUICK_EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              title={`Insert ${e}`}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => insertEmoji(e)}
              className="rounded-md px-1 py-0.5 text-base leading-none transition-transform hover:scale-125 cursor-pointer"
            >
              {e}
            </button>
          ))}
        </div>
        <div className="relative">
          <div
            ref={setRef}
            contentEditable
            suppressContentEditableWarning
            onInput={emit}
            onBlur={emit}
            className="min-h-[140px] px-4 py-3 text-sm leading-relaxed text-[#263238] outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#17324D] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#17324D] [&_blockquote]:border-l-2 [&_blockquote]:border-[#D6E4E8] [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_pre]:rounded-md [&_pre]:bg-[#EAF2F4] [&_pre]:px-2 [&_pre]:py-1 [&_pre]:text-xs [&_a]:text-[#024fa7] [&_a]:underline"
          />
          {!stripHtml(value) && placeholder && (
            <div className="pointer-events-none absolute left-4 top-3 select-none text-sm text-gray-400">
              {placeholder}
            </div>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

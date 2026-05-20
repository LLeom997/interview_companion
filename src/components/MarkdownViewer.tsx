import React, { useState } from 'react';
import { FileText, Copy, Check, Code, Terminal, FileCode, CheckSquare, Square } from 'lucide-react';

interface MarkdownViewerProps {
  markdown: string | null;
}

export function MarkdownViewer({ markdown }: MarkdownViewerProps) {
  if (!markdown) return null;

  const lines = markdown.split('\n');
  const renderedBlocks: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  let inReferencedDocuments = false;

  // Helper to parse inline formatting (bold, italic, inline code)
  const parseInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let keyIdx = 0;

    while (currentText.length > 0) {
      // Inline Code: `code`
      const codeMatch = currentText.match(/`([^`]+)`/);
      // Bold: **text**
      const boldMatch = currentText.match(/\*\*([^*]+)\*\*/);
      // Italic: *text*
      const italicMatch = currentText.match(/\*([^*]+)\*/);

      const matches = [
        { type: 'code', match: codeMatch },
        { type: 'bold', match: boldMatch },
        { type: 'italic', match: italicMatch },
      ].filter(m => m.match && m.match.index !== undefined);

      if (matches.length === 0) {
        parts.push(<span key={`txt-${keyIdx++}`}>{currentText}</span>);
        break;
      }

      // Sort by earliest match index
      matches.sort((a, b) => (a.match!.index! - b.match!.index!));
      const first = matches[0];
      const matchIndex = first.match!.index!;
      const matchLength = first.match![0].length;
      const matchedText = first.match![1];

      // Push preceding text
      if (matchIndex > 0) {
        parts.push(<span key={`txt-${keyIdx++}`}>{currentText.slice(0, matchIndex)}</span>);
      }

      // Push styled element
      if (first.type === 'code') {
        parts.push(
          <code key={`code-${keyIdx++}`} className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-400 font-mono text-[11px]">
            {matchedText}
          </code>
        );
      } else if (first.type === 'bold') {
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-extrabold text-emerald-400">
            {matchedText}
          </strong>
        );
      } else if (first.type === 'italic') {
        parts.push(
          <em key={`italic-${keyIdx++}`} className="italic text-zinc-300">
            {matchedText}
          </em>
        );
      }

      currentText = currentText.slice(matchIndex + matchLength);
    }

    return parts;
  };

  // Renders a fully functional, beautiful mock IDE file view
  const renderCodeBlock = (lang: string, lines: string[], key: number) => {
    let filename = '';
    let displayLines = [...lines];

    // Attempt to parse filename from first comment line (e.g. "// filename.ts" or "# filename.yaml")
    if (displayLines.length > 0) {
      const firstLine = displayLines[0].trim();
      const filenameMatch = firstLine.match(/^(?:\/\/|#|--|<!--|\/\*)\s*([\w\d\-_\.\/\\:\+]+)/);
      if (filenameMatch) {
        filename = filenameMatch[1];
        displayLines.shift(); // Remove comment line from displaying code
      }
    }

    const codeString = displayLines.join('\n');

    return (
      <CodeFileBlock
        key={`code-block-${key}`}
        filename={filename || `design-spec.${lang || 'txt'}`}
        language={lang || 'text'}
        code={codeString}
      />
    );
  };

  // Renders parsed table rows
  const renderTable = (headers: string[], rows: string[][], key: number) => {
    return (
      <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40 shadow-lg custom-scrollbar">
        <table className="w-full border-collapse text-left text-[11px] font-sans">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase font-bold tracking-widest text-zinc-400">
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-2.5 font-extrabold">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-emerald-500/2 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-zinc-300 leading-relaxed font-semibold">
                    {parseInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  let blockKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Block delimiters
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close current code block
        renderedBlocks.push(renderCodeBlock(codeLang, codeLines, blockKey++));
        codeLines = [];
        inCodeBlock = false;
      } else {
        // Open new code block
        codeLang = line.trim().slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Handle Table delimiters
    if (line.trim().startsWith('|')) {
      if (!inTable) {
        // Read headers
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableHeaders = cells;
        tableRows = [];
        inTable = true;

        // Skip separator line if next
        if (i + 1 < lines.length && lines[i + 1].trim().includes('|') && lines[i + 1].includes('-')) {
          i++; // Skip the separator row
        }
      } else {
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        // Ensure row alignment matches header columns count
        if (cells.length > 0) {
          tableRows.push(cells);
        }
      }
      continue;
    }

    if (inTable && !line.trim().startsWith('|')) {
      // Close active table and render it
      renderedBlocks.push(renderTable(tableHeaders, tableRows, blockKey++));
      inTable = false;
    }

    const trimmed = line.trim();

    // Custom headers handling (Default headers formatting)
    if (trimmed === 'SYSTEM INTEGRATOR POV ANSWER:' || trimmed === 'ANSWER:') {
      inReferencedDocuments = false;
      renderedBlocks.push(
        <span key={`h-${blockKey++}`} className="text-emerald-400 font-extrabold tracking-widest text-[15.5px] uppercase block mt-8 mb-3 border-b border-emerald-500/10 pb-1.5 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" /> Systems Integrator POV Output
        </span>
      );
      continue;
    }

    if (trimmed === 'SYSTEM INTEGRATION HIGHLIGHTS:') {
      inReferencedDocuments = false;
      renderedBlocks.push(
        <span key={`h-${blockKey++}`} className="text-emerald-400 font-extrabold tracking-widest text-[15.5px] uppercase block mt-8 mb-3 border-b border-emerald-500/10 pb-1.5 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" /> Core Validation & Trade-offs
        </span>
      );
      continue;
    }

    if (trimmed === 'REFERENCED DOCUMENTS:') {
      inReferencedDocuments = true;
      renderedBlocks.push(
        <span key={`h-${blockKey++}`} className="text-cyan-500 font-extrabold tracking-widest text-[10px] uppercase block mt-6 mb-1.5 border-b border-cyan-500/10 pb-1 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-cyan-500" /> Referenced Documents
        </span>
      );
      continue;
    }

    if (trimmed === 'KEYWORDS:') {
      inReferencedDocuments = false;
      renderedBlocks.push(
        <span key={`h-${blockKey++}`} className="text-amber-500 font-extrabold tracking-widest text-[15.5px] uppercase block mt-8 mb-3 border-b border-amber-500/10 pb-1.5 flex items-center gap-2">
          <Code className="w-4 h-4 text-amber-500" /> Architectural Dictionary
        </span>
      );
      continue;
    }

    // Markdown Headers
    if (trimmed.startsWith('#')) {
      inReferencedDocuments = false;
      const depth = (trimmed.match(/^#+/) || [''])[0].length;
      const title = trimmed.replace(/^#+\s*/, '');
      const headerClasses = [
        'text-lg md:text-xl font-black text-white mt-8 mb-3 flex items-center gap-2 border-b border-zinc-800 pb-1.5',
        'text-base md:text-lg font-extrabold text-zinc-100 mt-7 mb-2.5 flex items-center gap-2',
        'text-[15px] md:text-[16px] font-bold text-zinc-200 mt-6 mb-2',
        'text-[14px] md:text-[15px] font-semibold text-zinc-300 mt-5 mb-1.5',
      ];
      const cls = headerClasses[Math.min(depth - 1, headerClasses.length - 1)];

      renderedBlocks.push(
        React.createElement(`h${Math.min(depth, 6)}`, { key: `h-${blockKey++}`, className: cls }, parseInline(title))
      );
      continue;
    }

    // Checklist item
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
      const checked = trimmed.startsWith('- [x]');
      const content = trimmed.slice(5).trim();
      renderedBlocks.push(
        <div key={`chk-${blockKey++}`} className="flex items-start gap-3.5 my-4 text-zinc-200 text-[15.5px] font-medium leading-relaxed">
          <span className="mt-1 shrink-0 cursor-pointer">
            {checked ? (
              <CheckSquare className="w-4.5 h-4.5 text-emerald-405" />
            ) : (
              <Square className="w-4.5 h-4.5 text-zinc-650 hover:text-zinc-400" />
            )}
          </span>
          <span className={checked ? 'line-through text-zinc-550' : ''}>{parseInline(content)}</span>
        </div>
      );
      continue;
    }

    // Bullet List Item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2).trim();
      if (inReferencedDocuments) {
        renderedBlocks.push(
          <div key={`li-${blockKey++}`} className="flex items-center gap-2 my-1 text-zinc-400 text-[11px] font-mono leading-relaxed pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 shrink-0" />
            <span>{parseInline(content)}</span>
          </div>
        );
      } else {
        renderedBlocks.push(
          <div key={`li-${blockKey++}`} className="flex items-start gap-3.5 my-4 text-zinc-200 text-[15.5px] font-medium leading-relaxed pl-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80 mt-2.5 shrink-0 shadow-[0_0_8px_#10b981]" />
            <span>{parseInline(content)}</span>
          </div>
        );
      }
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s+/.test(trimmed)) {
      const numberMatch = trimmed.match(/^(\d+)\.\s+/);
      const num = numberMatch ? numberMatch[1] : '1';
      const content = trimmed.replace(/^\d+\.\s+/, '');
      if (inReferencedDocuments) {
        renderedBlocks.push(
          <div key={`ol-${blockKey++}`} className="flex items-center gap-2 my-1 text-zinc-400 text-[11px] font-mono leading-relaxed pl-2">
            <span className="font-mono text-[10px] font-bold text-cyan-500/80 shrink-0 w-3 text-right pr-0.5">{num}.</span>
            <span>{parseInline(content)}</span>
          </div>
        );
      } else {
        renderedBlocks.push(
          <div key={`ol-${blockKey++}`} className="flex items-start gap-3.5 my-4 text-zinc-200 text-[15.5px] font-medium leading-relaxed pl-2">
            <span className="font-mono text-[13px] font-bold text-emerald-405 mt-0.5 shrink-0 w-4 text-right pr-1">{num}.</span>
            <span>{parseInline(content)}</span>
          </div>
        );
      }
      continue;
    }

    // Empty Lines
    if (trimmed === '') {
      renderedBlocks.push(<div key={`br-${blockKey++}`} className="h-3" />);
      continue;
    }

    // Default Paragraph text
    if (inReferencedDocuments) {
      renderedBlocks.push(
        <p key={`p-${blockKey++}`} className="text-zinc-400 text-[11px] font-mono leading-relaxed mb-1 pl-2">
          {parseInline(line)}
        </p>
      );
    } else {
      renderedBlocks.push(
        <p key={`p-${blockKey++}`} className="text-zinc-200 text-[16px] leading-relaxed font-medium mb-4">
          {parseInline(line)}
        </p>
      );
    }
  }

  // Handle any unclosed code block or table at EOF
  if (inCodeBlock && codeLines.length > 0) {
    renderedBlocks.push(renderCodeBlock(codeLang, codeLines, blockKey++));
  }
  if (inTable && tableRows.length > 0) {
    renderedBlocks.push(renderTable(tableHeaders, tableRows, blockKey++));
  }

  return <div className="space-y-2 font-sans">{renderedBlocks}</div>;
}

// Subcomponent that renders a gorgeously styled, interactive IDE Code File Block
function CodeFileBlock({ filename, language, code }: { filename: string; language: string; code: string; key?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className="my-5 rounded-xl border border-zinc-800 bg-[#070709] overflow-hidden shadow-2xl flex flex-col font-mono text-[13px] md:text-[13.5px]">
      {/* Tab/Window header bar */}
      <div className="bg-[#0b0b0e] border-b border-zinc-850 px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-cyan-405" />
          <span className="text-zinc-400 font-bold text-[11px] tracking-wide">{filename}</span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-550 uppercase font-extrabold tracking-widest">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-zinc-500 hover:text-emerald-400 transition-colors p-1.5 rounded hover:bg-zinc-900 flex items-center gap-1.5 cursor-pointer"
          title="Copy contents to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-405" /> : <Copy className="w-4 h-4" />}
          <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code viewport with line numbering */}
      <div className="overflow-x-auto max-h-[350px] overflow-y-auto custom-scrollbar p-3.5 flex bg-[#060608]/90">
        {/* Line Numbers */}
        <div className="text-zinc-650 text-right select-none pr-3.5 border-r border-zinc-850 font-bold text-[12px] leading-relaxed">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Actual Code content */}
        <pre className="pl-3.5 text-zinc-300 font-medium leading-relaxed whitespace-pre font-mono text-[13px] md:text-[13.5px] flex-1">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

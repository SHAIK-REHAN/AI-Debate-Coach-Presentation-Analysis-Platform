import React from "react";

export function FormattedText({ content, className = "" }) {
  if (!content) return null;

  const renderInline = (str) => {
    if (!str) return str;
    // Match code `...`, bold-italic ***...*** / ___...___, bold **...** / __...__, italic *...* / _..._
    const regex = /(`[^`]+`|\*\*\*([^*]+)\*\*\*|___([^_]+)___|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_))/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      const full = match[0];
      if (full.startsWith("`") && full.endsWith("`")) {
        parts.push(
          <code key={match.index} className="bg-black/40 text-purple-200 px-1.5 py-0.5 rounded text-xs font-mono">
            {full.slice(1, -1)}
          </code>
        );
      } else if (match[2] || match[3]) {
        parts.push(
          <strong key={match.index} className="font-bold text-white italic">
            {match[2] || match[3]}
          </strong>
        );
      } else if (match[4] || match[5]) {
        parts.push(
          <strong key={match.index} className="font-semibold text-white">
            {match[4] || match[5]}
          </strong>
        );
      } else if (match[6] || match[7]) {
        parts.push(
          <em key={match.index} className="italic text-purple-200/90 font-medium">
            {match[6] || match[7]}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }
    return parts.length > 0 ? parts : str;
  };

  // Normalize horizontal rules attached to headings like '---### Heading'
  const normalized = content.replace(/---+/g, "\n---\n");
  const lines = normalized.split(/\r?\n/);
  const elements = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(<hr key={index} className="border-white/10 my-3" />);
      return;
    }

    const hMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = renderInline(hMatch[2]);
      if (level === 1) {
        elements.push(
          <h2 key={index} className="text-purple-100 font-bold text-base mt-3 mb-1">
            {text}
          </h2>
        );
      } else if (level === 2) {
        elements.push(
          <h3 key={index} className="text-purple-200 font-bold text-sm mt-2.5 mb-1">
            {text}
          </h3>
        );
      } else if (level === 3) {
        elements.push(
          <h4 key={index} className="text-purple-300 font-semibold text-sm mt-2 mb-1">
            {text}
          </h4>
        );
      } else if (level === 4) {
        elements.push(
          <h5 key={index} className="text-purple-300/90 font-semibold text-xs uppercase tracking-wider mt-2 mb-0.5">
            {text}
          </h5>
        );
      } else {
        elements.push(
          <h6 key={index} className="text-purple-400 font-medium text-xs mt-1.5 mb-0.5">
            {text}
          </h6>
        );
      }
      return;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={index} className="flex items-start gap-2 ml-2 my-0.5 text-sm text-gray-300">
          <span className="text-purple-400 mt-1 text-xs">•</span>
          <span>{renderInline(bulletMatch[1])}</span>
        </div>
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+[.)])\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={index} className="flex items-start gap-2 ml-2 my-0.5 text-sm text-gray-300">
          <span className="text-purple-400 font-medium">{numMatch[1]}</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    const quoteMatch = trimmed.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      elements.push(
        <blockquote key={index} className="border-l-2 border-purple-500/50 pl-3 my-1 italic text-gray-300 text-sm">
          {renderInline(quoteMatch[1])}
        </blockquote>
      );
      return;
    }

    elements.push(
      <p key={index} className="text-gray-300 text-sm leading-relaxed mb-1">
        {renderInline(trimmed)}
      </p>
    );
  });

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}

export default FormattedText;

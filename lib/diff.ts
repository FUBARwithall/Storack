import { diffLines, diffWords, Change } from 'diff';

export type WordToken = {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
};

export type ParagraphDiff = {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  oldText?: string;
  newText?: string;
  wordDiffs?: WordToken[];
};

/**
 * Strips HTML tags, decodes basic entities, and splits into clean paragraphs.
 */
export function htmlToPlainParagraphs(html: string): string[] {
  if (!html) return [];

  // Replace block element tags with newlines
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|blockquote|li|tr|section|article)>/gi, '\n')
    .replace(/<hr\s*\/?>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Split into paragraphs, trim whitespace, and discard completely empty lines
  return text
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Word-level diff for a single paragraph.
 */
export function diffParagraphWords(oldText: string, newText: string): WordToken[] {
  const parts = diffWords(oldText, newText);
  return parts.map((part: Change) => ({
    type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged',
    value: part.value,
  }));
}

/**
 * Paragraph-level diff with word-level refinement for modified paragraphs.
 */
export function diffParagraphs(oldHtml: string, newHtml: string): ParagraphDiff[] {
  const oldParas = htmlToPlainParagraphs(oldHtml);
  const newParas = htmlToPlainParagraphs(newHtml);

  const oldStr = oldParas.length > 0 ? oldParas.join('\n') + '\n' : '';
  const newStr = newParas.length > 0 ? newParas.join('\n') + '\n' : '';

  if (!oldStr && !newStr) {
    return [];
  }

  const rawDiffs = diffLines(oldStr, newStr);
  const results: ParagraphDiff[] = [];

  for (let i = 0; i < rawDiffs.length; i++) {
    const current = rawDiffs[i];
    const next = rawDiffs[i + 1];

    // Helper to get lines without trailing newlines
    const getLines = (val: string) =>
      val
        .split('\n')
        .filter((line, idx, arr) => (idx === arr.length - 1 && line === '' ? false : true));

    if (current.removed && next && next.added) {
      // Detected a replacement block (removed followed immediately by added)
      const removedLines = getLines(current.value);
      const addedLines = getLines(next.value);

      const minLen = Math.min(removedLines.length, addedLines.length);

      // Pair up corresponding lines as modified
      for (let j = 0; j < minLen; j++) {
        const oldT = removedLines[j];
        const newT = addedLines[j];
        results.push({
          type: 'modified',
          oldText: oldT,
          newText: newT,
          wordDiffs: diffParagraphWords(oldT, newT),
        });
      }

      // Any excess removed lines
      for (let j = minLen; j < removedLines.length; j++) {
        results.push({
          type: 'removed',
          oldText: removedLines[j],
        });
      }

      // Any excess added lines
      for (let j = minLen; j < addedLines.length; j++) {
        results.push({
          type: 'added',
          newText: addedLines[j],
        });
      }

      // Skip the next change since we handled it
      i++;
    } else if (current.removed) {
      const removedLines = getLines(current.value);
      for (const line of removedLines) {
        results.push({
          type: 'removed',
          oldText: line,
        });
      }
    } else if (current.added) {
      const addedLines = getLines(current.value);
      for (const line of addedLines) {
        results.push({
          type: 'added',
          newText: line,
        });
      }
    } else {
      // Unchanged lines
      const unchangedLines = getLines(current.value);
      for (const line of unchangedLines) {
        results.push({
          type: 'unchanged',
          oldText: line,
          newText: line,
        });
      }
    }
  }

  return results;
}

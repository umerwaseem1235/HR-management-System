/** Strip HTML tags/entities to plain text (rich-note fields, report previews). */
export function stripHtml(html: string): string {
  return (html || '')
    .replace(/<(br|p|div|li|h1|h2|h3)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Word/char counts for a rich-text note (progress descriptions). */
export function noteStats(html: string): { words: number; chars: number } {
  const text = stripHtml(html);
  return {
    words: text ? text.split(' ').filter(Boolean).length : 0,
    chars: text.length,
  };
}

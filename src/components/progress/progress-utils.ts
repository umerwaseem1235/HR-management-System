export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

export function formatSubmission(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${String(d).padStart(2, '0')}-${MONTHS[m - 1]}-${y}`;
}

export const PAGE_SIZES = [5, 10, 20];

export function stripHtml(html: string): string {
  return html
    .replace(/<(br|p|div|li|h1|h2|h3)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function noteStats(html: string): { words: number; chars: number } {
  const text = stripHtml(html);
  return {
    words: text ? text.split(' ').filter(Boolean).length : 0,
    chars: text.length,
  };
}

export const QUICK_EMOJI = ['✅', '⭐', '🔥', '🎯', '💡', '🚀', '📌', '💎'];

/** Formats a number as PKR with no decimals: 5500 -> "PKR 5,500". */
export function formatCurrency(n: number): string {
  return `PKR ${Math.round(n).toLocaleString()}`;
}

/** "Sarah Williams" -> "SW". */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** "083.333" -> trims noise; generic number formatter for tables. */
export function formatNumber(n: number, digits = 1): string {
  return Number(n.toFixed(digits)).toString();
}

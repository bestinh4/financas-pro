/**
 * Returns a calendar date in the browser's local timezone as YYYY-MM-DD.
 * Avoids UTC date shifts for users creating financial records near midnight.
 */
export const getLocalDateISO = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

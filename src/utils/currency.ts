export const parseCurrencyInput = (raw: string): number => {
  const value = raw.trim().replace(/R\$|\s/g, '');
  if (!value) return Number.NaN;
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : /^-?\d{1,3}(\.\d{3})+$/.test(value) ? value.replace(/\./g, '') : value;
  return Number(normalized);
};

/**
 * Formats a currency input as Brazilian Real while the user types.
 * The last two digits are always cents: 125075 becomes "1.250,75".
 * Accepts pasted values with either Brazilian or international separators.
 */
export const formatCurrencyInput = (raw: string): string => {
  const digits = raw.replace(/\\D/g, '');
  if (!digits) return '';
  const cents = Number(digits) / 100;
  return cents.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

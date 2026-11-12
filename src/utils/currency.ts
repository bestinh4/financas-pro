export const parseCurrencyInput = (raw: string): number => {
  const value = raw.trim().replace(/R\$|\s/g, '');
  if (!value) return Number.NaN;
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : /^-?\d{1,3}(\.\d{3})+$/.test(value) ? value.replace(/\./g, '') : value;
  return Number(normalized);
};

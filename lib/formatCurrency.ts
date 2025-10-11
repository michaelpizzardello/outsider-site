type FormatCurrencyOptions = {
  maximumFractionDigits?: number;
};

/**
 * Formats currency values for display while normalising regional quirks such as the AUD prefix ("A$").
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  { maximumFractionDigits }: FormatCurrencyOptions = {}
): string {
  const value = Number(amount);
  const code = currencyCode?.toUpperCase?.() ?? "";
  if (!Number.isFinite(value)) return "";

  const fractionDigits =
    typeof maximumFractionDigits === "number"
      ? maximumFractionDigits
      : value % 1 === 0
      ? 0
      : 2;

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency: code || "USD",
    maximumFractionDigits: fractionDigits,
  };

  try {
    const formatted = new Intl.NumberFormat("en-GB", formatOptions).format(value);
    if (code === "AUD") {
      return formatted.replace(/^A\$/i, "$");
    }
    return formatted;
  } catch {
    const localeOptions: Intl.NumberFormatOptions = {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits > 0 ? fractionDigits : 0,
    };
    const fallback = value.toLocaleString("en-GB", localeOptions);
    if (code === "AUD") {
      return `$${fallback}`;
    }
    return code ? `${code} ${fallback}` : fallback;
  }
}

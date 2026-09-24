export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "ARS", symbol: "$", name: "Argentine Peso" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
];

const TZ_TO_CURRENCY: Record<string, string> = {
  "Europe/London": "GBP", "Europe/Dublin": "GBP", "Europe/Guernsey": "GBP",
  "Europe/Isle_of_Man": "GBP", "Europe/Jersey": "GBP",
  "America/Toronto": "CAD", "America/Vancouver": "CAD", "America/Edmonton": "CAD",
  "America/Winnipeg": "CAD", "America/Halifax": "CAD", "America/St_Johns": "CAD",
  "America/Dawson": "CAD", "America/Dawson_Creek": "CAD", "America/Fort_Nelson": "CAD",
  "America/Glace_Bay": "CAD", "America/Goose_Bay": "CAD", "America/Moncton": "CAD",
  "America/Regina": "CAD", "America/Whitehorse": "CAD", "America/Yellowknife": "CAD",
  "Asia/Tokyo": "JPY",
  "Asia/Shanghai": "CNY", "Asia/Chongqing": "CNY", "Asia/Harbin": "CNY",
  "Asia/Kashgar": "CNY", "Asia/Urumqi": "CNY",
  "Asia/Hong_Kong": "HKD",
  "Asia/Singapore": "SGD",
  "Asia/Seoul": "KRW",
  "Asia/Kolkata": "INR", "Asia/Calcutta": "INR",
  "Asia/Dubai": "AED",
  "Asia/Riyadh": "SAR",
  "Asia/Karachi": "PKR",
  "Asia/Manila": "PHP",
  "Asia/Bangkok": "THB",
  "Asia/Jakarta": "IDR", "Asia/Makassar": "IDR", "Asia/Jayapura": "IDR",
  "Asia/Kuala_Lumpur": "MYR",
  "Asia/Ho_Chi_Minh": "VND", "Asia/Saigon": "VND",
  "Pacific/Auckland": "NZD", "Pacific/Chatham": "NZD",
  "Africa/Lagos": "NGN",
  "Africa/Nairobi": "KES",
  "Africa/Accra": "GHS",
  "Africa/Cairo": "EGP",
  "Africa/Johannesburg": "ZAR",
  "America/Sao_Paulo": "BRL", "America/Manaus": "BRL", "America/Belem": "BRL",
  "America/Fortaleza": "BRL", "America/Recife": "BRL",
  "America/Mexico_City": "MXN",
  "America/Buenos_Aires": "ARS", "America/Argentina/Buenos_Aires": "ARS",
  "Europe/Istanbul": "TRY",
  "Europe/Moscow": "RUB",
};

export function detectDefaultCurrency(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_TO_CURRENCY[tz]) return TZ_TO_CURRENCY[tz];
    if (tz.startsWith("Europe/")) return "EUR";
    if (tz.startsWith("America/")) return "USD";
    if (tz.startsWith("Australia/")) return "AUD";
  } catch {}
  return "USD";
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatReward(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString()}`;
}

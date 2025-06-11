import { PaymentDocumentData } from "../models";

export const markableCategories = ["Обувь", "Одежда", "Медицинские изделия"]

export function getMonthName(monthIndex: number) {
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  return months[monthIndex];
}

export function calculateTotals(data: PaymentDocumentData[]) {
  let totalQuantity = 0;
  let totalCost = 0;

  for (const item of data) {
    totalQuantity += item.quantity;
    totalCost += item.quantity * item.price;
  }

  return {
    totalQuantity,
    totalCost,
  };
}

export function numberToWords(num: number): string {
  const ones = [
    "",
    "один",
    "два",
    "три",
    "четыре",
    "пять",
    "шесть",
    "семь",
    "восемь",
    "девять",
    "десять",
    "одиннадцать",
    "двенадцать",
    "тринадцать",
    "четырнадцать",
    "пятнадцать",
    "шестнадцать",
    "семнадцать",
    "восемнадцать",
    "девятнадцать",
  ];

  const onesFemale = [
    "",
    "одна",
    "две",
    "три",
    "четыре",
    "пять",
    "шесть",
    "семь",
    "восемь",
    "девять",
    "десять",
    "одиннадцать",
    "двенадцать",
    "тринадцать",
    "четырнадцать",
    "пятнадцать",
    "шестнадцать",
    "семнадцать",
    "восемнадцать",
    "девятнадцать",
  ];

  const tens = [
    "",
    "",
    "двадцать",
    "тридцать",
    "сорок",
    "пятьдесят",
    "шестьдесят",
    "семьдесят",
    "восемьдесят",
    "девяносто",
  ];

  const hundreds = [
    "",
    "сто",
    "двести",
    "триста",
    "четыреста",
    "пятьсот",
    "шестьсот",
    "семьсот",
    "восемьсот",
    "девятьсот",
  ];

  const thousands = [
    "тысяч",
    "тысяча",
    "тысячи",
    "тысячи",
    "тысячи",
    "тысяч",
    "тысяч",
    "тысяч",
    "тысяч",
    "тысяч",
  ];

  const millions = [
    "миллионов",
    "миллион",
    "миллиона",
    "миллиона",
    "миллиона",
    "миллионов",
    "миллионов",
    "миллионов",
    "миллионов",
    "миллионов",
  ];

  if (num === 0) return "ноль";

  let words = "";

  if (num >= 1000000) {
    const mil = Math.floor(num / 1000000);
    words +=
      (mil <= 9
        ? ones[mil] + " " + millions[mil]
        : numberToWords(mil) + " миллионов ") + " ";
    num %= 1000000;
  }

  if (num >= 1000) {
    const th = Math.floor(num / 1000);
    const thCase = th % 100 > 10 && th % 100 < 20 ? 0 : Math.min(th % 10, 5);
    words +=
      (th <= 9
        ? onesFemale[th] + " " + thousands[thCase]
        : numberToWords(th) + " " + thousands[thCase]) + " ";
    num %= 1000;
  }

  if (num >= 100) {
    const h = Math.floor(num / 100);
    words += hundreds[h] + " ";
    num %= 100;
  }

  if (num >= 20) {
    const t = Math.floor(num / 10);
    words += tens[t] + " ";
    num %= 10;
  }

  if (num > 0) {
    const lastDigit = num % 10;
    const isFemale = lastDigit === 2 || lastDigit === 3 || lastDigit === 4;
    words += (isFemale ? onesFemale[num] : ones[num]) + " ";
  }

  return words.trim();
}

export function arrayToPostgresArrayString(arr: any[]) {
  return `{${arr.join(", ")}}`;
}

export function getCategoryCode(category: string): number {
  const categoryMap: { [key: string]: number } = {
    одежда: 6202920000,
    обувь: 6403519900,
    косметика: 3304200000,
    "головные уборы": 6505003000,
    "изделия-штучные": 6307109000,
    ткани: 5804109000,
    духи: 3303001000,
    автозапчасти: 8419908509,
    сумки: 4202119000,
    электросамокаты: 8711900000,
    "цветы искусственные": 6004100000,
  };

  return categoryMap[category.toLowerCase()] || 0;
}

export function numberFormatDate(timestamp: number) {
  const date = new Date(timestamp);

  // Получаем день, месяц и год
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Месяцы от 0 до 11
  const year = date.getFullYear();

  // Формируем строку в формате "DD.MM.YYYY"
  return `${day}.${month}.${year}`;
}

export function filterDates(dates: { date?: string }[]): { date: string }[] {
  return dates.filter(
    (item): item is { date: string } => item.date !== undefined
  );
}

export function getClosestDate(dates: { date: string }[]): string | undefined {
  if (dates.length === 0) {
    return undefined;
  }
  const today = new Date();

  const closestDate = dates.reduce((closest, current) => {
    const currentDate = new Date(current.date);
    const closestDate = new Date(closest.date);

    // Разница в миллисекундах между сегодняшним днем и текущей датой
    const diffCurrent = Math.abs(currentDate.getTime() - today.getTime());
    // Разница в миллисекундах между сегодняшним днем и ближайшей датой
    const diffClosest = Math.abs(closestDate.getTime() - today.getTime());

    return diffCurrent < diffClosest ? current : closest;
  });

  return closestDate.date;
}

export function checkDateDiapasone (value: string, with_specify?: boolean) {
    // const hasMarkables = hasCommonElement(markableCategories, categories);
    const daysLimit = with_specify ? 4 : 30; // hasMarkables ? 7 : 30
    const dt = new Date(value);
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - daysLimit);
    const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
    return !isNaN(dt.getTime()) && dt >= thirtyDaysAgo && dt <= tomorrow
}

export function monthNum (date: Date) {
  return (date.getMonth() + 1).toString().padStart(2, '0');
}

export function hasCommonElement(arr1: any[], arr2: any[]): boolean {
  return arr1.some(item => arr2.includes(item)) || arr2.some(item => arr1.includes(item));
}

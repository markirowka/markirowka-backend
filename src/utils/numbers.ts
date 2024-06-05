import { paymentDocumentData } from "../models";

export function getMonthName(monthIndex: number) {
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    return months[monthIndex];
  }

export function calculateTotals(data: paymentDocumentData[]) {
    let totalQuantity = 0;
    let totalCost = 0;

    for (const item of data) {
        totalQuantity += item.quantity;
        totalCost += item.quantity * item.price;
    }

    return {
        totalQuantity,
        totalCost
    };
}

export function numberToWords(num: number) {
  const ones = [
      '', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
      'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
      'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'
  ];

  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];

  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  const thousands = ['тысяч', 'одна тысяча', 'две тысячи', 'три тысячи', 'четыре тысячи', 'пять тысяч', 'шесть тысяч', 'семь тысяч', 'восемь тысяч', 'девять тысяч'];

  const millions = ['миллионов', 'один миллион', 'два миллиона', 'три миллиона', 'четыре миллиона', 'пять миллионов', 'шесть миллионов', 'семь миллионов', 'восемь миллионов', 'девять миллионов'];

  if (num === 0) return 'ноль';

  if (num < 20) {
      return ones[num];
  }

  let words = '';

  if (num >= 1000000) {
      const mil = Math.floor(num / 1000000);
      words += (mil <= 9 ? millions[mil] : numberToWords(mil) + ' миллионов ') + ' ';
      num %= 1000000;
  }

  if (num >= 1000) {
      const th = Math.floor(num / 1000);
      words += (th <= 9 ? thousands[th] : numberToWords(th) + ' тысяч ') + ' ';
      num %= 1000;
  }

  if (num >= 100) {
      const h = Math.floor(num / 100);
      words += hundreds[h] + ' ';
      num %= 100;
  }

  if (num >= 20) {
      const t = Math.floor(num / 10);
      words += tens[t] + ' ';
      num %= 10;
  }

  if (num > 0) {
      words += ones[num] + ' ';
  }

  return words.trim();
}
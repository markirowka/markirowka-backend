import { CategoryData, PaymentDocumentData } from "../models";
import { getCategoryCode } from "./numbers";

export function categoryDataFromGoodsList(
  data: PaymentDocumentData[]
): CategoryData[] {
  const aggregatedMap: { [key: string]: number } = {};

  data.forEach((item) => {
    if (aggregatedMap[item.category]) {
      aggregatedMap[item.category] += item.quantity;
    } else {
      aggregatedMap[item.category] = item.quantity;
    }
  });

  const aggregatedArray: CategoryData[] = Object.keys(aggregatedMap).map(
    (category) => ({
      category,
      quantity: aggregatedMap[category],
      code: getCategoryCode(category),
    })
  );

  while (aggregatedArray.length < 5) {
    aggregatedArray.push({ category: "", quantity: 0, code: 0 });
  }

  return aggregatedArray;
}

export function getFullOrgName(shortName: string): string {
  switch (shortName.toUpperCase()) {
    // Формы для России
    case "ООО":
      return "Общество с ограниченной ответственностью";
    case "ИП":
      return "Индивидуальный предприниматель";
    case "АО":
      return "Акционерное общество";
    case "ПАО":
      return "Публичное акционерное общество";
    case "НКО":
      return "Некомерческая организация";
    case "АНО":
      return "Автономная некоммерческая организация";
    case "ФГУП":
      return "Федеральное государственное унитарное предприятие";
    case "ГУП":
      return "Государственное унитарное предприятие";
    case "МУП":
      return "Муниципальное унитарное предприятие";
    case "ТОО":
      return "Товарищество с ограниченной ответственностью";
    case "ЗАО":
      return "Закрытое акционерное общество";
    case "ТСЖ":
      return "Товарищество собственников жилья";
    case "ОАО":
      return "Открытое акционерное общество";
    case "ПК":
      return "Потребительский кооператив";
    case "СНТ":
      return "Садоводческое некоммерческое товарищество";
    case "КФХ":
      return "Крестьянское (фермерское) хозяйство";
    case "СПК":
      return "Сельскохозяйственный производственный кооператив";
    case "АСО":
      return "Ассоциация страховых организаций";
    case "ПТ":
      return "Производственный трест";

    // Формы для Беларуси
    case "ЧУП":
      return "Частное унитарное предприятие";
    case "ОДО":
      return "Общество с дополнительной ответственностью";
    case "УП":
      return "Унитарное предприятие";
    case "КТ":
      return "Коммандитное товарищество";
    case "АТ":
      return "Акционерное товарищество";
    case "СТ":
      return "Сельскохозяйственное товарищество";
    case "ХК":
      return "Хозяйственный кооператив";
    case "ГК":
      return "Государственный концерн";
    case "ОС":
      return "Общественное объединение";
    case "ФХ":
      return "Фермерское хозяйство";

    // Если форма не найдена
    default:
      return shortName.toUpperCase();
  }
}

export function applyFullOrgName(input: string): string {
  // Разделяем строку по пробелу, чтобы выделить первое слово
  const [firstWord, ...restWords] = input.split(" ");
  
  // Получаем полное название организации для первого слова
  const fullOrgName = getFullOrgName(firstWord);
  
  // Собираем строку обратно с заменой первого слова
  return [fullOrgName, ...restWords].join(" ");
}

export function getNameInitials (fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName; // Если передано только одно слово, вернуть как есть

  const [lastName, firstName, middleName] = parts;
  const firstInitial = firstName ? `${firstName[0]}.` : "";
  const middleInitial = middleName ? `${middleName[0]}.` : "";

  return `${lastName} ${firstInitial} ${middleInitial}`.trim();
}

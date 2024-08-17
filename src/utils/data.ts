import { CategoryData, PaymentDocumentData } from "../models";
import { getCategoryCode } from "./numbers";

export function categoryDataFromGoodsList (data: PaymentDocumentData[]): CategoryData[] {
    const aggregatedMap: { [key: string]: number } = {};
  
    data.forEach(item => {
      if (aggregatedMap[item.category]) {
        aggregatedMap[item.category] += item.quantity;
      } else {
        aggregatedMap[item.category] = item.quantity;
      }
    });
  
    const aggregatedArray: CategoryData[] = Object.keys(aggregatedMap).map(category => ({
      category,
      quantity: aggregatedMap[category],
      code: getCategoryCode(category)
    }));
  
    while (aggregatedArray.length < 5) {
      aggregatedArray.push({ category: '', quantity: 0, code: 0 });
    }
  
    return aggregatedArray;
  }
  
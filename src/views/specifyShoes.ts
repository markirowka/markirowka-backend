import { itemDataShoes, rootFolder, sampleItemShoes } from "../models";
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import xlsx from 'xlsx';


export async function GenerateSpecifyShoes (ownerId: number, fileName: string, data: itemDataShoes[]): Promise<string | null> {
    return new Promise(async (resolve, reject) => {
        const workbook = xlsx.utils.book_new();

        /* 
        1. Код ТНВЭД (Числовой, Необязательный, если не проставят оставляем пустым)
2. Код категории (Не редактируемое берем из второго листа таблицы, или добавить отдельной настройкой (Он статичный для одной категории))
3. Полное наименование товара (Только для Excel таблицы) (Формировать из следующих пунктов по шаблону: ${Вид товара} “${Товарный знак}” арт. ${Артикул производителя}. Цвет: ${Цвет}. Размер: ${Размер})
4. Товарный знак (Текстовое значение)
5. Модель/Артикул производителя (Select из двух значений) 
6. Модель/Артикул производителя (Само значение) 
7. Вид товара (Текстовое значение, взять значения из справочника: второй лист)
8. Цвет (Текстовое значение, взять значения из справочника: второй лист)
9. Размер (Текстовое значение, взять значения из справочника: второй лист)
10.Материал верха (Текстовое значение)
11.Материал подкладки (Текстовое значение)
12.Материал низа/подошвы (Текстовое значение)
        */

        const header = [
            'Код ТНВЭД',
            'Код категории',
            'Полное наименование товара',
            'Товарный знак',
            'Модель/Артикул производителя',
            'Модель/Артикул производителя',
            'Вид товара',
            'Цвет',
            'Размер',
            'Материал верха',
            'Материал подкладки',
            'Материал низа/подошвы',
        ];

        const headers = [
            'Код ТНВЭД',
            'Код категории',
            'Полное наименование товара',
            'Товарный знак',
            'Модель/Артикул производителя',
            undefined,
            'Вид товара',
            'Цвет',
            'Размер',
            'Материал верха',
            'Материал подкладки',
            'Материал низа/подошвы'
          ];
          
        const subHeaders = [
            undefined, undefined, undefined, undefined,
            'тип', 'текст', undefined, undefined, undefined, 
            undefined, undefined, undefined
          ];

        const rows = data.map(item => [
            item.tnved,
            '30141',
            item.fullName,
            item.tradeMark,
            item.articleType,
            item.articleName,
            item.shoesType,
            item.color,
            item.size,
            item.upperMaterial,
            item.liningMaterial,
            item.bottomMaterial
          ]);

        rows.unshift(subHeaders);
        rows.unshift(headers);

        const worksheet = xlsx.utils.aoa_to_sheet(rows);

        const colWidths = [
            { wch: 'Код ТНВЭД'.length + 2 },
            { wch: 'Код категории'.length + 2 },
            { wch: 'Полное наименование товара'.length + 2 },
            { wch: 'Товарный знак'.length + 2 },
            { wch: 'тип'.length + 2 },
            { wch: 'текст'.length + 2 },
            { wch: 'Вид товара'.length + 2 },
            { wch: 'Цвет'.length + 2 },
            { wch: 'Размер'.length + 2 },
            { wch: 'Материал верха'.length + 2 },
            { wch: 'Материал подкладки'.length + 2 },
            { wch: 'Материал низа/подошвы'.length + 2 }
          ];
          worksheet['!cols'] = colWidths;

          worksheet['!merges'] = [
            { s: { r: 0, c: 4 }, e: { r: 0, c: 5 } } 
          ];

          const range = xlsx.utils.decode_range(worksheet['!ref'] || "");
          
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[xlsx.utils.encode_cell({ r: 0, c: C })];
            if (cell) {
              cell.s = { fill: { patternType: "solid", fgColor: { rgb: 'FFFF00' } } }; // Желтый цвет
            }
          }

          for (let C = 4; C <= 5; ++C) {
            const cell = worksheet[xlsx.utils.encode_cell({ r: 1, c: C })];
            if (cell) {
              cell.s = { fill: { patternType: "solid", fgColor: { rgb: 'D3D3D3' } } }; // Серый цвет
            }
          }
        
          xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        try {
            const filePath = `${rootFolder}${ownerId}/${fileName}`;  
            xlsx.writeFile(workbook, filePath);
            console.log(`Workbook generated at ${filePath}`);
            resolve(filePath);
        } catch (e: any) {
            console.log(e.message);
            resolve(null)
        }
    })
}
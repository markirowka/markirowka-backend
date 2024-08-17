import { ItemDataShoes, rootFolder, sampleItemShoes } from "../models";
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import xlsx from 'xlsx';


export async function GenerateSpecify (ownerId: number, fileName: string, data: ItemDataShoes[]) {
    return new Promise(async (resolve, reject) => {

        const header = [
            'Код',
            'ТНВЭД',
            'K3',
            'Название',
            'Торговая марка',
            'Модель / артикул',
            'Название модели',
            'Тип',
            'Цвет',
            'Размер',
            'Материал',
            'Код ТНВЭД',
            'Статус карточки',
            'Результат карточки'
        ];

        const stringifiedData: string[][] = data.map((item) => {
            const values: string[] = [];
            for (let key in sampleItemShoes) {
                values.push(String(item[key as keyof ItemDataShoes] || ""))
            }
            return values
        })

        const wsData = [header, ...stringifiedData]; 
        const ws = xlsx.utils.aoa_to_sheet(wsData);
       
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, ws, 'Items');

        try {
            const filePath = `${rootFolder}${ownerId}/${fileName}`;  // files/${ownerId}/${fileName}
            // fs.openSync(filePath, 'w');
            xlsx.writeFile(workbook, filePath);
            resolve(true);
        } catch (e: any) {
            console.log(e.message);
            resolve(false)
        }
    })
}
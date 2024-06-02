import { itemData } from "../models";
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import xlsx from 'xlsx';


export async function GenerateSpecify (ownerId: number, fileName: string, data: itemData[]) {
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
            for (let key in item) {
                values.push(String(item[key as keyof itemData]))
            }
            return values
        })

        const wsData = [header, ...stringifiedData]; 
        const ws = xlsx.utils.aoa_to_sheet(wsData);
       
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Items');

        try {
            const filePath = `testfile.xlsx`;  // files/${ownerId}/${fileName}
            xlsx.writeFile(wb, filePath);
            resolve(true);
        } catch (e: any) {
            console.log(e.message);
            resolve(false)
        }
    })
}
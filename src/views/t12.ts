import { User, itemData } from "../models";
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';


export async function GenerateT12PDF (owner: User, fileName: string, data: itemData[]) {
    return new Promise(async (resolve, reject) => {
        
        const templatePath = path.join(__dirname, './templates/t12.hbs');
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);

        // Генерация HTML из шаблона и данных
        const html = template(data);
        
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 30000 // увеличиваем тайм-аут до 60 секунд
        });
        const page = await browser.newPage();
        await page.setContent(html);

        const pdfOptions = {
            path: `files/${owner.id || "0"}/${fileName}`,
            orientation: 'landscape', // 'portrait'
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            },
            printBackground: true,
            displayHeaderFooter: false
        };

        await page.setContent(html);
        await page.pdf(pdfOptions);
        await browser.close();
        resolve(true);
    })
}
import { User, paymentDocumentData, rootFolder } from "../models";
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { calculateTotals, getMonthName, numberToWords } from "../utils";
import { ahmedovPrint64 } from "./prints/ahmedov64";


export async function GeneratePaymentPDF (user: User, fileName: string, data: paymentDocumentData[], kind: string, docId: number) {
    return new Promise(async (resolve, reject) => {
        let result = false;
        // console.log("Creation called");
        
        const templatePath = path.join(__dirname, `./templates/${kind}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);
        const imageBase64Url = ahmedovPrint64;
        
        const totals = calculateTotals (data);
        const wordSum = numberToWords (totals.totalCost);
        const wordRowCount = numberToWords (data.length);

        const dt = new Date();

        const dateDay = dt.getDate(); // День месяца
        const dateMonth = getMonthName(dt.getMonth()); // Название месяца
        const dateYear = dt.getFullYear();

        
        const combinedData = {
            id: docId,
            user, 
            items: data.map((item, index) => ({
                rowNum: index+1,
                ...item,
                sum: item.quantity * item.price
            })),
            dateYear: dateYear,
            dateMonth: dateMonth,
            dateDay: dateDay,
            totalCount: totals.totalQuantity,
            totalPrice: totals.totalCost,
            wordSum,
            print: imageBase64Url,
            wordRowCount
        }

        // console.log("Generation data: ", combinedData);

        const html = template(combinedData);
        
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 30000 
        });

        try {
            const page = await browser.newPage();
    
            await page.setContent(html);
    
            const pdfOptions = {
                path: `${rootFolder}${user.id || "0"}/${fileName}`,
                orientation: kind === 't12' ? 'portrait' : 'landscape', // 'landscape', // 'portrait'
                landscape: kind === 't12' ? true : false,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm'
                },
                printBackground: true,
                displayHeaderFooter: false
            };

            // console.log(pdfOptions)
            // const content = await page.content();
            // fs.writeFileSync(`${rootFolder}${user.id || "0"}/${fileName}.html`, content);

            await page.setContent(html);
            await page.pdf(pdfOptions);
            result = true
        } catch (e: any) {
            console.log(e.message);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
        resolve(result)
    })
}
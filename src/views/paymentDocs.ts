import { User, itemData, paymentDocumentData, rootFolder } from "../models";
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';


export async function GeneratePaymentPDF (user: User, fileName: string, data: paymentDocumentData[], kind: string) {
    return new Promise(async (resolve, reject) => {

        console.log("Creation called");
        
        const templatePath = path.join(__dirname, `./templates/${kind}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);

        const combinedData = {
            user, 
            items: data
        }

        console.log("Generation data: ", combinedData);

        const html = template(combinedData);
        
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 30000 
        });
        const page = await browser.newPage();
        await page.setContent(html);

        const pdfOptions = {
            path: `${rootFolder}${user.id || "0"}/${fileName}`,
            orientation: kind === 't12' ? 'portrait' : 'landscape', // 'landscape', // 'portrait'
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            },
            printBackground: true,
            displayHeaderFooter: false
        };

        console.log(pdfOptions)

        await page.setContent(html);
        await page.pdf(pdfOptions);
        await browser.close();
        resolve(true);
    })
}
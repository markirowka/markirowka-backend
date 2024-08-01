import { User, paymentDocumentData, rootFolder } from "../models";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import { calculateTotals, getCategoryCode, getMonthName, numberToWords } from "../utils";
import { ahmedovPrint64, ahmedovSign, cmrWaterMark  } from "./prints";

export async function GeneratePaymentPDF(
  user: User,
  fileName: string,
  data: paymentDocumentData[],
  kind: string,
  docId: number
): Promise<{result: boolean, path: string}> {
  return new Promise(async (resolve, reject) => {
    let result = false;
    let filePath = '';
    // console.log("Creation called");

    const templatePath = path.join(__dirname, `./templates/${kind}.hbs`);
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateSource);
    const imageBase64Url = ahmedovPrint64;
    const signB64 = ahmedovSign;

    const totals = calculateTotals(data);
    const wordSum = numberToWords(totals.totalCost);
    const wordRowCount = numberToWords(data.length);

    const dt = new Date();

    const dateDay = dt.getDate(); // День месяца
    const dateMonth = getMonthName(dt.getMonth()); // Название месяца
    const dateYear = dt.getFullYear();
    const signBaseOffset = 660 + data.length * 20;
    const ctgr = data[0]?.category || "";

    const combinedData = {
      id: docId,
      user,
      items: data.map((item, index) => ({
        rowNum: index + 1,
        ...item,
        sum: item.quantity * item.price,
      })),
      dateYear: dateYear,
      dateMonth: dateMonth,
      dateDay: dateDay,
      totalCount: totals.totalQuantity,
      totalPrice: totals.totalCost,
      wordSum,
      print: imageBase64Url,
      sign: signB64,
      wordRowCount,
      cmrWaterMark,
      country: user.phone?.indexOf("375") === 1 ? "Беларусь" : "Россия",
      category: ctgr,
      categoryCode: getCategoryCode(ctgr),
      signOffset1: signBaseOffset,
      signOffset2: signBaseOffset + 30,
      signOffset3: signBaseOffset + 90,
    };

    // console.log("Generation data: ", combinedData);

    const html = template(combinedData);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 30000,
    });

    try {
      const page = await browser.newPage();

      await page.setContent(html);

      const pdfOptions = {
        path: `${rootFolder}${user.id || "0"}/${fileName}`,
        orientation: "portrait", // kind === 't12' ? 'portrait' : 'landscape', // 'landscape', // 'portrait'
        landscape: false, // kind === 't12' ? true : false,
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm",
        },
        printBackground: true,
        displayHeaderFooter: false,
        height: '297mm'
      };

      // console.log(pdfOptions)
      // const content = await page.content();
      // fs.writeFileSync(`${rootFolder}${user.id || "0"}/${fileName}.html`, content);

      await page.setContent(html);
      await page.pdf(pdfOptions);
      result = true;
      filePath = pdfOptions.path
    } catch (e: any) {
      console.log(e.message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    resolve({result, path: filePath});
  });
}

export async function deleteFiles (paths: string[]) {
    paths.map(file => {
        return new Promise((resolve, reject) => {
          fs.unlink(file, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(true);
            }
          });
        });
      });
    return Promise.all(paths)
}

export async function generateZipArchive(
  user: User,
  archiveName: string,
  filePaths: string[]
) {
  return new Promise(async (resolve, reject) => {
    const archivePath = `${rootFolder}${user.id || "0"}/${archiveName}`;

    const output = fs.createWriteStream(archivePath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Опционально: установить уровень сжатия
    });


    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log("Архив создан и поток завершен.");
      deleteFiles(filePaths).then(() => {
        resolve(true);
      });
    });

    output.on("end", function () {
      console.log("Поток данных завершен.");
      deleteFiles(filePaths).then(() => {
        resolve(true);
      });
    });

    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        console.warn("Предупреждение:", err);
      } else {
        console.log("Critical: ", err);
        reject("Error on archive, warning case");
      }
    });

    archive.on("error", function (err) {
      console.log("Critical: ", err);
      reject("Archive error");
    });

    archive.pipe(output);

    filePaths.forEach((file) => {
      const fileName = file.split("/").slice(-1)[0];
      archive.file(file, { name: fileName });
    });

    archive.finalize();
  });
}

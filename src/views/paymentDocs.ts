import {
  User,
  PaymentDocumentData,
  rootFolder,
  CMRDeliveryData,
} from "../models";
import fs from "fs";
// import XLSX from 'xlsx';
import path from "path";
import archiver from "archiver";
import puppeteer from "puppeteer";
import handlebars from "handlebars";
import {
  calculateTotals,
  getCategoryCode,
  getMonthName,
  monthNum,
  numberFormatDate,
  numberToWords,
} from "../utils";
import { ahmedovPrint64, ahmedovSign, cmrWaterMark } from "./prints";
import {
  applyFullOrgName,
  categoryDataFromGoodsList,
  getFullOrgName,
  getNameInitials,
} from "../utils/data";
import { noneBase64 } from "./prints/none";
import { getCategories } from "../models/cetegories";

export async function GeneratePaymentPDF(
  user: User,
  fileName: string,
  data: PaymentDocumentData[],
  cmr: CMRDeliveryData,
  kind: string,
  docId: number,
  date?: string,
  signed = true,
  saveHTML = false,
  saveAsXLS = false
): Promise<{ result: boolean; path: string }> {
  return new Promise(async (resolve, reject) => {
    let result = false;
    let filePath = "";
    // console.log("Creation called");
    handlebars.registerHelper("eq", function (a, b) {
      return a === b;
    });
    const templatePath = path.join(__dirname, `./templates/${kind}.hbs`);
    const templateSource = fs.readFileSync(templatePath, "utf8");
    const template = handlebars.compile(templateSource);
    const imageBase64Url = ahmedovPrint64;
    const signB64 = ahmedovSign;

    const totals = calculateTotals(data);
    const wordSum = numberToWords(totals.totalCost);
    const wordRowCount = numberToWords(data.length);

    const categoryCmrTexts = categoryDataFromGoodsList(data).map((cat) => {
      return {
        category: cat.category || "",
        count:
          cat.quantity > 0
            ? cmr.cargoPlaceCount && cmr.packType
              ? `Мест ${cmr.cargoPlaceCount} в ${cmr.packType || "коробках"}`
              : `Мест ${cat.quantity} в упаковочных пакетах`
            : "",
        code: cat.code === 0 ? "" : String(cat.code),
        weight: cat.quantity > 0 ? cmr.weight : "",
        volume: cat.quantity > 0 ? cmr.volume : "",
      };
    });
    const dt = date ? new Date(date) : new Date();

    const dateDay = dt.getDate(); // День месяца
    const dateMonth = getMonthName(dt.getMonth()); // Название месяца
    const dateYear = dt.getFullYear();
    const ctgr = data[0]?.category || "";
    const isNeedScale = data.length > 20 ? true : false;
    const numDate = numberFormatDate(dt.getTime());
    const orgNameWerbs = [...user.full_name.split(" ")];
    const orgType = orgNameWerbs.shift() || "";

    const categories = await getCategories();

    const combinedData = {
      category: ctgr,
      categoryCmrTexts,
      categoryCode: getCategoryCode(ctgr),
      cmrWaterMark,
      country: user.phone?.indexOf("375") === 1 ? "Беларусь" : "Россия",
      dateDay: dateDay.toString().padStart(2, "0"),
      dateMonth: dateMonth,
      dateMonthNum: monthNum(dt),
      dateYear: dateYear,
      id: docId,
      isNeedScale,
      items: data.map((item, index) => {
        const cat = categories?.find((cat) => cat.name === item.category);

        return {
          rowNum: index + 1,
          ...item,
          tnved: item.tnved || "",
          metricName: cat?.metrik || "шт",
          okeiCode: cat?.okei_code || "796",
          sum: item.quantity * item.price,
          country: item.country || "Россия"
        };
      }),
      numDate,
      print: signed ? imageBase64Url : noneBase64,
      sign: signed ? signB64 : noneBase64,
      totalCount: totals.totalQuantity,
      totalPrice: totals.totalCost,
      user,
      cmr,
      userNameInitials: getNameInitials(user.ceo || user.ceo_genitive || ""),
      orgType,
      isie: orgType.toUpperCase() === "ИП",
      orgTypeName: getFullOrgName(orgType),
      orgCeoBase: "Устава", // orgType.toUpperCase() === "ИП" ? "Свидетельства" : "Устава",
      orgNameNoType: orgNameWerbs.join(" "),
      orgName: applyFullOrgName(user.full_name),
      wordRowCount,
      wordSum,
    };

    // console.log("Generation data: ", combinedData);

    const html = template(combinedData);

    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium-browser",
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
        height: kind !== "specification" ? "297mm" : undefined,
      };

      // Печать исходного html для отладки
      if (saveHTML) {
        const content = await page.content();
        fs.writeFileSync(
          `${rootFolder}${user.id || "0"}/${fileName}.html`,
          content
        );
      }
      await page.setContent(html);
      await page.pdf(pdfOptions);
      result = true;
      filePath = pdfOptions.path;
      /* if (!saveAsXLS) {
        await page.setContent(html);
        await page.pdf(pdfOptions);
        result = true;
        filePath = pdfOptions.path;
      } else {
        const tempHtmlPath = `${rootFolder}${user.id || "0"}/temp_${Date.now()}.html`;
        fs.writeFileSync(tempHtmlPath, html);
  
        // Создаем новую рабочую книгу Excel
        const wb = XLSX.utils.book_new();

        const wsData = [
          ["HTML Content"],
          [html] // Помещаем весь HTML в одну ячейку
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        console.log("Read:", ws)
        // Добавляем рабочий лист в книгу
              // Устанавливаем ширину столбца
        ws['!cols'] = [{ wch: 300 }]; // Ширина 100 символов
      
        XLSX.utils.book_append_sheet(wb, ws, "HTML Document");

              // Создаем папку, если не существует
        if (!fs.existsSync(path.dirname(filePath))) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Записываем файл
        const ok = XLSX.writeFile(wb, filePath);
        console.log("Saved:", ok)
        fs.unlinkSync(tempHtmlPath);
        result = true;

      } */
    } catch (e: any) {
      console.log(e.message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    resolve({ result, path: filePath });
  });
}

export async function deleteFiles(paths: string[]) {
  paths.map((file) => {
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
  return Promise.all(paths);
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
      // console.log(archive.pointer() + " total bytes");
      // console.log("Архив создан и поток завершен.");
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

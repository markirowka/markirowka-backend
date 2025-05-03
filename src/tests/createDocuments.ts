// test-payment-pdf.ts
import { CMRDeliveryData, PaymentDocumentData, User } from "../models";
import { GeneratePaymentPDF } from "../views/paymentDocs";
import fs from "fs";

const rootFolder = "/"

// Тестовые данные
const testUser: User = {
    id: 1,
    full_name: "ИП Иванов Иван Иванович",
    ceo: "Иванов Иван Иванович",
    phone: "375291234567",
    email: "ben@ben.org",
    inn: 11111112222
};

const testPaymentData: PaymentDocumentData[] = [
  {
    category: "Обувь",
    name: "Кроссовки спортивные",
    quantity: 10,
    price: 100,
    tnved: 6403190000,
    country: "Китай"
  },
  {
    category: "Одежда",
    name: "Футболка хлопковая",
    quantity: 5,
    price: 20,
  },
];

const testCMR: CMRDeliveryData = {
    cargoPlaceCount: 15,
    packType: "коробках",
    weight: "50 кг",
    volume: "0.5 м³",
    driverName: "переверзев",
    documents: "к",
    autoMark: "рено"
};

// Функция для очистки тестовых файлов
function cleanupTestFiles(filePath: string) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Очищен тестовый файл: ${filePath}`);
  }
}

// Основная тестовая функция
async function runTest() {
  console.log("Запуск теста GeneratePaymentPDF...");
  
  const testFileName = "test_invoice.pdf";
  const testDocId = 12345;
  const testFilePath = `${rootFolder}${testUser.id || "0"}/${testFileName}`;

  try {
    // 1. Проверка генерации PDF
    console.log("\n1. Тестирование генерации PDF...");
    const result = await GeneratePaymentPDF(
      testUser,
      testFileName,
      testPaymentData,
      testCMR,
      "invoicef",
      testDocId,
      "2025-04-08T12:00:00",
      true,
      true
    );
    console.log("\n2. Тестирование генерации XLSX...");
    const filen = testFileName.replace(".pdf", ".xlsx");
    console.log("Имя файла:", filen)
    const result2 = await GeneratePaymentPDF(
      testUser,
      filen,
      testPaymentData,
      testCMR,
      "invoicef",
      testDocId,
      "2025-04-08T12:00:00",
      true,
      true,
      true
    );


    console.log("Результат генерации:", result.result ? "УСПЕХ" : "ОШИБКА");
    console.log("Путь к файлу:", result.path);

    console.log("Результат генерации xlsx:", result2 ? "УСПЕХ" : "ОШИБКА");
    console.log("Путь к файлу:", result2.path);

    // 2. Проверка существования файла
    console.log("\n2. Проверка существования файла...");
    const fileExists = fs.existsSync(testFilePath);
    console.log(`Файл ${testFileName} ${fileExists ? "существует" : "не существует"}`);

    if (fileExists) {
      // 3. Проверка размера файла
      console.log("\n3. Проверка размера файла...");
      const stats = fs.statSync(testFilePath);
      console.log(`Размер файла: ${stats.size} байт`);
      console.log(`Файл создан: ${stats.birthtime}`);
    }

    // 4. Проверка обработки ошибок
    console.log("\n4. Тестирование обработки ошибок...");
    try {
      // Неверный kind
      await GeneratePaymentPDF(
        testUser,
        "invalid_test.pdf",
        testPaymentData,
        testCMR,
        "invalid_kind", // несуществующий шаблон
        testDocId
      );
      console.log("ОШИБКА: Ожидалась ошибка для неверного kind");
    } catch (e) {
      console.log("УСПЕХ: Обработана ошибка для неверного kind");
    }

  } catch (error) {
    console.error("ОШИБКА ТЕСТА:", error);
  } finally {
    // Очистка
    console.log("\nЗавершение теста, очистка...");
    cleanupTestFiles(testFilePath);
  }
}

// Запуск теста
runTest().then(() => console.log("Тестирование завершено"));
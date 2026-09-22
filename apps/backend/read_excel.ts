import xlsx from "xlsx";
import path from "path";

const filePath = path.resolve(__dirname, "../frontend/public/data_maret/Laporan Banjir Maret.xlsx");
console.log(`Reading file: ${filePath}`);

const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(`Total rows: ${data.length}`);
console.log("First row:");
console.log(data[0]);

import * as xlsx from "xlsx";
import * as path from "path";

const filePath = path.join(__dirname, "ReleaseDesk_SampleData (1).xlsx");
const wb = xlsx.readFile(filePath);
console.log("Sheets:", wb.SheetNames);
const leaves = xlsx.utils.sheet_to_json<any>(wb.Sheets["Leave Calendar"], { header: 1 });
console.log("\n--- Leave Calendar (raw) ---");
for (let i = 0; i < 15; i++) {
  console.log(`Row ${i + 1}:`, leaves[i]);
}

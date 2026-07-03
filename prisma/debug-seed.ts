import * as xlsx from "xlsx";
import * as path from "path";

const filePath = path.join(__dirname, "ReleaseDesk_SampleData (1).xlsx");
const wb = xlsx.readFile(filePath);

const appsData = xlsx.utils.sheet_to_json<any>(wb.Sheets["Applications"], { range: 0 });

console.log("Apps 0-10:");
for (let i = 0; i < 15; i++) {
  console.log(`Row ${i}:`, appsData[i]);
}

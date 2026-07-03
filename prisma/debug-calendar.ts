import * as xlsx from "xlsx";
import * as path from "path";

const filePath = path.join(__dirname, "ReleaseDesk_SampleData (1).xlsx");
const wb = xlsx.readFile(filePath);

// Check Releases sheet release IDs
const relSheet = wb.Sheets["Releases"];
const relData = xlsx.utils.sheet_to_json<any>(relSheet, { range: 0 });
console.log("--- Releases Sheet Release IDs ---");
console.log("Headers:", Object.keys(relData[0]));
for (const row of relData.slice(0, 5)) {
  console.log(`  ${row["Release ID"]} -> ${row["Release Name"]}`);
}
console.log(`Total releases: ${relData.length}`);

// Check Calendar sheet release IDs
const calSheet = wb.Sheets["Calendar"];
const calData = xlsx.utils.sheet_to_json<any>(calSheet, { range: 10 });
console.log("\n--- Calendar Sheet Release IDs (unique) ---");
const uniqueRelIds = new Set(calData.map((r: any) => r["Release ID"]).filter(Boolean));
console.log("Unique IDs:", [...uniqueRelIds].sort());
console.log(`Total calendar rows: ${calData.length}`);
console.log("\nFirst 3 calendar rows:");
for (const row of calData.slice(0, 3)) {
  console.log(JSON.stringify(row));
}

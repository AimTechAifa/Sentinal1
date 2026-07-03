import * as xlsx from "xlsx";
import * as path from "path";

const filePath = path.join(__dirname, "ReleaseDesk_SampleData (1).xlsx");
const wb = xlsx.readFile(filePath);

const getSheetData = (sheetName: string, range?: number) => {
  return xlsx.utils.sheet_to_json<any>(wb.Sheets[sheetName], { range });
};

const users = getSheetData("Users", 0);
const userIds = new Set(users.map(u => u["User ID"]));

const approvals = getSheetData("Approvals", 2);
console.log("Total Approvals:", approvals.length);

for (const a of approvals) {
  const code = a["Approval ID"];
  const relId = a["Release ID"];
  const approverId = a["Approver ID"];
  
  if (!code) console.log("Missing code for:", a);
  else if (!relId) console.log(`Missing relId for ${code}`);
  else if (!approverId) console.log(`Missing approverId for ${code}`);
  else if (!userIds.has(approverId)) console.log(`Invalid approverId for ${code}: ${approverId}`);
}

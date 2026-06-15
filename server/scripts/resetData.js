const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../data/mockData.js');
const serverPath = path.join(__dirname, '../server.js');

console.log('正在重置数据...');

const serverContent = fs.readFileSync(serverPath, 'utf8');
const newContent = serverContent.replace(
  /let equipmentData = \[\.\.\.equipment\];/,
  'let equipmentData = JSON.parse(JSON.stringify(equipment));'
).replace(
  /let maintenancePlansData = \[\.\.\.maintenancePlans\];/,
  'let maintenancePlansData = JSON.parse(JSON.stringify(maintenancePlans));'
).replace(
  /let partsInventoryData = \[\.\.\.partsInventory\];/,
  'let partsInventoryData = JSON.parse(JSON.stringify(partsInventory));'
).replace(
  /let operationLogsData = \[\.\.\.operationLogs\];/,
  'let operationLogsData = JSON.parse(JSON.stringify(operationLogs));'
).replace(
  /let exceptionsData = \[\.\.\.exceptions\];/,
  'let exceptionsData = JSON.parse(JSON.stringify(exceptions));'
);

fs.writeFileSync(serverPath, newContent);

console.log('数据重置完成！请重启服务器使更改生效。');

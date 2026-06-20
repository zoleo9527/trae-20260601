const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf-8');

// Patch 1: 分选记录页状态三态显示
const patch1From = `<td>\${m.is_stocked ? '<span class="badge badge-success">已入库</span>' : '<span class="badge badge-secondary">未入库</span>'}</td>`;
const patch1To = `<td>\${m.is_scrapped ? '<span class="badge badge-danger">已报废</span>' : (m.is_stocked ? '<span class="badge badge-success">已入库</span>' : '<span class="badge badge-secondary">未处理</span>')}</td>`;

if (content.includes(patch1From)) {
  content = content.split(patch1From).join(patch1To);
  console.log('Patch 1 applied: sorting status 3-way');
} else if (content.includes('badge-danger">已报废')) {
  console.log('Patch 1 skipped: already applied');
} else {
  console.log('Patch 1 NOT FOUND');
}

// Patch 2: 复核记录字段兜底
// 先加变量声明
const forEachStart = '            reviews.forEach(r => {';
const varDecl = '                const materialType = r.material_type || \'unknown\';\n' +
'                const originalGrade = r.original_grade || \'-\';\n' +
'                const newGrade = r.new_grade || \'-\';\n' +
'                const gradeDiff = r.grade_difference || \'-\';\n' +
'                const origPrice = r.original_unit_price || 0;\n' +
'                const newPrice = r.new_unit_price || 0;\n' +
'                const priceDiff = r.price_difference || 0;\n' +
'                const amountDiff = r.amount_difference || 0;';

if (!content.includes('const materialType = r.material_type')) {
  content = content.replace(forEachStart, forEachStart + '\n' + varDecl);
}

// 变量替换
const replacements = [
  ['getMaterialName(r.material_type)', 'getMaterialName(materialType)'],
  ['<span style="color: #999; text-decoration: line-through;">${r.original_grade}</span>', '<span style="color: #999; text-decoration: line-through;">${originalGrade}</span>'],
  ['<strong style="color: #28a745;">${r.new_grade}</strong>', '<strong style="color: #28a745;">${newGrade}</strong>'],
  ['r.amount_difference >= 0', 'amountDiff >= 0'],
  ['${r.grade_difference}</span>', '${gradeDiff}</span>'],
  ['r.original_unit_price.toFixed(2)', 'origPrice.toFixed(2)'],
  ['r.new_unit_price.toFixed(2)', 'newPrice.toFixed(2)'],
  ['r.price_difference >= 0', 'priceDiff >= 0'],
  ['r.price_difference.toFixed(2)', 'priceDiff.toFixed(2)'],
  ['r.amount_difference.toFixed(2)', 'amountDiff.toFixed(2)']
];

replacements.forEach(([from, to]) => {
  if (content.includes(from)) {
    content = content.split(from).join(to);
  }
});
console.log('Patch 2 applied: review fields fallback');

// Patch 3: 未知物料名称
if (!content.includes("unknown: '未知'")) {
  content = content.replace(
    "other: '其他'\n            };\n            return names[type] || type;",
    "other: '其他',\n                unknown: '未知'\n            };\n            return names[type] || type || '未知';"
  );
}
console.log('Patch 3 applied: unknown material fallback');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('All patches saved.');

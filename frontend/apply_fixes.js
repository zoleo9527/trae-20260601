const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'index.html');
let html = fs.readFileSync(p, 'utf-8');

// Fix 1: showTab - 安全处理 event 参数
const oldShowTab = `        function showTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
            
            loadTabData(tabId);
        }`;

const newShowTab = `        function showTab(tabId, evt) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            const btn = evt && evt.target ? evt.target : document.querySelector('.tab-btn[onclick*="' + tabId + '"]');
            if (btn) btn.classList.add('active');
            
            loadTabData(tabId);
        }`;

if (html.includes(oldShowTab)) {
    html = html.replace(oldShowTab, newShowTab);
    console.log('✓ Fix 1: showTab 函数 - event 安全处理');
} else {
    console.log('= Fix 1: showTab 已修复或未匹配');
}

// Fix 2: 初始化方式 - 用 DOMContentLoaded
if (html.includes('        loadOverview();\n    </script>')) {
    html = html.replace(
        '        loadOverview();\n    </script>',
        "        document.addEventListener('DOMContentLoaded', function() {\n" +
        "            showTab('overview');\n" +
        "        });\n" +
        '    </script>'
    );
    console.log('✓ Fix 2: DOMContentLoaded 初始化');
} else {
    console.log('= Fix 2: 初始化已修复或未匹配');
}

// Fix 3: 全局错误处理
if (!html.includes('window.onerror')) {
    html = html.replace(
        "    <script>\n        const API_BASE",
        "    <script>\n" +
        "        window.onerror = function(msg, url, line) {\n" +
        "            console.error('JS Error:', msg, 'line:', line);\n" +
        "        };\n\n" +
        "        const API_BASE"
    );
    console.log('✓ Fix 3: window.onerror 错误捕获');
} else {
    console.log('= Fix 3: window.onerror 已存在');
}

// Fix 4: loadOverview 中 NaN 防护
const oldReduce = `            const totalWeight = inventory.reduce((sum, i) => sum + i.weight, 0);
            const totalAmount = inventory.reduce((sum, i) => sum + i.amount, 0);
            const totalAdjustment = reviews.reduce((sum, r) => sum + r.amount_difference, 0);`;

const newReduce = `            const totalWeight = inventory.reduce((sum, i) => sum + (i.weight || 0), 0);
            const totalAmount = inventory.reduce((sum, i) => sum + (i.amount || 0), 0);
            const totalAdjustment = reviews.reduce((sum, r) => sum + (r.amount_difference || 0), 0);`;

if (html.includes(oldReduce)) {
    html = html.replace(oldReduce, newReduce);
    console.log('✓ Fix 4: 数据字段 NaN 防护');
} else {
    console.log('= Fix 4: NaN 防护已存在');
}

// Fix 5: getMaterialName 增加 unknown
if (!html.includes("unknown: '未知'")) {
    html = html.replace(
        "other: '其他'\n            };\n            return names[type] || type;",
        "other: '其他',\n                unknown: '未知'\n            };\n            return names[type] || type || '未知';"
    );
    console.log('✓ Fix 5: getMaterialName 增加 unknown 兜底');
} else {
    console.log('= Fix 5: unknown 已存在');
}

// Fix 6: 分选记录状态三态
const oldTd = `\${m.is_stocked ? '<span class="badge badge-success">已入库</span>' : '<span class="badge badge-secondary">未入库</span>'}`;
const newTd = `\${m.is_scrapped ? '<span class="badge badge-danger">已报废</span>' : (m.is_stocked ? '<span class="badge badge-success">已入库</span>' : '<span class="badge badge-secondary">未处理</span>')}`;

if (html.includes(oldTd)) {
    html = html.split(oldTd).join(newTd);
    console.log('✓ Fix 6: 分选状态三态显示（已报废/已入库/未处理）');
} else if (html.includes('badge-danger">已报废')) {
    console.log('= Fix 6: 三态显示已存在');
} else {
    console.log('? Fix 6: 未找到分选状态代码');
}

// Fix 7: 复核记录字段兜底 - 加入变量声明
if (!html.includes('const materialType = r.material_type') && html.includes('reviews.forEach(r =>')) {
    // 找到 forEach 行，在后面加变量声明
    const forEachLine = '            reviews.forEach(r => {';
    const vars = `            reviews.forEach(r => {
                const materialType = r.material_type || 'unknown';
                const originalGrade = r.original_grade || '-';
                const newGrade = r.new_grade || '-';
                const gradeDiff = r.grade_difference || '-';
                const origPrice = r.original_unit_price != null ? r.original_unit_price : 0;
                const newPrice = r.new_unit_price != null ? r.new_unit_price : 0;
                const priceDiff = r.price_difference != null ? r.price_difference : 0;
                const amountDiff = r.amount_difference != null ? r.amount_difference : 0;`;
    
    if (html.includes(forEachLine) && !html.includes('const materialType')) {
        html = html.split(forEachLine).join(vars);
        // 然后替换对应的引用
        html = html.split('r.material_type').join('materialType');
        html = html.split('r.original_grade</span>').join('originalGrade}</span>');
        html = html.split('r.new_grade</strong>').join('newGrade}</strong>');
        html = html.split('r.grade_difference}</span>').join('gradeDiff}</span>');
        html = html.split('r.original_unit_price.toFixed').join('origPrice.toFixed');
        html = html.split('r.new_unit_price.toFixed').join('newPrice.toFixed');
        html = html.split('r.price_difference >=').join('priceDiff >=');
        html = html.split('r.price_difference.toFixed').join('priceDiff.toFixed');
        html = html.split('r.amount_difference >=').join('amountDiff >=');
        html = html.split('r.amount_difference.toFixed').join('amountDiff.toFixed');
        console.log('✓ Fix 7: 复核记录字段兜底');
    } else {
        console.log('= Fix 7: 复核记录兜底已存在或未匹配');
    }
} else {
    console.log('= Fix 7: 复核记录兜底已存在');
}

fs.writeFileSync(p, html, 'utf-8');
console.log('\n✅ 前端修复完成！文件大小:', fs.statSync(p).size, 'bytes');

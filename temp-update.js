const fs = require('fs');
const path = require('path');

// Update types/index.ts
const typesPath = path.join(__dirname, 'src/types/index.ts');
let typesContent = fs.readFileSync(typesPath, 'utf-8');

// Check if ResponsibilityInfo already exists
if (!typesContent.includes('export interface ResponsibilityInfo')) {
  // Add responsibility field to TodoItem
  typesContent = typesContent.replace(
    '  createdAt: string;\n}',
    '  createdAt: string;\n  responsibility: ResponsibilityInfo;\n}\n\nexport interface ResponsibilityInfo {\n  stage: \'MEASURE\' | \'APPOINTMENT\' | \'SCHEDULE\' | \'INSTALLATION\' | \'RETURN\' | \'MATERIALS\' | \'COMPLETED\' | \'ARCHIVED\';\n  currentRole: UserRole;\n  currentUserId: string;\n  currentUserName: string;\n  previousNode: string;\n  nextAction: string;\n}'
  );
  fs.writeFileSync(typesPath, typesContent, 'utf-8');
  console.log('Updated types/index.ts');
} else {
  console.log('types/index.ts already has ResponsibilityInfo - skipping');
}

console.log('Done with types update');

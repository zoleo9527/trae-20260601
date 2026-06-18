with open('src/services/orderService.ts', 'r') as f:
    lines = f.readlines()

# Find line numbers and make changes
result = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # 1. Add store manager and measurer lookup after measurerName block
    if "    const measurerName = order.measureRecord?.measurerId" in line:
        result.append(line)
        i += 1
        # Skip next 2 lines (the ternary continuation and the empty line)
        result.append(lines[i])
        i += 1
        result.append(lines[i])
        i += 1
        # Skip the empty line before switch
        if lines[i].strip() == '':
            result.append(lines[i])
            i += 1
        # Now add the new code
        result.append("\n")
        result.append("    const storeManager = this.db.getUsersByRole(UserRole.STORE_MANAGER).find(u => u.storeId === order.storeId)\n")
        result.append("      || this.db.getUsersByRole(UserRole.STORE_MANAGER)[0];\n")
        result.append("    const storeManagerId = storeManager?.id || '';\n")
        result.append("    const storeManagerName = storeManager?.name || '未知店长';\n")
        result.append("\n")
        result.append("    const measurer = order.measureRecord?.measurerId\n")
        result.append("      ? this.db.getUser(order.measureRecord.measurerId)\n")
        result.append("      : this.db.getUsersByRole(UserRole.MEASURER).find(u => u.storeId === order.storeId)\n")
        result.append("        || this.db.getUsersByRole(UserRole.MEASURER)[0];\n")
        result.append("    const measurerId = measurer?.id || '';\n")
        result.append("    const measurerNameResolved = measurer?.name || '未知量尺师';\n")
        result.append("\n")
        continue
    
    # 2. Fix CREATED stage - currentUserId and currentUserName
    if "          currentUserId: ''," in line and i > 0 and "case OrderStatus.CREATED:" in ''.join(lines[max(0,i-10):i]):
        result.append("          currentUserId: measurerId,\n")
        i += 1
        continue
    
    if "          currentUserName: '待分配量尺师'," in line:
        result.append("          currentUserName: measurerNameResolved,\n")
        i += 1
        continue
    
    # 3. Fix APPOINTED stage
    if "          currentUserId: ''," in line and i > 0 and "case OrderStatus.APPOINTED:" in ''.join(lines[max(0,i-10):i]):
        result.append("          currentUserId: storeManagerId,\n")
        i += 1
        continue
    
    if "          currentUserName: '待店长排班'," in line:
        result.append("          currentUserName: storeManagerName,\n")
        i += 1
        continue
    
    # 4. Fix INSTALLATION_SCHEDULED previousNode
    if "          previousNode: '店长分配' + installerName + '师傅'," in line:
        result.append("          previousNode: '店长' + storeManagerName + '分配' + installerName + '师傅',\n")
        i += 1
        continue
    
    # 5. Fix REMINDED previousNode
    if "          previousNode: '客户催单，店长加急'," in line:
        result.append("          previousNode: '客户催单，店长' + storeManagerName + '加急',\n")
        i += 1
        continue
    
    # 6. Fix MATERIALS_NEEDED pendingFulfill
    if "            currentUserId: ''," in line and i > 0 and "pendingFulfill.length > 0" in ''.join(lines[max(0,i-10):i]):
        result.append("            currentUserId: storeManagerId,\n")
        i += 1
        continue
    
    if "            currentUserName: '待店长备货'," in line:
        result.append("            currentUserName: storeManagerName,\n")
        i += 1
        continue
    
    if "            previousNode: '导购申请补料'," in line:
        result.append("            previousNode: '导购' + salesGuideName + '申请补料',\n")
        i += 1
        continue
    
    result.append(line)
    i += 1

with open('src/services/orderService.ts', 'w') as f:
    f.writelines(result)

print('Done updating orderService.ts')

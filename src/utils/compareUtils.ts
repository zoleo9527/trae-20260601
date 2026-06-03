import type { PlanVersion, VersionDiff, CompareResult, ChangeType, ImpactScope, MaterialItem, Table } from '@shared/types';

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keys = Object.keys(aObj);
    if (keys.length !== Object.keys(bObj).length) return false;
    return keys.every(key => isEqual(aObj[key], bObj[key]));
  }
  return false;
}

function getChangeType(field: string): ChangeType {
  if (field.includes('hall') || field === 'hall') return 'hall';
  if (field.includes('tableCount') || field === 'tableCount') return 'table_count';
  if (field.includes('tableLayout') || field === 'tableLayout') return 'table_layout';
  if (field.includes('soundSystem') || field.includes('projector') || field.includes('equipment')) return 'equipment';
  if (field.includes('material') || field === 'materials') return 'material';
  if (field.includes('children') || field.includes('child')) return 'children_chair';
  return 'other';
}

function getImpactScope(field: string, oldValue: unknown, newValue: unknown): ImpactScope {
  if (field === 'hall' || field.includes('soundSystem') || field.includes('motionLines')) return 'hall';
  if (field.includes('tableCount') || field.includes('guestCount')) return 'both';
  if (field === 'materials') {
    const oldMats = oldValue as MaterialItem[];
    const newMats = newValue as MaterialItem[];
    const hasKitchen = [...oldMats, ...newMats].some(m => m.scope === 'kitchen' || m.scope === 'both');
    const hasHall = [...oldMats, ...newMats].some(m => m.scope === 'hall' || m.scope === 'both');
    if (hasKitchen && hasHall) return 'both';
    if (hasKitchen) return 'kitchen';
    return 'hall';
  }
  if (field === 'tableLayout') {
    const oldTables = oldValue as Table[];
    const newTables = newValue as Table[];
    if (oldTables.length !== newTables.length) return 'both';
    return 'hall';
  }
  return 'both';
}

export function compareVersions(v1: PlanVersion, v2: PlanVersion): CompareResult {
  const differences: VersionDiff[] = [];
  const fields: Array<keyof PlanVersion> = ['hall', 'tableLayout', 'materials', 'tableCards', 'soundSystem', 'motionLines', 'remark'];

  fields.forEach(field => {
    const oldVal = v1[field];
    const newVal = v2[field];
    if (!isEqual(oldVal, newVal)) {
      differences.push({
        field,
        oldValue: oldVal,
        newValue: newVal,
        changeType: getChangeType(field),
        impactScope: getImpactScope(field, oldVal, newVal),
      });
    }
  });

  const summary = {
    totalChanges: differences.length,
    hallChanges: differences.filter(d => d.impactScope === 'hall').length,
    kitchenChanges: differences.filter(d => d.impactScope === 'kitchen').length,
    bothChanges: differences.filter(d => d.impactScope === 'both').length,
  };

  return {
    version1: v1,
    version2: v2,
    differences,
    summary,
  };
}

export function getChangeTypeLabel(type: ChangeType): string {
  const labels: Record<ChangeType, string> = {
    hall: '场地变更',
    table_count: '桌数变更',
    table_layout: '桌型调整',
    equipment: '设备问题',
    material: '物资变更',
    children_chair: '儿童椅变更',
    other: '其他变更',
  };
  return labels[type];
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return labels[priority] || priority;
}

export function getImpactScopeLabel(scope: ImpactScope): string {
  const labels: Record<ImpactScope, string> = {
    hall: '厅面',
    kitchen: '后厨',
    both: '厅面+后厨',
  };
  return labels[scope];
}

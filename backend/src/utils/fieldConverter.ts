const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

export const convertToCamelCase = <T = any>(obj: any): T => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => convertToCamelCase(item)) as unknown as T;
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key);
      result[camelKey] = convertToCamelCase(obj[key]);
    }
  }
  return result as T;
};

export const convertFields = {
  project: (row: any) => ({
    ...convertToCamelCase(row),
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
  }),
  arrangement: (row: any) => ({
    ...convertToCamelCase(row),
    expertIds: row.expert_ids ? JSON.parse(row.expert_ids) : [],
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
  }),
  signinRecord: (row: any) => ({
    ...convertToCamelCase(row),
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
  }),
  exception: (row: any) => ({
    ...convertToCamelCase(row),
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
  }),
  operationLog: (row: any) => ({
    ...convertToCamelCase(row),
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
  }),
  user: (row: any) => ({
    ...convertToCamelCase(row),
  }),
  expert: (row: any) => ({
    ...convertToCamelCase(row),
    expertise: row.expertise ? JSON.parse(row.expertise) : [],
  }),
};

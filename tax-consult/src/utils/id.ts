let counter = 0;

export function genId(prefix: string = ''): string {
  counter += 1;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${ts}${rand}${counter}`;
}

export function genCaseNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `TX-${y}${m}${d}-${seq}`;
}

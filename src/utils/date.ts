export function formatLocalDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  
  try {
    let date: Date;
    
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else {
      const parts = dateStr.split(' ');
      if (parts.length === 2) {
        const [datePart, timePart] = parts;
        const [y, m, d] = datePart.split('-').map(Number);
        const [h, min, s] = timePart.split(':').map(Number);
        date = new Date(y, m - 1, d, h, min, s || 0);
      } else {
        date = new Date(dateStr);
      }
    }
    
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return dateStr;
  }
}

export function formatLocalDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const formatted = formatLocalDateTime(dateStr);
    return formatted.split(' ')[0] || dateStr;
  } catch {
    return dateStr;
  }
}

export function formatLocalTime(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const formatted = formatLocalDateTime(dateStr);
    return formatted.split(' ')[1] || dateStr;
  } catch {
    return dateStr;
  }
}

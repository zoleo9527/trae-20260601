import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class QueryTransformPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const transformed: any = {};
    
    for (const key of Object.keys(value)) {
      const val = value[key];
      
      if (val === undefined || val === null || val === '') {
        continue;
      }

      if (key === 'page' || key === 'limit') {
        transformed[key] = parseInt(val, 10) || 1;
      } else if (key === 'amount') {
        transformed[key] = parseFloat(val);
      } else if (key === 'startDate' || key === 'endDate' || key === 'scheduledDate' || key === 'actualDate') {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          transformed[key] = date;
        }
      } else {
        transformed[key] = val;
      }
    }

    return transformed;
  }
}
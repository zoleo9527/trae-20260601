import { Injectable } from '@nestjs/common';

@Injectable()
export class SeederService {
  async seed() { return { success: true }; }
  async clearAll() { return; }
  async getSeedSummary() { return { housekeepers: 0, intakes: 0, orders: 0, reviews: 0 }; }
}

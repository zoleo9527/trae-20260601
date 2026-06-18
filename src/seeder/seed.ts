import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './service/seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);
  const result = await seeder.seed();
  console.log('Seed completed:', JSON.stringify(result, null, 2));
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

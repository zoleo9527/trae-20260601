import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InstallationRecord } from "./entities/installation-record.entity";
import { Installation } from "./entities/installation.entity";
import { Photo } from "./entities/photo.entity";
import { User } from "./entities/user.entity";
import { AcceptanceModule } from "./modules/acceptance.module";
import { AuthModule } from "./auth/auth.module";
import { InstallationModule } from "./modules/installation.module";
import { PhotoModule } from "./modules/photo.module";
import { UserModule } from "./modules/user.module";
import { QueryTransformPipe } from "./pipes/query-transform.pipe";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "better-sqlite3",
      database: "database.sqlite",
      entities: [User, Installation, InstallationRecord, Photo],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UserModule,
    InstallationModule,
    PhotoModule,
    AcceptanceModule,
  ],
  providers: [QueryTransformPipe],
})
export class AppModule {}

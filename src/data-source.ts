import "reflect-metadata";
import { DataSource } from "typeorm";
import { Review } from "./entity/Review";
import { Compensation } from "./entity/Compensation";
import { Store } from "./entity/Store";
import { AuditLog } from "./entity/AuditLog";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "password",
  database: "food_chain_review",
  synchronize: true,
  logging: true,
  entities: [Review, Compensation, Store, AuditLog],
  subscribers: [],
  migrations: [],
});

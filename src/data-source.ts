import "reflect-metadata";
import { DataSource } from "typeorm";
import { Customer } from "./entities/Customer";
import { OutboundOrder } from "./entities/OutboundOrder";
import { Receivable } from "./entities/Receivable";
import { Payment } from "./entities/Payment";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "./recycling_sales.db",
  synchronize: true,
  logging: false,
  entities: [Customer, OutboundOrder, Receivable, Payment],
  migrations: [],
  subscribers: [],
});

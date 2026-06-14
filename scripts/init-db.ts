import { Pool } from "pg";
import { createTables } from "../app/db/schema";
import { seedData } from "../app/db/seed";

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
  });

  try {
    console.log("正在创建数据库...");
    await pool.query("CREATE DATABASE IF NOT EXISTS motorcycle_training");
    console.log("数据库创建成功");
  } catch (error) {
    console.log("数据库可能已存在，继续...");
  }

  const trainingPool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/motorcycle_training",
  });

  try {
    console.log("正在创建表结构...");
    await trainingPool.query(createTables);
    console.log("表结构创建成功");

    console.log("正在初始化数据...");
    await seedData(trainingPool);
    console.log("数据初始化成功");

    console.log("数据库初始化完成！");
  } catch (error) {
    console.error("数据库初始化失败:", error);
    process.exit(1);
  } finally {
    await trainingPool.end();
    await pool.end();
  }
}

initDatabase();

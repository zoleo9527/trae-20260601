const fs = require("fs");

const code = [];

// 基础部分
code.push("const express = require(\"express\");");
code.push("const cors = require(\"cors\");");
code.push("const Database = require(\"better-sqlite3\");");
code.push("");
code.push("const app = express();");
code.push("const PORT = 3000;");
code.push("");
code.push("app.use(cors());");
code.push("app.use(express.json());");
code.push("");
code.push("const db = new Database(\"./art_training.db\");");
code.push("db.pragma(\"journal_mode = WAL\");");
code.push("");

fs.writeFileSync("server.js", code.join("\n") + "\n");
console.log("Generated:", code.length, "lines");

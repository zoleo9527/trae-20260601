import os
L = []
a = L.append

a("const express = require(\"express\");")
a("const cors = require(\"cors\");")
a("const Database = require(\"better-sqlite3\");")
a("")
a("const app = express();")
a("const PORT = 3000;")
a("")
a("app.use(cors());")
a("app.use(express.json());")
a("")
a("const db = new Database(\"./art_training.db\");")
a("db.pragma(\"journal_mode = WAL\");")
a("")

with open("server.js", "w", encoding="utf-8") as f:
    f.write("
".join(L) + "
")

print(f"Generated {len(L)} lines")

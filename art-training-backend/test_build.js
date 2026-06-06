a("db.pragma(\"journal_mode = WAL\");");
a("");

fs.writeFileSync("server.js", L.join("\n") + "\n");
console.log("Generated:", L.length, "lines");

fs = require("fs"); fs.writeFileSync("test_out.js", L.join("\n"));

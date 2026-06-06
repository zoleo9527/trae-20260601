const fs = require("fs");
let code = fs.readFileSync("server.js", "utf8");
console.log("Read", code.length, "bytes");
code = code.replace(
  "const { v4: uuidv4 } = require(\"uuid\");",
  "const { v4: uuidv4 } = require(\"uuid\");
const db = require(\"./database\");"
);
console.log("Step 1 done");
fs.writeFileSync("server.js", code);
console.log("Written");


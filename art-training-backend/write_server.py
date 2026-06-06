import os

content = '''const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

const db = new Database("./art_training.db");
db.pragma("journal_mode = WAL");
'''

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Part 1 written")

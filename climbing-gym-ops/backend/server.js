const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());
const LEVELS = ['xinshou', 'chuji', 'zhongji', 'gaoji', 'jingying'];
const INCIDENT_TYPES = ['type1', 'type2', 'type3'];
const SEVERITY_LEVELS = ['low', 'normal', 'high', 'critical'];
let members = [];
let progressions = [];
let visits = [];
let incidents = [];
let reminders = [];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function hoursAgo(n) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

function paginate(list, page, pageSize) {
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  };
}

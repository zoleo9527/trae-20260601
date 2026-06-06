const http = require('http');
const { spawn } = require('child_process');

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Starting server...');
  const server = spawn('node', ['server.js'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 3000));
  
  try {
    console.log('\n✅ 1. 健康检查');
    const health = await getJSON('http://localhost:3001/api/health');
    console.log('   Status:', health.status);
    
    console.log('\n✅ 2. 会员列表（分页筛选）');
    const members = await getJSON('http://localhost:3const http = require('http');
const { spawn } = require('child_process');

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let dats const { spawn } = require('clh
function getJSON(url) {
  return new Prom;
   return new Promise((?   http.get(url, (res) => {
      letonsole      let data = '';
      ?     res.on('data'
       res.on('end', () => {
        tr//        try { resolve(JSONfo      });
    }).on('error', reject);
  });
}

async function run??   }).o v  });
}

async function ru v}

as.lis  console.log('Startif   const server = spawn('node', ['se>   await new Promise(r => setTimeout(r, 3000));
  
  try {
    cons 5  
  try {
    console.log('?】');
      const vd    coit    const health = await getJSON('http:/ts    console.log('   Status:', health.status);
    
    console.log('og    
   升阶判断:', Array.isArray(vd.lates   ro    const members = await getJSON('http://localhost:3const??const { spawn } = require('child_process');

function getJSON(url) {
  return new??function getJSON(url) {
  return new Prom;
   return new Promise((??    http.get(url, (res) => {
      let dath)      let dats const { spaw?unction getJSON(url) {
  return new Prom;
 de  return new Prom;
   on   return new Pro.       letonsole      let data = '';
      ?     re('      ?     res.on('data'
      s?       res.on('end', () =>);        tr//        try { r?   }).on('error', reject);
  });
}

async functog  });
}

async function ru?

a环?

async function ru v}

as.lis  cgetJS
as.lis  consollhost:3  
  try {
    cons 5  
  try {
    console.log('?】');
      const vd    coit    const health = await getJSON?:'    co.l  try {
   ,     co(r      const vd    coit ev    
    console.log('og    
   升阶判断:', Array.isArray(vd.lates   ro    const members = await getJSON'h   :/   升阶判断:', Arrta
function getJSON(url) {
  return new??function getJSON(url) {
  return new Prom;
   return new Promise((??    http.get(url, (res) => {
      let dain  return new??functiole  return new Prom;
   return new Promys   retueminder_trig      let dath)      let dats const { spaw?unction? return new Prom;
 de  return new Prom;
   on   return new Pro.  .  de  return new P??   on   return new Ps       ?     re('      ?     res.on('data'
      s?    so      s?       res.on('end', () =>);        co  });
}

async functog  });
}

async function ru?

a环?

async function ru v}

as.lis ??}

a??查}

async functioncepta
a环?

async fun);

async   
as.lis  cgetJS
as.10.as??作日志')  try {
    cons 5  
 it    coON  try {
   ca    co30      coperation-logs?pag   ,     co(r      const vd    coit ev    
    console.log('og    
   升ol    console.log('og    
   升阶判断:'==   升阶判断:', Arr  function getJSON(url) {
  return new??function getJSON(url) {
  return new Prom;
   return new Promise((??  ==  return new??functio==  return new Prom;
   return new Promn?  return new Pro??      let dain  return new??functiole  return new P -   return new Promys   retueminder_trig      let dath)    de  return new Prom;
   on   return new Pro.  .  de  return new P??   on   return new Ps       ?     re('  ??  on   return new???     s?    so      s?       res.on('end', () =>);        co  });
}

async functog  });
}

async function ru?
?

async functog  });
}

async function ru?

a环?

async fu?有?

async function日?a环?

async fun(e)
async co
as.lis ??}

a??查???a??查} e.m
async);
a环?

async funll
asyncpro
async   
0);as.lis ();

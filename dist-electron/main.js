"use strict";Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});const d=require("electron"),D=require("node:url"),p=require("path"),A=require("fs"),F=require("better-sqlite3");var f=typeof document<"u"?document.currentScript:null;function b(e){if(e.prepare("SELECT COUNT(*) as c FROM orders").get().c>0)return;e.transaction(()=>{e.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("PF20260528001",1,"华润万家超市","端午促销宣传单",5e4,"210x285","铜版纸",157,"四色","过光胶","normal","proof_rejected",18500,"含10%损耗，另计送货费300元","2026-05-28 10:30:00",1,"2026-06-08","客户要求6月5日前必须出货，已备注加急",1);const u=e.prepare("SELECT last_insert_rowid() as id").get();e.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(u.id,1,"/samples/dw_duanwu_v1.pdf","dw_duanwu_v1.pdf","rejected",2,1,"2026-05-29 14:20:00","logo颜色偏暗，Pantone 186C改成Pantone 185C；右下角二维码扫描失败，请重新生成",1),e.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("PF20260529002",2,"腾讯科技","Q2员工手册",8e3,"148x210","哑粉纸",200,"四色","胶装","normal","proof_uploaded",96800,"封面烫银，内页128P含插页","2026-05-29 15:00:00",1,"2026-06-15","共1200本，分深圳、北京、上海三地发货",1);const E=e.prepare("SELECT last_insert_rowid() as id").get();e.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(E.id,1,"/samples/tencent_hr_v2.pdf","tencent_hr_v2.pdf","uploaded",2,1),e.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("PF20260530003",3,"星巴克咖啡","夏季新品杯套",2e5,"110x260","白卡纸",250,"四色","击凸","urgent","proof_approved",72e3,"专色印刷，需匹配星巴克绿 Pantone 3425C","2026-05-30 09:15:00",1,"2026-06-05","原纸张230g客户改250g，加厚度提升质感，差价已确认",1);const _=e.prepare("SELECT last_insert_rowid() as id").get();e.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(_.id,1,"/samples/sb_summer_v1.pdf","sb_summer_v1.pdf","rejected",2,1,"2026-05-30 16:00:00","请将纸张从230g改为250g白卡纸",0),e.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(_.id,2,"/samples/sb_summer_v2.pdf","sb_summer_v2.pdf","approved",2,1,"2026-05-31 11:30:00","纸张已更新为250g，颜色正确，可生产",1),e.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("PF20260531004",4,"华为技术","Mate70发布会邀请函",3e3,"180x90","特种纸",300,"五色+UV","烫金","emergency","scheduled",31200,"加急订单，特急处理，插单优先","2026-05-31 16:45:00",1,"2026-06-03","6月3日下午6点前必须交货，发布会紧急插单！！！",1);const l=e.prepare("SELECT last_insert_rowid() as id").get();e.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(l.id,1,"/samples/hw_invite_final.pdf","hw_invite_final.pdf","approved",2,3,"2026-05-31 20:00:00","生产总监特批，直接上线",1),e.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("PF20260601005",5,"小米科技","米家IoT产品包装盒",2e4,"260x180x80","灰板纸",350,"四色","裱糊","normal","pending_schedule",128e3,"裱1200g灰板，覆哑膜","2026-06-01 08:30:00",1,"2026-06-20","",1);const T=e.prepare("SELECT last_insert_rowid() as id").get();e.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(T.id,1,"/samples/mi_box_v1.pdf","mi_box_v1.pdf","approved",2,1,"2026-06-01 10:30:00","确认无误，可以排产",1),e.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("PF20260601006",1,"华润万家超市","618购物节海报",500,"570x840","铜版纸",200,"四色","过哑胶","urgent","in_production",6800,"618大促，加急","2026-06-01 09:00:00",1,"2026-06-04","全国门店同步使用",1);const c=e.prepare("SELECT last_insert_rowid() as id").get();e.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, 
        reviewed_by, reviewed_at, feedback, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id,1,"/samples/crv_618_v1.pdf","crv_618_v1.pdf","approved",2,1,"2026-06-01 11:00:00","确认生产",1),e.prepare(`
      INSERT INTO orders (order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, quote_amount, quote_note,
        quoted_at, quoted_by, deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run("PF20260601007",3,"星巴克咖啡","会员卡包装封套",5e4,"90x60","特种纸",180,"烫金","过光胶","normal","pending_quote",0,null,null,null,"2026-06-25","新会员体系升级包装",1),e.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id,2,"2026-06-01 08:00:00","2026-06-01 12:30:00","in_progress",0,"618海报，正四色印刷",3),e.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(l.id,1,"2026-06-01 13:00:00","2026-06-01 17:00:00","scheduled",100,"华为邀请函紧急插单！！！优先级最高，原单延后",3),e.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(_.id,1,"2026-06-01 18:00:00","2026-06-02 02:00:00","scheduled",50,"星巴克杯套，夜班赶货",3),e.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(T.id,6,"2026-06-02 08:00:00","2026-06-03 18:00:00","scheduled",0,"小米包装盒模切",3),e.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, status, priority, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(E.id,3,"2026-06-03 08:00:00","2026-06-05 18:00:00","scheduled",0,"腾讯员工手册印刷",3),e.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(u.id,"proof_uploaded","proof_rejected",1,"logo颜色Pantone 186C改185C，二维码重新生成"),e.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(_.id,"pending_quote","quoted",1,"原230g客户改250g白卡纸，差价+3200元已确认"),e.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(_.id,"proof_uploaded","proof_rejected",1,"纸张厚度不达标，请换250g"),e.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(_.id,"proof_uploaded","proof_approved",1,"V2版本确认"),e.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(l.id,"pending_quote","quoted",1,"特急订单，加60%加急费"),e.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(l.id,"proof_approved","scheduled",3,"紧急插单海德堡CD102-1，下午1点开机")})(),console.log("Sample data inserted successfully")}let a=null;const P={铜版纸:8.5,哑粉纸:9.2,双胶纸:6.8,白卡纸:12.5,牛皮纸:7.2,特种纸:18,灰板纸:5.5},v={单色:.8,双色:1.2,四色:2,"五色+UV":3.5},X={过光胶:.3,过哑胶:.35,UV:.8,烫金:1.5,烫银:1.4,击凸:1.2,裱糊:2,骑马钉:.5,胶装:1.8,精装:3.5},q={normal:1,urgent:1.3,emergency:1.6};function V(){const e=d.app.getPath("userData"),r=p.join(e,"print_factory.db");return console.log("Database path:",r),a=new F(r),a.pragma("journal_mode = WAL"),a.pragma("foreign_keys = ON"),x(),W(),b(a),a}function x(){a&&a.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      real_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('sales','designer','production','admin')),
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      size TEXT NOT NULL,
      paper_type TEXT NOT NULL,
      paper_gsm INTEGER NOT NULL,
      color TEXT NOT NULL,
      finish TEXT,
      urgency TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending_quote',
      quote_amount REAL,
      quote_note TEXT,
      quoted_at TEXT,
      quoted_by INTEGER,
      deadline TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS proofs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      file_path TEXT,
      file_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      uploaded_by INTEGER NOT NULL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      feedback TEXT,
      is_current INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      model TEXT,
      type TEXT NOT NULL,
      max_speed INTEGER,
      status TEXT NOT NULL DEFAULT 'idle',
      status_note TEXT,
      last_maintenance TEXT,
      next_maintenance TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      machine_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      actual_start TEXT,
      actual_end TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      priority INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (machine_id) REFERENCES machines(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS workspace_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_role TEXT NOT NULL DEFAULT 'sales',
      current_view TEXT NOT NULL DEFAULT 'sales-dashboard',
      selected_order_id INTEGER,
      selected_machine_id INTEGER,
      filter_date_from TEXT,
      filter_date_to TEXT,
      search_query TEXT DEFAULT '',
      sidebar_collapsed INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_deadline ON orders(deadline);
    CREATE INDEX IF NOT EXISTS idx_proofs_order ON proofs(order_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_machine ON schedules(machine_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(start_time, end_time);
  `)}function W(){if(!a||a.prepare("SELECT COUNT(*) as count FROM users").get().count>0)return;const r=a.prepare(`
    INSERT INTO users (username, real_name, role, password_hash)
    VALUES (?, ?, ?, ?)
  `);r.run("sales01","张经理","sales","hash_placeholder"),r.run("designer01","李设计","designer","hash_placeholder"),r.run("production01","王主管","production","hash_placeholder"),r.run("admin","系统管理员","admin","hash_placeholder");const s=a.prepare(`
    INSERT INTO customers (name, contact, phone, email, address)
    VALUES (?, ?, ?, ?, ?)
  `);s.run("华润万家超市","陈采购","13800138001","chen@crvanguard.com","深圳市南山区科技园南路1号"),s.run("腾讯科技","林经理","13800138002","lin@tencent.com","深圳市南山区科技园腾讯大厦"),s.run("星巴克咖啡","王总监","13800138003","wang@starbucks.com","上海市静安区南京西路1266号"),s.run("华为技术","赵主管","13800138004","zhao@huawei.com","深圳市龙岗区坂田华为基地"),s.run("小米科技","刘经理","13800138005","liu@xiaomi.com","北京市海淀区清河中街68号");const n=a.prepare(`
    INSERT INTO machines (name, model, type, max_speed, status, status_note, next_maintenance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);n.run("海德堡CD102-1","Heidelberg CD102-4","四色胶印机",15e3,"idle",null,"2026-07-15"),n.run("海德堡CD102-2","Heidelberg CD102-5","五色胶印机",13e3,"running",null,"2026-06-20"),n.run("小森LS440","Komori LS440","四色胶印机",14e3,"idle",null,"2026-08-01"),n.run("罗兰700","Man Roland 700","对开五色机",12e3,"maintenance","6月3日-4日定期保养","2026-06-05"),n.run("马天尼胶装线","Muller Martini","胶装联动线",8e3,"idle",null,"2026-06-25"),n.run("模切机1","BOBST SP102","全自动模切机",6e3,"idle",null,"2026-07-10"),n.run("烫金机1","TYM1050","全自动烫金机",4500,"idle",null,"2026-07-20"),a.prepare("SELECT COUNT(*) as count FROM workspace_state").get().count===0&&a.prepare(`
      INSERT INTO workspace_state (id, current_role, current_view, search_query, sidebar_collapsed)
      VALUES (1, 'sales', 'sales-dashboard', '', 0)
    `).run()}function G(e){const s=P[e.paper_type]||8,n=v[e.color]||2,o=X[e.finish]||0,i=q[e.urgency]||1,u=e.size.match(/(\d+)\s*[xX×]\s*(\d+)/),E=u?parseInt(u[1]):210,_=u?parseInt(u[2]):285,t=E/1e3*(_/1e3)*(e.paper_gsm/1e3)*e.quantity*1.1*s,L=e.quantity*n*.15+300,y=o>0?e.quantity*o:0,O=300+t+L+y,g=O*(i-1),U=O+g,w=U/e.quantity;return{base_cost:Math.round(300*100)/100,paper_cost:Math.round(t*100)/100,printing_cost:Math.round(L*100)/100,finish_cost:Math.round(y*100)/100,urgency_surcharge:Math.round(g*100)/100,total:Math.round(U*100)/100,unit_price:Math.round(w*1e3)/1e3}}function H(){const e=new Date,r=e.getFullYear(),s=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0"),o=`PF${r}${s}${n}`;if(!a)return o+"001";const i=a.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE order_no LIKE ?
  `).get(o+"%"),u=String(i.count+1).padStart(3,"0");return o+u}function Y(e){if(!a)return{success:!1,error:"Database not initialized"};const r=H();try{const s=a.prepare(`
      INSERT INTO orders (
        order_no, customer_id, customer_name, product_name, quantity, size,
        paper_type, paper_gsm, color, finish, urgency, status, deadline,
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(r,e.customer_id,e.customer_name,e.product_name,e.quantity,e.size,e.paper_type,e.paper_gsm,e.color,e.finish||"",e.urgency,"pending_quote",e.deadline,e.notes||"",e.created_by);return{success:!0,data:a.prepare("SELECT * FROM orders WHERE id = ?").get(s.lastInsertRowid)}}catch(s){return{success:!1,error:s.message}}}function z(e,r){if(!a)return{success:!1,error:"Database not initialized"};try{const s=Object.keys(r).filter(u=>u!=="id"&&u!=="order_no");if(s.length===0)return{success:!0,data:a.prepare("SELECT * FROM orders WHERE id = ?").get(e)};const n=s.map(u=>`${u} = ?`).join(", "),o=s.map(u=>r[u]);return o.push(e),a.prepare(`UPDATE orders SET ${n}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...o),{success:!0,data:a.prepare("SELECT * FROM orders WHERE id = ?").get(e)}}catch(s){return{success:!1,error:s.message}}}function j(e,r,s,n){if(!a)return{success:!1,error:"Database not initialized"};const o=a.transaction(()=>{const i=a.prepare("SELECT status FROM orders WHERE id = ?").get(e);return a.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(r,e),a.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(e,(i==null?void 0:i.status)||null,r,s,n||null),a.prepare("SELECT * FROM orders WHERE id = ?").get(e)});try{return{success:!0,data:o()}}catch(i){return{success:!1,error:i.message}}}function k(e,r,s,n){if(!a)return{success:!1,error:"Database not initialized"};try{let o="SELECT * FROM orders WHERE 1=1";const i=[];if(e&&(o+=" AND status = ?",i.push(e)),r&&(o+=" AND deadline >= ?",i.push(r)),s&&(o+=" AND deadline <= ?",i.push(s)),n){o+=" AND (order_no LIKE ? OR customer_name LIKE ? OR product_name LIKE ?)";const E=`%${n}%`;i.push(E,E,E)}return o+=" ORDER BY created_at DESC",{success:!0,data:a.prepare(o).all(...i)}}catch(o){return{success:!1,error:o.message}}}function K(e){if(!a)return{success:!1,error:"Database not initialized"};try{return{success:!0,data:a.prepare("SELECT * FROM orders WHERE id = ?").get(e)}}catch(r){return{success:!1,error:r.message}}}function B(e){if(!a)return{success:!1,error:"Database not initialized"};try{let r="SELECT * FROM customers";const s=[];return e&&(r+=" WHERE name LIKE ? OR contact LIKE ?",s.push(`%${e}%`,`%${e}%`)),r+=" ORDER BY name",{success:!0,data:a.prepare(r).all(...s)}}catch(r){return{success:!1,error:r.message}}}function $(e){if(!a)return{success:!1,error:"Database not initialized"};try{const r=a.prepare(`
      INSERT INTO customers (name, contact, phone, email, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(e.name,e.contact||"",e.phone||"",e.email||"",e.address||"");return{success:!0,data:a.prepare("SELECT * FROM customers WHERE id = ?").get(r.lastInsertRowid)}}catch(r){return{success:!1,error:r.message}}}function J(e){if(!a)return{success:!1,error:"Database not initialized"};try{return{success:!0,data:a.prepare(`
      SELECT * FROM proofs 
      WHERE order_id = ? 
      ORDER BY version DESC
    `).all(e)}}catch(r){return{success:!1,error:r.message}}}function Q(e){if(!a)return{success:!1,error:"Database not initialized"};const r=a.transaction(()=>{a.prepare("UPDATE proofs SET is_current = 0 WHERE order_id = ?").run(e.order_id);const n=a.prepare("SELECT COALESCE(MAX(version), 0) as v FROM proofs WHERE order_id = ?").get(e.order_id).v+1,o=a.prepare(`
      INSERT INTO proofs (order_id, version, file_path, file_name, status, uploaded_by, is_current)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(e.order_id,n,e.file_path||null,e.file_name||null,"uploaded",e.uploaded_by);return a.prepare("UPDATE orders SET status = ? WHERE id = ?").run("proof_uploaded",e.order_id),a.prepare("SELECT * FROM proofs WHERE id = ?").get(o.lastInsertRowid)});try{return{success:!0,data:r()}}catch(s){return{success:!1,error:s.message}}}function Z(e,r,s,n){if(!a)return{success:!1,error:"Database not initialized"};const o=a.transaction(()=>{const i=a.prepare("SELECT * FROM proofs WHERE id = ?").get(e);a.prepare(`
      UPDATE proofs 
      SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, feedback = ?
      WHERE id = ?
    `).run(r,s,n||null,e);const u=r==="approved"?"proof_approved":"proof_rejected";return a.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(u,i.order_id),a.prepare(`
      INSERT INTO order_history (order_id, old_status, new_status, changed_by, note)
      VALUES (?, ?, ?, ?, ?)
    `).run(i.order_id,"proof_uploaded",u,s,n||null),a.prepare("SELECT * FROM proofs WHERE id = ?").get(e)});try{return{success:!0,data:o()}}catch(i){return{success:!1,error:i.message}}}function ee(){if(!a)return{success:!1,error:"Database not initialized"};try{return{success:!0,data:a.prepare("SELECT * FROM machines ORDER BY id").all()}}catch(e){return{success:!1,error:e.message}}}function re(e,r,s){if(!a)return{success:!1,error:"Database not initialized"};try{return a.prepare(`
      UPDATE machines 
      SET status = ?, status_note = ?
      WHERE id = ?
    `).run(r,s||null,e),{success:!0,data:a.prepare("SELECT * FROM machines WHERE id = ?").get(e)}}catch(n){return{success:!1,error:n.message}}}function te(e,r){if(!a)return{success:!1,error:"Database not initialized"};try{let s=`
      SELECT s.*, 
        o.id as order_id, o.order_no, o.customer_name, o.product_name, o.quantity, o.deadline, o.urgency, o.status as order_status,
        m.name as machine_name, m.status as machine_status
      FROM schedules s
      JOIN orders o ON s.order_id = o.id
      JOIN machines m ON s.machine_id = m.id
      WHERE 1=1
    `;const n=[];return e&&(s+=" AND DATE(s.start_time) = ?",n.push(e)),r&&(s+=" AND s.machine_id = ?",n.push(r)),s+=" ORDER BY s.start_time ASC",{success:!0,data:a.prepare(s).all(...n)}}catch(s){return{success:!1,error:s.message}}}function se(e){if(!a)return{success:!1,error:"Database not initialized"};const r=a.transaction(()=>{const s=a.prepare(`
      INSERT INTO schedules (order_id, machine_id, start_time, end_time, priority, notes, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(e.order_id,e.machine_id,e.start_time,e.end_time,e.priority||0,e.notes||"",e.created_by,e.status||"scheduled");return a.prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run("scheduled",e.order_id),a.prepare("SELECT * FROM schedules WHERE id = ?").get(s.lastInsertRowid)});try{return{success:!0,data:r()}}catch(s){return{success:!1,error:s.message}}}function ae(e,r){if(!a)return{success:!1,error:"Database not initialized"};try{const s=Object.keys(r).filter(u=>u!=="id"),n=s.map(u=>`${u} = ?`).join(", "),o=s.map(u=>r[u]);return o.push(e),a.prepare(`UPDATE schedules SET ${n}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...o),{success:!0,data:a.prepare("SELECT * FROM schedules WHERE id = ?").get(e)}}catch(s){return{success:!1,error:s.message}}}function ne(){if(!a)return{success:!1,error:"Database not initialized"};try{return{success:!0,data:a.prepare("SELECT * FROM workspace_state WHERE id = 1").get()}}catch(e){return{success:!1,error:e.message}}}function oe(e){if(!a)return{success:!1,error:"Database not initialized"};try{const r=Object.keys(e),s=r.map(i=>`${i} = ?`).join(", "),n=r.map(i=>e[i]);return a.prepare(`UPDATE workspace_state SET ${s}, last_updated = CURRENT_TIMESTAMP WHERE id = 1`).run(...n),{success:!0,data:a.prepare("SELECT * FROM workspace_state WHERE id = 1").get()}}catch(r){return{success:!1,error:r.message}}}function h(){if(!a)return{success:!1,error:"Database not initialized"};try{return{success:!0,data:a.prepare("SELECT id, username, real_name, role, created_at, last_login FROM users ORDER BY id").all()}}catch(e){return{success:!1,error:e.message}}}function de(){if(!a)return{success:!1,error:"Database not initialized"};try{return{success:!0,data:{export_time:new Date().toISOString(),version:"1.0",users:a.prepare("SELECT id, username, real_name, role, password_hash, created_at, last_login FROM users").all(),customers:a.prepare("SELECT * FROM customers").all(),orders:a.prepare("SELECT * FROM orders").all(),order_items:a.prepare("SELECT * FROM order_items").all(),proofs:a.prepare("SELECT * FROM proofs").all(),machines:a.prepare("SELECT * FROM machines").all(),schedules:a.prepare("SELECT * FROM schedules").all(),order_history:a.prepare("SELECT * FROM order_history").all(),workspace_state:a.prepare("SELECT * FROM workspace_state").all()}}}catch(e){return{success:!1,error:e.message}}}function ie(e){if(!a)return{success:!1,error:"Database not initialized"};const r=a.transaction(()=>{var n,o,i,u,E,_,l,T;let s=0;if((n=e.users)!=null&&n.length){const c=a.prepare(`
        INSERT OR REPLACE INTO users (id, username, real_name, role, password_hash, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.users)c.run(t.id,t.username,t.real_name,t.role,t.password_hash,t.created_at,t.last_login),s++}if((o=e.customers)!=null&&o.length){const c=a.prepare(`
        INSERT OR REPLACE INTO customers (id, name, contact, phone, email, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.customers)c.run(t.id,t.name,t.contact,t.phone,t.email,t.address,t.created_at,t.updated_at),s++}if((i=e.orders)!=null&&i.length){const c=a.prepare(`
        INSERT OR REPLACE INTO orders 
        (id, order_no, customer_id, customer_name, product_name, quantity, size, paper_type, 
         paper_gsm, color, finish, urgency, status, quote_amount, quote_note, quoted_at, 
         quoted_by, deadline, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.orders)c.run(t.id,t.order_no,t.customer_id,t.customer_name,t.product_name,t.quantity,t.size,t.paper_type,t.paper_gsm,t.color,t.finish,t.urgency,t.status,t.quote_amount,t.quote_note,t.quoted_at,t.quoted_by,t.deadline,t.notes,t.created_by,t.created_at,t.updated_at),s++}if((u=e.proofs)!=null&&u.length){const c=a.prepare(`
        INSERT OR REPLACE INTO proofs 
        (id, order_id, version, file_path, file_name, status, uploaded_by, 
         uploaded_at, reviewed_by, reviewed_at, feedback, is_current)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.proofs)c.run(t.id,t.order_id,t.version,t.file_path,t.file_name,t.status,t.uploaded_by,t.uploaded_at,t.reviewed_by,t.reviewed_at,t.feedback,t.is_current),s++}if((E=e.machines)!=null&&E.length){const c=a.prepare(`
        INSERT OR REPLACE INTO machines 
        (id, name, model, type, max_speed, status, status_note, last_maintenance, next_maintenance, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.machines)c.run(t.id,t.name,t.model,t.type,t.max_speed,t.status,t.status_note,t.last_maintenance,t.next_maintenance,t.created_at),s++}if((_=e.schedules)!=null&&_.length){const c=a.prepare(`
        INSERT OR REPLACE INTO schedules 
        (id, order_id, machine_id, start_time, end_time, actual_start, actual_end, 
         status, priority, notes, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.schedules)c.run(t.id,t.order_id,t.machine_id,t.start_time,t.end_time,t.actual_start,t.actual_end,t.status,t.priority,t.notes,t.created_by,t.created_at,t.updated_at),s++}if((l=e.order_history)!=null&&l.length){const c=a.prepare(`
        INSERT OR REPLACE INTO order_history 
        (id, order_id, old_status, new_status, changed_by, note, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.order_history)c.run(t.id,t.order_id,t.old_status,t.new_status,t.changed_by,t.note,t.created_at),s++}if((T=e.workspace_state)!=null&&T.length){const c=a.prepare(`
        INSERT OR REPLACE INTO workspace_state 
        (id, current_role, current_view, selected_order_id, selected_machine_id, 
         filter_date_from, filter_date_to, search_query, sidebar_collapsed, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);for(const t of e.workspace_state)c.run(t.id,t.current_role,t.current_view,t.selected_order_id,t.selected_machine_id,t.filter_date_from,t.filter_date_to,t.search_query,t.sidebar_collapsed,t.last_updated),s++}return{count:s}});try{return{success:!0,data:r()}}catch(s){return{success:!1,error:s.message}}}const C=p.dirname(D.fileURLToPath(typeof document>"u"?require("url").pathToFileURL(__filename).href:f&&f.tagName.toUpperCase()==="SCRIPT"&&f.src||new URL("main.js",document.baseURI).href));process.env.APP_ROOT=p.join(C,"..");const N=process.env.VITE_DEV_SERVER_URL,ue=p.join(process.env.APP_ROOT,"dist-electron"),S=p.join(process.env.APP_ROOT,"dist");process.env.VITE_PUBLIC=N?p.join(process.env.APP_ROOT,"public"):S;let m,R=null,I=null;function M(){m=new d.BrowserWindow({width:1600,height:1e3,minWidth:1200,minHeight:800,icon:p.join(process.env.VITE_PUBLIC||"","electron-vite.svg"),backgroundColor:"#1a1a2e",autoHideMenuBar:!0,webPreferences:{preload:p.join(C,"preload.js"),contextIsolation:!0,nodeIntegration:!1,webSecurity:!1}}),N?m.loadURL(N):m.loadFile(p.join(S,"index.html")),m.on("closed",()=>{m=null})}d.app.on("window-all-closed",()=>{process.platform!=="darwin"&&d.app.quit()});d.app.on("activate",()=>{d.BrowserWindow.getAllWindows().length===0&&M()});d.app.whenReady().then(()=>{I=V();const e=h();e.success&&e.data&&e.data.length>0&&(R=e.data[0]),M()});d.app.on("quit",()=>{I&&I.close()});d.ipcMain.handle("get-workspace-state",async()=>ne());d.ipcMain.handle("save-workspace-state",async(e,r)=>oe(r));d.ipcMain.handle("get-users",async()=>h());d.ipcMain.handle("get-current-user",async()=>R?{success:!0,data:R}:{success:!1,error:"No user logged in"});d.ipcMain.handle("switch-role",async(e,r)=>{const s=await h();if(!s.success||!s.data)return{success:!1,error:s.error||"Failed to get users"};const n=s.data.find(o=>o.role===r);return n?(R=n,{success:!0,data:n}):{success:!1,error:"User not found for role"}});d.ipcMain.handle("get-orders",async(e,r,s,n,o)=>k(r,s,n,o));d.ipcMain.handle("get-order-by-id",async(e,r)=>K(r));d.ipcMain.handle("create-order",async(e,r)=>Y(r));d.ipcMain.handle("update-order",async(e,r,s)=>z(r,s));d.ipcMain.handle("update-order-status",async(e,r,s,n,o)=>j(r,s,n,o));d.ipcMain.handle("calculate-quote",async(e,r)=>G(r));d.ipcMain.handle("get-customers",async(e,r)=>B(r));d.ipcMain.handle("create-customer",async(e,r)=>$(r));d.ipcMain.handle("get-proofs-by-order",async(e,r)=>J(r));d.ipcMain.handle("create-proof",async(e,r)=>Q(r));d.ipcMain.handle("review-proof",async(e,r,s,n,o)=>Z(r,s,n,o));d.ipcMain.handle("select-proof-file",async()=>await d.dialog.showOpenDialog({properties:["openFile"],filters:[{name:"Images",extensions:["jpg","jpeg","png","gif","bmp","tiff","pdf","ai","cdr"]},{name:"All Files",extensions:["*"]}]}));d.ipcMain.handle("get-machines",async()=>ee());d.ipcMain.handle("update-machine-status",async(e,r,s,n)=>re(r,s,n));d.ipcMain.handle("get-schedules",async(e,r,s)=>te(r,s));d.ipcMain.handle("create-schedule",async(e,r)=>se(r));d.ipcMain.handle("update-schedule",async(e,r,s)=>ae(r,s));d.ipcMain.handle("export-data",async()=>de());d.ipcMain.handle("import-data",async(e,r)=>ie(r));d.ipcMain.handle("show-export-dialog",async(e,r)=>await d.dialog.showSaveDialog({defaultPath:r,filters:[{name:"JSON Files",extensions:["json"]}]}));d.ipcMain.handle("show-import-dialog",async()=>await d.dialog.showOpenDialog({properties:["openFile"],filters:[{name:"JSON Files",extensions:["json"]}]}));d.ipcMain.handle("read-json-file",async(e,r)=>{try{const s=A.readFileSync(r,"utf-8");return JSON.parse(s)}catch(s){throw s}});d.ipcMain.handle("write-json-file",async(e,r,s)=>{try{return A.writeFileSync(r,JSON.stringify(s,null,2),"utf-8"),{success:!0}}catch(n){return{success:!1,error:n.message}}});exports.MAIN_DIST=ue;exports.RENDERER_DIST=S;exports.VITE_DEV_SERVER_URL=N;

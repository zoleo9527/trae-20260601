const express = require('express');
const router = express.Router();
const db = require('../db');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { status, species, search, page = 1, pageSize = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const size = Math.max(1, parseInt(pageSize));
  const offset = (pageNum - 1) * size;

  let where = [];
  let params = [];

  if (status) {
    where.push('a.status = ?');
    params.push(status);
  }
  if (species) {
    where.push('a.species = ?');
    params.push(species);
  }
  if (search) {
    where.push('a.name LIKE ?');
    params.push(`%${search}%`);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM animals a ${whereClause}`).get(...params).count;
  const list = db.prepare(
    `SELECT a.*, u.name as creator_name FROM animals a LEFT JOIN users u ON a.created_by = u.id ${whereClause} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, size, offset);

  res.json({ total, page: pageNum, pageSize: size, list });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const animal = db.prepare(
    `SELECT a.*, u.name as creator_name FROM animals a LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?`
  ).get(id);
  if (!animal) return res.status(404).json({ error: '动物不存在' });

  const fosters = db.prepare('SELECT * FROM foster_records WHERE animal_id = ? ORDER BY created_at DESC').all(id);
  const adoptions = db.prepare('SELECT ad.*, u.name as reviewer_name FROM adoption_records ad LEFT JOIN users u ON ad.reviewer_id = u.id WHERE ad.animal_id = ? ORDER BY ad.created_at DESC').all(id);
  const visits = db.prepare('SELECT v.*, u.name as visitor_name FROM visit_records v LEFT JOIN users u ON v.visitor_id = u.id WHERE v.animal_id = ? ORDER BY v.visit_date DESC').all(id);
  const recalls = db.prepare('SELECT r.*, u1.name as reporter_name, u2.name as handler_name FROM recall_records r LEFT JOIN users u1 ON r.reporter_id = u1.id LEFT JOIN users u2 ON r.handler_id = u2.id WHERE r.animal_id = ? ORDER BY r.created_at DESC').all(id);

  res.json({ ...animal, fosters, adoptions, visits, recalls });
});

router.post('/', (req, res) => {
  const { name, species, breed, age, gender, rescue_date, rescue_location, status, description, created_by } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const result = db.prepare(
    `INSERT INTO animals (name, species, breed, age, gender, rescue_date, rescue_location, status, description, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, species, breed || null, age || null, gender || null, rescue_date || null, rescue_location || null, status || 'rescued', description || null, created_by || null, now, now);

  const animal = db.prepare('SELECT * FROM animals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(animal);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const animal = db.prepare('SELECT * FROM animals WHERE id = ?').get(id);
  if (!animal) return res.status(404).json({ error: '动物不存在' });

  const { name, species, breed, age, gender, rescue_date, rescue_location, status, description } = req.body;
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.prepare(
    `UPDATE animals SET name = ?, species = ?, breed = ?, age = ?, gender = ?, rescue_date = ?, rescue_location = ?, status = ?, description = ?, updated_at = ? WHERE id = ?`
  ).run(
    name ?? animal.name,
    species ?? animal.species,
    breed ?? animal.breed,
    age ?? animal.age,
    gender ?? animal.gender,
    rescue_date ?? animal.rescue_date,
    rescue_location ?? animal.rescue_location,
    status ?? animal.status,
    description ?? animal.description,
    now, id
  );

  const updated = db.prepare('SELECT * FROM animals WHERE id = ?').get(id);
  res.json(updated);
});

module.exports = router;

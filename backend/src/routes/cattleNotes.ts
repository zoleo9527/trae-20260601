import { Router } from 'express'
import { AppDataSource } from '../data-source'
import { CattleNote } from '../entity/CattleNote'

const router = Router()

router.get('/', async (req, res) => {
  const { cattleId, status, type } = req.query
  const noteRepository = AppDataSource.getRepository(CattleNote)
  
  let query = noteRepository.createQueryBuilder('note')
    .leftJoinAndSelect('note.author', 'author')
  
  if (cattleId) {
    query = query.where('note.cattleId = :cattleId', { cattleId })
  }
  
  if (status) {
    query = query.andWhere('note.status = :status', { status })
  }
  
  if (type) {
    query = query.andWhere('note.type = :type', { type })
  }
  
  query = query.orderBy('note.createdAt', 'DESC')
  const notes = await query.getMany()
  res.json(notes)
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const noteRepository = AppDataSource.getRepository(CattleNote)
  const note = await noteRepository.findOne({
    where: { id: parseInt(id) },
    relations: ['author']
  })
  
  if (!note) {
    return res.status(404).json({ message: '备注不存在' })
  }
  
  res.json(note)
})

router.post('/', async (req, res) => {
  const noteRepository = AppDataSource.getRepository(CattleNote)
  const noteData: Partial<CattleNote> = req.body
  const note = noteRepository.create(noteData)
  await noteRepository.save(note)
  
  const savedNote = await noteRepository.findOne({
    where: { id: note.id },
    relations: ['author']
  })
  
  res.status(201).json(savedNote)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const noteRepository = AppDataSource.getRepository(CattleNote)
  const note = await noteRepository.findOneBy({ id: parseInt(id) })
  
  if (!note) {
    return res.status(404).json({ message: '备注不存在' })
  }
  
  Object.assign(note, req.body)
  await noteRepository.save(note)
  
  const savedNote = await noteRepository.findOne({
    where: { id: note.id },
    relations: ['author']
  })
  
  res.json(savedNote)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const noteRepository = AppDataSource.getRepository(CattleNote)
  const result = await noteRepository.delete({ id: parseInt(id) })
  
  if (result.affected === 0) {
    return res.status(404).json({ message: '备注不存在' })
  }
  
  res.json({ message: '删除成功' })
})

export default router
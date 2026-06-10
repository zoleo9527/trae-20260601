import { Router } from 'express'
import { AppDataSource } from '../data-source'
import { BreedingNote } from '../entity/BreedingNote'

const router = Router()

router.get('/', async (req, res) => {
  const { breedingRecordId, status } = req.query
  const noteRepository = AppDataSource.getRepository(BreedingNote)
  
  let query = noteRepository.createQueryBuilder('note')
    .leftJoinAndSelect('note.author', 'author')
    .leftJoinAndSelect('note.relatedCattleNote', 'relatedCattleNote')
  
  if (breedingRecordId) {
    query = query.where('note.breedingRecordId = :breedingRecordId', { breedingRecordId })
  }
  
  if (status) {
    query = query.andWhere('note.status = :status', { status })
  }
  
  query = query.orderBy('note.createdAt', 'DESC')
  const notes = await query.getMany()
  res.json(notes)
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const noteRepository = AppDataSource.getRepository(BreedingNote)
  const note = await noteRepository.findOne({
    where: { id: parseInt(id) },
    relations: ['author', 'relatedCattleNote']
  })
  
  if (!note) {
    return res.status(404).json({ message: '备注不存在' })
  }
  
  res.json(note)
})

router.post('/', async (req, res) => {
  const noteRepository = AppDataSource.getRepository(BreedingNote)
  const note = noteRepository.create(req.body)
  await noteRepository.save(note)
  
  const savedNote = await noteRepository.findOne({
    where: { id: note.id },
    relations: ['author', 'relatedCattleNote']
  })
  
  res.status(201).json(savedNote)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const noteRepository = AppDataSource.getRepository(BreedingNote)
  const note = await noteRepository.findOneBy({ id: parseInt(id) })
  
  if (!note) {
    return res.status(404).json({ message: '备注不存在' })
  }
  
  Object.assign(note, req.body)
  await noteRepository.save(note)
  
  const savedNote = await noteRepository.findOne({
    where: { id: note.id },
    relations: ['author', 'relatedCattleNote']
  })
  
  res.json(savedNote)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const noteRepository = AppDataSource.getRepository(BreedingNote)
  const result = await noteRepository.delete({ id: parseInt(id) })
  
  if (result.affected === 0) {
    return res.status(404).json({ message: '备注不存在' })
  }
  
  res.json({ message: '删除成功' })
})

export default router
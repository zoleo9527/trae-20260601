import { Router } from 'express'
import { AppDataSource } from '../data-source'
import { BreedingRecord } from '../entity/BreedingRecord'

const router = Router()

router.get('/', async (req, res) => {
  const { cowId, status, startDate, endDate } = req.query
  const recordRepository = AppDataSource.getRepository(BreedingRecord)
  
  let query = recordRepository.createQueryBuilder('record')
    .leftJoinAndSelect('record.cow', 'cow')
    .leftJoinAndSelect('record.bull', 'bull')
    .leftJoinAndSelect('record.operator', 'operator')
  
  if (cowId) {
    query = query.where('record.cowId = :cowId', { cowId })
  }
  
  if (status) {
    query = query.andWhere('record.status = :status', { status })
  }
  
  if (startDate) {
    query = query.andWhere('record.breedingDate >= :startDate', { startDate })
  }
  
  if (endDate) {
    query = query.andWhere('record.breedingDate <= :endDate', { endDate })
  }
  
  query = query.orderBy('record.breedingDate', 'DESC')
  const records = await query.getMany()
  res.json(records)
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const recordRepository = AppDataSource.getRepository(BreedingRecord)
  const record = await recordRepository.findOne({
    where: { id: parseInt(id) },
    relations: ['cow', 'bull', 'operator']
  })
  
  if (!record) {
    return res.status(404).json({ message: '繁育记录不存在' })
  }
  
  res.json(record)
})

router.post('/', async (req, res) => {
  const recordRepository = AppDataSource.getRepository(BreedingRecord)
  const recordData: Partial<BreedingRecord> = {
    ...req.body,
    breedingDate: req.body.breedingDate ? new Date(req.body.breedingDate) : undefined,
    expectedCalvingDate: req.body.expectedCalvingDate ? new Date(req.body.expectedCalvingDate) : undefined,
    actualCalvingDate: req.body.actualCalvingDate ? new Date(req.body.actualCalvingDate) : undefined,
  }
  
  if (recordData.breedingDate && !recordData.expectedCalvingDate) {
    const expectedCalvingDate = new Date(recordData.breedingDate)
    expectedCalvingDate.setDate(expectedCalvingDate.getDate() + 280)
    recordData.expectedCalvingDate = expectedCalvingDate
  }
  
  const record = recordRepository.create(recordData)
  await recordRepository.save(record)
  
  const savedRecord = await recordRepository.findOne({
    where: { id: record.id },
    relations: ['cow', 'bull', 'operator']
  })
  
  res.status(201).json(savedRecord)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const recordRepository = AppDataSource.getRepository(BreedingRecord)
  const record = await recordRepository.findOneBy({ id: parseInt(id) })
  
  if (!record) {
    return res.status(404).json({ message: '繁育记录不存在' })
  }
  
  Object.assign(record, req.body)
  
  if (req.body.breedingDate && !record.expectedCalvingDate) {
    const breedingDate = new Date(req.body.breedingDate)
    const expectedCalvingDate = new Date(breedingDate)
    expectedCalvingDate.setDate(expectedCalvingDate.getDate() + 280)
    record.expectedCalvingDate = expectedCalvingDate
  }
  
  await recordRepository.save(record)
  
  const savedRecord = await recordRepository.findOne({
    where: { id: record.id },
    relations: ['cow', 'bull', 'operator']
  })
  
  res.json(savedRecord)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const recordRepository = AppDataSource.getRepository(BreedingRecord)
  const result = await recordRepository.delete({ id: parseInt(id) })
  
  if (result.affected === 0) {
    return res.status(404).json({ message: '繁育记录不存在' })
  }
  
  res.json({ message: '删除成功' })
})

export default router
import { Router } from 'express'
import { AppDataSource } from '../data-source'
import { Cattle } from '../entity/Cattle'

const router = Router()

router.get('/', async (req, res) => {
  const { status, keyword } = req.query
  const cattleRepository = AppDataSource.getRepository(Cattle)
  
  let query = cattleRepository.createQueryBuilder('cattle')
  
  if (status) {
    query = query.where('cattle.status = :status', { status })
  }
  
  if (keyword) {
    query = query.andWhere(
      'cattle.tagNumber LIKE :keyword OR cattle.breed LIKE :keyword',
      { keyword: `%${keyword}%` }
    )
  }
  
  const cattle = await query.getMany()
  res.json(cattle)
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const cattleRepository = AppDataSource.getRepository(Cattle)
  const cattle = await cattleRepository.findOneBy({ id: parseInt(id) })
  
  if (!cattle) {
    return res.status(404).json({ message: '牛只不存在' })
  }
  
  res.json(cattle)
})

router.post('/', async (req, res) => {
  const cattleRepository = AppDataSource.getRepository(Cattle)
  const cattleData: Partial<Cattle> = {
    ...req.body,
    birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
  }
  const cattle = cattleRepository.create(cattleData)
  await cattleRepository.save(cattle)
  res.status(201).json(cattle)
})

router.put('/:id', async (req, res) => {
  const { id } = req.params
  const cattleRepository = AppDataSource.getRepository(Cattle)
  const cattle = await cattleRepository.findOneBy({ id: parseInt(id) })
  
  if (!cattle) {
    return res.status(404).json({ message: '牛只不存在' })
  }
  
  Object.assign(cattle, req.body)
  await cattleRepository.save(cattle)
  res.json(cattle)
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const cattleRepository = AppDataSource.getRepository(Cattle)
  const result = await cattleRepository.delete({ id: parseInt(id) })
  
  if (result.affected === 0) {
    return res.status(404).json({ message: '牛只不存在' })
  }
  
  res.json({ message: '删除成功' })
})

export default router
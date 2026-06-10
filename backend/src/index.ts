import express from 'express'
import cors from 'cors'
import { AppDataSource } from './data-source'
import authRoutes from './routes/auth'
import cattleRoutes from './routes/cattle'
import cattleNotesRoutes from './routes/cattleNotes'
import breedingRoutes from './routes/breeding'
import breedingNotesRoutes from './routes/breedingNotes'
import { User } from './entity/User'
import { Cattle } from './entity/Cattle'
import { CattleNote } from './entity/CattleNote'
import { BreedingRecord } from './entity/BreedingRecord'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/cattle', cattleRoutes)
app.use('/api/cattle-notes', cattleNotesRoutes)
app.use('/api/breeding', breedingRoutes)
app.use('/api/breeding-notes', breedingNotesRoutes)

AppDataSource.initialize().then(async () => {
  await initializeMockData()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}).catch(error => console.log(error))

async function initializeMockData() {
  const userRepository = AppDataSource.getRepository(User)
  const cattleRepository = AppDataSource.getRepository(Cattle)
  const noteRepository = AppDataSource.getRepository(CattleNote)
  const breedingRepository = AppDataSource.getRepository(BreedingRecord)

  const existingUsers = await userRepository.count()
  if (existingUsers === 0) {
    const users = [
      { username: 'manager', password: '123456', role: 'manager' as const, name: '张主管' },
      { username: 'milker', password: '123456', role: 'milker' as const, name: '李挤奶员' },
      { username: 'vet', password: '123456', role: 'vet' as const, name: '王兽医' },
    ]
    await userRepository.save(users)
    console.log('Mock users created')
  }

  const existingCattle = await cattleRepository.count()
  if (existingCattle === 0) {
    const cattle = [
      { tagNumber: 'C001', breed: '荷斯坦', birthDate: '2020-05-15', gender: '母', status: 'healthy' as const, weight: 650, location: 'A区-1号栏' },
      { tagNumber: 'C002', breed: '荷斯坦', birthDate: '2021-03-20', gender: '母', status: 'pregnant' as const, weight: 580, location: 'A区-2号栏' },
      { tagNumber: 'C003', breed: '西门塔尔', birthDate: '2019-11-10', gender: '公', status: 'healthy' as const, weight: 850, location: 'B区-1号栏' },
      { tagNumber: 'C004', breed: '荷斯坦', birthDate: '2022-01-05', gender: '母', status: 'sick' as const, weight: 420, location: '隔离区' },
      { tagNumber: 'C005', breed: '夏洛莱', birthDate: '2020-08-22', gender: '母', status: 'calving' as const, weight: 620, location: '产房' },
      { tagNumber: 'C006', breed: '荷斯坦', birthDate: '2021-06-18', gender: '母', status: 'healthy' as const, weight: 560, location: 'A区-3号栏' },
      { tagNumber: 'C007', breed: '西门塔尔', birthDate: '2018-09-05', gender: '公', status: 'healthy' as const, weight: 920, location: 'B区-2号栏' },
      { tagNumber: 'C008', breed: '荷斯坦', birthDate: '2022-04-12', gender: '母', status: 'healthy' as const, weight: 480, location: 'A区-4号栏' },
    ]
    await cattleRepository.save(cattle)
    console.log('Mock cattle created')
  }

  const existingNotes = await noteRepository.count()
  if (existingNotes === 0) {
    const manager = await userRepository.findOneBy({ username: 'manager' })
    const milker = await userRepository.findOneBy({ username: 'milker' })
    const vet = await userRepository.findOneBy({ username: 'vet' })
    
    if (manager && milker && vet) {
      const notes = [
        { cattleId: 1, authorId: milker.id, type: 'health' as const, content: '今日挤奶正常，产奶量32L', status: 'resolved' as const },
        { cattleId: 2, authorId: manager.id, type: 'breeding' as const, content: '已安排人工授精，等待确认受孕情况', status: 'pending' as const, assigneeId: vet.id },
        { cattleId: 4, authorId: milker.id, type: 'health' as const, content: '发现食欲不振，精神萎靡', status: 'processing' as const, assigneeId: vet.id, dueDate: '2024-01-15' },
        { cattleId: 5, authorId: vet.id, type: 'treatment' as const, content: '预计今日产犊，已做好接产准备', status: 'processing' as const },
        { cattleId: 1, authorId: vet.id, type: 'treatment' as const, content: '疫苗接种完成，状态良好', status: 'resolved' as const },
        { cattleId: 6, authorId: milker.id, type: 'feeding' as const, content: '饲料摄入量减少，建议检查', status: 'pending' as const },
      ]
      await noteRepository.save(notes)
      console.log('Mock cattle notes created')
    }
  }

  const existingBreeding = await breedingRepository.count()
  if (existingBreeding === 0) {
    const manager = await userRepository.findOneBy({ username: 'manager' })
    
    if (manager) {
      const records = [
        { cowId: 2, bullId: 3, type: 'artificial' as const, breedingDate: '2024-01-05', status: 'completed' as const, expectedCalvingDate: '2024-10-11', operatorId: manager.id },
        { cowId: 6, bullId: 7, type: 'natural' as const, breedingDate: '2024-01-10', status: 'planned' as const, operatorId: manager.id },
        { cowId: 1, bullId: 3, type: 'artificial' as const, breedingDate: '2023-06-15', status: 'successful' as const, expectedCalvingDate: '2024-03-21', actualCalvingDate: '2024-03-18', calfTagNumber: 'C009', operatorId: manager.id },
      ]
      await breedingRepository.save(records)
      console.log('Mock breeding records created')
    }
  }
}
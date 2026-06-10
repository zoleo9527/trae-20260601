import { Router } from 'express'
import { AppDataSource } from '../data-source'
import { User } from '../entity/User'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const userRepository = AppDataSource.getRepository(User)
  const user = await userRepository.findOneBy({ username })
  
  if (!user || user.password !== password) {
    return res.status(401).json({ message: '用户名或密码错误' })
  }
  
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  })
})

router.get('/users', async (req, res) => {
  const userRepository = AppDataSource.getRepository(User)
  const users = await userRepository.find()
  res.json(users.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role })))
})

export default router
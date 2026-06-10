import { Router, type Request, type Response } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { userService } from '../services/userService'

const router = Router()

router.get('/', async (req: Request<ParamsDictionary, any, any, Query & { role?: string }>, res: Response) => {
  try {
    const { role } = req.query
    const users = await userService.getUsersByRole(role || undefined)
    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    })
  }
})

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    })
  }
})

export default router
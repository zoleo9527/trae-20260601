import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { pregnancyTests as initialTests, farrowingRooms as initialRooms } from '../data/mockData'

const TESTS_STORAGE_KEY = 'pregnancy_tests'
const ROOMS_STORAGE_KEY = 'farrowing_rooms'

const GlobalStoreContext = createContext()

export function GlobalStoreProvider({ children }) {
  const [tests, setTests] = useState(() => {
    const stored = localStorage.getItem(TESTS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return initialTests
  })

  const [rooms, setRooms] = useState(() => {
    const stored = localStorage.getItem(ROOMS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    return initialRooms
  })

  useEffect(() => {
    localStorage.setItem(TESTS_STORAGE_KEY, JSON.stringify(tests))
  }, [tests])

  useEffect(() => {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms))
  }, [rooms])

  const addTest = useCallback((test) => {
    const newTest = {
      ...test,
      id: `PT${String(tests.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      history: [
        {
          time: new Date().toLocaleString('zh-CN'),
          action: '提交妊检结果',
          operator: test.handler,
          remark: test.remarks || '提交检测结果',
        },
      ],
    }
    setTests([newTest, ...tests])
    return newTest
  }, [tests])

  const updateTestStatus = useCallback((testId, status, operator, remark) => {
    setTests(tests.map(test => {
      if (test.id === testId) {
        const statusDesc = status === 'approved' ? '已确认' : status === 'rejected' ? '已驳回' : '待审核'
        return {
          ...test,
          status,
          statusDesc,
          updatedAt: new Date().toLocaleString('zh-CN'),
          history: [
            ...test.history,
            {
              time: new Date().toLocaleString('zh-CN'),
              action: status === 'approved' ? '场长批准' : status === 'rejected' ? '场长驳回' : '繁育员审核',
              operator,
              remark,
            },
          ],
        }
      }
      return test
    }))
  }, [tests])

  const updateTest = useCallback((testId, updates) => {
    setTests(tests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          ...updates,
          updatedAt: new Date().toLocaleString('zh-CN'),
          history: [
            ...test.history,
            {
              time: new Date().toLocaleString('zh-CN'),
              action: '编辑妊检结果',
              operator: updates.handler || test.handler,
              remark: updates.remarks ? `修改备注: ${updates.remarks}` : '编辑记录',
            },
          ],
        }
      }
      return test
    }))
  }, [tests])

  const assignTestToRoom = useCallback((testId, roomId) => {
    setTests(tests.map(test => {
      if (test.id === testId) {
        return {
          ...test,
          farrowingRoomId: roomId,
          updatedAt: new Date().toLocaleString('zh-CN'),
          history: [
            ...test.history,
            {
              time: new Date().toLocaleString('zh-CN'),
              action: '分配产房',
              operator: '系统',
              remark: `已分配到产房 ${roomId}`,
            },
          ],
        }
      }
      return test
    }))
  }, [tests])

  const addRoom = useCallback((room) => {
    const newRoom = {
      ...room,
      id: `FR${String(rooms.length + 1).padStart(3, '0')}`,
      occupiedBeds: 0,
      status: 'empty',
      statusDesc: '空闲',
      createdAt: new Date().toLocaleString('zh-CN'),
      updatedAt: new Date().toLocaleString('zh-CN'),
      history: [
        {
          time: new Date().toLocaleString('zh-CN'),
          action: '创建产房',
          operator: room.handler,
          remark: `新建${room.roomNumber}`,
        },
      ],
      assignments: [],
    }
    setRooms([newRoom, ...rooms])
    return newRoom
  }, [rooms])

  const addAssignment = useCallback((roomId, assignment) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const newAssignment = {
          ...assignment,
          id: `FA${String(Date.now()).slice(-3)}`,
          createdAt: new Date().toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'),
          history: [
            {
              time: new Date().toLocaleString('zh-CN'),
              action: '创建安排',
              operator: assignment.handler,
              remark: `安排${assignment.sowNumber}到${room.roomNumber}${assignment.bedNumber}号床位`,
            },
          ],
        }
        return {
          ...room,
          occupiedBeds: room.occupiedBeds + 1,
          status: room.occupiedBeds + 1 >= room.bedCount ? 'full' : 'normal',
          statusDesc: room.occupiedBeds + 1 >= room.bedCount ? '已满' : '正常使用',
          updatedAt: new Date().toLocaleString('zh-CN'),
          history: [
            ...room.history,
            {
              time: new Date().toLocaleString('zh-CN'),
              action: '安排母猪',
              operator: assignment.handler,
              remark: `安排${assignment.sowNumber}进入产房`,
            },
          ],
          assignments: [...room.assignments, newAssignment],
        }
      }
      return room
    }))
  }, [rooms])

  const updateAssignmentStatus = useCallback((roomId, assignmentId, status, operator, remark) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const actionText = status === 'confirmed' ? '确认安排' : '取消安排'
        return {
          ...room,
          updatedAt: new Date().toLocaleString('zh-CN'),
          history: [
            ...room.history,
            {
              time: new Date().toLocaleString('zh-CN'),
              action: actionText,
              operator,
              remark,
            },
          ],
          assignments: room.assignments.map(assign => {
            if (assign.id === assignmentId) {
              return {
                ...assign,
                status,
                statusDesc: status === 'confirmed' ? '已确认' : '待确认',
                updatedAt: new Date().toLocaleString('zh-CN'),
                history: [
                  ...assign.history,
                  {
                    time: new Date().toLocaleString('zh-CN'),
                    action: status === 'confirmed' ? '场长确认' : '取消确认',
                    operator,
                    remark,
                  },
                ],
              }
            }
            return assign
          }),
        }
      }
      return room
    }))
  }, [rooms])

  return (
    <GlobalStoreContext.Provider value={{
      tests,
      rooms,
      addTest,
      updateTestStatus,
      updateTest,
      assignTestToRoom,
      addRoom,
      addAssignment,
      updateAssignmentStatus,
    }}>
      {children}
    </GlobalStoreContext.Provider>
  )
}

export function useGlobalStore() {
  const context = useContext(GlobalStoreContext)
  if (!context) {
    throw new Error('useGlobalStore must be used within a GlobalStoreProvider')
  }
  return context
}
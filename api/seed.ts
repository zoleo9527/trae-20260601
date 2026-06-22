import crypto from 'crypto'

const H = (s: string) => Buffer.from(s, 'hex').toString('utf8')

export function seedDatabase(db: any) {
  const p1Id = crypto.randomUUID()
  const p2Id = crypto.randomUUID()
  const p3Id = crypto.randomUUID()

  const insertProject = db.prepare('INSERT INTO projects (id, name, location, status) VALUES (?, ?, ?, ?)')

  insertProject.run(p1Id, H('e68792e685a7e59bade58cbae4b880e69c9fe5ae89e998b2e5b7a5e7a88b'), H('e58c97e4baace5b882e6b5b7e6b780e58cbae4b8ade585b3e69d91e8b7afe4b883e58fb7e999a2'), 'active')
  insertProject.run(p2Id, H('e59586e4b89ae4b8ade5bf83e79b91e68ea7e694b9e980a0e9a1b9e79bae'), H('e4b88ae6b5b7e5b882e6b5a6e4b89ce696b0e58cbae59586e4b89ae7bbbce58987e4bd93'), 'active')
  insertProject.run(p3Id, H('e5ada6e6a0a1e5ae89e998b2e58d87e7baa7e5b7a5e7a88b'), H('e5b9bfe5b79ee5b882e5a4a9e6b2b3e58cbae58d8ee58d97e5b888e88c83e5a4a7e5ada6'), 'active')

  const t1Id = crypto.randomUUID()
  const t2Id = crypto.randomUUID()
  const t3Id = crypto.randomUUID()
  const t4Id = crypto.randomUUID()

  const insertTest = db.prepare('INSERT INTO joint_tests (id, project_id, title, status, executor, planned_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')

  insertTest.run(t1Id, p1Id, H('e7acace4b880e998b6e6aeb5e8a786e9a291e79b91e68ea7e88194e8b083e6b58be8af95'), 'failed', H('e5bca0e4bc9f'), '2025-06-01 09:00:00', '2025-06-01 16:30:00')
  insertTest.run(t2Id, p1Id, H('e997a8e7a681e7b3bbe7bb9fe88194e8b083e6b58be8af95'), 'passed', H('e5bca0e4bc9f'), '2025-06-02 09:00:00', '2025-06-02 15:00:00')
  insertTest.run(t3Id, p2Id, H('e79b91e68ea7e4b8ade5bf83e695b0e68daee88194e8b083'), 'in_progress', H('e69d8ee5bcba'), '2025-06-03 09:00:00', null)
  insertTest.run(t4Id, p3Id, H('e59fbae5b182e7bd91e7bb9ce68ea5e585a5e88194e8b083e6b58be8af95'), 'pending', H('e78e8be6988e'), '2025-06-05 09:00:00', null)

  const insertItem = db.prepare('INSERT INTO test_items (id, test_id, name, expected_result, actual_result, passed, remark, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')

  const t1Items = [
    { name: H('e8a786e9a291e4bfa1e58fb7e88ea5aa8e58887e68da2'), expected: H('e88ea5aa8e58887e68da2e5b7b2e6ada3e7a1aee79a84e5908ee7abafe68890e58a9f'), actual: H('e88ea5aa8e58887e68da2e6ada3e5b88be590ee68890e58a9f'), passed: 0, remark: H('e5bbb6e8bf9fe8be83e9ab98') },
    { name: H('e4ba91e58fb0e5ad98e582a8e58a9fe883bd'), expected: H('e4ba91e58fb0e8a786e9a291e5ad98e582a8e58f8ae59b9ee694be'), actual: H('e5ad98e582a8e68890e58a9fe59b9ee694bee6ada3e5b88b'), passed: 1, remark: '' },
    { name: H('e68aa5e8ada6e88194e58aa8e6b58be8af95'), expected: H('e7aea1e79086e58fa0e89fa6e58f91e4b880e6ada5e68aa5e8ada6e88194e58aa8e68890e58a9f'), actual: H('e7a1aee8aea4e4b880e6ada5e88194e58aa8e68890e58a9f'), passed: 1, remark: '' },
    { name: H('e8a786e9a291e58886e8bea8e78e87e4b88ae99990'), expected: H('e68aa5e8ada6e5908e10e7a792e4bba5e58685e58f8ae5b195e4ba8ee8a786e9a291e4b88ae4bca0e9a1b9e58d95'), actual: H('e69caae883bde58f8ae697b6e4b88ae4bca0e68aa5e8ada6e8a786e9a291'), passed: 0, remark: H('e7bd91e7bb9ce4b88de7a8b3e5ae9ae5afbce887b4e4b88ae4bca0e5a4b1e8b4a5') },
  ]

  t1Items.forEach((item: any, i: number) => {
    insertItem.run(crypto.randomUUID(), t1Id, item.name, item.expected, item.actual, item.passed, item.remark, i)
  })

  const t2Items = [
    { name: H('e997a8e7a681e5b88be8a784e5bc80e997a8e696b9e5bc8fe6b58be8af95'), expected: H('e5938de5ba94e697b6e997b4e5b08fe4ba8e500ms'), actual: H('e5938de5ba94e697b6e997b4300ms'), passed: 1, remark: '' },
    { name: H('e58aa0e5af86e69d83e99990e68ea7e588b6'), expected: H('e58fafe6ada3e5b88be68d88e69d83e58886e7bb84e58f91e8b5b7e5bc80e997a8'), actual: H('e69d83e99990e68ea7e588b6e6ada3e5b88b'), passed: 1, remark: '' },
    { name: H('e8bf9ce7a88be5bc80e997a8e58a9fe883bd'), expected: H('e8bf9ce7a88be68aa5e8ada6e58fafe89fa6e58f91e4bba5e5908ce5bc80e997a8e58aa8e4bd9c'), actual: H('e8bf9ce7a88be5bc80e997a8e6ada3e5b88b'), passed: 1, remark: '' },
    { name: H('e5bc82e5b88be5a484e79086e69cbae588b6'), expected: H('e69caae68d88e69d83e58d81e588b7e58d81e68b92e7bb9de5b9b6e8aeb0e5bd95e697a5e5bf97'), actual: H('e69caae68d88e69d83e68b92e7bb9de6ada3e5b88b'), passed: 1, remark: '' },
    { name: H('e88194e58aa8e8aeb0e5bd95'), expected: H('e68ea7e588b6e58fb0e8aeb0e5bd95e588b0e4b880e6ada530e5a4a9'), actual: H('e8aeb0e5bd95e5ae8ce695b4e58fafe69fa5'), passed: 1, remark: '' },
  ]

  t2Items.forEach((item: any, i: number) => {
    insertItem.run(crypto.randomUUID(), t2Id, item.name, item.expected, item.actual, item.passed, item.remark, i)
  })

  const t3Items = [
    { name: H('e7bd91e7bb9ce4ba92e9809ae88194e8b083e6b58be8af95'), expected: H('e7bd91e7bb9ce88194e9809ae5928ce5bd93e5928ce88194e8b083e6b58be8af95e8aeb0e5bd95'), actual: null, passed: null, remark: '' },
    { name: H('e69d83e99990e6b58be8af95e689b9e68f90e7a4ba'), expected: H('e69d83e99990e7a1aee8aea4e5bd93e5908ce5aea1e689b9e7acace6b58be8af95e689b9e68f90e7a4ba'), actual: null, passed: null, remark: '' },
    { name: H('e7bd91e7bb9ce697b6e997b4e5908ce6ada5e6b58be8af95'), expected: H('e7a1aee8aea4e5928ce5bd93e5928ce88194e8b083e697b6e997b4e6b58be8af95'), actual: null, passed: null, remark: '' },
  ]

  t3Items.forEach((item: any, i: number) => {
    insertItem.run(crypto.randomUUID(), t3Id, item.name, item.expected, item.actual, item.passed, item.remark, i)
  })

  const t4Items = [
    { name: H('e4babae59198e5b9b6e4baa4e4bba5e88194e58aa8e6b58be8af95'), expected: H('e7a1aee8aea4e58f91e5bbb6e8a784e58886e5928ce7a1aee8ae4e88194e8b083e6b58be8af95e8aeb0e5bd95'), actual: null, passed: null, remark: '' },
    { name: H('e6b58fe8a788e58f91e697a5e7b2bee5ba94e79a84e7a4bae4be8b'), expected: H('e7a1aee8aea4e58f91e697a5e695b0e68daee5bbb6e588b6e4baa4e695b0e68daee587bae7babf'), actual: null, passed: null, remark: '' },
    { name: H('e5b7a5e587bae698bee7a4bae6b58be8af95e689b9e68f90'), expected: H('e6b58be8af95e585b3e9a1b9e7a1aee8aea4e5908ce88194e58aa8e4bba5e5908ce6b58be8af95e585abe88194e58aa8e59d87e5a29e'), actual: null, passed: null, remark: '' },
    { name: H('e6b58be8af95e88ea5aa8e689b9e68f90e7a4ba'), expected: H('e6b58be8af95e7a1aee8aea4e5b7b2e9878fe68a8de8aeb0e585b3e69687e69caae6ada3e5b88be88ea5aa8e79a84e88ea5aa8'), actual: null, passed: null, remark: '' },
  ]

  t4Items.forEach((item: any, i: number) => {
    insertItem.run(crypto.randomUUID(), t4Id, item.name, item.expected, item.actual, item.passed, item.remark, i)
  })

  const failedItems = db.prepare('SELECT * FROM test_items WHERE test_id = ? AND passed = 0').all(t1Id)

  const insertIssue = db.prepare('INSERT INTO issues (id, test_id, test_item_id, project_id, title, severity, status, assignee, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')

  const issues: any[] = []
  if (failedItems.length > 0) {
    const iss1Id = crypto.randomUUID()
    insertIssue.run(iss1Id, t1Id, failedItems[0].id, p1Id, H('e8a786e9a291e4bfa1e58fb7e88ea5aa8e5b9b4e5bbb6e8bf9fe5bc82e5b888'), 'major', 'pending_assign', null, H('e8a786e9a291e4bfa1e58fb7e88ea5aa8e58887e68da2e6ada3e5b88be5908ee7abafe5928ce6ada3e5b88be58f91e68081efbc8ce8bf87e58886e9888de8aea1e69c89e69588'))
    issues.push(iss1Id)

    if (failedItems.length > 1) {
      const iss2Id = crypto.randomUUID()
      insertIssue.run(iss2Id, t1Id, failedItems[1].id, p1Id, H('e8a786e9a291e58886e8bea8e78e87e4b88ae99990e4ba8ce4b88ae99990e5ba94'), 'critical', 'in_progress', H('e8b583e5b7a5'), H('e7a1aee8aea4e69bb4e696b0e69687e69caae5b9b4e5ae89e585a8e69caae7a1aee8aea4e5bd93e99499e8afaf9e58886e8bea8e78e87e4b88ae99990e4b88ae99990e4ba8ce58f91e9878cefbc8ce5afb9e5ba94e69da5e6af94'))
      issues.push(iss2Id)
    }
  }

  const iss3Id = crypto.randomUUID()
  insertIssue.run(iss3Id, null, null, p2Id, H('e79b91e68ea7e4b8ade5bf83e5b9b6e4baa4e6ada3e5b88be5b19ee680a7e5928c'), 'major', 'pending_verify', H('e69d8ee5bcba'), H('e5b9b6e8bf87e8a1a8e4b8bae7a1aee8aea4e588b6e7bd91e7bb9ce5928ce7bd91e7bb9ce7a1aee8aea4e58f91e68081e58f96e5bd93e58886e589a9e7bd91e7bb9ce58a9fe58fb0'))
  issues.push(iss3Id)

  const insertProgress = db.prepare('INSERT INTO issue_progresses (id, issue_id, description, operator, action_type) VALUES (?, ?, ?, ?, ?)')

  if (issues.length >= 2) {
    insertProgress.run(crypto.randomUUID(), issues[1], H('e5bc80e58f91e68993e980a0e7bd91e7bb9ce4bb8ee5a484e794a8e6a8a1e58b8b/e695b0e68dae'), H('e69d8ee5bcba'), 'complete')
  }

  if (issues.length >= 3) {
    insertProgress.run(crypto.randomUUID(), issues[2], H('e5b7b2e588b6e5b9b6e4baa4e58f82e88194e58aa8e695b0e38082e8afa5e58f96e6b688e7bd91e7bb9ce5908c'), H('e69d8ee5bcba'), 'complete')
  }

  const insertLog = db.prepare('INSERT INTO operation_logs (id, entity_type, entity_id, action, operator_role, operator_name, detail) VALUES (?, ?, ?, ?, ?, ?, ?)')

  insertLog.run(crypto.randomUUID(), 'test', t1Id, 'create', 'pm', H('e5bca0e7bb8fe79086'), H('e5889be5bbbae5908ee8a786e9a291e79b91e68ea7e88194e8b083e6b58be8af95'))
  insertLog.run(crypto.randomUUID(), 'test', t1Id, 'complete', 'captain', H('e8b583e9989fe995bf'), H('e5ae8ce68890e8a786e9a291e79b91e68ea7e88194e8b083e88ea5aa8efbc8ce69caae5a48de4b880e697a5e4b8ad'))
  insertLog.run(crypto.randomUUID(), 'test', t2Id, 'create', 'pm', H('e5bca0e7bb8fe79086'), H('e5889be5bbbae5908ee997a8e7a681e7b3bbe7bb9fe88194e8b083e6b58be8af95'))
  insertLog.run(crypto.randomUUID(), 'test', t2Id, 'complete', 'captain', H('e8b583e9989fe995bf'), H('e5ae8ce68890e997a8e7a681e7b3bbe7bb9fe88194e8b083e696b0e58f91efbc8ce585a8e5aeb9e59088e5bd93'))
  insertLog.run(crypto.randomUUID(), 'test', t3Id, 'create', 'pm', H('e69d8ee7bb8fe79086'), H('e5889be5bbbae5908ee79b91e68ea7e4b8ade5bf83e695b0e68daee88194e8b083'))
  insertLog.run(crypto.randomUUID(), 'test', t4Id, 'create', 'pm', H('e78e8be7bb8fe79086'), H('e5889be5bbbae5908ee59fbae5b182e7bd91e7bb9ce68ea5e585a5e88194e8b083e6b58be8af95'))

  if (issues.length >= 1) {
    insertLog.run(crypto.randomUUID(), 'issue', issues[0], 'create', 'pm', H('e5bca0e7bb8fe79086'), H('e5889be5bbbae5908ee8a786e9a291e4bfa1e58fb7e88ea5aa8e5b9b4e5bbb6e8bf9fe5bc82e5b888'))
  }
  if (issues.length >= 2) {
    insertLog.run(crypto.randomUUID(), 'issue', issues[1], 'assign', 'pm', H('e5bca0e7bb8fe79086'), H('e58886e9858de7bb99e8b583e5b7a5'))
    insertLog.run(crypto.randomUUID(), 'issue', issues[1], 'progress', 'engineer', H('e69d8ee5bcba'), H('e5bc80e58f91e68993e980a0e7bd91e7bb9ce4bb8ee5a484e794a8e6a8a1e58b8b/e695b0e68dae'))
  }
  if (issues.length >= 3) {
    insertLog.run(crypto.randomUUID(), 'issue', issues[2], 'assign', 'pm', H('e69d8ee7bb8fe79086'), H('e58886e9858de7bb99e69d8ee5bcba'))
    insertLog.run(crypto.randomUUID(), 'issue', issues[2], 'complete', 'engineer', H('e69d8ee5bcba'), H('e5b7b2e588b6e5b9b6e4baa4e58f82e88194e58aa8e695b0e38082e8afa5e58f96e6b688e7bd91e7bb9ce5908c'))
  }
}

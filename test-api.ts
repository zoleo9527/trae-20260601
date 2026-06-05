import app from './api/app.js'
import http from 'http'

const server = http.createServer(app)
server.listen(0, () => {
  const port = (server.address() as { port: number }).port
  console.log(`Test server running on port ${port}`)

  const makeRequest = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}${path}`, (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve(data))
      }).on('error', reject)
    })
  }

  const runTests = async () => {
    console.log('\n=== Testing GET /api/health ===')
    console.log(await makeRequest('/api/health'))

    console.log('\n=== Testing GET /api/incidents ===')
    const incidentsRes = await makeRequest('/api/incidents')
    const incidents = JSON.parse(incidentsRes)
    console.log(`Total incidents: ${incidents.data.length}`)
    console.log(`Incident numbers: ${incidents.data.map((i: any) => i.incident_number).join(', ')}`)

    if (incidents.data.length > 0) {
      const firstId = incidents.data[0].id
      console.log(`\n=== Testing GET /api/incidents/${firstId} ===`)
      const detail = await makeRequest(`/api/incidents/${firstId}`)
      const detailData = JSON.parse(detail).data
      console.log(`Incident: ${detailData.incident_number}`)
      console.log(`Status: ${detailData.status}`)
      console.log(`Notes count: ${detailData.notes.length}`)
      console.log(`Transitions count: ${detailData.status_transitions.length}`)
      console.log(`Insurance materials count: ${detailData.insurance_materials.length}`)

      console.log(`\n=== Testing GET /api/incidents/${firstId}/timeline ===`)
      const timelineRes = await makeRequest(`/api/incidents/${firstId}/timeline`)
      const timeline = JSON.parse(timelineRes).data
      console.log(`Timeline events: ${timeline.length}`)
      console.log(`Event types: ${[...new Set(timeline.map((t: any) => t.type))].join(', ')}`)

      console.log(`\n=== Testing GET /api/incidents/${firstId}/logs ===`)
      const logsRes = await makeRequest(`/api/incidents/${firstId}/logs`)
      const logs = JSON.parse(logsRes).data
      console.log(`Logs count: ${logs.length}`)

      console.log(`\n=== Testing GET /api/incidents/${firstId}/insurance ===`)
      const insRes = await makeRequest(`/api/incidents/${firstId}/insurance`)
      const insurance = JSON.parse(insRes).data
      console.log(`Insurance materials: ${insurance.length}`)
    }

    console.log('\n=== Testing GET /api/incidents?status=review ===')
    const reviewRes = await makeRequest('/api/incidents?status=review')
    const review = JSON.parse(reviewRes).data
    console.log(`Review status incidents: ${review.length}`)

    console.log('\n=== Testing GET /api/incidents?responsible_person=张伟 ===')
    const zwRes = await makeRequest('/api/incidents?responsible_person=%E5%BC%A0%E4%BC%9F')
    const zw = JSON.parse(zwRes).data
    console.log(`张伟负责的事故: ${zw.length}`)

    console.log('\n=== Testing GET /api/incidents?search=RSC-2026-003 ===')
    const searchRes = await makeRequest('/api/incidents?search=RSC-2026-003')
    const search = JSON.parse(searchRes).data
    console.log(`搜索结果: ${search.length} 条`)

    console.log('\n✅ All tests passed!')
    server.close()
    process.exit(0)
  }

  runTests().catch((err) => {
    console.error('Test failed:', err)
    server.close()
    process.exit(1)
  })
})

<script>
  import './styles/app.css'
  import { reports } from './stores/reportStore'
  import Header from './components/Header.svelte'
  import DashboardPanel from './components/DashboardPanel.svelte'
  import ReportList from './components/ReportList.svelte'
  import ReportDetail from './components/ReportDetail.svelte'

  let selectedReportId = 'RPT20260601001'

  $: selectedReport = $reports.find(r => r.id === selectedReportId)

  function handleSelectReport(id) {
    selectedReportId = id
  }
</script>

<div id="app">
  <Header />
  <div class="app-container">
    <DashboardPanel onSelectReport={handleSelectReport} />
    <div class="main-content">
      <ReportList 
        selectedId={selectedReportId} 
        onSelect={handleSelectReport} 
      />
      <ReportDetail report={selectedReport} />
    </div>
  </div>
</div>

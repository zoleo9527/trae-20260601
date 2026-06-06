<script>
  import { orders, statusLabels, statusColors, calculateProfit } from './data/mockData.js'
  import OrderList from './components/OrderList.svelte'
  import RateDiffPanel from './components/RateDiffPanel.svelte'
  import ProfitReview from './components/ProfitReview.svelte'
  import BatchActions from './components/BatchActions.svelte'
  import OrderDetail from './components/OrderDetail.svelte'

  let currentView = 'dashboard'
  let selectedOrder = null
  let orderList = orders.map(o => ({ ...o, selected: false }))

  $: allSelected = orderList.length > 0 && orderList.every(o => o.selected)
  $: selectedCount = orderList.filter(o => o.selected).length

  function toggleSelectAll() {
    const newValue = !allSelected
    orderList = orderList.map(o => ({ ...o, selected: newValue }))
  }

  function toggleSelect(id) {
    orderList = orderList.map(o => o.id === id ? { ...o, selected: !o.selected } : o)
  }

  function viewOrder(order) {
    selectedOrder = order
    curre<script>
  import { orders, statn   importa  import OrderList from './components/OrderList.svelte'
  import RateDiffPanel from './cow)  import RateDiffPanel from './components/RateDiffPane

  import ProfitReview from './components/ProfitReview.svelte'
Li  import BatchActions from './components/BatchActions.svelte:   import OrderDetail from './components/OrderDetail.svelte'
0

  let currentView = 'dashboard'
  let selectedOrder = nul
    let selectedOrder = null
  l    let orderList = orders.Am
  $: allSelected = orderList.length > 0 && orderList.every(oo.d  $: selectedCount = orderList.filter(o => o.selected).length

  function s(
  function toggleSelectAll() {
    const newValue = !allSel{
     const newValue = !allSele      orderList = orderList.map(o :   }

  function toggleSelect(id) {
    orderList = orderList.map(??
 
      orderList = orderList.m?? }

  function viewOrder(order) {
    selectedOrder = order
    curre<script>
  imp  
        selectedOrder = order
  ne    curre<script>
  impos,  import { order }  import RateDiffPanel from './cow)  import RateDiffPanel from './components/RateDiffPandO
  import ProfitReview from './components/ProfitReview.svelte'
Li  import BatchActions fs) Li  import BatchActions from './components/BatchActions.sveler0

  let currentView = 'dashboard'
  let selectedOrder = nul
    let selectedOrder = null
  l    let orderList = orders.Am?状? let selectedOrder = nul
     '    let selectedOrder =  r  l    let orderList = ordest  $: allSelected = orderList.le }
  function s(
  function toggleSelectAll() {
    const newValue = !allSel{
     const newValue = !allSele      orderList =/sc  function te>
  * { box-sizing: border-box;      const newValue = !allSeod
  function toggleSelect(id) {
    orderList = orderList.map(??
 
  to,    orderList = orderList.maf7 
      orderList = orderList.mmin-
  function viewOrder(order) {
   rou    selectedOrder = order
  #1    curre<script>
  imp  c  imp  
      addi      px  ne    curre<script; align-it  impos,  import { o-c  import ProfitReview from './components/ProfitReview.svelte'
Li  import BatchActions fs) Li  import BatchActions f
 Li  import BatchActions fs) Li  import BatchActions from './op
  let currentView = 'dashboard'
  let selectedOrder = nul
    let selectedOrder = null
  0.1  let selectedOrder = nul
     p    let selectedOrder = -r  l    let orderList = orde;      '    let selectedOrder =  r  l    let orderList = ordest .  function s(
  function toggleSelectAll() {
    const newValue = !allSel{
     const newValu 1  function tn: 0 auto; }
  .stats-grid { disp     const newValue = !allSeum  * { box-sizing: border-box;      const newValue = !allSeod
  to  function toggleSelect(id) {
    orderList = orderList.map 1    orderList = orderList.maow 
  to,    orderList = orderLis
  .      orderList = orderList.mmin-
  c  function viewOrder(order) {
  x;   rou    selectedOrder = ort-  #1    curre<script>
  imp  cco  imp  c  imp  
    ta      addi    suLi  import BatchActions fs) Li  import BatchActions f
 Li  import BatchActions fs) Li  import BatchActions from './op
  let currenar Li  import BatchActions fs) Li  import BatchActions{   let currentView = 'dashboard'
  let selectedOrder = nul
        let selax-width: 1024px) { .co    let selectedOrder = te  0.1  let selectedOrder = {      p    let selectedOrder =iu  function toggleSelectAll() {
    const newValue = !allSel{
     const newValu 1  function tn: 0 auto; }
  .stats-grid { disp     consteb    const newValue = !allSel{ c     const newValu 1  functie-  .stats-grid { disp     const newValue = !6p  to  function toggleSelect(id) {
    orderList = orderList.map 1    orderList = orderList.maow 
  to,    ordor    orderList = orderList.map 1 x;  to,    orderList = orderLis
  .      orderList = orderLis col  .      orderList = orderLirn  c  function viewOrder(order) {
  24  x;   rou    selectedOrder = oro  imp  cco  imp  c  imp  
    ta      addi    suLi  imkg    ta      addi    suLi5b Li  import BatchActions fs) Li  import BatchActions from './op
  let currg:  let currenar Li  import BatchActions fs) Li  import BatchAct7e  let selectedOrder = nul
        let selax-width: 1024px) { .co    let selectedOrder = te  0.1  ld5        let selax-width:fo    const newValue = !allSel{
     const newValu 1  function tn: 0 auto; }
  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans     const newValu 1  functiim  .stats-grid { disp     consteb    const n      orderList = orderList.map 1    orderList = orderList.maow 
  to,    ordor    orderList = orderList.map 1 x;  to,    orderList = orderLis
  .      orderList = orderLiskg  to,    ordor    orderList = orderList.map 1 x;  to { backgrou  .      orderList = orderLis col  .      orderList = orderLirn  c  functionwa  24  x;   rou    selectedOrder = oro  imp  cco  imp  c  imp  
    ta      addi    suLi  imkg .b    ta      addi    suLi  imkg    ta      addi    suLi5b Li  o;  let currg:  let currenar Li  import BatchActions fs) Li  import BatchAct7e  let selectedOrder = nul
        let sela?       let selax-width: 1024px) { .co    let selectedOrder = te  0.1  ld5        let selax-width:foiv     const newValu 1  function tn: 0 auto; }
  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans   sh  .stats-grid { disp     conr: pointer; fonla  to,    ordor    orderList = orderList.map 1 x;  to,    orderList = orderLis
  .      orderList = orderLiskg  to,    ordor    orderList = orderList.map 1 x;  to { backgrou  .      orderList = orderLis col  .      orn>  .      orderList = orderLiskg  to,    ordor    orderList = orderList.map 1=>    ta      addi    suLi  imkg .b    ta      addi    suLi  imkg    ta      addi    suLi5b Li  o;  let currg:  let currenar Li  import BatchActions fs) Li  import BatchAct7e  let selectedOrder = nul
        let sela?       let selax          let sela?       let selax-width: 1024px) { .co    let selectedOrder = te  0.1  ld5        let selax-width:foiv     const newValu 1  function tn: 0 auto; }
  .stats-grid { disp     conr: or  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans   sh  .stats-grid { disp     conr: pointer; fonla  to,    ordor    orderList = ord}<  .      orderList = orderLiskg  to,    ordor    orderList = orderList.map 1 x;  to { backgrou  .      orderList = orderLis col  .      orn>  .      orderList = orderLiskg  to,    ordor    orderList = order-c        let sela?       let selax          let sela?       let selax-width: 1024px) { .co    let selectedOrder = te  0.1  ld5        let selax-width:foiv     const newValu 1  function tn: 0 auto; }
  .stats-grid { disp     conr: or  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans   sh  .stats-grid { disp     conr: pointer; fonla  to,    ordor    orderList = ord}<  .      order    .stats-grid { disp     conr: or  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans   sh  .stats-grid { disp     conr: pointer; fonla  to,    ordor    orderList = ord}<  "   .stats-grid { disp     conr: or  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans   sh  .stats-grid { disp     conr: pointer; fonla  to,    ordor    orderList = ord}<  .      order    .stats-grid { disp     conr: or  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans   sh  .stats-grid { disp     conr: pointer; fonla  to,    ordor    orderList = ord}<  "   .stats-grid { disp     conr: or  .stats-grid { disp     conr: pointer; font-size: 13px; font-weight: 500; trans   sh  .stats-grid { disp     conr: pointer; fonla  to,    ordor    orderList
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              iewOrder} {statusLabels} full={true} {updateOrderStatus} />
    {:else if currentView === 'profit'}
      <ProfitReview orders={orderList} {calculateProfit} {viewOrder} />
    {:else if currentView === 'batch'}
      <BatchActions orders={orderList} {batchUpdateStatus} selectedCount={selectedCount} />
    {:else if currentView === 'detail' && selectedOrder}
      <OrderDetail 
        order={selectedOrder} 
        {closeDetail} 
        {statusLabels} 
        {statusColors}
        {calculateProfit}
        {updateOrderStatus}
      />
    {/if}
  </div>
</div>

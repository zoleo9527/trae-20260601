<script lang="ts">
  import { getStore } from '$lib/store.svelte'
  import { DAMAGE_STATUS_LABELS, COMPENSATION_STATUS_LABELS, ROLE_LABELS } from '$lib/types'
  import { AlertTriangle, Clock, CheckCircle, AlertCircle } from 'lucide-svelte'

  const store = getStore()

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  function urgencyClass(u: string) {
    if (u === 'critical') return 'border-l-4 border-l-danger'
    if (u === 'urgent') return 'border-l-4 border-l-safety-orange'
    return 'border-l-4 border-l-rail-blue'
  }

  function statusColor(s: string) {
    const map: Record<string, string> = {
      pending: 'bg-safety-orange text-white',
      processing: 'bg-rail-blue text-white',
      anomaly: 'bg-danger text-white',
      completed: 'bg-success text-white',
    }
    return map[s] ?? 'bg-iron-400 text-white'
  }

  function compStatusColor(s: string) {
    const map: Record<string, string> = {
      pending: 'bg-safety-orange text-white',
      accepted: 'bg-rail-blue text-white',
      material_incomplete: 'bg-danger text-white',
      reviewing: 'bg-rail-blue-light text-white',
      completed: 'bg-success text-white',
    }
    return map[s] ?? 'bg-iron-400 text-white'
  }
</script>

<div class="p-6">
  <div class="mb-6">
    <h1 class="text-xl font-bold text-iron-900">å·¥ä½å‘ç°å¤‡ä¸šï¼š</h1>
    <p class="text-sm text-iron-500 mt-1">åœ¨è¯„æˆï¼š{ROLE_LABELS[store.currentRole]} Ä½  è¯·åŠ¨é‡å¯è®¾å¤‡ï¼ŒçŠ¶æ€ åŠŸèƒ½ç‰©è½¬æ¢å¯ä¸€æ­¥</p>
  </div>

  {#if store.gapDamages.length > 0}
    <section class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <AlertCircle size={18} class="text-danger animate-pulse-danger" />
        <h2 class="text-sm font-bold text-danger">è®®ä»–å°½å¤šå…¬å¼‹</h2>
        <span class="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{store.gapDamages.length}</span>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {#each store.gapDamages as dmg}
          <a href="/damage/{dmg.id}"
            class="rounded-lg border-2 border-danger/30 bg-danger-light/40 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-iron-600">{dmg.ticketNo}</span>
              <span class="rounded px-1.5 py-0.5 text-xs {statusColor(dmg.status)}">{DAMAGE_STATUS_LABELS[dmg.status]}</span>
            </div>
            <p class="text-sm font-bold text-iron-900 mb-1">{dmg.goodsName} â€Œ {dmg.damageType}</p>
            <p class="text-xs text-danger font-medium">
              {#each dmg.responsibilityChain as node}
                {#if node.isGap}
                  {node.segment}ï¼š{node.name}
                {/if}
              {/each}
            </p>
            <p class="text-xs text-iron-500 mt-1">{dmg.stationFrom} â†’ {dmg.stationTo}</p>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <section class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <Clock size={18} class="text-safety-orange" />
      <h2 class="text-sm font-bold text-iron-900">å¾…æŠ¹å‘</h2>
      <span class="rounded-full bg-safety-orange px-2 py-0.5 text-xs text-white">{store.pendingDamages.length + store.pendingCompensations.length}</span>
    </div>
    <div class="grid gap-3 md:grid-coms-2 xl:grid-coms-3">
      {#each store.pendingDamages as dmg}
        <a href="/damage/{dmg.id}"
          class="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow {urgencyClass(dmg.urgency)} cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-iron-600">{dmg.ticketNo}</span>
            <span class="rounded px-1.5 py-0.5 text-xs {statusColor(dmg.status)}">{DAMAGE_STATUS_LABELS[dmg.status]}</span>
          </div>
          <p class="text-sm font-bold text-iron-900 mb-1">{dmg.goodsName} â€Œ {dmg.damageType}</p>
          <p class="text-xs text-iron-500">{dmg.stationFrom}H8¡¤ˆÙYËœİ][Û•ßOÜ‚ˆÛ\ÜÏH^^È^Z\›Û‹M]LH¹ë 9îäù.*ˆÙ›Ü›X]]JYË˜Ü™X]Y]
_OÜ‚ˆØO‚ˆËÙXXÚBˆÈÙXXÚİÜ™Kœ[™[™ĞÛÛ\[œØ][ÛœÈ\ÈÛÛ\BˆH™YH‹ØÛÛ\[œØ][Û‹ŞØÛÛ\šYH‚ˆÛ\ÜÏHœ›İ[™Y[È™Ë]Ú]HMÚYİË\ÛHİ™\œÚYİË[Y˜[œÚ][Û‹\ÚYİÈ›Ü™\‹[M›Ü™\‹[\ØY™]K[Ü˜[™ÙHİ\œÛÜ‹\Ú[\ˆ‚ˆ]ˆÛ\ÜÏH™›^][\ËXÙ[\ˆ\İYKX™]ÙY[ˆX‹Lˆ‚ˆÜ[ˆÛ\ÜÏH^^È›Û[[Û›È^Z\›Û‹MŒØÛÛ\˜ÛÛ\›ßOÜÜ[‚ˆÜ[ˆÛ\ÜÏHœ›İ[™YLKHKLH^^ÈØÛÛ\İ]\ĞÛÛÜŠÛÛ\œİ]\Ê_HĞÓÓTS”ĞUSÓ—ÔÕUT×ÓP‘SÖØÛÛ\œİ]\×_OÜÜ[‚ˆÙ]‚ˆÛ\ÜÏH^\ÛH›ÛX›Û^Z\›Û‹NLX‹LHº/äy/i2hŞØÛÛ\˜[[İ[ÓØØ[Tİš[™Ê
_OÜ‚ˆÛ\ÜÏH^^È^Z\›Û‹ML¹î¯ú/äy¥í»ï&ØÛÛ\˜ÛZ[X[OÜ‚ˆÛ\ÜÏH^^È^Z\›Û‹M]LH¹ëbyo"9.®ˆÙ›Ü›X]]JÛÛ\˜Ü™X]Y]
_OÜ‚ˆØO‚ˆËÙXXÚBˆÙ]‚ˆÜÙXİ[Û‚‚ˆÙXİ[ÛˆÛ\ÜÏH›X‹Mˆ‚ˆ]ˆÛ\ÜÏH™›^][\ËXÙ[\ˆØ\LˆX‹LÈ‚ˆ[\šX[™ÛHÚ^™O^ÌNHÛ\ÜÏH^Y[™Ù\ˆˆÏ‚ˆˆÛ\ÜÏH^\ÛH›ÛX›Û^Z\›Û‹NL¹b§ú+á¹.¢ùâjOÚ‚ˆÜ[ˆÛ\ÜÏHœ›İ[™YY[™ËY[™Ù\ˆLˆKLH^^È^]Ú]HÜİÜ™K˜[›ÛX[Q[XYÙ\Ë›[™İOÜÜ[‚ˆÙ]‚ˆ]ˆÛ\ÜÏH™ÜšYØ\LÈY™ÜšYXÛÛ\ËLˆ™ÜšYXÛÛ\ËLÈ‚ˆÈÙXXÚİÜ™K˜[›ÛX[Q[XYÙ\È\ÈYßBˆH™YH‹Ù[XYÙKŞÙYËšYH‚ˆÛ\ÜÏHœ›İ[™Y[È›Ü™\ˆ›Ü™\‹Y[™Ù\‹Í™Ë]Ú]HMÚYİË\ÛHİ™\œÚYİË[Y˜[œÚ][Û‹\ÚYİÈİ\œÛÜ‹\Ú[\ˆ‚ˆ]ˆÛ\ÜÏH™›^][\ËXÙ[\ˆ\İYKX™]ÙY[ˆX‹Lˆ‚ˆÜ[ˆÛ\ÜÏH^^È›Û[[Û›È^Z\›Û‹MŒÙYËXÚÙ]›ßOÜÜ[‚ˆÜ[ˆÛ\ÜÏHœ›İ[™YLKHKLH^^ÈÜİ]\ĞÛÛÜŠYËœİ]\Ê_HÑSPQÑWÔÕUT×ÓP‘SÖÙYËœİ]\×_OÜÜ[‚ˆÙ]‚ˆÛ\ÜÏH^\ÛH›ÛX›Û^Z\›Û‹NLX‹LHÙYË™ÛÛÙÓ˜[Y_H8 #ÙYË™[XYÙU\_OÜ‚ˆÛ\ÜÏH^^È^Y[™Ù\ˆÈÙXXÚYË[Y[[™H\È›Ù_^ÈÚYˆ›ÙKš\ÑØ\^Û›ÙK™]™[{ï&Û›ÙK™\ØÜš\[ÛŸ^ËÚYŸ^ËÙXXÚOÜ‚ˆÛ\ÜÏH^^È^Z\›Û‹MLÙYËœİ][Û‘œ›Û_x¡¤ˆÙYËœİ][Û•ßOÜ‚ˆØO‚ˆËÙXXÚBˆÙ]‚ˆÜÙXİ[Û‚‚ˆÙXİ[Û‚ˆ]ˆÛ\ÜÏH™›^][\ËXÙ[\ˆØ\LˆX‹LÈ‚ˆÚXÚĞÚ\˜ÛHÚ^™O^ÌNHÛ\ÜÏH^\İXØÙ\ÜÈˆÏ‚ˆˆÛ\ÜÏH^\ÛH›ÛX›Û^Z\›Û‹NL¹mì¹i'¹¢$Ú‚ˆÜ[ˆÛ\ÜÏHœ›İ[™YY[™Ë\İXØÙ\ÜÈLˆKLH^^È^]Ú]HÜİÜ™K˜ÛÛ\]Y[XYÙ\Ë›[™İ
ÈİÜ™K˜ÛÛ\]YÛÛ\[œØ][ÛœË›[™İOÜÜ[‚ˆÙ]‚ˆ]ˆÛ\ÜÏH™ÜšYØ\LÈY™ÜšYXÛÛËLˆ™ÜšYXÛÛËLÈ‚ˆÈÙXXÚİÜ™K˜ÛÛ\]Y[XYÙ\È\ÈYßBˆH™YH‹Ù[XYÙKŞÙYËšYH‚ˆÛ\ÜÏHœ›İ[™Y[È™Ë]Ú]HMÚYİË\ÛHİ™\œÚYİË[Y˜[œÚ][Û‹\ÚYİÈ›Ü™\‹[M›Ü™\‹[\İXØÙ\ÜÈİ\œÛÜ‹\Ú[\ˆÜXÚ]KN‚ˆ]ˆÛ\ÜÏH™›^][\ËXÙ[\ˆ\İYKX™]ÙY[ˆX‹Lˆ‚ˆÜ[ˆÛ\ÜÏH^^È›Û[[Û›È^Z\›Û‹MŒÙYËXÚÙ]›ßOÜÜ[‚ˆÜ[ˆÛ\ÜÏHœ›İ[™YLKHKLH^^ÈÜİ]\ĞÛÛÜŠYËœİ]\Ê_HÑSPQÑWÔÕUT×ÓP‘SÖÙYËœİ]\×_OÜÜ[‚ˆÙ]‚ˆÛ\ÜÏH^\ÛH›ÛX›Û^Z\›Û‹NLX‹LHÙYË™ÛÛÙÓ˜[Y_H8 #ÙYË™[XYÙU\_OÜ‚ˆÛ\ÜÏH^^È^Z\›Û‹MLÙYËœİ][Û‘œ›Û_R(i"¶FÖrç7FF–öåF÷ÓÂ÷à¢Âöà¢²öV6‡Ğ¢²6V6‚7F÷&Ræ6ö×ÆWFVD6ö×Vç6F–öç226ö×Ğ¢Æ‡&VcÒ"ö6ö×Vç6F–öâ÷¶6ö×æ–GÒ ¢6Æ73Ò'&÷VæFVBÖÆr&r×v†—FRÓB6†F÷r×6Ò†÷fW#§6†F÷rÖÖBG&ç6—F–öâ×6†F÷r&÷&FW"ÖÂÓB&÷&FW"ÖÂ×7V66W727W'6÷"×ö–çFW"÷6—G’Óƒ#à¢ÆF—b6Æ73Ò&fÆW‚—FV×2Ö6VçFW"§W7F–g’Ö&WGvVVâÖ"Ó"#à¢Ç7â6Æ73Ò'FW‡B×‡2föçBÖÖöæòFW‡BÖ—&öâÓc#ç¶6ö×æ6ö×æ÷ÓÂ÷7ãà¢Ç7â6Æ73Ò'&÷VæFVB‚ÓãR’ÓãRFW‡B×‡2&r×7V66W72FW‡B×v†—FR#ç´4ôÕTå4D”ôåõ5DEU5ôÄ$TÅ5¶6ö×ç7FGW5×ÓÂ÷7ãà¢ÂöF—cà¢Ç6Æ73Ò'FW‡B×6ÒföçBÖ&öÆBFW‡BÖ—&öâÓ“Ö"Ó#ş¢ùKÚBš7¶6ö×æÖ÷VçBçFôÆö6ÆU7G&–ær‚—ÓÂ÷à¢Ç6Æ73Ò'FW‡B×‡2FW‡BÖ—&öâÓS#ç¶6ö×æ6Æ–ÖçGÓÂ÷à¢Âöà¢²öV6‡Ğ¢ÂöF—cà¢Â÷6V7F–öãà£ÂöF—
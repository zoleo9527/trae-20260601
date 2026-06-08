<template>
  <div class="space-y-6">
    <div class="card p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full" :class="store.refreshCooldown ? 'bg-text-secondary' : 'bg-accent pulse-fast'" />
          <span class="text-xs text-text-secondary">
            数据时效：
            <span v-if="store.lastRefreshAt" class="text-text-primary font-heading">
              {{ formatRefreshTime(store.lastRefreshAt) }}
            </span>
            <span v-else class="text-text-secondary">加载中…</span>
          </span>
          <span
            v-if="store.refreshCooldown"
            class="text-xs px-2 py-0.5 rounded-full bg-text-secondary/10 text-text-secondary border border-text-secondary/20 font-heading"
          >
            冷却中 · 30s
          </span>
        </div>
        <button
          class="btn-primary !text-xs !py-1 !px-3"
          :disabled="store.refreshCooldown"
          @click="handleRefresh"
        >
          刷新数据
        </button>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-2 h-2 rounded-full bg-accent pulse-fast" />
        <h2 class="font-heading text-xl font-bold text-text-primary">你的待办</h2>
        <span class="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30 font-heading">
          {{ myTodos.length }}
        </span>
        <span v-if="myOverdueCount > 0" class="text-xs px-2 py-0.5 rounded-full bg-alert/10 text-alert border border-alert/30 font-heading font-semibold">
          {{ myOverdueCount }} 项超时
        </span>
      </div>
      <div v-if="myTodos.length === 0" class="text-text-secondary text-sm py-6 text-center">
        暂无待办事项，一切正常
      </div>
      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="reg in myTodos"
          :key="reg.id"
          class="flex items-center gap-3 p-3 rounded bg-bg-primary/60 cursor-pointer hover:bg-accent/5 transition-colors duration-200 group"
          @click="$router.push(`/registrations/${reg.id}`)"
        >
          <div
            v-if="getUrgencyLevel(reg) === 'overdue'"
            class="w-2.5 h-2.5 rounded-full bg-alert pulse-fast shrink-0"
          />
          <div
            v-else-if="getUrgencyLevel(reg) === 'critical'"
            class="w-2.5 h-2.5 rounded-full bg-alert shrink-0"
          />
          <div
            v-else-if="getUrgencyLevel(reg) === 'warning'"
            class="w-2.5 h-2.5 rounded-full bg-warning shrink-0"
          />
          <div v-else class="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-sm text-text-primary group-hover:text-accent transition-colors truncate">
              {{ reg.event_name }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-text-secondary">{{ reg.team_name }} · {{ reg.player_count }}人</span>
              <span
                v-if="reg.available_seats && reg.available_seats.gap > 0"
                class="text-xs text-alert"
              >
                · 缺{{ reg.available_seats.gap }}座
              </span>
            </div>
          </div>
          <CountdownTimer :deadline="reg.deadline_at" />
          <StatusBadge :status="reg.status" />
        </div>
      </div>
    </div>

    <div class="card p-5 border-l-4" :class="pressureBorderColor">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-heading text-lg font-semibold text-text-primary">现场压力指数</h3>
            <span
              class="text-xs font-heading font-bold px-2 py-0.5 rounded"
              :style="pressureBadgeStyle"
            >
              {{ pressureLabel }}
            </span>
          </div>
          <div class="w-full h-3 rounded-full bg-bg-primary overflow-hidden border border-border-card">
            <div
              class="h-full rounded-full transition-all duration-1000"
              :class="pressureBarAnimClass"
              :style="{ width: `${pressurePercent}%`, backgroundColor: pressureBarColor }"
            />
          </div>
          <div class="flex justify-between mt-1 text-xs text-text-secondary">
            <span>正常</span>
            <span>紧张</span>
            <span>危急</span>
          </div>
        </div>
        <div class="text-center px-6">
          <div class="font-heading text-4xl font-bold" :class="pressureTextClass">
            {{ pressureScore }}
          </div>
          <div class="text-xs text-text-secondary mt-1">/ 100</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <router-link
        to="/registrations?status=pending"
        class="card p-5 relative overflow-hidden cursor-pointer transition-all duration-200 hover:border-warning/30"
      >
        <div class="absolute top-0 left-0 w-1 h-full bg-warning" />
        <div class="pl-4">
          <p class="text-text-secondary text-sm mb-1">待处理</p>
          <p class="font-heading text-3xl font-bold text-warning">{{ store.stats.pending }}</p>
          <p class="text-accent text-xs mt-2">我的待办: {{ store.stats.my_pending }}</p>
        </div>
      </router-link>

      <router-link
        to="/registrations?urgency=overdue"
        class="card p-5 relative overflow-hidden cursor-pointer transition-all duration-200 hover:border-alert/30"
        :class="{ 'pulse-fast': store.stats.overdue > 0 }"
      >
        <div class="absolute top-0 left-0 w-1 h-full bg-alert" />
        <div class="pl-4">
          <p class="text-text-secondary text-sm mb-1">超时预警</p>
          <p class="font-heading text-3xl font-bold text-alert">{{ store.stats.overdue }}</p>
          <p class="text-text-secondary text-xs mt-2">已超过处理时限</p>
        </div>
      </router-link>

      <router-link
        to="/seats"
        class="card p-5 relative overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#FF9500]/30"
        :class="{ 'pulse-slow': store.stats.conflicts > 0 }"
      >
        <div class="absolute top-0 left-0 w-1 h-full bg-[#FF9500]" />
        <div class="pl-4">
          <p class="text-text-secondary text-sm mb-1">冲突数</p>
          <p class="font-heading text-3xl font-bold text-[#FF9500]">{{ store.stats.conflicts }}</p>
          <p class="text-text-secondary text-xs mt-2">需要介入解决的冲突</p>
        </div>
      </router-link>

      <router-link
        to="/registrations?status=escalated"
        class="card p-5 relative overflow-hidden cursor-pointer transition-all duration-200 hover:border-alert/30"
        :class="{ 'pulse-fast': store.stats.escalated > 0 }"
      >
        <div class="absolute top-0 left-0 w-1 h-full bg-alert" />
        <div class="pl-4">
          <p class="text-text-secondary text-sm mb-1">已升级</p>
          <p class="font-heading text-3xl font-bold text-alert">{{ store.stats.escalated }}</p>
          <p class="text-text-secondary text-xs mt-2">需要店长介入</p>
        </div>
      </router-link>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="card p-5 col-span-2">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-2 h-2 rounded-full bg-alert" />
          <h2 class="font-heading text-xl font-bold text-text-primary">今日告警时间线</h2>
          <span class="text-xs px-2 py-0.5 rounded-full bg-alert/10 text-alert border border-alert/30 font-heading">
            {{ store.alertTimeline.length }}
          </span>
        </div>
        <div v-if="store.alertTimeline.length === 0" class="text-text-secondary text-sm py-8 text-center">
          今日暂无告警
        </div>
        <div v-else class="space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="log in store.alertTimeline"
            :key="log.id"
            class="flex gap-3 p-3 rounded bg-bg-primary/50 cursor-pointer hover:bg-accent/5 transition-colors duration-200"
            @click="$router.push(`/registrations/${log.registration_id}`)"
          >
            <div
              class="w-1.5 rounded-full shrink-0 self-stretch"
              :style="{ backgroundColor: NOTE_TYPE_COLORS[log.note_type] ?? '#8B949E' }"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-sm text-text-primary font-semibold truncate">
                  {{ (log as Record<string, unknown>).event_name || log.registration_id }}
                </span>
                <NoteTypeTag :type="log.note_type" />
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="text-xs font-semibold"
                  :style="{ color: ROLE_COLORS[log.operator_role as Role] ?? '#8B949E' }"
                >
                  {{ log.operator_role }}/{{ log.operator_name }}
                </span>
                <span class="text-xs text-text-secondary">{{ formatTime(log.created_at) }}</span>
              </div>
              <p v-if="log.note" class="text-xs text-text-secondary mt-1 truncate">{{ log.note }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-2 h-2 rounded-full bg-[#FF9500]" />
          <h2 class="font-heading text-xl font-bold text-text-primary">逾期红榜 Top5</h2>
        </div>
        <div v-if="store.overdueTop.length === 0" class="text-text-secondary text-sm py-8 text-center">
          暂无逾期报名
        </div>
        <div v-else class="space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="(reg, idx) in store.overdueTop"
            :key="reg.id"
            class="flex items-center gap-3 p-3 rounded bg-bg-primary/50 cursor-pointer hover:bg-accent/5 transition-colors duration-200 group"
            @click="$router.push(`/registrations/${reg.id}`)"
          >
            <span
              class="font-heading text-lg font-bold w-6 text-center shrink-0"
              :class="idx < 3 ? 'text-alert' : 'text-[#FF9500]'"
            >
              {{ idx + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                {{ reg.event_name }}
              </p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-text-secondary">{{ reg.team_name }}</span>
                <span class="text-xs text-alert font-heading font-semibold">
                  超{{ Math.round(((reg as Record<string, unknown>).overdue_minutes as number || 0) - reg.sla_minutes) }}分
                </span>
              </div>
            </div>
            <button
              v-if="reg.current_owner_role !== '店长'"
              class="btn-primary !text-[10px] !py-1 !px-2 shrink-0"
              @click.stop="handleEscalate(reg.id, reg.event_name)"
            >
              升级店长
            </button>
            <StatusBadge v-else :status="reg.status" />
          </div>
        </div>
      </div>
    </div>

    <div class="card p-5 border-l-4 border-l-[#30D158]">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-2 h-2 rounded-full bg-[#30D158]" />
        <h2 class="font-heading text-xl font-bold text-text-primary">今日催办反馈</h2>
        <span class="text-xs px-2 py-0.5 rounded-full bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/30 font-heading">
          {{ store.reminderFeedback.length }}
        </span>
      </div>
      <div v-if="store.reminderFeedback.length === 0" class="text-text-secondary text-sm py-6 text-center">
        今日暂无催办记录
      </div>
      <div v-else class="space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="rem in store.reminderFeedback"
          :key="(rem as Record<string, unknown>).id as number"
          class="flex gap-3 p-3 rounded cursor-pointer hover:bg-accent/5 transition-colors duration-200"
          :class="(rem as Record<string, unknown>).responded ? 'bg-accent/5' : 'bg-[#30D158]/5 border border-[#30D158]/20'"
          @click="$router.push(`/registrations/${(rem as Record<string, unknown>).registration_id}`)"
        >
          <div class="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5" :class="(rem as Record<string, unknown>).responded ? 'bg-accent/20' : 'bg-[#30D158]/20'">
            <svg v-if="(rem as Record<string, unknown>).responded" class="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            <svg v-else class="w-3.5 h-3.5 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-sm text-text-primary font-semibold truncate">
                {{ (rem as Record<string, unknown>).event_name || (rem as Record<string, unknown>).registration_id }}
              </span>
              <span
                class="text-xs font-semibold px-1.5 py-0.5 rounded"
                :style="{ color: ROLE_COLORS[((rem as Record<string, unknown>).to_role as string) as Role] ?? '#8B949E', backgroundColor: (ROLE_COLORS[((rem as Record<string, unknown>).to_role as string) as Role] ?? '#8B949E') + '15' }"
              >
                → {{ (rem as Record<string, unknown>).to_role }}
              </span>
              <span v-if="(rem as Record<string, unknown>).responded" class="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30 font-heading font-semibold">
                已响应
              </span>
              <span v-else class="text-xs px-1.5 py-0.5 rounded bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/30 font-heading font-semibold">
                未响应
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-text-secondary">
                {{ (rem as Record<string, unknown>).operator_role }} 催办 · {{ formatTime((rem as Record<string, unknown>).created_at as string) }}
              </span>
            </div>
            <p v-if="(rem as Record<string, unknown>).note" class="text-xs text-text-secondary mt-1 truncate">{{ (rem as Record<string, unknown>).note }}</p>
          </div>
          <button
            v-if="!(rem as Record<string, unknown>).responded"
            class="flex items-center gap-1 px-2 py-1 rounded text-xs font-heading font-medium transition-all hover:scale-105 shrink-0"
            style="color: #30D158; backgroundColor: rgba(48,209,88,0.1); border: 1px solid rgba(48,209,88,0.3)"
            @click.stop="handleReRemind((rem as Record<string, unknown>).registration_id as string, (rem as Record<string, unknown>).to_role as string, (rem as Record<string, unknown>).event_name as string)"
          >
            再次催办
          </button>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <h2 class="font-heading text-xl font-bold text-text-primary mb-4">角色责任压力榜</h2>
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="role in pressureRoles"
          :key="role"
          class="rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
          :style="{
            borderColor: ROLE_COLORS[role] + '40',
            backgroundColor: ROLE_COLORS[role] + '08',
          }"
          @click="$router.push(`/registrations?role=${encodeURIComponent(role)}`)"
        >
          <div class="flex items-center gap-2 mb-3">
            <div
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: ROLE_COLORS[role] }"
            />
            <span
              class="font-heading text-base font-semibold"
              :style="{ color: ROLE_COLORS[role] }"
            >
              {{ role }}
            </span>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-text-secondary">待接手</span>
              <span class="font-heading text-xl font-bold text-text-primary">
                {{ store.rolePressure[role]?.pending_count ?? 0 }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-text-secondary">平均接手时长</span>
              <span class="font-heading text-sm font-bold text-text-primary">
                {{ store.rolePressure[role]?.avg_handover_minutes != null ? store.rolePressure[role]!.avg_handover_minutes + '分' : '--' }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-text-secondary">今日被催办</span>
              <span
                class="font-heading text-sm font-bold"
                :class="(store.rolePressure[role]?.today_reminder_count ?? 0) >= 3 ? 'text-alert' : (store.rolePressure[role]?.today_reminder_count ?? 0) >= 1 ? 'text-[#30D158]' : 'text-text-primary'"
              >
                {{ store.rolePressure[role]?.today_reminder_count ?? 0 }}次
              </span>
            </div>
            <div v-if="store.rolePressure[role]?.longest_stall" class="pt-2 border-t" :style="{ borderColor: ROLE_COLORS[role] + '20' }">
              <div class="flex items-center gap-1 mb-1">
                <span class="text-xs text-text-secondary">最长滞留</span>
                <span class="text-xs text-alert font-heading font-semibold">
                  {{ store.rolePressure[role]!.longest_stall!.stall_minutes }}分
                </span>
              </div>
              <p class="text-xs text-text-primary truncate">
                {{ store.rolePressure[role]!.longest_stall!.event_name }}
              </p>
              <p class="text-[10px] text-text-secondary">
                {{ store.rolePressure[role]!.longest_stall!.team_name }}
              </p>
            </div>
            <div v-else class="pt-2 border-t" :style="{ borderColor: ROLE_COLORS[role] + '20' }">
              <span class="text-xs text-text-secondary">无滞留任务</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-5">
      <h2 class="font-heading text-xl font-bold text-text-primary mb-4">责任流水线</h2>
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        <template v-for="(role, idx) in pipelineRoles" :key="role">
          <router-link
            :to="`/registrations?role=${encodeURIComponent(role)}`"
            class="flex-shrink-0 flex flex-col items-center gap-2 px-6 py-4 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-105"
            :style="{
              borderColor: pipelineByRole[role]?.count ? ROLE_COLORS[role as Role] + '40' : '#2A3A4E',
              backgroundColor: pipelineByRole[role]?.count ? ROLE_COLORS[role as Role] + '08' : 'transparent',
            }"
          >
            <span
              class="font-heading text-sm font-semibold"
              :style="{ color: ROLE_COLORS[role as Role] }"
            >
              {{ role }}
            </span>
            <span class="font-heading text-2xl font-bold text-text-primary">
              {{ pipelineByRole[role]?.count ?? 0 }}
            </span>
            <span class="text-xs text-text-secondary">件在办</span>
            <div v-if="pipelineByRole[role]?.overdue" class="text-xs text-alert font-heading font-semibold">
              {{ pipelineByRole[role]?.overdue }} 件超时
            </div>
            <span class="text-[10px] text-text-secondary/50 mt-0.5">点击查看</span>
          </router-link>
          <svg
            v-if="idx < pipelineRoles.length - 1"
            class="w-6 h-6 text-text-secondary shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </template>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <div class="card p-5">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-2 h-2 rounded-full bg-alert" />
          <h2 class="font-heading text-xl font-bold text-text-primary">紧急事项</h2>
        </div>
        <div v-if="urgentItems.length === 0" class="text-text-secondary text-sm py-8 text-center">
          暂无紧急事项
        </div>
        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="reg in urgentItems"
            :key="reg.id"
            class="flex items-center gap-3 p-3 rounded bg-bg-primary/50 cursor-pointer hover:bg-accent/5 transition-colors duration-200 group"
            @click="$router.push(`/registrations/${reg.id}`)"
          >
            <div
              class="w-1.5 self-stretch rounded-full shrink-0"
              :style="{ backgroundColor: ROLE_COLORS[reg.current_owner_role] }"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm text-text-primary group-hover:text-accent transition-colors truncate">
                {{ reg.event_name }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="text-xs font-semibold px-1.5 py-0.5 rounded"
                  :style="{
                    color: ROLE_COLORS[reg.current_owner_role],
                    backgroundColor: ROLE_COLORS[reg.current_owner_role] + '15',
                  }"
                >
                  {{ reg.current_owner_role }}
                </span>
                <span class="text-xs text-text-secondary">{{ reg.team_name }}</span>
                <span v-if="reg.available_seats && reg.available_seats.gap > 0" class="text-xs text-alert">
                  · 缺{{ reg.available_seats.gap }}座
                </span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <CountdownTimer :deadline="reg.deadline_at" />
              <StatusBadge :status="reg.status" />
            </div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h2 class="font-heading text-xl font-bold text-text-primary mb-4">最近动态</h2>
        <div v-if="store.recentLogs.length === 0" class="text-text-secondary text-sm py-8 text-center">
          暂无动态记录
        </div>
        <div v-else class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="log in store.recentLogs"
            :key="log.id"
            class="flex gap-3 p-3 rounded bg-bg-primary/50"
          >
            <div
              class="w-1 rounded-full shrink-0"
              :style="{ backgroundColor: ROLE_COLORS[log.operator_role as Role] ?? '#8B949E' }"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  class="text-xs font-semibold"
                  :style="{ color: ROLE_COLORS[log.operator_role as Role] ?? '#8B949E' }"
                >
                  {{ log.operator_role }}
                </span>
                <span class="text-xs text-text-secondary">{{ log.operator_name }}</span>
                <template v-if="log.from_role && log.to_role">
                  <span class="text-xs text-text-secondary">
                    <span :style="{ color: ROLE_COLORS[log.from_role as Role] }">{{ log.from_role }}</span>
                    <span class="mx-1 text-text-secondary">→</span>
                    <span :style="{ color: ROLE_COLORS[log.to_role as Role] }">{{ log.to_role }}</span>
                  </span>
                </template>
                <NoteTypeTag
                  v-if="log.note_type && log.note_type !== 'normal'"
                  :type="log.note_type"
                  class="ml-auto"
                />
                <span v-else class="text-xs text-text-secondary ml-auto">{{ formatTime(log.created_at) }}</span>
              </div>
              <p class="text-sm text-text-primary">{{ log.action }}</p>
              <p v-if="log.note" class="text-xs text-text-secondary mt-1 truncate">{{ log.note }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { getUrgencyLevel, urgencySortWeight, ROLE_COLORS, STATUS_COLORS, NOTE_TYPE_COLORS, NOTE_TYPE_LABELS } from '@/types'
import type { Registration, HandoverLog, Role } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import NoteTypeTag from '@/components/NoteTypeTag.vue'

const store = useAppStore()
const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

onMounted(async () => {
  store.loading = true
  await Promise.all([
    store.fetchRegistrations(),
    store.fetchStats(),
    store.fetchRecentLogs(),
    store.fetchAlertTimeline(),
    store.fetchRolePressure(),
    store.fetchOverdueTop(),
    store.fetchReminderFeedback(),
  ])
  store.markRefreshed()
  store.loading = false
  timer = setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

async function handleRefresh() {
  if (store.refreshCooldown) return
  store.loading = true
  await Promise.all([
    store.fetchRegistrations(),
    store.fetchStats(),
    store.fetchRecentLogs(),
    store.fetchAlertTimeline(),
    store.fetchRolePressure(),
    store.fetchOverdueTop(),
    store.fetchReminderFeedback(),
  ])
  store.markRefreshed()
  store.loading = false
}

async function handleEscalate(regId: string, eventName: string) {
  const reason = `${eventName} 逾期超时，需店长介入`
  const ok = await store.escalateRegistration(regId, reason)
  if (ok) {
    await store.fetchOverdueTop()
    await store.fetchRolePressure()
    await store.fetchStats()
  }
}

async function handleReRemind(regId: string, toRole: string, eventName: string) {
  const result = await store.sendReminder(regId, toRole, `再次催办：${eventName}仍未处理`)
  if (result.success) {
    await store.fetchReminderFeedback()
    await store.fetchRolePressure()
  } else {
    alert(result.error || '催办失败')
  }
}

const myTodos = computed(() => {
  return store.registrations
    .filter(r => r.current_owner_role === store.currentRole && r.status !== 'completed' && r.status !== 'rejected')
    .sort((a, b) => urgencySortWeight(a) - urgencySortWeight(b))
})

const myOverdueCount = computed(() => {
  return myTodos.value.filter(r => {
    const level = getUrgencyLevel(r)
    return level === 'overdue' || level === 'critical'
  }).length
})

const urgentItems = computed(() => {
  return store.registrations
    .filter(r => r.status !== 'completed' && r.status !== 'rejected')
    .sort((a, b) => {
      const wa = urgencySortWeight(a)
      const wb = urgencySortWeight(b)
      if (wa !== wb) return wa - wb
      return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime()
    })
    .slice(0, 10)
})

const pipelineRoles: Role[] = ['赛事运营', '网管', '店长']
const pressureRoles: Role[] = ['网管', '赛事运营', '店长']

const pipelineByRole = computed(() => {
  const result: Record<string, { count: number; overdue: number; items: Registration[] }> = {}
  for (const role of pipelineRoles) {
    const items = store.registrations.filter(
      r => r.current_owner_role === role && r.status !== 'completed' && r.status !== 'rejected'
    )
    const overdue = items.filter(r => {
      const slaDeadline = new Date(r.owner_since).getTime() + r.sla_minutes * 60 * 1000
      return now.value.getTime() > slaDeadline
    }).length
    result[role] = { count: items.length, overdue, items }
  }
  return result
})

const pressureScore = computed(() => {
  let score = 0
  const active = store.registrations.filter(r => r.status !== 'completed' && r.status !== 'rejected')
  for (const reg of active) {
    const level = getUrgencyLevel(reg)
    switch (level) {
      case 'overdue': score += 30; break
      case 'critical': score += 20; break
      case 'warning': score += 10; break
      default: score += 3; break
    }
    if (reg.available_seats && reg.available_seats.gap > 0) score += 15
  }
  score += store.stats.conflicts * 10
  score += store.stats.escalated * 8
  return Math.min(100, score)
})

const pressurePercent = computed(() => Math.min(100, pressureScore.value))

const pressureLabel = computed(() => {
  const s = pressureScore.value
  if (s >= 80) return '危急'
  if (s >= 50) return '紧张'
  if (s >= 25) return '一般'
  return '正常'
})

const pressureBarColor = computed(() => {
  const s = pressureScore.value
  if (s >= 80) return '#FF3B30'
  if (s >= 50) return '#FF9500'
  if (s >= 25) return '#FFCC00'
  return '#00FF88'
})

const pressureBorderColor = computed(() => {
  const s = pressureScore.value
  if (s >= 80) return 'border-l-alert'
  if (s >= 50) return 'border-l-[#FF9500]'
  if (s >= 25) return 'border-l-warning'
  return 'border-l-accent'
})

const pressureBadgeStyle = computed(() => {
  const color = pressureBarColor.value
  return {
    color,
    backgroundColor: `${color}20`,
    border: `1px solid ${color}40`,
  }
})

const pressureBarAnimClass = computed(() => {
  if (pressureScore.value >= 80) return 'pulse-fast'
  if (pressureScore.value >= 50) return 'pulse-slow'
  return ''
})

const pressureTextClass = computed(() => {
  const s = pressureScore.value
  if (s >= 80) return 'text-alert text-glow-red'
  if (s >= 50) return 'text-[#FF9500] text-glow-yellow'
  if (s >= 25) return 'text-warning'
  return 'text-accent'
})

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatRefreshTime(date: Date) {
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}
</script>

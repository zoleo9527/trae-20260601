<template>
  <div v-if="!registration" class="flex items-center justify-center py-20">
    <p class="text-text-secondary">加载中...</p>
  </div>

  <div v-else class="space-y-5">
    <div class="flex items-center gap-3">
      <button class="text-text-secondary hover:text-accent transition-colors" @click="$router.push('/registrations')">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h2 class="font-heading text-xl font-bold text-text-primary">{{ registration.event_name }}</h2>
      <StatusBadge :status="registration.status" />
    </div>

    <div v-if="siblingGroups && Object.keys(siblingGroups).length > 1" class="card p-4">
      <h4 class="font-heading text-sm font-semibold text-accent mb-3 flex items-center gap-2">
        <Users class="w-4 h-4" />
        同赛事报名（{{ siblingsTotal }}）
      </h4>
      <div class="flex flex-wrap gap-2">
        <template v-for="(regs, status) in siblingGroups" :key="status">
          <div
            v-for="sib in regs"
            :key="sib.id"
          >
            <router-link
              :to="`/registrations/${sib.id}`"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-all hover:scale-105"
              :style="siblingLinkStyle(sib, status)"
            >
              <span class="font-medium">{{ sib.team_name }}</span>
              <span class="opacity-60">{{ STATUS_LABELS[sib.status] || sib.status }}</span>
              <span v-if="sib.id === registration.id" class="text-accent font-bold">← 当前</span>
            </router-link>
          </div>
        </template>
      </div>
    </div>

    <div
      class="relative rounded-xl p-5 border-2 transition-all duration-300"
      :style="ownerBannerStyle"
      :class="ownerOverdue ? 'pulse-fast' : ownerCritical ? 'pulse-slow' : ''"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div>
            <div class="text-xs text-text-secondary mb-1">当前责任方</div>
            <div class="font-heading text-3xl font-bold" :style="{ color: ownerColor }">
              {{ registration.current_owner_role }}
            </div>
          </div>
          <div v-if="registration.current_owner_role === store.currentRole" class="flex items-center gap-2">
            <span class="font-heading text-lg font-bold text-accent pulse-slow">← 你</span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-text-secondary mb-1">责任计时</div>
          <div class="font-heading text-2xl font-bold tabular-nums" :class="ownerTimerClass">
            {{ ownerElapsed }}
          </div>
          <div class="text-xs mt-1" :class="slaExceeded ? 'text-alert' : 'text-text-secondary'">
            SLA {{ registration.sla_minutes }}分钟
            <span v-if="slaExceeded" class="text-alert font-bold"> · 已超时</span>
            <span v-else-if="slaRemaining > 0" class="text-warning"> · 剩余{{ slaRemaining }}分钟</span>
          </div>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-4 text-xs text-text-secondary">
        <span>接手于 {{ formatDateTime(registration.owner_since) }}</span>
        <span>·</span>
        <span>由 {{ registration.submitted_by }} 提交</span>
        <span v-if="registration.confirmed_by">· {{ registration.confirmed_by }} 确认</span>
      </div>
      <div v-if="slaExceeded && registration.current_owner_role === store.currentRole" class="mt-3 flex items-center gap-2 px-3 py-2 rounded bg-alert/10 border border-alert/30">
        <AlertTriangle class="w-4 h-4 text-alert shrink-0" />
        <span class="text-sm text-alert font-heading font-semibold">你的责任已超时，请立即处理或升级</span>
      </div>
    </div>

    <div v-if="seatGap > 0" class="card p-5 border-l-4 border-l-alert">
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-6 h-6 text-alert shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="font-heading text-lg font-bold text-alert">
            座席不足：需要 {{ registration.available_seats?.total_needed ?? registration.player_count }} 台，仅 {{ registration.available_seats?.total_available ?? 0 }} 台可用，缺口 {{ seatGap }} 台
          </p>
          <div v-if="registration.available_seats?.by_zone" class="mt-3 grid grid-cols-4 gap-3">
            <div
              v-for="(count, zone) in registration.available_seats.by_zone"
              :key="zone"
              class="bg-bg-primary/60 rounded px-3 py-2"
            >
              <p class="text-xs text-text-secondary">{{ zone }}区</p>
              <p class="text-sm font-heading font-semibold" :class="count > 0 ? 'text-accent' : 'text-alert'">{{ count }} 台可用</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-5">
      <div class="col-span-2 space-y-5">

        <div class="card p-6">
          <h3 class="font-heading text-lg font-semibold text-accent mb-4">报名信息</h3>
          <div class="grid grid-cols-3 gap-6">
            <div>
              <p class="text-xs text-text-secondary mb-1">赛事名称</p>
              <p class="text-sm text-text-primary">{{ registration.event_name }}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">队伍名称</p>
              <p class="text-sm text-text-primary">{{ registration.team_name }}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">参赛人数</p>
              <p class="text-sm text-text-primary">{{ registration.player_count }}人</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">设备要求</p>
              <p class="text-sm text-text-primary">{{ registration.device_requirement || '无' }}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">提交人</p>
              <p class="text-sm text-text-primary">{{ registration.submitted_by }}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">截止时间</p>
              <CountdownTimer :deadline="registration.deadline_at" />
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-heading text-lg font-semibold text-accent mb-4">处理流程</h3>
          <div class="flex justify-center py-4">
            <StepProgress :status="registration.status" />
          </div>
        </div>

        <div v-if="registration.seat_allocation" class="card p-6 border-l-4" :class="allocationBorderColor">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-lg font-semibold text-accent flex items-center gap-2">
              <Monitor class="w-5 h-5" />
              座位分配
            </h3>
            <div class="flex items-center gap-3">
              <span
                class="text-xs font-heading font-semibold px-2 py-1 rounded"
                :style="allocBadgeStyle"
              >
                {{ allocStatusLabel }}
              </span>
              <router-link
                :to="`/seats/allocations/${registration.seat_allocation.id}`"
                class="text-xs text-accent hover:underline"
              >
                查看详情 →
              </router-link>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-xs text-text-secondary mb-1">分配人</p>
              <p class="text-sm text-text-primary">{{ registration.seat_allocation.allocated_by }}</p>
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">分配时间</p>
              <p class="text-sm text-text-primary">{{ formatDateTime(registration.seat_allocation.allocated_at) }}</p>
            </div>
            <div v-if="registration.seat_allocation.confirmed_by">
              <p class="text-xs text-text-secondary mb-1">确认人</p>
              <p class="text-sm text-text-primary">{{ registration.seat_allocation.confirmed_by }}</p>
            </div>
            <div v-if="registration.seat_allocation.confirmed_at">
              <p class="text-xs text-text-secondary mb-1">确认时间</p>
              <p class="text-sm text-text-primary">{{ formatDateTime(registration.seat_allocation.confirmed_at) }}</p>
            </div>
          </div>

          <div class="mb-3">
            <p class="text-xs text-text-secondary mb-2">分配座位</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="seatId in (registration.seat_allocation.seat_ids || '').split(',')"
                :key="seatId"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-accent/10 border border-accent/30 text-accent text-xs font-heading"
              >
                <Monitor class="w-3 h-3" />
                {{ seatDisplayName(seatId) }}
              </span>
            </div>
          </div>

          <div v-if="registration.seat_allocation.conflict_reason" class="mt-3 p-3 rounded bg-alert/5 border border-alert/20">
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-alert shrink-0 mt-0.5" />
              <div>
                <p class="text-xs text-text-secondary mb-0.5">冲突原因</p>
                <p class="text-sm text-alert">{{ registration.seat_allocation.conflict_reason }}</p>
              </div>
            </div>
          </div>

          <div v-if="canConfirmAllocation || canReleaseAllocation" class="mt-4 pt-4 border-t border-border-card">
            <div class="flex items-start gap-4">
              <div class="flex gap-3">
                <button v-if="canConfirmAllocation" class="btn-primary" @click="handleAllocationAction('confirmed')">确认分配</button>
                <button v-if="canReleaseAllocation" class="btn-danger" @click="handleAllocationAction('released')">释放座位</button>
              </div>
              <div class="flex-1">
                <textarea
                  v-model="allocActionNote"
                  class="input-dark min-h-[50px] resize-none"
                  placeholder="请输入操作备注（必填）"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-heading text-lg font-semibold text-accent mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5" />
            座位分配时间线
          </h3>
          <div v-if="!allocationTimeline.length" class="text-text-secondary text-sm py-4 text-center">
            暂无分配记录
          </div>
          <div v-else class="relative max-h-[400px] overflow-y-auto pr-2">
            <div
              v-for="(event, idx) in allocationTimeline"
              :key="idx"
              class="relative pl-8 pb-5"
            >
              <div
                class="absolute left-[11px] top-2 w-3 h-3 rounded-full z-10 ring-2 ring-bg-primary"
                :style="{ backgroundColor: event.type === 'allocation' ? timelineAllocColor(event.data) : roleColor(event.data.operator_role) }"
              />
              <div
                v-if="idx < allocationTimeline.length - 1"
                class="absolute left-[16px] top-5 w-0.5 bg-border-card"
                :style="{ height: 'calc(100% - 16px)' }"
              />

              <div class="rounded-lg p-3" :class="event.type === 'allocation' ? 'bg-bg-primary/50' : timelineLogBg(event.data)">
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <template v-if="event.type === 'allocation'">
                    <span class="text-xs font-semibold" :style="{ color: timelineAllocColor(event.data) }">
                      {{ timelineAllocLabel(event.data) }}
                    </span>
                    <span class="text-xs text-text-secondary">{{ event.data.allocated_by }}</span>
                  </template>
                  <template v-else>
                    <span class="text-xs font-semibold" :style="{ color: roleColor(event.data.operator_role) }">
                      {{ event.data.operator_role }}
                    </span>
                    <span class="text-xs text-text-secondary">{{ event.data.operator_name }}</span>
                    <NoteTypeTag :type="event.data.note_type" />
                    <div
                      v-if="event.data.from_role && event.data.to_role"
                      class="flex items-center gap-1 px-2 py-0.5 rounded bg-bg-card border border-border-card"
                    >
                      <span class="text-xs font-medium" :style="{ color: roleColor(event.data.from_role) }">{{ event.data.from_role }}</span>
                      <span class="text-xs text-accent">→</span>
                      <span class="text-xs font-medium" :style="{ color: roleColor(event.data.to_role) }">{{ event.data.to_role }}</span>
                    </div>
                  </template>
                  <span class="text-xs text-text-secondary ml-auto whitespace-nowrap">
                    {{ formatDateTime(event.type === 'allocation' ? event.data.allocated_at : event.data.created_at) }}
                  </span>
                </div>

                <p v-if="event.type === 'allocation'" class="text-sm text-accent font-medium">
                  分配 {{ (event.data.seat_ids || '').split(',').map(seatDisplayName).join(', ') }}
                </p>
                <p v-else class="text-sm text-accent font-medium">{{ event.data.action }}</p>

                <p v-if="event.type === 'allocation' && event.data.conflict_reason" class="text-sm text-alert mt-1">
                  ⚠ {{ event.data.conflict_reason }}
                </p>
                <p v-if="event.type !== 'allocation' && event.data.note" class="text-sm text-text-secondary mt-1">{{ event.data.note }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="actionSections.length > 0" class="card p-6 space-y-5">
          <h3 class="font-heading text-lg font-semibold text-accent">操作面板</h3>

          <div v-for="section in actionSections" :key="section.key" class="space-y-3">
            <div class="text-xs text-text-secondary font-medium uppercase tracking-wider">{{ section.label }}</div>
            <div class="flex items-start gap-4">
              <div class="flex gap-3 flex-wrap">
                <button
                  v-for="act in section.actions"
                  :key="act.label"
                  class="btn-primary"
                  :class="act.danger ? 'btn-danger' : act.warning ? 'btn-warning' : ''"
                  :disabled="act.disabled"
                  @click="handleAction(act)"
                >
                  {{ act.label }}
                </button>
              </div>
              <div class="flex-1">
                <textarea
                  v-model="actionNote"
                  class="input-dark min-h-[60px] resize-none"
                  placeholder="请输入操作备注（必填）"
                />
              </div>
            </div>

            <div v-if="section.key === 'confirm-seat-shortage'" class="flex items-center gap-2 bg-alert/5 border border-alert/20 rounded px-3 py-2">
              <input
                id="seat-ack"
                v-model="seatShortageAcknowledged"
                type="checkbox"
                class="accent-alert w-4 h-4"
              />
              <label for="seat-ack" class="text-sm text-alert">
                我已了解座席不足风险
              </label>
            </div>

            <div v-if="section.key === 'escalate'" class="space-y-2">
              <textarea
                v-model="escalateReason"
                class="input-dark min-h-[60px] resize-none"
                placeholder="升级原因（必填）"
              />
            </div>
          </div>
        </div>

        <div v-if="hasDispute" class="card p-6 border-l-4 border-l-[#BF5AF2]">
          <h3 class="font-heading text-lg font-semibold mb-4 flex items-center gap-2" style="color: #BF5AF2">
            <Shield class="w-5 h-5" />
            店长仲裁面板
          </h3>
          <p class="text-sm text-text-secondary mb-4">该报名存在争议备注，店长可进行仲裁操作</p>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <button
                class="btn-primary flex items-center justify-center gap-2"
                :disabled="arbitrationLoading"
                @click="handleArbitration('confirm_ownership')"
              >
                <ShieldCheck class="w-4 h-4" />
                确认归属
              </button>
              <button
                class="btn-warning flex items-center justify-center gap-2"
                :disabled="arbitrationLoading"
                @click="handleArbitration('reassign_seats')"
              >
                <RefreshCw class="w-4 h-4" />
                重新指派座位
              </button>
              <button
                class="btn-danger flex items-center justify-center gap-2"
                :disabled="arbitrationLoading"
                @click="handleArbitration('revoke_allocation')"
              >
                <XCircle class="w-4 h-4" />
                撤销分配
              </button>
              <button
                class="btn-primary flex items-center justify-center gap-2 !bg-[#BF5AF2] hover:!bg-[#9B3FD4]"
                :disabled="arbitrationLoading"
                @click="handleArbitration('record_ruling')"
              >
                <FileText class="w-4 h-4" />
                登记裁决备注
              </button>
            </div>

            <textarea
              v-model="arbitrationNote"
              class="input-dark min-h-[80px] resize-none"
              placeholder="请输入仲裁备注（必填）"
            />

            <div v-if="arbitrationAction === 'reassign_seats'" class="p-3 rounded bg-bg-primary/50 border border-border-card">
              <p class="text-xs text-text-secondary mb-2">选择可用座位</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="seat in availableSeatsList"
                  :key="seat.id"
                  class="px-2 py-1 rounded text-xs font-heading transition-all"
                  :class="selectedArbSeats.has(seat.id) ? 'bg-accent/20 border border-accent/40 text-accent' : 'bg-bg-card border border-border-card text-text-secondary hover:border-accent/40'"
                  @click="toggleArbSeat(seat.id)"
                >
                  {{ seat.seat_number }}
                </button>
              </div>
              <p v-if="selectedArbSeats.size > 0" class="text-xs text-accent mt-2">已选 {{ selectedArbSeats.size }} 个座位</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-heading text-lg font-semibold text-accent mb-4">交接记录</h3>
          <div v-if="!registration.handover_logs?.length" class="text-text-secondary text-sm py-4 text-center">
            暂无交接记录
          </div>
          <div v-else class="relative max-h-[480px] overflow-y-auto pr-2">
            <div
              v-for="(log, idx) in [...(registration.handover_logs || [])].reverse()"
              :key="log.id"
              class="relative pl-8 pb-6"
            >
              <div
                class="absolute left-[11px] top-2 w-3 h-3 rounded-full z-10 ring-2 ring-bg-primary"
                :style="{ backgroundColor: roleColor(log.operator_role) }"
              />
              <div
                v-if="idx < [...(registration.handover_logs || [])].reverse().length - 1"
                class="absolute left-[16px] top-5 w-0.5 bg-border-card"
                :style="{ height: 'calc(100% - 16px)' }"
              />

              <div
                class="rounded-lg p-3"
                :class="log.note_type === 'dispute' || log.note_type === 'urgent' ? 'bg-alert/5 border border-alert/15' : log.note_type === 'arbitration' ? 'bg-[#BF5AF2]/5 border border-[#BF5AF2]/15' : 'bg-bg-primary/50'"
              >
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span class="text-xs font-semibold" :style="{ color: roleColor(log.operator_role) }">
                    {{ log.operator_role }}
                  </span>
                  <span class="text-xs text-text-secondary">{{ log.operator_name }}</span>
                  <NoteTypeTag :type="log.note_type" />

                  <div
                    v-if="log.from_role && log.to_role"
                    class="flex items-center gap-1 ml-2 px-2 py-0.5 rounded bg-bg-card border border-border-card"
                  >
                    <span class="text-xs font-medium" :style="{ color: roleColor(log.from_role) }">{{ log.from_role }}</span>
                    <span class="text-xs text-accent">→</span>
                    <span class="text-xs font-medium" :style="{ color: roleColor(log.to_role) }">{{ log.to_role }}</span>
                  </div>

                  <span class="text-xs text-text-secondary ml-auto whitespace-nowrap">{{ formatDateTime(log.created_at) }}</span>
                </div>
                <p class="text-sm text-accent font-medium">{{ log.action }}</p>
                <p v-if="log.note" class="text-sm text-text-secondary mt-1">{{ log.note }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-heading text-lg font-semibold text-accent mb-4">添加备注</h3>
          <div class="flex gap-3">
            <select v-model="noteType" class="select-dark !w-32 shrink-0">
              <option value="normal">正常</option>
              <option value="urgent">紧急</option>
              <option value="dispute">争议</option>
              <option value="supplement">补充</option>
            </select>
            <input
              v-model="noteContent"
              class="input-dark flex-1"
              placeholder="输入备注内容..."
              @keyup.enter="submitNote"
            />
            <button class="btn-primary" @click="submitNote">提交</button>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-lg font-semibold text-accent flex items-center gap-2">
              <Paperclip class="w-5 h-5" />
              附件
            </h3>
            <button class="btn-primary !text-xs !px-2 !py-1" @click="showAddAttachment = true">
              + 添加
            </button>
          </div>

          <div v-if="showAddAttachment" class="mb-4 p-3 rounded bg-bg-primary/50 border border-border-card space-y-3">
            <select v-model="newAttachmentCategory" class="select-dark !w-full">
              <option value="现场照片">📸 赛事现场照片</option>
              <option value="聊天记录">💬 聊天记录</option>
            </select>
            <input v-model="newAttachmentName" class="input-dark !w-full" placeholder="文件名称" />
            <textarea v-model="newAttachmentDesc" class="input-dark min-h-[50px] resize-none" placeholder="描述（选填）" />
            <div class="flex gap-2">
              <button class="btn-primary !text-xs" @click="addAttachment">确认添加</button>
              <button class="btn-primary !text-xs !bg-text-secondary" @click="showAddAttachment = false">取消</button>
            </div>
          </div>

          <div v-if="!registration.attachments?.length" class="text-text-secondary text-sm py-4 text-center">
            暂无附件
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="att in registration.attachments"
              :key="att.id"
              class="border rounded-lg p-3"
              :class="att.category === '现场照片' ? 'border-accent/30 bg-accent/5' : 'border-[#5AC8FA]/30 bg-[#5AC8FA]/5'"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm">
                  {{ att.category === '现场照片' ? '📸' : '💬' }}
                </span>
                <span class="text-sm text-text-primary font-medium truncate flex-1">{{ att.file_name }}</span>
                <span
                  class="text-xs font-medium px-1.5 py-0.5 rounded"
                  :style="att.status === 'placeholder'
                    ? { color: '#FFCC00', backgroundColor: '#FFCC0020', border: '1px solid #FFCC0030' }
                    : { color: '#00FF88', backgroundColor: '#00FF8820', border: '1px solid #00FF8830' }"
                >
                  {{ att.status === 'placeholder' ? '占位' : '已上传' }}
                </span>
              </div>
              <p v-if="att.description" class="text-xs text-text-secondary mb-1">{{ att.description }}</p>
              <div class="flex items-center gap-2 text-xs text-text-secondary">
                <span v-if="att.category" class="px-1.5 py-0.5 rounded"
                  :style="att.category === '现场照片'
                    ? { color: '#00FF88', backgroundColor: '#00FF8820' }
                    : { color: '#5AC8FA', backgroundColor: '#5AC8FA20' }"
                >
                  {{ att.category }}
                </span>
                <span>{{ att.file_size }}</span>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <button
                  v-if="att.status === 'placeholder'"
                  class="btn-primary !text-xs !px-2 !py-1"
                  @click="markAttachmentUploaded(att.id)"
                >
                  标记已上传
                </button>
                <button
                  class="text-xs text-text-secondary hover:text-accent"
                  @click="editAttachmentDesc(att)"
                >
                  编辑描述
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="siblingGroups && Object.keys(siblingGroups).length > 0" class="card p-6">
          <h3 class="font-heading text-lg font-semibold text-accent mb-4 flex items-center gap-2">
            <GitBranch class="w-5 h-5" />
            同赛事报名
          </h3>
          <div class="space-y-3">
            <div v-for="(regs, status) in siblingGroups" :key="status">
              <div class="text-xs text-text-secondary font-medium mb-1.5 flex items-center gap-2">
                <span
                  class="inline-block w-2 h-2 rounded-full"
                  :style="{ backgroundColor: STATUS_COLORS[status] || '#8B949E' }"
                />
                {{ STATUS_LABELS[status] || status }}（{{ regs.length }}）
              </div>
              <div class="space-y-1 ml-4">
                <router-link
                  v-for="sib in regs"
                  :key="sib.id"
                  :to="`/registrations/${sib.id}`"
                  class="block text-sm px-2 py-1.5 rounded transition-colors"
                  :class="sib.id === registration.id ? 'bg-accent/10 text-accent font-semibold' : 'text-text-primary hover:bg-bg-primary/50'"
                >
                  {{ sib.team_name }}
                  <span v-if="sib.id === registration.id" class="text-xs text-accent">（当前）</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, FileText, AlertTriangle, Upload, Monitor, Clock,
  Shield, ShieldCheck, RefreshCw, XCircle, Paperclip, Users, GitBranch,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import type { Registration, HandoverLog, Seat } from '@/types'
import { ROLE_COLORS, STATUS_LABELS, STATUS_COLORS } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import StepProgress from '@/components/StepProgress.vue'
import NoteTypeTag from '@/components/NoteTypeTag.vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const registration = ref<Registration | null>(null)
const actionNote = ref('')
const noteType = ref<HandoverLog['note_type']>('normal')
const noteContent = ref('')
const seatShortageAcknowledged = ref(false)
const escalateReason = ref('')
const allocActionNote = ref('')
const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

const allocationTimeline = ref<{ type: 'allocation' | 'log'; data: Record<string, unknown> }[]>([])
const siblingGroups = ref<Record<string, Registration[]> | null>(null)
const siblingsTotal = ref(0)

const arbitrationNote = ref('')
const arbitrationAction = ref<string | null>(null)
const arbitrationLoading = ref(false)
const selectedArbSeats = ref<Set<string>>(new Set())

const showAddAttachment = ref(false)
const newAttachmentCategory = ref('现场照片')
const newAttachmentName = ref('')
const newAttachmentDesc = ref('')

onMounted(async () => {
  const id = route.params.id as string
  registration.value = await store.fetchRegistration(id)
  timer = setInterval(() => { now.value = new Date() }, 1000)

  if (registration.value) {
    allocationTimeline.value = await store.fetchAllocationTimeline(id)

    const siblingData = await store.fetchSiblings(registration.value.event_name)
    if (siblingData) {
      siblingGroups.value = siblingData.by_status
      siblingsTotal.value = siblingData.total
    }
  }
})

onUnmounted(() => {
  clearInterval(timer)
})

const ownerColor = computed(() => {
  if (!registration.value) return '#8B949E'
  return ROLE_COLORS[registration.value.current_owner_role] ?? '#8B949E'
})

const ownerBannerStyle = computed(() => {
  const c = ownerColor.value
  return {
    borderColor: c,
    boxShadow: `0 0 20px ${c}30, 0 0 40px ${c}15, inset 0 0 20px ${c}08`,
    backgroundColor: `${c}08`,
  }
})

const ownerElapsed = computed(() => {
  if (!registration.value) return '--:--'
  const since = new Date(registration.value.owner_since).getTime()
  const diff = now.value.getTime() - since
  if (diff < 0) return '00:00'
  const totalMin = Math.floor(diff / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}分`
})

const slaExceeded = computed(() => {
  if (!registration.value) return false
  const since = new Date(registration.value.owner_since).getTime()
  const sla = registration.value.sla_minutes * 60 * 1000
  return now.value.getTime() - since > sla
})

const slaRemaining = computed(() => {
  if (!registration.value) return 0
  const since = new Date(registration.value.owner_since).getTime()
  const sla = registration.value.sla_minutes * 60 * 1000
  const remaining = Math.max(0, Math.ceil((since + sla - now.value.getTime()) / 60000))
  return remaining
})

const ownerOverdue = computed(() => {
  if (!registration.value) return false
  return getUrgencyLevel(registration.value) === 'overdue' || getUrgencyLevel(registration.value) === 'critical'
})

const ownerCritical = computed(() => {
  if (!registration.value) return false
  return getUrgencyLevel(registration.value) === 'warning'
})

const ownerTimerClass = computed(() => {
  if (slaExceeded.value) return 'text-alert text-glow-red'
  if (slaRemaining.value <= 5) return 'text-warning'
  return 'text-accent'
})

const seatGap = computed(() => {
  if (!registration.value?.available_seats) return 0
  return registration.value.available_seats.gap
})

const seatMap = computed(() => {
  const map = new Map<string, Seat>()
  if (!store.seats.length) return map
  for (const s of store.seats) map.set(s.id, s)
  return map
})

const hasDispute = computed(() => {
  if (!registration.value?.handover_logs) return false
  return registration.value.handover_logs.some(l => l.note_type === 'dispute')
})

const availableSeatsList = computed(() => {
  return store.seats.filter(s => s.status === 'available')
})

function seatDisplayName(seatId: string): string {
  const seat = seatMap.value.get(seatId.trim())
  return seat?.seat_number ?? seatId.trim()
}

function siblingLinkStyle(sib: Registration, status: string): Record<string, string> {
  const color = STATUS_COLORS[status as Registration['status']] || '#8B949E'
  if (sib.id === registration.value?.id) {
    return { color: '#00FF88', backgroundColor: '#00FF8815', border: '1px solid #00FF8830' }
  }
  return { color, backgroundColor: `${color}10`, border: `1px solid ${color}25` }
}

const allocStatusLabel = computed(() => {
  if (!registration.value?.seat_allocation) return ''
  switch (registration.value.seat_allocation.status) {
    case 'pending': return '待确认'
    case 'confirmed': return '已确认'
    case 'released': return '已释放'
    default: return ''
  }
})

const allocBadgeStyle = computed(() => {
  if (!registration.value?.seat_allocation) return {}
  let color = '#8B949E'
  switch (registration.value.seat_allocation.status) {
    case 'pending': color = '#FFCC00'; break
    case 'confirmed': color = '#00FF88'; break
    case 'released': color = '#8B949E'; break
  }
  return {
    color,
    backgroundColor: `${color}20`,
    border: `1px solid ${color}40`,
  }
})

const allocationBorderColor = computed(() => {
  if (!registration.value?.seat_allocation) return 'border-l-accent'
  switch (registration.value.seat_allocation.status) {
    case 'pending': return 'border-l-warning'
    case 'confirmed': return 'border-l-accent'
    case 'released': return 'border-l-text-secondary'
    default: return 'border-l-accent'
  }
})

const canConfirmAllocation = computed(() => {
  if (!registration.value?.seat_allocation) return false
  return registration.value.seat_allocation.status === 'pending' && (store.currentRole === '赛事运营' || store.currentRole === '店长')
})

const canReleaseAllocation = computed(() => {
  if (!registration.value?.seat_allocation) return false
  return registration.value.seat_allocation.status === 'pending' && (store.currentRole === '网管' || store.currentRole === '店长')
})

function timelineAllocColor(data: Record<string, unknown>): string {
  switch (data.status) {
    case 'pending': return '#FFCC00'
    case 'confirmed': return '#00FF88'
    case 'released': return '#8B949E'
    default: return '#8B949E'
  }
}

function timelineAllocLabel(data: Record<string, unknown>): string {
  switch (data.status) {
    case 'pending': return '分配（待确认）'
    case 'confirmed': return '分配（已确认）'
    case 'released': return '分配（已释放）'
    default: return '分配'
  }
}

function timelineLogBg(data: Record<string, unknown>): string {
  if (data.note_type === 'dispute' || data.note_type === 'urgent') return 'bg-alert/5 border border-alert/15'
  if (data.note_type === 'arbitration') return 'bg-[#BF5AF2]/5 border border-[#BF5AF2]/15'
  return 'bg-bg-primary/50'
}

interface ActionItem {
  label: string
  action: string
  newStatus: Registration['status']
  danger?: boolean
  warning?: boolean
  disabled?: boolean
  requiresSeatAck?: boolean
}

interface ActionSection {
  key: string
  label: string
  actions: ActionItem[]
}

const actionSections = computed<ActionSection[]>(() => {
  if (!registration.value) return []
  const status = registration.value.status
  const role = store.currentRole
  const sections: ActionSection[] = []

  if (status === 'pending' && role === '赛事运营') {
    const hasSeatShortage = seatGap.value > 0
    sections.push({
      key: hasSeatShortage ? 'confirm-seat-shortage' : 'confirm',
      label: hasSeatShortage ? '确认报名（座席不足）' : '报名操作',
      actions: [
        {
          label: hasSeatShortage ? '确认报名（座席不足）' : '确认报名',
          action: '确认报名',
          newStatus: 'confirmed',
          disabled: hasSeatShortage && !seatShortageAcknowledged.value,
          requiresSeatAck: hasSeatShortage,
          warning: hasSeatShortage,
        },
        { label: '驳回报名', action: '驳回报名', newStatus: 'rejected', danger: true },
      ],
    })
  }

  if (status === 'confirmed' && role === '网管') {
    sections.push({
      key: 'seating',
      label: '座位分配',
      actions: [
        { label: '分配座位', action: '分配座位', newStatus: 'seating' },
      ],
    })
  }

  if (status === 'escalated' && role === '店长') {
    sections.push({
      key: 'escalated-actions',
      label: '升级处理',
      actions: [
        { label: '强制确认', action: '强制确认', newStatus: 'confirmed' },
        { label: '强制驳回', action: '强制驳回', newStatus: 'rejected', danger: true },
      ],
    })
  }

  if (status !== 'completed' && status !== 'rejected' && !(status === 'escalated' && role === '店长')) {
    sections.push({
      key: 'escalate',
      label: '升级处理',
      actions: [
        { label: '升级到店长', action: '升级到店长', newStatus: 'escalated', warning: true },
      ],
    })
  }

  return sections
})

function getUrgencyLevel(reg: Registration): 'overdue' | 'critical' | 'warning' | 'normal' {
  const deadline = new Date(reg.deadline_at).getTime()
  const slaDeadline = new Date(reg.owner_since).getTime() + reg.sla_minutes * 60 * 1000
  const n = now.value.getTime()
  if (deadline < n && reg.status !== 'completed' && reg.status !== 'rejected') return 'overdue'
  if (slaDeadline < n) return 'critical'
  if (deadline - n < 10 * 60 * 1000) return 'warning'
  return 'normal'
}

async function handleAllocationAction(status: 'confirmed' | 'released') {
  if (!registration.value?.seat_allocation) return
  if (!allocActionNote.value.trim()) {
    alert('请输入操作备注')
    return
  }
  const success = await store.updateAllocation(registration.value.seat_allocation.id, {
    status,
    confirmed_by: status === 'confirmed' ? store.currentName : undefined,
  })
  if (success) {
    const noteTypeVal = status === 'confirmed' ? 'normal' : 'dispute'
    const actionLabel = status === 'confirmed' ? '确认座位分配' : '释放座位'
    await store.addNote(registration.value.id, noteTypeVal, `${actionLabel}: ${allocActionNote.value}`)
    registration.value = await store.fetchRegistration(registration.value.id)
    allocationTimeline.value = await store.fetchAllocationTimeline(registration.value.id)
    allocActionNote.value = ''
  }
}

async function handleAction(action: ActionItem) {
  if (!registration.value) return
  if (!actionNote.value.trim()) {
    alert('请输入操作备注')
    return
  }
  if (action.action === '升级到店长') {
    if (!escalateReason.value.trim()) {
      alert('请输入升级原因')
      return
    }
    const success = await store.escalateRegistration(registration.value.id, escalateReason.value)
    if (success) {
      await store.addNote(registration.value.id, 'urgent', actionNote.value)
      registration.value = await store.fetchRegistration(registration.value.id)
      actionNote.value = ''
      escalateReason.value = ''
    }
    return
  }
  if (action.action === '分配座位') {
    router.push(`/seat-map?registration_id=${registration.value.id}`)
    return
  }

  const payload: {
    status: Registration['status']
    confirmed_by?: string
    note?: string
    note_type?: string
    conflict_acknowledged?: boolean
  } = {
    status: action.newStatus,
    confirmed_by: store.currentName,
    note: actionNote.value,
    note_type: action.danger ? 'dispute' : 'normal',
  }

  if (action.requiresSeatAck) {
    payload.conflict_acknowledged = seatShortageAcknowledged.value
  }

  const result = await store.updateRegistration(registration.value.id, payload)

  if (result && typeof result === 'object' && 'success' in result) {
    if (result.success) {
      registration.value = await store.fetchRegistration(registration.value.id)
      actionNote.value = ''
      seatShortageAcknowledged.value = false
    } else if (result.error === '座席不足') {
      alert('座席不足，请确认风险后重试')
    }
  }
}

async function handleArbitration(action: 'confirm_ownership' | 'reassign_seats' | 'revoke_allocation' | 'record_ruling') {
  if (!registration.value) return
  if (!arbitrationNote.value.trim()) {
    alert('请输入仲裁备注')
    return
  }

  if (action === 'reassign_seats' && selectedArbSeats.value.size === 0) {
    alert('请至少选择一个座位')
    return
  }

  arbitrationAction.value = action
  arbitrationLoading.value = true

  try {
    const seatIds = action === 'reassign_seats' ? Array.from(selectedArbSeats.value) : undefined
    const result = await store.arbitrateRegistration(
      registration.value.id,
      action,
      arbitrationNote.value,
      seatIds,
    )
    if (result) {
      registration.value = await store.fetchRegistration(registration.value.id)
      allocationTimeline.value = await store.fetchAllocationTimeline(registration.value.id)
      arbitrationNote.value = ''
      selectedArbSeats.value.clear()
      arbitrationAction.value = null
    }
  } finally {
    arbitrationLoading.value = false
  }
}

function toggleArbSeat(seatId: string) {
  if (selectedArbSeats.value.has(seatId)) {
    selectedArbSeats.value.delete(seatId)
  } else {
    selectedArbSeats.value.add(seatId)
  }
}

async function addAttachment() {
  if (!registration.value || !newAttachmentName.value.trim()) {
    alert('请输入文件名称')
    return
  }
  const result = await store.createAttachment(
    registration.value.id,
    newAttachmentName.value,
    '0',
    newAttachmentCategory.value,
    newAttachmentDesc.value || undefined,
  )
  if (result) {
    registration.value = await store.fetchRegistration(registration.value.id)
    newAttachmentName.value = ''
    newAttachmentDesc.value = ''
    showAddAttachment.value = false
  }
}

async function editAttachmentDesc(att: Record<string, unknown>) {
  const desc = prompt('修改描述：', (att.description as string) || '')
  if (desc === null) return
  await store.updateRegistrationAttachment(
    att.registration_id as string,
    att.id as string,
    { description: desc },
  )
  if (registration.value) {
    registration.value = await store.fetchRegistration(registration.value.id)
  }
}

async function markAttachmentUploaded(attId: string) {
  const success = await store.updateAttachment(attId, 'uploaded')
  if (success && registration.value) {
    registration.value = await store.fetchRegistration(registration.value.id)
  }
}

async function submitNote() {
  if (!registration.value || !noteContent.value.trim()) return
  const success = await store.addNote(registration.value.id, noteType.value, noteContent.value)
  if (success) {
    registration.value = await store.fetchRegistration(registration.value.id)
    noteContent.value = ''
  }
}

function roleColor(role: string): string {
  return ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? '#8B949E'
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EpisodeStatus =
  | 'translating'
  | 'timing'
  | 'reviewing'
  | 'rework'
  | 'approved'
  | 'encoding'
  | 'encoded'
  | 'delivering'
  | 'delivered'

export interface Assignee {
  id: string
  name: string
  role: 'translator' | 'timer' | 'reviewer' | 'encoder'
}

export interface Segment {
  id: string
  episodeId: string
  name: string
  startLine: number
  endLine: number
  assigneeId: string
  status: EpisodeStatus
}

export interface FileVersion {
  id: string
  episodeId: string
  segmentId?: string
  version: number
  filePath: string | null
  submittedBy: string
  submittedAt: string
  note: string
  type: 'translation' | 'timing' | 'final'
}

export interface ReviewComment {
  id: string
  episodeId: string
  segmentId?: string
  authorId: string
  type: 'typo' | 'timing' | 'meaning' | 'style' | 'other'
  content: string
  timestamp: string
  status: 'open' | 'resolved'
}

export interface Episode {
  id: string
  projectId: string
  number: number
  title: string
  status: EpisodeStatus
  segments: Segment[]
  assigneeIds: string[]
  deadline: string
  reworkReason?: string
}

export interface Project {
  id: string
  name: string
  totalEpisodes: number
  createdAt: string
  updatedAt: string
  episodes: Episode[]
  lastOpenedAt: string
}

export interface AppState {
  projects: Project[]
  assignees: Assignee[]
  fileVersions: FileVersion[]
  reviewComments: ReviewComment[]
  recentProjectIds: string[]

  addProject: (name: string, totalEpisodes: number) => string
  openProject: (id: string) => void
  updateEpisode: (projectId: string, episodeId: string, updates: Partial<Episode>) => void
  addSegment: (projectId: string, episodeId: string, name: string, startLine: number, endLine: number, assigneeId: string) => void
  addFileVersion: (version: Omit<FileVersion, 'id'>) => void
  addReviewComment: (comment: Omit<ReviewComment, 'id'>) => void
  resolveComment: (commentId: string) => void
  markEpisodeRework: (projectId: string, episodeId: string, reason: string) => void
  approveEpisode: (projectId: string, episodeId: string) => void
  markEncoded: (projectId: string, episodeId: string, outputPath: string) => void
  markDelivering: (projectId: string, episodeId: string) => void
  markDelivered: (projectId: string, episodeId: string) => void
  assignEpisode: (projectId: string, episodeId: string, assigneeIds: string[]) => void
  getProject: (id: string) => Project | undefined
  getEpisodeVersions: (episodeId: string) => FileVersion[]
  getEpisodeComments: (episodeId: string) => ReviewComment[]
  resetData: () => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

const DEMO_ASSIGNEES: Assignee[] = [
  { id: 'a1', name: '张明', role: 'translator' },
  { id: 'a2', name: '李婷', role: 'translator' },
  { id: 'a3', name: '王浩', role: 'timer' },
  { id: 'a4', name: '赵雪', role: 'reviewer' },
  { id: 'a5', name: '陈磊', role: 'encoder' },
  { id: 'a6', name: '刘芳', role: 'translator' },
  { id: 'a7', name: '孙伟', role: 'reviewer' },
  { id: 'a8', name: '周洁', role: 'encoder' },
]

const now = new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const daysLater = (n: number) => new Date(Date.now() + n * 86400000).toISOString()

function buildDemoData(): { projects: Project[]; fileVersions: FileVersion[]; reviewComments: ReviewComment[] } {
  const p1Id = 'p1'
  const p2Id = 'p2'
  const p3Id = 'p3'
  const p4Id = 'p4'

  const projects: Project[] = [
    {
      id: p1Id,
      name: '暗夜行者',
      totalEpisodes: 12,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(0),
      lastOpenedAt: daysAgo(0),
      episodes: [
        {
          id: 'e1-1', projectId: p1Id, number: 1, title: 'EP01',
          status: 'delivered', segments: [], assigneeIds: ['a1', 'a4', 'a5'],
          deadline: daysAgo(20),
        },
        {
          id: 'e1-2', projectId: p1Id, number: 2, title: 'EP02',
          status: 'reviewing', segments: [], assigneeIds: ['a2', 'a7'],
          deadline: daysAgo(5),
        },
        {
          id: 'e1-3', projectId: p1Id, number: 3, title: 'EP03',
          status: 'translating', segments: [], assigneeIds: ['a1'],
          deadline: daysAgo(3),
        },
        {
          id: 'e1-4', projectId: p1Id, number: 4, title: 'EP04',
          status: 'timing', segments: [], assigneeIds: ['a3'],
          deadline: daysLater(5),
        },
      ],
    },
    {
      id: p2Id,
      name: '星际迷途',
      totalEpisodes: 8,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(1),
      lastOpenedAt: daysAgo(1),
      episodes: [
        {
          id: 'e2-1', projectId: p2Id, number: 1, title: 'EP01',
          status: 'delivered', segments: [], assigneeIds: ['a6', 'a4', 'a8'],
          deadline: daysAgo(10),
        },
        {
          id: 'e2-2', projectId: p2Id, number: 2, title: 'EP02',
          status: 'approved', segments: [], assigneeIds: ['a1', 'a7'],
          deadline: daysAgo(3),
        },
        {
          id: 'e2-3', projectId: p2Id, number: 3, title: 'EP03',
          status: 'reviewing', segments: [], assigneeIds: ['a2', 'a4'],
          deadline: daysLater(2),
        },
        {
          id: 'e2-4', projectId: p2Id, number: 4, title: 'EP04',
          status: 'translating', segments: [], assigneeIds: ['a6'],
          deadline: daysLater(7),
        },
        {
          id: 'e2-5', projectId: p2Id, number: 5, title: 'EP05',
          status: 'rework', segments: [
            { id: 's2-5-1', episodeId: 'e2-5', name: '前半段', startLine: 1, endLine: 250, assigneeId: 'a1', status: 'rework' },
            { id: 's2-5-2', episodeId: 'e2-5', name: '后半段', startLine: 251, endLine: 520, assigneeId: 'a2', status: 'rework' },
          ], assigneeIds: ['a1', 'a2', 'a7'],
          deadline: daysAgo(1),
          reworkReason: '专业术语翻译不统一（如 "compromise" 译为"妥协了"应为"妥协"），后半段时间轴偏移约0.5秒，语气词使用需精简',
        },
      ],
    },
    {
      id: p3Id,
      name: '古城秘境',
      totalEpisodes: 6,
      createdAt: daysAgo(15),
      updatedAt: daysAgo(2),
      lastOpenedAt: daysAgo(2),
      episodes: [
        {
          id: 'e3-1', projectId: p3Id, number: 1, title: 'EP01',
          status: 'encoded', segments: [], assigneeIds: ['a1', 'a4', 'a5'],
          deadline: daysAgo(5),
        },
        {
          id: 'e3-2', projectId: p3Id, number: 2, title: 'EP02',
          status: 'reviewing', segments: [], assigneeIds: ['a2', 'a7'],
          deadline: daysAgo(1),
        },
        {
          id: 'e3-3', projectId: p3Id, number: 3, title: 'EP03',
          status: 'translating', segments: [], assigneeIds: ['a6'],
          deadline: daysLater(5),
        },
      ],
    },
    {
      id: p4Id,
      name: '风之声',
      totalEpisodes: 10,
      createdAt: daysAgo(25),
      updatedAt: daysAgo(0),
      lastOpenedAt: daysAgo(0),
      episodes: [
        {
          id: 'e4-1', projectId: p4Id, number: 1, title: 'EP01',
          status: 'delivering', segments: [], assigneeIds: ['a1', 'a4', 'a8'],
          deadline: daysAgo(2),
        },
        {
          id: 'e4-2', projectId: p4Id, number: 2, title: 'EP02',
          status: 'encoding', segments: [], assigneeIds: ['a2', 'a5'],
          deadline: daysLater(1),
        },
        {
          id: 'e4-3', projectId: p4Id, number: 3, title: 'EP03',
          status: 'approved', segments: [], assigneeIds: ['a6', 'a7'],
          deadline: daysLater(4),
        },
        {
          id: 'e4-4', projectId: p4Id, number: 4, title: 'EP04',
          status: 'reviewing', segments: [], assigneeIds: ['a1', 'a4'],
          deadline: daysLater(6),
        },
      ],
    },
  ]

  const fileVersions: FileVersion[] = [
    { id: 'v1', episodeId: 'e1-1', version: 1, filePath: '/Volumes/subs/暗夜行者/EP01_v1.ass', submittedBy: 'a1', submittedAt: daysAgo(22), note: '初稿', type: 'translation' },
    { id: 'v2', episodeId: 'e1-1', version: 2, filePath: '/Volumes/subs/暗夜行者/EP01_v2.ass', submittedBy: 'a1', submittedAt: daysAgo(21), note: '校对后修改', type: 'translation' },
    { id: 'v3', episodeId: 'e1-2', version: 1, filePath: '/Volumes/subs/暗夜行者/EP02_v1.ass', submittedBy: 'a2', submittedAt: daysAgo(7), note: '翻译提交', type: 'translation' },
    { id: 'v4', episodeId: 'e1-3', version: 1, filePath: null, submittedBy: 'a1', submittedAt: daysAgo(4), note: '开始翻译，尚未提交文件', type: 'translation' },
    { id: 'v5', episodeId: 'e2-1', version: 1, filePath: '/Volumes/subs/星际迷途/EP01_v1.ass', submittedBy: 'a6', submittedAt: daysAgo(15), note: '翻译初稿', type: 'translation' },
    { id: 'v6', episodeId: 'e2-1', version: 2, filePath: '/Volumes/subs/星际迷途/EP01_v2.ass', submittedBy: 'a6', submittedAt: daysAgo(12), note: '返工修改', type: 'translation' },
    { id: 'v7', episodeId: 'e2-5', version: 1, filePath: '/Volumes/subs/星际迷途/EP05_v1.ass', submittedBy: 'a1', submittedAt: daysAgo(5), note: '翻译提交', type: 'translation' },
    { id: 'v8', episodeId: 'e2-5', version: 2, filePath: '/Volumes/subs/星际迷途/EP05_v2.ass', submittedBy: 'a2', submittedAt: daysAgo(3), note: '补充翻译后半段', type: 'translation' },
    { id: 'v9', episodeId: 'e3-1', version: 1, filePath: '/Volumes/subs/古城秘境/EP01_v1.ass', submittedBy: 'a1', submittedAt: daysAgo(10), note: '翻译初稿', type: 'translation' },
    { id: 'v10', episodeId: 'e3-2', version: 1, filePath: null, submittedBy: 'a2', submittedAt: daysAgo(3), note: '翻译提交但路径未录入', type: 'translation' },
    { id: 'v11', episodeId: 'e3-2', version: 2, filePath: null, submittedBy: 'a2', submittedAt: daysAgo(2), note: '修正稿，路径仍未录入', type: 'translation' },
    { id: 'v12', episodeId: 'e4-1', version: 1, filePath: '/Volumes/subs/风之声/EP01_v1.ass', submittedBy: 'a1', submittedAt: daysAgo(10), note: '翻译初稿', type: 'translation' },
    { id: 'v13', episodeId: 'e4-1', version: 2, filePath: '/Volumes/subs/风之声/EP01_v2.ass', submittedBy: 'a1', submittedAt: daysAgo(8), note: '校对后修改', type: 'translation' },
    { id: 'v14', episodeId: 'e4-1', version: 3, filePath: '/Volumes/subs/风之声/EP01_final.ass', submittedBy: 'a8', submittedAt: daysAgo(3), note: '压制输出', type: 'final' },
    { id: 'v15', episodeId: 'e4-2', version: 1, filePath: '/Volumes/subs/风之声/EP02_v1.ass', submittedBy: 'a2', submittedAt: daysAgo(5), note: '翻译初稿', type: 'translation' },
    { id: 'v16', episodeId: 'e2-2', version: 1, filePath: '/Volumes/subs/星际迷途/EP02_v1.ass', submittedBy: 'a1', submittedAt: daysAgo(8), note: '翻译初稿', type: 'translation' },
    { id: 'v17', episodeId: 'e1-4', version: 1, filePath: '/Volumes/subs/暗夜行者/EP04_v1.ass', submittedBy: 'a3', submittedAt: daysAgo(2), note: '时间轴初调', type: 'timing' },
  ]

  const reviewComments: ReviewComment[] = [
    { id: 'c1', episodeId: 'e2-5', authorId: 'a7', type: 'meaning', content: '第12句"compromise"此处应为"妥协"而非"妥协了"', timestamp: daysAgo(2), status: 'open' },
    { id: 'c2', episodeId: 'e2-5', authorId: 'a7', type: 'timing', content: '后半段28:15-28:20时间轴偏移约0.5秒', timestamp: daysAgo(2), status: 'open' },
    { id: 'c3', episodeId: 'e2-5', authorId: 'a7', type: 'style', content: '语气词"啊"使用过多，建议精简', timestamp: daysAgo(1), status: 'open' },
    { id: 'c4', episodeId: 'e1-2', authorId: 'a4', type: 'typo', content: 'EP02第45行"已经"误打为"以经"', timestamp: daysAgo(3), status: 'open' },
    { id: 'c5', episodeId: 'e3-2', authorId: 'a7', type: 'meaning', content: '第33行"facility"应译为"设施"而非"设备"', timestamp: daysAgo(2), status: 'open' },
    { id: 'c6', episodeId: 'e4-4', authorId: 'a4', type: 'other', content: 'OP歌词翻译建议校对确认', timestamp: daysAgo(1), status: 'open' },
  ]

  return { projects, fileVersions, reviewComments }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      assignees: DEMO_ASSIGNEES,
      fileVersions: [],
      reviewComments: [],
      recentProjectIds: [],

      addProject: (name, totalEpisodes) => {
        const id = 'p' + uid()
        const episodes: Episode[] = Array.from({ length: totalEpisodes }, (_, i) => ({
          id: 'e' + uid(),
          projectId: id,
          number: i + 1,
          title: `EP${String(i + 1).padStart(2, '0')}`,
          status: 'translating' as EpisodeStatus,
          segments: [],
          assigneeIds: [],
          deadline: daysLater(14),
        }))
        const project: Project = {
          id,
          name,
          totalEpisodes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          episodes,
          lastOpenedAt: new Date().toISOString(),
        }
        set(s => ({
          projects: [...s.projects, project],
          recentProjectIds: [id, ...s.recentProjectIds.filter(pid => pid !== id)].slice(0, 5),
        }))
        return id
      },

      openProject: (id) => {
        set(s => ({
          projects: s.projects.map(p => p.id === id ? { ...p, lastOpenedAt: new Date().toISOString() } : p),
          recentProjectIds: [id, ...s.recentProjectIds.filter(pid => pid !== id)].slice(0, 5),
        }))
      },

      updateEpisode: (projectId, episodeId, updates) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, ...updates } : e) }
              : p
          ),
        }))
      },

      addSegment: (projectId, episodeId, name, startLine, endLine, assigneeId) => {
        const seg: Segment = { id: 's' + uid(), episodeId, name, startLine, endLine, assigneeId, status: 'translating' }
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, segments: [...e.segments, seg] } : e) }
              : p
          ),
        }))
      },

      addFileVersion: (version) => {
        const v: FileVersion = { ...version, id: 'v' + uid() }
        set(s => ({ fileVersions: [...s.fileVersions, v] }))
      },

      addReviewComment: (comment) => {
        const c: ReviewComment = { ...comment, id: 'c' + uid() }
        set(s => ({ reviewComments: [...s.reviewComments, c] }))
      },

      resolveComment: (commentId) => {
        set(s => ({
          reviewComments: s.reviewComments.map(c => c.id === commentId ? { ...c, status: 'resolved' as const } : c),
        }))
      },

      markEpisodeRework: (projectId, episodeId, reason) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, status: 'rework' as EpisodeStatus, reworkReason: reason } : e) }
              : p
          ),
        }))
      },

      approveEpisode: (projectId, episodeId) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, status: 'approved' as EpisodeStatus } : e) }
              : p
          ),
        }))
      },

      markEncoded: (projectId, episodeId, outputPath) => {
        const v: FileVersion = {
          id: 'v' + uid(),
          episodeId,
          version: get().fileVersions.filter(fv => fv.episodeId === episodeId).length + 1,
          filePath: outputPath,
          submittedBy: 'system',
          submittedAt: new Date().toISOString(),
          note: '压制输出',
          type: 'final',
        }
        set(s => ({
          fileVersions: [...s.fileVersions, v],
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, status: 'encoded' as EpisodeStatus } : e) }
              : p
          ),
        }))
      },

      markDelivering: (projectId, episodeId) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, status: 'delivering' as EpisodeStatus } : e) }
              : p
          ),
        }))
      },

      markDelivered: (projectId, episodeId) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, status: 'delivered' as EpisodeStatus } : e) }
              : p
          ),
        }))
      },

      assignEpisode: (projectId, episodeId, assigneeIds) => {
        set(s => ({
          projects: s.projects.map(p =>
            p.id === projectId
              ? { ...p, updatedAt: new Date().toISOString(), episodes: p.episodes.map(e => e.id === episodeId ? { ...e, assigneeIds } : e) }
              : p
          ),
        }))
      },

      getProject: (id) => get().projects.find(p => p.id === id),

      getEpisodeVersions: (episodeId) => get().fileVersions.filter(v => v.episodeId === episodeId),

      getEpisodeComments: (episodeId) => get().reviewComments.filter(c => c.episodeId === episodeId),

      resetData: () => {
        const demo = buildDemoData()
        set({
          projects: demo.projects,
          fileVersions: demo.fileVersions,
          reviewComments: demo.reviewComments,
          recentProjectIds: ['p4', 'p1', 'p2', 'p3'],
        })
      },
    }),
    {
      name: 'subtitle-studio-store',
      onRehydrateStorage: () => (state) => {
        if (state && state.projects.length === 0) {
          const demo = buildDemoData()
          state.projects = demo.projects
          state.fileVersions = demo.fileVersions
          state.reviewComments = demo.reviewComments
          state.recentProjectIds = ['p4', 'p1', 'p2', 'p3']
        }
      },
    }
  )
)

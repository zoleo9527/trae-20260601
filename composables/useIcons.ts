import { markRaw, type Component } from 'vue'
import { h } from 'vue'

const svg = (paths: string[], extra: Record<string, any> = {}) => ({
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      class: 'w-5 h-5 flex-shrink-0',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      ...extra
    }, paths.map((d, i) => h('path', { key: i, d })))
  }
})

export const IconRegistry: Record<string, Component> = markRaw({
  IconDash: { render() { return h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: 'w-5 h-5 flex-shrink-0', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('rect', { x: '3', y: '3', width: '7', height: '7', rx: '1', key: 1 }),
    h('rect', { x: '14', y: '3', width: '7', height: '7', rx: '1', key: 2 }),
    h('rect', { x: '3', y: '14', width: '7', height: '7', rx: '1', key: 3 }),
    h('rect', { x: '14', y: '14', width: '7', height: '7', rx: '1', key: 4 })
  ])}},
  IconPlus: svg(['M12 5v14M5 12h14']),
  IconClipboard: svg([
    'M9 2h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z',
    'M9 6h6'
  ]),
  IconWrench: svg([
    'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.4-2.4 2.3-2.3z'
  ]),
  IconCheck: svg(['M20 6L9 17l-5-5']),
  IconSearch: svg(['M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm0 0 5 5']),
  IconMessage: svg([
    'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
  ]),
  IconBell: svg([
    'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9',
    'M13.7 21a2 2 0 0 1-3.4 0'
  ]),
  IconBook: svg([
    'M4 19.5A2.5 2.5 0 0 1 6.5 17H20',
    'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'
  ]),
  IconChart: svg([
    'M3 3v18h18',
    'M7 14l4-4 4 4 5-5'
  ]),
  IconFolder: svg([
    'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'
  ]),
  IconDashboard: svg([
    'M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z'
  ]),
  IconUser: svg([
    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
  ]),
  IconSwitch: svg([
    'M17 3l4 4-4 4',
    'M21 7H9a4 4 0 0 0 0 8h2',
    'M7 21l-4-4 4-4',
    'M3 17h12a4 4 0 0 0 0-8h-2'
  ]),
  IconClock: svg([
    'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z',
    'M12 6v6l4 2'
  ]),
  IconAlertTriangle: svg([
    'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    'M12 9v4',
    'M12 17h.01'
  ]),
  IconCheckCircle: svg([
    'M22 11.1V12a10 10 0 1 1-5.9-9.1',
    'M22 4 12 14.01l-3-3'
  ]),
  IconXCircle: svg([
    'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z',
    'M15 9l-6 6M9 9l6 6'
  ]),
  IconChevronRight: svg(['M9 18l6-6-6-6']),
  IconChevronDown: svg(['M6 9l6 6 6-6']),
  IconArrowRight: svg(['M5 12h14M13 5l7 7-7 7']),
  IconX: svg(['M18 6L6 18M6 6l12 12']),
  IconMapPin: svg([
    'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z',
    'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
  ]),
  IconFilter: svg([
    'M22 3H2l8 9.5V19l4 2v-8.5L22 3z'
  ]),
  IconCalendar: svg([
    'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
    'M16 2v4M8 2v4M3 10h18'
  ]),
  IconFileText: svg([
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M16 13H8M16 17H8M10 9H8'
  ]),
  IconEye: svg([
    'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
  ]),
  IconEdit: svg([
    'M12 20h9',
    'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z'
  ]),
  IconPaperclip: svg([
    'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'
  ]),
  IconUpload: svg([
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
    'M17 8l-5-5-5 5',
    'M12 3v12'
  ]),
  IconDownload: svg([
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
    'M7 10l5 5 5-5',
    'M12 15V3'
  ]),
  IconUsers: svg([
    'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M23 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75'
  ]),
  IconInfo: svg([
    'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z',
    'M12 16v-4',
    'M12 8h.01'
  ]),
  IconPhone: svg([
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z'
  ]),
  IconAlertCircle: svg([
    'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z',
    'M12 8v4',
    'M12 16h.01'
  ]),
  IconZap: svg([
    'M13 2L3 14h9l-1 8 10-12h-9l1-8z'
  ]),
  IconCamera: svg([
    'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z',
    'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
  ]),
  IconFileCheck: svg([
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    'M14 2v6h6',
    'M9 15l2 2 4-4'
  ]),
  IconTrendingUp: svg([
    'M23 6l-9.5 9.5-5-5L1 18',
    'M17 6h6v6'
  ]),
  IconTrendingDown: svg([
    'M23 18l-9.5-9.5-5 5L1 6',
    'M17 18h6v-6'
  ]),
  IconShield: svg([
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
  ]),
  IconSettings: svg([
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
  ]),
  IconPanelLeft: svg([
    'M21 3H3v18h18V3z',
    'M9 3v18'
  ]),
  IconBox: svg([
    'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'M3.3 7L12 12l8.7-5',
    'M12 22V12'
  ]),
  IconArchive: svg([
    'M21 8v13H3V8',
    'M1 3h22v5H1z',
    'M10 12h4'
  ]),
  IconGitBranch: svg([
    'M6 3v12',
    'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M18 9a9 9 0 0 1-9 9'
  ]),
  IconRefreshCw: svg([
    'M23 4v6h-6',
    'M20.49 15a9 9 0 1 1-2.12-9.36L23 10'
  ]),
  IconClipboardCheck: svg([
    'M9 2h6a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z',
    'M9 6h6',
    'M9 14l2 2 4-4'
  ]),
  IconLink: svg([
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
    'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
  ]),
  IconInbox: svg([
    'M22 12h-6l-2 3h-4l-2-3H2',
    'M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'
  ]),
  IconLoader: svg([
    'M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12'
  ])
})

export function resolveIcon(name: string): Component | undefined {
  return IconRegistry[name]
}

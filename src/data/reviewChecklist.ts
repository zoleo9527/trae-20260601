import type { ReviewItem } from '@/types';

export const REVIEW_CHECKLIST: ReviewItem[] = [
  {
    id: 'entrust-1',
    category: 'entrust',
    label: '委托事项与委托书一致',
    severity: 'critical',
    description: '核对鉴定事项是否与委托书载明事项完全一致，无超范围鉴定',
  },
  {
    id: 'entrust-2',
    category: 'entrust',
    label: '委托人身份材料齐全',
    severity: 'critical',
    description: '身份证/营业执照、授权委托书等身份材料齐全且在有效期内',
  },
  {
    id: 'entrust-3',
    category: 'entrust',
    label: '委托日期与受理日期逻辑正确',
    severity: 'major',
    description: '受理日期不得早于委托日期，委托书签署日期清晰可辨',
  },
  {
    id: 'sample-1',
    category: 'sample',
    label: '样本编号与登记一致',
    severity: 'critical',
    description: '意见书中标注的样本编号必须与样本接收登记台账完全一致',
  },
  {
    id: 'sample-2',
    category: 'sample',
    label: '样本状态正常无污染',
    severity: 'critical',
    description: '样本在检验期间无变质、污染、混淆等异常情况记录',
  },
  {
    id: 'sample-3',
    category: 'sample',
    label: '样本流转记录完整',
    severity: 'major',
    description: '样本接收、移交、检验、归还各环节均有签字及时间记录',
  },
  {
    id: 'format-1',
    category: 'format',
    label: '意见书格式符合规范',
    severity: 'major',
    description: '封面、编号、标题、正文、落款等格式要素齐全符合《司法鉴定文书规范》',
  },
  {
    id: 'format-2',
    category: 'format',
    label: '鉴定人签名及机构盖章',
    severity: 'critical',
    description: '至少2名鉴定人签名，加盖司法鉴定专用章，章印清晰',
  },
  {
    id: 'format-3',
    category: 'format',
    label: '页码及骑缝章正确',
    severity: 'minor',
    description: '多页文书页码连续，骑缝章完整覆盖所有页边',
  },
  {
    id: 'logic-1',
    category: 'logic',
    label: '检验过程描述清楚',
    severity: 'major',
    description: '使用的仪器设备、检验方法、操作步骤描述具体可追溯',
  },
  {
    id: 'logic-2',
    category: 'logic',
    label: '分析说明逻辑严谨',
    severity: 'critical',
    description: '检验结果与鉴定结论之间的因果关系论证充分、推理合理',
  },
  {
    id: 'logic-3',
    category: 'logic',
    label: '鉴定结论明确唯一',
    severity: 'critical',
    description: '结论表述肯定、明确，无歧义或模棱两可的表述',
  },
  {
    id: 'logic-4',
    category: 'logic',
    label: '依据标准现行有效',
    severity: 'major',
    description: '引用的国家标准/行业标准为最新有效版本，编号正确',
  },
];

export const CHECKLIST_CATEGORY_META = {
  entrust: { label: '委托书对照', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  sample: { label: '样本对照', color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500' },
  format: { label: '格式规范', color: 'text-slate-700', bg: 'bg-slate-50', dot: 'bg-slate-500' },
  logic: { label: '结论逻辑', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
} as const;

export const SEVERITY_META = {
  critical: { label: '严重', color: 'bg-rose-500', ring: 'ring-rose-200' },
  major: { label: '重要', color: 'bg-orange-500', ring: 'ring-orange-200' },
  minor: { label: '一般', color: 'bg-sky-500', ring: 'ring-sky-200' },
} as const;

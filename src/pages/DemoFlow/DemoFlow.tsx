import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Archive,
  ChevronRight,
  ChevronLeft,
  FileText,
  Stethoscope,
  Home,
  Package,
  Heart,
  RotateCcw,
  Edit3,
  Eye,
  ArrowRight,
  Phone
} from 'lucide-react';

type FlowType = 'smooth' | 'problem' | 'archive';

interface FlowStep {
  title: string;
  description: string;
  icon: any;
  role: string;
  details?: string[];
}

const flowData: Record<FlowType, {
  title: string;
  subtitle: string;
  caseNo: string;
  color: string;
  steps: FlowStep[];
}> = {
  smooth: {
    title: '顺利流程',
    subtitle: '救助志愿者 → 兽医 → 寄养安排 → 领养审核 → 回访 → 归档',
    caseNo: 'RESCUE-2026-001（小橘）',
    color: 'text-green-600',
    steps: [
      {
        title: '1. 救助登记',
        description: '志愿者发现并登记个案',
        icon: FileText,
        role: '救助志愿者',
        details: [
          '在朝阳区某小区垃圾桶旁发现幼猫小橘',
          '登记基本信息：约2个月、公猫、橘猫',
          '描述：瘦弱、眼部分泌物多、轻微感冒'
        ]
      },
      {
        title: '2. 医疗评估',
        description: '兽医检查并制定治疗方案',
        icon: Stethoscope,
        role: '兽医',
        details: [
          '诊断：营养不良、轻微上呼吸道感染',
          '治疗：补充营养、滴眼液、益生菌',
          '费用：¥380',
          '健康状态评估：一般'
        ]
      },
      {
        title: '3. 寄养安排',
        description: '匹配寄养家庭，填写关键判断',
        icon: Home,
        role: '救助志愿者',
        details: [
          '匹配家庭：陈阿姨爱心家庭',
          '关键判断：幼猫需特别注意营养摄入，建议幼猫粮+羊奶粉',
          '特殊要求：每天4餐、注意保暖、每周称重',
          '自动关联：物资领用将参考此判断'
        ]
      },
      {
        title: '4. 物资领用',
        description: '基于寄养关键判断申请物资',
        icon: Package,
        role: '救助志愿者',
        details: [
          '系统自动展示寄养关键判断作为参考',
          '领用：幼猫粮2袋、羊奶粉1罐',
          '用途：幼猫哺乳期加强营养',
          '自动关联寄养判断记录'
        ]
      },
      {
        title: '5. 领养审核',
        description: '审核员评估领养申请',
        icon: Heart,
        role: '领养审核员',
        details: [
          '收到孙女士领养申请',
          '家访确认：有养猫经验、封窗、经济稳定',
          '创建回访计划：1周电话、2周视频、1月上门',
          '审核通过'
        ]
      },
      {
        title: '6. 回访跟进',
        description: '定期回访确认状态',
        icon: Eye,
        role: '领养审核员',
        details: [
          '第1周电话回访：适应良好、体重增长',
          '第2周视频回访：活泼健康、状态很好',
          '回访记录完整，无异常'
        ]
      },
      {
        title: '7. 复核归档',
        description: '复核全流程记录后归档',
        icon: Archive,
        role: '领养审核员',
        details: [
          '医疗记录复核：完整、费用清晰',
          '寄养记录复核：完整、判断清晰',
          '回访记录复核：按时、无异常',
          '全流程通过，个案归档'
        ]
      }
    ]
  },
  problem: {
    title: '问题流程',
    subtitle: '含寄养退回、医疗补录、责任追溯的异常处理',
    caseNo: 'RESCUE-2026-005（花花）/ 004（黑豆）',
    color: 'text-orange-600',
    steps: [
      {
        title: '1. 寄养退回',
        description: '寄养家庭因特殊原因退回',
        icon: RotateCcw,
        role: '救助志愿者',
        details: [
          '黑豆寄养在赵医生家',
          '赵医生因急事无法继续照顾',
          '填写退回原因：寄养家庭急事',
          '系统自动记录退回时间和原因，责任清晰'
        ]
      },
      {
        title: '2. 重新安排',
        description: '重新匹配寄养家庭',
        icon: Home,
        role: '救助志愿者',
        details: [
          '转至刘阿姨小院',
          '更新关键判断：皮肤病好转，需继续用药',
          '时间线完整记录退回和重新安排过程',
          '前后寄养记录可追溯对比'
        ]
      },
      {
        title: '3. 医疗复核异常',
        description: '手术费用需补录明细',
        icon: Edit3,
        role: '领养审核员',
        details: [
          '花花骨折手术费用¥3500',
          '复核发现：缺少手术明细单',
          '标记为「需补录」，说明原因',
          '系统自动通知兽医补录'
        ]
      },
      {
        title: '4. 信息补录',
        description: '兽医补充手术明细',
        icon: FileText,
        role: '兽医',
        details: [
          '收到补录通知',
          '补充手术明细：内固定材料、麻醉费、住院费',
          '补录记录自动进入时间线',
          '可查看补录前后对比'
        ]
      },
      {
        title: '5. 重新复核',
        description: '审核员再次复核',
        icon: CheckCircle,
        role: '领养审核员',
        details: [
          '确认手术明细已补录完整',
          '费用核对无误',
          '复核通过',
          '全流程留痕，可追溯补录过程'
        ]
      },
      {
        title: '6. 经验总结',
        description: '异常处理沉淀为经验',
        icon: AlertTriangle,
        role: '全体',
        details: [
          '寄养退回原因统计分析',
          '高费用项目提前准备明细',
          '补录原因分类汇总优化流程',
          '问题流程转化为流程改进依据'
        ]
      }
    ]
  },
  archive: {
    title: '归档流程',
    subtitle: '领养后回访、数据沉淀、责任闭环',
    caseNo: 'RESCUE-2026-002（大黄）',
    color: 'text-secondary-600',
    steps: [
      {
        title: '1. 领养交接',
        description: '完成领养手续，创建回访计划',
        icon: Heart,
        role: '领养审核员',
        details: [
          '周先生领养大黄',
          '签署领养协议',
          '创建回访计划：1周电话、2周上门',
          '明确回访责任人和时间节点'
        ]
      },
      {
        title: '2. 回访断档预警',
        description: '系统自动提醒待回访',
        icon: AlertTriangle,
        role: '系统 + 领养审核员',
        details: [
          '领养后第7天：系统自动提醒回访',
          '今日待办显示「大黄回访」',
          '超期未回访将显示红色预警',
          '防止回访断档'
        ]
      },
      {
        title: '3. 执行回访',
        description: '按计划完成回访并记录',
        icon: Phone,
        role: '领养审核员',
        details: [
          '电话回访：大黄适应良好，能吃能睡',
          '记录回访内容和状态',
          '如发现异常可及时干预',
          '回访记录进入个案时间线'
        ]
      },
      {
        title: '4. 医疗费用对账',
        description: '复核所有医疗费用',
        icon: Stethoscope,
        role: '领养审核员',
        details: [
          '首次体检：¥560',
          '狂犬疫苗：¥150',
          '费用明细清晰，票据齐全',
          '对账无差异'
        ]
      },
      {
        title: '5. 寄养记录复核',
        description: '确认寄养期间无异常',
        icon: Home,
        role: '领养审核员',
        details: [
          '寄养家庭：王女士家庭',
          '寄养周期：2026-05-08 至 2026-05-30',
          '关键判断清晰，无退回记录',
          '寄养家庭反馈良好'
        ]
      },
      {
        title: '6. 个案归档',
        description: '全流程闭合，数据沉淀',
        icon: Archive,
        role: '领养审核员',
        details: [
          '确认所有环节记录完整',
          '状态变更为「已归档」',
          '数据进入统计分析',
          '可随时调阅历史记录'
        ]
      },
      {
        title: '7. 数据价值',
        description: '归档数据支持运营优化',
        icon: FileText,
        role: '管理层',
        details: [
          '救助周期统计分析',
          '领养成功率统计',
          '寄养家庭评价体系',
          '医疗费用趋势分析'
        ]
      }
    ]
  }
};

export default function DemoFlow() {
  const navigate = useNavigate();
  const [activeFlow, setActiveFlow] = useState<FlowType>('smooth');
  const [currentStep, setCurrentStep] = useState(0);

  const currentFlowData = flowData[activeFlow];
  const currentStepData = currentFlowData.steps[currentStep];
  const progress = ((currentStep + 1) / currentFlowData.steps.length) * 100;

  const flowCards = [
    { id: 'smooth', icon: CheckCircle, title: '顺利流程', desc: '标准全流程演示', color: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'problem', icon: AlertTriangle, title: '问题流程', desc: '退回、补录异常处理', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { id: 'archive', icon: Archive, title: '归档流程', desc: '回访、对账、数据沉淀', color: 'bg-secondary-50 border-secondary-200 text-secondary-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-800 font-serif">流程演示</h1>
        <p className="text-warm-500 mt-1">通过三个典型案例演示系统核心流程的运作方式</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {flowCards.map((card) => {
          const Icon = card.icon;
          const isActive = activeFlow === card.id;
          return (
            <button
              key={card.id}
              onClick={() => {
                setActiveFlow(card.id as FlowType);
                setCurrentStep(0);
              }}
              className={`card p-5 text-left transition-all ${
                isActive ? 'ring-2 ring-offset-2 ring-primary-500' : 'card-hover'
              } ${card.color}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-6 h-6" />
                <h3 className="font-semibold text-lg">{card.title}</h3>
              </div>
              <p className="text-sm opacity-80">{card.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold font-serif ${currentFlowData.color}`}>
              {currentFlowData.title}
            </h2>
            <p className="text-warm-500 text-sm mt-1">{currentFlowData.subtitle}</p>
            <p className="text-xs text-warm-400 font-mono mt-1">{currentFlowData.caseNo}</p>
          </div>
          <button
            onClick={() => navigate('/case/c001')}
            className="btn btn-outline text-sm"
          >
            <Eye className="w-4 h-4" />
            查看真实案例
          </button>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-warm-500 mb-2">
            <span>进度</span>
            <span>{currentStep + 1} / {currentFlowData.steps.length}</span>
          </div>
          <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1 space-y-2">
            {currentFlowData.steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isPast = index < currentStep;
              return (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary-50 border-l-4 border-primary-500' 
                      : isPast
                        ? 'bg-warm-50 opacity-60'
                        : 'hover:bg-warm-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isActive 
                        ? 'bg-primary-500 text-white' 
                        : isPast 
                          ? 'bg-green-500 text-white'
                          : 'bg-warm-200 text-warm-500'
                    }`}>
                      {isPast ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-primary-700' : 'text-warm-700'
                    }`}>
                      {step.title.replace(/^\d+\.\s*/, '')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="col-span-3">
            <div className="bg-gradient-to-br from-warm-50 to-white p-6 rounded-xl border border-warm-100 min-h-[300px]">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const Icon = currentStepData.icon;
                    return <Icon className="w-6 h-6 text-primary-600" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-warm-800 mb-1">
                    {currentStepData.title}
                  </h3>
                  <p className="text-warm-600">{currentStepData.description}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-white rounded-full text-xs text-warm-500 border border-warm-200">
                    责任人：{currentStepData.role}
                  </span>
                </div>
              </div>

              {currentStepData.details && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-warm-700 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-primary-500" />
                    流程详情
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-warm-100 space-y-2">
                    {currentStepData.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-warm-600">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="btn btn-outline disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              
              <div className="flex items-center gap-2">
                {currentStep < currentFlowData.steps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="btn btn-primary"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/case/c001')}
                    className="btn btn-secondary"
                  >
                    查看完整案例
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

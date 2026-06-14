import { useCaseStore } from '@/stores/caseStore';
import { SCENE_LABEL } from '@/data/constants';
import type { SceneType } from '@/types';
import { Layers, Sparkles, AlertTriangle, FileX, Clock, ClipboardList } from 'lucide-react';

const ICONS: Record<SceneType, any> = {
  normal: Sparkles,
  multi_reject: ClipboardList,
  sample_abnormal: AlertTriangle,
  dispatch_delay: Clock,
  correction_missed: FileX,
};

const DESCRIPTIONS: Record<SceneType, string> = {
  normal: '3件正常案件：1件审核中 / 1件待发放 / 1件已归档',
  multi_reject: '含2次驳回的声像鉴定 + 1件审核中',
  sample_abnormal: '含样本异常退回（血痕溶血）+ 2件正常',
  dispatch_delay: '含超15天未领取的发放延迟 + 2件正常',
  correction_missed: '含补录遗漏超期（法医病理）+ 2件正常',
};

export default function SceneSwitcher() {
  const currentScene = useCaseStore((s) => s.currentScene);
  const setScene = useCaseStore((s) => s.setScene);

  const scenes: SceneType[] = ['normal', 'multi_reject', 'sample_abnormal', 'dispatch_delay', 'correction_missed'];

  return (
    <div className="absolute bottom-4 left-4 z-40 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-300/40 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 px-2 pb-1.5 pt-0.5">
        <Layers className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[11px] font-semibold text-slate-700">Mock 场景快速切换</span>
      </div>
      <div className="flex flex-col gap-1">
        {scenes.map((scene) => {
          const Icon = ICONS[scene];
          const active = currentScene === scene;
          return (
            <button
              key={scene}
              onClick={() => setScene(scene)}
              title={DESCRIPTIONS[scene]}
              className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#1e3a5f] to-[#2a4d78] text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium ${active ? 'text-white' : 'text-slate-800'}`}>
                  {SCENE_LABEL[scene]}
                </div>
                <div className={`truncate text-[10px] ${active ? 'text-white/70' : 'text-slate-500'}`}>
                  {DESCRIPTIONS[scene]}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

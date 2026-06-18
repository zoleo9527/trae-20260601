import ComplaintTable from "@/components/complaint/ComplaintTable";

export default function ComplaintList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">客诉回访</h1>
        <p className="text-sm text-ink-500 mt-1">客诉受理、处理跟进与回访记录全流程管理</p>
      </div>
      <ComplaintTable />
    </div>
  );
}

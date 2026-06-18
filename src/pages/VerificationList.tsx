import VerificationTable from "@/components/verification/VerificationTable";

export default function VerificationList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">团购核销</h1>
        <p className="text-sm text-ink-500 mt-1">管理所有团购核销记录，支持批量操作与异常处理</p>
      </div>
      <VerificationTable />
    </div>
  );
}

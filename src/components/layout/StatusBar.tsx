export default function StatusBar() {
  return (
    <footer className="h-10 bg-[#16213e] border-t border-[#1a1a2e] flex items-center justify-between px-6 text-xs text-[#a0a0a0]">
      <div className="flex items-center gap-4">
        <span>今日工单: 18</span>
        <span className="text-[#f39c12]">待处理: 3</span>
        <span className="text-[#e94560]">异常: 1</span>
      </div>
      <div className="flex items-center gap-4">
        <span>在线技师: 4人</span>
        <span>v1.0.0</span>
      </div>
    </footer>
  );
}

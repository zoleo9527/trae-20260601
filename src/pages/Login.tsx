import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Stethoscope, HeartPulse, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const accounts = [
  {
    username: "dr_wang",
    displayName: "王建国",
    role: "全科医生",
    icon: Stethoscope,
    color: "border-teal-400 hover:border-teal-500 hover:shadow-teal-100",
  },
  {
    username: "nurse_li",
    displayName: "李芳",
    role: "护士",
    icon: HeartPulse,
    color: "border-blue-400 hover:border-blue-500 hover:shadow-blue-100",
  },
  {
    username: "pho_zhang",
    displayName: "张卫民",
    role: "公共卫生专员",
    icon: ShieldCheck,
    color: "border-amber-400 hover:border-amber-500 hover:shadow-amber-100",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const handleLogin = async (username: string) => {
    try {
      await login(username);
      navigate("/");
    } catch {
      alert("登录失败，请重试");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-teal-600 text-white mb-4">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-zinc-800">
            社区卫生站转诊系统
          </h1>
          <p className="text-sm text-zinc-500 mt-1">选择演示账号登录</p>
        </div>

        <div className="space-y-3">
          {accounts.map((account) => (
            <button
              key={account.username}
              onClick={() => handleLogin(account.username)}
              disabled={loading}
              className={cn(
                "w-full flex items-center gap-4 p-4 bg-white rounded-lg border-2 transition-all duration-150",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                account.color
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <account.icon className="w-5 h-5 text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-zinc-800">
                  {account.displayName}
                </p>
                <p className="text-xs text-zinc-500">{account.role}</p>
              </div>
              <span className="ml-auto text-xs text-zinc-400 font-mono">
                {account.username}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

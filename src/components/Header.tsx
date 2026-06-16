import { Flame, Bell, Settings, Phone } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-gradient-to-r from-purple-900 via-pink-800 to-red-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">酒吧运营管理系统</h1>
              <p className="text-xs text-purple-200">现场投诉与赠饮核销</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4" />
              <span>客服热线: 400-888-8888</span>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
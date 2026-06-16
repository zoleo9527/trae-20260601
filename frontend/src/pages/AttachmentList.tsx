import { Upload, FileText, Image, File } from 'lucide-react'

export default function AttachmentList() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">附件管理</h1>
        <p className="text-gray-500 mt-1">管理促销券相关的附件文件</p>
      </div>

      <div className="card">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            上传附件
          </h3>
          <p className="text-gray-500 mb-4">
            支持 JPG、PNG、PDF 格式，文件大小不超过 10MB
          </p>
          <button className="btn btn-primary">选择文件</button>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">使用说明</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-primary font-semibold">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">创建促销券</h3>
              <p className="text-sm text-gray-500 mt-1">
                在促销券发放页面创建新的券，选择需要上传的附件
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-primary font-semibold">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">上传文件</h3>
              <p className="text-sm text-gray-500 mt-1">
                支持小票照片、购买凭证、宝宝照片等证明材料
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <span className="text-primary font-semibold">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-800">复核查阅</h3>
              <p className="text-sm text-gray-500 mt-1">
                店长在复核时可以直接查看附件，确保发放合规
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          支持的文件类型
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Image size={32} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-700">图片</p>
            <p className="text-xs text-gray-500">JPG, PNG</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <File size={32} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-700">PDF</p>
            <p className="text-xs text-gray-500">文档格式</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <FileText size={32} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-700">其他</p>
            <p className="text-xs text-gray-500">小票扫描件</p>
          </div>
        </div>
      </div>
    </div>
  )
}

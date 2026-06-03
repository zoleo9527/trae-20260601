import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/supervisor/orders');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-4xl mb-4">🏭</div>
        <h1 className="text-2xl font-bold text-gray-800">中央厨房管理系统</h1>
        <p className="text-gray-500 mt-2">正在跳转...</p>
      </div>
    </div>
  );
}

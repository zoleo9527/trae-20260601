import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReportsClient from './ReportsClient';

export default function ReportsPage() {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('currentUser');

  if (!userCookie?.value) {
    redirect('/login');
  }

  let currentUser = null;
  try {
    currentUser = JSON.parse(userCookie.value);
  } catch {
    redirect('/login');
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">加载中...</div>}>
      <ReportsClient currentUser={currentUser} />
    </Suspense>
  );
}

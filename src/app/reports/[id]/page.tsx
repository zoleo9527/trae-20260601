import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ReportDetailClient from './ReportDetailClient';

export default function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  return <ReportDetailClient id={parseInt(params.id)} currentUser={currentUser} />;
}

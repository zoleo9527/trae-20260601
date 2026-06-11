import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function Home() {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('currentUser');
  
  if (userCookie?.value) {
    redirect('/reports');
  } else {
    redirect('/login');
  }
}

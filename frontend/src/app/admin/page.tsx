import { redirect } from 'next/navigation';

export default function AdminDashboard() {
  // Redirect to clients page as the main admin dashboard
  redirect('/admin/clients');
}
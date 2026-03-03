import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminGuard from '@/components/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navigation variant="admin" />
      <AdminGuard />
      {children}
      <Footer />
    </div>
  );
}

import { Outlet } from 'react-router-dom';

export const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <main className="flex-1">
      <Outlet />
    </main>
    <footer className="border-t bg-white text-center text-xs text-gray-500 py-3">
      © {new Date().getFullYear()} QR Video System
    </footer>
  </div>
);

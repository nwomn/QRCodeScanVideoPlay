import { Outlet } from 'react-router-dom';

export const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <div className="text-lg font-semibold text-primary">QR Video Player</div>
      </div>
    </header>
    <main className="flex-1">
      <Outlet />
    </main>
    <footer className="border-t bg-white text-center text-xs text-gray-500 py-3">
      © {new Date().getFullYear()} QR Video System
    </footer>
  </div>
);

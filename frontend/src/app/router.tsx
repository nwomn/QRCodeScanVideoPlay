import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { AdminLayout } from '../components/layouts/AdminLayout';
import { ScanPage } from '../pages/public/ScanPage';
import { ManualCodePage } from '../pages/public/ManualCodePage';
import { PlayPage } from '../pages/public/PlayPage';
import { LoginPage } from '../pages/admin/LoginPage';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../pages/admin/DashboardPage';
import { VideosPage } from '../pages/admin/VideosPage';
import { QrCodesPage } from '../pages/admin/QrCodesPage';
import { LogsPage } from '../pages/admin/LogsPage';

export const AppRouter = () => (
  <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<Navigate to="/scan" replace />} />
      <Route path="scan" element={<ScanPage />} />
      <Route path="manual" element={<ManualCodePage />} />
      <Route path="play/:code" element={<PlayPage />} />
    </Route>

    <Route path="/admin/login" element={<LoginPage />} />

    <Route path="/admin" element={<ProtectedRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="qrcodes" element={<QrCodesPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

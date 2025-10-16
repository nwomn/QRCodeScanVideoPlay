import api from './api';

export interface ScanResult {
  qrCode: {
    id: string;
    codeValue: string;
    videoId: string;
    videoTitle: string;
    isActive: boolean;
    createdAt: string;
    description?: string;
  };
  video: {
    id: string;
    title: string;
    description?: string;
    filePath: string;
    coverPath?: string;
    duration?: string | null;
    contentType?: string;
    fileSize?: number;
    isActive: boolean;
    createdAt: string;
  };
}

export const resolveQrCode = async (code: string) => {
  const response = await api.get<ScanResult>(`/public/resolve/${encodeURIComponent(code)}`);
  return response.data;
};

export const recordPlayLog = async (videoId: string, payload: { watchedDurationSeconds?: number; completed: boolean }) => {
  await api.post(`/public/videos/${videoId}/plays`, payload);
};

import api from './api';
import type { PagedResult, VideoDto } from './videos';

export interface QrCodeDto {
  id: string;
  codeValue: string;
  videoId: string;
  videoTitle: string;
  isActive: boolean;
  createdAt: string;
  description?: string;
}

export const fetchQrCodes = async (params: { page?: number; pageSize?: number; videoId?: string }) => {
  const response = await api.get<PagedResult<QrCodeDto>>('/qrcodes', { params });
  return response.data;
};

export const createQrCode = async (payload: { videoId: string; description?: string; isActive: boolean }) => {
  const response = await api.post<QrCodeDto>('/qrcodes', payload);
  return response.data;
};

export const updateQrCode = async (id: string, payload: { videoId?: string; isActive: boolean; description?: string }) => {
  const response = await api.put<QrCodeDto>(`/qrcodes/${id}`, payload);
  return response.data;
};

export const deleteQrCode = async (id: string) => {
  await api.delete(`/qrcodes/${id}`);
};

export const downloadQrCodeImage = async (id: string) => {
  const response = await api.get<Blob>(`/qrcodes/${id}/image`, {
    responseType: 'blob',
  });
  return response.data;
};

export const fetchVideoOptions = async () => {
  const response = await api.get<PagedResult<VideoDto>>('/videos', { params: { page: 1, pageSize: 100 } });
  return response.data.items;
};

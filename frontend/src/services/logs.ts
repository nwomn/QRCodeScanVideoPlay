import api from './api';
import type { PagedResult } from './videos';

export interface ScanLogDto {
  id: string;
  qrCodeId: string;
  codeValue: string;
  timestamp: string;
  success: boolean;
  failReason?: string;
  clientInfo?: string;
}

export interface PlayLogDto {
  id: string;
  videoId: string;
  videoTitle: string;
  timestamp: string;
  watchedDuration?: string | null;
  completed: boolean;
  clientInfo?: string;
}

export const fetchScanLogs = async (params: { page?: number; pageSize?: number; qrCodeId?: string }) => {
  const response = await api.get<PagedResult<ScanLogDto>>('/logs/scans', { params });
  return response.data;
};

export const fetchPlayLogs = async (params: { page?: number; pageSize?: number; videoId?: string }) => {
  const response = await api.get<PagedResult<PlayLogDto>>('/logs/plays', { params });
  return response.data;
};

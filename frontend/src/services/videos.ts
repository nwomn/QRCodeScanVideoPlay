import api from './api';

export interface VideoDto {
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
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export const fetchVideos = async (params: { page?: number; pageSize?: number; search?: string }) => {
  const response = await api.get<PagedResult<VideoDto>>('/videos', { params });
  return response.data;
};

export const getVideoById = async (id: string) => {
  const response = await api.get<VideoDto>(`/videos/${id}`);
  return response.data;
};

export const createVideo = async (payload: { title: string; description?: string; file: File }) => {
  const formData = new FormData();
  formData.append('Title', payload.title);
  formData.append('Description', payload.description ?? '');
  formData.append('File', payload.file);
  const response = await api.post<VideoDto>('/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateVideo = async (id: string, payload: { title: string; description?: string; isActive: boolean }) => {
  const response = await api.put<VideoDto>(`/videos/${id}`, payload);
  return response.data;
};

export const deleteVideo = async (id: string) => {
  await api.delete(`/videos/${id}`);
};

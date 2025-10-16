import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { VideoPlayer } from '../../components/player/VideoPlayer';
import { recordPlayLog, resolveQrCode, type ScanResult } from '../../services/public';

export const PlayPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ScanResult | undefined;

  const [data, setData] = useState<ScanResult | null>(state ?? null);
  const [loading, setLoading] = useState(!state);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!state && code) {
      setLoading(true);
      resolveQrCode(code)
        .then((result) => setData(result))
        .catch((err) => setError(err instanceof Error ? err.message : '视频加载失败'))
        .finally(() => setLoading(false));
    }
  }, [state, code]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-gray-600">正在加载视频...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-red-500">播放失败</h1>
        <p className="text-sm text-gray-600">{error ?? '未找到对应视频或二维码已失效'}</p>
        <button
          type="button"
          onClick={() => navigate('/scan')}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white"
        >
          返回重新扫码
        </button>
      </div>
    );
  }

  const { video, qrCode } = data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-primary"
        >
          ← 返回
        </button>
        <h1 className="mt-3 text-2xl font-semibold">{video.title}</h1>
        {video.description && <p className="text-sm text-gray-600">{video.description}</p>}
        <div className="mt-2 text-xs text-gray-500">
          二维码编码：{qrCode.codeValue} · 上传时间：{dayjs(video.createdAt).format('YYYY-MM-DD HH:mm')}
        </div>
      </div>
      <VideoPlayer
        src={video.filePath}
        poster={video.coverPath}
        onEnded={() => {
          void recordPlayLog(video.id, { completed: true });
        }}
        onPlay={() => {
          void recordPlayLog(video.id, { completed: false });
        }}
      />
      <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
        若播放异常，请刷新页面或联系现场工作人员。
      </div>
    </div>
  );
};

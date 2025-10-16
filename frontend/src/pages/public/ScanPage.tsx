import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraScanner } from '../../components/scanner/CameraScanner';
import { resolveQrCode } from '../../services/public';

export const ScanPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const isSecureContext = useMemo(() => (typeof window !== 'undefined' ? window.isSecureContext : true), []);

  const handleResult = useCallback(
    async (text: string) => {
      if (isLoading) return;
      setIsLoading(true);
      setError(undefined);
      try {
        const result = await resolveQrCode(text);
        navigate(`/play/${encodeURIComponent(result.qrCode.codeValue)}`, { state: result });
      } catch (err) {
        setError(err instanceof Error ? err.message : '识别失败，请重试');
        setIsLoading(false);
      }
    },
    [isLoading, navigate]
  );

  useEffect(() => {
    if (!isSecureContext) {
      setError('需要通过 HTTPS 或 localhost 访问页面才能启用摄像头扫码。');
    }
  }, [isSecureContext]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">扫码播放视频</h1>
        <p className="text-sm text-gray-600">对准二维码自动识别，识别成功后会自动跳转到视频播放页面。</p>
      </div>
      {isSecureContext ? (
        <CameraScanner
          onResult={(text) => {
            void handleResult(text);
          }}
          onError={(err) => {
            if (err instanceof Error) {
              setError(err.message);
            }
          }}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-600">
          当前连接不是安全上下文，无法调用摄像头。请使用 HTTPS 域名或在浏览器设置中将此站点标记为可信，再刷新页面。
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        {isLoading && <span className="text-sm text-primary">正在加载视频信息...</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
        <button
          type="button"
          onClick={() => navigate('/manual')}
          className="rounded-md border border-primary px-6 py-2 text-sm text-primary"
        >
          手动输入编码
        </button>
      </div>
    </div>
  );
};

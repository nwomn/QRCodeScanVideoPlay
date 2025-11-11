import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraScanner } from '../../components/scanner/CameraScanner';
import { resolveQrCode } from '../../services/public';

export const ScanPage = () => {
  useEffect(() => {
    document.title = '扫码播放 - QR视频播放系统';
  }, []);

  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [errorType, setErrorType] = useState<'PERMISSION_DENIED' | 'NO_CAMERA' | 'CAMERA_IN_USE' | 'OTHER'>();
  const [isLoading, setIsLoading] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(true);
  const [retryKey, setRetryKey] = useState(0); // Used to force remount CameraScanner
  const isSecureContext = useMemo(() => (typeof window !== 'undefined' ? window.isSecureContext : true), []);

  // Auto-hide error message after 5 seconds with fade animation
  useEffect(() => {
    if (error) {
      setIsErrorVisible(true);
      const timer = setTimeout(() => {
        setIsErrorVisible(false);
        // Clear error after fade animation completes
        setTimeout(() => setError(undefined), 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleResult = useCallback(
    async (text: string) => {
      if (isLoading) return;
      setIsLoading(true);
      setError(undefined);
      try {
        // Extract code from URL if scanned content is a full URL
        // Support formats like: https://mzfmedia.cn/play/abc123def456 or just abc123def456
        let codeValue = text.trim();
        const urlMatch = codeValue.match(/\/play\/([^/?#]+)/i);
        if (urlMatch) {
          codeValue = urlMatch[1];
          console.log('Extracted code from URL:', codeValue);
        }

        const result = await resolveQrCode(codeValue);
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
      setErrorType('OTHER');
    }
  }, [isSecureContext]);

  const handleRetryPermission = () => {
    setError(undefined);
    setErrorType(undefined);
    setRetryKey((prev) => prev + 1); // Force remount CameraScanner
  };

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      const message = err.message;
      if (message === 'PERMISSION_DENIED') {
        setErrorType('PERMISSION_DENIED');
        return '摄像头权限被拒绝';
      } else if (message === 'NO_CAMERA') {
        setErrorType('NO_CAMERA');
        return '未检测到摄像头设备';
      } else if (message === 'CAMERA_IN_USE') {
        setErrorType('CAMERA_IN_USE');
        return '摄像头正被其他应用占用';
      } else {
        setErrorType('OTHER');
        return message;
      }
    }
    setErrorType('OTHER');
    return '未知错误，请重试';
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">扫码播放视频</h1>
        <p className="text-sm text-gray-600">对准二维码自动识别，识别成功后会自动跳转到视频播放页面。</p>
      </div>
      {isSecureContext ? (
        <CameraScanner
          key={retryKey}
          onResult={(text) => {
            void handleResult(text);
          }}
          onError={(err) => {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
          }}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-600">
          当前连接不是安全上下文，无法调用摄像头。请使用 HTTPS 域名或在浏览器设置中将此站点标记为可信，再刷新页面。
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        {isLoading && <span className="text-sm text-primary">正在加载视频信息...</span>}
        {error && (
          <div className="w-full space-y-3">
            <div
              className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 transition-opacity duration-300 ${
                isErrorVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <p className="mb-2 font-medium">{error}</p>
              {errorType === 'PERMISSION_DENIED' && (
                <div className="space-y-2 text-xs">
                  <p className="font-medium">解决步骤：</p>
                  <ol className="list-inside list-decimal space-y-1">
                    <li>点击浏览器地址栏左侧的锁图标或摄像头图标</li>
                    <li>在弹出的菜单中，找到"摄像头"或"Camera"选项</li>
                    <li>选择"允许"或"Allow"，然后点击下方的"重新请求权限"按钮</li>
                  </ol>
                  <p className="mt-2">
                    Chrome/Edge: 地址栏 → 网站设置 → 摄像头 → 允许
                    <br />
                    Safari: 网站 → 设置 → 摄像头 → 允许
                  </p>
                </div>
              )}
              {errorType === 'NO_CAMERA' && (
                <p className="text-xs">请确保您的设备连接了摄像头，并且浏览器有权访问。</p>
              )}
              {errorType === 'CAMERA_IN_USE' && (
                <p className="text-xs">请关闭其他正在使用摄像头的应用程序或浏览器标签页，然后重试。</p>
              )}
            </div>
            {errorType === 'PERMISSION_DENIED' && (
              <button
                type="button"
                onClick={handleRetryPermission}
                className="rounded-md bg-primary px-6 py-2 text-sm text-white hover:bg-primary/90"
              >
                重新请求权限
              </button>
            )}
          </div>
        )}
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

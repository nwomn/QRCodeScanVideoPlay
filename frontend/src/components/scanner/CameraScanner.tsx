import { useCallback, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { Result } from '@zxing/library';

interface CameraScannerProps {
  onResult: (text: string, rawResult: Result) => void;
  onError?: (error: unknown) => void;
}

type ReaderInstance = BrowserMultiFormatReader & {
  reset?: () => void;
  stopContinuousDecode?: () => void;
};

export const CameraScanner = ({ onResult, onError }: CameraScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<ReaderInstance | null>(null);

  const stopReader = useCallback(() => {
    readerRef.current?.stopContinuousDecode?.();
    readerRef.current?.reset?.();
  }, []);

  const startDecoding = useCallback(
    async (deviceId: string) => {
      if (!readerRef.current || !videoRef.current) return;

      stopReader();
      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, _err, controls) => {
          if (result) {
            onResult(result.getText(), result);
            controls.stop();
          }
          // 不显示任何扫描错误信息
        }
      );
    },
    [onResult, stopReader]
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      onError?.(new Error('当前页面不是 HTTPS，上层浏览器拒绝访问摄像头。请切换到 HTTPS 或使用本地安全环境。'));
      return () => undefined;
    }

    const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 500 });
    readerRef.current = reader;

    (async () => {
      try {
        const deviceInfos = await BrowserMultiFormatReader.listVideoInputDevices();
        const preferred = deviceInfos.find((device) => /back|rear/gi.test(device.label));
        const selected = preferred ?? deviceInfos[0];
        if (!selected) {
          throw new Error('未找到可用的摄像头设备');
        }
        await startDecoding(selected.deviceId);
      } catch (error) {
        onError?.(error);
      }
    })();

    return () => {
      stopReader();
      readerRef.current = null;
    };
  }, [onError, onResult, startDecoding, stopReader]);

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-video overflow-hidden rounded-xl border bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      </div>
    </div>
  );
};

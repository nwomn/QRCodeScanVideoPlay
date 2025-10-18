import { useCallback, useEffect, useRef, useState } from 'react';
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

interface VideoDevice {
  deviceId: string;
  label: string;
}

export const CameraScanner = ({ onResult, onError }: CameraScannerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<ReaderInstance | null>(null);
  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const stopReader = useCallback(() => {
    readerRef.current?.stopContinuousDecode?.();
    readerRef.current?.reset?.();
  }, []);

  // Auto-hide hint after 5 seconds with fade animation
  useEffect(() => {
    if (devices && devices.length > 1) {
      setShowHint(true);
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [devices]);

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

  const handleSwitchCamera = useCallback(async () => {
    if (isSwitching || !devices || devices.length <= 1) return;

    setIsSwitching(true);
    try {
      const nextIndex = (currentDeviceIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];

      // Stop current stream before switching
      stopReader();

      // Small delay to ensure previous stream is released
      await new Promise((resolve) => setTimeout(resolve, 300));

      try {
        await startDecoding(nextDevice.deviceId);
        setCurrentDeviceIndex(nextIndex);
      } catch (switchError) {
        console.error('Failed to switch to camera:', nextDevice.label, switchError);

        // Try to recover by going back to the previous camera
        try {
          await startDecoding(devices[currentDeviceIndex].deviceId);
          onError?.(new Error(`无法切换到 ${nextDevice.label}，已恢复到当前摄像头`));
        } catch (recoverError) {
          console.error('Failed to recover previous camera:', recoverError);
          onError?.(new Error('摄像头切换失败，请刷新页面重试'));
        }
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
      onError?.(error);
    } finally {
      setTimeout(() => setIsSwitching(false), 500);
    }
  }, [isSwitching, devices, currentDeviceIndex, startDecoding, stopReader, onError]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      onError?.(new Error('当前页面不是 HTTPS，上层浏览器拒绝访问摄像头。请切换到 HTTPS 或使用本地安全环境。'));
      return () => undefined;
    }

    const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 500 });
    readerRef.current = reader;

    (async () => {
      try {
        // First, request camera permission by calling getUserMedia
        // This triggers the browser's permission prompt
        let tempStream: MediaStream | null = null;
        try {
          tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Immediately stop the temporary stream to release camera resource
          tempStream.getTracks().forEach((track) => track.stop());
        } catch (permissionError) {
          // Handle different permission errors
          if (permissionError instanceof Error) {
            const errorName = (permissionError as DOMException).name;
            if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
              throw new Error('PERMISSION_DENIED');
            } else if (errorName === 'NotFoundError') {
              throw new Error('NO_CAMERA');
            } else if (errorName === 'NotReadableError') {
              throw new Error('CAMERA_IN_USE');
            } else {
              throw permissionError;
            }
          }
          throw permissionError;
        }

        // Now list video input devices after permission is granted
        const deviceInfos = await BrowserMultiFormatReader.listVideoInputDevices();

        if (!deviceInfos || deviceInfos.length === 0) {
          throw new Error('NO_CAMERA');
        }

        // Filter out invalid/duplicate cameras - only keep usable video cameras
        const validDevices = deviceInfos.filter((device) => {
          const label = device.label.toLowerCase();
          // Exclude infrared, depth, virtual cameras
          return (
            !label.includes('infrared') &&
            !label.includes('depth') &&
            !label.includes('virtual') &&
            !label.includes('ir camera') &&
            device.deviceId.length > 0
          );
        });

        // Further deduplicate by checking device capabilities
        const uniqueDevices: MediaDeviceInfo[] = [];
        const seenIds = new Set<string>();

        for (const device of validDevices) {
          if (!seenIds.has(device.deviceId)) {
            seenIds.add(device.deviceId);
            uniqueDevices.push(device);
          }
        }

        const videoDevices: VideoDevice[] = uniqueDevices.map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `摄像头 ${uniqueDevices.indexOf(device) + 1}`,
        }));

        if (videoDevices.length === 0) {
          throw new Error('NO_CAMERA');
        }

        setDevices(videoDevices);

        // Prefer back camera for QR scanning
        const preferred = uniqueDevices.find((device) => /back|rear|后置/gi.test(device.label));
        const selectedIndex = preferred ? uniqueDevices.indexOf(preferred) : 0;
        const selected = uniqueDevices[selectedIndex];

        if (!selected) {
          throw new Error('未找到可用的摄像头设备');
        }

        setCurrentDeviceIndex(selectedIndex);
        await startDecoding(selected.deviceId);
      } catch (error) {
        onError?.(error);
      }
    })();

    return () => {
      stopReader();
      readerRef.current = null;
    };
  }, [onError, startDecoding, stopReader]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative aspect-video overflow-hidden rounded-xl border bg-black"
        style={{ cursor: devices?.length > 1 ? 'pointer' : 'default' }}
        onClick={devices?.length > 1 ? handleSwitchCamera : undefined}
        role={devices?.length > 1 ? 'button' : undefined}
        tabIndex={devices?.length > 1 ? 0 : undefined}
        onKeyDown={(e) => {
          if (devices?.length > 1 && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            void handleSwitchCamera();
          }
        }}
      >
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {/* Camera info overlay */}
        {devices && devices.length > 1 && (
          <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>
              {currentDeviceIndex + 1}/{devices.length}
            </span>
          </div>
        )}

        {/* Switching indicator */}
        {isSwitching && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="rounded-lg bg-white/90 px-6 py-3 text-sm font-medium text-gray-900">
              正在切换摄像头...
            </div>
          </div>
        )}

        {/* Click hint for multiple cameras */}
        {devices && devices.length > 1 && !isSwitching && (
          <div
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 transform rounded-lg bg-black/60 px-4 py-2 text-xs text-white backdrop-blur-sm transition-opacity duration-300 ${
              showHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            点击画面切换摄像头
          </div>
        )}
      </div>
    </div>
  );
};

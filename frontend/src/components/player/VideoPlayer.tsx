import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onEnded?: () => void;
  onError?: (error: { code?: number; message?: string }) => void;
}

export const VideoPlayer = ({ src, poster, autoplay = true, onPlay, onEnded, onError }: VideoPlayerProps) => {
  const videoNode = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const retryCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  // Detect if on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleRetry = () => {
    if (playerRef.current && retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      setHasError(false);
      setErrorMessage(undefined);
      setIsLoading(true);

      setTimeout(() => {
        playerRef.current?.src({ src, type: 'video/mp4' });
        playerRef.current?.load();
      }, RETRY_DELAY);
    }
  };

  useEffect(() => {
    if (!videoNode.current) return;

    const player = videojs(videoNode.current, {
      controls: true,
      autoplay: autoplay && !isMobile, // Disable autoplay on mobile to save data
      preload: isMobile ? 'metadata' : 'auto', // Load only metadata on mobile
      sources: [{ src, type: 'video/mp4' }],
      poster,
      fluid: true,
      responsive: true,
      html5: {
        vhs: {
          overrideNative: true,
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false,
      },
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    });

    player.aspectRatio('16:9');
    playerRef.current = player;

    // Loading state handlers
    player.on('loadstart', () => {
      setIsLoading(true);
      setHasError(false);
    });

    player.on('loadeddata', () => {
      setIsLoading(false);
    });

    player.on('canplay', () => {
      setIsLoading(false);
    });

    player.on('waiting', () => {
      setIsLoading(true);
    });

    player.on('playing', () => {
      setIsLoading(false);
    });

    // Error handling with retry logic
    player.on('error', () => {
      const error = player.error();
      if (!error) return;

      const errorCode = error.code;
      let message = '视频加载失败';

      switch (errorCode) {
        case 1: // MEDIA_ERR_ABORTED
          message = '视频加载被中止，请重试';
          break;
        case 2: // MEDIA_ERR_NETWORK
          message = '网络错误，请检查网络连接';
          break;
        case 3: // MEDIA_ERR_DECODE
          message = '视频解码失败，可能是格式不支持';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          message = '视频格式不支持或文件损坏';
          break;
        default:
          message = `播放错误 (代码: ${errorCode})`;
      }

      setIsLoading(false);
      setHasError(true);
      setErrorMessage(message);

      console.error('Video.js error:', {
        code: errorCode,
        message: error.message,
        details: error,
      });

      onError?.({ code: errorCode, message });

      // Auto retry for network errors
      if (errorCode === 2 && retryCountRef.current < MAX_RETRIES) {
        setTimeout(handleRetry, RETRY_DELAY);
      }
    });

    if (onPlay) {
      player.on('play', onPlay);
    }

    if (onEnded) {
      player.on('ended', onEnded);
    }

    return () => {
      if (onPlay) {
        player.off('play', onPlay);
      }
      if (onEnded) {
        player.off('ended', onEnded);
      }
      player.off('error');
      player.off('loadstart');
      player.off('loadeddata');
      player.off('canplay');
      player.off('waiting');
      player.off('playing');
      player.dispose();
      playerRef.current = null;
    };
  }, [src, poster, autoplay, isMobile, onPlay, onEnded, onError]);

  return (
    <div className="relative w-full">
      <div data-vjs-player className="w-full">
        <video ref={videoNode} className="video-js vjs-big-play-centered w-full h-full" playsInline />
      </div>

      {/* Loading indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <span className="text-sm text-white">正在加载视频...</span>
          </div>
        </div>
      )}

      {/* Error overlay with retry button */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="max-w-md space-y-4 rounded-lg bg-white p-6 text-center">
            <div className="text-red-500">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">播放失败</h3>
            <p className="text-sm text-gray-600">{errorMessage}</p>
            {retryCountRef.current > 0 && (
              <p className="text-xs text-gray-500">已尝试重试 {retryCountRef.current} 次</p>
            )}
            <div className="flex flex-col gap-2">
              {retryCountRef.current < MAX_RETRIES && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
                >
                  重试播放
                </button>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

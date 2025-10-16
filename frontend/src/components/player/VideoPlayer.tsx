import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  onPlay?: () => void;
  onEnded?: () => void;
}

export const VideoPlayer = ({ src, poster, autoplay = true, onPlay, onEnded }: VideoPlayerProps) => {
  const videoNode = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    if (!videoNode.current) return;

    const player = videojs(videoNode.current, {
      controls: true,
      autoplay,
      preload: 'auto',
      sources: [{ src, type: 'video/mp4' }],
      poster,
      fluid: true,
      responsive: true,
    });

    player.aspectRatio('16:9');
    playerRef.current = player;

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
      player.dispose();
      playerRef.current = null;
    };
  }, [src, poster, autoplay, onPlay, onEnded]);

  return (
    <div data-vjs-player className="w-full">
      <video ref={videoNode} className="video-js vjs-big-play-centered w-full h-full" playsInline />
    </div>
  );
};

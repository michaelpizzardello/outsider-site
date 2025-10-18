"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import clsx from "clsx";

export type PortraitVideoSource = {
  url: string;
  mimeType?: string;
  poster?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };
};

type PortraitVideoPlayerProps = {
  source: PortraitVideoSource;
  aspectRatio?: string | number;
  className?: string;
  posterAlt?: string;
  maxHeight?: string | number;
};

export default function PortraitVideoPlayer({
  source,
  aspectRatio,
  className,
  posterAlt,
  maxHeight,
}: PortraitVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const computedAspectRatio = useMemo(() => {
    if (aspectRatio) return aspectRatio;
    if (source.poster?.width && source.poster?.height) {
      return `${source.poster.width}/${source.poster.height}`;
    }
    return "4 / 5";
  }, [aspectRatio, source.poster?.width, source.poster?.height]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    video.muted = true;
    setIsMuted(true);

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(!video.paused);
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [source.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    if (!isMuted) {
      video.volume = 1;
    }
  }, [isMuted]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsMuted((prev) => {
      const next = !prev;
      video.muted = next;
      if (!next) {
        video.volume = 1;
      }
      return next;
    });
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      video.pause();
    }
  };

  const computedContainerStyle = useMemo<CSSProperties>(() => {
    const style: CSSProperties = {
      aspectRatio: computedAspectRatio,
    };
    if (typeof maxHeight === "number" && Number.isFinite(maxHeight)) {
      style.maxHeight = `${maxHeight}px`;
    } else if (typeof maxHeight === "string" && maxHeight.trim()) {
      style.maxHeight = maxHeight;
    }
    return style;
  }, [computedAspectRatio, maxHeight]);

  return (
    <div className={clsx("group/portrait-video relative w-full", className)}>
      <div
        className="relative w-full overflow-hidden rounded-none"
        style={computedContainerStyle}
      >
        <video
          ref={videoRef}
          src={source.url}
          muted={isMuted}
          playsInline
          loop
          autoPlay
          preload="auto"
          poster={source.poster?.url}
          className="h-full w-full cursor-pointer object-contain"
          aria-label={posterAlt ?? "Artist portrait video"}
          onClick={togglePlay}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/portrait-video:opacity-100" />
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-full bg-black/70 p-2 text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-pressed={isPlaying}
          aria-label={isPlaying ? "Pause artist video" : "Play artist video"}
        >
          <PlayPauseIcon isPlaying={isPlaying} />
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className="rounded-full bg-black/70 p-2 text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-pressed={!isMuted}
          aria-label={isMuted ? "Unmute artist video" : "Mute artist video"}
        >
          <VolumeIcon isMuted={isMuted} />
        </button>
      </div>
    </div>
  );
}

function PlayPauseIcon({ isPlaying }: { isPlaying: boolean }) {
  return isPlaying ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
      role="presentation"
      aria-hidden="true"
    >
      <path d="M7 5c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zM15 5c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
      role="presentation"
      aria-hidden="true"
    >
      <path d="M7 5.14v13.72c0 .53.57.85 1.03.58l11-6.86a.67.67 0 0 0 0-1.16l-11-6.86A.67.67 0 0 0 7 5.14z" />
    </svg>
  );
}

function VolumeIcon({ isMuted }: { isMuted: boolean }) {
  return isMuted ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
      role="presentation"
      aria-hidden="true"
    >
      <path d="M3 9v6h3.76L11 19.24V4.76L6.76 9zM19.59 12l2.12-2.12-1.41-1.41L18.17 10.6l-2.12-2.12-1.41 1.41L16.76 12l-2.12 2.12 1.41 1.41 2.12-2.12 2.12 2.12 1.41-1.41z" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-current"
      role="presentation"
      aria-hidden="true"
    >
      <path d="M3 9v6h3.76L11 19.24V4.76L6.76 9z" />
      <path d="M15.5 12a3.5 3.5 0 0 1-2.7 3.41v-6.82A3.5 3.5 0 0 1 15.5 12Zm2.5 0c0-3.05-1.84-5.67-4.5-6.78v2.1c1.46.97 2.5 2.67 2.5 4.68s-1.04 3.71-2.5 4.68v2.1c2.66-1.11 4.5-3.73 4.5-6.78Z" />
    </svg>
  );
}

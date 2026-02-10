"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import { getVideoEmbedUrl } from "@/utils/videoEmbedUrl";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface VideoPlayerWithFallbackProps {
  url: string;
  width?: string;
  height?: string;
  className?: string;
}

/**
 * Renders video from URL - files (mp4, webm) or platform links (YouTube, Vimeo, etc.).
 * Uses React Player first (supports YouTube, Vimeo, Twitch, Facebook, files, etc.).
 * Falls back to iframe embed when React Player can't play or errors.
 */
export function VideoPlayerWithFallback({
  url,
  width = "100%",
  height = "100%",
  className = "",
}: VideoPlayerWithFallbackProps) {
  const [useEmbed, setUseEmbed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const embedUrl = getVideoEmbedUrl(url);

  // If it's a known platform that we can embed, sometimes it's more reliable to use iframe directly
  // especially if ReactPlayer is having trouble with specific video types.
  const isYouTube =
    url.toLowerCase().includes("youtube.com") || url.toLowerCase().includes("youtu.be");
  const isVimeo = url.toLowerCase().includes("vimeo.com");

  const handleReactPlayerError = () => {
    console.error("ReactPlayer error for URL:", url);
    setUseEmbed(true);
    setHasError(true);
  };

  // If we should use embed (either forced or as fallback)
  if ((useEmbed || isYouTube || isVimeo) && embedUrl) {
    return (
      <iframe
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        className={className}
        height={height}
        src={embedUrl}
        style={{ border: "none" }}
        title="Video Player"
        width={width}
      />
    );
  }

  // Fallback: native video element for direct file URLs
  if (useEmbed && !embedUrl) {
    const isFile = url.match(/\.(mp4|webm|mov|ogg|avi|m3u8)(\?|$)/i) || url.startsWith("blob:");

    if (isFile) {
      return (
        <video controls playsInline className={className} height={height} src={url} width={width} />
      );
    }

    return (
      <div
        className={`flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-900 ${className}`}
        style={{ height }}
      >
        <p className="mb-2">Unable to play video directly.</p>
        <a
          className="text-blue-500 hover:underline"
          href={url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open video in new tab
        </a>
      </div>
    );
  }

  // Primary: React Player
  return (
    <div className={`relative bg-black ${className}`} style={{ width, height }}>
      <ReactPlayer
        controls
        playsinline
        config={
          {
            file: {
              attributes: {
                controlsList: "nodownload",
              },
            },
          } as any
        }
        height="100%"
        url={url}
        width="100%"
        onError={handleReactPlayerError}
      />
    </div>
  );
}

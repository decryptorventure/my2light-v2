export type VideoId = string;
export type HighlightId = string;

export interface Video {
  id: VideoId;
  uri: string;
  duration: number;
  createdAt: Date;
  thumbnailUri?: string;
  highlights: Highlight[];
}

export interface Highlight {
  id: HighlightId;
  videoId: VideoId;
  timestamp: number;
  duration: number;
  label?: string;
}

export interface Clip {
  id: string;
  videoId: VideoId;
  startTime: number;
  endTime: number;
  speed: number;
}

export interface Reel {
  id: string;
  clips: Clip[];
  musicUri?: string;
  createdAt: Date;
}

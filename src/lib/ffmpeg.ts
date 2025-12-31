import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';

export interface FFmpegProgress {
  time: number;
  percentage: number;
}

export interface ProcessingOptions {
  onProgress?: (progress: FFmpegProgress) => void;
  onComplete?: (outputPath: string) => void;
  onError?: (error: string) => void;
}

// Safely access documentDirectory with proper type checking
const getDocumentDirectory = (): string | null => {
  return (FileSystem as any).documentDirectory ?? null;
};

const OUTPUT_DIR = `${getDocumentDirectory() ?? ''}processed/`;

async function ensureOutputDir() {
  const dirInfo = await FileSystem.getInfoAsync(OUTPUT_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(OUTPUT_DIR, { intermediates: true });
  }
}

function generateOutputPath(prefix: string = 'output'): string {
  return `${OUTPUT_DIR}${prefix}_${Date.now()}.mp4`;
}

/**
 * Trim video to specified start and end times
 */
export async function trimVideo(
  inputPath: string,
  startTime: number,
  endTime: number,
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('trimmed');
  const duration = endTime - startTime;

  const command = [
    `-i "${inputPath}"`,
    `-ss ${startTime}`,
    `-t ${duration}`,
    `-c copy`, // Fast copy without re-encoding
    `-avoid_negative_ts 1`,
    `"${outputPath}"`,
  ].join(' ');

  return executeFFmpeg(command, duration, outputPath, options);
}

/**
 * Change video playback speed
 */
export async function changeSpeed(
  inputPath: string,
  speed: number,
  duration: number,
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('speed');

  // Video: setpts filter, Audio: atempo filter
  // atempo only accepts 0.5-2.0, chain for extremes
  const videoFilter = `setpts=${1 / speed}*PTS`;
  let audioFilter = '';

  if (speed <= 2 && speed >= 0.5) {
    audioFilter = `atempo=${speed}`;
  } else if (speed > 2) {
    audioFilter = `atempo=2.0,atempo=${speed / 2}`;
  } else {
    audioFilter = `atempo=0.5,atempo=${speed / 0.5}`;
  }

  const command = [
    `-i "${inputPath}"`,
    `-filter_complex "[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]"`,
    `-map "[v]"`,
    `-map "[a]"`,
    `-c:v libx264`,
    `-preset fast`,
    `-c:a aac`,
    `"${outputPath}"`,
  ].join(' ');

  const newDuration = duration / speed;
  return executeFFmpeg(command, newDuration, outputPath, options);
}

/**
 * Overlay audio track on video
 */
export async function addMusicOverlay(
  videoPath: string,
  audioPath: string,
  videoDuration: number,
  musicVolume: number = 0.3,
  originalVolume: number = 1.0,
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('music');

  const command = [
    `-i "${videoPath}"`,
    `-i "${audioPath}"`,
    `-filter_complex`,
    `"[0:a]volume=${originalVolume}[a0];[1:a]volume=${musicVolume}[a1];[a0][a1]amix=inputs=2:duration=first[aout]"`,
    `-map 0:v`,
    `-map "[aout]"`,
    `-c:v copy`,
    `-c:a aac`,
    `-shortest`,
    `"${outputPath}"`,
  ].join(' ');

  return executeFFmpeg(command, videoDuration, outputPath, options);
}

/**
 * Execute FFmpeg command with progress tracking
 */
async function executeFFmpeg(
  command: string,
  expectedDuration: number,
  outputPath: string,
  options: ProcessingOptions
): Promise<string> {
  const { onProgress, onComplete, onError } = options;

  // Enable statistics callback for progress
  FFmpegKitConfig.enableStatisticsCallback((statistics) => {
    const time = statistics.getTime() / 1000; // Convert to seconds
    const percentage = Math.min((time / expectedDuration) * 100, 100);
    onProgress?.({ time, percentage });
  });

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    onComplete?.(outputPath);
    return outputPath;
  } else {
    const logs = await session.getAllLogsAsString();
    const errorMsg = `FFmpeg failed: ${logs}`;
    onError?.(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Get video metadata
 */
export async function getVideoInfo(
  videoPath: string
): Promise<{ duration: number; width: number; height: number }> {
  const session = await FFmpegKit.execute(
    `-i "${videoPath}" -f null -`
  );

  const output = await session.getAllLogsAsString();

  // Parse duration from output
  const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
  let duration = 0;
  if (durationMatch) {
    const [, hours, minutes, seconds] = durationMatch;
    duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  }

  // Parse dimensions
  const dimensionMatch = output.match(/(\d{3,4})x(\d{3,4})/);
  let width = 1920,
    height = 1080;
  if (dimensionMatch) {
    width = parseInt(dimensionMatch[1]);
    height = parseInt(dimensionMatch[2]);
  }

  return { duration, width, height };
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(
  videoPath: string,
  timeSeconds: number = 0
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('thumb').replace('.mp4', '.jpg');

  const command = [
    `-i "${videoPath}"`,
    `-ss ${timeSeconds}`,
    `-vframes 1`,
    `-q:v 2`,
    `"${outputPath}"`,
  ].join(' ');

  await FFmpegKit.execute(command);
  return outputPath;
}

/**
 * Concatenate multiple video clips into one
 */
export async function concatenateVideos(
  videoPaths: string[],
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('reel');

  // Create file list for concat demuxer
  const fileListPath = `${OUTPUT_DIR}concat_list.txt`;
  const fileListContent = videoPaths
    .map((path) => `file '${path}'`)
    .join('\n');

  await FileSystem.writeAsStringAsync(fileListPath, fileListContent);

  // Calculate total duration for progress
  let totalDuration = 0;
  for (const path of videoPaths) {
    const info = await getVideoInfo(path);
    totalDuration += info.duration;
  }

  const command = [
    `-f concat`,
    `-safe 0`,
    `-i "${fileListPath}"`,
    `-c copy`, // Fast copy without re-encoding
    `"${outputPath}"`,
  ].join(' ');

  try {
    return await executeFFmpeg(command, totalDuration, outputPath, options);
  } finally {
    // Cleanup file list
    await FileSystem.deleteAsync(fileListPath, { idempotent: true });
  }
}

/**
 * Concatenate with re-encoding (for mixed codecs)
 */
export async function concatenateVideosWithReencode(
  videoPaths: string[],
  options: ProcessingOptions = {}
): Promise<string> {
  await ensureOutputDir();
  const outputPath = generateOutputPath('reel');

  // Create filter complex for concat
  const inputs = videoPaths.map((p, i) => `-i "${p}"`).join(' ');
  const filterInputs = videoPaths.map((_, i) => `[${i}:v][${i}:a]`).join('');

  // Calculate total duration
  let totalDuration = 0;
  for (const path of videoPaths) {
    const info = await getVideoInfo(path);
    totalDuration += info.duration;
  }

  const command = [
    inputs,
    `-filter_complex "${filterInputs}concat=n=${videoPaths.length}:v=1:a=1[outv][outa]"`,
    `-map "[outv]"`,
    `-map "[outa]"`,
    `-c:v libx264`,
    `-preset fast`,
    `-c:a aac`,
    `"${outputPath}"`,
  ].join(' ');

  return executeFFmpeg(command, totalDuration, outputPath, options);
}

/**
 * Cancel all running FFmpeg sessions
 */
export function cancelAllFFmpegSessions() {
  FFmpegKit.cancel();
}

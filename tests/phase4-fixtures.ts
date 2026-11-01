import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
export async function createMediaFixtures(root: string, directory: string) {
  const ffmpeg = path.join(root, 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
  const video = path.join(directory, 'manual-video-30s.mp4'),
    audio = path.join(directory, 'manual-voice-30s.wav');
  await run(
    ffmpeg,
    [
      '-v',
      'error',
      '-stream_loop',
      '-1',
      '-i',
      path.join(root, 'elmekawy-bim-reel-V2/out/elmekawy-bim-v2-motion-test.mp4'),
      '-stream_loop',
      '-1',
      '-i',
      path.join(root, 'shared-assets/defaults/1.0.0/bim-reel.mp3'),
      '-t',
      '30',
      '-vf',
      'scale=320:568',
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      video,
    ],
    { windowsHide: true, timeout: 60000, maxBuffer: 1024 ** 2 },
  );
  await run(ffmpeg, ['-v', 'error', '-i', video, '-vn', '-t', '30', '-c:a', 'pcm_s16le', audio], {
    windowsHide: true,
    timeout: 30000,
    maxBuffer: 1024 ** 2,
  });
  await fs.access(video);
  return { video, audio };
}

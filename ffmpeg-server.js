// FFmpeg Local Server - Merge video + audio without quality loss
// Run: node ffmpeg-server.js
// Listens on port 7777

const http = require('http');
const https = require('https');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 7777;
const FFMPEG_PATH = 'C:/ffmpeg-master-latest-win64-gpl-shared/bin/ffmpeg.exe';
const TEMP_DIR = path.join(os.tmpdir(), 'starken-ffmpeg');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'POST' && req.url === '/merge') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const startTime = Date.now();
      const id = Date.now().toString(36);
      const videoPath = path.join(TEMP_DIR, `${id}_video.mp4`);
      const audioPath = path.join(TEMP_DIR, `${id}_audio.mp3`);
      const outputPath = path.join(TEMP_DIR, `${id}_output.mp4`);

      try {
        const { videoUrl, audioUrl, volume = 70, fadeOut = 2 } = JSON.parse(body);
        if (!videoUrl || !audioUrl) throw new Error('videoUrl and audioUrl are required');

        console.log(`[${id}] Starting merge...`);
        console.log(`  Video: ${videoUrl.substring(0, 80)}...`);
        console.log(`  Audio: ${audioUrl.substring(0, 80)}...`);
        console.log(`  Volume: ${volume}%, Fade: ${fadeOut}s`);

        // 1. Download files
        console.log(`[${id}] Downloading video...`);
        await downloadFile(videoUrl, videoPath);
        const videoSize = fs.statSync(videoPath).size;
        console.log(`[${id}] Video downloaded: ${(videoSize / 1024 / 1024).toFixed(1)} MB`);

        console.log(`[${id}] Downloading audio...`);
        await downloadFile(audioUrl, audioPath);
        const audioSize = fs.statSync(audioPath).size;
        console.log(`[${id}] Audio downloaded: ${(audioSize / 1024 / 1024).toFixed(1)} MB`);

        // 2. Merge with FFmpeg - NO video re-encoding (-c:v copy)
        const vol = (volume / 100).toFixed(2);
        const audioFilter = `volume=${vol},afade=t=out:st=999:d=${fadeOut}`;

        const args = [
          '-y',
          '-i', videoPath,
          '-i', audioPath,
          '-c:v', 'copy',         // NO re-encoding! Copy video as-is
          '-c:a', 'aac',          // Encode audio as AAC
          '-b:a', '192k',         // High quality audio
          '-map', '0:v:0',        // Video from first input
          '-map', '1:a:0',        // Audio from second input
          '-af', audioFilter,     // Volume + fade
          '-shortest',            // Match video duration
          '-movflags', '+faststart', // Fast web playback
          outputPath
        ];

        console.log(`[${id}] Running FFmpeg (copy mode - no quality loss)...`);

        await new Promise((resolve, reject) => {
          execFile(FFMPEG_PATH, args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
              console.error(`[${id}] FFmpeg error:`, stderr);
              reject(new Error(stderr || err.message));
            } else {
              resolve();
            }
          });
        });

        // 3. Read output and send
        const outputSize = fs.statSync(outputPath).size;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[${id}] Done! Output: ${(outputSize / 1024 / 1024).toFixed(1)} MB (${elapsed}s)`);
        console.log(`[${id}] Quality: video=${(videoSize / 1024 / 1024).toFixed(1)}MB → output=${(outputSize / 1024 / 1024).toFixed(1)}MB (video stream unchanged)`);

        const output = fs.readFileSync(outputPath);
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Length': output.length,
          'X-Original-Size': videoSize,
          'X-Output-Size': outputSize,
          'X-Processing-Time': elapsed
        });
        res.end(output);

      } catch (err) {
        console.error(`[${id}] Error:`, err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      } finally {
        // Cleanup temp files
        [videoPath, audioPath, outputPath].forEach(f => {
          try { fs.unlinkSync(f); } catch(e) {}
        });
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ffmpeg: FFMPEG_PATH }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('==============================================');
  console.log('  🎬 FFmpeg Merge Server - Starken OS');
  console.log('==============================================');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  FFmpeg: ${FFMPEG_PATH}`);
  console.log(`  Temp: ${TEMP_DIR}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('    POST /merge  - Merge video + audio');
  console.log('    GET  /health - Health check');
  console.log('');
  console.log('  Quality: -c:v copy (NO re-encoding)');
  console.log('  Video quality = 100% original');
  console.log('==============================================');
  console.log('');
  console.log('Aguardando requisições...');
});

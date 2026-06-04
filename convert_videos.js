const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const videoDir = path.join(__dirname, 'assets', 'video');

function convertVideo(filePath) {
    return new Promise((resolve, reject) => {
        const ext = path.extname(filePath);
        if (ext.toLowerCase() !== '.mov') {
            return resolve();
        }
        
        const newPath = path.join(path.dirname(filePath), path.basename(filePath, ext) + '.mp4');
        
        console.log(`Starting conversion for: ${filePath}`);
        
        ffmpeg(filePath)
            .output(newPath)
            .outputOptions(['-map', '0:v:0', '-map', '0:a?']) // only map video and audio, ignore data streams
            .videoCodec('libx264')
            .size('1280x720') // Compress to 720p to save space
            .on('end', () => {
                console.log(`Finished converting: ${filePath}`);
                try {
                    fs.unlinkSync(filePath); // delete original
                } catch(e) {
                    console.error("Could not delete original file:", e);
                }
                resolve();
            })
            .on('error', (err) => {
                console.error(`Error converting ${filePath}:`, err);
                // resolve anyway to continue to the next video
                resolve();
            })
            .run();
    });
}

async function convertAllVideos() {
    if (!fs.existsSync(videoDir)) return;
    const files = fs.readdirSync(videoDir);
    for (const file of files) {
        const filePath = path.join(videoDir, file);
        await convertVideo(filePath);
    }
    console.log("All video conversions completed.");
}

convertAllVideos();

const fs = require('fs').promises;
const path = require('path');

// Maximum age for temporary files (2 hours in milliseconds)
const MAX_TEMP_AGE = 2 * 60 * 60 * 1000;

// Cleanup temporary files
async function cleanupTempFiles(tempDir) {
    try {
        const files = await fs.readdir(tempDir);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);

            // Delete files older than MAX_TEMP_AGE
            if (now - stats.mtime.getTime() > MAX_TEMP_AGE) {
                try {
                    await fs.unlink(filePath);
                    console.log(`[CLEANUP] Deleted old temp file: ${file}`);
                } catch (error) {
                    console.error(`[CLEANUP] Error deleting file ${file}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('[CLEANUP] Error during cleanup:', error);
    }
}

// Schedule cleanup every hour
function scheduleCleanup(tempDir) {
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

    setInterval(() => {
        cleanupTempFiles(tempDir);
    }, CLEANUP_INTERVAL);

    // Run initial cleanup
    cleanupTempFiles(tempDir);
}

module.exports = {
    cleanupTempFiles,
    scheduleCleanup
};

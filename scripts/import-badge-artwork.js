const fs = require("fs");
const path = require("path");

// Badge slug mapping from new folder names to existing folder names
const BADGE_SLUG_MAPPING = {
  "weekly-streak": "weekly-streaks",
  "daily-streak": "daily-streaks",
  collectors: "total-collectors",
  "creator-score": "creator-score",
  talent: "talent",
  base: "base",
  "total-earnings": "total-earnings",
  "total-followers": "total-followers",
  walletconnect: "walletconnect", // New badge type
};

// Source and destination paths
const SOURCE_DIR = path.join(__dirname, "..", "new badges artwork (temp)");
const WEBP_DEST_DIR = path.join(__dirname, "..", "public", "images", "badges");
const PNG_DEST_DIR = path.join(
  __dirname,
  "..",
  "public",
  "images",
  "share",
  "badges",
);

// Ensure destination directories exist
function ensureDirectories() {
  Object.values(BADGE_SLUG_MAPPING).forEach((badgeSlug) => {
    const webpDir = path.join(WEBP_DEST_DIR, badgeSlug);
    const pngDir = path.join(PNG_DEST_DIR, badgeSlug);

    if (!fs.existsSync(webpDir)) {
      fs.mkdirSync(webpDir, { recursive: true });
      console.log(`Created directory: ${webpDir}`);
    }

    if (!fs.existsSync(pngDir)) {
      fs.mkdirSync(pngDir, { recursive: true });
      console.log(`Created directory: ${pngDir}`);
    }
  });
}

// Copy and rename WebP files
function copyWebPFiles() {
  console.log("\n=== Copying WebP files ===");

  Object.entries(BADGE_SLUG_MAPPING).forEach(([sourceSlug, destSlug]) => {
    // Handle special cases for folder naming
    let sourceWebpDir;
    if (sourceSlug === "walletconnect") {
      sourceWebpDir = path.join(SOURCE_DIR, sourceSlug, "webp-wallet-connect");
    } else {
      sourceWebpDir = path.join(SOURCE_DIR, sourceSlug, `webp-${sourceSlug}`);
    }

    if (!fs.existsSync(sourceWebpDir)) {
      console.log(
        `⚠️  WebP directory not found for ${sourceSlug}: ${sourceWebpDir}`,
      );
      return;
    }

    const destWebpDir = path.join(WEBP_DEST_DIR, destSlug);

    // Process each level folder
    const levelFolders = fs
      .readdirSync(sourceWebpDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .sort();

    levelFolders.forEach((levelFolder) => {
      const levelDir = path.join(sourceWebpDir, levelFolder);
      const files = fs.readdirSync(levelDir);

      // Find the 1x WebP file
      const webpFile = files.find((file) => file.endsWith("_1x.webp"));
      if (!webpFile) {
        console.log(`⚠️  No 1x WebP file found in ${levelDir}`);
        return;
      }

      // Determine level and status from folder name
      let level, status;
      if (levelFolder.includes("locked")) {
        level = levelFolder.match(/(\d+)/)?.[1] || "1";
        status = "locked";
      } else {
        level = levelFolder.match(/(\d+)/)?.[1] || "1";
        status = "earned";
      }

      // Create new filename
      const newFilename = `${destSlug}-${level}-${status}.webp`;
      const sourcePath = path.join(levelDir, webpFile);
      const destPath = path.join(destWebpDir, newFilename);

      // Copy file
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied: ${newFilename}`);
    });
  });
}

// Copy and rename PNG files
function copyPNGFiles() {
  console.log("\n=== Copying PNG files ===");

  Object.entries(BADGE_SLUG_MAPPING).forEach(([sourceSlug, destSlug]) => {
    const sourcePngDir = path.join(SOURCE_DIR, sourceSlug, "png");

    if (!fs.existsSync(sourcePngDir)) {
      console.log(
        `⚠️  PNG directory not found for ${sourceSlug}: ${sourcePngDir}`,
      );
      return;
    }

    const destPngDir = path.join(PNG_DEST_DIR, destSlug);
    const files = fs.readdirSync(sourcePngDir);

    // Process PNG files - use the regular resolution (not @2x) to avoid duplicates
    files.forEach((file) => {
      if (!file.endsWith(".png") || file.includes("@2x")) return;

      // Parse filename to determine level and status
      let level, status, newFilename;

      if (file.includes("locked")) {
        // Handle locked files
        const match = file.match(/(\d+)-/);
        if (match) {
          level = match[1];
          status = "locked";
          newFilename = `${destSlug}-${level}-${status}.png`;
        }
      } else {
        // Handle earned files
        const match = file.match(/(\d+)-/);
        if (match) {
          level = match[1];
          status = "earned";
          newFilename = `${destSlug}-${level}-${status}.png`;
        }
      }

      if (newFilename) {
        const sourcePath = path.join(sourcePngDir, file);
        const destPath = path.join(destPngDir, newFilename);

        // Copy file
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied: ${newFilename}`);
      }
    });
  });
}

// Main execution
function main() {
  console.log("🚀 Starting badge artwork import...");

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  try {
    ensureDirectories();
    copyWebPFiles();
    copyPNGFiles();
    console.log("\n🎉 Badge artwork import completed successfully!");
  } catch (error) {
    console.error("❌ Error during import:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, BADGE_SLUG_MAPPING };

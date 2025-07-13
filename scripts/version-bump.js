#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const versionType = process.argv[2] || "patch"; // patch, minor, major

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

const oldVersion = packageJson.version;
const newVersion = bumpVersion(packageJson.version, versionType);
packageJson.version = newVersion;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

console.log(`Version bumped from ${oldVersion} to ${newVersion}`);
console.log("Remember to commit this change!");

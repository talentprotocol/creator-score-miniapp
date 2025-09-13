import packageJson from "../package.json";

export function getAppVersion(): string {
  return `v${packageJson.version}`;
}

export function getBuildDate(): string {
  // Use build-time date if available, fallback to current date
  const buildDate =
    process.env.NEXT_PUBLIC_BUILD_DATE ||
    new Date().toISOString().split("T")[0];
  return buildDate;
}

export function getVersionWithDate(): string {
  return `${getAppVersion()}.${getBuildDate().replace(/-/g, ".")}`;
}

export function getVersionDisplay(): string {
  const version = getAppVersion();
  const buildDate = getBuildDate();

  // Format: v0.1.0 (2025.01.13)
  return `BASE200 App ${version} (${buildDate.replace(/-/g, ".")})`;
}

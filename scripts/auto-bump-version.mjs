import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const pkgPath = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const parseSemver = (value) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    throw new Error(`Unsupported version format: ${value}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
};

const compareSemver = (left, right) => {
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  return left.patch - right.patch;
};

const formatSemver = ({ major, minor, patch }) => `${major}.${minor}.${patch}`;

const localVersion = parseSemver(pkg.version);
let publishedVersion;

try {
  const viewOutput = execSync(`npm view ${pkg.name} version --json`, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8'
  }).trim();

  const parsed = JSON.parse(viewOutput);
  const publishedRaw = Array.isArray(parsed) ? parsed.at(-1) : parsed;
  if (typeof publishedRaw === 'string') {
    publishedVersion = parseSemver(publishedRaw);
  }
} catch {
  // Package/version may not exist yet or network/auth can be unavailable.
}

if (!publishedVersion) {
  console.log(`No published version found for ${pkg.name}. Keeping version ${pkg.version}.`);
  process.exit(0);
}

if (compareSemver(localVersion, publishedVersion) > 0) {
  console.log(`Local version ${pkg.version} is already ahead of published ${formatSemver(publishedVersion)}.`);
  process.exit(0);
}

const nextVersion = {
  major: publishedVersion.major,
  minor: publishedVersion.minor,
  patch: publishedVersion.patch + 1
};

pkg.version = formatSemver(nextVersion);
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`Bumped ${pkg.name} version from ${formatSemver(localVersion)} to ${pkg.version}.`);

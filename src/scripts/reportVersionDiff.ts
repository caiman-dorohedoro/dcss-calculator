import { gameVersions, isGameVersion } from "../types/game";
import { summarizeVersionDiff } from "../versioning/versionDiff";
import { getVersionConfig } from "../versioning/versionRegistry";

const [, , previousVersion, nextVersion] = process.argv;

if (
  !previousVersion ||
  !nextVersion ||
  !isGameVersion(previousVersion) ||
  !isGameVersion(nextVersion)
) {
  console.error(
    `Usage: npm run report-version-diff -- <${gameVersions.join("|")}> <${gameVersions.join("|")}>`
  );
  process.exit(1);
}

const previousConfig = getVersionConfig(previousVersion);
const nextConfig = getVersionConfig(nextVersion);

console.log(
  summarizeVersionDiff(
    previousVersion,
    nextVersion,
    previousConfig.spells,
    nextConfig.spells,
    previousConfig.species,
    nextConfig.species
  )
);

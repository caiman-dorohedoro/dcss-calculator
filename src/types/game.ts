export type GameVersion = "0.32" | "0.33" | "trunk";

export const gameVersions = ["0.32", "0.33", "trunk"] as const satisfies readonly GameVersion[];
export const startupRestoreOrder = ["trunk", "0.32", "0.33"] as const satisfies readonly GameVersion[];

export const isGameVersion = (version: string): version is GameVersion => {
  return gameVersions.includes(version as GameVersion);
};

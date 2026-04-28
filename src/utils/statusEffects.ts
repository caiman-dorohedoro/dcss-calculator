export const statusEffectIds = {
  ephemeralShield: "ephemeral_shield",
  icemailDepleted: "icemail_depleted",
  icyArmour: "icy_armour",
  vertigo: "vertigo",
} as const;

export const hasActiveStatus = (
  activeStatusIds: readonly string[] | undefined,
  statusId: string
) => activeStatusIds?.includes(statusId) === true;

export const collectActiveStatusIds = (
  statuses: readonly { id: string | null }[]
) => Array.from(new Set(statuses.flatMap((status) => (status.id ? [status.id] : []))));

export const statusAwareMutationRules = [
  {
    mutationName: "ephemeral shield",
    stateKey: "ephemeralShield",
    activeStatusId: statusEffectIds.ephemeralShield,
  },
  {
    mutationName: "icemail",
    stateKey: "icemail",
    suppressedByStatusId: statusEffectIds.icemailDepleted,
  },
  {
    mutationName: "condensation shield",
    stateKey: "condensationShield",
    suppressedByStatusId: statusEffectIds.icemailDepleted,
  },
] as const;

export type StatusAwareMutationStateKey =
  (typeof statusAwareMutationRules)[number]["stateKey"];

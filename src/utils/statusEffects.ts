import {
  KNOWN_MUTATION_TRAIT_IDS,
  KNOWN_STATUS_IDS,
  type KnownMutationTraitId,
  type KnownStatusId,
} from "dcss-morgue-parser";

export const hasActiveStatus = (
  activeStatusIds: readonly KnownStatusId[] | undefined,
  statusId: KnownStatusId
) => activeStatusIds?.includes(statusId) === true;

export const collectActiveStatusIds = (
  statuses: readonly { id: KnownStatusId | null }[]
) =>
  Array.from(
    new Set(statuses.flatMap((status) => (status.id ? [status.id] : [])))
  );

export const statusAwareMutationRules = [
  {
    traitId: KNOWN_MUTATION_TRAIT_IDS.ephemeralShield,
    stateKey: "ephemeralShield",
    activeStatusId: KNOWN_STATUS_IDS.ephemeralShield,
  },
  {
    traitId: KNOWN_MUTATION_TRAIT_IDS.icemail,
    stateKey: "icemail",
    suppressedByStatusId: KNOWN_STATUS_IDS.icemailDepleted,
  },
  {
    traitId: KNOWN_MUTATION_TRAIT_IDS.condensationShield,
    stateKey: "condensationShield",
    suppressedByStatusId: KNOWN_STATUS_IDS.icemailDepleted,
  },
  {
    traitId: KNOWN_MUTATION_TRAIT_IDS.sanguineArmour,
    stateKey: "sanguineArmour",
    activeStatusId: KNOWN_STATUS_IDS.sanguineArmoured,
  },
] as const satisfies readonly {
  traitId: KnownMutationTraitId;
  stateKey: string;
  activeStatusId?: KnownStatusId;
  suppressedByStatusId?: KnownStatusId;
}[];

export type StatusAwareMutationStateKey =
  (typeof statusAwareMutationRules)[number]["stateKey"];

export { KNOWN_MUTATION_TRAIT_IDS, KNOWN_STATUS_IDS };

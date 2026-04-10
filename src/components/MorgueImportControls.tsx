import { useState } from "react";
import type { CalculatorState } from "@/hooks/useCalculatorState";
import { Button } from "@/components/ui/button";
import type { GameVersion } from "@/types/game";
import {
  parseImportedMorgue,
  type MorgueImportFailure,
  type MorgueImportSuccess,
} from "@/morgueImport/importMorgue";

type MorgueImportControlsProps = {
  currentVersion: GameVersion;
  onApplyImport: (nextState: CalculatorState<GameVersion>) => void;
};

const overlayClassName =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4";
const panelClassName =
  "w-full max-w-2xl rounded-lg border border-gray-700 bg-[#10131a] p-4 shadow-xl";

export default function MorgueImportControls({
  currentVersion,
  onApplyImport,
}: MorgueImportControlsProps) {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [failure, setFailure] = useState<MorgueImportFailure | null>(null);
  const [pendingSuccess, setPendingSuccess] =
    useState<MorgueImportSuccess | null>(null);
  const [lastSuccess, setLastSuccess] = useState<MorgueImportSuccess | null>(
    null
  );

  const closePasteModal = () => {
    setIsPasteOpen(false);
    setDraftText("");
    setFailure(null);
  };

  const applySuccess = (result: MorgueImportSuccess) => {
    onApplyImport(result.importedState);
    setLastSuccess(result);
    setPendingSuccess(null);
    closePasteModal();
  };

  const handleApply = () => {
    const result = parseImportedMorgue(draftText);
    if (!result.ok) {
      setFailure(result);
      return;
    }

    if (result.detectedVersion !== currentVersion) {
      setPendingSuccess(result);
      setIsPasteOpen(false);
      setFailure(null);
      return;
    }

    applySuccess(result);
  };

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        data-testid="open-morgue-import"
        onClick={() => setIsPasteOpen(true)}
      >
        Import Morgue
      </Button>

      {lastSuccess && (
        <section
          data-testid="morgue-import-summary"
          className="absolute left-0 top-full z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border border-gray-700 bg-[#0d1016] p-3 text-sm shadow-xl"
        >
          <div className="font-semibold">
            Last import: {lastSuccess.sourceVersion} -&gt;{" "}
            {lastSuccess.detectedVersion}
          </div>
          <div className="mt-2">
            <div className="font-medium">Applied</div>
            <ul className="list-disc pl-5">
              {lastSuccess.summary.applied.map((entry) => (
                <li key={`applied-${entry.label}`}>
                  {entry.label}
                  {entry.detail ? `: ${entry.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <div className="font-medium">Skipped</div>
            <ul className="list-disc pl-5">
              {lastSuccess.summary.skipped.length === 0 ? (
                <li>None</li>
              ) : (
                lastSuccess.summary.skipped.map((entry) => (
                  <li key={`skipped-${entry.label}`}>
                    {entry.label}
                    {entry.detail ? `: ${entry.detail}` : ""}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      )}

      {isPasteOpen && (
        <div className={overlayClassName} role="dialog" aria-modal="true">
          <div className={panelClassName}>
            <h2 className="text-lg font-semibold">Import Morgue</h2>
            <p className="mt-1 text-sm text-gray-300">
              Paste a morgue dump. Supported fields will overwrite the current
              calculator state.
            </p>
            <textarea
              data-testid="morgue-import-textarea"
              className="mt-3 min-h-72 w-full rounded-md border border-gray-700 bg-[#0b0d12] p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
            {failure && (
              <div className="mt-3 rounded-md border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">
                <div className="font-medium">{failure.message}</div>
                {failure.detail ? <div className="mt-1">{failure.detail}</div> : null}
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={closePasteModal}>
                Cancel
              </Button>
              <Button data-testid="apply-morgue-import" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingSuccess && (
        <div className={overlayClassName} role="dialog" aria-modal="true">
          <div className={panelClassName}>
            <h2 className="text-lg font-semibold">Switch Version Before Import?</h2>
            <p className="mt-2 text-sm text-gray-300">
              This morgue was parsed as {pendingSuccess.sourceVersion}, which
              maps to calculator version {pendingSuccess.detectedVersion}. The
              current calculator is set to {currentVersion}. Switch versions and
              apply the import?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setPendingSuccess(null)}>
                Cancel
              </Button>
              <Button
                data-testid="confirm-version-import"
                onClick={() => applySuccess(pendingSuccess)}
              >
                Switch And Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

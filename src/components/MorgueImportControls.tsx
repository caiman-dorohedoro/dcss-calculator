import { useState } from "react";
import { createPortal } from "react-dom";
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
  summaryHost?: HTMLElement | null;
};

const overlayClassName =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6";
const panelClassName =
  "w-full max-w-4xl rounded-lg border border-gray-700 bg-[#10131a] p-6 shadow-2xl";

export default function MorgueImportControls({
  currentVersion,
  onApplyImport,
  summaryHost,
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

  const summaryContent = lastSuccess && (
    <section
      data-testid="morgue-import-summary"
      className="mb-3 rounded-md border border-gray-700 bg-[#0d1016] p-3 text-sm shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold">
          Last import: {lastSuccess.sourceVersion} -&gt;{" "}
          {lastSuccess.detectedVersion}
        </div>
        <Button
          size="sm"
          variant="ghost"
          data-testid="dismiss-morgue-import-summary"
          onClick={() => setLastSuccess(null)}
        >
          Close
        </Button>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <div className="font-medium">Applied</div>
          <ul className="mt-1 max-h-48 list-disc space-y-1 overflow-auto pl-5">
            {lastSuccess.summary.applied.map((entry) => (
              <li key={`applied-${entry.label}`}>
                {entry.label}
                {entry.detail ? `: ${entry.detail}` : ""}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium">Skipped</div>
          <ul className="mt-1 max-h-48 list-disc space-y-1 overflow-auto pl-5">
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
      </div>
    </section>
  );

  const pasteModal = isPasteOpen && (
    <div
      data-testid="morgue-import-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName}>
        <h2 className="text-lg font-semibold">Import Morgue</h2>
        <p className="mt-1 text-sm text-gray-300">
          Paste a morgue dump. Supported fields will overwrite the current
          calculator state.
        </p>
        <textarea
          data-testid="morgue-import-textarea"
          className="mt-4 min-h-[28rem] w-full rounded-md border border-gray-700 bg-[#0b0d12] p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
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
  );

  const confirmModal = pendingSuccess && (
    <div
      data-testid="morgue-import-confirm-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName}>
        <h2 className="text-lg font-semibold">Switch Version Before Import?</h2>
        <p className="mt-2 text-sm text-gray-300">
          This morgue was parsed as {pendingSuccess.sourceVersion}, which maps
          to calculator version {pendingSuccess.detectedVersion}. The current
          calculator is set to {currentVersion}. Switch versions and apply the
          import?
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
  );

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        data-testid="open-morgue-import"
        onClick={() => setIsPasteOpen(true)}
      >
        Import Morgue
      </Button>
      {summaryContent &&
        (summaryHost ? createPortal(summaryContent, summaryHost) : summaryContent)}
      {pasteModal && createPortal(pasteModal, document.body)}
      {confirmModal && createPortal(confirmModal, document.body)}
    </>
  );
}

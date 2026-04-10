import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Import as ImportIcon } from "lucide-react";
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
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6";
const panelClassName =
  "w-full max-w-4xl border border-white bg-card p-6 text-card-foreground shadow-2xl";
const panelStyle = {
  outline: "1px solid white",
  outlineOffset: "-4px",
} as const;

export default function MorgueImportControls({
  currentVersion,
  onApplyImport,
}: MorgueImportControlsProps) {
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [failure, setFailure] = useState<MorgueImportFailure | null>(null);
  const [pendingSuccess, setPendingSuccess] =
    useState<MorgueImportSuccess | null>(null);
  const [showImportedStatus, setShowImportedStatus] = useState(false);

  useEffect(() => {
    if (!showImportedStatus) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowImportedStatus(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showImportedStatus]);

  const closePasteModal = () => {
    setIsPasteOpen(false);
    setDraftText("");
    setFailure(null);
  };

  const applySuccess = (result: MorgueImportSuccess) => {
    onApplyImport(result.importedState);
    setShowImportedStatus(true);
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

  const pasteModal = isPasteOpen && (
    <div
      data-testid="morgue-import-modal"
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
    >
      <div className={panelClassName} style={panelStyle}>
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
      <div className={panelClassName} style={panelStyle}>
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
      <div
        data-testid="morgue-import-success-anchor"
        className="relative flex items-center"
      >
        <Button
          size="icon"
          variant="ghost"
          data-testid="open-morgue-import"
          aria-label="Import Morgue"
          title="Import Morgue"
          className="h-8 w-8 text-muted-foreground hover:!bg-transparent hover:text-foreground"
          onClick={() => setIsPasteOpen(true)}
        >
          <ImportIcon />
        </Button>
        {showImportedStatus ? (
          <span
            data-testid="morgue-import-success"
            aria-live="polite"
            className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap text-xs text-muted-foreground"
          >
            Imported!
          </span>
        ) : null}
      </div>
      {pasteModal && createPortal(pasteModal, document.body)}
      {confirmModal && createPortal(confirmModal, document.body)}
    </>
  );
}

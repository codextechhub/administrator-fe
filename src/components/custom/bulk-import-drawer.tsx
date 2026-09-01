import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ImportWizard, {
  type ImportWizardCompletion,
} from "@/components/custom/import-wizard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCancelImportBatchMutation } from "@/redux/services/dashboard/import-api";
import type { DatasetType } from "@/redux/services/dashboard/import-types";
import { routesPath } from "@/routes/routes-path";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ImportProcessDrawer({
  open,
  title,
  description,
  children,
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={() => undefined}>
      <SheetContent
        side="right"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="console-geist flex w-full gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        <SheetHeader className="border-b border-white-02 px-4 py-4 text-left sm:px-6">
          <SheetTitle className="font-mont text-base font-semibold text-black-01">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="font-mont text-xs text-gray-01">
              {description}
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 bg-gray-50/60">
          <div className="p-3 sm:p-5">
            {children}
        </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function ImportCancelDialog({
  open,
  cancelling,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  cancelling: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this import?</AlertDialogTitle>
          <AlertDialogDescription>
            The uploaded batch will be marked as cancelled. No records will be
            published, and you will return to the screen where you started.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelling}>Continue import</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={cancelling}
            onClick={onConfirm}
          >
            {cancelling ? "Cancelling…" : "Cancel import"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function BulkImportDrawer({
  open,
  datasetType,
  title,
  description,
  returnLabel,
  onClose,
  onFinished,
}: {
  open: boolean;
  datasetType: Exclude<DatasetType, "bank_statements">;
  title: string;
  description: string;
  returnLabel: string;
  onClose: () => void;
  onFinished?: (completion: ImportWizardCompletion) => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const [batchId, setBatchId] = useState<number | null>(null);
  const [wizardKey, setWizardKey] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBatch, { isLoading: cancelling }] = useCancelImportBatchMutation();

  const resetAndClose = () => {
    setBatchId(null);
    setCancelOpen(false);
    setWizardKey((current) => current + 1);
    onClose();
  };

  const requestCancel = () => {
    if (!batchId) {
      resetAndClose();
      return;
    }
    setCancelOpen(true);
  };

  const confirmCancel = async () => {
    if (!batchId) return;
    try {
      await cancelBatch(batchId).unwrap();
      toast.success("Import cancelled.");
      resetAndClose();
    } catch {
      // The shared API interceptor owns the failure message; keep the workflow open.
    }
  };

  const abandonBatch = async (id: number) => {
    try {
      await cancelBatch(id).unwrap();
      setBatchId(null);
      return true;
    } catch {
      return false;
    }
  };

  const startAnother = () => {
    setBatchId(null);
    setWizardKey((current) => current + 1);
  };

  const viewDetails = (id: number) => {
    resetAndClose();
    navigate(routesPath.PROTECTED.DATA_IMPORTS.BATCHES.VIEW(String(id)));
  };

  return (
    <>
      <ImportProcessDrawer open={open} title={title} description={description}>
        <ImportWizard
          key={wizardKey}
          datasetType={datasetType}
          lockTemplate
          onBatchCreated={setBatchId}
          onAbandonBatch={abandonBatch}
          onFinished={onFinished}
          onComplete={viewDetails}
          onReturn={resetAndClose}
          returnLabel={returnLabel}
          onNewImport={startAnother}
          onCancel={requestCancel}
        />
      </ImportProcessDrawer>

      <ImportCancelDialog
        open={cancelOpen}
        cancelling={cancelling}
        onOpenChange={setCancelOpen}
        onConfirm={() => { void confirmCancel(); }}
      />
    </>
  );
}

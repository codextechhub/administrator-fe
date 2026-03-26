"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import SvgCheck from "@/assets/svg/success-check.svg";

interface PromptModalProp {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  onConfirmText?: string;
  onConfirmClass?: string;
  canCancel?: boolean;
  cancelText?: string;
  onCancel?: () => void;
  title: string;
  description: string;
  src?: string;
  srcClass?: string;
  containerClass?: string;
  titleClass?: string;
  descriptionClass?: string;
  loading?: boolean;
}

// sample usage
{
  /* <PromptModal
  isOpen={true}
  onConfirm={() => {}}
  title="Attention!!"
  containerClass="min-h-[320px]"
  description="Please ensure documents result in delays or failed verification."
  srcClass="size-[58px]"
  src="/image/caution.png"
/>; */
}

export default function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  onConfirmText,
  onConfirmClass,
  canCancel,
  cancelText,
  onCancel,
  title,
  description,
  src,
  srcClass,
  containerClass,
  titleClass,
  descriptionClass,
  loading,
}: PromptModalProp) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "lg:w-105 lg:max-w-[90dvw] min-h-90 max-h-[95dvh] rounded-xl place-content-center",
          containerClass,
        )}
      >
        <DialogHeader className="max-w-97.5 h-fit mx-auto gap-0">
          <img
            src={src || SvgCheck}
            alt="Successful image"
            className={cn("mx-auto mb-5", srcClass)}
            width={110}
            height={100}
            fetchPriority="auto"
          />
          <DialogTitle
            className={cn(
              "text-black-01 text-lg font-semibold text-center font-mont",
              titleClass,
            )}
          >
            {title}
          </DialogTitle>
          <DialogDescription
            className={cn(
              "text-sm w-full text-gray-06 font-medium font-mont text-center mt-2 mx-auto",
              descriptionClass,
            )}
          >
            {description}
          </DialogDescription>
          <div className="flex gap-2 mt-6">
            {canCancel && (
              <Button
                variant={"outline"}
                disabled={loading}
                className="flex-1"
                onClick={() => {
                  if (onCancel) {
                    onCancel();
                  } else {
                    onClose?.();
                  }
                }}
              >
                {cancelText || "Cancel"}
              </Button>
            )}
            <Button
              className={cn("flex-1", onConfirmClass)}
              loading={loading}
              disabled={loading}
              onClick={onConfirm}
            >
              {onConfirmText || "Continue"}
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

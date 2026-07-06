import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function SessionTimeoutModal({
  open,
  secondsLeft,
  isExpired,
  onContinue,
  onLogout,
  goToLogin,
}: {
  open: boolean;
  secondsLeft: number;
  isExpired: boolean;
  onContinue: () => void;
  onLogout: () => void;
  goToLogin: () => void;
}) {
  const isUrgent = secondsLeft < 60;

  return (
    <Dialog open={open || isExpired}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        {isExpired ? (
          <>
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">Session Expired</DialogTitle>
              <DialogDescription className="text-center text-sm font-medium text-gray-01 font-mont">
                Your session has expired due to inactivity. Please log in again to continue.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col gap-2 sm:flex-col mt-2">
              <Button className="w-full h-11" onClick={goToLogin}>
                Go to Login
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">Still there?</DialogTitle>
              <DialogDescription className="text-center text-sm font-medium text-gray-01 font-mont">
                You've been inactive for a while. Your session will automatically
                time out if no action is taken.
              </DialogDescription>
            </DialogHeader>

            {/* Countdown */}
            <div className="flex flex-col items-center gap-1 py-2">
              <span
                className={`text-5xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
                  isUrgent ? "text-destructive" : "text-black-01"
                }`}
              >
                {formatTime(secondsLeft)}
              </span>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${
                  isUrgent ? "text-destructive" : "text-gray-01"
                }`}
              >
                {isUrgent ? "Signing out very soon…" : "until automatic sign-out"}
              </span>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button className="w-full h-11" onClick={onContinue}>
                Continue Session
              </Button>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={onLogout}
              >
                Log Out
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

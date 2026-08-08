import { useState } from "react";
import { EyeIcon, Loader2, Undo2 } from "lucide-react";
import { useNavigate } from "react-router";

import { selectImpersonation } from "@/redux/features/auth/auth-slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { exitProxySession } from "@/utils/proxy-session";

/**
 * Always-on notice that this session is acting as someone else.
 *
 * Impersonation is the one state where every screen lies about who you are, so
 * the exit has to be reachable from ANY screen without hunting through a menu -
 * hence a persistent bar rather than a toast or a menu item alone. It sits above
 * the header inside the scroll container so it is the first thing on the page
 * and cannot be scrolled away from on a phone.
 *
 * Responsive: the identity text is the only flexible element (`min-w-0` +
 * `truncate`) and the exit button is `shrink-0`, so a long name shortens
 * instead of pushing the button off a 390px viewport.
 *
 * Stickiness is owned by the layout's header wrapper, which pins the banner and
 * the header together - pinning them separately would overlap them on scroll.
 */
export function ProxySessionBanner() {
  const impersonation = useAppSelector(selectImpersonation);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  if (!impersonation) return null;

  const onExit = async () => {
    if (isExiting) return;
    setIsExiting(true);
    await exitProxySession({ dispatch, navigate }, impersonation);
    setIsExiting(false);
  };

  return (
    <div
      role="status"
      className="flex items-center gap-2 bg-amber-500 px-3 py-2 text-white sm:gap-3 lg:px-10"
    >
      <EyeIcon className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 truncate text-xs font-medium sm:text-sm">
        You are viewing as{" "}
        <span className="font-semibold">{impersonation.target.full_name}</span>
        <span className="hidden sm:inline"> - everything you do is recorded against your account.</span>
      </p>
      <button
        type="button"
        onClick={onExit}
        disabled={isExiting}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30 disabled:opacity-70"
      >
        {isExiting ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Undo2 className="size-3.5" aria-hidden />
        )}
        Exit
      </button>
    </div>
  );
}

import { useEffect } from "react";
import { Outlet } from "react-router";
import ArrangingShapes from "@/components/auth/arranging-shapes";
import { resetFavicon } from "@/utils/favicon";

export default function AuthLayout() {
  useEffect(() => {
    document.title = "Accounts - XVS";
    resetFavicon();
  }, []);

  return (
    <main className="w-screen h-screen flex bg-white">
      {/* Left 45% — the calm, premium blue panel (desktop only). */}
      <div className="w-[45%] hidden lg:block relative bg-[#0b1f4a] bg-[radial-gradient(120%_120%_at_50%_28%,#11264f_0%,#0b1f4a_45%,#081530_100%)]">
        {/* Subtle texture layered under the shapes. */}
        <div className="absolute inset-0 size-full bg-[url(/image/authBg.png)] bg-cover bg-center opacity-[0.06] z-0" />
        <ArrangingShapes />
      </div>

      {/* Right 55% — white form column, centered. */}
      {/* Scroll container: a flex column that is at least the full viewport
          tall. The content block uses `m-auto` so it sits vertically centered
          when it fits, and — unlike `justify-center`, which clips the top of
          overflowing flex children — falls back to scrolling naturally from the
          top when the content is taller than the viewport (reset-password's 4
          fields on a short phone). `100dvh` accounts for mobile browser chrome. */}
      <div className="w-full flex-1 relative px-6 hide-scrollbar overflow-y-auto flex flex-col min-h-[100dvh]">
        <div className="w-full m-auto max-w-107.5 py-6 shrink-0">
          {/* Mobile-only logo — part of the centered block below lg. The blue
              panel carries the logo on desktop, so this is hidden there. */}
          <img
            src="/image/logo.png"
            alt="XVS logo"
            className="lg:hidden h-8 w-auto mx-auto mb-6"
          />
          {/* Desktop-only logo (blue panel is shown alongside). */}
          <img
            src="/image/logo.png"
            alt="XVS logo"
            className="hidden lg:block h-12 w-auto mx-auto mb-6"
          />
          <Outlet />
        </div>
      </div>
    </main>
  );
}

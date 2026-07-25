import { Suspense } from "react";
import { Outlet } from "react-router";
import { LoaderCircle } from "lucide-react";

// Single Suspense boundary for all lazily-loaded route chunks. Kept eager
// (like RouteError and the Authenticated gate) so the shell that handles
// loading can never itself fail to load.
export default function LazyRoot() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center px-4">
          <LoaderCircle className="size-5 animate-spin text-gray-01" />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}

import { Outlet } from "react-router";

export default function SignUpWebLayout() {
  return (
    <main className="w-screen h-screen flex bg-white">
      <div className="w-[45%] hidden lg:block relative">
        <div className="size-full relative z-2 bg-linear-to-b from-primary to-sec hide-scrollbar text-white pt-2 xl:pt-10 flex flex-col items-center">
          <div className="mb-10">
            <img
              src="/svg/logo-white.svg"
              alt="codex logo"
              className="mx-auto h-8 w-auto"
            />
          </div>
        </div>
      </div>
      <div className="w-full flex-1 relative px-6 overflow-hidden">
        <div className="lg:hidden py-3 sticky top-0">
          <img
            src="/svg/logo.svg"
            alt="codex logo"
            width={80}
            height={80}
            className="mx-auto h-7 w-auto"
          />
        </div>
        <div className="h-full hide-scrollbar mt-5 md:mt-0 mx-auto max-w-107.5 pb-5 flex lg:items-center">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

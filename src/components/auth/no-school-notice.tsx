import { SUPPORT_MAIL } from "@/utils/static";

/**
 * Shown in place of the sign-in and password-reset forms when the address this
 * page was served at names no school.
 *
 * Both of those forms have to tell the backend which school they are for, and
 * the address is the only thing that can answer that before anyone has
 * authenticated. Without it the form cannot succeed, so it is not offered:
 * a form that always fails teaches the reader that their password is wrong.
 *
 * DELIBERATELY NOT A SCHOOL FINDER. No list, no search, no "did you mean".
 * Every school using this product reaches it at its own address, so a finder
 * here would hand any visitor the roster of Codex's customers. A reader who
 * does not know their school's address has to be told it by their school, or
 * by support, which is what this says.
 *
 * The token-keyed flows (activation, and completing a reset from an email link)
 * are not gated: the token identifies the account on its own, so those pages
 * work wherever the link is opened.
 */
export default function NoSchoolNotice({ action }: { action: "sign in" | "reset your password" }) {
  return (
    <div className="text-center space-y-4">
      <div className="space-y-1.5">
        <h4 className="font-semibold text-2xl text-black-01">
          This address does not belong to a school
        </h4>
        <p className="text-sm font-medium text-gray-01 font-mont">
          Each school signs in at its own web address, and this one names none, so
          there is no school here to {action} for.
        </p>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-left">
        <p className="text-sm text-black-01">
          Open your school&apos;s own address and try again. It looks like
          {" "}
          <span className="font-mono text-xs">your-school.xvs.codexng.com</span>, with
          your school&apos;s name in front.
        </p>
        <p className="mt-2 text-xs text-gray-01 font-mont">
          If you do not know it, ask your school administrator: they issued the
          address when the school was set up.
        </p>
      </div>

      <p className="text-xs text-gray-01 font-mont">
        Still stuck? Contact{" "}
        <a className="text-primary hover:underline" href={`mailto:${SUPPORT_MAIL}`}>
          {SUPPORT_MAIL}
        </a>
        .
      </p>
    </div>
  );
}

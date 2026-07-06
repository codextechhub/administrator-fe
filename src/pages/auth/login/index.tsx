import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { useLoginMutation } from "@/redux/services/auth/auth-api";
import { routesPath } from "@/routes/routesPath";
import { consumeReturnTo } from "@/utils/return-to";
import { humanizeAuthError } from "@/utils/auth-errors";
import { loginSchema } from "@/schema/auth";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

export default function Login() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [apiError, setApiError] = useState("");
  // Read once at mount (lazy initialiser); the effect only clears the flag so
  // a later manual visit to /accounts doesn't re-show a stale banner.
  const [sessionBanner] = useState(
    () => sessionStorage.getItem("_auth_banner") ?? "",
  );

  useEffect(() => {
    sessionStorage.removeItem("_auth_banner");
  }, []);

  const formik = useFormik({
    initialValues: {
      password: "",
      email: "",
    },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      setApiError("");
      login(values)
        .unwrap()
        .then((res) => {
          // Identity check: this portal is for school accounts only. The login
          // succeeds at the shared backend endpoint even for Codex staff, but
          // auth-api's onQueryStarted writes NO cookies/state for CX_STAFF (and
          // blacklists the issued pair). Refuse to navigate and point them to
          // the Console.
          if (res.data.user.user_type === "CX_STAFF") {
            setApiError(
              "This portal is for school accounts. Codex staff sign in at the Console — console.codexng.com.",
            );
            return;
          }
          navigate(consumeReturnTo() ?? routesPath.PROTECTED.OVERVIEW.INDEX, {
            replace: true,
          });
        })
        .catch((err) => {
          setApiError(
            humanizeAuthError(err, "Invalid credentials. Please try again."),
          );
        });
    },
  });

  return (
    <div className="w-full">
      {sessionBanner && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
          {sessionBanner}
        </div>
      )}
      <div className="text-center space-y-1.5">
        <h4 className="font-semibold text-2xl text-black-01">
          Login to your Account
        </h4>
        <p className="text-sm font-medium text-gray-01 font-mont">
          One sign-in. Your school, your role, your workspace.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="mt-4 space-y-4">
        <CustomInput
          label="Email"
          id="email"
          placeholder="Enter your email"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
          {...formik.getFieldProps("email")}
          onChange={(e) => {
            setApiError("");
            formik.handleChange(e);
          }}
          error={formik.touched.email ? formik.errors.email : ""}
        />
        <CustomInput
          label="Password"
          id="password"
          type="password"
          placeholder="Enter your password"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
          {...formik.getFieldProps("password")}
          onChange={(e) => {
            setApiError("");
            formik.handleChange(e);
          }}
          error={formik.touched.password ? formik.errors.password : ""}
        />

        <div className="text-end">
          <Link
            to={routesPath.AUTH.FORGOT_PASSWORD}
            className="text-primary font-mont text-sm font-medium capitalize"
          >
            Forgot password
          </Link>
        </div>

        {apiError && (
          <p className="text-xs font-medium text-destructive/70 -mt-1">
            {apiError}
          </p>
        )}

        <Button
          disabled={!formik.isValid || !formik.dirty || isLoading}
          loading={isLoading}
          type="submit"
          className="w-full h-11"
        >
          Login
        </Button>
      </form>
    </div>
  );
}

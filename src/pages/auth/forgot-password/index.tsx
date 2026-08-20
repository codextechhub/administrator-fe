import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { useForgotPasswordMutation } from "@/redux/services/auth/auth-api";
import { routesPath } from "@/routes/routesPath";
import { forgotPasswordSchema } from "@/schema/auth";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { swipAnimateVariant } from "@/utils/animation";
import { humanizeAuthError } from "@/utils/auth-errors";
import { useFormik } from "formik";
import { toast } from "sonner";
import NoSchoolNotice from "@/components/auth/no-school-notice";
import { currentSchoolSlug } from "@/utils/school-host";

export default function ForgotPassword() {
  const [schoolSlug] = useState(() => currentSchoolSlug());
  const [submitted, setSubmitted] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: forgotPasswordSchema,
    onSubmit: (values) => {
      forgotPassword({ email: values.email })
        .unwrap()
        .then(() => {
          setSentEmail(values.email);
          setSubmitted(true);
        })
        .catch((err) => {
          toast.error(
            humanizeAuthError(err, "Something went wrong. Please try again."),
          );
        });
    },
  });

  // A reset is scoped to one school, so an address that names none has nothing
  // to reset against.
  if (!schoolSlug) return <NoSchoolNotice action="reset your password" />;

  return (
    <AnimatePresence mode="wait" custom={1}>
      <motion.div
        key={submitted ? "sent" : "form"}
        custom={1}
        variants={swipAnimateVariant}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className="w-full"
      >
        {!submitted ? (
          <form onSubmit={formik.handleSubmit}>
            <div className="text-center space-y-1.5">
              <h4 className="font-semibold text-2xl text-black-01">
                Forgot Password
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont">
                Let's help you recover your account
              </p>
            </div>

            <div className="mt-4 mb-9">
              <CustomInput
                label="Email"
                id="email"
                placeholder="Enter your email"
                className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
                {...formik.getFieldProps("email")}
                error={formik.touched.email ? formik.errors.email : ""}
              />
            </div>

            <Button
              disabled={!formik.isValid || !formik.dirty || isLoading}
              loading={isLoading}
              type="submit"
              className="w-full h-11"
            >
              Send Reset Link
            </Button>

            <div className="text-center">
              <Link
                to={routesPath.AUTH.LOGIN}
                className="font-mont font-medium text-sm text-black-01 inline-flex justify-center items-center mt-6 group"
              >
                <figure className="size-fit mr-1.5 group-hover:-translate-x-1 ease-linear transition-all">
                  {svgIcons.arrowLeft}
                </figure>
                Back to Log In
              </Link>
            </div>
          </form>
        ) : (
          <div>
            <div className="text-center space-y-1.5">
              <h4 className="font-semibold text-2xl text-black-01">
                Check your Email!
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-61.25 mx-auto">
                We've sent a password reset link to{" "}
                <span className="text-black-01 font-semibold">{sentEmail}</span>
              </p>
            </div>

            <p className="text-center font-mont text-sm text-gray-01 mt-9">
              Didn't receive any email?{" "}
              <button
                type="button"
                className="text-primary font-medium cursor-pointer"
                onClick={() => setSubmitted(false)}
              >
                Try again
              </button>
            </p>

            <div className="text-center mt-6">
              <Link
                to={routesPath.AUTH.LOGIN}
                className="font-mont font-medium text-sm text-black-01 inline-flex justify-center items-center group"
              >
                <figure className="size-fit mr-1.5 group-hover:-translate-x-1 ease-linear transition-all">
                  {svgIcons.arrowLeft}
                </figure>
                Back to Log In
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

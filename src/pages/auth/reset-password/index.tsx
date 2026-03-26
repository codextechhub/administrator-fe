import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { swipAnimateVariant } from "@/utils/animation";
import { useFormik } from "formik";
import { resetPasswordSchema } from "@/schema/auth";
import { routesPath } from "@/routes/routesPath";

export default function ResetPassword() {
  const [tab, setTab] = useState(1);
  const navigate = useNavigate();
  const { email, otp } = useLocation().state;

  const formik = useFormik({
    initialValues: {
      password: "",
      password_confirmation: "",
      otp: otp || "",
      email: email || "",
    },
    enableReinitialize: true,
    validationSchema: resetPasswordSchema,
    onSubmit: () => {
      setTab(2);
    },
  });

  const handleNextStep = () => {
    navigate(routesPath.AUTH.LOGIN, { replace: true });
  };

  useEffect(() => {
    if (tab === 2) {
      setTimeout(() => {
        handleNextStep();
      }, 7000);
    }
  }, [tab]);

  return (
    <AnimatePresence mode="wait" custom={1}>
      <motion.div
        key={tab}
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
        {tab === 1 ? (
          <form onSubmit={formik.handleSubmit} className="">
            <div className="text-center space-y-1.5">
              <h4 className="font-semibold text-2xl text-black-01">
                Set a new Password
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-84.5 mx-auto">
                Your new password must be different from your previously used
                password.
              </p>
            </div>

            <div className="mt-4 mb-9 space-y-4">
              <CustomInput
                label="Password"
                id="password"
                type="password"
                placeholder="Enter your password"
                className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
                {...formik.getFieldProps("password")}
                error={formik.touched.password ? formik.errors.password : ""}
              />
              <CustomInput
                label="Confirm Password "
                id="password_confirmation"
                type="password"
                placeholder="Re-enter your password"
                className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
                {...formik.getFieldProps("password_confirmation")}
                error={
                  formik.touched.password_confirmation
                    ? formik.errors.password_confirmation
                    : ""
                }
              />
            </div>

            <Button
              disabled={!formik.isValid || !formik.dirty}
              type="submit"
              className="w-full h-11"
            >
              Reset
            </Button>

            <div className=" text-center">
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
          <div className="">
            <div className="text-center space-y-1.5">
              <h4 className="font-semibold text-2xl text-black-01">
                Password Reset!
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-75.5 mx-auto">
                Your password has been successfully reset. Click the button
                below to Login
              </p>
            </div>

            <Button className="w-full h-11 mt-9" onClick={handleNextStep}>
              Continue
            </Button>

            <div className="text-center space-y-6 mt-6">
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

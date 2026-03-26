import { svgIcons } from "@/assets/svg";
import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { swipAnimateVariant } from "@/utils/animation";
import { useFormik } from "formik";
import { forgotPasswordSchema } from "@/schema/auth";
import { routesPath } from "@/routes/routesPath";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function ForgotPassword() {
  const [tab, setTab] = useState(1);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: "", otp: "" },
    validationSchema: forgotPasswordSchema,
    onSubmit: () => {
      setTab(2);
    },
  });

  const handleOtpSubmit = () => {
    navigate(routesPath.AUTH.RESET_PASSWORD, {
      state: formik.values,
    });
  };

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
                Forgot Password
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont">
                Let’s help you recover your account
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
              disabled={!formik.isValid || !formik.dirty}
              type="submit"
              className="w-full h-11"
            >
              Reset Password
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
                Check your Email!
              </h4>
              <p className="text-sm font-medium text-gray-01 font-mont max-w-61.25 mx-auto">
                We’ve sent a password rest link to {formik.values.email}
              </p>
            </div>

            <div className="mt-9 flex justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={formik.values.otp}
                onChange={(value) => formik.setFieldValue("otp", value)}
              >
                <InputOTPGroup className="gap-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="size-10 md:size-11 lg:size-12"
                      aria-invalid={false}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              className="w-full h-11 mt-6"
              disabled={formik.values.otp.length !== 6}
              onClick={handleOtpSubmit}
            >
              Continue
            </Button>

            <div className="text-center space-y-6 mt-6">
              <p className="font-mont font-medium text-sm text-black-01 ">
                Didn’t receive any email?{" "}
                <span className="text-primary">Click to resend</span>
              </p>

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

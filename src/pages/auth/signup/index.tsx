import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routesPath";
import { signUpSchema } from "@/schema/auth";
import { useFormik } from "formik";
import { useNavigate } from "react-router";

export default function SignUp() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      password: "",
      password_confirmation: "",
    },
    validationSchema: signUpSchema,
    onSubmit: () => {
      navigate(routesPath.AUTH.LOGIN, { replace: true });
    },
  });

  return (
    <div className="w-full">
      <div className="text-center space-y-1.5">
        <h4 className="font-semibold text-2xl text-black-01">
          Create your Account
        </h4>
        <p className="text-sm font-medium text-gray-01 font-mont">
          Let’s get your school set up in minutes.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="mt-4 space-y-4">
        <CustomInput
          label="Full Name"
          id="full_name"
          placeholder="Emeka Osegbo"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
        />
        <CustomInput
          label="Email"
          id="email"
          placeholder="alphaoseghe@gmail.com"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
        />
        <CustomInput
          label="Role"
          id="role"
          placeholder="Head Teacher"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
        />
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
          label="Confirm Password"
          id="confirm_password"
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

        <Button
          disabled={!formik.isValid || !formik.dirty}
          type="submit"
          className="w-full h-11 mt-2"
        >
          Sign Up
        </Button>
      </form>
    </div>
  );
}

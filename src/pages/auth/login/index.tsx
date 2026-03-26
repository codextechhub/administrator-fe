import { CustomInput } from "@/components/custom/custom-input";
import { Button } from "@/components/ui/button";
import { routesPath } from "@/routes/routesPath";
import { loginSchema } from "@/schema/auth";
import { useFormik } from "formik";
import { Link, useNavigate } from "react-router";

export default function Login() {
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      password: "",
      email: "",
    },
    validationSchema: loginSchema,
    onSubmit: () => {
      navigate(routesPath.PROTECTED.OVERVIEW.INDEX, { replace: true });
    },
  });

  return (
    <div className="w-full">
      <div className="text-center space-y-1.5">
        <h4 className="font-semibold text-2xl text-black-01">
          Login to your Account
        </h4>
        <p className="text-sm font-medium text-gray-01 font-mont">
          Let's get your school set up in minutes.
        </p>
      </div>

      <form onSubmit={formik.handleSubmit} className="mt-4 space-y-4">
        <CustomInput
          label="Email"
          id="email"
          placeholder="Enter your email"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
          {...formik.getFieldProps("email")}
          error={formik.touched.email ? formik.errors.email : ""}
        />
        <CustomInput
          label="Password"
          id="password"
          type="password"
          placeholder="Enter your email"
          className="bg-gray-03 h-11 placeholder:text-[#21212166] placeholder:text-sm"
          {...formik.getFieldProps("password")}
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

        <Button
          disabled={!formik.isValid || !formik.dirty}
          type="submit"
          className="w-full h-11"
        >
          Login
        </Button>
      </form>
    </div>
  );
}

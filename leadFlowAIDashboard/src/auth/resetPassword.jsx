/**
 * ==========================================================
 *
 * Purpose
 * -------
 * Allows a user to create a new password after clicking
 * the password reset link sent to their email.
 *
 * Backend Endpoint
 * ----------------
 * POST /api/auth/reset-password
 *
 * URL Example
 * -----------
 * /reset-password?token=eyJhbGciOi...
 *
 * ==========================================================
 */

import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import authService from "../services/auth/authService";

const ResetPassword = () => {
  /* ========================================================
     NAVIGATION
  ======================================================== */

  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  /* ========================================================
     RESET TOKEN
  ======================================================== */

  /**
   * The reset token arrives in the URL.
   *
   * Example:
   *
   * /reset-password?token=xxxxx
   */

  const token =
    searchParams.get("token") || "";

  /* ========================================================
     FORM STATE
  ======================================================== */

  const [formData, setFormData] =
    useState({

      password: "",

      confirmPassword: "",

    });

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [validationErrors,
    setValidationErrors] =
    useState({});

  const [showPassword,
    setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /* ========================================================
     HANDLE INPUT
  ======================================================== */

  const handleChange = (event) => {

    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,

      [name]: value,

    }));

    if (validationErrors[name]) {

      setValidationErrors((previous) => ({
        ...previous,

        [name]: "",

      }));

    }

    if (error) {

      setError("");

    }

  };

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validate = () => {

    const errors = {};

    if (!token) {

      errors.token =
        "Invalid or expired reset link.";

    }

    if (!formData.password) {

      errors.password =
        "Password is required.";

    }

    if (
      formData.password &&
      formData.password.length < 8
    ) {

      errors.password =
        "Password must contain at least 8 characters.";

    }

    if (!formData.confirmPassword) {

      errors.confirmPassword =
        "Please confirm your password.";

    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {

      errors.confirmPassword =
        "Passwords do not match.";

    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;

  };

  /* ========================================================
     RESET PASSWORD
  ======================================================== */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");

    if (!validate()) return;

    try {

      setLoading(true);

      /**
       * Backend Request
       *
       * POST /reset-password
       */

      await authService.resetPassword({

        token,

        password: formData.password,

      });

      setSuccess(true);

    } catch (err) {

      setError(

        err?.message ||

        "Unable to reset password."

      );

    } finally {

      setLoading(false);

    }

  };


  /* ========================================================
     UI
  ======================================================== */

  return (

    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-950
        px-6
        py-12
      "
    >

      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-8
          shadow-2xl
        "
      >

        {/* ==========================================
            BACK BUTTON
        ========================================== */}

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="
            mb-6
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-cyan-400
            transition
            hover:text-cyan-300
          "
        >

          <ArrowLeft size={16} />

          Back to Login

        </button>

        {/* ==========================================
            BRANDING
        ========================================== */}

        <div className="mb-10 text-center">

          <div
            className="
              mx-auto
              mb-5
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-cyan-500
              text-3xl
              font-black
              text-slate-950
            "
          >

            L

          </div>

          <h1
            className="
              text-3xl
              font-black
              text-white
            "
          >

            Reset Password

          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-relaxed
              text-slate-400
            "
          >

            Create a new secure password for your
            LeadFlow AI account.

          </p>

        </div>

        {/* ==========================================
            GENERAL ERROR
        ========================================== */}

        {error && (

          <div
            className="
              mb-6
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-4
              text-sm
              text-red-300
            "
          >

            {error}

          </div>

        )}

        {/* ==========================================
            RESET FORM
        ========================================== */}

        {!success && token && (

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* PASSWORD */}

            <div>

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >

                New Password

              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                  "
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-800
                    py-3
                    pl-12
                    pr-14
                    text-white
                    outline-none
                    transition
                    focus:border-cyan-500
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-white
                  "
                >

                  {showPassword ? (

                    <EyeOff size={18} />

                  ) : (

                    <Eye size={18} />

                  )}

                </button>

              </div>

              {validationErrors.password && (

                <p className="mt-2 text-sm text-red-400">

                  {validationErrors.password}

                </p>

              )}

            </div>

            {/* CONFIRM PASSWORD */}

            <div>

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >

                Confirm Password

              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                  "
                />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-800
                    py-3
                    pl-12
                    pr-14
                    text-white
                    outline-none
                    transition
                    focus:border-cyan-500
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    hover:text-white
                  "
                >

                  {showConfirmPassword ? (

                    <EyeOff size={18} />

                  ) : (

                    <Eye size={18} />

                  )}

                </button>

              </div>

              {validationErrors.confirmPassword && (

                <p className="mt-2 text-sm text-red-400">

                  {validationErrors.confirmPassword}

                </p>

              )}

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="
                flex
                w-full
                items-center
                justify-center
                rounded-xl
                bg-cyan-500
                px-6
                py-3.5
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              {loading ? (

                <>
                  <Loader2
                    size={18}
                    className="mr-2 animate-spin"
                  />

                  Resetting Password...

                </>

              ) : (

                "Reset Password"

              )}

            </button>

          </form>

        )}

        {/* ==========================================
            SUCCESS PANEL
        ========================================== */}

        {success && (

          <div className="space-y-6">

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/30
                bg-emerald-500/10
                p-6
                text-center
              "
            >

              <div
                className="
                  mx-auto
                  mb-5
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-500
                  text-3xl
                  font-black
                  text-slate-950
                "
              >

                ✓

              </div>

              <h2
                className="
                  text-2xl
                  font-bold
                  text-white
                "
              >

                Password Reset Successful

              </h2>

              <p
                className="
                  mt-4
                  text-sm
                  leading-relaxed
                  text-slate-300
                "
              >

                Your LeadFlow AI password has been updated
                successfully.

              </p>

              <p
                className="
                  mt-3
                  text-sm
                  text-slate-400
                "
              >

                You can now sign in using your new password.

              </p>

            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="
                w-full
                rounded-xl
                bg-cyan-500
                px-6
                py-3.5
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >

              Continue to Login

            </button>

          </div>

        )}

        {/* ==========================================
            INVALID TOKEN
        ========================================== */}

        {!token && (

          <div
            className="
              mt-8
              rounded-xl
              border
              border-red-500/30
              bg-red-500/10
              p-5
              text-center
            "
          >

            <h3
              className="
                text-lg
                font-bold
                text-red-300
              "
            >

              Invalid Reset Link

            </h3>

            <p
              className="
                mt-3
                text-sm
                text-slate-300
              "
            >

              This reset link is invalid or has already
              expired.

            </p>

            <Link
              to="/forgot-password"
              className="
                mt-5
                inline-block
                rounded-xl
                bg-cyan-500
                px-5
                py-3
                font-semibold
                text-slate-950
                transition
                hover:bg-cyan-400
              "
            >

              Request New Reset Link

            </Link>

          </div>

        )}

        {/* ==========================================
            LOGIN LINK
        ========================================== */}

        {!success && token && (

          <div
            className="
              mt-8
              border-t
              border-slate-800
              pt-6
              text-center
            "
          >

            <p
              className="
                text-sm
                text-slate-400
              "
            >

              Remember your password?

            </p>

            <Link
              to="/login"
              className="
                mt-2
                inline-block
                font-semibold
                text-cyan-400
                transition
                hover:text-cyan-300
              "
            >

              Return to Login

            </Link>

          </div>

        )}

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div
          className="
            mt-8
            text-center
          "
        >

          <p
            className="
              text-xs
              text-slate-500
            "
          >

            © {new Date().getFullYear()} LeadFlow AI

          </p>

          <p
            className="
              mt-2
              text-xs
              text-slate-600
            "
          >

            Secure AI-powered customer acquisition platform
            for Kenyan real estate agencies.

          </p>

        </div>

      </div>

    </main>

  );

};

export default ResetPassword;
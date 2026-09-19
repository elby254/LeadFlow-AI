/**
 * ==========================================================
 *
 * Purpose
 * -------
 * Authenticates users into LeadFlow AI.
 *
 * Features
 * --------
 * ✓ Email & Password login
 * ✓ Remember Me
 * ✓ Password visibility toggle
 * ✓ Loading state
 * ✓ Error handling
 * ✓ Redirect users to correct dashboard
 *
 * Dashboards
 * ----------
 * Admin
 * Agent
 * Viewer
 *
 * Uses
 * ----
 * useAuth()
 * authService.js
 * sessionService.js
 * roles.js
 *
 * ==========================================================
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
} from "lucide-react";

import useAuth from "../hooks/useAuth";

import {
  getDashboardByRole,
} from "../lib/roles";

const Login = () => {
  /* ========================================================
     NAVIGATION
  ======================================================== */

  const navigate = useNavigate();

  /* ========================================================
     AUTH
  ======================================================== */

  const {
    login,
  } = useAuth();

  /* ========================================================
     FORM STATE
  ======================================================== */

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [serverError, setServerError] =
    useState("");

  /* ========================================================
     INPUT CHANGE
  ======================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }

    if (serverError) {
      setServerError("");
    }
  };

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validate = () => {
    const validationErrors = {};

    if (!formData.email.trim()) {
      validationErrors.email =
        "Email is required.";
    }

    if (!formData.password.trim()) {
      validationErrors.password =
        "Password is required.";
    }

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors)
        .length === 0
    );
  };

  /* ========================================================
     SUBMIT LOGIN
  ======================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      setServerError("");

      /**
       * Expected response
       *
       * {
       *   user,
       *   token,
       *   refreshToken,
       *   expiresAt
       * }
       */

      const response = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      navigate(
        getDashboardByRole(
          response.user.role
        ),
        {
          replace: true,
        }
      );
    } catch (error) {
      setServerError(
        error.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

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
            LeadFlow AI
          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-relaxed
              text-slate-400
            "
          >
            AI-powered customer acquisition platform
            for modern real estate agencies.
          </p>

        </div>

        {/* ==========================================
            SERVER ERROR
        ========================================== */}

        {serverError && (

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
            {serverError}
          </div>

        )}

        {/* ==========================================
            LOGIN FORM
        ========================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ================= EMAIL ================= */}

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
              Email Address
            </label>

            <div className="relative">

              <Mail
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
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@agency.co.ke"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-800
                  py-3
                  pl-12
                  pr-4
                  text-white
                  outline-none
                  transition
                  focus:border-cyan-500
                "
              />

            </div>

            {errors.email && (

              <p
                className="
                  mt-2
                  text-sm
                  text-red-400
                "
              >
                {errors.email}
              </p>

            )}

          </div>

          {/* ================= PASSWORD ================= */}

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
              Password
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
                placeholder="••••••••••"
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
                  setShowPassword(
                    !showPassword
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
                {showPassword ? (

                  <EyeOff size={18} />

                ) : (

                  <Eye size={18} />

                )}
              </button>

            </div>

            {errors.password && (

              <p
                className="
                  mt-2
                  text-sm
                  text-red-400
                "
              >
                {errors.password}
              </p>

            )}

          </div>

          {/* ==========================================
              REMEMBER ME + FORGOT PASSWORD
          ========================================== */}

          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <label
              className="
                flex
                cursor-pointer
                items-center
                gap-3
                text-sm
                text-slate-300
              "
            >
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="
                  h-4
                  w-4
                  rounded
                  border-slate-600
                  bg-slate-800
                  text-cyan-500
                  focus:ring-cyan-500
                "
              />

              Remember Me

            </label>

            <Link
              to="/forgot-password"
              className="
                text-sm
                font-medium
                text-cyan-400
                transition
                hover:text-cyan-300
              "
            >
              Forgot Password?
            </Link>

          </div>

          {/* ==========================================
              LOGIN BUTTON
          ========================================== */}

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
              px-5
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
                  className="
                    mr-2
                    animate-spin
                  "
                />

                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>

        </form>

        {/* ==========================================
            REGISTER LINK
        ========================================== */}

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
            Don't have an account?
          </p>

          <Link
            to="/register"
            className="
              mt-2
              inline-block
              font-semibold
              text-cyan-400
              transition
              hover:text-cyan-300
            "
          >
            Create Account
          </Link>

        </div>

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
              leading-relaxed
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
            AI-powered customer acquisition platform
            for Kenyan real estate agencies.
          </p>

        </div>

      </div>

    </main>

  );

};

export default Login;
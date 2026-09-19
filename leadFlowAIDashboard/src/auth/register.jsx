/**
 * ==========================================================
 * Creates a new LeadFlow AI account.
 *
 * Supports
 * --------
 * ✓ Agency registration
 * ✓ Agent invitation
 * ✓ Viewer accounts
 * ✓ Secure password creation
 * ✓ Role selection
 *
 * Uses
 * ----
 * useAuth()
 * authService.js
 * roles.js
 *
 * ==========================================================
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  Shield,
} from "lucide-react";

import useAuth from "../hooks/useAuth";

import ROLES, {
  getDashboardByRole,
} from "../lib/roles";

const Register = () => {
  /* ========================================================
     NAVIGATION
  ======================================================== */

  const navigate = useNavigate();

  /* ========================================================
     AUTH
  ======================================================== */

  const { register } = useAuth();

  /* ========================================================
     FORM STATE
  ======================================================== */

  const [formData, setFormData] = useState({

    fullName: "",

    email: "",

    phone: "",

    password: "",

    confirmPassword: "",

    agencyName: "",

    role: ROLES.AGENT,

    acceptTerms: false,

  });

  const [loading, setLoading] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [serverError, setServerError] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  /* ========================================================
     HANDLE INPUT CHANGE
  ======================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      checked,
      type,
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

    if (!formData.fullName.trim()) {

      validationErrors.fullName =
        "Full name is required.";

    }

    if (!formData.email.trim()) {

      validationErrors.email =
        "Email address is required.";

    }

    if (!formData.phone.trim()) {

      validationErrors.phone =
        "Phone number is required.";

    }

    if (!formData.agencyName.trim()) {

      validationErrors.agencyName =
        "Agency name is required.";

    }

    if (!formData.password) {

      validationErrors.password =
        "Password is required.";

    }

    if (formData.password.length < 8) {

      validationErrors.password =
        "Password must contain at least 8 characters.";

    }

    if (
      formData.confirmPassword !==
      formData.password
    ) {

      validationErrors.confirmPassword =
        "Passwords do not match.";

    }

    if (!formData.acceptTerms) {

      validationErrors.acceptTerms =
        "You must accept the Terms and Conditions.";

    }

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors)
        .length === 0
    );
  };

  /* ========================================================
     REGISTER ACCOUNT
  ======================================================== */

  const handleSubmit = async (event) => {

    event.preventDefault();

    if (!validate()) return;

    try {

      setLoading(true);

      setServerError("");

      /**
       * Expected Backend Response
       *
       * {
       *    user,
       *    token,
       *    refreshToken
       * }
       */

      const response = await register({

        fullName: formData.fullName,

        email: formData.email,

        phone: formData.phone,

        password: formData.password,

        agencyName: formData.agencyName,

        role: formData.role,

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
          "Unable to create account."

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
          max-w-2xl
          rounded-3xl
          border
          border-slate-800
          bg-slate-900
          p-10
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

            Create LeadFlow AI Account

          </h1>

          <p
            className="
              mt-3
              text-sm
              text-slate-400
            "
          >

            Join Kenya's AI-powered real estate customer
            acquisition platform.

          </p>

        </div>

        {/* ==========================================
            SERVER ERROR
        ========================================== */}

        {serverError && (

          <div
            className="
              mb-8
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
            REGISTRATION FORM
        ========================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ======================================
              FULL NAME
          ====================================== */}

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

              Full Name

            </label>

            <div className="relative">

              <User
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
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Mwangi"
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

            {errors.fullName && (

              <p className="mt-2 text-sm text-red-400">

                {errors.fullName}

              </p>

            )}

          </div>

          {/* ======================================
              EMAIL + PHONE
          ====================================== */}

          <div
            className="
              grid
              gap-6
              md:grid-cols-2
            "
          >

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
                  placeholder="john@email.com"
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
                    focus:border-cyan-500
                  "
                />

              </div>

              {errors.email && (

                <p className="mt-2 text-sm text-red-400">

                  {errors.email}

                </p>

              )}

            </div>

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

                Phone Number

              </label>

              <div className="relative">

                <Phone
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
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+254712345678"
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
                    focus:border-cyan-500
                  "
                />

              </div>

              {errors.phone && (

                <p className="mt-2 text-sm text-red-400">

                  {errors.phone}

                </p>

              )}

            </div>

          </div>

          {/* ======================================
              AGENCY + ROLE
          ====================================== */}

          <div
            className="
              grid
              gap-6
              md:grid-cols-2
            "
          >

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

                Agency Name

              </label>

              <div className="relative">

                <Building2
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
                  type="text"
                  name="agencyName"
                  value={formData.agencyName}
                  onChange={handleChange}
                  placeholder="ABC Realtors"
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
                    focus:border-cyan-500
                  "
                />

              </div>

            </div>

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

                Account Type

              </label>

              <div className="relative">

                <Shield
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-500
                  "
                />

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
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
                    focus:border-cyan-500
                  "
                >

                  <option value={ROLES.AGENT}>
                    Agent
                  </option>

                  <option value={ROLES.VIEWER}>
                    Viewer
                  </option>

                  <option value={ROLES.ADMIN}>
                    Agency Administrator
                  </option>

                </select>

              </div>

            </div>

          </div>

          {/* ======================================
              PASSWORD
          ====================================== */}

          <div
            className="
              grid
              gap-6
              md:grid-cols-2
            "
          >

            {/* Password */}

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

              {errors.password && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.password}
                </p>
              )}

            </div>

            {/* Confirm Password */}

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
                  placeholder="Repeat password"
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

              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400">
                  {errors.confirmPassword}
                </p>
              )}

            </div>

          </div>

          {/* ======================================
              TERMS
          ====================================== */}

          <div>

            <label
              className="
                flex
                items-start
                gap-3
                text-sm
                text-slate-300
              "
            >

              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="
                  mt-1
                  h-4
                  w-4
                  rounded
                  border-slate-700
                  bg-slate-800
                  text-cyan-500
                "
              />

              <span>

                I agree to the{" "}

                <Link
                  to="/terms"
                  className="
                    font-semibold
                    text-cyan-400
                    hover:text-cyan-300
                  "
                >
                  Terms of Service
                </Link>

                {" "}and{" "}

                <Link
                  to="/privacy"
                  className="
                    font-semibold
                    text-cyan-400
                    hover:text-cyan-300
                  "
                >
                  Privacy Policy
                </Link>

              </span>

            </label>

            {errors.acceptTerms && (
              <p className="mt-2 text-sm text-red-400">
                {errors.acceptTerms}
              </p>
            )}

          </div>

          {/* ======================================
              SUBMIT
          ====================================== */}

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
                Creating Account...
              </>
            ) : (
              "Create LeadFlow AI Account"
            )}
          </button>

        </form>

        {/* ==========================================
            LOGIN LINK
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

          <p className="text-sm text-slate-400">

            Already have an account?

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
            Sign In Instead
          </Link>

        </div>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div className="mt-8 text-center">

          <p className="text-xs text-slate-500">

            © {new Date().getFullYear()} LeadFlow AI

          </p>

          <p className="mt-2 text-xs text-slate-600">

            AI-powered customer acquisition platform
            built for Kenyan real estate agencies.

          </p>

        </div>

      </div>

    </main>

  );

};

export default Register;
/**
 * ==========================================================
 * Allows users to request a password reset link.
 *
 * Backend Endpoint
 * ----------------
 * POST /api/auth/forgot-password
 *
 * Features
 * --------
 * ✓ Email validation
 * ✓ Loading state
 * ✓ Success confirmation
 * ✓ Error handling
 * ✓ Redirect back to Login
 *
 * ==========================================================
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Mail,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import authService from "../services/auth/authService";

const ForgotPassword = () => {
  /* ========================================================
     NAVIGATION
  ======================================================== */

  const navigate = useNavigate();

  /* ========================================================
     FORM STATE
  ======================================================== */

  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [validationError, setValidationError] =
    useState("");

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validate = () => {
    if (!email.trim()) {
      setValidationError(
        "Email address is required."
      );
      return false;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setValidationError(
        "Please enter a valid email address."
      );
      return false;
    }

    setValidationError("");

    return true;
  };

  /* ========================================================
     SEND RESET REQUEST
  ======================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!validate()) return;

    try {
      setLoading(true);

      /**
       * Backend Endpoint
       *
       * POST /forgot-password
       */

      await authService.forgotPassword({
        email,
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================
     HANDLE EMAIL CHANGE
  ======================================================== */

  const handleEmailChange = (event) => {
    setEmail(event.target.value);

    if (validationError) {
      setValidationError("");
    }

    if (error) {
      setError("");
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

            Forgot Password

          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-relaxed
              text-slate-400
            "
          >

            Enter the email address associated with your
            LeadFlow AI account and we'll send you a secure
            password reset link.

          </p>

        </div>

        {/* ==========================================
            ERROR ALERT
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

        {!success && (

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
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
                  value={email}
                  onChange={handleEmailChange}
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

              {validationError && (

                <p
                  className="
                    mt-2
                    text-sm
                    text-red-400
                  "
                >

                  {validationError}

                </p>

              )}

            </div>

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
                    className="
                      mr-2
                      animate-spin
                    "
                  />

                  Sending Reset Link...

                </>

              ) : (

                "Send Password Reset Link"

              )}

            </button>

          </form>

        )}

        {/* ==========================================
            SUCCESS STATE
        ========================================== */}

        {success && (

          <div
            className="
              space-y-6
            "
          >

            <div
              className="
                rounded-2xl
                border
                border-emerald-500/30
                bg-emerald-500/10
                p-6
              "
            >

              <div
                className="
                  mx-auto
                  mb-5
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-500
                  text-2xl
                  font-bold
                  text-slate-950
                "
              >

                ✓

              </div>

              <h2
                className="
                  text-center
                  text-2xl
                  font-bold
                  text-white
                "
              >

                Reset Link Sent

              </h2>

              <p
                className="
                  mt-4
                  text-center
                  text-sm
                  leading-relaxed
                  text-slate-300
                "
              >

                We've sent a secure password reset link to

              </p>

              <p
                className="
                  mt-2
                  text-center
                  font-semibold
                  text-cyan-400
                "
              >

                {email}

              </p>

              <p
                className="
                  mt-6
                  text-center
                  text-sm
                  text-slate-400
                "
              >

                Please check your inbox and spam folder.
                The reset link expires for security reasons.

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

              Return to Login

            </button>

          </div>

        )}

        {/* ==========================================
            HELP SECTION
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

            Still having trouble accessing your account?

          </p>

          <Link
            to="/support"
            className="
              mt-2
              inline-block
              font-semibold
              text-cyan-400
              transition
              hover:text-cyan-300
            "
          >

            Contact LeadFlow AI Support

          </Link>

        </div>

        {/* ==========================================
            LOGIN LINK
        ========================================== */}

        {!success && (

          <div
            className="
              mt-6
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

              Sign In

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

export default ForgotPassword;
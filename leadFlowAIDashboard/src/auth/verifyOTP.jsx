/**
 * ==========================================================
 *
 * Purpose
 * -------
 * Verifies the One-Time Password (OTP) sent to the user.
 *
 * Used For
 * --------
 * ✓ Email verification
 * ✓ Password reset verification
 * ✓ Two-factor authentication
 *
 * Backend Endpoints
 * -----------------
 * POST /api/auth/verify-otp
 * POST /api/auth/resend-otp
 *
 * ==========================================================
 */

import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import authService from "../services/auth/authService";

const VerifyOTP = () => {

  /* ========================================================
     NAVIGATION
  ======================================================== */

  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  /* ========================================================
     PARAMETERS
  ======================================================== */

  /**
   * Expected URL
   *
   * /verify-otp?email=user@email.com
   */

  const email =
    searchParams.get("email") || "";

  /* ========================================================
     OTP STATE
  ======================================================== */

  const OTP_LENGTH = 6;

  const [otp, setOtp] = useState(
    Array(OTP_LENGTH).fill("")
  );

  /* ========================================================
     UI STATE
  ======================================================== */

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const [validationError,
    setValidationError] =
    useState("");

  const [countdown,
    setCountdown] =
    useState(60);

  /* ========================================================
     INPUT REFERENCES
  ======================================================== */

  const inputRefs = useRef([]);

  /* ========================================================
     AUTO COUNTDOWN
  ======================================================== */

  useEffect(() => {

    if (countdown <= 0) return;

    const timer = setInterval(() => {

      setCountdown((previous) =>
        previous - 1
      );

    }, 1000);

    return () => clearInterval(timer);

  }, [countdown]);

  /* ========================================================
     HANDLE OTP INPUT
  ======================================================== */

  const handleChange = (
    index,
    value
  ) => {

    if (!/^[0-9]?$/.test(value)) return;

    const updatedOTP = [...otp];

    updatedOTP[index] = value;

    setOtp(updatedOTP);

    if (value && index < OTP_LENGTH - 1) {

      inputRefs.current[index + 1]?.focus();

    }

    if (validationError) {

      setValidationError("");

    }

    if (error) {

      setError("");

    }

  };

  /* ========================================================
     HANDLE BACKSPACE
  ======================================================== */

  const handleKeyDown = (
    index,
    event
  ) => {

    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {

      inputRefs.current[index - 1]?.focus();

    }

  };

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validate = () => {

    const code = otp.join("");

    if (!email) {

      setValidationError(
        "Missing verification email."
      );

      return false;

    }

    if (code.length !== OTP_LENGTH) {

      setValidationError(
        "Enter the complete 6-digit OTP."
      );

      return false;

    }

    setValidationError("");

    return true;

  };

  /* ========================================================
     VERIFY OTP
  ======================================================== */

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");

    if (!validate()) return;

    try {

      setLoading(true);

      await authService.verifyOTP({

        email,

        otp: otp.join(""),

      });

      setSuccess(true);

    } catch (err) {

      setError(

        err?.message ||

        "OTP verification failed."

      );

    } finally {

      setLoading(false);

    }

  };

  /* ========================================================
     RESEND OTP
  ======================================================== */

  const handleResendOTP = async () => {

    if (countdown > 0) return;

    try {

      await authService.resendOTP({

        email,

      });

      setCountdown(60);

    } catch (err) {

      setError(

        err?.message ||

        "Unable to resend OTP."

      );

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
              text-slate-950
            "
          >

            <ShieldCheck size={34} />

          </div>

          <h1
            className="
              text-3xl
              font-black
              text-white
            "
          >

            Verify Your Account

          </h1>

          <p
            className="
              mt-3
              text-sm
              leading-relaxed
              text-slate-400
            "
          >

            Enter the six-digit verification code sent to

          </p>

          <p
            className="
              mt-2
              font-semibold
              text-cyan-400
            "
          >

            {email || "your email"}

          </p>

        </div>

        {/* ==========================================
            ERROR
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
            OTP FORM
        ========================================== */}

        {!success && (

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >

            {/* OTP INPUTS */}

            <div>

              <label
                className="
                  mb-5
                  block
                  text-center
                  text-sm
                  font-semibold
                  text-slate-300
                "
              >

                Verification Code

              </label>

              <div
                className="
                  flex
                  justify-center
                  gap-3
                "
              >

                {otp.map((digit, index) => (

                  <input
                    key={index}
                    ref={(element) =>
                      (inputRefs.current[index] =
                        element)
                    }
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      handleChange(
                        index,
                        event.target.value
                      )
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(
                        index,
                        event
                      )
                    }
                    className="
                      h-14
                      w-12
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-800
                      text-center
                      text-xl
                      font-bold
                      text-white
                      outline-none
                      transition
                      focus:border-cyan-500
                      focus:ring-2
                      focus:ring-cyan-500/20
                    "
                  />

                ))}

              </div>

              {validationError && (

                <p
                  className="
                    mt-4
                    text-center
                    text-sm
                    text-red-400
                  "
                >

                  {validationError}

                </p>

              )}

            </div>

            {/* VERIFY BUTTON */}

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

                  Verifying...

                </>

              ) : (

                "Verify Account"

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

                Verification Successful

              </h2>

              <p
                className="
                  mt-4
                  text-sm
                  leading-relaxed
                  text-slate-300
                "
              >

                Your LeadFlow AI account has been verified.

              </p>

              <p
                className="
                  mt-2
                  text-sm
                  text-slate-400
                "
              >

                You can now access your dashboard and begin
                managing customer inquiries.

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
            RESEND OTP
        ========================================== */}

        {!success && (

          <div
            className="
              mt-8
              border-t
              border-slate-800
              pt-6
              text-center
            "
          >

            {countdown > 0 ? (

              <p
                className="
                  text-sm
                  text-slate-400
                "
              >

                Didn't receive the code?

                <span
                  className="
                    ml-2
                    font-semibold
                    text-cyan-400
                  "
                >

                  Resend in {countdown}s

                </span>

              </p>

            ) : (

              <button
                type="button"
                onClick={handleResendOTP}
                className="
                  font-semibold
                  text-cyan-400
                  transition
                  hover:text-cyan-300
                "
              >

                Resend Verification Code

              </button>

            )}

          </div>

        )}

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

              Already verified?

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
            SUPPORT
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

            Still having trouble verifying your account?

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

            AI-powered customer acquisition platform
            for Kenyan real estate agencies.

          </p>

        </div>

      </div>

    </main>

  );

};

export default VerifyOTP;
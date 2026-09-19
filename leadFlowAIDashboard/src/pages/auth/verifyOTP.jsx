/**
 * ==========================================================
 *
 * OTP Verification Page
 *
 * Used during:
 * • Password Reset
 * • Account Verification
 * • Multi-factor Authentication
 *
 * Backend Endpoint
 * ----------------
 * POST /api/auth/verify-otp
 *
 * Payload
 * -------
 * {
 *   email,
 *   otp
 * }
 *
 * ==========================================================
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle,
  KeyRound,
} from "lucide-react";

import axiosClient from "../../api/axiosClient";

const VerifyOTP = () => {

  const navigate = useNavigate();

  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const handleVerify = async (e) => {

    e.preventDefault();

    setError("");

    if (otp.length !== 6) {

      setError("OTP must contain exactly 6 digits.");

      return;

    }

    try {

      setLoading(true);

      const response = await axiosClient.post(

        "/auth/verify-otp",

        {

          email,

          otp,

        }

      );

      setSuccess(true);

      const resetToken = response.data?.resetToken;

      setTimeout(() => {

        navigate(`/reset-password/${resetToken}`);

      }, 1500);

    } catch (err) {

      setError(

        err.response?.data?.message ||

        "Invalid or expired OTP."

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
        bg-slate-950
        px-6
        py-10
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

        <div className="mb-8 text-center">

          <div
            className="
              mx-auto
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-cyan-500/20
            "
          >

            <ShieldCheck
              size={40}
              className="text-cyan-400"
            />

          </div>

          <h1
            className="
              mt-6
              text-3xl
              font-bold
              text-white
            "
          >

            Verify OTP

          </h1>

          <p
            className="
              mt-3
              leading-7
              text-slate-400
            "
          >

            Enter the 6-digit verification code sent to

            <br />

            <span className="font-semibold text-cyan-400">

              {email || "your email"}

            </span>

          </p>

        </div>

        {success ? (

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

            <CheckCircle
              size={48}
              className="mx-auto text-emerald-400"
            />

            <h2
              className="
                mt-4
                text-xl
                font-bold
                text-white
              "
            >

              Verification Successful

            </h2>

            <p
              className="
                mt-3
                text-slate-300
              "
            >

              Redirecting to password reset...

            </p>

          </div>

        ) : (

          <form
            onSubmit={handleVerify}
            className="space-y-6"
          >

            <div>

              <label
                className="
                  mb-2
                  block
                  text-sm
                  text-slate-300
                "
              >

                Verification Code

              </label>

              <input

                type="text"

                inputMode="numeric"

                maxLength={6}

                required

                value={otp}

                onChange={(e) =>
                  setOtp(
                    e.target.value.replace(/\D/g, "")
                  )
                }

                placeholder="123456"

                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-4
                  py-4
                  text-center
                  text-2xl
                  tracking-[0.5em]
                  text-white
                  outline-none
                  transition
                  focus:border-cyan-500
                "

              />

            </div>

            {error && (

              <div
                className="
                  rounded-xl
                  bg-red-500/20
                  p-3
                  text-red-400
                "
              >

                {error}

              </div>

            )}

            <button

              type="submit"

              disabled={loading}

              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-cyan-500
                py-3
                text-lg
                font-bold
                text-slate-950
                transition
                hover:bg-cyan-400
                disabled:opacity-60
              "

            >

              <KeyRound size={18} />

              {loading

                ? "Verifying..."

                : "Verify Code"}

            </button>

          </form>

        )}

        <div
          className="
            mt-8
            border-t
            border-slate-800
            pt-6
            text-center
          "
        >

          <Link

            to="/login"

            className="
              inline-flex
              items-center
              gap-2
              text-cyan-400
              transition
              hover:text-cyan-300
            "

          >

            <ArrowLeft size={18} />

            Back to Login

          </Link>

        </div>

      </div>

    </main>

  );

};

export default VerifyOTP;

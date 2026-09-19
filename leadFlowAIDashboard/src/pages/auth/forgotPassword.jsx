/**
 * ==========================================================
 *
 * Allows a user to request a password reset email.
 *
 * Backend Endpoint
 * ----------------
 * POST /api/auth/forgot-password
 *
 * Expected Payload
 * ----------------
 * {
 *   email
 * }
 *
 * ==========================================================
 */

import { useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle,
} from "lucide-react";

import axiosClient from "../../api/axiosClient";

const ForgotPassword = () => {

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      setError("");

      setSuccess(false);

      await axiosClient.post(
        "/auth/forgot-password",
        {
          email,
        }
      );

      setSuccess(true);

    } catch (err) {

      setError(

        err.response?.data?.message ||

        "Unable to process your request."

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

        {/* ===================================== */}

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

            <Mail
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

            Forgot Password

          </h1>

          <p
            className="
              mt-3
              leading-7
              text-slate-400
            "
          >

            Enter your registered email address.
            We'll send you a password reset link.

          </p>

        </div>

        {/* ===================================== */}

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
              className="
                mx-auto
                text-emerald-400
              "
            />

            <h2
              className="
                mt-4
                text-xl
                font-bold
                text-white
              "
            >

              Reset Link Sent

            </h2>

            <p
              className="
                mt-3
                leading-7
                text-slate-300
              "
            >

              If an account exists with this email,
              a password reset link has been sent.

            </p>

          </div>

        ) : (

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
                  text-slate-300
                "
              >

                Email Address

              </label>

              <input

                type="email"

                required

                value={email}

                onChange={(e) =>
                  setEmail(e.target.value)
                }

                placeholder="you@example.com"

                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-950
                  px-4
                  py-3
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

              <Send size={18} />

              {loading

                ? "Sending..."

                : "Send Reset Link"}

            </button>

          </form>

        )}

        {/* ===================================== */}

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

export default ForgotPassword;

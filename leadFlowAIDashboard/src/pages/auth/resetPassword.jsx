/**
 * ==========================================================
 *
 * Allows a user to create a new password using
 * the reset token received via email.
 *
 * Backend Endpoint
 * ----------------
 * POST /api/auth/reset-password
 *
 * Payload
 * -------
 * {
 *   token,
 *   password
 * }
 *
 * Route Example
 * -------------
 * /reset-password/:token
 *
 * ==========================================================
 */

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  Lock,
  ArrowLeft,
  CheckCircle,
  Save,
} from "lucide-react";

import axiosClient from "../../api/axiosClient";

const ResetPassword = () => {

  const navigate = useNavigate();

  const { token } = useParams();

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    if (password.length < 8) {

      setError("Password must be at least 8 characters.");

      return;

    }

    if (password !== confirmPassword) {

      setError("Passwords do not match.");

      return;

    }

    try {

      setLoading(true);

      await axiosClient.post(

        "/auth/reset-password",

        {

          token,

          password,

        }

      );

      setSuccess(true);

      setTimeout(() => {

        navigate("/login");

      }, 2500);

    } catch (err) {

      setError(

        err.response?.data?.message ||

        "Password reset failed."

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

            <Lock
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

            Reset Password

          </h1>

          <p
            className="
              mt-3
              text-slate-400
            "
          >

            Create a secure new password.

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

              Password Updated

            </h2>

            <p
              className="
                mt-3
                text-slate-300
              "
            >

              Redirecting you to login...

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

                New Password

              </label>

              <input

                type="password"

                required

                value={password}

                onChange={(e) =>
                  setPassword(e.target.value)
                }

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
                  focus:border-cyan-500
                "

              />

            </div>

            <div>

              <label
                className="
                  mb-2
                  block
                  text-sm
                  text-slate-300
                "
              >

                Confirm Password

              </label>

              <input

                type="password"

                required

                value={confirmPassword}

                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }

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

              <Save size={18} />

              {loading

                ? "Updating..."

                : "Reset Password"}

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

export default ResetPassword;


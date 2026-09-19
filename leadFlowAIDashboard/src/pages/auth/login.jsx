/**
 *
 * Purpose
 * ----------------------------------------------------------
 * Authenticates Admins, Agents and Viewers.
 *
 * Workflow
 * ----------------------------------------------------------
 * 1. User enters email & password
 * 2. POST /auth/login
 * 3. AuthContext stores token + user
 * 4. Redirect based on role
 *
 * Roles
 * ----------------------------------------------------------
 * • admin  -> /admin
 * • agent  -> /agent
 * • viewer -> /viewer
 *
 * ==========================================================
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosClient from "../../api/axiosClient";
import useAuth from "../../hooks/useAuth";

const Login = () => {

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const navigate = useNavigate();

  /* ==========================================================
     AUTH CONTEXT
  ========================================================== */

  const { login } = useAuth();

  /* ==========================================================
     FORM STATE
  ========================================================== */

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     LOGIN HANDLER
  ========================================================== */

  const handleLogin = async (event) => {

    event.preventDefault();

    try {

      setLoading(true);

      setError("");

      /*
      ----------------------------------------------------------
      Authenticate user
      ----------------------------------------------------------
      */

      const response = await axiosClient.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      /*
      ----------------------------------------------------------
      Store authenticated session using AuthContext
      ----------------------------------------------------------
      */

      login(response.data);

console.log(
  "AUTH AFTER LOGIN:",
  JSON.parse(
    localStorage.getItem("leadflowai_auth")
  )
);

      /*
      ----------------------------------------------------------
      Redirect user based on role
      ----------------------------------------------------------
      */

      switch (response.data.user.role) {

        case "admin":
          navigate("/admin");
          break;

        case "agent":
          navigate("/agent");
          break;

        case "viewer":
          navigate("/viewer");
          break;

        default:
          navigate("/login");
          break;

      }

    } catch (err) {

      console.error("Login failed:", err);

      setError(

        err.response?.data?.message ||

        "Invalid email or password."

      );

    } finally {

      setLoading(false);

    }

  };

  /* ==========================================================
     PAGE
  ========================================================== */

  return (

    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6">

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

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8 text-center">

          <h1 className="text-4xl font-bold text-white">

            LeadFlow AI

          </h1>

          <p className="mt-3 text-slate-400">

            Sign in to continue

          </p>

        </div>

        {/* ======================================================
            LOGIN FORM
        ====================================================== */}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          {/* EMAIL */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-300">

              Email Address

            </label>

            <input

              type="email"

              required

              autoComplete="email"

              value={email}

              onChange={(event) =>
                setEmail(event.target.value)
              }

              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                transition
                focus:border-cyan-500
              "

              placeholder="name@example.com"

            />

          </div>

          {/* PASSWORD */}

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-300">

              Password

            </label>

            <input

              type="password"

              required

              autoComplete="current-password"

              value={password}

              onChange={(event) =>
                setPassword(event.target.value)
              }

              className="
                w-full
                rounded-xl
                border
                border-slate-700
                bg-slate-950
                p-3
                text-white
                outline-none
                transition
                focus:border-cyan-500
              "

              placeholder="Enter your password"

            />

          </div>

          {/* ======================================================
              ERROR MESSAGE
          ====================================================== */}

          {error && (

            <div
              className="
                rounded-xl
                border
                border-red-500/30
                bg-red-500/20
                p-3
                text-sm
                text-red-400
              "
            >

              {error}

            </div>

          )}

          {/* ======================================================
              LOGIN BUTTON
          ====================================================== */}

          <button

            type="submit"

            disabled={loading}

            className="
              w-full
              rounded-xl
              bg-cyan-500
              py-3
              text-lg
              font-bold
              text-slate-950
              transition
              hover:bg-cyan-400
              disabled:cursor-not-allowed
              disabled:opacity-60
            "

          >

            {loading ? "Signing In..." : "Login"}

          </button>

          {/* ======================================================
              FORGOT PASSWORD
          ====================================================== */}

          <div className="pt-2 text-center">

            <button

              type="button"

              onClick={() => navigate("/forgot-password")}

              className="
                text-sm
                text-cyan-400
                transition
                hover:text-cyan-300
              "

            >

              Forgot your password?

            </button>

          </div>

        </form>

      </div>

    </main>

  );

};

export default Login;
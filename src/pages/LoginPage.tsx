import { Lock, Mail } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { loginUser } from "../api/auth/auth.api";
import { userStore } from "../store/userStore";

function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const setUser = userStore((state) => state.setUser);

  const navigate = useNavigate();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await loginUser({ email, password });
      setUser(user);
      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to log in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <main className="relative z-10 w-full max-w-150">
        <div className="bg-surface-container-lowest tonal-elevation-1 rounded-xl p-xl border border-outline-variant/30 flex flex-col items-center">
          <header className="flex flex-col items-center gap-sm mb-xl">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-on-primary text-[28px]">
                folder
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-background tracking-tight">
              VaultBox
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-center px-lg">
              Log in to access your secure files.
            </p>
          </header>

          <form className="w-full space-y-lg" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-xs">
              <label
                className="font-label-md text-label-md text-on-surface ml-base"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative flex items-center">
                <Mail className="material-symbols-outlined absolute left-md text-outline" />
                <input
                  className="w-full pl-12.5 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label
                className="font-label-md text-label-md text-on-surface ml-base"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="material-symbols-outlined absolute left-md text-outline" />
                <input
                  className="w-full pl-[48px] pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="font-body-md text-body-md text-error text-center">
                {error}
              </p>
            )}

            <button
              className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-md rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-sm mt-xl disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Logging In..." : "Log In"}
            </button>
          </form>

          <footer className="mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don&apos;t have an account?
              <Link
                className="text-primary font-label-md text-label-md ml-xs hover:underline transition-all"
                to="/signup"
              >
                Sign up
              </Link>
            </p>
          </footer>
        </div>

        <div className="mt-lg flex justify-center items-center gap-xl opacity-40">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">
              encrypted
            </span>
            <span className="font-label-sm text-label-sm">AES-256</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">
              verified_user
            </span>
            <span className="font-label-sm text-label-sm">Privacy First</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;

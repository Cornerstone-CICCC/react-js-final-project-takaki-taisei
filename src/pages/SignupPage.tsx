import { Mail, UserRound, Lock, GlobeLock, ShieldUser } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { signupUser } from "../api/auth/auth.api";
import { userStore } from "../store/userStore";

function SignupPage() {
  const [username, setUsername] = useState<string>("");
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
      const user = await signupUser({ username, email, password });
      setUser(user);
      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign up");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <main className="relative z-10 w-full max-w-150 ">
        <div className="bg-surface-container-lowest tonal-elevation-1 rounded-xl p-xl border border-outline-variant/30 flex flex-col items-center">
          <header className="flex flex-col items-center gap-sm mb-xl">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl shadow-sm">
              <span
                className="material-symbols-outlined text-on-primary text-[28px]"
                data-icon="folder"
                style={{}}
              >
                folder
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-background tracking-tight">
              VaultBox
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-center px-lg">
              Create your account to start securing your files.
            </p>
          </header>
          <form className="w-full space-y-lg" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-xs">
              <label
                className="font-label-md text-label-md text-on-surface ml-base"
                htmlFor="full-name"
              >
                Full Name
              </label>
              <div className="relative flex items-center">
                <UserRound className="material-symbols-outlined absolute left-md text-outline" />
                <input
                  className="w-full pl-11.75 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  id="full-name"
                  name="username"
                  placeholder="John Doe"
                  required
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
            </div>
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
            <div className="flex items-start gap-sm px-base">
              <div className="pt-0.5">
                <input
                  className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary transition-all cursor-pointer"
                  id="terms"
                  name="terms"
                  required
                  type="checkbox"
                />
              </div>
              <label
                className="font-body-md text-body-md text-on-surface-variant cursor-pointer select-none"
                htmlFor="terms"
              >
                I agree to the{" "}
                <a
                  className="text-primary hover:underline transition-all"
                  href="#"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  className="text-primary hover:underline transition-all"
                  href="#"
                >
                  Privacy Policy
                </a>
              </label>
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
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          <footer className="mt-xl text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?
              <Link
                className="text-primary font-label-md text-label-md ml-xs hover:underline transition-all"
                to="/login"
              >
                Log in
              </Link>
            </p>
          </footer>
        </div>
        <div className="mt-lg flex justify-center items-center gap-xl opacity-40">
          <div className="flex items-center gap-xs">
            <GlobeLock className="material-symbols-outlined text-[16px]" />
            <span className="font-label-sm text-label-sm">AES-256</span>
          </div>
          <div className="flex items-center gap-xs">
            <ShieldUser className="material-symbols-outlined text-[16px]" />
            <span className="font-label-sm text-label-sm">Privacy First</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SignupPage;

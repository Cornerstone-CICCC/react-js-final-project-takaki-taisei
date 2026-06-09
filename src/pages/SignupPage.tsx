<>
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-surface-variant opacity-30 rounded-full blur-[120px]"></div>
    <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-primary-fixed-dim opacity-20 rounded-full blur-[120px]"></div>
  </div>
  <main className="relative z-10 w-full max-w-[480px]">
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
      <form action="#" className="w-full space-y-lg">
        <div className="flex flex-col gap-xs">
          <label
            className="font-label-md text-label-md text-on-surface ml-base"
            htmlFor="full-name"
          >
            Full Name
          </label>
          <div className="relative flex items-center">
            <span
              className="material-symbols-outlined absolute left-md text-outline"
              data-icon="person"
            >
              person
            </span>
            <input
              className="w-full pl-[44px] pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              id="full-name"
              name="full-name"
              placeholder="John Doe"
              type="text"
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
            <span
              className="material-symbols-outlined absolute left-md text-outline"
              data-icon="mail"
            >
              mail
            </span>
            <input
              className="w-full pl-[44px] pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              id="email"
              name="email"
              placeholder="john@example.com"
              type="email"
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
            <span
              className="material-symbols-outlined absolute left-md text-outline"
              data-icon="lock"
            >
              lock
            </span>
            <input
              className="w-full pl-[44px] pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
            />
          </div>
        </div>
        <div className="flex items-start gap-sm px-base">
          <div className="pt-[2px]">
            <input
              className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary transition-all cursor-pointer"
              id="terms"
              name="terms"
              type="checkbox"
            />
          </div>
          <label
            className="font-body-md text-body-md text-on-surface-variant cursor-pointer select-none"
            htmlFor="terms"
          >
            I agree to the{" "}
            <a className="text-primary hover:underline transition-all" href="#">
              Terms
            </a>{" "}
            and{" "}
            <a className="text-primary hover:underline transition-all" href="#">
              Privacy Policy
            </a>
          </label>
        </div>
        <button
          className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-md rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-sm mt-xl"
          type="submit"
        >
          Create Account
          <span
            className="material-symbols-outlined text-[18px]"
            data-icon="arrow_forward"
          >
            arrow_forward
          </span>
        </button>
      </form>
      <footer className="mt-xl text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Already have an account?
          <a
            className="text-primary font-label-md text-label-md ml-xs hover:underline transition-all"
            href="#"
          >
            Log in
          </a>
        </p>
      </footer>
    </div>
    <div className="mt-lg flex justify-center items-center gap-xl opacity-40">
      <div className="flex items-center gap-xs">
        <span
          className="material-symbols-outlined text-[16px]"
          data-icon="encrypted"
        >
          encrypted
        </span>
        <span className="font-label-sm text-label-sm">AES-256</span>
      </div>
      <div className="flex items-center gap-xs">
        <span
          className="material-symbols-outlined text-[16px]"
          data-icon="verified_user"
        >
          verified_user
        </span>
        <span className="font-label-sm text-label-sm">Privacy First</span>
      </div>
    </div>
  </main>
</>;

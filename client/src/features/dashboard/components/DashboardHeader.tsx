import { Bell, Folder, LogOut } from "lucide-react";
import { logout } from "../../../api/auth/auth.api";
import { userStore } from "../../../store/userStore";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import SearchComponent from "./SearchComponent";

type Props = { onSearchKey: (value: string) => void; value: string };

function DashboardHeader({ onSearchKey, value }: Props) {
  const clearUser = userStore((state) => state.clearUser);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      clearUser();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to logout");
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-margin-desktop py-md bg-surface-container-lowest shadow-sm h-16">
      <div className="flex items-center gap-2 text-headline-md font-headline-md font-bold text-on-surface">
        <Folder className="material-symbols-outlined text-primary" />
        VaultBox
      </div>
      <SearchComponent onSearchKey={onSearchKey} value={value} />
      <div className="flex items-center gap-md">
        <button className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <Bell className="material-symbols-outlined text-on-surface-variant" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-surface-container transition-colors"
          onClick={handleLogout}
          type="button"
          aria-label="Log out"
        >
          <LogOut className="material-symbols-outlined text-on-surface-variant" />
        </button>

        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
          <img
            alt="User Profile Avatar"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwPcSjjUMiaNObWUH5t8ZvvIAf4zS4rbzQ85hsnWWejlQFh3I8CqRJFbfo-aRsXvC3_cVLbHoRj2kYZcHI67D0kW1igWFDyQSZsWPdoOVny-98OB9gW5EL3CFEewmk9XrahkEUB_dw26EZRCZrUKTA5extsppgNyhIvEjTlpt9c5XrFhz0Dp5e-KJj2UTegiaBSI9cZRGkzt2Oh3kighMnO8KHzlXd3O2Q2Di6fGmNNj0SdzVfrLDYELks-FU2zSYqoWrU-R4Fdk0"
          />
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;

import { logoutAction } from "@/app/auth/actions";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="btn-secondary text-sm">
        Выйти
      </button>
    </form>
  );
}

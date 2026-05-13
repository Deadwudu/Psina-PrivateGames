import { RegisterForm } from "@/app/register/RegisterForm";
import { listGameSides } from "@/lib/game-sides";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const sides = await listGameSides();
  return <RegisterForm sides={sides} />;
}

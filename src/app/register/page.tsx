import { RegisterForm } from "@/app/register/RegisterForm";
import { getSideDisplayNames } from "@/lib/side-display-names";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const names = await getSideDisplayNames();
  return <RegisterForm sideALabel={names.sideA} sideBLabel={names.sideB} />;
}

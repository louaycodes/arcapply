import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion — ArcApply",
  description: "Connectez-vous à votre espace personnel ArcApply",
};

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#F7F3EC] p-4">
      <LoginForm />
    </div>
  );
}

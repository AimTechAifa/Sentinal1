import { AuthThemeReset } from "@/components/auth/AuthThemeReset";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthThemeReset>
      <div className="auth-shell min-h-screen bg-gray-50">{children}</div>
    </AuthThemeReset>
  );
}

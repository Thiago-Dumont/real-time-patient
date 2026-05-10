import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  if (!loading && session) return <Navigate to="/" />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === "signup") {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (data.session) navigate({ to: "/" });
      else setInfo("Conta criada. Se o e-mail exigir confirmação, verifique sua caixa de entrada. Caso contrário, entre agora.");
      return;
    }
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError(error);
    else navigate({ to: "/" });
  };

  const fillTest = () => {
    setEmail("teste@clinicasaudetotal.com");
    setPassword("Teste@123456");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              <Activity size={20} />
            </div>
            <span className="font-semibold text-lg">Saúde Total</span>
          </div>
          <h1 className="text-2xl font-semibold">
            {mode === "login" ? "Entrar no CRM" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse sua conta para continuar
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 bg-card border border-border rounded-lg p-6">
          <div>
            <label className="text-sm font-medium block mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2.5">
              {error}
            </div>
          )}
          {info && (
            <div className="text-sm text-primary bg-primary/10 border border-primary/20 rounded-md p-2.5">
              {info}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 transition"
          >
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setInfo(null); }}
              className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              {mode === "login" ? "Criar nova conta" : "Já tenho conta"}
            </button>
            <button
              type="button"
              onClick={fillTest}
              className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Preencher dados de teste
            </button>
          </div>
          <div className="text-[11px] text-muted-foreground text-center pt-1 leading-relaxed">
            Conta de teste sugerida:<br />
            <span className="text-foreground">teste@clinicasaudetotal.com</span> · senha <span className="text-foreground">Teste@123456</span>
          </div>
        </form>
      </div>
    </div>
  );
}
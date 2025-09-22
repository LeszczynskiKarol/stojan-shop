// frontend/src/components/admin/LoginForm.tsx
"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useRouter } from "next/navigation"; // Dodajemy useRouter

export const LoginForm = () => {
  const router = useRouter(); // Używamy Next.js router zamiast window.location
  const { verifyRecaptcha, isVerifying } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Dodajemy stan ładowania
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Rozpoczynam logowanie..."); // Debug

      const recaptchaToken = await verifyRecaptcha("login");
      console.log("ReCAPTCHA zweryfikowana"); // Debug

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            recaptchaToken,
          }),
        }
      );

      const data = await response.json();
      console.log("Odpowiedź z serwera:", data); // Debug

      if (!response.ok) {
        throw new Error(data.message || "Błąd logowania");
      }

      // Sprawdzamy czy otrzymaliśmy token i dane użytkownika
      if (!data.data?.token || !data.data?.user) {
        throw new Error("Nieprawidłowa odpowiedź serwera");
      }

      console.log("Zapisuję dane do store..."); // Debug
      await login(data.data.token, data.data.user);

      console.log("Przekierowuję do /admin..."); // Debug
      // Używamy router.push zamiast window.location.href
      router.push("/admin");
    } catch (error: any) {
      console.error("Błąd logowania:", error); // Debug
      setError(error.message || "Wystąpił błąd podczas logowania");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">
          Panel administracyjny
        </h1>

        {error && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || isVerifying}
            className="w-full"
          >
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </div>
    </div>
  );
};

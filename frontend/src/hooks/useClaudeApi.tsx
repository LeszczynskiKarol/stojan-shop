// frontend/src/hooks/useClaudeApi.tsx
import { useState } from "react";
import { IProduct } from "@/types/product.types";
import { useToast } from "@/components/ui/use-toast";

interface UseClaudeApiReturn {
  generateProductDescription: (product: Partial<IProduct>) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
}

export const useClaudeApi = (): UseClaudeApiReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateProductDescription = async (
    product: Partial<IProduct>
  ): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-description`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ product }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.description) {
        throw new Error("Nie otrzymano opisu z API");
      }

      return data.description;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Nieznany błąd podczas generowania opisu";
      setError(errorMessage);

      toast({
        title: "Błąd generowania opisu",
        description: errorMessage,
        variant: "destructive",
      });

      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateProductDescription,
    isGenerating,
    error,
  };
};

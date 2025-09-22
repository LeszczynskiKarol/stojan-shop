// frontend/src/components/products/GenerateDescriptionModal.tsx
import React, { useState, useEffect } from "react";
import { X, Wand2, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useClaudeApi } from "@/hooks/useClaudeApi";
import { useToast } from "@/components/ui/use-toast";
import { IProduct } from "@/types/product.types";

interface GenerateDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Partial<IProduct>;
  onDescriptionGenerated: (description: string) => void;
}

export const GenerateDescriptionModal: React.FC<
  GenerateDescriptionModalProps
> = ({ isOpen, onClose, product, onDescriptionGenerated }) => {
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const { generateProductDescription, isGenerating, error } = useClaudeApi();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setGeneratedDescription("");
      setEditedDescription("");
      setIsCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    // Walidacja przed generowaniem
    if (!product.name) {
      toast({
        title: "Błąd",
        description: "Nazwa produktu jest wymagana do wygenerowania opisu",
        variant: "destructive",
      });
      return;
    }

    if (!product.manufacturer) {
      toast({
        title: "Błąd",
        description: "Producent jest wymagany do wygenerowania opisu",
        variant: "destructive",
      });
      return;
    }

    try {
      const description = await generateProductDescription(product);
      setGeneratedDescription(description);
      setEditedDescription(description);

      toast({
        title: "Sukces",
        description: "Opis został wygenerowany pomyślnie",
      });
    } catch (err) {
      // Błąd jest już obsłużony w hooku
      console.error("Błąd generowania opisu:", err);
    }
  };

  const handleRegenerate = async () => {
    if (
      window.confirm(
        "Czy na pewno chcesz wygenerować nowy opis? Obecny opis zostanie zastąpiony."
      )
    ) {
      await handleGenerate();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedDescription);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    toast({
      title: "Skopiowano",
      description: "Opis został skopiowany do schowka",
    });
  };

  const handleApply = () => {
    onDescriptionGenerated(editedDescription);
    onClose();

    toast({
      title: "Zastosowano",
      description: "Opis został dodany do produktu",
    });
  };

  const formatContentToHtml = (text: string): string => {
    return text
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0)
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Generator opisu produktu</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            disabled={isGenerating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Informacje o produkcie */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">
                Dane produktu używane do generowania:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nazwa:</span>
                  <p className="font-medium">{product.name || "Brak nazwy"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Producent:</span>
                  <p className="font-medium">
                    {product.manufacturer || "Brak producenta"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Moc:</span>
                  <p className="font-medium">
                    {product.power?.value
                      ? `${product.power.value} kW`
                      : "Brak mocy"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Obroty:</span>
                  <p className="font-medium">
                    {product.rpm?.value
                      ? `${product.rpm.value} obr/min`
                      : "Brak obrotów"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Stan:</span>
                  <p className="font-medium capitalize">
                    {product.condition || "używany"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Wielkość mechaniczna:
                  </span>
                  <p className="font-medium">
                    {product.mechanicalSize || "Brak"}
                  </p>
                </div>
              </div>
            </div>

            {/* Przyciski generowania */}
            {!generatedDescription && (
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating || !product.name || !product.manufacturer
                  }
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generowanie opisu...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Wygeneruj opis
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Błąd */}
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-4">
                <p className="font-medium">Wystąpił błąd:</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Wygenerowany opis */}
            {generatedDescription && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Edytor */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="font-medium">Edytuj opis:</label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Skopiowano
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Kopiuj
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRegenerate}
                          disabled={isGenerating}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Generuj ponownie
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                      placeholder="Tu możesz edytować wygenerowany opis..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Każda nowa linia zostanie zamieniona na osobny akapit w
                      HTML
                    </p>
                  </div>

                  {/* Podgląd */}
                  <div className="space-y-3">
                    <label className="font-medium">Podgląd HTML:</label>
                    <div className="border rounded-lg p-4 min-h-[500px] max-h-[600px] overflow-y-auto bg-background">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formatContentToHtml(editedDescription),
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Tekst zostanie sformatowany jako HTML</p>
                      <p>• Każda linia to osobny paragraf {"<p>"}</p>
                      <p>• Długość: {editedDescription.length} znaków</p>
                    </div>
                  </div>
                </div>

                {/* Statystyki opisu */}
                <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Liczba znaków:
                    </span>
                    <p className="font-medium">{editedDescription.length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Liczba słów:</span>
                    <p className="font-medium">
                      {editedDescription.split(/\s+/).filter(Boolean).length}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Liczba akapitów:
                    </span>
                    <p className="font-medium">
                      {editedDescription.split("\n").filter(Boolean).length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Anuluj
            </Button>
            {generatedDescription && (
              <Button
                onClick={handleApply}
                disabled={!editedDescription.trim()}
              >
                Zastosuj opis
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

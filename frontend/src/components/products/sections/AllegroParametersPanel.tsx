// frontend/src/components/products/sections/AllegroParametersPanel.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useToast } from '@/components/ui/use-toast';
import { IProduct } from '@/types/product.types';
import { AllegroParameter } from '@/types/allegro.types';

interface AllegroParametersPanelProps {
  product: IProduct;
}

export const AllegroParametersPanel: React.FC<AllegroParametersPanelProps> = ({ product }) => {
  const [parameters, setParameters] = useState<AllegroParameter[]>(
    product.marketplaces?.allegro?.parameters || []
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const findParameterValue = (paramName: string): string => {
    const param = parameters.find((p) => p.name === paramName || p.id === paramName);
    return param?.values?.[0] || '';
  };

  // Inicjalizacja wartości z produktu i parametrów Allegro
  const powerValue = findParameterValue('Moc') || product.power?.value || '';
  const rpmValue = findParameterValue('Obroty') || product.rpm?.value || '';
  const srednicaWaluValue =
    findParameterValue('Średnica wału') || product.shaftDiameter?.toString() || '';
  const wagaValue = findParameterValue('Waga') || '';
  const napiecieValue = findParameterValue('Napięcie (V)') || '';
  const wielkoscMechanicznaValue =
    findParameterValue('Model') || product.mechanicalSize?.toString() || '';

  const handleParameterUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/allegro/offers/${product._id}/parameters`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameters }),
      });
      if (!response.ok) throw new Error('Błąd aktualizacji parametrów');
      toast({
        title: 'Sukces',
        description: 'Parametry zostały zaktualizowane',
      });
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się zaktualizować parametrów',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateParameter = (id: string, value: string, name: string) => {
    setParameters((prevParams) => {
      const newParams = prevParams.filter((p) => p.id !== id);
      return [...newParams, { id, name, values: [value] }];
    });
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Parametry oferty</h3>
      <div className="space-y-4">
        <div>
          <label>Stan</label>
          <Select
            defaultValue={product.condition}
            value={product.condition}
            onValueChange={(value: string) => {
              updateParameter('11323', value === 'nowy' ? 'Nowy' : 'Używany', 'Stan');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz stan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nowy">Nowy</SelectItem>
              <SelectItem value="uzywany">Używany</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label>Moc (kW)</label>
          <Input
            type="text"
            value={powerValue}
            onChange={(e) => updateParameter('power', e.target.value, 'Moc')}
          />
        </div>

        <div>
          <label>Obroty (obr/min)</label>
          <Input
            type="text"
            value={rpmValue}
            onChange={(e) => updateParameter('rpm', e.target.value, 'Obroty')}
          />
        </div>

        <div>
          <label>Średnica wału (mm)</label>
          <Input
            type="text"
            value={srednicaWaluValue}
            onChange={(e) => updateParameter('srednicaWalu', e.target.value, 'Średnica wału')}
          />
        </div>

        <div>
          <label>Waga (kg)</label>
          <Input
            type="text"
            value={wagaValue}
            onChange={(e) => updateParameter('waga', e.target.value, 'Waga')}
          />
        </div>

        <div>
          <label>Napięcie (V)</label>
          <Select
            value={napiecieValue}
            onValueChange={(value) => updateParameter('napiecie', value, 'Napięcie (V)')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz napięcie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="230">230V</SelectItem>
              <SelectItem value="400">400V</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label>Wielkość mechaniczna</label>
          <Input
            type="text"
            value={wielkoscMechanicznaValue}
            onChange={(e) => updateParameter('wielkoscMechaniczna', e.target.value, 'Model')}
          />
        </div>

        <Button onClick={handleParameterUpdate} disabled={isUpdating}>
          Zapisz parametry
        </Button>
      </div>
    </Card>
  );
};

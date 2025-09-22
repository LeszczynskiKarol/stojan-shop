// src/components/shop/Filters.tsx
'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

interface FiltersState {
  power: [number, number];
  condition: string;
  inStock: boolean;
}

interface FiltersProps {
  onFilterChange: (filters: FiltersState) => void;
  currentFilters: FiltersState;
}

export const Filters = ({ onFilterChange, currentFilters }: FiltersProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Moc [kW]</h3>
        <Slider
          value={currentFilters.power}
          min={0}
          defaultValue={[0, 100]}
          max={100}
          step={1}
          onValueChange={(value) =>
            onFilterChange({
              ...currentFilters,
              power: value.length === 2 ? (value as [number, number]) : [0, 100],
            })
          }
        />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Stan</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <Checkbox
              id="nowy"
              checked={currentFilters.condition === 'nowy'}
              onCheckedChange={() => onFilterChange({ ...currentFilters, condition: 'nowy' })}
            />
            <label htmlFor="nowy" className="ml-2">
              Nowy
            </label>
          </div>
          <div className="flex items-center">
            <Checkbox
              id="uzywany"
              checked={currentFilters.condition === 'uzywany'}
              onCheckedChange={() => onFilterChange({ ...currentFilters, condition: 'uzywany' })}
            />
            <label htmlFor="uzywany" className="ml-2">
              Używany
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Dostępność</h3>
        <div className="flex items-center">
          <Checkbox
            id="inStock"
            checked={currentFilters.inStock}
            onCheckedChange={(checked) => onFilterChange({ ...currentFilters, inStock: checked })}
          />
          <label htmlFor="inStock" className="ml-2">
            Tylko dostępne
          </label>
        </div>
      </div>
    </div>
  );
};

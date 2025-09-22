// frontend/src/components/products/ProductCard.tsx
import React from 'react';
import { IProduct } from '@/types/product.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProductStore } from '@/store/productStore';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: IProduct;
  onEdit?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit }) => {
  const { deleteProduct } = useProductStore();

  const getMarketplaceStatus = () => {
    if (!product.marketplaces) return [];

    const statuses = [];
    if (product.marketplaces?.allegro?.active) statuses.push('Allegro');
    if (product.marketplaces?.olx?.active) statuses.push('OLX');
    if (product.marketplaces?.ownStore?.active) statuses.push('Sklep własny');
    return statuses;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            {product.manufacturer} - {product.power.value}kW
          </CardTitle>
          <div className="flex gap-2">
            {getMarketplaceStatus().map((status) => (
              <Badge key={status} variant="secondary">
                {status}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p>
              <strong>Moc:</strong> {product.power.value}kW ({product.power.range})
            </p>
            <p>
              <strong>Obroty:</strong> {product.rpm.value} ({product.rpm.range})
            </p>
            <p>
              <strong>Rozruch:</strong> {product.startType}
            </p>
            <p>
              <strong>Stan:</strong> {product.condition}
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <strong>Średnica wału:</strong> {product.shaftDiameter}mm
            </p>
            {product.sleeveDiameter && (
              <p>
                <strong>Średnica tulei:</strong> {product.sleeveDiameter}mm
              </p>
            )}
            {product.flangeSize && (
              <p>
                <strong>Rozmiar kołnierza:</strong> {product.flangeSize}mm
              </p>
            )}
            <p>
              <strong>Stan magazynowy:</strong> {product.stock} szt.
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="space-x-2">
            <Button onClick={onEdit}>Edytuj</Button>
            <Button variant="destructive" onClick={() => product._id && deleteProduct(product._id)}>
              Usuń
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Ceny od:</p>
            <p className="text-lg font-semibold">
              {!product.marketplaces
                ? 'Brak cen'
                : Math.min(
                    product.marketplaces?.allegro?.price || Infinity,
                    product.marketplaces?.olx?.price || Infinity,
                    product.marketplaces?.ownStore?.price || Infinity
                  ) === Infinity
                ? 'Brak cen'
                : formatPrice(
                    Math.min(
                      product.marketplaces?.allegro?.price || Infinity,
                      product.marketplaces?.olx?.price || Infinity,
                      product.marketplaces?.ownStore?.price || Infinity
                    )
                  )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

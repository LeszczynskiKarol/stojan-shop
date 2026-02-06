// backend/src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

export const validateProductInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    manufacturer,
    power,
    rpm,
    shaftDiameter,
    condition,
    mechanicalSize,
    mainCategory,
    marketplaces,
    stock,
    weight, // dodane
  } = req.body;

  // Walidacja wymaganych pól
  const requiredFields = [];

  if (!name) requiredFields.push('nazwa');
  if (
    !mainCategory &&
    (!req.body.categories || req.body.categories.length === 0)
  ) {
    requiredFields.push('kategoria');
  }
  if (!marketplaces?.ownStore?.price) requiredFields.push('cena');
  if (stock === undefined || stock === null)
    requiredFields.push('stan magazynowy');
  if (!weight) requiredFields.push('waga'); // dodane

  if (requiredFields.length > 0) {
    throw new ApiError(400, `Wymagane pola: ${requiredFields.join(', ')}`);
  }

  // Walidacja ceny - wzmocniona
  if (!marketplaces?.ownStore?.price || marketplaces.ownStore.price <= 0) {
    throw new ApiError(400, 'Cena musi być większa od 0');
  }

  // Walidacja wagi - dodane
  if (weight <= 0) {
    throw new ApiError(400, 'Waga musi być większa od 0');
  }

  // Walidacja stanu magazynowego
  if (stock < 0) {
    throw new ApiError(400, 'Stan magazynowy nie może być ujemny');
  }

  next();
};

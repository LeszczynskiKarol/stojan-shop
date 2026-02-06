// frontend/src/hooks/useRecaptcha.ts
import { useState, useCallback } from 'react';

export const useRecaptcha = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyRecaptcha = useCallback(async (action: string) => {
    setIsVerifying(true);
    try {
      await new Promise<void>((resolve) => window.grecaptcha.ready(() => resolve()));
      const token = await window.grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!, {
        action,
      });
      return token;
    } catch (error) {
      console.error('Błąd weryfikacji reCAPTCHA:', error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return { verifyRecaptcha, isVerifying };
};

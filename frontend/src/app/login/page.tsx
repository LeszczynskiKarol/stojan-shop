// frontend/src/app/login/page.tsx
'use client';

import { LoginForm } from '@/components/admin/LoginForm';
import Script from 'next/script';

const RecaptchaWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <style jsx global>{`
        .grecaptcha-badge {
          visibility: hidden !important;
        }
      `}</style>
      {children}
    </>
  );
};

export default function LoginPage() {
  return (
    <RecaptchaWrapper>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}&badge=bottomright`}
        strategy="beforeInteractive"
      />
      <LoginForm />
      <small className="text-muted-foreground text-xs mt-4 text-center block">
        Ta strona jest chroniona przez reCAPTCHA
      </small>
    </RecaptchaWrapper>
  );
}

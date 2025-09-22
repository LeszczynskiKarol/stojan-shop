// frontend/src/app/login/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logowanie | Panel administracyjny',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

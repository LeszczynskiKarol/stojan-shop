// src/components/shop/Hero.tsx
export const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-white mb-4">
            Silniki elektryczne i motoreduktory
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Profesjonalne rozwiązania dla przemysłu - szeroki wybór, konkurencyjne ceny, szybka
            dostawa
          </p>
          <div className="space-x-4">
            <a
              href="/products"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Zobacz produkty
            </a>

            <a
              href="/kontakt"
              className="inline-block bg-transparent text-white border-2 border-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Skontaktuj się z nami
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

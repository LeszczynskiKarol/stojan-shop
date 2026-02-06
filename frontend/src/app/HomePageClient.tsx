// frontend/src/app/HomePageClient.tsx
"use client";
import { useRef, useState, useEffect } from "react";
import { ProductSearch } from "@/components/search/ProductSearch";
import { useAuthStore } from "@/store/authStore";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PopularProducts } from "@/components/shop/PopularProducts";
import { Card } from "@/components/ui/Card";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LatestProducts } from "@/components/shop/LatestProducts";
import { CategoryGrid } from "@/components/shop/CategoryGrid";
import { ExpandableDescription } from "@/components/ExpandableDescription";
import { useAnalytics } from "@/hooks/useAnalytics";

const SHOP_DESCRIPTION = `<h2><strong>Silniki elektryczne &ndash; szeroka oferta</strong></h2>
<p>Jesteśmy przekonani, że niezależnie od planowanego przeznaczenia i interesujących Cię parametr&oacute;w znajdziesz u nas odpowiedni napęd. Możesz przebierać w r&oacute;żnego rodzaju silnikach elektrycznych &ndash; mamy na sprzedaż setki wariant&oacute;w tr&oacute;jfazowych, dziesiątki jednofazowych, a także wiele z hamulcem, pierścieniowych i dwubiegowych. R&oacute;żnorodność parametr&oacute;w sprawia, że z łatwością dobierzesz napęd idealnie spełniający Twoje wymagania.</p>
<p>Działamy na maksymalnych obrotach, aby spełnić Twoje oczekiwania. Włączamy najwyższy bieg i z pełną mocą pracujemy nad ciągłym wzbogacaniem i usprawnianiem oferty. Chcemy mieć pewność, że składając zam&oacute;wienie na silniki elektryczne, kt&oacute;rych sprzedaż proponujemy, podejmujesz najlepszą możliwą decyzję.</p>
<p>Oddajemy do Twojej dyspozycji rozbudowaną i zarazem intuicyjną wyszukiwarkę, dzięki kt&oacute;rej w kilka chwil precyzyjnie wskażesz parametry, kt&oacute;re powinien spełniać silnik elektryczny. Określ interesującą Cię moc, prędkość obrotową i pozostałe właściwości i sprawdź, czy obecnie w naszym asortymencie mamy na sprzedaż napędy pasujące do Twoich wymagań.</p>
<h2><strong>Znaczenie silnik&oacute;w elektrycznych w gospodarce</strong></h2>
<p>Indukcyjne silniki elektryczne są nie tylko sercem maszyn, ale r&oacute;wnież kręgosłupem nowoczesnej gospodarki i przemysłu. Co napędza fabryki, elektrownie, urządzenia rolnicze czy lokalne browary? Właśnie napędy, kt&oacute;rych sprzedaż oferujemy. Dzięki wytrzymałości, wydajności i wszechstronności są one wszechobecne w każdym sektorze przemysłu, a także w rolnictwie, transporcie i wielu innych branżach.</p>
<p>Od precyzyjnych urządzeń CNC, po maszyny gospodarcze, skończywszy na gigantycznych prasach hydraulicznych &ndash; nasze silniki elektryczne pracują w wielu miejscach. Jeśli chcesz, żeby przez lata działały także dla Ciebie lub Twojej firmy, przejrzyj ofertę i zam&oacute;w model, kt&oacute;rego potrzebujesz!</p>
<h2><strong>Zastosowanie silnika elektrycznego</strong></h2>
<p>Indukcyjne silniki elektryczne napędzają wsp&oacute;łczesną gospodarkę. Są wszechobecne i szeroko wykorzystywane &ndash; od fabryk, poprzez gospodarstwa, na prywatnych ogr&oacute;dkach skończywszy. Oto kilka przykładowych zastosowań napęd&oacute;w, kt&oacute;re zam&oacute;wisz u nas w wielu wariantach.</p>
<h3><strong>Przemysł</strong></h3>
<ul>
<li><strong>Linie produkcyjne.</strong> Silniki elektryczne są podstawowym elementem większości linii produkcyjnych, napędzając maszyny &ndash; od pras, po taśmociągi.</li>
<li><strong>Pompy i wentylatory.</strong> Nasze napędy są stosowane w systemach HVAC oraz w procesach przemysłowych do pompowania cieczy i gaz&oacute;w.</li>
<li><strong>Maszyny CNC.</strong> Wysoka precyzja i efektywność silnik&oacute;w elektrycznych sprawiają, że są idealne do zastosowań, w kt&oacute;rych wymagana jest duża dokładność pracy.</li>
</ul>
<h3><strong>Rolnictwo</strong></h3>
<ul>
<li><strong>Systemy nawadniające.</strong> Silniki elektryczne są wykorzystywane do napędzania pomp wodnych.</li>
<li><strong>Maszyny rolnicze.</strong> Od kombajn&oacute;w do młocarni &ndash; bez naszych napęd&oacute;w nowoczesne rolnictwo nie mogłoby funkcjonować.</li>
</ul>
<h3><strong>Transport</strong></h3>
<ul>
<li><strong>Pojazdy elektryczne.</strong> Elektryczne silniki indukcyjne są coraz częściej używane w pojazdach elektrycznych ze względu na ich efektywność.</li>
<li><strong>Suwnice i dźwigi. </strong>Nasze napędy montuje się w suwnicach i dźwigach pracujących w magazynach i portach. Ich wysoka efektywność i zdolność do generowania dużego momentu obrotowego powodują, że idealne spisują się w podnoszeniu i przenoszeniu ciężkich ładunk&oacute;w.</li>
<li><strong>Systemy transportu wewnętrznego. </strong>Silniki elektryczne napędzają taśmy przenośnikowe i inne systemy transportu wewnętrznego. Umożliwiają płynny przepływ materiał&oacute;w i produkt&oacute;w pomiędzy r&oacute;żnymi etapami produkcji.</li>
</ul>
<h3><strong>Inne gałęzie gospodarki</strong></h3>
<ul>
<li><strong>Odnawialne źr&oacute;dła energii.</strong> W turbinach wiatrowych i morskich agregatach prądotw&oacute;rczych.</li>
<li><strong>Systemy medyczne.</strong> W urządzeniach takich jak wentylatory czy pompy infuzyjne.</li>
</ul>
<h2><strong>Działanie silnika elektrycznego</strong></h2>
<p>Silnik elektryczny składa się z obudowy zwanej stojanem, kt&oacute;ry jest wyposażony w cewki. Gdy przepływa przez nie prąd elektryczny, generuje się pole magnetyczne o określonej sile i kierunku. Nie jest statyczne, lecz dynamicznie oddziałuje na wirnik, kt&oacute;ry stanowi drugi kluczowy element napędu.</p>
<p>W rezultacie oddziaływania pola magnetycznego w wirniku dochodzi do indukcji prądu. Jest ona możliwa za sprawą użycia materiał&oacute;w o właściwościach magnetycznych w konstrukcji silnika elektrycznego. Indukowany prąd w wirniku tworzy własne pole magnetyczne, kt&oacute;re z kolei oddziałuje z polem magnetycznym stojana. Na skutek tych wzajemnych oddziaływań wirnik zaczyna się obracać.</p>
<p>Obr&oacute;t wirnika umożliwia napędzanie r&oacute;żnego rodzaju maszyn i urządzeń. Od prostych wentylator&oacute;w i pomp, po skomplikowane systemy produkcyjne w fabrykach &mdash; wszędzie tam, gdzie potrzebna jest precyzyjna i efektywna konwersja energii elektrycznej na mechaniczną, nasze silniki indukcyjne, kt&oacute;rych sprzedaż oferujemy, znajdują zastosowanie.</p>
<p>Tym, co sprawia, że nasze napędy są uniwersalne, jest możliwość działania w r&oacute;żnych warunkach &ndash; zar&oacute;wno jeśli chodzi o obciążenie, jak i zakresy prędkości. W efekcie elektryczne silniki indukcyjne są nie tylko efektywne, ale też niezawodne. R&oacute;wnież wysoka wydajność energetyczna silnik&oacute;w elektrycznych jest aspektem wpływającym na szerokie zastosowanie w przemyśle. Powszechnie montuje się je bowiem w instalacjach, maszynach i urządzeniach, w kt&oacute;rych fundamentalną rolę odgrywa wydajność pracy, na przykład w taśmach transportujących czy pompach.</p>
<h2><strong>Sprzedaż silnik&oacute;w elektrycznych</strong></h2>
<p>Specjalizujemy się w sprzedaży silnik&oacute;w elektrycznych. Zapewniamy najwyższą jakość oferowanych napęd&oacute;w oraz profesjonalną obsługę na każdym etapie wsp&oacute;łpracy. Dlaczego warto zdecydować się na nasze usługi? Oto kluczowe zalety wsp&oacute;łpracy z naszym sklepem!</p>
<h3><strong>Silniki gotowe do pracy &ndash; 100% sprawności</strong></h3>
<p>W naszej ofercie znajdują się wyłącznie w pełni sprawne, sprawdzone i gotowe do pracy silniki elektryczne. Nie ma znaczenia, jaki zam&oacute;wisz napęd &ndash; zawsze otrzymujesz od nas gwarancję rozruchową. Oddajemy do Twojej dyspozycji kompletne produkty, kt&oacute;rych rzeczywiste parametry są zgodne opisami publikowanymi na stronie.</p>
<h3><strong>Najlepsi producenci</strong></h3>
<p>Nasz asortyment obejmuje silniki elektryczne najlepszych producent&oacute;w. Przebieraj w napędach takich marek jak EMIT, Celma, ABB, Nidec, OMEC czy SEW i zyskaj pewność, że inwestujesz w urządzenie, kt&oacute;re będzie służyło Tobie lub Twojej firmie przez długi czas.</p>
<h3><strong>Konkurencyjne ceny</strong></h3>
<p>Dbamy zar&oacute;wno o jakość, jak i konkurencyjność cenową oferty. Gwarantujemy atrakcyjne stawki w każdej grupie silnik&oacute;w elektrycznych dostępnych w naszym katalogu.</p>
<h3><strong>Bogaty wyb&oacute;r</strong></h3>
<p>Naszym celem jest dostarczanie produkt&oacute;w spełniających wymagania wszystkich klient&oacute;w, począwszy od os&oacute;b indywidualnych, poprzez gospodarstwa rolne i małe warsztaty, skończywszy na dużych zakładach przemysłowych. Zam&oacute;wisz u nas niewielkie napędy o mocy zaledwie 0,09 kW, jak i największe modele o mocy przekraczającej 200 kW. Cały czas wzbogacamy asortyment o kolejne warianty.</p>
<h3><strong>Dostawa</strong></h3>
<p>Kładziemy nacisk na zapewnienie profesjonalnej obsługi, dlatego przykładamy dużą wagę do szybkości, terminowości, jakości i bezpieczeństwa transportu sprzedawanych napęd&oacute;w. Wsp&oacute;łpracujemy z renomowanymi firmami kurierskimi i dbamy o wydajność działalności, dlatego większość zam&oacute;wień realizujemy w ciągu zaledwie 24 godzin. Niekt&oacute;re z dostępnych w ofercie silnik&oacute;w elektrycznych dostarczamy w ramach darmowej dostawy.</p>`;

export default function HomePageClient() {
  const { trackEvent } = useAnalytics();
  const { token, user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const pendingExit = useRef(false);
  const [categories, setCategories] = useState([]);

  // POPRAWKA 1: useEffect tylko raz przy montowaniu
  useEffect(() => {
    // Pobieranie produktów
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=8&inStock=true`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await res.json();
        setProducts(data.data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    // Pobieranie kategorii
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/categories`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await res.json();
        setCategories(data.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    // Wykonaj tylko raz przy montowaniu komponentu
    Promise.all([fetchProducts(), fetchCategories()]);
  }, []); // PUSTE DEPENDENCY ARRAY - wykonaj tylko raz!

  // POPRAWKA 2: Osobny useEffect dla trackingu
  useEffect(() => {
    // Nie trackuj jeśli admin jest zalogowany
    if (token || user) {
      return;
    }

    // Śledzenie wejścia na stronę główną
    trackEvent("home_page_view", {
      timestamp: new Date().toISOString(),
    });
  }, []); // Wykonaj tylko raz przy montowaniu

  const handleVideoPlay = () => {
    if (token || user) {
      return;
    }

    trackEvent("home_video_play", {
      location: "home_page",
      videoId: "HLCRLTZ4c2A",
      timestamp: new Date().toISOString(),
    });
  };

  const handleDescriptionExpand = (isExpanded: boolean) => {
    if (token || user) {
      return;
    }

    trackEvent("home_description_interaction", {
      location: "home_page",
      action: isExpanded ? "expand" : "collapse",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-10">
      {/* Sekcja Hero z wyszukiwarką */}
      <section className="relative">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>

        <Card className="relative p-8 md:p-12 lg:p-16 bg-background/95 backdrop-blur-sm border-0 shadow-sm">
          <div className="max-w-4xl mx-auto">
            {/* Nagłówek */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Znajdź i&nbsp;zamów silnik elektryczny
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Wyszukaj spośród tysięcy silników elektrycznych dostępnych od
                ręki
              </p>
            </div>

            {/* Wyszukiwarka */}
            <ProductSearch />
          </div>
        </Card>
      </section>

      {/* Kategorie */}
      <div className="container mx-auto px-4">
        <CategoryGrid isHomePage={true} />
      </div>

      {/* Popularne produkty */}
      <div className="container mx-auto px-4">
        <PopularProducts />
      </div>

      {/* Najnowsze produkty */}
      <div className="container mx-auto px-4">
        <LatestProducts isHomePage={true} />
      </div>

      {/* Video Player - opcjonalnie */}
      {/*<div className="container mx-auto px-4 mt-8 mb-12">
        <VideoPlayer
          videoId="HLCRLTZ4c2A"
          title="Stojan Silniki Elektryczne"
          onPlay={handleVideoPlay}
        />
      </div>*/}

      {/* Rozszerzony opis */}
      <div className="container mx-auto px-4 mb-16">
        <ExpandableDescription
          content={SHOP_DESCRIPTION}
          onExpandChange={handleDescriptionExpand}
        />
      </div>
    </div>
  );
}

// backend/src/services/ai.service.ts
import Anthropic from '@anthropic-ai/sdk';
import { IProduct } from '../types/product.types';
import { env } from '../config/env.config';

export class AIService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  async generateProductDescription(
    product: Partial<IProduct>
  ): Promise<string> {
    const prompt = `Napisz profesjonalny opis produktu do sklepu z silnikami elektrycznymi na podstawie poniższych danych:

Nazwa: ${product.name}
Producent: ${product.manufacturer}
Moc: ${product.power?.value} kW
Obroty: ${product.rpm?.value} obr/min
Stan: ${product.condition}
Średnica wału: ${product.shaftDiameter} mm
Wielkość mechaniczna: ${product.mechanicalSize}
${product.weight ? `Waga: ${product.weight} kg` : ''}

Wytyczne:
- Użyj <h2> dla nagłówków sekcji
- Użyj <p> dla akapitów
- Użyj <ul> i <li> dla list
- Użyj <strong> dla wyróżnienia ważnych informacji
- Użyj <em> dla podkreślenia parametrów technicznych
- Dodaj klasy CSS:
  - "product-section" dla sekcji
  - "product-highlight" dla wyróżnionych elementów
  - "technical-specs" dla specyfikacji technicznych
  - "applications" dla sekcji zastosowań
- Opis powinien mieć 3-4 akapity
- Pierwszy akapit powinien być ogólnym wprowadzeniem
- Drugi akapit powinien skupić się na parametrach technicznych
- Trzeci akapit powinien opisywać zastosowania
- Język powinien być profesjonalny ale zrozumiały
- Używaj krótkich zdań
- Unikaj powtórzeń
- Zachowaj obiektywny ton
- Nie wspominaj o cenie ani dostępności
- Nie wspominaj o parametrach, które są nieokreślone
- Staraj się wskazywać na praktyczne zastosowanie silnika i praktyczne implikacje jego poszczególnych parametrów
- Nie stosuj formy "Państwo" - jeśli zwracasz się do czytelnika, rób to bezpośrednio, np. "sprawdź", "zamów", "kup"
- Zachowuj się jak inżynier specjalizujący się w indukcyjnych silnikach elektrycznych. W opisie posługuj się nazwą silnik elektryczny jednofazowy, silnik elektryczny trójfazowy, silnik elektryczny trójfazowy dwubiegowy itd. w zależności od typu, a także jego parametrami technicznymi, czyli np. silnik elektryczny trójfazowy o mocy 3 kW i obrotach 2900 produkcji. Wzoruj się na tym przykładzie:Silnik elektryczny dwubiegowy 6/7,5 kW 1450/2900 obr. 3fazowy to niezawodne rozwiązanie dla osób i firm ceniących precyzję i wydajność. Główną siłą napędową tego urządzenia jest dwubiegowa moc obliczana na 6 lub 7,5 kW, dzięki czemu oferuje wszechstronność w różnych zastosowaniach, od napędu maszyn przemysłowych po urządzenia mechaniczne.Silnik może osiągać 1450 lub 2900 obrotów na minutę, co pozwala na uzyskanie odpowiedniej prędkości i momentu obrotowego dla wielu zastosowań przemysłowych. Jego trójfazowe działanie zapewnia niezawodną i efektywną pracę, minimalizując jednocześnie ryzyko awarii czy przegrzania.Produkt ten skonstruowany jest z myślą o trwałości i jest przeznaczony do długotrwałego, ciężkiego użytku. Ważną cechą jest łatwość montażu i uruchomienia, co czyni go idealnym rozwiązaniem dla przedsiębiorstw pragnących zminimalizować przestoje.Silnik elektryczny dwubiegowy 6/7,5 kW 1450/2900 obr. 3fazowy dzięki swojej konstrukcji i wysokiej mocy idealnie nadaje się do zastosowań, które wymagają solidnej i wytrzymałej jednostki napędowej. Potencjalne obszary zastosowań obejmują szeroką gamę urządzeń przemysłowych, takich jak pompy, wentylatory, przekładnie, maszyny budowlane, maszyny pakujące i wiele innych. Urządzenie jest zbudowane ze stojana, wirnika i innych elementów, które odpowiadają za generowanie energii mechanicznej z energii elektrycznej i w ten sposób napędzaniu rozmaitych maszyn czy pojazdów.Jesteśmy przekonani o jakości naszego silnika, dlatego oferujemy gwarancję rozruchową. Aby zapewnić naszym klientom maksymalne zadowolenie, zapewniamy pełną sprawność i gotowość do pracy tego silnika. Rozważ zakup trójfazowego silnika elektrycznego dwubiegowego 6/7,5 kW 1450/2900 obr., który jest dostępny w naszym sklepie w atrakcyjnej cenie. Możesz więc pisać o parametrach, producencie, budowie, działaniu, zastosowaniu, zaletach, stanie, gwarancji i innych aspektach, które uznasz za stosowane. Chciałbym, aby opis miał 1000-1500 znaków ze spacjami - nie więcej. Zwróć szczególną uwagę na przeznaczenie, które zależy przede wszystkim od mocy urządzenia. Zachowuj się jakfachowiec w danej dziedzinie. ZACHOWAJ ORYGINALNOŚĆ TREŚCI!!! MASZ ZAKAZKOPIOWANIA ZE ŹRÓDEŁ lub jakichkolwiek innych stron, dokumentów i źródeł, z których czerpiesz informacje, nie powtarzaj też samego siebie i tego, co już napisałeś – wprowadzaj wyłącznie nowe informacje. Każdy zdanie i cały tekst MUSZĄ BYĆ oryginalne i niepowtarzalne. Jeżeli czerpiesz ze źródeł, parafrazujkażde słowo, każde zdanie, mieszaj szyki, stosuj różne czasy i odmiany, tak abyw jak największym stopniu zróżnicować Twój tekst od źródeł. pisz w akapitach
- Tekst ma mieć charakter ofertowy i zarazem profesjonalny - opisowy
- Nagłówki mają być polskie, czyli tylko pierwsza litera pierwszego wyrazu wielką literą
- Staraj się pisać w sposób fachowy i wiarygodny, ale bardzo różnorodny językowo. Możesz dokładnie opisać np. budowę i działanie danego urządzenia, o którym piszesz, bazując na jego parametrach technicznych. Odnoś się do zastosowania, producenta czy typu danego silnika. POZA OPISEM NIE PISZ ZUPEŁNIE NICC!!!!!! ŻADNYCH WŁASNYCH DODATKÓW w rodzaju oto moje podsumowanie czy oto mój opis albo mam nadzieję, że mój opis spełni Twoje oczekiwania itd. Jeśli chodzi o ton i formę wypowiedzi, ZA KAŻDYM RAZEM LOSOWO wybieraj jedną z tych opcji:  Forma wypowiedzi:  1) My - jeśli wylosujesz tę formię, piszesz w 1. osobie liczby mnogiej. Wypowiadaj się jako my, nasze, nasi itp.. Pisz w imieniu grupy, do której należysz, ale nie wspominaj o jakiejkolwiek przynależności do jakiejkolwiek grupy. NIGDY nie zaczynaj zdania od My. 2) Państwo - jeśli wylosujesz tę formę wypowiedzi, zwracaj się do czytelników w ten sposób, Jeżeli piszesz bezpośrednio do odbiorcy, pisz Państwo, Państwu, Państwa itp. Stosuj formalne zwroty osobowe. 3) Bezosobowo - jeśli wylosujesz tę formę wypowiedz, pisz w sposób bezosobowy, nie wypowiadając się w niczym imieniu ani nie kierując słów do nikogo.  Styl i ton: 1) Nieformalny, bezpośredni - jeśli wylosujesz ten styl, pisz w sposób bardzo 'luzacki', kreatywny, jak do młodej osoby 2) Reklamowy - jeśli wylosujesz ten styl, posługuj się błyskotliwym językiem reklamy, pełnym języka korzyści, zawołań do zakupu i dynamizu. 3) Formalny, oficjalny - jeśli wylosujesz ten styl wypowiedzi, pisz w sposób poważny. Za każdym razem LOSOWO wybieraj formę oraz i styl ton, czyli np. wybierasz bezosobową formę i reklamowy styl albo formę Państwo i styl formalny, oficjalny. - w Twoim losowaniu uwzględnij każdą możliwością kombinację i wybierz jedną z tych trzech wskazanych form oraz jeden z trzec wskazanych stylów i tonów. Za każdym razem losowo wybieraj również sposob pisania pomiędzy długimi i wielkokrtonie złożonymi zdaniami a krótkimi. Losowo traktuj także kreatywność - wylosuj pomiędzy pisaniem kreatywnie a w tonie bardzo rzeczowym. Stosuj zamiennie słowa 'silnik', 'napęd' i 'produkt', aby uniknąć ciągłego powtarzania słowa 'silnik'. Podkreślaj pełną sprawność oferowanych silników i ich gotowość do pracy.Jeśli chodzi o język, w całym swoim opisie TYLKO MAKSYMALNIE 1 (JEDEN) RAZ możesz napisać słowa: 'dzięki', 'pozwala'. Unikaj także zdań wielokrotnie złożonych, szczególnie ze spójnkiem 'co' - staraj się pisać zdania pojedyncze i pokazywać kunsztowność oraz bogactwo języka. Stosuj pytania retoryczne w swoim opisie, aby utrzymać uwagę użytkownika, w rodzaju 'Co decyduje o jakości tego silnika?, 'Dlaczego warto zdecydować się na ten silnik?', 'Jakie są zalety tego produktu?', 'Co sprawia, że ten napęd jest warty uwagi?' - i tym podobne. W swoim opisie zastosuj DOKŁADNIE 2 (dwa) takie pytania. UWAGA!!! IE1, IE2 i IE3 to NIE PRODUCENCI, a klasy zabezpieczeń silnika.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-latest',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      let description =
        typeof message.content[0] === 'object' && 'text' in message.content[0]
          ? message.content[0].text
          : '';

      // Formatowanie HTML
      description = `
<div class="product-description">
  <div class="product-section">
    ${description
      .split('\n\n')
      .map((paragraph) => {
        if (paragraph.trim().endsWith(':')) {
          return `<h2>${paragraph}</h2>`;
        }
        if (paragraph.includes('\n- ')) {
          const items = paragraph.split('\n- ').filter((item) => item.trim());
          return `<ul>${items.map((item) => `<li>${item.trim()}</li>`).join('')}</ul>`;
        }
        return `<p>${paragraph}</p>`;
      })
      .join('\n')}
  </div>
</div>`;

      return description;
    } catch (error) {
      console.error('Błąd podczas generowania opisu:', error);
      throw error;
    }
  }
}

// frontend/src/app/regulamin-sklepu/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin sklepu - Stojan S.C. | Silniki Elektryczne",
  description:
    "Regulamin sklepu internetowego Stojan S.C. Warunki sprzedaży, prawa i obowiązki kupującego, zasady reklamacji i zwrotów.",
  keywords: [
    "regulamin",
    "warunki sprzedaży",
    "umowa sprzedaży",
    "prawa konsumenta",
  ],
};

export default function RegulaminSklepuPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Regulamin sklepu</h1>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* 1. POSTANOWIENIA OGÓLNE */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <p>
              Sklep Internetowy https://www.silniki-elektryczne.com.pl dba o
              prawa konsumenta. Konsument nie może zrzec się praw przyznanych mu
              w Ustawie o Prawach Konsumenta. Postanowienia umów mniej korzystne
              dla konsumenta niż postanowienia Ustawy o Prawach Konsumenta są
              nieważne, a w ich miejsce stosuje się przepisy Ustawy o Prawach
              Konsumenta. Dlatego też postanowienia niniejszego Regulaminu nie
              mają na celu wyłączać ani ograniczać jakichkolwiek praw
              konsumentów przysługujących im na mocy bezwzględnie wiążących
              przepisów prawa, a wszelkie ewentualne wątpliwości należy
              tłumaczyć na korzyść konsumenta. W przypadku ewentualnej
              niezgodności postanowień niniejszego Regulaminu z powyższymi
              przepisami, pierwszeństwo mają te przepisy i należy je stosować.
            </p>

            <strong>1. POSTANOWIENIA OGÓLNE</strong>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p></p>
              <p>
                <strong>1.1.</strong> Sklep Internetowy dostępny pod adresem
                internetowym https://www.silniki-elektryczne.com.pl prowadzony
                jest przez Włodzimierza Leszczyńskiego i Adama Króla
                prowadzących działalność gospodarczą pod firmą Stojan S.C. A.
                Król W. Leszczyński wpisaną do Centralnej Ewidencji i Informacji
                o Działalności Gospodarczej Rzeczypospolitej Polskiej
                prowadzonej przez ministra właściwego do spraw gospodarki,
                posiadającą: adres miejsca wykonywania działalności i adres do
                doręczeń: 87-152 Pigża, ul. Wojewódzka 2, NIP 8790003705, REGON
                870039184, adres poczty elektronicznej:
                stojan@silniki-elektryczne.com.pl, numer telefonu kontaktowego:
                500385112.
              </p>
              <p>
                <strong>1.2.</strong> Niniejszy Regulamin skierowany jest
                zarówno do konsumentów, jak i do przedsiębiorców korzystających
                ze Sklepu Internetowego, chyba że dane postanowienie Regulaminu
                stanowi inaczej.
              </p>
              <p>
                <strong>1.3.</strong> Administratorem danych osobowych
                przetwarzanych w Sklepie Internetowym w związku z realizacją
                postanowień niniejszego Regulaminu jest Sprzedawca. Dane osobowe
                przetwarzane są w celach, przez okres i w oparciu o podstawy i
                zasady wskazane w polityce prywatności opublikowanej na stronie
                Sklepu Internetowego. Polityka prywatności zawiera przede
                wszystkim zasady dotyczące przetwarzania danych osobowych przez
                Administratora w Sklepie Internetowym, w tym podstawy, cele i
                okres przetwarzania danych osobowych oraz prawa osób, których
                dane dotyczą, a także informacje w zakresie stosowania w Sklepie
                Internetowym plików cookies oraz narzędzi analitycznych.
                Korzystanie ze Sklepu Internetowego, w tym dokonywanie zakupów
                jest dobrowolne. Podobnie związane z tym podanie danych
                osobowych przez korzystającego ze Sklepu Internetowego
                Usługobiorcę lub Klienta jest dobrowolne, z zastrzeżeniem
                wyjątków wskazanych w polityce prywatności (zawarcie umowy oraz
                obowiązki ustawowe Sprzedawcy).
              </p>
              <p>
                <strong>1.4. Definicje:</strong>
              </p>
              <p>
                <strong>1.4.1.</strong> DZIEŃ ROBOCZY – jeden dzień od
                poniedziałku do piątku z wyłączeniem dni ustawowo wolnych od
                pracy.
              </p>
              <p>
                <strong>1.4.2.</strong> FORMULARZ REJESTRACJI – formularz
                dostępny w Sklepie Internetowym umożliwiający utworzenie Konta.
              </p>
              <p>
                <strong>1.4.3.</strong> FORMULARZ ZAMÓWIENIA – Usługa
                Elektroniczna, interaktywny formularz dostępny w Sklepie
                Internetowym umożliwiający złożenie Zamówienia, w szczególności
                poprzez dodanie Produktów do elektronicznego koszyka oraz
                określenie warunków Umowy Sprzedaży, w tym sposobu dostawy i
                płatności.
              </p>

              <p>
                <strong>1.4.4.</strong> KLIENT: (1) osoba fizyczna posiadająca
                pełną zdolność do czynności prawnych, a w wypadkach
                przewidzianych przez przepisy powszechnie obowiązujące także
                osoba fizyczna posiadająca ograniczoną zdolność do czynności
                prawnych; (2) osoba prawna; albo (3) jednostka organizacyjna
                nieposiadająca osobowości prawnej, której ustawa przyznaje
                zdolność prawną; – która zawarła lub zamierza zawrzeć Umowę
                Sprzedaży ze Sprzedawcą.
              </p>

              <p>
                <strong>1.4.5.</strong> KODEKS CYWILNY – ustawa kodeks cywilny z
                dnia 23 kwietnia 1964 r. (Dz.U. 1964 nr 16, poz. 93 ze zm.).
              </p>
              <p>
                <strong>1.4.6.</strong> KONTO – Usługa Elektroniczna, oznaczony
                indywidualną nazwą (loginem) i hasłem podanym przez Usługobiorcę
                zbiór zasobów w systemie teleinformatycznym Usługodawcy, w
                którym gromadzone są dane podane przez Usługobiorcę oraz
                informacje o złożonych przez niego Zamówieniach w Sklepie
                Internetowym.
              </p>
              <p>
                <strong>1.4.7.</strong> NEWSLETTER – Usługa Elektroniczna,
                elektroniczna usługa dystrybucyjna świadczona przez Usługodawcę
                za pośrednictwem poczty elektronicznej e-mail, która umożliwia
                wszystkim korzystającym z niej Usługobiorcom automatyczne
                otrzymywanie od Usługodawcy cyklicznych treści kolejnych edycji
                newslettera zawierającego informacje o Produktach, nowościach i
                promocjach w Sklepie Internetowym.
              </p>
              <p>
                <strong>1.4.8.</strong> PRODUKT – dostępna w Sklepie
                Internetowym rzecz ruchoma będąca przedmiotem Umowy Sprzedaży
                między Klientem a Sprzedawcą.
              </p>
              <p>
                <strong>1.4.9.</strong> REGULAMIN – niniejszy regulamin Sklepu
                Internetowego.
              </p>
              <p>
                <strong>1.4.10.</strong> SKLEP INTERNETOWY – sklep internetowy
                Usługodawcy dostępny pod adresem internetowym:
                www.silniki-elektryczne.com.pl.
              </p>
              <p>
                <strong>1.4.11.</strong> SPRZEDAWCA; USŁUGODAWCA – Włodzimierz
                Leszczyński i Adam Król prowadzący działalność gospodarczą pod
                firmą Stojan S.C. A. Król W. Leszczyński, ul. Wojewódzka 2, NIP
                8790003705, REGON 870039184.
              </p>
              <p>
                <strong>1.4.12.</strong> UMOWA SPRZEDAŻY – umowa sprzedaży
                Produktu zawierana albo zawarta między Klientem a Sprzedawcą za
                pośrednictwem Sklepu Internetowego.
              </p>
              <p>
                <strong>1.4.13.</strong> USŁUGA ELEKTRONICZNA – usługa
                świadczona drogą elektroniczną przez Usługodawcę na rzecz
                Usługobiorcy za pośrednictwem Sklepu Internetowego.
              </p>
              <p>
                <strong>1.4.14.</strong> USŁUGOBIORCA – (1) osoba fizyczna
                posiadająca pełną zdolność do czynności prawnych, a w wypadkach
                przewidzianych przez przepisy powszechnie obowiązujące także
                osoba fizyczna posiadająca ograniczoną zdolność do czynności
                prawnych; (2) osoba prawna; albo (3) jednostka organizacyjna
                nieposiadająca osobowości prawnej, której ustawa przyznaje
                zdolność prawną; – korzystająca lub zamierzająca korzystać z
                Usługi Elektronicznej.
              </p>
              <p>
                <strong>1.4.15.</strong> USTAWA O PRAWACH KONSUMENTA, USTAWA –
                ustawa z dnia 30 maja 2014 r. o prawach konsumenta (Dz.U. 2014
                poz. 827 ze zm.)
              </p>
              <p>
                <strong>1.4.16.</strong> ZAMÓWIENIE – oświadczenie woli Klienta
                składane za pomocą Formularza Zamówienia i zmierzające
                bezpośrednio do zawarcia Umowy Sprzedaży Produktu ze Sprzedawcą.
              </p>
            </div>
          </div>

          {/* 2. USŁUGI ELEKTRONICZNE */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              2. USŁUGI ELEKTRONICZNE W SKLEPIE INTERNETOWYM
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>2.1.</strong> W Sklepie Internetowym dostępne są
                następujące Usługi Elektroniczne: Konto, Formularz Zamówienia
                oraz Newsletter.
              </p>
              <p>
                <strong>2.1.1.</strong> Konto – korzystanie z Konta możliwe jest
                po wykonaniu łącznie dwóch kolejnych kroków przez Usługobiorcę
                (1) wypełnieniu Formularza Rejestracji, (2) kliknięciu pola
                „Zapisz”. W Formularzu Rejestracji niezbędne jest podanie przez
                Usługobiorcę następujących danych Usługobiorcy: imię i nazwisko,
                adres poczty elektronicznej oraz hasło.
              </p>
              <p>
                <strong>2.1.1.1.</strong> Usługa Elektroniczna Konto świadczona
                jest nieodpłatnie przez czas nieoznaczony. Usługobiorca ma
                możliwość, w każdej chwili i bez podania przyczyny, usunięcia
                Konta (rezygnacji z Konta) poprzez wysłanie stosownego żądania
                do Usługodawcy, w szczególności za pośrednictwem poczty
                elektronicznej na adres: stojan@silniki-elektryczne.com.pl lub
                też pisemnie na adres: 87-152 Pigża, ul. Wojewódzka 2
              </p>
              <p>
                <strong>2.1.2.</strong> Formularz Zamówienia – korzystanie z
                Formularza Zamówienia rozpoczyna się z momentem dodania przez
                Klienta pierwszego Produktu do elektronicznego koszyka w Sklepie
                Internetowym. Złożenie Zamówienia następuje po wykonaniu przez
                Klienta łącznie dwóch kolejnych kroków – (1) po wypełnieniu
                Formularza Zamówienia i (2) kliknięciu na stronie Sklepu
                Internetowego po wypełnieniu Formularza Zamówienia pola
                „Zamówienie z obowiązkiem zapłaty” – do tego momentu istnieje
                możliwość samodzielnej modyfikacji wprowadzanych danych (w tym
                celu należy kierować się wyświetlanymi komunikatami oraz
                informacjami dostępnymi na stronie Sklepu Internetowego). W
                Formularzu Zamówienia niezbędne jest podanie przez Klienta
                następujących danych dotyczących Klienta: imię i nazwisko/nazwa
                firmy, adres (ulica, numer domu/mieszkania, kod pocztowy,
                miejscowość, kraj), adres poczty elektronicznej, numer telefonu
                kontaktowego oraz danych dotyczących Umowy Sprzedaży: Produkt/y,
                ilość Produktu/ów, miejsce i sposób dostawy Produktu/ów, sposób
                płatności. W wypadku Klientów niebędących konsumentami niezbędne
                jest także podanie nazwy firmy oraz numeru NIP.
              </p>
              <p>
                <strong>2.1.2.1.</strong> Usługa Elektroniczna Formularz
                Zamówienia świadczona jest nieodpłatnie oraz ma charakter
                jednorazowy i ulega zakończeniu z chwilą złożenia Zamówienia za
                jego pośrednictwem albo z chwilą wcześniejszego zaprzestania
                składania Zamówienia za jego pośrednictwem przez Usługobiorcę.
              </p>
              <p>
                <strong>2.1.3.</strong> Newsletter – korzystanie z Newslettera
                następuje po podaniu w zakładce „Newsletter” widocznej na
                stronie Sklepu Internetowego adresu poczty elektronicznej, na
                który mają być przesyłane kolejne edycje Newslettera i
                kliknięciu pola akcji Subskrybuj, Zapisz, Potwierdź. Na
                Newsletter można się również zapisać poprzez zaznaczenie
                odpowiedniego checkboxa w trakcie zakładania Konta – z chwilą
                utworzenia Konta Usługobiorca zostaje zapisany na Newsletter. Na
                Newsletter można zapisać się również poprzez formularz Pop-Up ze
                zgodą na Newsletter, lub podczas składania zamówienia,
                oznaczając odpowiedni checkbox w formularzu zamówienia.
              </p>
              <p>
                <strong>2.1.3.1.</strong> Usługa Elektroniczna Newsletter
                świadczona jest nieodpłatnie przez czas nieoznaczony.
                Usługobiorca ma możliwość, w każdej chwili i bez podania
                przyczyny, wypisania się z Newslettera (rezygnacji z
                Newslettera) poprzez wysłanie stosownego żądania do Usługodawcy,
                w szczególności za pośrednictwem poczty elektronicznej na adres:
                stojan@silniki-elektryczne.com.pl lub 87-152 Pigża, ul.
                Wojewódzka 2.
              </p>
              <p>
                <strong>2.2.</strong> Wymagania techniczne niezbędne do
                współpracy z systemem teleinformatycznym, którym posługuje się
                Usługodawca: (1) komputer, laptop lub inne urządzenie
                multimedialne z dostępem do Internetu; (2)dostęp do poczty
                elektronicznej; (3) przeglądarka internetowa w aktualnej wersji:
                Mozilla Firefox, Internet Explorer, Opera, Google Chrome,
                Safari, Microsoft Edge; (4)zalecana minimalna rozdzielczość
                ekranu: 1024×768; (5) włączenie w przeglądarce internetowej
                możliwości zapisu plików Cookies oraz obsługi Javascript.
              </p>
              <p>
                <strong>2.3.</strong> Usługobiorca obowiązany jest do
                korzystania ze Sklepu Internetowego w sposób zgodny z prawem i
                dobrymi obyczajami mając na uwadze poszanowanie dóbr osobistych
                oraz praw autorskich i własności intelektualnej Usługodawcy oraz
                osób trzecich. Usługobiorca obowiązany jest do wprowadzania
                danych zgodnych ze stanem faktycznym. Usługobiorcę obowiązuje
                zakaz dostarczania treści o charakterze bezprawnym.
              </p>
              <p>
                <strong>2.4.</strong> Tryb postępowania reklamacyjnego:
                <p>
                  2.4.1. Reklamacje związane ze świadczeniem Usług
                  Elektronicznych przez Usługodawcę oraz pozostałe reklamacje
                  związanie z działaniem Sklepu Internetowego (z wyłączeniem
                  procedury reklamacji Produktu, która została wskazana w pkt. 6
                  i 7 Regulaminu) Usługobiorca może składać na przykład:
                </p>
                <p>2.4.2. pisemnie na adres: 87-152 Pigża, ul. Wojewódzka 2 </p>
                <p>
                  2.4.3. w formie elektronicznej za pośrednictwem poczty
                  elektronicznej na adres: stojan@silniki-elektryczne.com.pl;
                </p>
                <p>
                  {" "}
                  2.4.4. Zaleca się podanie przez Usługobiorcę w opisie
                  reklamacji: (1) informacji i okoliczności dotyczących
                  przedmiotu reklamacji, w szczególności rodzaju i daty
                  wystąpienia nieprawidłowości; (2)żądania Usługobiorcy; oraz
                  (3)danych kontaktowych składającego reklamację – ułatwi to i
                  przyspieszy rozpatrzenie reklamacji przez Usługodawcę. Wymogi
                  podane w zdaniu poprzednim mają formę jedynie zalecenia i nie
                  wpływają na skuteczność reklamacji złożonych z pominięciem
                  zalecanego opisu reklamacji.
                </p>
                <p>
                  {" "}
                  2.4.5. Ustosunkowanie się do reklamacji przez Usługodawcę
                  następuje niezwłocznie, nie później niż w terminie 14 dni
                  kalendarzowych od dnia jej złożenia.
                </p>
              </p>
            </div>
          </div>

          {/* 3. WARUNKI ZAWIERANIA UMOWY */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              3. WARUNKI ZAWIERANIA UMOWY SPRZEDAŻY
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>3.1.</strong> Zawarcie Umowy Sprzedaży między Klientem,
                a Sprzedawcą następuje po uprzednim złożeniu przez Klienta
                Zamówienia za pomocą Formularza Zamówień w Sklepie Internetowym
                zgodnie z pkt. 2.1.2 Regulaminu.
              </p>
              <p>
                <strong>3.2.</strong> Cena Produktu uwidoczniona na stronie
                Sklepu Internetowego podana jest w złotych polskich i zawiera
                podatki. O łącznej cenie wraz z podatkami Produktu będącego
                przedmiotem Zamówienia, a także o kosztach dostawy (w tym
                opłatach za transport, dostarczenie i usługi pocztowe) oraz o
                innych kosztach, a gdy nie można ustalić wysokości tych opłat –
                o obowiązku ich uiszczenia, Klient jest informowany na stronach
                Sklepu Internetowego w trakcie składania Zamówienia, w tym także
                w chwili wyrażenia przez Klienta woli związania się Umową
                Sprzedaży.
              </p>
              <p>
                <strong>3.3.</strong> Procedura zawarcia Umowy Sprzedaży w
                Sklepie Internetowym za pomocą Formularza Zamówień
              </p>
              <p>
                3.3.1. Zawarcie Umowy Sprzedaży między Klientem, a Sprzedawcą
                następuje po uprzednim złożeniu przez Klienta Zamówienia w
                Sklepie Internetowym zgodnie z pkt. 2.1.2 Regulaminu.
              </p>
              <p>
                3.3.2. Po złożeniu Zamówienia Sprzedawca niezwłocznie potwierdza
                jego otrzymanie oraz jednocześnie przyjmuje Zamówienie do
                realizacji. Potwierdzenie otrzymania Zamówienia i jego przyjęcie
                do realizacji następuje poprzez przesłanie przez Sprzedawcę
                Klientowi stosownej wiadomości e-mail na podany w trakcie
                składania Zamówienia adres poczty elektronicznej Klienta, która
                zawiera co najmniej oświadczenia Sprzedawcy o otrzymaniu
                Zamówienia i o jego przyjęciu do realizacji oraz potwierdzenie
                zawarcia Umowy Sprzedaży. Z chwilą otrzymania przez Klienta
                powyższej wiadomości e-mail zostaje zawarta Umowa Sprzedaży
                między Klientem, a Sprzedawcą.
              </p>
              <p>
                <strong>3.4.</strong> Utrwalenie, zabezpieczenie oraz
                udostępnienie Klientowi treści zawieranej Umowy Sprzedaży
                następuje poprzez (1) udostępnienie niniejszego Regulaminu na
                stronie Sklepu Internetowego oraz (2) przesłanie Klientowi
                wiadomości e-mail, o której mowa w pkt. 3.3.2. Regulaminu. Treść
                Umowy Sprzedaży jest dodatkowo utrwalona i zabezpieczona w
                systemie informatycznym Sklepu Internetowego Sprzedawcy.
              </p>
            </div>
          </div>

          {/* 4. SPOSOBY I TERMINY PŁATNOŚCI */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              4. SPOSOBY I TERMINY PŁATNOŚCI ZA PRODUKT
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>4.1.</strong> Sprzedawca udostępnia Klientowi
                następujące sposoby płatności z tytułu Umowy Sprzedaży:
              </p>
              <p>
                <strong>4.1.1.</strong> Płatność za pobraniem przy odbiorze
                przesyłki.
              </p>
              <p>
                <strong>4.1.2.</strong> Płatność gotówką przy odbiorze
                osobistym.
              </p>
              <p>
                <strong>4.1.3.</strong> Płatność przelewem na rachunek bankowy
                Sprzedawcy.
              </p>
              <p>
                <strong>4.1.4.</strong> Bank: Santander Consumer Bank. Numer
                rachunku: 19 1090 1506 0000 0000 5002 0796.
              </p>
              <p>
                <strong>4.1.5.</strong> Płatności elektroniczne i płatności
                kartą płatniczą za pośrednictwem Przelewy24 PayPro S.A. –
                możliwe aktualne sposoby płatności określone są na stronie
                Sklepu Internetowego w zakładce „Sposoby płatności” oraz na
                stronie internetowej https://www.przelewy24.pl/metody-platnosci.
                Rozliczenia transakcji płatnościami elektronicznymi i kartą
                płatniczą przeprowadzane są zgodnie z wyborem Klienta za
                pośrednictwem Przelewy24 PayPro S.A. Obsługę płatności
                elektronicznych i kartą płatniczą prowadzi: PayPro Spółka
                Akcyjna z siedzibą w Poznaniu, przy ul. Kanclerskiej 15, kod
                pocztowy: 60-327, wpisana do Krajowego Rejestru Sądowego
                prowadzonego przez Sąd Rejonowy Poznań Nowe Miasto i Wilda w
                Poznaniu, VIII Wydział Gospodarczy Krajowego Rejestru Sadowego
                pod numerem KRS 0000347935, NIP 779-236-98-87, REGON 301345068,
                z kapitałem zakładowym w wysokości 4 500 000,00 PLN.
              </p>
              <p>
                <strong>4.2.</strong> W przypadku wyboru przez Klienta płatności
                gotówką przy odbiorze osobistym, płatności przelewem, płatności
                elektronicznych albo płatności kartą płatniczą, Klient
                obowiązany jest do dokonania płatności w terminie 7 dni
                kalendarzowych od dnia zawarcia Umowy Sprzedaży. W przypadku
                wyboru przez Klienta płatności za pobraniem przy odbiorze
                przesyłki, Klient obowiązany jest do dokonania płatności przy
                odbiorze przesyłki.
              </p>
            </div>
          </div>

          {/* 5. KOSZT, SPOSOBY I TERMIN DOSTAWY */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              5. KOSZT, SPOSOBY I TERMIN DOSTAWY ORAZ ODBIORU PRODUKTU
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>5.1.</strong> Dostawa Produktu do Klienta jest odpłatna,
                chyba że Umowa Sprzedaży stanowi inaczej. Koszty dostawy
                Produktu (w tym opłaty za transport, dostarczenie i usługi
                pocztowe) są wskazywane Klientowi na stronach Sklepu
                Internetowego w zakładce „Warunki wysyłki” oraz w trakcie
                składania Zamówienia, w tym także w chwili wyrażenia przez
                Klienta woli związania się Umową Sprzedaży.
              </p>
              <p>
                <strong>5.2.</strong> Odbiór osobisty Produktu przez Klienta
                jest bezpłatny.
              </p>
              <p>
                <strong>5.3.</strong> Sprzedawca udostępnia Klientowi
                następujące sposoby dostawy lub odbioru Produktu: Przesyłka
                pocztowa, przesyłka pocztowa pobraniowa; Przesyłka kurierska,
                przesyłka kurierska pobraniowa; Przesyłka paletowa; Odbiór
                osobisty dostępny pod adresem: ul. 87-152 Pigża, ul. Wojewódzka
                2 – w Dni Robocze, w godzinach od 08:00 do 16:00.
              </p>
              <p>
                <strong>5.4.</strong> Termin dostawy Produktu do Klienta wynosi
                do 7 Dni Roboczych, chyba że w opisie danego Produktu lub w
                trakcie składania Zamówienia podano krótszy termin. W przypadku
                Produktów o różnych terminach dostawy, terminem dostawy jest
                najdłuższy podany termin, który jednak nie może przekroczyć 7
                Dni Roboczych. Początek biegu terminu dostawy Produktu do
                Klienta liczy się w następujący sposób: W przypadku wyboru przez
                Klienta sposobu płatności przelewem, płatności elektroniczne lub
                kartą płatniczą – od dnia uznania rachunku bankowego lub konta
                rozliczeniowego Sprzedawcy.
              </p>
              <p>
                <strong>5.5.</strong> Termin gotowości Produktu do odbioru przez
                Klienta – w przypadku wyboru przez Klienta odbioru osobistego
                Produktu, Produkt będzie gotowy do odbioru przez Klienta w
                terminie do 5 Dni Roboczych, chyba że w opisie danego Produktu
                lub w trakcie składania Zamówienia podano krótszy termin. W
                przypadku produktów o różnych terminach gotowości do odbioru,
                terminem gotowości do odbioru jest najdłuższy podany termin,
                który jednak nie może przekroczyć 5 Dni Roboczych. O gotowości
                Produktu do odbioru Klient zostanie dodatkowo poinformowany
                przez Sprzedawcę. Początek biegu terminu gotowości Produktu do
                odbioru przez Klienta liczy się w następujący sposób: W
                przypadku wyboru przez Klienta sposobu płatności przelewem,
                płatności elektroniczne lub kartą płatniczą – od dnia uznania
                rachunku bankowego lub konta rozliczeniowego Sprzedawcy.
              </p>
            </div>
          </div>

          {/* 6. REKLAMACJA PRODUKTU */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              6. REKLAMACJA PRODUKTU
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>6.1.</strong>Podstawa i zakres odpowiedzialności
                Sprzedawcy względem Klienta, jeżeli sprzedany Produkt ma wadę
                fizyczną lub prawną (rękojmia) są określone powszechnie
                obowiązującymi przepisami prawa, w szczególności w Kodeksie
                Cywilnym (w tym art. 556-576 Kodeksu Cywilnego).
              </p>
              <p>
                <strong>6.2.</strong> Sprzedawca obowiązany jest dostarczyć
                Klientowi Produkt bez wad. Szczegółowe informacje dotyczące
                odpowiedzialności Sprzedawcy z tytułu wady Produktu oraz
                uprawnień Klienta są określone na stronie Sklepu Internetowego w
                zakładce „Reklamacja towaru”.
              </p>
              <p>
                <strong>6.3.</strong>W przypadku Produktów opisanych jako
                używane bądź niepełnowartościowe, Sprzedawca zobowiązany jest
                dostarczyć Klientowi Produkt zgodny z opisem zawartym na stronie
                Sklepu Internetowego, w tym w szczególności, Produkt wolny od
                wad innych jak ta wskazane w opisie Produktu, o których Klient
                został poinformowany przed dokonaniem zakupu.
              </p>
              <p>
                <strong>6.4.</strong> W przypadku Produktów oznaczonych na
                stronach Sklepu Internetowego jako używane bądź
                niepełnowartościowe, przy których znajduje się opis Produktów
                wraz z opisem wad tych Produktów, Sprzedawca jest zwolniony od
                odpowiedzialności z tytułu rękojmi, jeżeli Klient wiedział o
                wadzie w chwili zawarcia umowy, zgodnie z art. 557 § 1 Kodeksu
                Cywilnego.
              </p>
              <p>
                <strong>6.5.</strong> W przypadku Produktów oznaczonych na
                stronach Sklepu Internetowego jako używane, odpowiedzialność
                Sprzedawcy zostaje ograniczona do okresu 1 roku od dnia wydania
                rzeczy Klientowi, zgodnie z art. 568 § 1 Kodeksu Cywilnego.
              </p>
              <p>
                <strong>6.6.</strong> Reklamacja może zostać złożona przez
                Klienta na przykład: pisemnie na adres: 87-152 Pigża, ul.
                Wojewódzka 2; w formie elektronicznej za pośrednictwem poczty
                elektronicznej na adres: stojan@silniki-elektryczne.com.pl;
              </p>
              <p>
                <strong>6.7.</strong> Zaleca się podanie przez Klienta w opisie
                reklamacji: (1)informacji i okoliczności dotyczących przedmiotu
                reklamacji, w szczególności rodzaju i daty wystąpienia wady; (2)
                żądania sposobu doprowadzenia Produktu do zgodności z Umową
                Sprzedaży lub oświadczenia o obniżeniu ceny albo odstąpieniu od
                Umowy Sprzedaży; oraz (3)danych kontaktowych składającego
                reklamację – ułatwi to i przyspieszy rozpatrzenie reklamacji
                przez Sprzedawcę. Wymogi podane w zdaniu poprzednim mają formę
                jedynie zalecenia i nie wpływają na skuteczność reklamacji
                złożonych z pominięciem zalecanego opisu reklamacji.
              </p>
              <p>
                <strong>6.8.</strong> Sprzedawca ustosunkuje się do reklamacji
                Klienta niezwłocznie, nie później niż w terminie 14 dni
                kalendarzowych od dnia jej złożenia. Jeżeli Klient będący
                konsumentem zażądał wymiany rzeczy lub usunięcia wady albo
                złożył oświadczenie o obniżeniu ceny, określając kwotę, o którą
                cena ma być obniżona, a Sprzedawca nie ustosunkował się do tego
                żądania w terminie 14 dni kalendarzowych, uważa się, że żądanie
                to uznał za uzasadnione.
              </p>
              <p>
                <strong>6.9.</strong> Klient, który wykonuje uprawnienia z
                tytułu rękojmi, jest obowiązany dostarczyć Produkt wadliwy na
                adres 87-152 Pigża, ul. Wojewódzka 2. W przypadku Klienta
                będącego konsumentem koszt dostarczenia Produktu ponosi
                Sprzedawca, w przypadku Klienta niebędącego konsumentem koszt
                dostarczenia ponosi Klient. Jeżeli ze względu na rodzaj Produktu
                lub sposób jego zamontowania dostarczenie Produktu przez Klienta
                byłoby nadmiernie utrudnione, Klient obowiązany jest udostępnić
                Produkt Sprzedawcy w miejscu, w którym Produkt się znajduje.
              </p>
              <p>
                <strong>6.10.</strong> Zgodnie z art. 558 § 1 Kodeksu Cywilnego
                odpowiedzialność Sprzedawcy z tytułu rękojmi za Produkt wobec
                Klienta niebędącego konsumentem zostaje wyłączona.
              </p>
            </div>
          </div>

          {/* 7. POZASĄDOWE SPOSOBY */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              7. POZASĄDOWE SPOSOBY ROZPATRYWANIA REKLAMACJI I DOCHODZENIA
              ROSZCZEŃ
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>7.1.</strong> Szczegółowe informacje dotyczące
                możliwości skorzystania przez Klienta będącego konsumentem z
                pozasądowych sposobów rozpatrywania reklamacji i dochodzenia
                roszczeń oraz zasady dostępu do tych procedur dostępne są na
                stronie internetowej Urzędu Ochrony Konkurencji i Konsumentów
                pod adresem:
                https://uokik.gov.pl/pozasadowe_rozwiazywanie_sporow_konsumenckich.php.
              </p>
              <p>
                <strong>7.2.</strong> Przy Prezesie Urzędu Ochrony Konkurencji i
                Konsumentów działa także punkt kontaktowy (telefon: 22 55 60
                333, email: kontakt.adr@uokik.gov.pl lub adres pisemny: Pl.
                Powstańców Warszawy 1, Warszawa.), którego zadaniem jest między
                innymi udzielanie pomocy konsumentom w sprawach dotyczących
                pozasądowego rozwiązywania sporów konsumenckich.
              </p>
              <p>
                <strong>7.3.</strong> Konsument posiada następujące przykładowe
                możliwości skorzystania z pozasądowych sposobów rozpatrywania
                reklamacji i dochodzenia roszczeń: (1) wniosek o rozstrzygnięcie
                sporu do stałego polubownego sądu konsumenckiego (więcej
                informacji na stronie: http://www.spsk.wiih.org.pl/); (2)
                wniosek w sprawie pozasądowego rozwiązania sporu do
                wojewódzkiego inspektora Inspekcji Handlowej (więcej informacji
                na stronie inspektora właściwego ze względu na miejsce
                wykonywania działalności gospodarczej przez Sprzedawcę); oraz
                (3) pomoc powiatowego (miejskiego) rzecznika konsumentów lub
                organizacji społecznej, do której zadań statutowych należy
                ochrona konsumentów (m.in. Federacja Konsumentów, Stowarzyszenie
                Konsumentów Polskich). Porady udzielane są między innymi mailowo
                pod adresem porady@dlakonsumentow.pl oraz pod numerem infolinii
                konsumenckiej 801 440 220 (infolinia czynna w Dni Robocze, w
                godzinach 8:00 – 18:00, opłata za połączenie wg taryfy
                operatora).
              </p>
              <p>
                <strong>7.4.</strong> Pod adresem
                http://ec.europa.eu/consumers/odr dostępna jest platforma
                internetowego systemu rozstrzygania sporów pomiędzy konsumentami
                i przedsiębiorcami na szczeblu unijnym (platforma ODR).
                Platforma ODR stanowi interaktywną i wielojęzyczną stronę
                internetową z punktem kompleksowej obsługi dla konsumentów i
                przedsiębiorców dążących do pozasądowego rozstrzygnięcia sporu
                dotyczącego zobowiązań umownych wynikających z internetowej
                umowy sprzedaży lub umowy o świadczenie usług (więcej informacji
                na stronie samej platformy lub pod adresem internetowym Urzędu
                Ochrony Konkurencji i Konsumentów:
                https://uokik.gov.pl/spory_konsumenckie_faq_platforma_odr.php).
              </p>
            </div>
          </div>

          {/* 8. PRAWO ODSTĄPIENIA OD UMOWY */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              8. PRAWO ODSTĄPIENIA OD UMOWY
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>8.1.</strong> Konsument, który zawarł umowę na
                odległość, może w terminie 14 dni kalendarzowych odstąpić od
                niej bez podawania przyczyny i bez ponoszenia kosztów, z
                wyjątkiem kosztów określonych w pkt. 9.8 Regulaminu. Do
                zachowania terminu wystarczy wysłanie oświadczenia przed jego
                upływem. Oświadczenie o odstąpieniu od umowy może zostać złożone
                na przykład: pisemnie na adres: ul. 87-152 Pigża, ul. Wojewódzka
                2; w formie elektronicznej za pośrednictwem poczty
                elektronicznej na adres: stojan@silniki-elektryczne.com.pl
              </p>
              <p>
                <strong>8.2.</strong> Przykładowy wzór formularza odstąpienia od
                umowy zawarty jest w załączniku nr 2 do Ustawy o Prawach
                Konsumenta oraz dodatkowo dostępny jest na stronie Sklepu
                Internetowego w zakładce „Odstąpienie od umowy”. Konsument może
                skorzystać z wzoru formularza, jednak nie jest to obowiązkowe.
              </p>
              <p>
                <strong>8.3.</strong> Bieg terminu do odstąpienia od umowy
                rozpoczyna się: dla umowy, w wykonaniu której Sprzedawca wydaje
                Produkt, będąc zobowiązany do przeniesienia jego własności (np.
                Umowa Sprzedaży) – od objęcia Produktu w posiadanie przez
                konsumenta lub wskazaną przez niego osobę trzecią inną niż
                przewoźnik, a w przypadku umowy, która: (1) obejmuje wiele
                Produktów, które są dostarczane osobno, partiami lub w częściach
                – od objęcia w posiadanie ostatniego Produktu, partii lub części
                albo (2) polega na regularnym dostarczaniu Produktów przez czas
                oznaczony – od objęcia w posiadanie pierwszego z Produktów; dla
                pozostałych umów – od dnia zawarcia umowy.
              </p>
              <p>
                <strong>8.4.</strong> W przypadku odstąpienia od umowy zawartej
                na odległość umowę uważa się za niezawartą.
              </p>
              <p>
                <strong>8.5.</strong> Sprzedawca ma obowiązek niezwłocznie, nie
                później niż w terminie 14 dni kalendarzowych od dnia otrzymania
                oświadczenia konsumenta o odstąpieniu od umowy, zwrócić
                konsumentowi wszystkie dokonane przez niego płatności, w tym
                koszty dostawy Produktu (z wyjątkiem dodatkowych kosztów
                wynikających z wybranego przez Klienta sposobu dostawy innego
                niż najtańszy zwykły sposób dostawy dostępny w Sklepie
                Internetowym). Sprzedawca dokonuje zwrotu płatności przy użyciu
                takiego samego sposobu płatności, jakiego użył konsument, chyba
                że konsument wyraźnie zgodził się na inny sposób zwrotu, który
                nie wiąże się dla niego z żadnymi kosztami. Jeżeli Sprzedawca
                nie zaproponował, że sam odbierze Produkt od konsumenta, może
                wstrzymać się ze zwrotem płatności otrzymanych od konsumenta do
                chwili otrzymania Produktu z powrotem lub dostarczenia przez
                konsumenta dowodu jego odesłania, w zależności od tego, które
                zdarzenie nastąpi wcześniej.
              </p>
              <p>
                <strong>8.6.</strong> Konsument ma obowiązek niezwłocznie, nie
                później niż w terminie 14 dni kalendarzowych od dnia, w którym
                odstąpił od umowy, zwrócić Produkt Sprzedawcy lub przekazać go
                osobie upoważnionej przez Sprzedawcę do odbioru, chyba że
                Sprzedawca zaproponował, że sam odbierze Produkt. Do zachowania
                terminu wystarczy odesłanie Produktu przed jego upływem.
                Konsument może zwrócić Produkt na adres: 87-152 Pigża, ul.
                Wojewódzka 2.
              </p>
              <p>
                <strong>8.7.</strong> Konsument ponosi odpowiedzialność za
                zmniejszenie wartości Produktu będące wynikiem korzystania z
                niego w sposób wykraczający poza konieczny do stwierdzenia
                charakteru, cech i funkcjonowania Produktu.
              </p>
              <p>
                <strong>8.8.</strong> Możliwe koszty związane z odstąpieniem
                przez konsumenta od umowy, które obowiązany jest ponieść
                konsument: Jeżeli konsument wybrał sposób dostawy Produktu inny
                niż najtańszy zwykły sposób dostawy dostępny w Sklepie
                Internetowym, Sprzedawca nie jest zobowiązany do zwrotu
                konsumentowi poniesionych przez niego dodatkowych kosztów.
                Konsument ponosi bezpośrednie koszty zwrotu Produktu. W
                przypadku Produktu będącego usługą, której wykonywanie – na
                wyraźne żądanie konsumenta – rozpoczęło się przed upływem
                terminu do odstąpienia od umowy, konsument, który wykonuje prawo
                odstąpienia od umowy po zgłoszeniu takiego żądania, ma obowiązek
                zapłaty za świadczenia spełnione do chwili odstąpienia od umowy.
                Kwotę zapłaty oblicza się proporcjonalnie do zakresu spełnionego
                świadczenia, z uwzględnieniem uzgodnionej w umowie ceny lub
                wynagrodzenia. Jeżeli cena lub wynagrodzenie są nadmierne,
                podstawą obliczenia tej kwoty jest wartość rynkowa spełnionego
                świadczenia.
              </p>
              <p>
                <strong>8.9.</strong> Prawo odstąpienia od umowy zawartej na
                odległość nie przysługuje konsumentowi w odniesieniu do umów:
                (1) o świadczenie usług, jeżeli Sprzedawca wykonał w pełni
                usługę za wyraźną zgodą konsumenta, który został poinformowany
                przed rozpoczęciem świadczenia, że po spełnieniu świadczenia
                przez Sprzedawcę utraci prawo odstąpienia od umowy; (2)w której
                cena lub wynagrodzenie zależy od wahań na rynku finansowym, nad
                którymi Sprzedawca nie sprawuje kontroli, i które mogą wystąpić
                przed upływem terminu do odstąpienia od umowy; (3) w której
                przedmiotem świadczenia jest Produkt nieprefabrykowany,
                wyprodukowany według specyfikacji konsumenta lub służący
                zaspokojeniu jego zindywidualizowanych potrzeb; (4) w której
                przedmiotem świadczenia jest Produkt ulegający szybkiemu
                zepsuciu lub mająca krótki termin przydatności do użycia; (5) w
                której przedmiotem świadczenia jest Produkt dostarczany w
                zapieczętowanym opakowaniu, którego po otwarciu opakowania nie
                można zwrócić ze względu na ochronę zdrowia lub ze względów
                higienicznych, jeżeli opakowanie zostało otwarte po
                dostarczeniu; (6)w której przedmiotem świadczenia są Produkty,
                które po dostarczeniu, ze względu na swój charakter, zostają
                nierozłącznie połączone z innymi rzeczami; (7) w której
                przedmiotem świadczenia są napoje alkoholowe, których cena
                została uzgodniona przy zawarciu Umowy Sprzedaży, a których
                dostarczenie może nastąpić dopiero po upływie 30 dni i których
                wartość zależy od wahań na rynku, nad którymi Sprzedawca nie ma
                kontroli; (8) w której konsument wyraźnie żądał, aby Sprzedawca
                do niego przyjechał w celu dokonania pilnej naprawy lub
                konserwacji; jeżeli Sprzedawca świadczy dodatkowo inne usługi
                niż te, których wykonania konsument żądał, lub dostarcza
                Produkty inne niż części zamienne niezbędne do wykonania naprawy
                lub konserwacji, prawo odstąpienia od umowy przysługuje
                konsumentowi w odniesieniu do dodatkowych usług lub Produktów;
                (9)w której przedmiotem świadczenia są nagrania dźwiękowe lub
                wizualne albo programy komputerowe dostarczane w zapieczętowanym
                opakowaniu, jeżeli opakowanie zostało otwarte po dostarczeniu;
                (10) o dostarczanie dzienników, periodyków lub czasopism, z
                wyjątkiem umowy o prenumeratę; (11) zawartej w drodze aukcji
                publicznej; (12) o świadczenie usług w zakresie zakwaterowania,
                innych niż do celów mieszkalnych, przewozu rzeczy, najmu
                samochodów, gastronomii, usług związanych z wypoczynkiem,
                wydarzeniami rozrywkowymi, sportowymi lub kulturalnymi, jeżeli w
                umowie oznaczono dzień lub okres świadczenia usługi; (13) o
                dostarczanie treści cyfrowych, które nie są zapisane na nośniku
                materialnym, jeżeli spełnianie świadczenia rozpoczęło się za
                wyraźną zgodą konsumenta przed upływem terminu do odstąpienia od
                umowy i po poinformowaniu go przez Sprzedawcę o utracie prawa
                odstąpienia od umowy.
              </p>
              <p>
                <strong>8.10.</strong> Zawarte w niniejszym punkcie 8.
                Regulaminu postanowienia dotyczące konsumenta stosuje się od
                dnia 1 stycznia 2021 r. i dla umów zawartych od tego dnia
                również do Usługobiorcy lub Klienta będącego osobą fizyczną
                zawierającą umowę bezpośrednio związaną z jej działalnością
                gospodarczą, gdy z treści tej umowy wynika, że nie posiada ona
                dla tej osoby charakteru zawodowego, wynikającego w
                szczególności z przedmiotu wykonywanej przez nią działalności
                gospodarczej, udostępnionego na podstawie przepisów o Centralnej
                Ewidencji i Informacji o Działalności Gospodarczej.
              </p>
            </div>
          </div>

          {/* 9. POSTANOWIENIA DOTYCZĄCE PRZEDSIĘBIORCÓW */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              9. POSTANOWIENIA DOTYCZĄCE PRZEDSIĘBIORCÓW
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>9.1.</strong> Niniejszy punkt 9. Regulaminu oraz
                wszystkie postanowienia w nim zawarte są skierowane i tym samym
                wiążą wyłącznie Klienta lub Usługobiorcę niebędącego
                konsumentem, a od dnia 1 stycznia 2021 r. i dla umów zawartych
                od tego dnia niebędącego także osobą fizyczną zawierającą umowę
                bezpośrednio związaną z jej działalnością gospodarczą, gdy z
                treści tej umowy wynika, że nie posiada ona dla tej osoby
                charakteru zawodowego, wynikającego w szczególności z przedmiotu
                wykonywanej przez nią działalności gospodarczej, udostępnionego
                na podstawie przepisów o Centralnej Ewidencji i Informacji o
                Działalności Gospodarczej.
              </p>
              <p>
                <strong>9.2.</strong> Sprzedawcy przysługuje prawo odstąpienia
                od Umowy Sprzedaży w terminie 14 dni kalendarzowych od dnia jej
                zawarcia. Odstąpienie od Umowy Sprzedaży w tym wypadku może
                nastąpić bez podania przyczyny i nie rodzi po stronie Klienta
                żadnych roszczeń w stosunku do Sprzedawcy.
              </p>
              <p>
                <strong>9.3.</strong> Sprzedawca ma prawo ograniczyć dostępne
                sposoby płatności, w tym także wymagać dokonania przedpłaty w
                całości albo części i to niezależnie od wybranego przez Klienta
                sposobu płatności oraz faktu zawarcia Umowy Sprzedaży.
              </p>
              <p>
                <strong>9.4.</strong> Usługodawca może wypowiedzieć umowę o
                świadczenie Usługi Elektronicznej ze skutkiem natychmiastowym i
                bez wskazywania przyczyn poprzez przesłanie Usługobiorcy
                stosownego oświadczenia.
              </p>
              <p>
                <strong>9.5.</strong> Odpowiedzialność Usługodawcy/Sprzedawcy w
                stosunku do Usługobiorcy/Klienta, bez względu na jej podstawę
                prawną, jest ograniczona – zarówno w ramach pojedynczego
                roszczenia, jak również za wszelkie roszczenia w sumie – do
                wysokości zapłaconej ceny oraz kosztów dostawy z tytułu Umowy
                Sprzedaży, nie więcej jednak niż do kwoty jednego tysiąca
                złotych. Ograniczenie kwotowe, o którym mowa w zdaniu
                poprzednim, ma zastosowanie do wszelkich roszczeń kierowanych
                przez Usługobiorcę/Klienta w stosunku do Usługodawcy/Sprzedawcy,
                w tym także w przypadku braku zawarcia Umowy Sprzedaży lub
                niezwiązanych z Umową Sprzedaży. Usługodawca/Sprzedawca ponosi
                odpowiedzialność w stosunku do Usługobiorcy/Klienta tylko za
                typowe szkody przewidywalne w momencie zawarcia umowy i nie
                ponosi odpowiedzialności z tytułu utraconych korzyści.
                Sprzedawca nie ponosi także odpowiedzialności za opóźnienie w
                przewozie przesyłki.
              </p>
              <p>
                <strong>9.6.</strong> Wszelkie spory powstałe pomiędzy
                Sprzedawcą/Usługodawcą a Klientem/Usługobiorcą zostają poddane
                sądowi właściwemu ze względu na siedzibę Sprzedawcy/Usługodawcy.
              </p>
            </div>
          </div>

          {/* 10. POSTANOWIENIA KOŃCOWE */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            <h2 className="text-2xl font-semibold mb-6">
              10. POSTANOWIENIA KOŃCOWE
            </h2>
            <div className="prose prose-gray max-w-none space-y-4 text-muted-foreground">
              <p>
                <strong>10.1.</strong> Umowy zawierane poprzez Sklep Internetowy
                zawierane są w języku polskim.
              </p>
              <p>
                <strong>10.2.</strong> Zmiana Regulaminu: Usługodawca zastrzega
                sobie prawo do dokonywania zmian Regulaminu z ważnych przyczyn
                to jest: zmiany przepisów prawa; zmiany sposobów płatności i
                dostaw – w zakresie, w jakim te zmiany wpływają na realizację
                postanowień niniejszego Regulaminu. W przypadku zawarcia na
                podstawie niniejszego Regulaminu umów o charakterze ciągłym (np.
                świadczenie Usługi Elektronicznej – Konto) zmieniony regulamin
                wiąże Usługobiorcę, jeżeli zostały zachowane wymagania określone
                w art. 384 oraz 384[1] Kodeksu cywilnego, to jest Usługobiorca
                został prawidłowo powiadomiony o zmianach i nie wypowiedział
                umowy w terminie 14 dni kalendarzowych od dnia powiadomienia. W
                wypadku gdyby zmiana Regulaminu skutkowała wprowadzeniem
                jakichkolwiek nowych opłat lub podwyższeniem obecnych
                Usługobiorca będący konsumentem ma prawo odstąpienia od umowy. W
                przypadku zawarcia na podstawie niniejszego Regulaminu umów o
                innym charakterze niż umowy ciągłe (np. Umowa Sprzedaży) zmiany
                Regulaminu nie będą w żaden sposób naruszać praw nabytych
                Usługobiorców/Klientów będących konsumentami przed dniem wejścia
                w życie zmian Regulaminu, w szczególności zmiany Regulaminu nie
                będą miały wpływu na już składane lub złożone Zamówienia oraz
                zawarte, realizowane lub wykonane Umowy Sprzedaży.
              </p>
              <p>
                <strong>10.3.</strong> W sprawach nieuregulowanych w niniejszym
                Regulaminie mają zastosowanie powszechnie obowiązujące przepisy
                prawa polskiego, w szczególności: Kodeksu cywilnego; ustawy o
                świadczeniu usług drogą elektroniczną z dnia 18 lipca 2002 r.
                (Dz.U. 2002 nr 144, poz. 1204 ze zm.); dla Umów Sprzedaży
                zawartych do 24 grudnia 2014 roku z Klientami będącymi
                konsumentami – przepisy ustawy o ochronie niektórych praw
                konsumentów oraz o odpowiedzialności za szkodę wyrządzoną przez
                produkt niebezpieczny z dnia 2 marca 2000 r. (Dz.U. 2000 nr 22,
                poz. 271 ze zm.) oraz ustawy o szczególnych warunkach sprzedaży
                konsumenckiej oraz o zmianie Kodeksu cywilnego z dnia 27 lipca
                2002 r. (Dz.U. 2002 nr 141, poz. 1176 ze zm.); dla Umów
                Sprzedaży zawartych od 25 grudnia 2014 roku z Klientami będącymi
                konsumentami – przepisy ustawy o prawach konsumenta z dnia 30
                maja 2014 r. (Dz.U. 2014 r. poz. 827 ze zm.); oraz inne właściwe
                przepisy powszechnie obowiązującego prawa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

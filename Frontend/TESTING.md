# Przewodnik testowania z Mock API

## Jak używać Mock API do testowania

Aplikacja ma wbudowany system Mock API, który pozwala testować frontend bez uruchomionego backendu.

### Włączanie Mock API

1. **Przez interfejs użytkownika (tylko w trybie deweloperskim):**
   - W prawym górnym rogu headeru znajdziesz przycisk "🔧 Mock OFF" lub "🔧 Mock ON"
   - Kliknij na niego, aby otworzyć menu
   - Wybierz "Włącz Mock API" lub "Wyłącz Mock API"
   - Strona automatycznie się przeładuje

2. **Przez konsolę przeglądarki:**
   ```javascript
   localStorage.setItem('useMockAPI', 'true')
   window.location.reload()
   ```

### Testowe konta użytkowników

Mock API zawiera następujące konta testowe:

#### Klient:
- **Email:** `jan@example.com`
- **Hasło:** (dowolne - mock API akceptuje każde hasło)
- **Rola:** customer

#### Restaurator:
- **Email:** `anna@example.com`
- **Hasło:** (dowolne)
- **Rola:** restaurant
- **Restauracje:** Pizzeria Bella, Sushi Master, Burger House

#### Klient (zablokowany):
- **Email:** `piotr@example.com`
- **Hasło:** (dowolne)
- **Rola:** customer
- **Status:** inactive

#### Administrator:
- **Email:** `admin@example.com`
- **Hasło:** (dowolne)
- **Rola:** admin

### Testowe dane

#### Restauracje:
1. **Pizzeria Bella** (ID: 1)
   - Kategoria: Włoska
   - Ocena: 4.5
   - Czas dostawy: 30-45 min

2. **Sushi Master** (ID: 2)
   - Kategoria: Japońska
   - Ocena: 4.8
   - Czas dostawy: 25-40 min

3. **Burger House** (ID: 3)
   - Kategoria: Amerykańska
   - Ocena: 4.3
   - Czas dostawy: 20-35 min

#### Menu:
- Każda restauracja ma kilka pozycji menu
- Niektóre pozycje są niedostępne (available: false)
- Ceny wahają się od 22.99 do 45.99 zł

#### Zamówienia:
- Istnieją 3 przykładowe zamówienia dla różnych użytkowników
- Różne statusy: pending, in_progress, delivered

### Scenariusze testowe

#### 1. Test rejestracji i logowania
1. Przejdź do `/register`
2. Zarejestruj nowego użytkownika
3. Zaloguj się używając nowego konta
4. Sprawdź czy widzisz odpowiednie menu w headerze

#### 2. Test przeglądania restauracji
1. Zaloguj się jako klient (`jan@example.com`)
2. Przejdź do strony głównej
3. Przetestuj wyszukiwarkę
4. Przetestuj filtrowanie po kategoriach
5. Kliknij na restaurację, aby zobaczyć menu

#### 3. Test składania zamówienia
1. Zaloguj się jako klient
2. Przejdź do restauracji (np. Pizzeria Bella)
3. Dodaj produkty do koszyka
4. Przejdź do koszyka (`/cart`)
5. Zmień ilości produktów
6. Złóż zamówienie
7. Sprawdź historię zamówień (`/order-history`)

#### 4. Test panelu restauratora
1. Zaloguj się jako restaurator (`anna@example.com`)
2. Przejdź do `/restaurant-dashboard`
3. Dodaj nową pozycję menu
4. Edytuj istniejącą pozycję (uwaga: w mock API edycja usuwa i dodaje nową)
5. Usuń pozycję menu
6. Przejdź do `/orders` i sprawdź zamówienia
7. Zmień status zamówienia

#### 5. Test panelu administratora
1. Zaloguj się jako admin (`admin@example.com`)
2. Przejdź do `/admin-dashboard`
3. Przetestuj zarządzanie użytkownikami:
   - Zobacz listę użytkowników
   - Usuń użytkownika
4. Przetestuj zarządzanie restauracjami:
   - Zobacz listę restauracji
   - Usuń restaurację

### Funkcjonalności do przetestowania

- ✅ Rejestracja użytkowników
- ✅ Logowanie użytkowników
- ✅ Przeglądanie restauracji
- ✅ Wyszukiwanie restauracji
- ✅ Filtrowanie po kategoriach
- ✅ Przeglądanie menu restauracji
- ✅ Dodawanie produktów do koszyka
- ✅ Zarządzanie koszykiem (zmiana ilości, usuwanie)
- ✅ Składanie zamówień
- ✅ Historia zamówień
- ✅ Zarządzanie menu przez restauratora
- ✅ Zarządzanie zamówieniami przez restauratora
- ✅ Zmiana statusu zamówień
- ✅ Zarządzanie użytkownikami przez administratora
- ✅ Zarządzanie restauracjami przez administratora

### Uwagi

1. **Opóźnienia sieci:** Mock API symuluje opóźnienia sieci (300-800ms) dla bardziej realistycznego testowania

2. **Brak walidacji hasła:** W mock API każde hasło jest akceptowane przy logowaniu. W prawdziwym API hasła są weryfikowane.

3. **Edycja menu:** W mock API edycja pozycji menu działa przez usunięcie starej i dodanie nowej. W prawdziwym API powinien być endpoint PUT.

4. **Statusy użytkowników/restauracji:** Zmiana statusu w mock API nie jest jeszcze zaimplementowana (wymaga endpointu PUT w API).

5. **Zamówienia restauracji:** Mock API ma endpoint `getByRestaurant`, którego brakuje w prawdziwym API.

### Przełączanie między Mock a Prawdziwym API

Aby przetestować z prawdziwym backendem:

1. Upewnij się, że backend działa na `http://localhost:8080`
2. Wyłącz Mock API przez interfejs lub:
   ```javascript
   localStorage.setItem('useMockAPI', 'false')
   window.location.reload()
   ```

### Debugowanie

Wszystkie wywołania API są logowane w konsoli przeglądarki. Sprawdź konsolę, aby zobaczyć:
- Które endpointy są wywoływane
- Jakie dane są wysyłane/odbierane
- Błędy API

### Reset danych Mock

Aby zresetować dane mock do stanu początkowego, odśwież stronę (F5). Mock API przechowuje dane w pamięci, więc każdy refresh resetuje je do wartości początkowych.


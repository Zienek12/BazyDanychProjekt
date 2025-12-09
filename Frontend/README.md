# FoodOrder - Aplikacja do zamawiania jedzenia

Aplikacja webowa do zamawiania jedzenia z różnych restauracji. Frontend zbudowany w React z Vite.

## Funkcjonalności

### WB.01 - Rejestracja i logowanie użytkowników
- Strona logowania (`/login`)
- Strona rejestracji (`/register`) z wyborem typu konta (Klient/Restaurator)

### WB.02 - Zarządzanie menu przez restauratora
- Panel restauratora (`/restaurant-dashboard`)
- Tworzenie i edycja pozycji menu
- Zarządzanie dostępnością produktów

### WB.03 - Składanie zamówień przez klienta
- Przeglądanie restauracji i menu
- Dodawanie produktów do koszyka
- Składanie zamówień (`/cart`)

### WB.04 - Aktualizacja statusu zamówienia przez restauratora
- Panel zamówień (`/orders`)
- Zmiana statusu zamówień (Nowe, W przygotowaniu, Gotowe do odbioru, itp.)

### WB.05 - Zarządzanie przez administratora
- Panel administratora (`/admin-dashboard`)
- Zarządzanie użytkownikami
- Zarządzanie restauracjami

### WB.06 - Wyszukiwanie restauracji i dań
- Wyszukiwarka na stronie głównej
- Filtrowanie po kategoriach
- Wyszukiwanie po nazwie restauracji lub opisie

### WB.07 - Historia zamówień użytkownika
- Strona historii zamówień (`/order-history`)
- Szczegóły zamówień z statusami

## Struktura projektu

```
src/
├── components/          # Komponenty wielokrotnego użytku
│   ├── Layout.jsx      # Główny layout z headerem i footerem
│   ├── SearchBar.jsx   # Komponent wyszukiwarki
│   ├── RestaurantCard.jsx  # Karta restauracji
│   └── MenuItem.jsx    # Pozycja menu
├── pages/              # Strony aplikacji
│   ├── Home.jsx        # Strona główna z listą restauracji
│   ├── Login.jsx       # Logowanie
│   ├── Register.jsx    # Rejestracja
│   ├── RestaurantDetails.jsx  # Szczegóły restauracji i menu
│   ├── Cart.jsx        # Koszyk
│   ├── OrderHistory.jsx  # Historia zamówień klienta
│   ├── Orders.jsx      # Zamówienia dla restauratora
│   ├── RestaurantDashboard.jsx  # Panel restauratora
│   └── AdminDashboard.jsx  # Panel administratora
└── App.jsx             # Główny komponent z routingiem
```

## Instalacja i uruchomienie

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm run dev

# Budowanie produkcyjne
npm run build
```

## Technologie

- React 19
- React Router DOM
- Vite
- CSS3 (własne style)

## Uwagi

Aktualnie aplikacja używa mock danych. Połączenie z backendem będzie dodane w następnym etapie projektu.

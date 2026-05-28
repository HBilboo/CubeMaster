# CubeMaster 🧩⏱️
**CubeMaster** to nowoczesna aplikacja webowa dla speedcuberów (osób układających kostkę Rubika), umożliwiająca precyzyjne mierzenie czasów ułożeń, generowanie profesjonalnych algorytmów mieszających (scramble) oraz śledzenie statystyk sesji w czasie rzeczywistym.
Projekt został stworzony z myślą o pełnym wsparciu dla trybu **Offline-first** (dane zapisują się lokalnie i automatycznie synchronizują z serwerem po odzyskaniu połączenia).
---
## 🚀 Główne Funkcje
- **Precyzyjny Timer:** Obsługa stoperu za pomocą spacji (czerwony/zielony wskaźnik gotowości do startu).
- **15-sekundowa Inspekcja:** Możliwość włączenia odliczania przed ułożeniem, zgodnie z oficjalnymi zasadami WCA.
- **Generator Scramble:** Automatyczne losowanie poprawnych algorytmów dla różnych kategorii (2x2, 3x3, 4x4, Pyraminx, Skewb, Square-1).
- **Wsparcie Offline:** Dane zapisywane są natychmiast w `localStorage`. Aplikacja automatycznie wykrywa status sieci (`navigator.onLine`).
- **Dwukierunkowa Synchronizacja:** Po powrocie połączenia z internetem, dane lokalne są automatycznie przesyłane na serwer, a baza danych synchronizuje się z aplikacją.
- **Statystyki Sesji:** Automatyczne wyliczanie Najlepszego Singla, Średniej sesji, bieżącego Ao5 (Average of 5) oraz Najlepszego Ao5.
- **Ranking Dnia:** Tabela pokazująca najlepsze wyniki dzisiejszego dnia dla zalogowanego gracza.

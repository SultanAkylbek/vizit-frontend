// src/constants.ts
// Shared, dependency-free constants for categories and home-screen suggestions.
// Extracted out of Sidebar.tsx / App.tsx specifically so neither file needs to
// import from the other — avoids the circular-dependency warning Vite/Rolldown
// raises on Vercel builds.

export type Category = {
  value: string; // matches Place.category / VendorPlaceInput.category on the backend
  label: string;
};

// Same enum as CATEGORIES in pages/VendorDashboard.tsx, just with Russian labels for display.
export const CATEGORIES: Category[] = [
  { value: "cafe", label: "Кофейни" },
  { value: "restaurant", label: "Рестораны" },
  { value: "barbershop", label: "Барбершопы" },
  { value: "sto", label: "СТО" },
  { value: "gym", label: "Спортзалы" },
  { value: "other", label: "Другое" },
];

export type Suggestion = {
  label: string; // shown on the card
  query: string; // what actually gets set into the search query on click
};

// The label is a natural question; the query is what we can realistically match
// against name/category/district/tags/ambient_description in App.tsx's filter.
export const SUGGESTIONS: Suggestion[] = [
  { label: "Где поработать с ноутбуком?", query: "wifi" },
  { label: "Тихие места Астаны", query: "тихо" },
  { label: "Кофейня с розетками рядом", query: "розетки" },
  { label: "Куда сходить вечером вдвоём", query: "restaurant" },
];

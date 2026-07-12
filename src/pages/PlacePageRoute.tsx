// src/pages/PlacePageRoute.tsx
// Тонкая обёртка: достаёт :slug из URL и передаёт в PlacePage.
// Разделено специально, чтобы PlacePage.tsx не зависел от react-router
// и его было проще переиспользовать/тестировать отдельно.

import { useParams } from "react-router-dom";
import PlacePage from "./PlacePage";

export function PlacePageRoute() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
        Некорректная ссылка на заведение.
      </div>
    );
  }

  return <PlacePage slug={slug} />;
}

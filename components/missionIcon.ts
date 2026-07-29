import L from "leaflet";

// Vi använder en emoji som karta-ikon istället för Leaflets standardbilder.
// Anledning: Leaflets default-ikonbilder kräver extra webpack-konfiguration
// för att fungera i Next.js (kända buggrapporter om trasiga sökvägar) —
// en emoji i en <div> undviker hela det problemet och matchar dessutom kravet
// "bara en ikon på kartan" utan onödig komplexitet.
export const missionIcon = L.divIcon({
  html: '<div style="font-size: 28px; line-height: 1; transform: translate(-50%, -100%);">🎯</div>',
  className: "", // nollställ Leaflets standardklass så vår emoji inte hamnar i en vit ruta
  iconSize: [0, 0],
});

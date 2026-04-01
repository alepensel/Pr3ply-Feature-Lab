import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { WORLD_MAP_PATH } from "@/data/worldMapPath";

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "Afghanistan": [33, 65], "Albania": [41, 20], "Algeria": [28, 3], "Andorra": [42.5, 1.5],
  "Angola": [-12, 18], "Argentina": [-34, -64], "Armenia": [40, 45], "Australia": [-25, 134],
  "Austria": [47.3, 13.3], "Azerbaijan": [40.5, 47.5], "Bahamas": [24, -76], "Bahrain": [26, 50.5],
  "Bangladesh": [24, 90], "Barbados": [13, -59.5], "Belarus": [53, 28], "Belgium": [50.8, 4.3],
  "Belize": [17.2, -88.7], "Benin": [9.3, 2.3], "Bhutan": [27.5, 90.5], "Bolivia": [-17, -65],
  "Bosnia and Herzegovina": [44, 18], "Botswana": [-22, 24], "Brazil": [-10, -55],
  "Brunei": [4.5, 114.7], "Bulgaria": [43, 25], "Burkina Faso": [12, -1.5], "Burundi": [-3.5, 30],
  "Cambodia": [12.5, 105], "Cameroon": [6, 12], "Canada": [56, -96], "Central African Republic": [7, 21],
  "Chad": [15, 19], "Chile": [-33, -71], "China": [35, 105], "Colombia": [4, -72],
  "Comoros": [-12, 44], "Congo": [-1, 15], "Costa Rica": [10, -84], "Croatia": [45.2, 15.5],
  "Cuba": [22, -80], "Cyprus": [35, 33], "Czech Republic": [49.7, 15.5], "Denmark": [56, 10],
  "Djibouti": [11.5, 43], "Dominica": [15.4, -61.4], "Dominican Republic": [19, -70.7],
  "Ecuador": [-2, -77.5], "Egypt": [27, 30], "El Salvador": [13.8, -88.9],
  "Equatorial Guinea": [1.5, 10.5], "Eritrea": [15, 39], "Estonia": [59, 26],
  "Eswatini": [-26.5, 31.5], "Ethiopia": [8, 38], "Fiji": [-18, 178], "Finland": [64, 26],
  "France": [46, 2], "Gabon": [-1, 11.8], "Gambia": [13.5, -15.5], "Georgia": [42, 43.5],
  "Germany": [51, 10], "Ghana": [8, -2], "Greece": [39, 22], "Grenada": [12, -61.7],
  "Guatemala": [15.5, -90.3], "Guinea": [11, -10], "Guinea-Bissau": [12, -15],
  "Guyana": [5, -59], "Haiti": [19, -72.3], "Honduras": [14.1, -87.2], "Hungary": [47.2, 20],
  "Iceland": [65, -18], "India": [22, 79], "Indonesia": [-5, 120], "Iran": [32, 53],
  "Iraq": [33, 44], "Ireland": [53, -8], "Israel": [31.5, 35], "Italy": [42.8, 12.8],
  "Jamaica": [18.1, -77.3], "Japan": [36, 138], "Jordan": [31, 36.6], "Kazakhstan": [48, 68],
  "Kenya": [1, 38], "Kiribati": [1.5, 173], "Kuwait": [29.3, 47.6], "Kyrgyzstan": [41, 75],
  "Laos": [18, 105], "Latvia": [57, 25], "Lebanon": [33.8, 35.8], "Lesotho": [-29.5, 28.5],
  "Liberia": [6.5, -9.5], "Libya": [27, 17], "Liechtenstein": [47.2, 9.5],
  "Lithuania": [56, 24], "Luxembourg": [49.8, 6.1], "Madagascar": [-19, 47],
  "Malawi": [-13.5, 34], "Malaysia": [4, 109], "Maldives": [3.2, 73], "Mali": [17, -4],
  "Malta": [35.9, 14.4], "Marshall Islands": [9, 168], "Mauritania": [20, -10.5],
  "Mauritius": [-20.3, 57.6], "Mexico": [23, -102], "Micronesia": [6.9, 158.2],
  "Moldova": [47, 29], "Monaco": [43.7, 7.4], "Mongolia": [46, 105], "Montenegro": [42.5, 19.3],
  "Morocco": [32, -5], "Mozambique": [-18, 35], "Myanmar": [22, 96], "Namibia": [-22, 17],
  "Nauru": [-0.5, 167], "Nepal": [28, 84], "Netherlands": [52.5, 5.7],
  "New Zealand": [-42, 174], "Nicaragua": [13, -85], "Niger": [16, 8], "Nigeria": [10, 8],
  "North Korea": [40, 127], "North Macedonia": [41.5, 22], "Norway": [62, 10],
  "Oman": [21, 57], "Pakistan": [30, 70], "Palau": [7.5, 134.5],
  "Palestine": [31.9, 35.2], "Panama": [9, -80], "Papua New Guinea": [-6, 147],
  "Paraguay": [-23, -58], "Peru": [-10, -76], "Philippines": [13, 122],
  "Poland": [52, 20], "Portugal": [39.5, -8], "Qatar": [25.5, 51.2], "Romania": [46, 25],
  "Russia": [60, 100], "Rwanda": [-2, 29.9], "Saint Kitts and Nevis": [17.3, -62.7],
  "Saint Lucia": [14, -61], "Saint Vincent and the Grenadines": [13, -61.2],
  "Samoa": [-13.8, -172], "San Marino": [43.9, 12.4], "Sao Tome and Principe": [0.2, 6.6],
  "Saudi Arabia": [24, 45], "Senegal": [14, -14.5], "Serbia": [44, 21],
  "Seychelles": [-4.7, 55.5], "Sierra Leone": [8.5, -12], "Singapore": [1.4, 103.8],
  "Slovakia": [48.7, 19.7], "Slovenia": [46.1, 14.8], "Solomon Islands": [-8, 159],
  "Somalia": [5, 46], "South Africa": [-30, 25], "South Korea": [36, 128],
  "South Sudan": [7, 30], "Spain": [40, -4], "Sri Lanka": [7, 81],
  "Sudan": [15, 30], "Suriname": [4, -56], "Sweden": [62, 15],
  "Switzerland": [47, 8.2], "Syria": [35, 38], "Taiwan": [24, 121],
  "Tajikistan": [39, 71], "Tanzania": [-6, 35], "Thailand": [15, 100],
  "Timor-Leste": [-8.5, 126], "Togo": [8, 1.2], "Tonga": [-20, -175],
  "Trinidad and Tobago": [10.4, -61.3], "Tunisia": [34, 9], "Turkey": [39, 35],
  "Turkmenistan": [40, 60], "Tuvalu": [-8, 179], "Uganda": [1, 32],
  "Ukraine": [49, 32], "United Arab Emirates": [24, 54], "United Kingdom": [54, -2],
  "United States": [39, -98], "Uruguay": [-33, -56], "Uzbekistan": [41, 65],
  "Vanuatu": [-16, 167], "Vatican City": [41.9, 12.5], "Venezuela": [8, -66],
  "Vietnam": [16, 108], "Yemen": [15, 48], "Zambia": [-15, 28], "Zimbabwe": [-20, 30],
};

function toSVG(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * 800;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = 250 - (mercN / Math.PI) * 250;
  return [x, y];
}

interface ParticipantMapProps {
  tutorCountry: string;
  participantCountries: (string | null)[];
}

const ParticipantMap = ({ tutorCountry, participantCountries }: ParticipantMapProps) => {
  const points = useMemo(() => {
    const allCountries = [tutorCountry, ...participantCountries.filter(Boolean)] as string[];
    const unique = [...new Set(allCountries)];
    return unique
      .map((c) => {
        const coords = COUNTRY_COORDS[c];
        if (!coords) return null;
        const [x, y] = toSVG(coords[0], coords[1]);
        return { country: c, x, y, isTutor: c === tutorCountry };
      })
      .filter(Boolean) as { country: string; x: number; y: number; isTutor: boolean }[];
  }, [tutorCountry, participantCountries]);

  if (points.length < 2) return null;

  const tutorPoint = points.find((p) => p.isTutor);

  const pinColors = [
    "hsl(var(--primary))",
    "hsl(210, 70%, 50%)",
    "hsl(175, 60%, 45%)",
    "hsl(260, 55%, 55%)",
    "hsl(330, 50%, 50%)",
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Connected across the world</h2>
      </div>
      <div className="flex-1 flex items-center">
        <svg viewBox="0 0 800 450" className="w-full h-auto" style={{ maxHeight: 200 }}>
          {/* Accurate world map from Natural Earth 110m data */}
          <path
            d={WORLD_MAP_PATH}
            className="fill-muted/50 stroke-border/40"
            strokeWidth="0.5"
            fillRule="evenodd"
          />

          {/* Connection lines from tutor to students */}
          {tutorPoint &&
            points
              .filter((p) => !p.isTutor)
              .map((p) => (
                <line
                  key={`line-${p.country}`}
                  x1={tutorPoint.x}
                  y1={tutorPoint.y}
                  x2={p.x}
                  y2={p.y}
                  className="stroke-primary/25"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              ))}

          {/* Pin markers */}
          {points.map((p, idx) => {
            const color = pinColors[idx % pinColors.length];
            return (
              <g key={p.country}>
                <path
                  d={`M${p.x},${p.y - 3} 
                     C${p.x - 8},${p.y - 12} ${p.x - 8},${p.y - 22} ${p.x},${p.y - 26}
                     C${p.x + 8},${p.y - 22} ${p.x + 8},${p.y - 12} ${p.x},${p.y - 3}Z`}
                  fill={color}
                  stroke="white"
                  strokeWidth="1.5"
                />
                <circle cx={p.x} cy={p.y - 16} r="4" fill="white" />
                <text
                  x={p.x}
                  y={p.y + 10}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="8"
                  fontWeight="500"
                >
                  {p.country}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ParticipantMap;

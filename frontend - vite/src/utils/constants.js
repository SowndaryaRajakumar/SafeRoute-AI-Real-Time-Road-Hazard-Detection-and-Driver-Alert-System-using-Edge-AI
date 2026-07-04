export const RISK_COLORS = {
  Low: { hex: "#10b981", bg: "var(--risk-low-bg)", text: "var(--risk-low)" },
  Medium: { hex: "#f59e0b", bg: "var(--risk-medium-bg)", text: "var(--risk-medium)" },
  High: { hex: "#ef4444", bg: "var(--risk-high-bg)", text: "var(--risk-high)" },
};

export const RISK_SCORE_COLOR = (score) => {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
};

export const TN_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Coimbatore City",
  "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi",
  "Kancheepuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai",
  "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur",
  "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
  "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli",
  "Tirunelveli", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Villupuram", "Virudhunagar", "Puducherry", "Tirupathur",
  "Hosur", "Mettur", "Ooty (Udhagamandalam)", "Kodaikanal", "Ambur", "Chengam",
];

/**
 * Complete coordinate map for all 46 Tamil Nadu districts.
 * Used as a fallback when the backend API is unavailable.
 */
export const TN_DISTRICT_COORDS = {
  Ariyalur:           { lat: 11.1401, lng: 79.0781 },
  Chengalpattu:       { lat: 12.6921, lng: 79.9769 },
  Chennai:            { lat: 13.0827, lng: 80.2707 },
  Coimbatore:         { lat: 11.0168, lng: 76.9558 },
  "Coimbatore City":  { lat: 11.0168, lng: 76.9558 },
  Cuddalore:          { lat: 11.7480, lng: 79.7680 },
  Dharmapuri:         { lat: 12.1277, lng: 78.1582 },
  Dindigul:           { lat: 10.3624, lng: 77.9695 },
  Erode:              { lat: 11.3410, lng: 77.7172 },
  Kallakurichi:       { lat: 11.7338, lng: 78.9587 },
  Kancheepuram:       { lat: 12.8185, lng: 79.6947 },
  Kanyakumari:        { lat: 8.0883,  lng: 77.5385 },
  Karur:              { lat: 10.9601, lng: 78.0766 },
  Krishnagiri:        { lat: 12.5186, lng: 78.2137 },
  Madurai:            { lat: 9.9252,  lng: 78.1198 },
  Mayiladuthurai:     { lat: 11.1015, lng: 79.6512 },
  Nagapattinam:       { lat: 10.7669, lng: 79.8445 },
  Namakkal:           { lat: 11.2189, lng: 78.1676 },
  Nilgiris:           { lat: 11.4102, lng: 76.7060 },
  Perambalur:         { lat: 11.2333, lng: 78.8833 },
  Pudukkottai:        { lat: 10.3797, lng: 78.8199 },
  Ramanathapuram:     { lat: 9.3762,  lng: 78.8302 },
  Ranipet:            { lat: 12.9352, lng: 79.3329 },
  Salem:              { lat: 11.6643, lng: 78.1460 },
  Sivaganga:          { lat: 9.8477,  lng: 78.4801 },
  Tenkasi:            { lat: 8.9590,  lng: 77.3152 },
  Thanjavur:          { lat: 10.7867, lng: 79.1378 },
  Theni:              { lat: 10.0104, lng: 77.4771 },
  Thoothukudi:        { lat: 8.7642,  lng: 78.1348 },
  Tiruchirappalli:    { lat: 10.7905, lng: 78.7047 },
  Tirunelveli:        { lat: 8.7139,  lng: 77.7567 },
  Tiruppur:           { lat: 11.1085, lng: 77.3411 },
  Tiruvallur:         { lat: 13.1436, lng: 79.9082 },
  Tiruvannamalai:     { lat: 12.2253, lng: 79.0747 },
  Tiruvarur:          { lat: 10.7726, lng: 79.6366 },
  Vellore:            { lat: 12.9165, lng: 79.1325 },
  Villupuram:         { lat: 11.9401, lng: 79.4861 },
  Virudhunagar:       { lat: 9.5850,  lng: 77.9624 },
  Puducherry:         { lat: 11.9416, lng: 79.8083 },
  Tirupathur:         { lat: 12.4960, lng: 78.5723 },
  Hosur:              { lat: 12.7409, lng: 77.8253 },
  Mettur:             { lat: 11.7886, lng: 77.8046 },
  "Ooty (Udhagamandalam)": { lat: 11.4064, lng: 76.6932 },
  Kodaikanal:         { lat: 10.2381, lng: 77.4892 },
  Ambur:              { lat: 12.7934, lng: 78.7175 },
  Chengam:            { lat: 12.3200, lng: 78.7500 },
};

export const CRIME_CATEGORY_LABELS = [
  "Assault (Modesty)",
  "Assault on Women",
  "Sexual Harassment",
  "Disrobing",
  "Voyeurism",
  "Stalking",
  "Rape",
  "Attempt to Rape",
];

export const CHART_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

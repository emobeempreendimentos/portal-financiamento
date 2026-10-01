import { Playfair_Display } from "next/font/google";

// Serifada do site emobe.com.br — usada nas telas de acesso para ficarem iguais às do site.
export const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});

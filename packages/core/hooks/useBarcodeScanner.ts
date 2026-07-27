import { useEffect, useState } from "react";

/**
 * Hook pour intercepter les saisies de la douchette (scanner code-barres).
 * La douchette émule généralement un clavier qui tape très vite, puis fait "Entrée".
 */
export function useBarcodeScanner() {
  const [barcode, setBarcode] = useState("");

  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on tape dans un input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentTime = Date.now();
      
      // Si la dernière touche a été pressée il y a plus de 50ms, on considère que ce n'est pas la douchette
      if (currentTime - lastKeyTime > 50) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.key === "Enter" && buffer.length > 3) {
        setBarcode(buffer);
        buffer = ""; // reset
        e.preventDefault(); // empêcher un comportement par défaut
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return barcode;
}

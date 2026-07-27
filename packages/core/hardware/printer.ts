/**
 * Interface partagée pour les imprimantes thermiques ESC/POS
 */
export interface PrinterService {
  /**
   * Initialise et connecte l'imprimante
   */
  connect(): Promise<boolean>;
  
  /**
   * Imprime un ticket ou un reçu
   * @param content Le contenu texte à imprimer
   */
  printReceipt(content: string): Promise<void>;
  
  /**
   * Envoie la commande ESC/POS pour ouvrir le tiroir-caisse
   * Généralement: [27, 112, 0, 25, 250]
   */
  openCashDrawer(): Promise<void>;
  
  /**
   * Déconnecte l'imprimante
   */
  disconnect(): Promise<void>;
}

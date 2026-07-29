import type { PrinterService } from './printer';

/**
 * Implémentation de PrinterService pour l'application Mobile (React Native).
 * En environnement de production Expo, ceci utiliserait fetch() pour imprimer
 * sur une imprimante réseau locale (ex: 192.168.1.100:9100) ou un module natif Bluetooth.
 */
export class MobilePrinterService implements PrinterService {
  private ipAddress: string;

  constructor(ipAddress: string = '192.168.1.200') {
    this.ipAddress = ipAddress;
  }

  async connect(): Promise<boolean> {
    console.log(`[Mobile Printer] Tentative de connexion réseau à l'imprimante thermique sur ${this.ipAddress}...`);
    // Simulation
    return true;
  }

  async printReceipt(content: string): Promise<void> {
    console.log(`[Mobile Printer] Envoi du ticket vers ${this.ipAddress} via requêtes réseau TCP/HTTP...`);
    console.log(content);
    // Simulation: fetch(`http://${this.ipAddress}/print`, { method: 'POST', body: content });
  }

  async openCashDrawer(): Promise<void> {
    console.log(`[Mobile Printer] Envoi du signal ESC/POS (Tiroir) vers l'imprimante réseau ${this.ipAddress}`);
    // Simulation: Commande réseau d'ouverture [27, 112, 0, 25, 250]
  }

  async disconnect(): Promise<void> {
    console.log(`[Mobile Printer] Déconnexion réseau.`);
  }
}

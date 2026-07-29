import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { INITIAL_PRODUCTS } from '@pos/core';

interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [cart, setCart] = useState([] as CartItem[]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Nous avons besoin de la permission pour utiliser la caméra</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Accorder la permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setIsScanning(false);
    
    // Rechercher dans le catalogue @pos/core par SKU ou ID
    const foundProduct = INITIAL_PRODUCTS.find(p => p.sku === data || p.id === data);

    const newItem: CartItem = {
      sku: foundProduct?.sku || data,
      name: foundProduct ? foundProduct.name : `Article Scanné (${data.substring(0, 8)})`,
      price: foundProduct ? foundProduct.price : 2500,
      quantity: 1,
    };

    setCart((prev: CartItem[]) => {
      const existing = prev.find((i: CartItem) => i.sku === newItem.sku);
      if (existing) {
        return prev.map((i: CartItem) => i.sku === newItem.sku ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, newItem];
    });
  };

  const total = cart.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    alert(`Encaissement de ${total} F CFA validé !`);
    setCart([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Caisse Mobile</Text>
      </View>

      {isScanning ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'qr', 'upc_a'],
            }}
            onBarcodeScanned={handleBarCodeScanned}
          />
          <TouchableOpacity 
            style={styles.closeCameraBtn} 
            onPress={() => setIsScanning(false)}
          >
            <Text style={styles.closeCameraText}>Fermer le scanner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cartContainer}>
          <ScrollView style={styles.cartList}>
            {cart.length === 0 ? (
              <Text style={styles.emptyText}>Panier vide. Scannez un article pour commencer.</Text>
            ) : (
              cart.map((item: CartItem, index: number) => (
                <View key={index} style={styles.cartItem}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSku}>{item.sku}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemPrice}>{item.price} F</Text>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total :</Text>
              <Text style={styles.totalAmount}>{total} F CFA</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.scanBtn} onPress={() => setIsScanning(true)}>
                <Text style={styles.scanBtnText}>📷 Scanner</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.checkoutBtn, cart.length === 0 && styles.disabledBtn]} 
                onPress={handleCheckout}
                disabled={cart.length === 0}
              >
                <Text style={styles.checkoutBtnText}>Encaisser</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#8e24aa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#8e24aa',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  btnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  closeCameraBtn: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeCameraText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cartContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cartList: {
    flex: 1,
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 50,
  },
  cartItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemSku: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#8e24aa',
  },
  itemQty: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8e24aa',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scanBtn: {
    backgroundColor: '#f3e5f5',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#8e24aa',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkoutBtn: {
    backgroundColor: '#8e24aa',
    padding: 15,
    borderRadius: 10,
    flex: 2,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  checkoutBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

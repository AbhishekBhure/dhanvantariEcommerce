export const SHIPPING_CHARGE = 50;

export function getShippingCharge(itemCount: number): number {
  return itemCount > 0 ? SHIPPING_CHARGE : 0;
}

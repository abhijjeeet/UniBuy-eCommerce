import prisma from "../../prisma/prisma";

export async function getCartItemById(id: string) {
  return prisma.cartItem.findUnique({
    where: { id },
    include: { user: true, product: true, variant: true },
  });
}

export async function getAllCartItems() {
  return prisma.cartItem.findMany({
    include: { user: true, product: true, variant: true },
  });
}

export async function createCartItem(data: any) {
  return prisma.cartItem.create({ data });
}

export async function updateCartItem(id: string, data: any) {
  return prisma.cartItem.update({ where: { id }, data });
}

export async function deleteCartItem(id: string) {
  return prisma.cartItem.delete({ where: { id } });
}

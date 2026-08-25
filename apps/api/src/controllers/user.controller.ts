import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";
import { AddressInput } from "@dhanvantari/validation";

// GET /api/users/addresses
export async function getAddresses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: { addresses } });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/addresses
export async function createAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const input = req.body as AddressInput;

    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { userId, ...input },
    });

    res.status(201).json({ success: true, data: { address } });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/addresses/:id
export async function updateAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const input = req.body as AddressInput;

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError("Address");

    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: input,
    });
    res.json({ success: true, data: { address } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/addresses/:id
export async function deleteAddress(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError("Address");

    await prisma.address.delete({ where: { id } });
    res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/profile
export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { name, phone } = req.body as { name?: string; phone?: string | null };

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

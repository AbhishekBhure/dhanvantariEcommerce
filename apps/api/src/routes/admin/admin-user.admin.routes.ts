import { Router, type Request } from "express";
import prisma from "../../lib/prisma.js";
import { requireRole } from "../../middleware/auth.js";
import { UserRole } from "@dhanvantari/shared-types";
import { BadRequestError, NotFoundError } from "../../middleware/errorHandler.js";

const router: ReturnType<typeof Router> = Router();
const superAdminOnly = requireRole(UserRole.SUPER_ADMIN);

router.get("/", superAdminOnly, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } }, select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true, createdAt: true }, orderBy: { createdAt: "asc" } });
    res.json({ success: true, data: { users } });
  } catch (error) { next(error); }
});

router.post("/invite", superAdminOnly, async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) throw new BadRequestError("Enter the verified customer email to promote.");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("Verified customer account");
    if (!user.emailVerified) throw new BadRequestError("That customer must verify their email before admin access is granted.");
    if (user.role !== UserRole.CUSTOMER) throw new BadRequestError("This account already has an admin role.");
    const updated = await prisma.user.update({ where: { id: user.id }, data: { role: UserRole.ADMIN }, select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true, createdAt: true } });
    res.status(201).json({ success: true, data: { user: updated } });
  } catch (error) { next(error); }
});

router.patch("/:id/role", superAdminOnly, async (req: Request, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const role = req.body.role as UserRole;
    if (!id || !Object.values(UserRole).includes(role)) throw new BadRequestError("Choose a valid user role.");
    if (id === req.user!.userId && role !== UserRole.SUPER_ADMIN) throw new BadRequestError("You cannot remove your own super-admin role.");
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("Admin user");
    const updated = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true } });
    res.json({ success: true, data: { user: updated } });
  } catch (error) { next(error); }
});

router.patch("/:id/status", superAdminOnly, async (req: Request, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isActive = req.body.isActive;
    if (!id || typeof isActive !== "boolean") throw new BadRequestError("Provide a valid active status.");
    if (id === req.user!.userId && !isActive) throw new BadRequestError("You cannot deactivate your own account.");
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role as UserRole)) throw new NotFoundError("Admin user");
    const updated = await prisma.user.update({ where: { id }, data: { isActive }, select: { id: true, name: true, email: true, role: true, isActive: true, emailVerified: true } });
    res.json({ success: true, data: { user: updated } });
  } catch (error) { next(error); }
});

export default router;

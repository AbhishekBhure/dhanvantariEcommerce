import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import adminProductRoutes from "./product.admin.routes.js";
import adminCategoryRoutes from "./category.admin.routes.js";
import adminOrderRoutes from "./order.admin.routes.js";
import adminCustomerRoutes from "./customer.admin.routes.js";
import adminCouponRoutes from "./coupon.admin.routes.js";
import adminBannerRoutes from "./banner.admin.routes.js";
import adminDashboardRoutes from "./dashboard.admin.routes.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.use("/dashboard", adminDashboardRoutes);
router.use("/products", adminProductRoutes);
router.use("/categories", adminCategoryRoutes);
router.use("/orders", adminOrderRoutes);
router.use("/customers", adminCustomerRoutes);
router.use("/coupons", adminCouponRoutes);
router.use("/banners", adminBannerRoutes);

export default router;

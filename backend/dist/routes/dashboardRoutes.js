"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DashboardController_1 = require("../controllers/DashboardController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const dashboardController = new DashboardController_1.DashboardController();
// Todas as rotas protegidas
router.use(auth_1.authMiddleware);
router.get('/metricas', (req, res) => dashboardController.getMetricas(req, res));
router.get('/alertas', (req, res) => dashboardController.getAlertas(req, res));
exports.default = router;
//# sourceMappingURL=dashboardRoutes.js.map
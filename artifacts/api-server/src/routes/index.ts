import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import materialsRouter from "./materials";
import stockInRouter from "./stockIn";
import stockOutRouter from "./stockOut";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import salaryRouter from "./salary";
import customersRouter from "./customers";
import productionRouter from "./production";
import deliveryChallansRouter from "./deliveryChallans";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/materials", materialsRouter);
router.use("/stock-in", stockInRouter);
router.use("/stock-out", stockOutRouter);
router.use("/employees", employeesRouter);
router.use("/attendance", attendanceRouter);
router.use("/salary", salaryRouter);
router.use("/customers", customersRouter);
router.use("/production", productionRouter);
router.use("/delivery-challans", deliveryChallansRouter);
router.use("/reports", reportsRouter);

export default router;

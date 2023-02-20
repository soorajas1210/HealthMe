const express = require("express");
const adminRoute = express();
const adminController = require("../controller/adminController");
const adminAuth = require("../middleware/adminAuth");
const multer = require('../util/multer')

adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "./views/admin");

adminRoute.use("/", express.static("public/admin"));

adminRoute.get("/", adminController.adminLogin);
adminRoute.post("/", adminController.verifyLogin);
adminRoute.get("/dashboard", adminController.loadDashboard);
adminRoute.get("/user-page", adminController.loadUser);

adminRoute.get("/profile", adminController.adminProfile);
adminRoute.get("/products", adminAuth.isLogin, adminController.adminProducts);

adminRoute.get("/addproduct",adminAuth.isLogin,adminController.adminaddProducts);
adminRoute.post("/addproduct",multer.upload.array('image', 4),adminController.addnewProducts);

adminRoute.get("/block-user", adminController.blockUser);
adminRoute.get("/delete-user", adminController.deleteUser);



adminRoute.get("/add-banner", adminController.getBanner);
adminRoute.post("/add-banner",multer.upload.array("image",1), adminController.addBanner);
adminRoute.get("/delete-banner",adminAuth.isLogin,adminController.deleteBanner);

adminRoute.get("/editproduct", adminAuth.isLogin, adminController.editProduct);
adminRoute.post("/editproduct",adminAuth.isLogin,multer.upload.array("image", 4),adminController.updateProduct
);

adminRoute.get("/deleteproduct",adminAuth.isLogin,adminController.deleteProduct);
adminRoute.get("/soft-delete",adminAuth.isLogin,adminController.softDelete);

adminRoute.get("/view-order", adminAuth.isLogin, adminController.viewOrder);
adminRoute.get('/admin-cancel-order',adminAuth.isLogin,adminController.adminCancelOrder)
adminRoute.get('/admin-confirm-order',adminAuth.isLogin,adminController.adminConfirmorder)
adminRoute.get('/admin-delivered-order',adminAuth.isLogin,adminController.adminDeliveredorder)

adminRoute.get("/admin-category", adminAuth.isLogin, adminController.adminCategory);
adminRoute.post("/admin-category", adminAuth.isLogin, adminController.addCategory);
adminRoute.get("/admin-delete-category", adminAuth.isLogin, adminController.deleteCategory);

adminRoute.get('/admin-offer',adminAuth.isLogin,adminController.adminOffer)
adminRoute.post('/admin-offer',adminAuth.isLogin,adminController.adminStoreOffer)
adminRoute.get('/delete-offer',adminAuth.isLogin,adminController.deleteOffer)


adminRoute.get("/logout", adminAuth.isLogin, adminController.adminLogout);

adminRoute.get("*",adminController.random)

module.exports = adminRoute;

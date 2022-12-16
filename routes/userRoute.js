const express = require("express");
const userRoute = express();
const userController = require("../controller/userController");
const auth = require("../middleware/auth");

userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));

userRoute.set("view engine", "ejs");
userRoute.set("views", "./views/users");

userRoute.get("/", userController.indexPage);
userRoute.get("/login", userController.loginLoad);
userRoute.post("/login", userController.verifyLogin);

userRoute.get("/register", userController.userRegisterpage);
userRoute.post("/register", userController.userRegister);
userRoute.post("/otp-verify", userController.otpVerify);

userRoute.get("/dashboard", auth.isLogin, userController.userDashboard);

userRoute.get("/shoplist", userController.shopList);
userRoute.get("/product", userController.productDetails);

userRoute.get("/wishlist", auth.isLogin, userController.loadWishlist);
userRoute.post("/wishlist", userController.addtoWishlist);
userRoute.get("/delete-wishlist", userController.deleteWishlist);
userRoute.post("/wish-to-cart", userController.wishTocart);


userRoute.get("/cart", auth.isLogin, userController.loadCart);
userRoute.post("/cart", userController.addtoCart);

userRoute.get("/delete-cart", userController.deleteCart);
userRoute.post("/update-cart", userController.updateCart);
userRoute.get("/checkout", userController.checkOut);

userRoute.post('/add-coupon',userController.addCoupon)

userRoute.post("/payment", userController.placeOrder);
userRoute.get("/paypal", userController.paypal);

userRoute.get("/order-placed", userController.orderPlaced);
userRoute.get("/order-details", userController.orderDetails);
userRoute.get("/order-cancel", userController.orderCancel);
userRoute.get('/return-product',auth.isLogin,userController.orderReturn)


userRoute.get("/edit-user-address", userController.loaduserAddress);
userRoute.post("/edit-user-address", userController.edituserAddress);
userRoute.post("/update-account", userController.updateAccount);

userRoute.get("/logout", auth.isLogin, userController.userLogout);

module.exports = userRoute;

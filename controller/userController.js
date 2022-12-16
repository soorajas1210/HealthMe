const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Wishlist = require("../models/wishlistModel");
const Banner = require("../models/bannerModel");
const bcrypt = require("bcrypt");
const Order = require("../models/placeorderModel");
const fast2sms = require("fast-two-sms");
const Offer = require("../models/offerModel");

let isLoggedin;
isLoggedin = false;

let currentOrderId;
let newUser, newOtp;

let wishCount,
  cartCount,
  coupon = null;

let offer = {
  name: "None",
  type: "None",
  discount: 0,
  usedBy: false,
};

let couponTotal = 0;

let discount = 0;
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//OTP
const sendMessage = function (mobile) {
  let randomOTP = Math.floor(Math.random() * 10000);
  var options = {
    authorization:
      "MSOj0bTnaP8phCARmWqtzkgEV4ZN2Ff9eUxXI7iJQ5HcDBKsL1vYiamnRcMxrsjDJboyFEXl0Sk37pZq",
    message: `your OTP verification code is ${randomOTP}`,
    numbers: [mobile],
  };
  //send this message

  fast2sms
    .sendMessage(options)
    .then(() => {
      console.log("otp sent succcessfully");
    })
    .catch((error) => {
      console.log(error);
    });
  return randomOTP;
};

const indexPage = async (req, res) => {
  try {
    const userSession = req.session;
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const productData = await Product.find({
      isAvailable: 1,
      $or: [
        { productname: { $regex: ".*" + search + ".*", $options: "i" } },
        { category: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    });
    console.log(userSession.user);
    const categoryData = await Category.find({});
    const bannerData = await Banner.find({});
    if (userSession.user_id) {
   
      userSession.couponTotal = couponTotal;
      userSession.discount = discount;
      userSession.coupon = coupon;
      const userCart = await Cart.findOne({
        userId: userSession.user_id,
      }).populate("product.productId");
      const wishlist = await Wishlist.findOne({
        userId: userSession.user_id,
      }).populate("product.productId");
       cartCount = userCart.product.length;
        wishCount = wishlist.product.length;
      res.render("index", {
        isLoggedin,
        productData,
        cat: categoryData,
        banner: bannerData,
        wishCount,
        cartCount,
      });
    } else {
      isLoggedin=false;
      res.render("index", {
        isLoggedin,
        productData,
        cat: categoryData,
        banner: bannerData,
        wishCount:null,
        cartCount:null,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//login user method started

const loginLoad = async (req, res) => {
  try {
    console.log("login");
    const userSession = req.session;

    if (userSession.user_id) {
      res.redirect("/");
    } else {
      res.render("signin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userRegisterpage = async (req, res) => {
  try {
    const userSession = req.session;

    if (userSession.user_id) {
      res.redirect("/");
    } else {
      res.render("register");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userRegister = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);

    const cpassword = req.body.cpassword;
    const passwordMatch = await bcrypt.compare(cpassword, spassword);
    const userExist = await User.find({ email: req.body.email });
    if (passwordMatch) {
      if (userExist != true) {
        const user = User({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          mobileno: req.body.mobileno,
          password: spassword,
          isAdmin: 0,
        });

        const userData = await user.save();
        const userSession = req.session;

        userSession.user_id = userData._id;
        console.log(userSession.user_id);

        newUser = userData._id;
        if (userData) {
          const otp = sendMessage(req.body.mobileno, req.body.message, res);

          newOtp = otp;
          console.log(newOtp);
          console.log(newUser);
          res.render("otp-verify", { otp: newOtp, user: newUser });
        } else {
          res.render("register", { message: "Your registration failed" });
        }
      } else {
        res.render("register", { message: "User Already Exist" });
      }
    } else {
      res.render("register", { message: "password is not matching" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const otpVerify = async (req, res) => {
  try {
    const otp = newOtp;
    const userData = await User.findById({ _id: req.body.user });
    console.log("otp:", otp);
    if (otp == req.body.otp) {
      userData.isVerified = 1;
      const user = await userData.save();
      if (user) {
        res.redirect("register");
      }
    } else {
      res.render("otp-verify", { otp, user: newUser, message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userDashboard = async (req, res) => {
  try {
    const userSession = req.session;
    const orderData = await Order.find({
      userId: userSession.user_id,
    }).sort({ createdAt: -1 });
    const categoryData = await Category.find({});
    const userData = await User.findById({ _id: userSession.user_id });

    console.log(userData);

    const address = userData.address;

    if (orderData) {
      res.render("dashboard", {
        order: orderData,
        user: userData,
        add: address,
        cat: categoryData,
        wishCount,
        cartCount,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.isVerified === 0) {
          res.render("signin", { message: "Please verify your mail" });
        } else {
          const userSession = req.session;
          userSession.user_id = userData._id;

          isLoggedin = true;
          res.redirect("/");
        }
      } else {
        res.render("signin", { message: "Email or password is incorrect" });
      }
    } else {
      res.render("signin", { message: "Email or password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const shopList = async (req, res) => {
  try {
    var search = "";

    if (req.query.search) {
      search = req.query.search;
    }
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 6;
    const productData = await Product.find({
      isAvailable: 1,
      $or: [
        { productname: { $regex: ".*" + search + ".*", $options: "i" } },
        { category: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })

      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Product.find({
      isAvailable: 1,
      $or: [
        { productname: { $regex: ".*" + search + ".*", $options: "i" } },
        { category: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    const categoryData = await Category.find({});
    const ID = req.query.id;
    console.log(ID);

    const data = await Category.findOne({ _id: ID });

    if (data) {
      const productData = await Product.find({ category: data.category });

      res.render("shoplist", {
        productData,
        isLoggedin,
        cat: categoryData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1,
        wishCount,
        cartCount,
      });
    } else {
      res.render("shoplist", {
        productData,
        isLoggedin,
        cat: categoryData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1,
        wishCount,
        cartCount,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const productDetails = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    const id = req.query.id;
    const productData = await Product.find({ _id: id });
    const productDetails = await Product.find({});

    res.render("product", {
      productData,
      isLoggedin,
      product: productDetails,
      cat: categoryData,
      wishCount,
      cartCount,
    });

    console.log(productData);
  } catch (error) {
    console.log(error.message);
  }
};

//WISHLIST

const addtoWishlist = async (req, res) => {
  try {
    const p_id = req.query.id;

    const userSession = req.session;
    const userId = userSession.user_id;

    console.log(userId);
    console.log(p_id);
    const isExisting = await Wishlist.findOne({ userId: userId });
    const productData = await Product.findOne({ _id: p_id });

    if (isExisting != null) {
      const smProduct = await Wishlist.findOne({
        userId: userId,
        "product.productId": p_id,
      });
      console.log(smProduct, "2");

      if (smProduct != null) {
        res.redirect("/");
      } else {
        console.log("else");
        await Wishlist.updateMany(
          { userId: userId },
          {
            $push: {
              product: {
                productId: p_id,
                stockstatus: productData.stockstatus,
                price: productData.price,
              },
            },
          }
        );
        res.json({ status: true });
      }
    } else {
      console.log("5");
      const wish = new Wishlist({
        userId: userId,
        product: [
          {
            productId: p_id,
            stockstatus: productData.stockstatus,
            price: productData.price,
          },
        ],
      });
      await wish.save();
      res.json({ status: true });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadWishlist = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    const userSession = req.session;
    const wishlist = await Wishlist.findOne({
      userId: userSession.user_id,
    }).populate("product.productId");
    if (wishlist) {
      res.render("wishlist", {
        wish: wishlist.product,
        isLoggedin,
        cat: categoryData,
        wishCount,
        cartCount,
      });
    } else {
      res.render("wishlist", {
        wish: wishlist,
        isLoggedin,
        cat: categoryData,
        wishCount,
        cartCount,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteWishlist = async (req, res) => {
  try {
    const userSession = req.session;
    const userId = userSession.user_id;
    const p_id = req.query.id;
    console.log(userId);
    console.log(p_id);
    const userWishlist = await Wishlist.findOne({ userId: userId });
    const isExisting = await userWishlist.product.findIndex(
      (ObjInItems) => ObjInItems._id == p_id
    );
    console.log(userWishlist.product);
    userWishlist.product.splice(isExisting, 1);
    await userWishlist.save();
    res.redirect("/wishlist");
  } catch (error) {
    console.log(error.message);
  }
};

// Wish to cart -Delete

const wishTocart = async (req, res) => {
  try {
    const userSession = req.session;
    const userId = userSession.user_id;
    const p_id = req.query.id;
    const wishId = req.body.wid;
    console.log(userId);
    console.log(p_id);
    console.log(wishId);

    const productData = await Product.findOne({ _id: p_id });

    const userWishlist = await Wishlist.findOne({ userId: userId });
    const isExisting = await Cart.findOne({ userId: userId });
    const wishExisting = await userWishlist.product.findIndex(
      (ObjInItems) => ObjInItems._id == wishId
    );
    if (isExisting != null) {
      const smProduct = await Cart.findOne({
        userId: userId,
        "product.productId": p_id,
      });
      console.log(smProduct, "2");

      if (smProduct != null) {
        res.redirect("wishlist");
      } else {
        console.log("else");
        const cart = await Cart.updateMany(
          { userId: userId },
          {
            $push: {
              product: {
                productId: p_id,
                quantity: 1,
                price: productData.price,
              },
            },
          }
        );
        if (cart) {
          userWishlist.product.splice(wishExisting, 1);
          await userWishlist.save();
          res.redirect("/wishlist");
        }
      }
    } else {
      console.log("5");
      const cart = new Cart({
        userId: userId,
        product: [
          {
            productId: p_id,
            price: productData.price,
            quantity: 1,
          },
        ],
      });
      await cart.save();
      userWishlist.product.splice(wishExisting, 1);
      await userWishlist.save();
      res.redirect("/wishlist");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//    CART

const addtoCart = async (req, res) => {
  try {
    const p_id = req.query.id;
    console.log("hello", p_id);
    const userSession = req.session;
    const userId = userSession.user_id;

    console.log(userId);
    const isExisting = await Cart.findOne({ userId: userId });
    const productData = await Product.findOne({ _id: p_id });
    console.log(isExisting);
    console.log(productData.price);

    if (isExisting != null && productData.quantity >= 1) {
      const smProduct = await Cart.findOne({
        userId: userId,
        "product.productId": p_id,
      });
      console.log(smProduct, "2");

      if (smProduct != null) {
        console.log("3");
        await Cart.updateOne(
          {
            userId: userId,
            "product.productId": p_id,
            "product.price": productData.price,
          },
          { $inc: { "product.$.quantity": 1 } }
        );
        res.json({ status: true });
      } else {
        console.log("else");
        await Cart.updateMany(
          { userId: userId },
          {
            $push: {
              product: {
                productId: p_id,
                quantity: 1,
                price: productData.price,
              },
            },
          }
        );
        res.json({ status: true });
      }
    } else {
      if (productData.quantity >= 1) {
        console.log("5");
        const cart = new Cart({
          userId: userId,
          product: [
            {
              productId: p_id,
              price: productData.price,
              quantity: 1,
            },
          ],
        });
        await cart.save();
        res.json({ status: true });
      } else {
        res.redirect("/");
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCart = async (req, res) => {
  try {
    const userSession = req.session;
    const userId = userSession.user_id;
    const p_id = req.query.id;
    console.log(userId);
    console.log(p_id);
    const userCart = await Cart.findOne({ userId: userId });
    const isExisting = await userCart.product.findIndex(
      (ObjInItems) => ObjInItems._id == p_id
    );
    console.log(userCart.product);
    userCart.product.splice(isExisting, 1);
    await userCart.save();
    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
  }
};

const loadCart = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    const userSession = req.session;
    userSession.offer = offer;

    const productData = await Cart.findOne({
      userId: userSession.user_id,
    }).populate("product.productId");
    const userCart = await Cart.findOne({
      userId: userSession.user_id,
    }).populate("product.productId");
    if (userCart) {
      const totalPrice = productData.product.reduce((acc, curr) => {
        return acc + curr.productId.price * curr.quantity;
      }, 0);
      productData.totalprice = totalPrice;

      await productData.save();
      console.log("hi", userSession.couponTotal);

      //update coupon
      if (userSession.couponTotal == 0) {
        userSession.couponTotal = totalPrice;
        userSession.discount = discount;
      }

      console.log(userSession.couponTotal);

      res.render("cart", {
        cart: userCart.product,
        isLoggedin,
        totalprice: userSession.couponTotal,
        discount: userSession.discount,
        cat: categoryData,
        wishCount,
        cartCount,
        coupon: userSession.coupon,
      });
    } else {
      res.render("cart", {
        cart: userCart,
        isLoggedin,
        totalprice: userSession.couponTotal,
        discount: userSession.discount,
        cat: categoryData,
        wishCount,
        cartCount,
        coupon: userSession.coupon,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateCart = async (req, res) => {
  try {
    const userSession = req.session;
    const userId = userSession.user_id;
    const p_id = req.query.id;
    console.log(req.body.qty);
    const productData = await Cart.findOne({ userId: userId }).populate(
      "product.productId"
    );
    const index = await productData.product.findIndex(
      (cartItems) => cartItems._id == p_id
    );

    console.log("index", index);
    productData.product[index].quantity = req.body.qty;

    productData.totalprice = 0;

    const totalPrice = productData.product.reduce((acc, curr) => {
      return acc + curr.productId.price * curr.quantity;
    }, 0);

    productData.totalprice = totalPrice;
    userSession.couponTotal = 0;

    console.log("total", productData.totalprice);
    await productData.save();

    res.redirect("/cart");
  } catch (error) {
    console.log(error.message);
  }
};

const checkOut = async (req, res) => {
  try {
    const userSession = req.session;
    const userData = await User.findById({ _id: userSession.user_id });
    const userCart = await Cart.findOne({
      userId: userSession.user_id,
    }).populate("product.productId");

    const categoryData = await Category.find({});
    res.render("checkout", {
      cart: userCart.product,
      isLoggedin,
      totalprice: userSession.couponTotal,
      cat: categoryData,
      user: userData,
      wishCount,
      cartCount,
    });

    console.log(userCart.totalprice);
  } catch (error) {
    console.log(error.message);
  }
};

// Coupon
const addCoupon = async (req, res) => {
  try {
    const userSession = req.session;
    userSession.offer = offer;
    userSession.couponTotal = couponTotal;
    if (userSession.user_id) {
      const userData = await Cart.findOne({ userId: userSession.user_id });

      const offerData = await Offer.findOne({ name: req.body.offer });

      console.log(offerData);

      if (offerData) {
        console.log(offerData.usedBy);
        console.log(userSession.user_id);
        console.log(offerData.usedBy == userSession.user_id);
        if (!offerData.usedBy.includes(userSession.user_id)) {
          userSession.offer.name = offerData.name;
          userSession.offer.type = offerData.type;
          userSession.offer.discount = offerData.discount;

          let updatedTotal =
            userData.totalprice -
            (userData.totalprice * userSession.offer.discount) / 100;

          let discount =
            (userData.totalprice * userSession.offer.discount) / 100;
          userSession.couponTotal = updatedTotal;
          userSession.discount = discount;
          console.log(userSession.couponTotal);
          console.log(userSession.discount);
          userSession.coupon = userSession.offer.name;
          res.redirect("/cart");
        } else {
          userSession.offer.usedBy = true;
          res.redirect("/cart");
        }
      } else {
        res.redirect("/cart");
      }
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const placeOrder = async (req, res) => {
  try {
    const userSession = req.session;
    const userCart = await Cart.findOne({ userId: userSession.user_id });
    console.log(userCart);
    const orderData = new Order({
      userId: userSession.user_id,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      streetAddress: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      pin: req.body.pin,
      email: req.body.email,
      mobileno: req.body.mobileno,
      payment: req.body.payment,
      product: userCart.product,
      totalprice: userSession.couponTotal,
      offer: userSession.offer.name,
    });

    console.log(req.body.payment);
    await orderData.save();
    // userSession.currentOrder = orderData._id
    await Offer.updateOne(
      { name: userSession.offer.name },
      { $push: { usedBy: userSession.user_id } }
    );

    if (req.body.payment == "cod") {
      res.redirect("order-placed");
    } else if (req.body.payment == "paypal") {
      res.redirect("/paypal");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const paypal = async (req, res) => {
  try {
    const userSession = req.session;
    const orderData = await Order.findOne({ userId: userSession.user_id });

    res.render("paypal", { total: orderData.totalprice });
  } catch (error) {
    console.log(error.message);
  }
};

const orderPlaced = async (req, res) => {
  try {
    const userSession = req.session;
    const userId = userSession.user_id;
    userSession.discount = 0;
    const categoryData = await Category.find({});

    if (userId) {
      const cartData = await Cart.findOne({ userId: userId });
      const productData = await Product.find();
      for (let key of cartData.product) {
        console.log(key.productId, " + ", key.quantity);
        for (let prod of productData) {
          if (new String(prod._id).trim() == new String(key.productId).trim()) {
            prod.quantity = prod.quantity - key.quantity;
            await prod.save();
          }
        }
      }

      await Order.findOneAndUpdate(
        { userId: userId },
        { $set: { status: "Build" } }
      );
      await Cart.deleteMany({ userId: userId });
      await Order.findOne({ userId: userSession.user_id }).populate(
        "product.productId"
      );
    }

    res.render("order-placed", { cat: categoryData, wishCount, cartCount });
  } catch (error) {
    console.log(error.message);
  }
};

const orderDetails = async (req, res) => {
  try {
    const userSession = req.session;
    const id = req.query.id;
    currentOrderId = id;
    console.log(userSession.currentOrder);
    const orderData = await Order.findOne({
      userId: userSession.user_id,
      _id: id,
    }).populate("product.productId");

    const categoryData = await Category.find({});
    res.render("order-details", {
      order: orderData.product,
      totalprice: orderData.totalprice,
      orderDetails: orderData,
      cat: categoryData,
      wishCount,
      cartCount,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const orderCancel = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);

    await Order.deleteOne({ _id: id });
    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const orderReturn = async (req, res) => {
  try {
    const userSession = req.session;
    if (userSession == req.session) {
      const id = req.query.id;

      console.log(currentOrderId);
      console.log(id);
      const orderData = await Order.findOne({ _id: currentOrderId }).populate(
        "product.productId"
      );
      // console.log(orderData);

      const productData = await Product.findOne({ _id: id });

      console.log(productData);

      if (orderData) {
        for (let i = 0; i < orderData.product.length; i++) {
          if (
            new String(orderData.product[i].productId._id).trim() ===
            new String(id).trim()
          ) {
            console.log(orderData.product[i].quantity);
            productData.quantity =
              productData.quantity + orderData.product[i].quantity;
            orderData.productReturned[i] = 1;

            await productData.save().then(() => {
              console.log("productData saved");
            });
            console.log(
              "productOrderData.productReturned[i]",
              orderData.productReturned[i]
            );
            await orderData.save().then(() => {
              console.log("productOrderData saved");
            });
          } else {
            // console.log('Not at position: ',i);
          }
        }
        res.redirect("/dashboard");
      }
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

const loaduserAddress = async (req, res) => {
  try {
    const userSession = req.session;

    const categoryData = await Category.find({});

    const userData = await User.findById({ _id: userSession.user_id });

    res.render("edit-user", {
      cat: categoryData,
      user: userData,
      wishCount,
      cartCount,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const edituserAddress = async (req, res) => {
  try {
    const userSession = req.session;

    await User.findByIdAndUpdate(
      { _id: userSession.user_id },
      {
        $set: {
          firstname: req.body.firstname,
          laststname: req.body.lastname,
          email: req.body.email,
          mobileno: req.body.mobileno,
          country: req.body.country,
          city: req.body.city,
          streetAddress: req.body.streetAddress,
          state: req.body.state,
          pin: req.body.pin,
        },
      }
    );

    res.redirect("/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const updateAccount = async (req, res) => {
  try {
    const userSession = req.session;
    const userDetails = await User.findById({ _id: userSession.user_id });
    const oldPassword = userDetails.password;
    const spassword = await securePassword(req.body.npassword);
    const password = req.body.password;
    const cpassword = req.body.cpassword;
    const passwordMatch = await bcrypt.compare(password, oldPassword);
    const orderData = await Order.find({
      userId: userSession.user_id,
    }).sort({ createdAt: -1 });
    const categoryData = await Category.find({});
    const userData = await User.findById({ _id: userSession.user_id });

    console.log(userData);

    const address = userData.address;

    if (passwordMatch) {
      const newPassword = await bcrypt.compare(cpassword, spassword);
      if (newPassword) {
        await User.findByIdAndUpdate(
          { _id: userSession.user_id },
          {
            $set: {
              firstname: req.body.firstname,
              laststname: req.body.lastname,
              email: req.body.email,
              password: spassword,
            },
          }
        );

        res.redirect("/dashboard");
      } else {
        res.render("dashboard", {
          message: "password is not matching",
          order: orderData,
          user: userData,
          add: address,
          cat: categoryData,
          wishCount,
          cartCount,
        });
      }
    } else {
      res.render("dashboard", {
        message: "password is wrong",
        order: orderData,
        user: userData,
        add: address,
        cat: categoryData,
        wishCount,
        cartCount,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
  const  userSession =  req.session
    isLoggedin = false;
    userSession.user_id=false;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  securePassword,
  userRegister,
  indexPage,
  userDashboard,
  userLogout,
  loginLoad,
  verifyLogin,
  shopList,
  productDetails,
  userRegisterpage,
  addtoWishlist,
  addtoCart,
  deleteCart,
  loadCart,
  updateCart,
  checkOut,
  placeOrder,
  paypal,
  orderPlaced,
  otpVerify,
  orderDetails,
  loaduserAddress,
  edituserAddress,
  loadWishlist,
  deleteWishlist,
  orderCancel,
  wishTocart,
  addCoupon,
  orderReturn,
  updateAccount,
};

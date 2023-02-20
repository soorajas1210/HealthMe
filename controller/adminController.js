const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/placeorderModel");
const Category = require("../models/categoryModel");
const Banner = require("../models/bannerModel");
const bcrypt = require("bcrypt");
const Offer = require("../models/offerModel");

let isLoggedin;
isLoggedin = false;
let adminSession;
let orderType = "all";

const adminLogin = async (req, res) => {
  try {
    if (isLoggedin) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const adminData = await User.findOne({ email: email });

    if (adminData) {
      console.log("hellooo");
      const passwordMatch = await bcrypt.compare(password, adminData.password);
      if (passwordMatch) {
        if (adminData.isAdmin === 0) {
          res.render("login", { message: "please verify your mail" });
        } else {
          adminSession = req.session;
          adminSession.user_id = adminData._id;
          isLoggedin = true;
          res.redirect("dashboard");
          console.log("Admin logged in");
        }
      } else {
        res.render("login", { message: "Password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    adminSession = req.session;
    if (isLoggedin) {
      const categoryData = await Category.find();
      const categoryArray = [];
      const orderCount = [];
      for (let key of categoryData) {
        categoryArray.push(key.category);
        orderCount.push(0);
      }

      const completeorder = [];
      const orderData = await Order.find();
      for (let key of orderData) {
        const uppend = await key.populate("product.productId");
        completeorder.push(uppend);
      }
      for (let i = 0; i < completeorder.length; i++) {
        for (let j = 0; j < completeorder[i].product.length; j++) {
          const genre = completeorder[i].product[j].productId.category;
          const isExisting = categoryArray.findIndex((category) => {
            return category === genre;
          });
          orderCount[isExisting]++;
        }
      }
      console.log(orderCount);
      const productData = await Product.find();
      const userData = await User.find();
      res.render("dashboard", {
        products: productData,
        users: userData,
        category: categoryArray,
        count: orderCount,
      });
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadUser = async (req, res) => {
  try {
    adminSession = req.session;
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 6;
    const userData = await User.find({
      isAdmin: 0,
      $or: [
        { firstname: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find({
      isAdmin: 0,
      $or: [
        { firstname: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    if (isLoggedin) {
      res.render("home", {
        users: userData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previous: new Number(page) - 1,
        next: new Number(page) + 1,
      });
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminProfile = async (req, res) => {
  if (isLoggedin) {
    const userData = await User.find({ isAdmin: 1 });
    console.log(userData[0].firstname);

    res.render("profile", { admin: userData });
  } else {
    res.redirect("dashboard");
  }

  //res.render('profile')
};

const adminProducts = async (req, res) => {
  try {
    var search = "";

    if (req.query.search) {
      search = req.query.search;
    }
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 4;
    const productData = await Product.find({
      $or: [
        { productname: { $regex: ".*" + search + ".*", $options: "i" } },
        { category: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.find({
      $or: [
        { productname: { $regex: ".*" + search + ".*", $options: "i" } },
        { category: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    res.render("products", {
      products: productData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      previous: new Number(page) - 1,
      next: new Number(page) + 1,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const adminaddProducts = async (req, res) => {
  try {
    const categoryData = await Category.find({});

    res.render("addproduct", { cat: categoryData });
  } catch (error) {
    console.log(error.message);
  }

  // res.render('addproduct')
};
const addnewProducts = async (req, res) => {
  try {
    const files = req.files;
    const categoryData = await Category.find({});
    const name = req.body.name;
    const price = req.body.price;
    const quantity = req.body.quantity;
    const rating = req.body.rating;
    const image = files.map((x) => x.filename);
    const pdescription = req.body.pdescription;
    const category = req.body.category;

    const product = new Product({
      productname: name,
      price: price,
      rating: rating,
      image: image,
      quantity: quantity,
      category: category,
      pdescription: pdescription,
    });

    const productData = await product.save();

    if (productData) {
      res.render("addproduct", {
        message: "Product added successfully.",
        cat: categoryData,
      });
    } else {
      res.render("addproduct", {
        cat: categoryData,
        message: "something wrong.",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
  const id = req.query.id;
  //console.log(id);

  const userData = await User.findById({ _id: id });
  if (userData.isVerified) {
    await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 0 } });
  } else {
    await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: 1 } });
  }
  res.redirect("/admin/user-page");
  // res.redirect("/admin/login");
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    console.log(userData);
    if (userData) {
      const id = req.query.id;

      const userData = await User.deleteOne({ _id: id });

      console.log(userData);

      res.redirect("/admin/dashboard");
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error);
  }
};

const getBanner = async (req, res) => {
  try {
    const bannerData = await Banner.find({});

    console.log(bannerData);

    res.render("add-banner", { banner: bannerData });
  } catch (error) {
    console.log(error.message);
  }
};

const addBanner = async (req, res) => {
  try {
    const bannerData = await Banner.find({});

    if (bannerData.length <= 1) {
      const title = req.body.title;

      const image = req.file.filename;

      const banner = new Banner({
        title: title,
        image: image,
      });

      const bannerData = await banner.save();
      const Data = await Banner.find({});
      if (bannerData) {
        res.render("add-banner", {
          banner: Data,
          message: "added successfully",
        });
      } else {
        res.render("add-banner", {
          banner: Data,
          message: "something wrong.",
        });
      }
    } else {
      res.render("add-banner", {
        banner: bannerData,
        message: "You can only add 2 images",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteBanner = async (req, res) => {
  try {
    const id = req.query.id;
    const bannertData = await Banner.findById({ _id: id });
    if (bannertData) {
      const id = req.query.id;
      await Banner.deleteOne({ _id: id });

      res.redirect("/admin/add-banner");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error);
  }
};

//Edit prooduct

const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });
    const categoryData = await Category.find({});

    if (productData) {
      console.log(productData);

      res.render("editproduct", {
        product: productData,
        cat: categoryData,
      });
    } else {
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error);
  }
};

const updateProduct = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const files = req.files;
    await Product.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          productname: req.body.name,

          price: req.body.price,
          quantity: req.body.quantity,
          rating: req.body.rating,
          image: files.map((x) => x.filename),
          pdescription: req.body.pdescription,
          category: req.body.category,
          information: req.body.information,
        },
      }
    );
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};

// delete product
const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });

    if (productData) {
      const id = req.query.id;

      await Product.deleteOne({ _id: id });

      res.redirect("/admin/products");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error);
  }
};

const softDelete = async (req, res) => {
  try {
    const id = req.query.id;

    const productData = await Product.findById({ _id: id });
    console.log(productData);
    if (productData.isAvailable) {
      await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { isAvailable: 0 } }
      );
    } else {
      await Product.findByIdAndUpdate(
        { _id: id },
        { $set: { isAvailable: 1 } }
      );
    }
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrder = async (req, res) => {
  const orderData = await Order.find().sort({ createdAt: -1 });

  if (orderType == undefined) {
    res.render("view-order", { order: orderData });
  } else {
    const id = req.query.id;
    res.render("view-order", { id: id, order: orderData });
  }
};
const adminCancelOrder = async (req, res) => {
  const id = req.query.id;
  await Order.deleteOne({ _id: id });
  res.redirect("/admin/view-order");
};
const adminConfirmorder = async (req, res) => {
  const id = req.query.id;
  await Order.updateOne({ _id: id }, { $set: { status: "Comfirmed" } });
  res.redirect("/admin/view-order");
};
const adminDeliveredorder = async (req, res) => {
  const id = req.query.id;
  await Order.updateOne({ _id: id }, { $set: { status: "Delivered" } });
  res.redirect("/admin/view-order");
};

const adminCategory = async (req, res) => {
  try {
    const categoryData = await Category.find();

    res.render("admin-category", { categ: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const category = Category({
      category: req.body.category,
    });
    await category.save();
    res.redirect("/admin/admin-category");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById({ _id: id });

    console.log(id);

    if (categoryData) {
      const id = req.query.id;

      await Category.deleteOne({ _id: id });

      res.redirect("/admin/admin-category");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminOffer = async (req, res) => {
  try {
    const offerData = await Offer.find();
    res.render("admin-offer", { offer: offerData });
  } catch (error) {
    console.log(error.message);
  }
};

const adminStoreOffer = async (req, res) => {
  try {
    const offer = Offer({
      name: req.body.name,
      type: req.body.type,
      discount: req.body.discount,
    });
    await offer.save();
    res.redirect("/admin/admin-offer");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteOffer = async (req, res) => {
  try {
    const id = req.query.id;
    const OfferData = await Offer.findById({ _id: id });

    if (OfferData) {
      const id = req.query.id;
      await Offer.deleteOne({ _id: id });
      res.redirect("/admin/admin-offer");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout = async (req, res) => {
  try {
    adminSession = req.session;
    adminSession.destroy();

    isLoggedin = false;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const random = async (req, res) => {
  try {
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  adminLogin,
  verifyLogin,
  adminProfile,
  adminProducts,
  adminaddProducts,
  loadDashboard,
  blockUser,
  adminLogout,
  addnewProducts,
  editProduct,
  updateProduct,
  deleteProduct,
  viewOrder,
  adminCancelOrder,
  adminConfirmorder,
  adminDeliveredorder,
  adminCategory,
  addCategory,
  deleteCategory,
  deleteUser,
  loadUser,
  adminOffer,
  adminStoreOffer,
  deleteOffer,
  addBanner,
  getBanner,
  deleteBanner,
  softDelete,
  random,
};

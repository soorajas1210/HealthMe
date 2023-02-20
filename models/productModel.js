const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productname: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  image: {
    type: Array,

  },
  quantity: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  pdescription: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("Product", productSchema);

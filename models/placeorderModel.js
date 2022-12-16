const mongoose = require("mongoose");

const placeOrder = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },

  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pin: {
    type: Number,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },
  mobileno: {
    type: String,
    required: true,
  },
  payment: {
    type: String,
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },

  product: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
      price: {
        type: Number,
      },
      quantity: {
        type: Number,
      },
    },
  ],
  totalprice: {
    type: Number,
  },
  status: {
    type: String,
    default: "Build",
  },
  productReturned: [
    {
      type: Number,
    },
  ],
  offer: {
    type: String,
    default: "None",
  },
});

module.exports = mongoose.model("PlaceOrder", placeOrder);

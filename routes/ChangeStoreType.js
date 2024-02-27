const express = require("express");
const router = express.Router();
const Seller = require("../models/Seller");
const logger = require("./Logger//logger");
const ShopifyService = require("shopify-api-node");
const config = require("../config/index");

//#region Discount On Subtotal & Discount On Quantity BM
router.post("/updateDiscountType", async (req, res) => {
  try {
    const { Shop, discountType } = req.body; //  "DiscountOnSubtotal" or "DiscountOnQuantity"
    if (!Shop) {
      return res
        .status(400)
        .send({ status: "error", message: "Please Enter a shop" });
    }
    const _seller = await Seller.findOne(
      { MyShopifyDomain: Shop },
      { MyShopifyDomain: 1, accessToken: 1, storeType: 1 }
    );
    if (!_seller) {
      return res.send({ status: "error", message: "Seller not found" });
    }
    const shopify = ShopifyService({
      shopName: _seller.MyShopifyDomain,
      accessToken: _seller.accessToken,
      apiVersion: config.API_VERSION,
    });

    const myquery = { MyShopifyDomain: _seller.MyShopifyDomain };
    const newvalues = { $set: { storeType: discountType } };
    const updated = await Seller.updateOne(myquery, newvalues);

    try {
      await shopify.metafield.create({
        key: "ThemeSettings",
        value: discountType === "DiscountOnSubtotal" ? true : false,
        type: "boolean",
        namespace: "WDTiered",
      });
    } catch (err) {
      logger.info(
        `(Shop:) ${req.body.Shop}, (Route:) /updateDiscountType, (File:) ChangeStoreType.js, (Error:1) ` +
          err +
          new Date()
      );
    }
    if (updated) {
      return res.send({
        status: "success",
        message: `Successfully converted to ${
          discountType === "DiscountOnSubtotal" ? "subtotal" : "item quantity"
        } discounts`,
      });
    } else {
      logger.info(
        "(Route:) /updateDiscountType, ChangeStoreType.js (Error:2) " +
          `${discountType} Store Type Update Failed` +
          new Date()
      );
      return res.send({
        status: "error",
        message: "Something went wrong during the update.",
      });
    }
  } catch (err) {
    logger.info(
      `(Shop:) ${req.body.Shop}, (Route:) /updateDiscountType, (File:) ChangeStoreType.js, (Error:3) ` +
        err +
        new Date()
    );
    return res
      .status(500)
      .send({
        status: "error",
        message: "Something went wrong, please try again.",
      });
  }
});


//#region Discount On Subtotal & Discount On Quantity Get Api BM
router.get("/getDiscountType", async (req, res) => {
  try {
    const  { Shop }  = req.query;
    if (!Shop) {
      return res
        .status(400)
        .send({ status: "error", message: "Please provide a shop name" });
    }

    const _seller = await Seller.findOne(
      { MyShopifyDomain: Shop },
      { MyShopifyDomain: 1, storeType: 1 }
    );

    if (!_seller) {
      return res.send({ status: "error", message: "Seller not found" });
    }

    return res.send({ status: "success", discountType: _seller.storeType });
  } catch (err) {
    logger.info(
      `(Shop:) ${Shop}, (Route:) /getDiscountType, (File:) ChangeStoreType.js, (Error:1) ` +
        err +
        new Date()
    );
    return res
      .status(500)
      .send({
        status: "error",
        message: "Something went wrong, please try again.",
      });
  }
});

module.exports = router;

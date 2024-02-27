const express = require("express");
const Seller = require("../models/Seller.js");
const ShopifyService = require("shopify-api-node");
const router = express.Router();
const logger = require("./Logger/logger.js");
const config = require("../config/index.js");


//#region Update Enable Disable BM
router.put("/UpdateEnableDisable", async (req, res) => {
    try {
      const { Shop, IsAppEnable } = req.body;
      if (!Shop) {
        return res.status(400).send({ status: "error", message: "Please enter a shop" });
      }
  
      const _seller = await Seller.findOne({ MyShopifyDomain: Shop }, { MyShopifyDomain: 1, accessToken: 1, IsAppEnable: 1 });
  
      if (_seller) {
        await Seller.updateOne({ MyShopifyDomain: Shop }, { $set: { IsAppEnable: !IsAppEnable } });
  
        const shopify = ShopifyService({
          shopName: _seller.MyShopifyDomain,
          accessToken: _seller.accessToken,
          apiVersion: config.API_VERSION
        });
  
        try {
         await shopify.metafield.create({
            key: "EnableDisable",
            value:IsAppEnable ? "false" : "true",
            type:"boolean",
            namespace: "ACPTiered",
          });
          return res.send({ status: "success", message: "Updated successfully" });
        } catch (err) {
          logger.info(`(Shop:) ${req.body.Shop}, (Route:) /UpdateEnableDisable, (File:) AppEnableDisableRoute.js, (Error:1) ` + err + new Date());
        }
      } else {
        return res.status(404).send({ status: "error", message: "Seller not found" });
      }
    } catch (err) {
      logger.info(`(Shop:) ${req.body.Shop}, (Route:) /UpdateEnableDisable, (File:) AppEnableDisableRoute.js, (Error:2) ` + err + new Date());
      return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
    }
  });
  //#region GetEnableDisable BM
router.get("/GetEnableDisable", async (req, res) => {
    try {
      const { Shop } = req.query;
  
      if (!Shop) {
        return res.status(400).send({ status: "error", message: "Please enter a shop", });
      }
  
      const seller = await Seller.findOne({ MyShopifyDomain: Shop }, { IsAppEnable: 1 });
  
      if (!seller) {
        return res.status(400).send({ status: "error", message: "Please enter a shop" });
      }
  
      return res.status(200).send({ status: "success",message: seller.IsAppEnable});
    } catch (err) {
      logger.info(`(Shop:) ${req.query.Shop}, (Route:) /UpdateEnableDisable, (File:) AppEnableDisableRoute.js, (Error:1) ` + err + new Date());
      return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
   
    }
  });

  module.exports = router;
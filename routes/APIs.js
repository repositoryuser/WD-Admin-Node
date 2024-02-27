const express = require("express");
var sleep = require('system-sleep');
const router = express.Router();
const config = require("../config/index.js");
const ShopifyService = require("shopify-api-node");
const Seller = require("../models/Seller.js");
// const GraphQl = require("../helpers/GraphQL");
const CreateTier = require("../helpers/CreateTier");
// const UpdateTier = require("../helpers/UpdateTier");
// const GetCollectionProductsGraphQL = require("../helpers/GetCollectionProductsGraphQL");
// const GetSelectedCustomers = require("../helpers/getSelectedCustomers");
// const ProductSearch_GraphQL = require("../helpers/ProductSearch_GraphQL");
// const getAllVariantsGraphQL = require("../helpers/getAllVariantsGraphQL");
const logger = require('./Logger/logger.js')


//#region Create Customer Tier (db & shopify)
//#region Create Customer Tier (db & shopify)
router.post("/CreateTiers", async function (req, res) {
    let groupType = req.body.groupType, customerList = req.body.customerList,
      entityType = req.body.entity_type, productList = req.body.productList,
      discountType = req.body.discount_type,
      tier_min = req.body.tier_min,
      tier_max = req.body.tier_max,
      tier_values = req.body.tier_values,
      referenceNote = req.body.referenceNote,
      Shop = req.body.Shop, 
      startDate = req.body.startDate,
      endDate = req.body.endDate,
      Location_Tag_ = req.body.Location_Tag,
      DiscountAppliedON = req.body.DiscountApplied;
    let marketRegion = req.body.marketRegion != undefined && req.body.marketRegion != [] ? req.body.marketRegion : [];
  
    
  if(productList.length === 0){
    return res.status(400).send({ status: "error", message: "please select Products" });
  }
  if (customerList.length === 0) {
    return res.status(400).send({ status: "error", message: " please select customers"});
  }
  if (!referenceNote) {
    return res.status(400).send({ status: "error", message: "Please Fill Discount Title "});
  }
  if (tier_min.length === 0) {
    return res.status(400).send({ status: "error", message: "Please Fill discount fields"});
  }
  
    await Seller.findOne({ MyShopifyDomain: Shop })
      .then(async (_seller) => {
        if (_seller != null && _seller != "") {
          let Create_ = {};
          Create_ = await CreateTier.CreateTier(
            _seller,
            Shop,
            groupType,
            customerList,
            entityType,
            productList,
            discountType,
            tier_min,
            tier_max,
            tier_values,
            startDate,
            endDate,
            referenceNote,
            Location_Tag_,
            DiscountAppliedON,
            marketRegion,
    
          );
          if (Create_.PlanExceed) {
            return res.send({ status: "error", message: Create_.message, description: "Tier Not created ", PlanExceed: Create_.PlanExceed, PlanExceedMessage: Create_.PlanExceedMessage });
          } else if (Create_.CollecProductsGet) {
            return res.send({ status: "error", CollecProductsGet: Create_.CollecProductsGet, message: Create_.PlanExceedMessage });
          } else {
            return res.send({ status: "success",  description: "Tier created successfully" });
          }
        } else {
          return res.send({ status: "error", message: "Something went wrong, please try again." });
        }
      })
      .catch((err) => {
        logger.info(`(Shop:) ${req.body.Shop}, (Route:) /CreateTiers, (File:) API.js, (Error:) ` + err + new Date());
        return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
      });
  });


module.exports = router;
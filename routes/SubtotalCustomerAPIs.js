const express = require("express");
const router = express.Router();
const config = require("../config/index");
const ShopifyService = require("shopify-api-node");
const Seller = require("../models/Seller.js");
const logger = require('./Logger/logger.js')

// Create Customer Specific Subtotal Tier BM
router.post("/CreateTiers", async function (req, res) {
    try {
        let _id = req.body._id ? req.body._id : 0,
        group_type = req.body.group_type,
        customerList = req.body.customerList ? req.body.customerList : [],
        discountType = req.body.discount_type,
        DiscountBasedOn = req.body.DiscountBasedOn,
        tier_min = req.body.tier_min,
        tier_max = req.body.tier_max,
        tier_values = req.body.tier_values,
        Shop = req.body.Shop,
        referenceNote = req.body.referenceNote ? req.body.referenceNote : "",
        startDate = req.body.startDate,
        endDate = req.body.endDate,
        discountCodeCoupan = req.body.discountCodeCoupan != undefined ? req.body.discountCodeCoupan : '',
        DiscountAppliedON = req.body.DiscountAppliedON != undefined ? req.body.DiscountAppliedON : '';
    
        const _seller = await Seller.findOne({ MyShopifyDomain: Shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1,SubtotalTiers:1 });

        if (!_seller) {
          return res.status(400).send({ status: "error", message: "Seller not Found" });
        }
          const shopify = ShopifyService({
            shopName: _seller.MyShopifyDomain,
            accessToken: _seller.accessToken,
            apiVersion: config.API_VERSION
          });
    
          let groupName = "", groupDisplayName = "";
          //#region insert customer tag for individual
          if (customerList.length > 0) {
            const firstCustomer = customerList[0];
            groupName = firstCustomer.email != null ? "wd_" + firstCustomer.id : firstCustomer.displayName ;
            groupDisplayName = firstCustomer.email != null ? firstCustomer.email : firstCustomer.displayName ;
          }
        
          try {
            //Create customer tag
            let finalTags = "";
            let finalStr = [];
            let params = { fields: "tags,first_name" };
            let customer_ = await shopify.customer.get(customerList[0].id, params);
            let strarry = customer_.tags.split(",");
            finalStr = strarry.filter(item => !item.includes("wd_"));
            finalStr.push(groupName);
            finalTags = finalStr.join();
            var tags = { tags: finalTags };
            if (customerList[0].email != null) {
              await shopify.customer.update(customerList[0].id, tags);
            }
          } catch (err) {
            logger.info(`(Shop:) ${req.body.Shop}, (Route:) /CreateTiers, (File:) SubtotalCustomerAPIs.js, (Error:1) ` + err + new Date());         
          }
    
          let AlreadyExistTierId = 0; //If already created on same group
          if (_seller.SubtotalTiers.length > 0) {
            for (const SubtotalTiersItem of _seller.SubtotalTiers) {
                if (SubtotalTiersItem.group_name === groupDisplayName) {
                    AlreadyExistTierId = SubtotalTiersItem._id;
                    _id = AlreadyExistTierId;
                    break; // Exit the loop once the item is found
                }
            }
            
          }
          try {
            const CustomerSubtotalMF = await shopify.metafield.list({
              namespace: "WDTiered",
              key: "CustomerTiers",
              fields: 'value,id,namespace,key'
            });
            let ParsedCustomerMF = [];
            let finalMetafield = [];
            if (CustomerSubtotalMF.length > 0) {
              ParsedCustomerMF = JSON.parse(CustomerSubtotalMF[0].value);
            }
          
            finalMetafield = ParsedCustomerMF.filter(item => item.tag !== groupName);

            let metafield_obj = {};
              metafield_obj.tag = groupName;
              metafield_obj.tier = {
              discount_type: discountType,
              discountCodeCoupan:discountCodeCoupan != undefined ? discountCodeCoupan : '',
              DiscountAppliedON:DiscountAppliedON != undefined ? DiscountAppliedON : '',
              status: true,
              DiscountBasedOn:DiscountBasedOn,
              tier_min: tier_min,
              tier_max: tier_max,
              tier_values: tier_values,
              start_date: startDate != null ? startDate : null,
              end_date: endDate != null ? endDate : null,
            };
            finalMetafield.push(metafield_obj);
    
            var tiertosend = JSON.stringify(finalMetafield);
              await shopify.metafield.create({
              namespace: "WDTiered",
              key: "CustomerTiers",
              type: "json",
              value: tiertosend,
            });
    
            var myquery = { MyShopifyDomain: Shop };
            var newvalues = {};
            if (AlreadyExistTierId  && _id ) {
              myquery = { MyShopifyDomain: Shop, "SubtotalTiers._id": _id };
              var newvalues = {
                $set: {
                  "SubtotalTiers.$.group_name": groupDisplayName,
                  "SubtotalTiers.$.discountCodeCoupan": discountCodeCoupan != undefined ? discountCodeCoupan : "",
                  "SubtotalTiers.$.DiscountAppliedON": DiscountAppliedON != undefined ? DiscountAppliedON : "",
                  "SubtotalTiers.$.group_type": group_type,
                  "SubtotalTiers.$.wd_tag": groupName,
                  "SubtotalTiers.$.tier_min": tier_min,
                  "SubtotalTiers.$.tier_max": tier_max,
                  "SubtotalTiers.$.tier_values": tier_values,
                  "SubtotalTiers.$.tier_name": referenceNote,
                  "SubtotalTiers.$.DiscountBasedOn": DiscountBasedOn,
                  "SubtotalTiers.$.discount_type": discountType,
                  "SubtotalTiers.$.created_date": new Date(),
                  "SubtotalTiers.$.start_date":
                   startDate != null ? startDate : null,
                  "SubtotalTiers.$.end_date": endDate != null ? endDate : null,
                },
              };
            } else {
              newvalues = {
                $addToSet: {
                  SubtotalTiers: {
                    group_name: groupDisplayName,
                    discountCodeCoupan:discountCodeCoupan != undefined ? discountCodeCoupan: '',
                    DiscountAppliedON:DiscountAppliedON != undefined ? DiscountAppliedON: '',
                    group_type: group_type,
                    wd_tag: groupName,
                    tier_min: tier_min,
                    tier_max: tier_max,
                    tier_values: tier_values,
                    tier_name: referenceNote,
                    tier_status: true,
                    discount_type: discountType,
                    DiscountBasedOn:DiscountBasedOn,
                    created_date: new Date(),
                    start_date: startDate != null ? startDate : null,
                    end_date: endDate != null ? endDate : null,
                  },
                },
              };
            }
    
            const dbcreate = await Seller.updateOne(myquery, newvalues);
            if (dbcreate) {
               return res.send({ status:"success" , message:" Subtotal Tier created successfully"});           
            }
          } catch (e) {
            logger.info(`(Shop:) ${req.body.Shop}, (Route:) /CreateTiers, (File:) SubtotalCustomerAPIs.js, (Error:2) ` + e + new Date());    
          }
      
    
    } catch (err) {
        logger.info(`(Shop:) ${req.body.Shop}, (Route:) /CreateTiers, (File:) SubtotalCustomerAPIs.js, (Error:3) ` + err + new Date());
        return res.status(400).send({ status: "error", message: "Something went wrong, please try again." });   
    }
    
});

module.exports = router;

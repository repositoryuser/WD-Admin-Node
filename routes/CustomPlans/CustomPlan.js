const express = require("express");
const router = express.Router();
const logger = require("../Logger/logger");
const Seller =require("../../models/Seller");
const CustomPlan = require("../../models/Customplan");

router.post("/createPlan", async (req, res) => {
    try {
      const { storeUrl ,planValue, planName,isSubscribed,isDowngrad,PlanDiscription  } = req.body;

      const seller = await Seller.findOne({ MyShopifyDomain: storeUrl });
      if(!seller){
        return res.status(404).send({ status: "error", message: "Seller with this storeUrl domain not find. Enter valid domain " });
      }else{
        const CustomPlanseller = await CustomPlan.find({ MyShopifyDomain: storeUrl });
        if(CustomPlanseller.length > 0 ){
            const  plan ={
                MyShopifyDomain : storeUrl,
                planValue : Number(planValue),
                planName : planName,
                isSubscribed :isSubscribed,
                isDowngrade : isDowngrad ,
                active: false,
                Discription :PlanDiscription,
                isCustomer : true
          }
          let UpdatedData  = await CustomPlan.findOneAndUpdate({ MyShopifyDomain: storeUrl },plan)
          return res.status(200).send({ status: "success",message: "Custom Plan Updated Successfully"});
        }else{
            const  plan = new CustomPlan({
                MyShopifyDomain : storeUrl,
                planValue : Number(planValue),
                planName : planName,
                isSubscribed :isSubscribed,
                isDowngrade : isDowngrad ,
                active: false,
                Discription :PlanDiscription,
                isCustomer : true
          })
          let result=await plan.save() ;
          return res.status(200).send({ status: "success",message: "Custom Plan Created Successfully"});
        }
    }
      
    } catch (err) {
      logger.info(`(Shop:) ${req.body.ShopUrl}, (Route:) /UpdateEnableDisable, (File:) AppEnableDisableRoute.js, (Error:1) ` + err + new Date());
      return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
   
    }
  });

  router.post("/updateStatus", async (req, res) => {
    try {
      const { storeUrl ,isCustomer } = req.body;

      const seller = await Seller.findOne({ MyShopifyDomain: storeUrl });
      if(!seller){
        return res.status(404).send({ status: "error", message: "Seller with this storeUrl domain not find. Enter valid domain " });
      }else{
        const CustomPlanseller = await CustomPlan.find({ MyShopifyDomain: storeUrl });
        if(CustomPlanseller.length > 0 ){
            const  plan ={
                isCustomer : isCustomer
          }
          let UpdatedData  = await CustomPlan.findOneAndUpdate({ MyShopifyDomain: storeUrl },plan)
          return res.status(200).send({ status: "success",message: "Custom Plan Updated Successfully"});
        }else{
          return res.status(400).send({ status: "error",message: "Sellar not Fount with this Domain !"});
        }
    }
      
    } catch (err) {
      logger.info(`(Shop:) ${req.body.ShopUrl}, (Route:) /UpdateEnableDisable, (File:) AppEnableDisableRoute.js, (Error:1) ` + err + new Date());
      return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
   
    }
  });

  router.get("/getAllCustomPlans", async (req, res) => {
    try {
     let allSellerData =await CustomPlan.find();
      if(!allSellerData){
        return res.status(404).send({ status: "error", message: "Seller with this storeUrl domain not find. Enter valid domain " });
      }
      return res.status(200).send({ status: "success",data:allSellerData });
    } catch (err) {
      logger.info(`(Shop:) ${req.body.ShopUrl}, (Route:) /UpdateEnableDisable, (File:) AppEnableDisableRoute.js, (Error:1) ` + err + new Date());
      return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
   
    }
  });
  

  


  module.exports = router;


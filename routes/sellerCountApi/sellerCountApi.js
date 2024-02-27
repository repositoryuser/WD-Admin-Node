const express = require('express');
const router = express.Router();
const seller= require('../../models/Seller');
const logger = require("../Logger/logger");
require('dotenv').config();
// plan name
const plan1 = process.env.PLAN1;
const plan2 = process.env.PLAN2;
const plan3 = process.env.PLAN3;
const plan4 = process.env.PLAN4;

// plan price
const planPrice1 = process.env.PLAN1PRICE;
const planPrice2 = process.env.PLAN2PRICE;
const planPrice3 = process.env.PLAN3PRICE;
const planPrice4 = process.env.PLAN4PRICE;



router.get("/SellerCountApi", async (req, res) => {
    try {
        const { startDate,endDate } = req.query;//2024-02-11T18:30:00.000Z
        let formattedStartDate =  new Date(startDate);
        let formattedEndDate =  new Date(endDate);

        // Get today's date and the date 30 days ago
        const today = new Date();

        // Get the start and end of the current day
        const startOfDay = new Date(formattedStartDate.getFullYear(), formattedStartDate.getMonth(), formattedStartDate.getDate());
        const endOfDay = new Date(formattedEndDate.getFullYear(), formattedEndDate.getMonth(), formattedEndDate.getDate() + 1, 0, 0, -1);
         // Get the total number of sellers
         const totalSellers = await seller.countDocuments({'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});

          // Get the number of active and inactive sellers
        const activeSellers = await seller.countDocuments({ InstallStatus: true ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
        const inactiveSellers = await seller.countDocuments({ InstallStatus: false ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});

         // Get the number of sellers for each plan type
         const starterSellers = await seller.countDocuments({ plan: 1 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
         const plusSellers = await seller.countDocuments({ plan: 2 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
         const proSellers = await seller.countDocuments({ plan: 3 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
         const enterpriseSellers = await seller.countDocuments({ plan: 4 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
         // Get the number of sellers for each plan type installStatus =true
         const activeStarterSellers = await seller.countDocuments({InstallStatus: true, plan: 1 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
         const activePowehoseSellers = await seller.countDocuments({InstallStatus: true, plan: 2 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
         const activeEnterpriseSellers = await seller.countDocuments({ InstallStatus: true,plan: 3 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
         const activePlusSellers = await seller.countDocuments({InstallStatus: true,plan: 4 ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
 
         // Get the number of active sellers today
         let activeToday = await seller.countDocuments({ installDate: { $gte: startOfDay, $lt: endOfDay }, InstallStatus: true ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
 
         // Get the number of inactive sellers today 
         let inactiveToday = await seller.countDocuments({ installDate: { $gte: startOfDay, $lt: endOfDay }, InstallStatus: false ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
 
         // Get the total number of sellers today 
         let totalToday = await seller.countDocuments({ installDate: { $gte: startOfDay, $lt: endOfDay } ,'shopDetails.plan_name':{ $nin: [ "partner_test", "staff", "affiliate" ] }});
             
         //count 
         const count = await seller.estimatedDocumentCount({});
         console.log("count: ", count);

         // Create an object with seller and plan information
        let info = {
            SellerInfo: [
                { title: "Active Sellers", total: activeSellers, status: "active", today: activeToday },
                { title: "Inactive Sellers", total: inactiveSellers, status: "InActive", today: inactiveToday },
                { title: "Total Sellers", total: totalSellers, status: "total", today: totalToday },
            ],
            planInfo: [
                { title: plan1, total: starterSellers, price: planPrice1, currency: "USD", amount: activeStarterSellers * planPrice1 ,totalActive:activeStarterSellers},
                { title: plan2, total: plusSellers, price: planPrice2, currency: "USD", amount: activePowehoseSellers * planPrice2 ,totalActive:activePowehoseSellers},
                { title: plan3, total: proSellers, price: planPrice3, currency: "USD", amount: activeEnterpriseSellers * planPrice3 ,totalActive:activeEnterpriseSellers},
                { title: plan4, total: enterpriseSellers, price: planPrice4, currency: "USD", amount: activePlusSellers * planPrice4 ,totalActive:activePlusSellers},
            ],
        }; 
        res.json({ status: "success", info });


    } catch (error) {
        console.log("error: ", error);
        logger.error(`(Route: "/SellerCountApi") (File: "/routes/sellerCountApi/sellerCountApi.js")  ${new Date()} Error: `, error);
    }
})


module.exports = router;
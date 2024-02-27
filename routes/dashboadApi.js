const express = require('express');
const router = express.Router();
const seller= require('../models/Seller');
const logger = require("./Logger/logger");


//get seller
router.get("/getAllSeller", async (req, res) => {
    try {
    let query = req.body.searchValue;
    let offset = req.body.offset || 0;
    let limit = req.body.limit  || 10;
    var options = {
        select: { MyShopifyDomain: 1, installDate: 1, InstallStatus: 1, Host: 1, ThemeSettings: 1, CurrentTheme: 1, shopDetails: 1, plan: 1, installHistory: 1 },
        offset: offset,
        limit: limit,
        sort: { installDate: -1 },
      };
    if ( query != null && query != "" ) {
        let sellerData = await seller.paginate({ MyShopifyDomain: new RegExp(query, "i") }, options );
        return res.json({ status: "success", sellerData });
        
    } else {
        let sellerData = await seller.paginate({}, options );

        return res.json({ status: "success", sellerData });

    }
        
    } catch (error) {
        console.log("error: ", error);
        logger.error(`(Route: "/getAllSeller") (File: "/routes/dashboardApi.js")  ${new Date()} Error: `, error);
    }
})

module.exports = router
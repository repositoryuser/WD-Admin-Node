const Seller = require("../models/Seller.js");
const ShopifyService = require("shopify-api-node");
const config = require("../config/index");
const ValidatePlan = require("../helpers/ValidatePlan.js");
const { totalCollectionproductCount } = require("../routes/GlobalFunctions/Globalfunction.js");
const { logger } = require('../routes/Logger/logger.js');


const CreateTier = async (_seller, Shop, groupType, customerList, entityType, productList, discountType, tier_min, tier_max, tier_values,startDate, endDate, referenceNote, Location_Tag_, DiscountAppliedON, marketRegion,mostPopularValues) => {
    try {
        let flagPlanExceeds = false;
        let CollecProductsGet = false;

        // Define the number of products processed so far

        const shopify = new ShopifyService({ 
            shopName: Shop,
            accessToken: _seller.accessToken, 
            apiVersion: config.API_VERSION 
        });
        //#region Title And Group Name
        let groupName = customerList[0].email != null ? 'wd_' + customerList[0].id : customerList[0].displayName;
        let groupDisplayName = customerList[0].email != null ? customerList[0].email : customerList[0].displayName;
        let entity_name = '';

        try { //Create customer tag
            let finalTags = '';
            let finalStr = [];
            let params = { fields: "tags,first_name" };
            let customer_ = '';
            let strarry = [];
            if (customerList[0].displayName.includes('wd_')) {
                customer_ = await shopify.customer.get(customerList[0].id, params);
                strarry = customer_.tags.split(',');
            }


            if (groupType == 'Individuals_Customer') {
                var metafields_obj = {};
                let metaLtist = await shopify.metafield.list(
                    {
                        key: 'Tags',
                        namespace: 'WDTiered',
                        fields: 'value,id,namespace,key'
                    }
                );

                let tempTagArray = [];
                if (metaLtist != null && metaLtist.length > 0) {

                    let Temp = metaLtist[0].value
                    // console.log(Temp)

                    let temp1 = JSON.parse(Temp);
                    tempTagArray = temp1.Tags;
                    if (!tempTagArray.includes(groupName)) {
                        tempTagArray.push(groupName);
                    }

                    metafields_obj.Tags = tempTagArray;
                }
                else {
                    tempTagArray.push(groupName);
                    metafields_obj.Tags = tempTagArray;
                }

                var automaticsend = JSON.stringify(metafields_obj);

                let createdMetafield = await shopify.metafield.create({
                    namespace: 'WDTiered',
                    key: 'Tags',
                    value: automaticsend,
                    type: "json",
                });
            }

            for (var arr = 0; arr < strarry.length; arr++) {
                if (!(strarry[arr].includes("wd_")))
                    finalStr.push(strarry[arr])
            }
            finalStr.push(groupName)
            finalTags = finalStr.join();
            var tags = { tags: finalTags }
            if (customerList[0].email != null) {
                var customer_tags = await shopify.customer.update(customerList[0].id, tags);
            }
        }
        catch (err) {
            console.log(err);
            logger.info("(Route:) /helper, (File:) CreateTier.js, (Error:1) " + err + new Date());


        }

        if (productList.length == 1) { //entity name - Title vs Multiple
            entity_name = productList[productList.length - 1].title;
        }
        else {
            if (entityType == 'products') {
                if (productList == 'AllProducts') {
                    entity_name = 'AllProducts';
                } else {
                    entity_name = 'Multiple Products';
                }
            }
            else if (entityType == 'variants') { entity_name = 'Multiple Variants'; }
            else if (entityType == 'collections') { entity_name = 'Multiple Collections'; }
        }
        //#endregion
        async function CustomSleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
        let product_ids = [], entity_ids = [];
        if (productList == 'AllProducts') {
            if (entityType == 'products') {
                try {
                    //  console.log('---inside products') 

                    var CheckParentTier = false;
                    var metafield_id = 0;
                    for (var check = 0; check < _seller.TierObject.length; check++) {
                        var ProductObjectWithMetaIdArr = _seller.TierObject[check].entity_products;
                        for (var check2 = 0; check2 < ProductObjectWithMetaIdArr.length; check2++) {
                            if (_seller.TierObject[check].entity_name == productList) {
                                metafield_id = ProductObjectWithMetaIdArr[check2].metafield_id;
                            }
                        }
                    }
                    var finalMetafield = [];
                    // console.log('metafield_id found')
                    if (metafield_id != 0) {
                        var GetMetafield = await shopify.metafield.get(metafield_id, { fields: 'value,id,namespace,key' });
                        // console.log(GetMetafield.value)
                        var ParsedMetefield = JSON.parse(GetMetafield.value);

                        //looping to each metafield object
                        for (var m = 0; m < ParsedMetefield.length; m++) {
                            if (ParsedMetefield[m].tag != groupName) {
                                finalMetafield.push(ParsedMetefield[m]);
                                CheckParentTier = true;
                            }
                            if (ParsedMetefield[m].tag == groupName) {
                                if (ParsedMetefield[m].tier.entity_type == "products") {
                                    CheckParentTier = true;
                                }
                                else {
                                    CheckParentTier = false;
                                }
                            }
                        }
                        // console.log(finalMetafield)
                    }
                    else {
                        CheckParentTier = true;
                    }
                    var metafield_obj = {};
                    metafield_obj.tag = groupName;
                    Location_Tag_ = Location_Tag_ != "" && Location_Tag_ != null && Location_Tag_ != undefined ? Location_Tag_ : null;
                    DiscountAppliedON = DiscountAppliedON != "" && DiscountAppliedON != null && DiscountAppliedON != undefined ? DiscountAppliedON : null;
                    metafield_obj.tier = { entity_type: entityType, discount_type: discountType, status: true, tier_min: tier_min,mostPopularValues:mostPopularValues, tier_max: tier_max, tier_values: tier_values, start_date: startDate != null ? startDate : null, end_date: endDate != null ? endDate : null, Location_Tag_: Location_Tag_, DiscountAppliedON: DiscountAppliedON, marketRegion: marketRegion }//, isFree: isFree, freeProduct: freeProduct, freeQuantity: freeQuantity 
                    if (CheckParentTier) {
                        finalMetafield.push(metafield_obj);
                        var tiertosend = JSON.stringify(finalMetafield);


                        let planValue = false;

                        try {

                            let currentPlan = await _seller.plan;
                            flagPlanExceeds = true;
                            let planCount = 0;
                            if (currentPlan == 4 || currentPlan == 5) {
                                planValue = true;
                                flagPlanExceeds = false;
                            } else {

                                switch (currentPlan) {
                                    case 1: planCount = config.PLAN1COUNT; break; case 2: planCount = config.PLAN2COUNT; break; case 3: planCount = config.PLAN3COUNT; break; case 4: planCount = config.PLAN4COUNT; break; case 5: planCount = config.PLAN5COUNT; break;
                                }
                                let params = { limit: 250 };
                                let AllProductsStore = 0;
                                //  do {
                                const Shopify_Store_Products = await shopify.product.count();
                                AllProductsStore = Shopify_Store_Products
                    

                                if ((AllProductsStore == config.PLAN1COUNT || AllProductsStore < config.PLAN1COUNT) && currentPlan == 1) {
                                    planValue = true;
                                    flagPlanExceeds = false;
                                } else if ((AllProductsStore == config.PLAN2COUNT || AllProductsStore < config.PLAN2COUNT) && currentPlan == 2) {
                                    planValue = true;
                                    flagPlanExceeds = false;
                                } else if ((AllProductsStore == config.PLAN3COUNT || AllProductsStore < config.PLAN3COUNT) && currentPlan == 3) {
                                    planValue = true;
                                    flagPlanExceeds = false;
                                }
                            }

                        } catch (error) {
                            logger.info("(Route:) /helper, (File:) CreateTier.js, (Error:1) " + error + new Date());
                        }

                        if (planValue && CheckParentTier) {
                            var createdMetafield = await shopify.metafield.create({
                                namespace: 'WDTiered',
                                key: 'CustomerTiersAllProducts',
                                value: `${tiertosend}`,
                                type: "json",
                            });
                            // console.log(createdMetafield)
                        }

                        var tempGroupName = groupType == 'Individuals_Customer' ? groupDisplayName : groupName;
                        for (var check = 0; check < _seller.TierObject.length; check++) {
                            if (_seller.TierObject[check].group_name == tempGroupName) {
                              
                                var db_ids_array = _seller.TierObject[check].entity_type_ids; var final_ids_to_push = [];
                                var flagVariant = false;           

                                // console.log(final_ids_to_push)
                                if ((_seller.TierObject[check].entity_type_ids.indexOf(createdMetafield.id) != -1)) {
                                    if (final_ids_to_push.length == 0) {
                                        //Delete object
                                        var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: createdMetafield.id } } });
                                    }
                                    else {
                                        //delete ids
                                        var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": createdMetafield.id, "TierObject.group_name": tempGroupName };
                                        var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                        var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                        var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { metafield_id: createdMetafield.id } } });
                                    }
                                }
                                if (flagVariant) {
                                    if (final_ids_to_push.length == 0) {
                                        var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: { $in: createdMetafield.id } } } });
                                    }
                                    else {
                                        //delete ids
                                        for (var h = 0; h < prdct_variant_ids.length; h++) {
                                            var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": prdct_variant_ids[h], "TierObject.group_name": tempGroupName };
                                            var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                            var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                            var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: productList[i].id } } });
                                        }
                                    }
                                }
                            }
                        }

                        if (planValue) {
                            product_ids.push({
                                metafield_id: createdMetafield.id
                            });
                            entity_ids.push(createdMetafield.id);
                        }
                    }
                }
                catch (err) {
                    logger.info("(Route:) /helper, (File:) CreateTier.js, (Error:) " + err + new Date());
                }

            }
        } else {
            for (var i = 0; i < productList.length; i++) { //Create Tiers Product/Variant/Collection wise
                var product_with_same_group_NotFound = true;
                for (var check = 0; check < _seller.TierObject.length; check++) {
                    if ((_seller.TierObject[check].entity_type_ids.indexOf(productList[i].id) != -1) && _seller.TierObject[check].group_name == groupDisplayName) {
                        product_with_same_group_NotFound = false;
                    }
                }
                if (entityType == 'products') {
                    try {
                        //  console.log('---inside products') 

                        //Get product variant ids
                        var prdct_variant_ids = [];
                        var variantObject = await shopify.product.get(productList[i].id, { fields: 'variants' });
                        var t = variantObject.variants;
                        for (var v = 0; v < t.length; v++) {
                            prdct_variant_ids.push(t[v].id);
                        }

                        var CheckParentTier = false;
                        var metafield_id = 0;
                        for (var check = 0; check < _seller.TierObject.length; check++) {
                            var ProductObjectWithMetaIdArr = _seller.TierObject[check].entity_products;
                            for (var check2 = 0; check2 < ProductObjectWithMetaIdArr.length; check2++) {
                                if (ProductObjectWithMetaIdArr[check2].product_id == productList[i].id) {
                                    metafield_id = ProductObjectWithMetaIdArr[check2].metafield_id;
                                }
                            }
                        }
                        var finalMetafield = [];
                        // console.log('metafield_id found')
                        // console.log(metafield_id)
                        if (metafield_id != 0) {
                            var GetMetafield = await shopify.metafield.get(metafield_id, { fields: 'value,id,namespace,key' });
                            // console.log(GetMetafield.value)
                            var ParsedMetefield = JSON.parse(GetMetafield.value);
                            // console.log(ParsedMetefield)

                            //looping to each metafield object
                            for (var m = 0; m < ParsedMetefield.length; m++) {
                                if (ParsedMetefield[m].tag != groupName) {
                                    finalMetafield.push(ParsedMetefield[m]);
                                    CheckParentTier = true;
                                }
                                if (ParsedMetefield[m].tag == groupName) {
                                    if (ParsedMetefield[m].tier.entity_type == "products" || ParsedMetefield[m].tier.entity_type == "variants") {
                                        CheckParentTier = true;
                                    }
                                    else {
                                        CheckParentTier = false;
                                    }
                                }
                            }
                            // console.log(finalMetafield)
                        }
                        else {
                            CheckParentTier = true;
                        }
                        var metafield_obj = {};
                        metafield_obj.tag = groupName;
                        Location_Tag_ = Location_Tag_ != "" && Location_Tag_ != null && Location_Tag_ != undefined ? Location_Tag_ : null;
                        DiscountAppliedON = DiscountAppliedON != "" && DiscountAppliedON != null && DiscountAppliedON != undefined ? DiscountAppliedON : null;
                        metafield_obj.tier = { entity_type: entityType, discount_type: discountType, status: true, tier_min: tier_min, mostPopularValues:mostPopularValues,tier_max: tier_max, tier_values: tier_values, start_date: startDate != null ? startDate : null, end_date: endDate != null ? endDate : null, Location_Tag_: Location_Tag_, DiscountAppliedON: DiscountAppliedON, marketRegion: marketRegion }
                        if (CheckParentTier) {
                            finalMetafield.push(metafield_obj);
                            var tiertosend = JSON.stringify(finalMetafield);
                            var planValue = await ValidatePlan.ValidatePlan(Shop, productList[i].id, 'insert');
                            if (!planValue) { flagPlanExceeds = true; }

                            if (planValue) {
                                var createdMetafield = await shopify.metafield.create({
                                    namespace: 'WDTiered',
                                    key: 'CustomerTiers',
                                    value: `${tiertosend}`,
                                    type: "json",
                                    owner_resource: 'product',
                                    owner_id: productList[i].id
                                });
                                // console.log(createdMetafield)
                            }

                            var tempGroupName = groupType == 'Individuals_Customer' ? groupDisplayName : groupName;
                            for (var check = 0; check < _seller.TierObject.length; check++) {
                                if (_seller.TierObject[check].group_name == tempGroupName) {
                                    // if((_seller.TierObject[check].entity_type_ids.indexOf(productList[i].id) != -1) ){
                                    // console.log(_seller.TierObject[check]._id);
                                    var db_ids_array = _seller.TierObject[check].entity_type_ids; var final_ids_to_push = [];
                                    var flagVariant = false;
                                    for (var u = 0; u < db_ids_array.length; u++) {
                                        if ((_seller.TierObject[check].entity_type_ids.indexOf(productList[i].id) != -1)) {
                                            if (db_ids_array[u] != productList[i].id) {
                                                final_ids_to_push.push(db_ids_array[u]);
                                            }
                                            else {
                                                await ValidatePlan.ValidatePlan(Shop, productList[i].id, 'delete');
                                            }
                                        }
                                        if (_seller.TierObject[check].entity_type == "variants") {
                                            // for(var pv = 0; pv < db_ids_array.length; pv++){
                                            flagVariant = true;
                                            // if(prdct_variant_ids.indexOf(db_ids_array[u]) == -1){
                                            if (prdct_variant_ids.indexOf(db_ids_array[u]) == -1) {
                                                final_ids_to_push.push(db_ids_array[u]);
                                            }
                                            else {
                                                await ValidatePlan.ValidatePlan(Shop, productList[i].id, 'delete');
                                            }
                                            // }
                                        }
                                    }
                                    // console.log(final_ids_to_push)
                                    if ((_seller.TierObject[check].entity_type_ids.indexOf(productList[i].id) != -1)) {
                                        if (final_ids_to_push.length == 0) {
                                            // final_ids_to_push.push(productList[i].id);
                                            //Delete object
                                            var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: productList[i].id } } });
                                        }
                                        else {
                                            //delete ids
                                            var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": productList[i].id, "TierObject.group_name": tempGroupName };
                                            var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                            var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                            var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: productList[i].id } } });
                                        }
                                    }
                                    if (flagVariant) {
                                        if (final_ids_to_push.length == 0) {
                                            var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: { $in: prdct_variant_ids } } } });
                                        }
                                        else {
                                            //delete ids
                                            for (var h = 0; h < prdct_variant_ids.length; h++) {
                                                var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": prdct_variant_ids[h], "TierObject.group_name": tempGroupName };
                                                var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                                var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                                var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: productList[i].id } } });
                                            }
                                        }
                                    }
                                }
                            }

                            if (planValue) {
                                product_ids.push({
                                    product_id: productList[i].id,
                                    metafield_id: createdMetafield.id
                                });
                                entity_ids.push(productList[i].id);
                            }
                        }
                    }
                    catch (err) {
                        logger.info("(Route:) /helper, (File:) CreateTier.js, (Error:) " + err + new Date());
                    }

                }
                else if (entityType == 'variants') {
                    // console.log('---inside variants')
                    var CheckParentTier = false;
                    try {
                        var product_variant_ids = []; var _productId = productList[i].pId;
                        for (var v = 0; v < productList[i].variants.length; v++) { //looping to each product variant
                            if (product_with_same_group_NotFound) {
                                product_variant_ids.push(Number(productList[i].variants[v].id))
                            }
                        }

                        var metafield_id = 0;
                        for (var check = 0; check < _seller.TierObject.length; check++) {
                            var ProductObjectWithMetaIdArr = _seller.TierObject[check].entity_products;
                            for (var check2 = 0; check2 < ProductObjectWithMetaIdArr.length; check2++) {
                                if (ProductObjectWithMetaIdArr[check2].product_id == _productId) {
                                    metafield_id = ProductObjectWithMetaIdArr[check2].metafield_id;
                                }
                            }
                        }
                        var finalMetafield = [], existingMetafield = [];
                        if (metafield_id != 0) {
                            var GetMetafield = await shopify.metafield.get(metafield_id, { fields: 'value,id,namespace,key' });
                            // console.log(GetMetafield.value)
                            var ParsedMetefield = JSON.parse(GetMetafield.value);
                            //looping to each metafield object
                            for (var m = 0; m < ParsedMetefield.length; m++) {
                                if (ParsedMetefield[m].tag != groupName) {
                                    finalMetafield.push(ParsedMetefield[m]);
                                    CheckParentTier = true;
                                }
                                else {
                                    existingMetafield.push(ParsedMetefield[m])
                                    if (ParsedMetefield[m].tier.entity_type == "variants") {
                                        CheckParentTier = true;
                                    }
                                    else {
                                        CheckParentTier = false;
                                    }
                                }
                            }
                            // console.log(finalMetafield)
                        }
                        else {
                            CheckParentTier = true;
                        }
                        var metafield_obj = {}; var planValue = false;
                        var variant_ids_arr = [], discountType_arr = [], status_arr = [], tier_min_arr = [],mostPopularValues_arr=[], tier_max_arr = [], tier_values_arr = [], startDate_arr = [], endDate_arr = [], Location_Tag_arr = [], DiscountAppliedON_arr = [], marketRegion_rr = [];
                        // console.log('for 1 = ' + i);

                        if (existingMetafield.length > 0) {
                            for (var m = 0; m < existingMetafield[0].tier.variant_ids.length; m++) {
                                if (product_variant_ids.indexOf(existingMetafield[0].tier.variant_ids[m]) == -1) {
                                    variant_ids_arr.push(existingMetafield[0].tier.variant_ids[m])
                                    discountType_arr.push(existingMetafield[0].tier.discount_type[m])
                                    status_arr.push(existingMetafield[0].tier.status[m])
                                    tier_min_arr.push(existingMetafield[0].tier.tier_min[m])
                                    mostPopularValues_arr.push(existingMetafield[0].tier.mostPopularValues[m])
                                    tier_max_arr.push(existingMetafield[0].tier.tier_max[m])
                                    tier_values_arr.push(existingMetafield[0].tier.tier_values[m])
                                    startDate_arr.push(existingMetafield[0].tier.start_date[m])
                                    endDate_arr.push(existingMetafield[0].tier.end_date[m])
                                    Location_Tag_arr.push(existingMetafield[0].tier.Location_Tag_ != null && existingMetafield[0].tier.Location_Tag_ != undefined ? existingMetafield[0].tier.Location_Tag_[m] : null);
                                    DiscountAppliedON_arr.push(existingMetafield[0].tier.DiscountAppliedON != null && existingMetafield[0].tier.DiscountAppliedON != undefined ? existingMetafield[0].tier.DiscountAppliedON[m] : null);
                                    marketRegion_rr.push(existingMetafield[0].tier.marketRegion != null && existingMetafield[0].tier.marketRegion != undefined ? existingMetafield[0].tier.marketRegion[m] : []);



                                }
                            }
                        }

                        for (var v = 0; v < product_variant_ids.length; v++) {
                            // console.log('for 2 = ' + v);

                            planValue = await ValidatePlan.ValidatePlan(Shop, _productId, 'insert');
                            if (!planValue) { flagPlanExceeds = true; }
                            variant_ids_arr.push(product_variant_ids[v]);
                            discountType_arr.push(discountType);
                            status_arr.push(true);
                            tier_min_arr.push(tier_min);
                            mostPopularValues_arr.push(mostPopularValues);
                            tier_max_arr.push(tier_max);
                            tier_values_arr.push(tier_values);
                            startDate_arr.push(startDate != null ? startDate : null);
                            endDate_arr.push(endDate != null ? endDate : null);
                            Location_Tag_arr.push(Location_Tag_ != null && Location_Tag_ != "" ? Location_Tag_ : null)
                            DiscountAppliedON_arr.push(DiscountAppliedON != null && DiscountAppliedON != "" ? DiscountAppliedON : null)
                            marketRegion_rr.push(marketRegion != null && marketRegion != "" ? marketRegion : []);
                        }
                        metafield_obj.tag = groupName;
                        Location_Tag_ = Location_Tag_ != "" && Location_Tag_ != null && Location_Tag_ != undefined ? Location_Tag_ : null;
                        DiscountAppliedON = DiscountAppliedON != "" && DiscountAppliedON != null && DiscountAppliedON != undefined ? DiscountAppliedON : null;

                        metafield_obj.tier = {
                            variant_ids: variant_ids_arr,
                            entity_type: entityType,
                            discount_type: discountType_arr,
                            status: status_arr,
                            mostPopularValues: mostPopularValues_arr,
                            tier_min: tier_min_arr,
                            tier_max: tier_max_arr,
                            tier_values: tier_values_arr,
                            start_date: startDate_arr,
                            end_date: endDate_arr,
                            Location_Tag_: Location_Tag_arr,
                            DiscountAppliedON: DiscountAppliedON_arr,
                            marketRegion: marketRegion_rr,
                        }
                        // console.log('------------metafield_obj')
                        // console.log(metafield_obj)
                        if (CheckParentTier) {
                            finalMetafield.push(metafield_obj);
                            var tiertosend = JSON.stringify(finalMetafield);
                            if (planValue) {
                                var createdMetafield = await shopify.metafield.create({
                                    namespace: 'WDTiered',
                                    key: 'CustomerTiers',
                                    value: `${tiertosend}`,
                                    type: "json",
                                    owner_resource: 'product',
                                    owner_id: _productId
                                });
                            }
                            // console.log(createdMetafield)
                            var tempGroupName = groupType == 'Individuals_Customer' ? groupDisplayName : groupName;
                            //delete existing variants from db
                            for (var check = 0; check < _seller.TierObject.length; check++) {
                                if (_seller.TierObject[check].group_name == tempGroupName) {
                                    var db_ids_array = _seller.TierObject[check].entity_type_ids; var final_ids_to_push = [];
                                    var flagVariant = false;
                                    var condition = false;
                                    for (var x = 0; x < product_variant_ids.length; x++) {
                                        if (_seller.TierObject[check].entity_type == "variants") {
                                            if (db_ids_array.indexOf(product_variant_ids[x]) != -1) { //current v_id found in db for this loop
                                                condition = true;
                                            }
                                        }
                                    }
                                    if (condition) {
                                        for (var u = 0; u < db_ids_array.length; u++) {
                                            flagVariant = true;
                                            if (product_variant_ids.indexOf(db_ids_array[u]) == -1) {
                                                final_ids_to_push.push(db_ids_array[u]);
                                            }
                                            else {
                                                await ValidatePlan.ValidatePlan(Shop, _productId, 'delete');
                                            }
                                        }
                                    }
                                    // console.log(final_ids_to_push)   
                                    if (flagVariant) {
                                        //delete object
                                        if (final_ids_to_push.length == 0) {
                                            var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: { $in: product_variant_ids } } } });
                                        }
                                        else {
                                            //delete ids
                                            // console.log('inside else (skip)')
                                            for (var h = 0; h < product_variant_ids.length; h++) {
                                                var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": product_variant_ids[h], "TierObject.group_name": tempGroupName };
                                                var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                                var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                                //don't delete prdct obj in variant case if not all variants of prdct are deleted
                                                var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: productList[i].pId } } });
                                            }
                                        }
                                    }
                                }
                            }

                            if (planValue) {
                                product_ids.push({
                                    product_id: _productId,
                                    metafield_id: createdMetafield.id,
                                    variant_ids: product_variant_ids
                                });
                                for (var v = 0; v < productList[i].variants.length; v++) { //looping to each product variant
                                    if (product_with_same_group_NotFound) {
                                        entity_ids.push(productList[i].variants[v].id);
                                    }
                                }
                            }
                        }
                    }
                    catch (err) {
                        console.log(err);
                        logger.info("(Route:) /helper, (File:) CreateTier.js, (Error:) " + err + new Date());
                    }
                }
                else if (entityType == 'collections') {

                    // try {
                    var newvaluestoinsert = { $set: { TierProgressBar: 1, TierProgressBarstatus: true } };
                    await Seller.updateOne({ MyShopifyDomain: Shop }, newvaluestoinsert);
                    let processedProducts = 0;
                    let totalProducts = 0;
                    let TotalCollectionProductcount = await totalCollectionproductCount(shopify, productList[i].id);
                    if (TotalCollectionProductcount.valid) {
                        totalProducts = TotalCollectionProductcount.collectioncount;

                    }

                    async function getProductFromCollection(productId, params) {
                        try {
                            const collection = await shopify.collection.products(productId, params);
                            return collection;
                        } catch (error) {
                            if (error.message.includes('429')) {
                                try {
                                    logger.info(`(Shop:) ${Shop}, (Route:) /helper, (File:) CreateTier.js, (Error:1) ` + error + new Date());
                                    await CustomSleep(2500);
                                    return (getProductFromCollection(productId));
                                } catch (error) {
                                    logger.info(`(Shop:) ${Shop}, (Route:) /helper, (File:) CreateTier.js, (Error:2) ` + error + new Date());
                                    await CustomSleep(2000);
                                    return (getProductFromCollection(productId));

                                }
                            } else {
                                logger.info(`(Shop:) ${Shop}, (Route:) /route, (File:) CreateTier.js Error_catch_1` + error + "Collection" + new Date());
                                return error;

                            }
                        }
                    }
                    // Calling the async function
                    let params = { fields: 'id', limit: 250 };
                    do {
                        let metafield_arrays = [];
                        let collectionProducts = await getProductFromCollection(productList[i].id, params);
                        if (collectionProducts.length > 0) {
                            for (let c = 0; c < collectionProducts.length; c++) {
                                var prductID = Number(collectionProducts[c].id);
                                var variantObject = await shopify.product.get(prductID, { fields: 'variants' });
                                var variants = variantObject.variants;
                                var variant_ids = variants.map(variant => variant.id);
                                // product_ids.push({product_id: prductID, variant_ids: variant_ids});

                                var metafield_id = 0;
                                var tierObjectLength = _seller.TierObject.length;
                                for (var check = 0; check < tierObjectLength; check++) {
                                    var productObjectWithMetaIdArr = _seller.TierObject[check].entity_products;
                                    var productWithMetaId = productObjectWithMetaIdArr.find(
                                        function (product) {
                                            return product.product_id == prductID;
                                        }
                                    );

                                    if (productWithMetaId) {
                                        metafield_id = productWithMetaId.metafield_id;
                                        break;
                                    }
                                }
                                var finalMetafield = [];
                                if (metafield_id != 0) {
                                    try {
                                        var GetMetafield = await shopify.metafield.get(metafield_id, { fields: 'value,id,namespace,key' });
                                        var ParsedMetefield = JSON.parse(GetMetafield.value);
                                        for (var m = 0; m < ParsedMetefield.length; m++) {
                                            if (ParsedMetefield[m].tag != groupName) {
                                                finalMetafield.push(ParsedMetefield[m]);
                                            }
                                        }
                                    } catch (e) {
                                        logger.info(`(Shop:) ${Shop}, (Route:) /helper, (File:) CreateTier.js, (Error:2) ` + e + new Date());
                                    }
                                }

                                var metafield_obj = {};
                                    metafield_obj.tag = groupName;
                                    metafield_obj.tier = {
                                    entity_name: productList[i].title,
                                    entity_id: productList[i].id,
                                    entity_type: entityType,
                                    discount_type: discountType,
                                    status: true,
                                    mostPopularValues: mostPopularValues,
                                    tier_min: tier_min,
                                    tier_max: tier_max,
                                    tier_values: tier_values,
                                    start_date: startDate ?? null,
                                    end_date: endDate ?? null,
                                    Location_Tag_: Location_Tag_ ?? null,
                                    DiscountAppliedON: DiscountAppliedON ?? null,
                                    marketRegion: marketRegion
                                };
                                finalMetafield.push(metafield_obj);
                                var tiertosend = JSON.stringify(finalMetafield);
                                var planValue = await ValidatePlan.ValidatePlan(Shop, prductID, 'insert');
                                if (!planValue) {
                                    flagPlanExceeds = true;
                                } else {
                                    metafield_arrays.push({
                                        "key": "CustomerTiers",
                                        "namespace": "WDTiered",
                                        "ownerId": `gid://shopify/Product/${prductID}`,
                                        "type": "json",
                                        "value": `${tiertosend}`
                                    });
                                }

                                var tempGroupName = groupType == 'Individuals_Customer' ? groupDisplayName : groupName;
                                for (var check = 0; check < _seller.TierObject.length; check++) {
                                    if (_seller.TierObject[check].group_name == tempGroupName) {
                                        var db_ids_array = _seller.TierObject[check].entity_type_ids; var final_ids_to_push = [];
                                        var flagVariant = false, flagProduct = false, flagCollection = false;
                                        for (var u = 0; u < db_ids_array.length; u++) {

                                            if ((_seller.TierObject[check].entity_type_ids.indexOf(productList[i].id) != -1) || (_seller.TierObject[check].entity_type_ids.indexOf(prductID) != -1)) {
                                                //object collection check
                                                if (_seller.TierObject[check].entity_type == "collections") {
                                                    flagCollection = true;
                                                    if (db_ids_array[u] != Number(productList[i].id)) {
                                                        await ValidatePlan.ValidatePlan(Shop, prductID, 'delete');
                                                        final_ids_to_push.push(db_ids_array[u]);
                                                    }
                                                }
                                                //object product check
                                                if (_seller.TierObject[check].entity_type == "products") {
                                                    flagProduct = true;
                                                    if (db_ids_array[u] != Number(prductID)) {
                                                        await ValidatePlan.ValidatePlan(Shop, prductID, 'delete');
                                                        final_ids_to_push.push(db_ids_array[u]);
                                                    }
                                                }
                                            }
                                            //object variant check
                                            if (_seller.TierObject[check].entity_type == "variants") {
                                                flagVariant = true;
                                                if (variant_ids.indexOf(db_ids_array[u]) == -1) {
                                                    await ValidatePlan.ValidatePlan(Shop, prductID, 'delete');
                                                    final_ids_to_push.push(db_ids_array[u]);
                                                }
                                            }
                                        }
                                        // console.log(final_ids_to_push)
                                        if ((_seller.TierObject[check].entity_type_ids.indexOf(productList[i].id) != -1) || (_seller.TierObject[check].entity_type_ids.indexOf(prductID)) != -1) {
                                            if (flagCollection) { //Manage existing collection - db
                                                if (final_ids_to_push.length == 0) {
                                                    final_ids_to_push.push(productList[i].id);
                                                    var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: { $in: Number(productList[i].id) } } } });
                                                    // console.log(dbObjectDelete)    
                                                }
                                                else {
                                                    //delete ids
                                                    var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": productList[i].id, "TierObject.group_name": tempGroupName };
                                                    var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                                    var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                                    var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: prductID } } });
                                                }
                                            }
                                            if (flagProduct) { //Manage existing products - db
                                                if (final_ids_to_push.length == 0) {
                                                    // final_ids_to_push.push(prductID);
                                                    var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: { $in: Number(prductID) } } } });

                                                }
                                                else {
                                                    //delete ids
                                                    var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": productList[i].id, "TierObject.group_name": tempGroupName };
                                                    var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                                    var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                                    var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: prductID } } });
                                                }
                                            }
                                            if (flagProduct) { //Manage existing products - db
                                                if (final_ids_to_push.length == 0) {
                                                    // final_ids_to_push.push(prductID);
                                                    var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject": { entity_type_ids: { $in: Number(prductID) } } } });
                                                }
                                                else {
                                                    //delete ids
                                                    var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": productList[i].id, "TierObject.group_name": tempGroupName };
                                                    var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                                    var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                                    var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: prductID } } });
                                                }
                                            }

                                        }
                                        if (flagVariant) { //Manage existing variants - db
                                            if (final_ids_to_push.length == 0) {
                                                var dbObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop }, { $pull: { "TierObject": { entity_type_ids: { $in: variant_ids }, group_name: tempGroupName } } });
                                                // console.log(dbObjectDelete)
                                            }
                                            else {
                                                //delete ids
                                                for (var h = 0; h < variant_ids.length; h++) {
                                                    var myquery = { MyShopifyDomain: Shop, "TierObject.entity_type_ids": variant_ids[h], "TierObject.group_name": tempGroupName };
                                                    var newvalues = { $set: { "TierObject.$.entity_type_ids": final_ids_to_push } };
                                                    var dbIdsUpdate = await Seller.updateOne(myquery, newvalues);

                                                    var dbProductObjectDelete = await Seller.updateOne({ MyShopifyDomain: Shop, "TierObject.group_name": tempGroupName }, { $pull: { "TierObject.0.entity_products": { product_id: prductID } } });
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            if (metafield_arrays.length == collectionProducts.length) {

                                async function updateProductMetafields(metafield_arrays) {
                                    const productMutation = `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
                                    metafieldsSet(metafields: $metafields) {
                                      metafields {
                                        id
                                      }
                                      userErrors {
                                        field
                                        message
                                        code
                                      }
                                    }
                                  }`;
                                    const variables = {
                                        "metafields": metafield_arrays
                                    };

                                    try {
                                        let response = await shopify.graphql(productMutation, variables);
                                        return response;
                                    } catch (error) {
                                        if (error.message.includes('Throttled') || error.message.includes('429')) {
                                            try {
                                                logger.info(`(Shop:) ${Shop}, (Route:) /CreateTier, (File:) CreateTier.js, (Error:3) ` + error + new Date());
                                                await CustomSleep(2000);
                                                return (CreateMetafieldOnProduct(metafield_arrays));
                                            } catch (error) {
                                                logger.info(`(Shop:) ${Shop}, (Route:) /CreateTier, (File:) CreateTier.js, (Error:4) ` + error + new Date());
                                                await CustomSleep(2000);
                                                return (CreateMetafieldOnProduct(metafield_arrays));
                                            }
                                        } else {
                                            logger.info(`(Shop:) ${Shop}, (Route:) /route, (File:) CreateTier.js Error_catch_2` + error + "Collection" + new Date());
                                            return error;
                                        }

                                    }
                                }

                                let batchSize = 25;

                                for (let i = 0; i < metafield_arrays.length; i += batchSize) {

                                    let batchesDataforMetafields = (metafield_arrays.slice(i, i + batchSize));
                                    // Calling the async function
                                    let response = await updateProductMetafields(batchesDataforMetafields);
                                    if (response) {
                                        if (planValue) {
                                            const updatedMetafieldsLength = batchesDataforMetafields.length;
                                            for (let jk = 0; jk < updatedMetafieldsLength; jk++) {
                                                const { ownerId } = batchesDataforMetafields[jk];
                                                const { id } = response.metafieldsSet.metafields[jk];

                                                const ProductIDs = ownerId.substring(ownerId.lastIndexOf('/') + 1);
                                                const metafieldids = id.substring(id.lastIndexOf('/') + 1);

                                                product_ids.push({
                                                    product_id: ProductIDs,
                                                    metafield_id: metafieldids,
                                                });
                                            }
                                        }
                                    } else {
                                        console.log("response", response);
                                    }

                                }
                                async function updateProgress() {
                                    let progressPercentage = Math.floor((processedProducts / totalProducts) * 100);
                                    if (progressPercentage == 100) {
                                        var newvaluestoinsert = { $set: { TierProgressBar: 0, TierProgressBarstatus: false } };
                                        await Seller.updateOne({ MyShopifyDomain: Shop }, newvaluestoinsert);
                                    } else {
                                        var newvaluestoinsert = { $set: { TierProgressBar: progressPercentage, TierProgressBarstatus: true } };
                                        await Seller.updateOne({ MyShopifyDomain: Shop }, newvaluestoinsert);
                                    }

                                }
                                function processBatch() {
                                    let remainingProducts = totalProducts - processedProducts;
                                    let productsToProcess = Math.min(collectionProducts.length, remainingProducts);
                                    processedProducts += productsToProcess;
                                    updateProgress();
                                    if (processedProducts < totalProducts) {
                                    } else {
                                        var newvaluestoinsert = { $set: { TierProgressBar: 0, TierProgressBarstatus: false } };
                                        Seller.updateOne({ MyShopifyDomain: Shop }, newvaluestoinsert);
                                    }
                                }

                                // Start processing the products
                                processBatch();

                            }
                            params = collectionProducts.nextPageParameters;
                            await CustomSleep(5000);
                
                        } else {
                            CollecProductsGet = true;
                            logger.info(`(Shop:) ${Shop}, (Route:) /route, (File:) CreateTier.js ` + 'Please add some products in your collections.'+ "Collection" +  collectionProducts + ' ' + new Date());
                            return { message: "success", description: "Tier created successfully", CollecProductsGet: CollecProductsGet, PlanExceedMessage: 'Please add some products in your collections.' };
                        }
                    } while (params !== undefined && params.fields != 'tags,first_name');
                    entity_ids.push(productList[i].id);
               
                }
            } //Product for loop end
        }
        var myquery = { MyShopifyDomain: Shop };
        var newvalues = {
            $addToSet: {
                TierObject: {
                    entity_products: product_ids,
                    group_name: groupDisplayName,
                    group_type: groupType,
                    entity_name: entity_name,
                    entity_type: entityType,
                    wd_tag: groupName,
                    mostPopularValues: mostPopularValues,
                    tier_min: tier_min,
                    tier_max: tier_max,
                    tier_values: tier_values,
                    tier_name: referenceNote,
                    tier_status: true,
                    discount_type: discountType,
                    created_date: new Date(),
                    start_date: startDate != null ? startDate : null,
                    end_date: endDate != null ? endDate : null,
                    entity_type_ids: entity_ids,
                    Location_Tag_: Location_Tag_ != null && Location_Tag_ != "" ? Location_Tag_ : null,
                    DiscountAppliedON: DiscountAppliedON != null && DiscountAppliedON != "" ? DiscountAppliedON : null,
                    marketRegion: marketRegion,
                }
            }
        };

        if (entity_ids.length > 0) {
            var dbcreate = await Seller.updateOne(myquery, newvalues);
            // console.log(dbcreate);
        }

        if (flagPlanExceeds) {
            logger.info(`(Shop:) ${Shop}, (Route:) /route, (File:) CreateTier.js ` + 'collection after :1' + new Date());
            return { message: "success", description: "Tier created successfully", PlanExceed: flagPlanExceeds, PlanExceedMessage: 'Some discounts are not created due to plan limit reached. Please upgrade to the appropriate plan to continue creating more discounts.' };
        } else {
            return { message: "success", description: "Tier created successfully", PlanExceed: false };
        }
    }
    catch (err) {
        logger.info(`(Shop:) ${Shop}, (Route:) /route, (File:) CreateTier.js ` + 'main catch' + err + new Date());
        logger.info("(Route:) /CreateTiers, (File:) CreateTier.js, (Error:) " + err + new Date());
        return { status : "error", message: "error", description: "something went wrong", PlanExceed: false };
    }


};

module.exports = { CreateTier };
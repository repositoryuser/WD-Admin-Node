const Seller = require("../models/Seller.js");
const config = require("../config/index");

const ValidatePlan = async ( shop, product_id, ) => {

    product_id = Number(product_id);
    let planValid = true;

    let currentPlan = await Seller.find({MyShopifyDomain: shop}, { plan: 1, planProductIds: 1, TierObject: 1, NormalTierObject: 1 });
    currentPlan = currentPlan[0];

    let planCount = 0;
    switch(currentPlan.plan){
        case 1: planCount = config.PLAN1COUNT; break; case 2: planCount = config.PLAN2COUNT; break; case 3: planCount = config.PLAN3COUNT; break; case 4: planCount = config.PLAN4COUNT; break; case 5: planCount = config.PLAN5COUNT; break;
    }

    let TierObject = currentPlan.TierObject;
    let product_ids = [];
    for(n = 0; n < TierObject.length; n++){
        let entity_products = TierObject[n].entity_products;
        for(p = 0; p < entity_products.length; p++){
        product_ids.push(Number(entity_products[p].product_id));      
        }
    }
    let NormalTierObject = currentPlan.NormalTierObject;
    for(n = 0; n < NormalTierObject.length; n++){
        let entity_products = NormalTierObject[n].entity_products;
        for(p = 0; p < entity_products.length; p++){
            product_ids.push(Number(entity_products[p].product_id));      
        }
    }
    product_ids.push(product_id);

    let distinct = (value, index, self) => { return self.indexOf(value) === index; }; 
    let distinctProductIds = product_ids.filter(distinct);
    if(distinctProductIds.length > planCount){
        planValid = false; 
    }

    return planValid;
};

module.exports= {ValidatePlan};
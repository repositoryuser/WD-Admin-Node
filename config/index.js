// require('dotenv').config();
 
// const config = {
//     JWT_TOKEN:"Iag2Wdyxc65Azovdc7Zs",
//     DB_URL: process.env.DB_URL,
//     // SHOPIFY_API_KEY:  APIKEY,
//     // SHOP_NAME: LOCALSHOPNAME,
//     API_VERSION:process.env.API_VERSION,
//     // SHOPIFY_SHARED_SECRET:  APISECRET,
//     APP_NAME: 'CustomerAppShopify',
//     APP_STORE_NAME: 'Anncode-Development',
//     APP_SCOPE: 'read_content,write_content,read_themes,write_themes,read_products,write_products,read_customers,write_customers,read_draft_orders,write_draft_orders,read_price_rules,write_price_rules,read_discounts,write_discounts',
//     DATABASE_NAME: 'tiered',
//     PLAN1PRICE: '3.99',
//     PLAN2PRICE: '7.99',
//     PLAN3PRICE: '11.99',
//     PLAN4PRICE: '25.99',
//   };
const env = process.env.NODE_ENV;
// const production = require('./production');
// const development = require('./development');
require('dotenv').config();



 /* Live Server */
// const APIKEY = 'f7ba080c21f68abaf3769e99b0f5d460';
// const APISECRET = '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';
// const LOCALSHOPNAME = 'anncode-development.myshopify.com';

const config = {
  JWT_TOKEN:"Iag2Wdyxc65Azovdc7Zs",
  DB_URL: process.env.DB_URL,
  // SHOPIFY_API_KEY:  APIKEY,
  // SHOP_NAME: LOCALSHOPNAME,
  API_VERSION:process.env.API_VERSION,
  // SHOPIFY_SHARED_SECRET:  APISECRET,
  APP_NAME: 'CustomerAppShopify',
  APP_STORE_NAME: 'AppTiv-Development',
  APP_SCOPE: 'read_content,write_content,read_themes,write_themes,read_products,write_products,read_customers,write_customers,read_draft_orders,write_draft_orders,read_price_rules,write_price_rules,read_discounts,write_discounts',
  DATABASE_NAME: 'tiered',
  PLAN1PRICE: '3.99',
  PLAN2PRICE: '7.99',
  PLAN3PRICE: '11.99',
  PLAN4PRICE: '25.99',
};

// if (env !== 'PRODUCTION') {
//   module.exports = Object.assign({}, config, development);
// } else {
  // }
    module.exports =  config;

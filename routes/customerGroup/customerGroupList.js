const express = require('express');
const router = express.Router();
const seller = require('../../models/Seller');
const ShopifyService = require("shopify-api-node");
const config = require("../../config/index");
const GraphQl = require("./GetAllCustomers");
const logger = require("../Logger/logger");
const GetSelectedCustomers = require("./GetSelectedCustomers");


//products count
router.get("/productCount", async (req, res) => {
    try {
        const { Shop } = req.query;
        if ( !Shop ) {
            return res.status(400).send({ status: "error", message: "Please enter a Shop" });
        }
     
        const sellerData = await seller.findOne({ MyShopifyDomain: Shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
        if ( !sellerData ) {
            return res.status(400).send({ status: "error", message: "Seller Not Found" });
        }
        const shopify = new ShopifyService({
            shopName: sellerData.MyShopifyDomain,
            accessToken: sellerData.accessToken,
            apiVersion: config.API_VERSION
          });
        
        const ProductCount = await shopify.product.count()
        return res.status(200).send({ status: "success", message: ProductCount });
    } catch (error) {
        console.log("error: ", error);
        logger.error(`(Route: "/productCount") (File: "/routes/customerGroup/customerGroupList.js")  ${new Date()} Error: `, error);
    }
});

router.post("/ProductList", async (req, res) => {
    try {
      const { Shop, ProductId } = req.body;
      if (!Shop) {
        return res.status(400).send({ status: "error", message: "Please enter a Shop" });
      }
      if (!ProductId) {
        return res.status(400).send({ status: "error", message: "Please Enter Product-Id" });
      }
      const sellerData = await seller.findOne({ MyShopifyDomain: Shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
      if (!sellerData) {
        return res.status(400).send({ status: "error", message: "Seller Not Found" });
      }
      const shopify = new ShopifyService({
        shopName: sellerData.MyShopifyDomain,
        accessToken: sellerData.accessToken,
        apiVersion: config.API_VERSION,
      });
      try {
        let product = await shopify.product.get(ProductId);
        product = {
            title: product.title,
            price: product.variants[0].price,
            src: product.images[0].src,
            preview_url:`https://${sellerData.MyShopifyDomain}/products/${product.handle}`
  
          };
  
        return res.status(200).send({ status: "success", message: product });
      } catch (e) {
        if (e.message.includes("404")) {
          res.status(404).send({ status: "error", message: "Product Not Found" }); //Not Found
        } else if (e.message.includes("401")) {
          res.status(401).send({ status: "error", message: "Unauthorized" }); //Unauthorized
        } else if (e.message.includes("422")) {
          res.status(422).send({ status: "error", message: "Unprocessable Entity" }); //Unprocessable Entity
        } else if (e.message.includes("429")) {
          res.status(429).send({ status: "error", message: "Too Many Requests" }); //Too Many Requests
        } else {
          res.status(400).send({ status: "error", message: "Please Enter Valid ID" }); //Bad Request
        }
      }
    } catch (error) {
      logger.info(`(Shop:) ${Shop},(Router:) /ProductList ,(File:) customergroupList.js, (Error:1)` + ' ' + error.message + ' ' + new Date());
      return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });
    }
  });

  router.post("/HostChange", async function (req, res) {
    try {
      const { Shop, newHost } = req.body;
      if (!Shop) {
        return res.status(400).send({ status: "error", message: "Please Enter a Shop" });
      }
      if (!newHost) {
        return res.status(400).send({ status: "error", message: "Please Enter a Host-Name" });
      }
      const sellerData = await seller.findOne({ MyShopifyDomain: Shop });
  
      if (!sellerData) {
        return res.status(400).send({ status: "error", message: "Seller Not Found" });
      }
  
      const updateResult = await seller.updateOne({ MyShopifyDomain: Shop },
        { $set: { Host: newHost } }
      );
      if (updateResult.nModified === 1) {
        sellerData.Host = newHost;
  
        return res.status(200).send({ status: "success", message: " Host Name successfully Changed"})
      } else {
        res.status(500).send({ status: "error", message: "Failed to update Host" });
      }
    } catch (error) {
      logger.info(`(Shop:) ${Shop},(Router:) /HostChange ,(File:) customergroupList.js, (Error:1)` + ' ' + error.message + ' ' + new Date());
      return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });
    }
  });


  router.post("/SpecificProductsGet", async function (req, res) {
    try {
      const { Shop ,cursor} = req.body;
  
      if (!Shop) {
        return res.status(400).send({ status: "error", message: "Please Enter a Shop" });
      }
  
      const sellerData = await seller.findOne({ MyShopifyDomain: Shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
  
      if (!sellerData) {
        return res.status(400).send({ status: "error", message: "Seller Not Found" });
      }
  
      const shopify = new ShopifyService({
        shopName: sellerData.MyShopifyDomain,
        accessToken: sellerData.accessToken,
        apiVersion: config.API_VERSION
  
      });
  
      try {
        let query = `
        query($cursor: String) {
          products(first: 30, after: $cursor) {
            edges {
              cursor
              node {
                id
                status
                title
                handle
                featuredImage {
                  id
                  height
                  altText
                  url
                  __typename
                }
                featuredMedia {
                  alt
                  __typename
                  status
                }
                images(first: 10) {
                  nodes {
                    altText
                    height
                    __typename
                    url
                    width
                  }
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
          }
        }
        `;
       
        let variables = {};
        if (cursor) {
          query = query.replace('(after: $cursor)', ''); 
          variables.cursor = cursor;
        }
      
        const data = await shopify.graphql(query, variables);
        if (data && data.products) {
          const products = data.products.edges.map(product => {
            return product; // Include the entire product object
          });
        
          if (products.length > 0) {
            const pageInfo = data.products.pageInfo; // Extracting the top-level pageInfo
            return res.status(200).send({ status: "success", message: { products, pageInfo } });
          } else {
            return res.status(404).send({ status: "error", message: "No products found" });
          }
        } else {
          return res.status(404).send({ status: "error", message: "No products found" });
        }
      } catch (error) {
        logger.info(`Error: ${error.message} ${new Date()}`);
        return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });
      }
      
    } catch (error) {
      logger.info(`(Shop:) ${Shop}, (Router:) /SpecificProductsGet, (File:) customergroupList.js, (Error:1)` + ' ' + error.message + ' ' + new Date());
      return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });
    }
  });

  router.post("/SpecificCollection", async function (req, res) {
    try {
      const { Shop, cursor } = req.body;
  
      if (!Shop) {
        return res.status(400).send({ status: "error", message: "Please Enter a Shop" });
      }
  
      const sellerData = await seller.findOne({ MyShopifyDomain: Shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
  
      if (!sellerData) {
        return res.status(400).send({ status: "error", message: "Seller Not Found" });
      }
  
      const shopify = new ShopifyService({
        shopName: sellerData.MyShopifyDomain,
        accessToken: sellerData.accessToken,
        apiVersion: config.API_VERSION
      });
      try {
        let query = `
        query ($cursor: String){
          collections(
            first: 30
            sortKey: TITLE
            after: $cursor,
            before: null
            reverse: false
          ) {
            edges {
              cursor
              node {
                id
                title
                updatedAt
                image {
                  id
                  altText
                  url
                  width
                }
                handle
                __typename
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
        `;
      
        let variables = {};
        if (cursor) {
          query = query.replace('(after: $cursor)', ''); 
          variables.cursor = cursor;
        }
      
        const data = await shopify.graphql(query, variables);
        if (data && data.collections) {
          return res.status(200).send({ status: "success", message: data })
        }
  
      } catch (error) {
        logger.info(`Error: ${error.message} ${new Date()}`);
        return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });
      }
      
  
    } catch (error) {
      logger.info(`(Shop:) ${Shop}, (Router:) /SpecificCollection, (File:) customergroupList.js, (Error:1)` + ' ' + error.message + ' ' + new Date());
      return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });
    }
  });

  router.get("/AllcustomerGet", async  (req, res) => {
    try {
      const shop = req.query.Shop;
      const query = req.query.query;
      const groupType = req.query.groupType;
      const cursor = req.query.cursor;
  
      const sellerData = await seller.findOne({ MyShopifyDomain: shop },{ accessToken:1, CustomerGroup:1});
  
      if (sellerData) {
        let customer = [];
  
        if (groupType === 'Group') {
          if (!query) {
            customer = sellerData.CustomerGroup;
          } else {
            const temptierList = await seller.aggregate([
              { $unwind: '$CustomerGroup' },
              {
                $match: {
                  $and: [
                    { MyShopifyDomain: shop },
                    {
                      $or: [
                        { 'CustomerGroup.group_name': new RegExp(query, "i") },
                      ]
                    }
                  ]
                }
              },
              {
                $project: {
                  CustomerGroup: '$CustomerGroup'
                }
              }
            ]);
  
            customer = temptierList.map((item) => item.CustomerGroup);
          }
        } else {
          if (!query) {
            customer = cursor
              ? await GraphQl.GetAllCustomers(shop, sellerData.accessToken, 50, cursor, "")
              : await GraphQl.GetAllCustomers(shop, sellerData.accessToken, 50, "", "");
          } else {
            customer = cursor
              ? await GetSelectedCustomers.GetSelectedCustomers(shop, sellerData.accessToken, 50, query, cursor)
              : await GetSelectedCustomers.GetSelectedCustomers(shop, sellerData.accessToken, 50, query, "");
          }
        }
  
        return res.json({ status: "success", customer });
  
      } else {
        return res.json({ status: "error", message: "Seller not found. Please try again." });
      }
    } catch (err) {
      logger.info(`(Shop:) ${req.query.Shop}, (Route:) /AllcustomerGet, (File:) customergroupList.js, (Error:2) ` + err + new Date());
      return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: err.message });
    }
  });
  
module.exports = router;
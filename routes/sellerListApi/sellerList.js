const express = require('express');
const router = express.Router();
const seller = require('../../models/Seller');
const logger = require("../Logger/logger");
const ShopifyService = require("shopify-api-node")
const config = require("../../config/index")


//seller list
router.post("/sellerList", async (req, res) => {
    try {
        const { searchValue, plan, planName, InstallStatus, themeInstallOrNot } = req.body;
        let limit = req.body.limit;
        let offset = req.body.offset;
        const options = {
            offset: offset,
            limit: limit,
            sort: { installDate: -1 },
          };
        let filter = {};

        if (searchValue !== null && searchValue !== "" && searchValue !== undefined) {
            filter["MyShopifyDomain"] = { "$in": new RegExp(searchValue, "i") };
          }
      
          if (plan !== null && plan !== "" && plan !== undefined && plan.length != 0) {
            filter["plan"] = { "$in": plan };
          }
      
          if (planName !== null && planName !== "" && planName !== undefined && planName != 0) {
            filter["shopDetails.plan_name"] = { "$in": planName };
          }
      
          if (InstallStatus !== null && InstallStatus !== "" && InstallStatus !== undefined && InstallStatus.length != 0) {
            filter["InstallStatus"] = { "$in": InstallStatus };
          }
      
          if (themeInstallOrNot !== null && themeInstallOrNot !== "" && themeInstallOrNot !== undefined && themeInstallOrNot.length != 0) {
            if (themeInstallOrNot[0] == 'true') {
              filter["CurrentTheme"] = { $exists: true };
            } else {
              filter["CurrentTheme"] = { $exists: false };
            }
          }

        const sellerData = await seller.paginate(filter, options);
        sellerData.docs.forEach(doc => {
            doc.customerDiscountList = [];
            doc.MemberTierObject = [];
            doc.CssSettings = [];
            doc.NotificationSettings = [];
          });
          
          res.json({ status: "success", sellerData });



    } catch (error) {
        console.log("error: ", error);
        logger.error(`(Route: "/sellerList") (File: "/routes/sellerListApi/sellerList.js")  ${new Date()} Error: `, error);
    }
})

// Normal Tier all Products id return
router.get("/NormalTierallproductsIds", async (req, res) => {
  const { Shop } = req.query;
  try {
    let getAllProductsIDs = await seller.aggregate([
      {
        $match: {
          "MyShopifyDomain": Shop
        }
      },
      {
        $unwind: "$NormalTierObject"
      },
      {
        $unwind: "$NormalTierObject.entity_products"
      },
      {
        $group: {
          _id: null,
          productIds: {
            $push: {
              $getField: {
                field: "product_id",
                input: "$NormalTierObject.entity_products"
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          productIds: 1
        }
      }
    ]);
    let outputArray = [];
    if (getAllProductsIDs.length > 0) {
      outputArray = getAllProductsIDs[0].productIds.map(number => {
        return {
          id: String(number)
        };
      });
    }
    res.json({ status: "success", message: outputArray });
  } catch (error) {
    console.log("error: ", error);
    logger.info(`(Shop:) ${Shop}, (Route:) /allproductsIds, (File:), (Error:) ` + error + new Date());
    res.json({ status: "error", message: [] });
  }
});

// all Products id return
router.get("/CustomerallproductsIds", async (req, res) => {
  const { Shop } = req.query;
  try {
    let getAllProductsIDs = await seller.aggregate([
      {
        $match: {
          "MyShopifyDomain": Shop
        }
      },
      {
        $unwind: "$TierObject"
      },
      {
        $unwind: "$TierObject.entity_products"
      },
      {
        $group: {
          _id: null,
          productIds: {
            $push: {
              $getField: {
                field: "product_id",
                input: "$TierObject.entity_products"
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          productIds: 1
        }
      }
    ]);
    let outputArray = [];
    if (getAllProductsIDs.length > 0) {
      outputArray = getAllProductsIDs[0].productIds.map(number => {
        return {
          id: String(number)
        };
      });
    }
    res.json({ status: "success", message: outputArray });
  } catch (error) {
    logger.info(`(Shop:) ${Shop}, (Route:) /allproductsIds, (File:), (Error:) ` + error + new Date());
    res.json({ status: "error", message: [] });
  }
});


router.post("/AddTagToCustomer", async function (req, res) {
  try {
    const { shop } = req.query;
    const { email, tag } = req.body;

    if (!shop) {
      return res.status(400).send({ status: "error", message: "Shop Not Found" });
    }
    if (!email || !tag) {
      return res.status(400).send({ status: "error", message: "All fields are require" });
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).send({ status: "error", message: "Invalid Email Format" });
    }
    const sellerData = await seller.findOne({ MyShopifyDomain: shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
    if (!sellerData) {
      return res.status(400).send({ status: "error", message: "Seller Not Found" });
    }
    const shopify_ = new ShopifyService({
      shopName: sellerData.MyShopifyDomain,
      accessToken: sellerData.accessToken,
      apiVersion: config.API_VERSION
    });

    const params = { email };
    const customer = await shopify_.customer.search(params);

    if (customer.length !== 0) {
      const customerId = customer[0].id;
      const customer__ = await shopify_.customer.get(customerId);
      const customerTags = customer__.tags;
      const tagsToAdd = tag;

      const updateParams = { tags: customerTags + "," + tagsToAdd };
      const customerData = await shopify_.customer.update(customerId, updateParams);

      return res.status(200).send({ status: "success", message: "Tag added successfully" });
    } else {
      return res.status(400).send({ status: "error", message: "Customer Not Found" });
    }
  } catch (error) {
    console.log(error);
    logger.info(`(Shop:) ${shop}, (Route:) /AddTagToCustomer, (File:) get.js, (Error:) ` + error + new Date());
    return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });

  }
});

router.post("/CustomerDeleteTags", async function (req, res) {
  try {
    let { shop, email, customerTagstoRemove } = req.body;

    if (!shop || !email || !customerTagstoRemove) {
      return res.status(400).send({ status: "error", message: "Please Provide All Fields " });
    }
    // Email validation with a regular expression
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ status: "error", message: "Invalid Email Format" });
    }
    seller.findOne({ MyShopifyDomain: shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 })
      .then(async (_seller) => {
        if (_seller != null && _seller != "") {
          let shopify_ = new ShopifyService({
            shopName: _seller.MyShopifyDomain,
            accessToken: _seller.accessToken,
            apiVersion: config.API_VERSION
          });
          let params = {};
          params.email = email;
          try {
            let customer = await shopify_.customer.search(params);
            if (customer != '' && customer != null && customer != undefined) {
              let customerId = customer[0].id; //Id Get
              let customer__ = await shopify_.customer.get(customerId);
              let customerTagsGet = customer__.tags;//customer All tags get
              if (customerTagsGet != null && customerTagsGet != '' && customerTagsGet != undefined) {
                customerTagsGet = customerTagsGet.split(",");
                const TagsTrimArray = customerTagsGet.map(element => {  //All tags trim
                  return element.trim();
                });
                if (TagsTrimArray.length > 0) {
                  let finalTags = "";
                  let Array1 = []; //customer tages
                  let Array2 = []; //Not match data push
                  for (let arr = 0; arr < TagsTrimArray.length; arr++) {
                    if (TagsTrimArray[arr] != customerTagstoRemove) {
                      Array1.push(TagsTrimArray[arr]);
                    }
                    else {
                      Array2.push(TagsTrimArray[arr]);
                    }
                  }
                  if (TagsTrimArray.length == Array1.length) {
                    return res.status(400).send({ status: "error", message: "Your Entered Tag Not Found" });
                  }
                  else {
                    finalTags = Array1.join().trim(); //might be bot needed
                    let tags = { tags: finalTags };
                    let customerdata = await shopify_.customer.update(customerId, tags);//Delete Tags
                    return res.status(200).send({ status: "success", message: customerdata });
                  }
                }
                else {
                  return res.status(400).send({ status: "error", message: "Tag Not Found" });
                }
              }
              else {
                return res.status(400).send({ status: "error", message: "No Tags Found of This User" });
              }

            }
            else {
              return res.status(400).send({ status: "error", message: " Please Enter Customer Valid Email" });
            }
          }
          catch (error) {
            console.log("Handle API error for customer.search");
          }
        }
        else {
          return res.status(400).send({ status: "error", message: "Seller Not Found" });
        }
      }).catch((e) => {
        return res.status(400).send({ message: "error", message: "Something went wrong, please try again later.", e });
      });
  }
  catch (error) {
    logger.info(`(Shop:) ${shop}, (Route:) /CustomerDeleteTags, (File:) SellerListApi/SellerListApi.js, (Error:) ` + error + new Date());
    return res.send({ message: "error", message: "Something went wrong, please try again later." });
  }
});

router.post("/GetAllCustomerTags", async function (req, res) {
  try {
    const { shop } = req.query;
    const { email } = req.body;
    if (!email) {
      return res.status(400).send({ status: "error", message: "Please Enter customer Email" });
    }
    if (!shop) {
      return res.status(400).send({ status: "error", message: "Please Enter Shop" });
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ status: "error", message: "Invalid Email Format" });
    }

    const _seller = await seller.findOne({ MyShopifyDomain: shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
    if (_seller) {
      const shopify_ = new ShopifyService({
        shopName: _seller.MyShopifyDomain,
        accessToken: _seller.accessToken,
        apiVersion: config.API_VERSION,
      });

      const params = { email };
      const customer = await shopify_.customer.search(params);

      if (customer && customer.length > 0) {
        const customerId = customer[0].id;
        const customer__ = await shopify_.customer.get(customerId);
        const customerTags = customer__.tags;

        if (customerTags) {
          return res.status(200).send({ status: "success", message: customerTags });
        } else {
          return res.status(400).send({ status: "error", message: "Customer Tags Not Found" });
        }
      } else {
        return res.status(400).send({ status: "error", message: "Customer not available" });
      }
    } else {
      return res.status(400).send({ status: "error", message: "Seller Not Found" });
    }
  } catch (e) {
    console.error("e: ", e);
    logger.info(`(Shop:) ${shop}, (Route:) /GetAllCustomerTags, (File:) SellerListApi/SellerListApi.js, (Error:) ` + e + new Date());
    return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: e.message });

  }
});

router.post("/NewCustomerCreate", async (req, res) => {
  try {
    const { shop, FirstName, LastName, email } = req.body;

    if (!shop || !FirstName || !LastName || !email) {
      return res.status(400).send({ status: "error", message: "Please Provide All Fields " });
    }
    // Email validation with a regular expression
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ status: "error", message: "Invalid Email Format" });
    }

    const _seller = await seller.findOne({ MyShopifyDomain: shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
    if (_seller) {
      let shopify_ = new ShopifyService({
        shopName: _seller.MyShopifyDomain,
        accessToken: _seller.accessToken,
        apiVersion: config.API_VERSION,
      });
      const existingCustomer = await shopify_.customer.search({ email: email });
      if (existingCustomer.length > 0) {
        return res.status(400).send({ status: "error", message: "Customer with this email already exists" });
      }

      const customer = {
        first_name: FirstName,
        last_name: LastName,
        email: email,
        verified_email: true,
        send_email_invite: true,
      };

      const customerCreate = await shopify_.customer.create(customer);
      return res.status(200).send({ status: "success", message: "Customer Successfully Created" });
    } else {
      return res.status(404).send({ status: "error", message: "Seller Not found" });
    }
  } catch (error) {
    logger.info(`(Shop:) ${shop}, (Route:) /NewCustomerCreate, (File:) SellerListApi/SellerListApi.js, (Error:) ` + error + new Date());
    return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });
  }
});

router.post("/CustomerUpdate", async (req, res) => {
  try {
    const { shop, email, FirstName, LastName } = req.body;
    if (!shop || !email || !FirstName || !LastName) {
      return res.status(400).send({ status: "error", message: "Please Provide All Fields" });
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ status: "error", message: "Invalid Email Format" });
    }
    const _seller = await seller.findOne({ MyShopifyDomain: shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
    if (_seller) {
      let shopify_ = new ShopifyService({
        shopName: _seller.MyShopifyDomain,
        accessToken: _seller.accessToken,
        apiVersion: config.API_VERSION
      });

      let customerData = {};
      customerData.first_name = FirstName;
      customerData.last_name = LastName;

      const customerSearch = await shopify_.customer.search({
        fields: "id, email, verified_email",
        query: `email:${email} verified_email:true`,
      });

      if (customerSearch.length === 0) {
        return res.status(404).send({ status: "error", message: "Customer not found with the provided email" });
      }
      let customerId = customerSearch[0].id
      const customer = await shopify_.customer.get(customerId);
      if (!customer) {
        return res.status(404).send({ status: "error", message: "Customer not Found" });
      }
      const updatedCustomer = await shopify_.customer.update(customerId, customerData);
      return res.status(200).send({ status: "success", message: "Customer Successfully Updated" });

    } else {
      return res.status(404).send({ status: "error", message: "Seller Not found" });
    }
  } catch (error) {
    logger.info(`(Shop:) ${shop}, (Route:) /CustomerUpdate, (File:) SellerListApi/SellerListApi.js, (Error:) ` + error + new Date());
    return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });

  }
});

router.post("/CustomerDelete", async (req, res) => {
  try {
    const { shop, email } = req.body;
    if (!shop || !email) {
      return res.status(404).send({ status: "error", message: "Please Provide All Fields" });
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ status: "error", message: "Invalid Email Format" });
    }

    const _seller = await seller.findOne({ MyShopifyDomain: shop }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 });
    if (_seller) {
      let shopify_ = new ShopifyService({
        shopName: _seller.MyShopifyDomain,
        accessToken: _seller.accessToken,
        apiVersion: config.API_VERSION
      });

      const customerSearch = await shopify_.customer.search({
        fields: "id, email, verified_email",
        query: `email:${email} verified_email:true`,
      });

      if (customerSearch.length === 0) {
        return res.status(400).send({ status: "error", message: "Customer Not found with the provided Valid Email" });
      }
      let customerId = customerSearch[0].id
      const customer = await shopify_.customer.delete(customerId)
      return res.status(200).send({ status: "success", message: "Customer Successfully Delete" });

    } else {
      return res.status(404).send({ status: "error", message: "Seller Not found" });
    }
  } catch (error) {
    logger.info(`(Shop:) ${shop}, (Route:) /CustomerDelete, (File:) SellerListApi/SellerListApi.js, (Error:) ` + error + new Date());
    return res.status(500).send({ status: 'error', message: 'Something went wrong, please try again later.', errorMessage: error.message });

  }
});
module.exports = router;
const Admin = require("../../models/admin");
const express = require("express");
const AdminRouter = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const config = require('../../config/index')
const Seller = require('../../models/Seller')
const ShopifyService = require("shopify-api-node");
//############************ route uncomment when you want to add admin user ######*******************///

AdminRouter.post("/signup", async (req, res, next) => {
  try {
    let admin = await Admin.findOne({ username: req.body.username }).exec()
    if (admin) {
      return res.status(409).json({
        message: "user already exists"
      });
    } else {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({
            error: err
          });
        } else {
          const user = new Admin({
            username: req.body.username,
            password: hash
          });
          user.save()

            .then(result => {
              console.log(result);
              res.status(201).json({
                message: "User created"
              });
            })

            .catch(err => {
              console.log(err);
              res.status(500).json({
                error: err
              });
            });
        }
      });
    }
  }
  catch (err) {
    console.log(err)
  }
})

AdminRouter.post("/AuthenticateUser", async (req, res) => {
   let systemInfo = req.body.systemInfo
       systemInfo.Date = new Date()
  await Admin.findOne({ username: req.body.username }).exec()
    .then( (user) => {
      if (!user) {
        return res.status(201).json({ status: "error", message: "user name and password invalid" });
      }
      bcrypt.compare(req.body.password, user.password,async (err, result) => {
        if (err) {
          return res.status(201).json({ status: "error", message: "Authentication failed" });
        }
        if (result) {
          const token = jwt.sign({ username: user.username },config.JWT_TOKEN,{ expiresIn: "1h",});
          //  await Admin.updateOne( { username: req.body.username },{ $addToSet: { systemInfo: systemInfo } } )
          return res.status(200).json({status: "success", message: "Auth successful", token: token ,result});
        }
        res.status(401).json({ message: "Auth failed" });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err,
      });
    });
});


AdminRouter.get("/checkStoreActiveORnot" , async (req, res) =>{
  const {shop ,_id} =req.query
  try {
      let _seller  = await Seller.findOne({ _id: _id }, { _id: 0, MyShopifyDomain: 1, accessToken: 1 })
      const shopify = ShopifyService({ shopName: _seller.MyShopifyDomain, accessToken: _seller.accessToken, apiVersion:config.API_VERSION  });
    
      let storeDetail = await shopify.shop.get();
      res.status(200).json({status:"success" ,storeDetail});
  } catch (error) {
    console.log("error: ", error);
    res.status(403).json(error);
  }
})



module.exports = AdminRouter
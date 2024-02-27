const express = require("express");
const request = require("request-promise");
const Shopify = require("shopify-api-node");
const router = express.Router();
const Seller = require("../models/Seller.js");
const cssToUpdate = require("./cssToUpdate.js");
const config = require("../config/index.js");
const logger = require('./Logger/logger.js');


//Update frontend settings from db BM
router.put("/UpdateFrontEndSettings", async (req, res) =>{
    await Seller.findOne({ MyShopifyDomain: req.body.Shop })
      .then(async(_seller) => {
        var fs = {
          NotificationStatus:req.body.NotificationStatus,
          bodyTextColor:req.body.bodyTextColor,
          textAlign: req.body.textAlign,
          FontWeight: req.body.FontWeight,
          textFontSize: req.body.textFontSize,
          messageStyleBox:req.body.messageStyleBox,
        };
        const shopify = Shopify({
          shopName: _seller.MyShopifyDomain,
          accessToken: _seller.accessToken,
          apiVersion:config.API_VERSION
        });
        // // console.log("----------------------")
        try{
          var metaLtist=  await shopify.metafield.list(
            {     
               key: 'Settings', 
               namespace: 'WDTiered',
               fields:'value,id,namespace,key'     
            }
          );
          // console.log(metaLtist)
          var ParsedMetefield = JSON.parse( metaLtist[0].value );
          const objToSend = {}
          objToSend.selected_table = ParsedMetefield.selected_table;
          objToSend.theme_installed = ParsedMetefield.theme_installed;
          objToSend.table_headers = ParsedMetefield.table_headers;
          objToSend.synced_theme = ParsedMetefield.synced_theme;
          objToSend.table_body = ParsedMetefield.table_body;
          objToSend.checkout_type = ParsedMetefield.checkout_type;
          objToSend.create_discount_on_subtotal = ParsedMetefield.create_discount_on_subtotal;
          objToSend.timezone =ParsedMetefield.timezone;
          objToSend.is_cart_saving_message=req.body.NotificationStatus;
          objToSend.cart_saving_message=req.body.messageStyleBox;
          var tiertosend = JSON.stringify(objToSend);
          var createMetafield = await shopify.metafield.create({
            key: 'Settings',
            value: tiertosend,
            type:"json",
            namespace: 'WDTiered',
          });
          // console.log(ParsedMetefield)
        }catch(err){
          logger.info(`(Route:) /UpdateFrontEndSettings issue  (Error:1)` + "Theme Extesion MetaFields Issue" + err + new Date());
        }
    //  console.log(":---------------------:")
        // Save in the database
        var myquery = { MyShopifyDomain: req.body.Shop };
        var newvalues = { $set: { NotificationSettings: fs } };
        var dbUpdate = await Seller.updateOne(myquery, newvalues, { upsert: true });
  
        //Update shopify theme asset
        var FindSettingdb = await Seller.findOne({ MyShopifyDomain: req.body.Shop }, {CssSettings: 1, NotificationSettings: 1, CurrentTheme: 1 });
        try{
            var UpdatedCssForAsset = cssToUpdate(FindSettingdb);
        }catch(err){
            console.log(err)
        }
          let ExtenstionCss = `<style>${UpdatedCssForAsset}<style>`;
          try {
            var ThemeAppSettings = await shopify.metafield.create({
              key: 'ThemeAppSettings',
              value: ExtenstionCss,
              type:"multi_line_text_field",
              namespace: 'WDTiered',
            });
          } catch (error) {
          }
  
          return res.send({status: 'success', message: 'Notification settings updated successfully'});
      })
      .catch((err) => {
        return res.send({status: 'error', message: 'Something went wrong, please try again.'});
      });
  });


  //Get frontend settings from db BM
router.get("/GetFrontEndSettings", async (req, res) => {
    try {
      const { Shop } = req.query;
      if (!Shop) {
        return res.status(400).send({ status: "error", message: "Please Enter shop" });
      }
      const _seller = await Seller.findOne({ MyShopifyDomain: Shop }, { MyShopifyDomain: 1, NotificationSettings: 1 });
      if (!_seller) {
        return res.status(400).send({ status: "error", message: "Seller not found" });
      }
      if (_seller.NotificationSettings) {
        return res.send({ status: "success", message: _seller.NotificationSettings });
      } else {
        return res.send({ status: 'error', message: 'Notification settings not found or empty' });
      }
    } catch (err) {
      logger.error(`(Shop:) ${req.query.Shop}, (Route:) /GetFrontEndSettings, (File:) FrontEndSettings.js, (Error:1) ` + err + new Date());
      return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
  
    }
  });
  module.exports = router
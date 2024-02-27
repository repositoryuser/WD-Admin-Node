const express = require("express");
const Seller = require("../models/Seller.js");
const request = require("request-promise");
const ShopifyService = require("shopify-api-node");
const cssToUpdate = require("./cssToUpdate.js");
const router = express.Router();
const config = require("../config/index.js");
const logger = require('./Logger/logger.js');


//Get Css Settings BM
 router.get("/GetCssSettings", async (req, res) => {
  try {
    const { Shop } = req.query;
    if (!Shop) {
      return res.status(400).send({ status: "error", message: "Please enter a shop" });
    }
    const seller = await Seller.findOne({ MyShopifyDomain:Shop },{ accessToken:1, CssSettings:1});
    if (!seller) {
      return res.status(404).send({ status: "error", message: "Seller not found" });
    }

    const sellerObject = await Seller.find( { MyShopifyDomain:Shop });
    // Assuming CssSettings is a property of the first seller object
    const data = sellerObject[0].CssSettings;

    return res.send({ status: "success", message: data});

  } catch (err) {
    logger.info(`(Shop:) ${req.query.Shop}, (Route:) /GetCssSettings, (File:) CssSettingsRoute.js, (Error:1) ` + err + new Date());
    return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
  
  }
});

//Save Css Settings
router.post("/SaveCssSettings", function (req, res) {
  Seller.findOne({ MyShopifyDomain: req.body.Shop })
    .then(async (_seller) => {

      if (_seller != null && _seller != "") {
        const shopify = Shopify({
          shopName: _seller.MyShopifyDomain,
          accessToken: _seller.accessToken,
        });
        console.log(_seller.ThemeSettings.length )
         if (_seller.ThemeSettings.length ==1) {
              var cs = {
            table: req.body.table,
            thMinQty: req.body.thMinQty,
            thBuyText: req.body.thBuyText,
            thMaxQty: req.body.thMaxQty,
            thDiscountText: req.body.thDiscountText,
            thBgColor: req.body.thBgColor,
            tbBgcolor: req.body.tbBgcolor,
            thTextFontColor: req.body.thTextFontColor,
            tbTextFontColor: req.body.tbTextFontColor,
            tOutlineColor: req.body.tOutlineColor,
            thFontSize: req.body.thFontSize,
            tbFontSize: req.body.tbFontSize,
            thFontWeight: req.body.thFontWeight,
            thTextTransform: req.body.thTextTransform,
            tbFontWeight: req.body.tbFontWeight,
            textAlign: req.body.textAlign,
            checkoutType: req.body.checkoutType
            }; try {
            const shopify = Shopify({
              shopName: _seller.MyShopifyDomain,
              accessToken: _seller.accessToken,
            });
            var cs = {
              table: req.body.table,
              thMinQty: req.body.thMinQty,
              thBuyText: req.body.thBuyText,
              thMaxQty: req.body.thMaxQty,
              thDiscountText: req.body.thDiscountText,
              thBgColor: req.body.thBgColor,
              tbBgcolor: req.body.tbBgcolor,
              thTextFontColor: req.body.thTextFontColor,
              tbTextFontColor: req.body.tbTextFontColor,
              tOutlineColor: req.body.tOutlineColor,
              thFontSize: req.body.thFontSize,
              tbFontSize: req.body.tbFontSize,
              thFontWeight: req.body.thFontWeight,
              thTextTransform: req.body.thTextTransform,
              tbFontWeight: req.body.tbFontWeight,
              textAlign: req.body.textAlign,
              bodyMessage: req.body.bodyMessage
            };
            var css_properties = {

              HeaderBackgoundColor: req.body.thBgColor,
              tbBgcolor: req.body.tbBgcolor,
              HeaderFontColor: req.body.thTextFontColor,
              BodyTextFontColor: req.body.tbTextFontColor,
              BorderColor: req.body.tOutlineColor,
              HeaderFontSize: req.body.thFontSize,
              BodyContentFontSize: req.body.tbFontSize,
              HeaderFontWeight: req.body.thFontWeight,
              HeaderTextTransform: req.body.thTextTransform,
              FooterTextTransform: req.body.thTextTransform,
              BodyTextFontWeight: req.body.tbFontWeight,
              TextAlign: req.body.textAlign,
            };

            const table_headers = {
              // header1_value: req.body.thMinQty,
              // header2_value: req.body.thMaxQty , //'header2Text',
              // header3_value: req.body.thDiscountText,
            //  header4_value: req.body.table == "table3" ? req.body.thMaxQty : "header4Text",
            header1_value: req.body.thMinQty,
            header2_value: req.body.table == "table1" ? req.body.thDiscountText : req.body.thMaxQty, //'header2Text',
            header3_value: req.body.thDiscountText != null ? req.body.thDiscountText : "header3Text",            
            }
            const table_body = {
              body1_value: req.body.table == "table2" ? "body1Text" : req.body.thBuyText,
              body2_value: req.body.table == "table4" ? req.body.bodyMessage : "body2Text", //'header2Text',

            }

            var themeIds = []
            for (var i = 0; i < _seller.ThemeSettings.length; i++) {
              themeIds.push(_seller.ThemeSettings[i].ThemeId)
            }
            const str =_seller.shopDetails.timezone;
            const time_zone =str.substring(4,str.indexOf(")"));
            var tempSign = time_zone.substring(0,1);
        function timeStringToFloat(time) {
          var hoursMinutes = time.split(/[.:]/);
          var hours = parseInt(hoursMinutes[0], 10);
          var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
          return hours + minutes / 60;
        }
        var tempStr = timeStringToFloat(time_zone.substring(1));
        var finalTimeZone = tempSign + tempStr;

            const objToSend = {}
            objToSend.selected_table = req.body.table;
            // objToSend.css_properties = css_properties;
            objToSend.theme_installed = themeIds;
            objToSend.table_headers = req.body.table == "table4" ? null : table_headers
            objToSend.synced_theme = _seller.CurrentTheme
            objToSend.table_body = table_body
            objToSend.checkout_type = req.body.checkoutType
            objToSend.create_discount_on_subtotal = false
            objToSend.timezone =finalTimeZone
            objToSend.is_cart_saving_message=true
            objToSend.cart_saving_message="You saved {{discount_amount}}."
            var tiertosend = JSON.stringify(objToSend);
            var createMetafield = await shopify.metafield.create({
              key: 'Settings',
              value: tiertosend,
              value_type: 'JSON_STRING',
              namespace: 'WDTiered',
            });
            var createEnableDisableMetafield = await shopify.metafield.create({
              key: "EnableDisable",
              value: "true",
              value_type: "string",
              namespace: "WDTiered",
            });

          } catch (e) {
            console.log(e);
          }
          var myquery = {
            MyShopifyDomain: req.body.Shop,
           
          };
          var newvalues = { $set: { CssSettings: cs } };

          Seller.updateOne(myquery, newvalues)
            .then((data) => {

              return res.send({status: 'error', message: "Css Settings updated successfully"});
            })
            .catch((err) => {
              return res.send({status: 'error', message: "Failed to save, please try again later"});
            });
        } 
        return res.send({status: 'success', message: 'Theme updated successfully'});
      }

      }).catch((err) => {
        return res.send({status: 'error', message: "Seller not found with domain "});
      });
});

//#region /UpdateCssSettings Css Settings BM
router.put("/UpdateCssSettings", async (req, res) => {
  try {
    const { Shop } = req.body;
    if (!Shop) {
      return res.status(400).send({ status: "error", message: "Please provide a shop." });
    }

    const _seller = await Seller.findOne(
      { MyShopifyDomain: Shop },
      { accessToken: 1, MyShopifyDomain: 1, CurrentTheme: 1, NotificationSettings: 1, CssSettings: 1, ThemeSettings: 1, shopDetails: 1 }
    );
    if (!_seller) {
      return res.status(404).send({ status: "error", message: "Seller not found." });
    }

    const shopify = ShopifyService({
      shopName: _seller.MyShopifyDomain,
      accessToken: _seller.accessToken,
      apiVersion: config.API_VERSION
    });

    var cs = {
      table: req.body.table,
      thMinQty: req.body.thMinQty,
      thBuyText: req.body.thBuyText,
      thMaxQty: req.body.thMaxQty,
      thDiscountText: req.body.thDiscountText,
      thBgColor: req.body.thBgColor,
      tbBgcolor: req.body.tbBgcolor,
      thTextFontColor: req.body.thTextFontColor,
      tbTextFontColor: req.body.tbTextFontColor,
      tOutlineColor: req.body.tOutlineColor,
      thFontSize: req.body.thFontSize,
      tbFontSize: req.body.tbFontSize,
      thFontWeight: req.body.thFontWeight,
      thTextTransform: req.body.thTextTransform,
      tbFontWeight: req.body.tbFontWeight,
      textAlign: req.body.textAlign,
      bodyMessage: req.body.bodyMessage,
      checkoutType: req.body.checkoutType
    };
    var css_properties = {

      HeaderBackgoundColor: req.body.thBgColor,
      tbBgcolor: req.body.tbBgcolor,
      HeaderFontColor: req.body.thTextFontColor,
      BodyTextFontColor: req.body.tbTextFontColor,
      BorderColor: req.body.tOutlineColor,
      HeaderFontSize: req.body.thFontSize,
      BodyContentFontSize: req.body.tbFontSize,
      HeaderFontWeight: req.body.thFontWeight,
      HeaderTextTransform: req.body.thTextTransform,
      FooterTextTransform: req.body.thTextTransform,
      BodyTextFontWeight: req.body.tbFontWeight,
      TextAlign: req.body.textAlign,
    };

    const table_headers = {
      header1_value: req.body.thMinQty,
      header2_value: req.body.table == "table1" ? req.body.thDiscountText : req.body.thMaxQty, //'header2Text',
      header3_value: req.body.thDiscountText != null ? req.body.thDiscountText : "header3Text",
    }
    const table_body = {
      body1_value: req.body.table == "table2" ? "body1Text" : req.body.thBuyText,
      body2_value: req.body.table == "table4" ? req.body.bodyMessage : "body2Text", //'header2Text',

    }

    let themeIds = []
    for (var i = 0; i < _seller.ThemeSettings.length; i++) {
      themeIds.push(_seller.ThemeSettings[i].ThemeId)
    }
    const str =_seller.shopDetails.timezone;
    const time_zone =str.substring(4,str.indexOf(")"));
    var tempSign = time_zone.substring(0,1);
    function timeStringToFloat(time) {
      var hoursMinutes = time.split(/[.:]/);
      var hours = parseInt(hoursMinutes[0], 10);
      var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      return hours + minutes / 60;
    }
    var tempStr = timeStringToFloat(time_zone.substring(1));
    var finalTimeZone = tempSign + tempStr;

    const objToSend = {}
    objToSend.selected_table = req.body.table;
    objToSend.theme_installed = themeIds;
    objToSend.table_headers = req.body.table == "table4" ? null : table_headers
    objToSend.synced_theme = _seller.CurrentTheme
    objToSend.table_body = table_body
    objToSend.checkout_type = req.body.checkoutType
    objToSend.create_discount_on_subtotal = false
    objToSend.timezone=finalTimeZone;
    objToSend.cart_saving_message=_seller.NotificationSettings.messageStyleBox

    let tiertosend = JSON.stringify(objToSend);

    try {
      await shopify.metafield.create({
        key: 'Settings',
        value: tiertosend,
        type: "json",
        namespace: 'WDTiered',
      });

    } catch (err) {
      logger.info(`(Shop:) ${req.body.Shop}, (Route:) /UpdateCssSettings, (File:) CssSettingsRoute.js, (Error:1) ` + err + new Date());
    }

    const SettingUpdatedb = await Seller.updateOne({ MyShopifyDomain: Shop }, { $set: { CssSettings: cs } });
    const FindSettingdb = await Seller.findOne({ MyShopifyDomain: Shop }, {CssSettings: 1, NotificationSettings: 1, CurrentTheme: 1 });
    const UpdatedCssForAsset = cssToUpdate(FindSettingdb);//_seller

    try {
      // Update shopify theme css asset
      await shopify.asset.update(FindSettingdb.CurrentTheme, {
        key: "assets/wd-tiered-style.css",
        value: UpdatedCssForAsset,
      });
    } catch (err) {
      console.log(err);
    }

    return res.send({ status: 'success', message: 'Settings updated successfully' });
  } catch (err) {
    logger.info(`(Shop:) ${req.body.Shop}, (Route:) /UpdateCssSettings, (File:) CssSettingsRoute.js, (Error:1) ` + err + new Date());
    return res.status(500).send({ status: "error", message: "Something went wrong, please try again." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const config = require("../../config");
const ShopifyService = require("shopify-api-node");
const Seller = require("../../models/Seller");
const logger = require("../Logger/logger");

router.get("/getThemeList", function (req, res) {
  let _id = req.query._id;
  Seller.findOne({ _id: _id })
    .then(async (_seller) => {
      if (_seller != null && _seller != "") {
        const shopify = new ShopifyService({
          shopName: `${_seller.MyShopifyDomain}`,
          accessToken: _seller.accessToken,
          apiVersion: config.API_VERSION,
        });
        shopify.theme
          .list()
          .then(async (themes) => {
            for (var j = 0; j < themes.length; j++) {
              _seller.ThemeSettings.filter((themeObj) => {
                if (themeObj.ThemeId == themes[j].id) {
                  themes[j].isThemeInstalled = true;
                }
              });
            }
            var sellerThemes = themes;
            return res.json({ status: "success", sellerThemes });
          })
          .catch((err) => {
            console.log(err);
            logger.info(
              `(Shop:) ${_seller.MyShopifyDomain}, (Route:) /getThemeList, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
                err +
                new Date()
            );
            return res.status(404).send(err);
          });
      } else {
        logger.info(
          `(Shop:) ${_seller.MyShopifyDomain}, (Route:) /getThemeList, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
            err +
            new Date()
        );
        return res.send({ status: "error", message: "No data found" });
      }
    })
    .catch((err) => {
      logger.info(
        `(Shop:) ${_seller.MyShopifyDomain}, (Route:) /getThemeList, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
          err +
          new Date()
      );
      return res.send({ status: "error", message: "No data found" });
    });
});

router.get("/getThemeAssets", async function (req, res) {
  try {
    const { ThemeId, _id } = req.query;
    var _seller = await Seller.findOne(
      { _id: _id },
      { _id: 0, MyShopifyDomain: 1, accessToken: 1 }
    );
    if (_seller != null || _seller != undefined) {
      const shopify = ShopifyService({
        shopName: _seller.MyShopifyDomain,
        accessToken: _seller.accessToken,
        apiVersion: config.API_VERSION,
      });
      let ThemeAssets = await shopify.asset.list(ThemeId);
      return res.json({ status: "success", ThemeAssets });
    } else {
      logger.info(
        `(Shop:) ${_seller.MyShopifyDomain}, (Route:) /getThemeAssets, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
          new Date()
      );
      return res.json({ status: "error", message: "seller not found" });
    }
  } catch (error) {
    logger.info(
      `(Shop:) ${_seller.MyShopifyDomain}, (Route:) /getThemeAssets, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
        error +
        new Date()
    );
    return res.json({ status: "error", message: error.message });
  }
});

router.get("/getSingleThemeAsset", async function (req, res) {
  const { _id, ThemeId, AssetKey } = req.query;
  try {
    let _seller = await Seller.findOne(
      { _id: _id },
      { _id: 0, MyShopifyDomain: 1, accessToken: 1 }
    );
    const shopify = ShopifyService({
      shopName: _seller.MyShopifyDomain,
      accessToken: _seller.accessToken,
      apiVersion: config.API_VERSION,
    });
    let SingleThemeAsset = await shopify.asset.get(ThemeId, {
      asset: { key: AssetKey },
    });
    if (SingleThemeAsset.theme_id == ThemeId) {
      let ThemeAsset = SingleThemeAsset.value;
      return res.json({ status: "success", ThemeAsset });
    }
  } catch (error) {
    logger.info(
      `(Shop:) ${_id}, (Route:) /getSingleThemeAsset, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
        error +
        new Date()
    );
    console.log("error: ", error);
  }
});

router.post("/updateSingleFileAsset", async function (req, res) {
  const { _id, ThemeId, AssetKey } = req.query;
  try {
    let _seller = await Seller.findOne(
      { _id: _id },
      { _id: 0, MyShopifyDomain: 1, accessToken: 1 }
    );

    const shopify = ShopifyService({
      shopName: _seller.MyShopifyDomain,
      accessToken: _seller.accessToken,
      apiVersion: config.API_VERSION,
    });
    var ShopifyThemesAssets = await shopify.asset.update(ThemeId, {
      key: AssetKey,
      value: req.body.ChangeAsset,
    });

    console.log("ShopifyThemesAssets: ", ShopifyThemesAssets);
    return res.json({
      status: "success",
      message: "Asset Updated Successfully",
      ShopifyThemesAssets,
    });
  } catch (error) {
    console.log("error: ", error);
    logger.info(
      `(Shop:) ${shop}, (Route:) /updateSingleFileAsset, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
        error +
        new Date()
    );
    return res.json({ status: "error", message: "Asset not Updated" });
  }
});

router.post("/createThemeAsset", async function (req, res) {
  const { shop, ThemeId } = req.query;
  try {
    let _seller = await Seller.findOne(
      { MyShopifyDomain: shop },
      { _id: 0, accessToken: 1 }
    );
    const shopify = ShopifyService({
      shopName: shop,
      accessToken: _seller.accessToken,
      apiVersion: config.API_VERSION,
    });
    var ShopifyThemesAssets = await shopify.asset.create(ThemeId, {
      key: req.body.AssetKey,
      value: "New File Created by CTD APP",
    });
    return res.json({
      status: "success",
      message: "Asset Created Successfully",
    });
  } catch (error) {
    console.log("error: ", error);
    logger.info(
      `(Shop:) ${shop}, (Route:) /createThemeAsset, (File:) SellerDetailsAPI/SellerDetailsAPI.js, (Error:) ` +
        error +
        new Date()
    );
    res.status(401).json(error);
  }
});

module.exports = router;

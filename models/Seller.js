const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const CssSettings = {
      table:String,
      thMinQty: String,
      thBuyText: String,
      thMaxQty: String,
      thDiscountText: String,
      thBgColor: String,      
      tbBgcolor:String,
      thTextFontColor:String,
      tbTextFontColor:String,
      tOutlineColor:String,
      thFontSize: String,
      tbFontSize: String,
      thFontWeight:String,
      thTextTransform:String,
      tbFontWeight:String,
      textAlign:String,
      bodyMessage:String,
      checkoutType:String    
};
const NotificationSettings = {
    NotificationStatus:String,
    bodyTextColor:String,
    textAlign: String,
    FontWeight: String,
    textFontSize: String,
    messageStyleBox: String,
      
};
const ThemeSettings = {
    ThemeId: Number,
    ThemeStoreId: Number,
    ThemeName: String,
  
}; 

const CustomerObject = {
    id: Number,
    displayName: String,
    email: String
};
const CustomerGroup = {
    group_name: String, 
    group_type: String, 
    customerList: {type: [CustomerObject] } 
};
const entity_products = {
    product_id: Number,
    metafield_id: Number,
    variant_ids: [Number],
}
const pages = {
    create_tier: {type: Boolean, default: true},
    customer_tier_list: {type: Boolean, default: true},
    normal_tier_list: {type: Boolean, default: true},
    customer_tier_edit: {type: Boolean, default: true},
    normal_tier_edit: {type: Boolean, default: true},
    create_group: {type: Boolean, default: true},
    customer_group_list: {type: Boolean, default: true},
    customer_group_edit: {type: Boolean, default: true},
    settings: {type: Boolean, default: true},
    settings_layout: {type: Boolean, default: true},
    plan_upgrade: {type: Boolean, default: true},
    support: {type: Boolean, default: true},
    tutorial: {type: Boolean, default: true},
};
const TierObject = {
   entity_products: {type: [entity_products]}, 
   wd_tag: String,
   group_name: String, 
   group_type: String, 
   entity_name: String,
   entity_type: String,
   tier_value: String, 
   tier_name: String,
   tier_min: {type: Array},
   tier_max: {type: Array},
   tier_values: {type: Array},
   tier_status: Boolean,
   discount_type: String,
   created_date: {type: Date,default:new Date()},
   start_date: Date,
   end_date: Date,
   entity_type_ids: [Number],
   Location_Tag_:{},
   DiscountAppliedON:String,
   excludeCustomerTags: {type: Array},
    mixMatch:Boolean,
};
const SubtotalTiers = {
   wd_tag: String,
   group_name: String,
   group_type: String,
   tier_name: String,
   tier_min: {type: Array},
   tier_max: {type: Array},
   tier_values: {type: Array},
   tier_status: Boolean,
   discount_type: String,
   DiscountBasedOn:String,
   created_date: {type: Date,default:new Date()},
   start_date: Date,
   end_date: Date
}
const AutomaticDiscountTiers = {
    // acp_tag: String,
    // group_name: String,
    Discount_id:String,
    group_type: String,
    tier_name: String,
    tier_min: {type: Array},
    tier_max: {type: Array},
    tier_values: {type: Array},
    tier_status: Boolean,
    discount_type: String,
    created_date: {type: Date,default:new Date()},
    start_date: Date,
    end_date: Date
 }
const Seller = mongoose.Schema({
    accessToken: String,
    MyShopifyDomain: String,
    Host:String,
    ShopDomain: String,
    ShopName: String,
    Email: String,
    UserName: String,
    InstallStatus: Boolean,
    installDate:{ type: Date, default: new Date()},
    UnInstallDate: Date,
    CurrentTheme: Number,
    IsAppEnable: Boolean,
    introTutorial: {type: pages},
    CssSettings: {type: CssSettings } ,
    NotificationSettings: {type: NotificationSettings } ,
    ThemeSettings: {type: [ThemeSettings]},
    nonce: String,
    chargeId:String,
    showPlan: Boolean,
    isMailStatus:Boolean,
    plan: Number,
    planProductIds: {type: Array},
    installsettingpage:Boolean,
    AutomaticGroupStore: Boolean,
    AutomaticDiscountTier: Boolean,
    PublicAppToken:Boolean,
    customizePlan:Number,
    installHistory : [{chargeDate:{type:Date,default:new Date()},chargeId:String,uninstallDate: Date, }],
    shopDetails:{},
    CustomerGroup: {type: [CustomerGroup] },
    storeType: String,
    TierObject: {type: [TierObject] },
    NormalTierObject: {type: [TierObject] },
    customerDiscountList: {type: Array},
    customerGrouptier:{type: Array},
    SubtotalTiers: {type: [SubtotalTiers] },
    AutomaticDiscountTierRule: {type: [AutomaticDiscountTiers] },
},{collection :'Seller'});
Seller.plugin(mongoosePaginate);

module.exports = mongoose.model('Seller', Seller);
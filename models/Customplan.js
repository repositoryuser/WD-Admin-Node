const mongoose = require('mongoose');

const customplans =mongoose.Schema({
    MyShopifyDomain : String,
    planValue : Number,
    planName : String,
    isSubscribed :Boolean,
    isDowngrade :Boolean ,
    active: Boolean,
    isCustomer : Boolean,
    Discription : String,
})

module.exports = mongoose.model('customplans', customplans);
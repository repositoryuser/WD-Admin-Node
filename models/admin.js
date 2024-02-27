const mongoose = require('mongoose');
const adminSchema = new mongoose.Schema({
    username:String,
    password:String,
    name:String,
    Login_Date :{ type: Date, default: new Date()},
    email:String,
    systemInfo:{}
})

const admin = mongoose.model("Admin", adminSchema);
module.exports = admin;
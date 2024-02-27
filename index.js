const express = require('express');
const app = express();
const mongoose = require("mongoose");
const cors = require('cors');
require('dotenv').config();
app.use(cors());

const PORT = process.env.PORT; 
const DB_URL = process.env.DB_URL; 

app.use(express.json());

// Connecting to the database
mongoose.Promise = global.Promise;
mongoose.connect(DB_URL)
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log("Could not connect to the database. Exiting now...", err);
    process.exit();
  });



  //Enable CORS for all HTTP methods
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

//files
//#region 
const adminAuth = require("./routes/adminAuthApi/admin");
const dashboard = require("./routes/dashboadApi");
const sellerCount = require("./routes/sellerCountApi/sellerCountApi");
const sellerList = require("./routes/sellerListApi/sellerList");
const CustometGroupList  = require("./routes/customerGroup/customerGroupList");
const AppEnableDisableRoute = require("./routes/AppEnableDisableRoute");
const CssSettingsRoute = require("./routes/CssSettingsRoute");
const FrontEndSettings = require("./routes/FrontEndSettings");
const ChangeStoreType = require("./routes/ChangeStoreType");
const APIs = require("./routes/APIs")
const SubtotalCustomerAPIs  = require("./routes/SubtotalCustomerAPIs.js")
const SellerDetails = require("./routes/SellerDetailsAPIs/SellerDetailsAPI.js");
const CustomPlan = require("./routes/CustomPlans/CustomPlan.js");




//#endregion


//endpoints
//#region 
app.use("/admin", adminAuth);//adminRoute
app.use("/admin", dashboard);//DashBord
app.use("/admin", sellerCount);//SellerCountAPI
app.use("/admin", sellerList);//SellerListAPI
app.use("/customer", CustometGroupList);//SellerCountAPI
app.use("/AppEnableDisableRoute", AppEnableDisableRoute); //Enable-Disable app
app.use("/CssSettingsRoute", CssSettingsRoute);//CSS table setting save app
app.use("/FrontEndSettings", FrontEndSettings)
app.use("/ChangeStoreType", ChangeStoreType);
app.use("/tier", APIs);
app.use("/SubtotalCustomerAPIs", SubtotalCustomerAPIs);
app.use('/details', SellerDetails)
app.use('/customPlan', CustomPlan)



//#endregion

app.listen(PORT, () => {
    console.log(`server run on ${PORT} http://localhost:${PORT}/`, );
})
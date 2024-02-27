const fetch = require("node-fetch");
const config = require("../../config/index");
console.log(config.API_VERSION)

const GetAllCustomers = async ( shopName, accessToken, limit, nextUrl, previousUrl ) => {
  try{
    var _query=`{ customers(first: ${limit},sortKey:NAME) {`;
    if(nextUrl !="")
    {
      _query=`{ customers(first: ${limit}, after: "${nextUrl}",sortKey:NAME) {`;
    }
    if(previousUrl !="")
    {
      _query=`{ customers(before: ${previousUrl},sortKey:NAME) {`;
    }
    _query+=   ` edges {
        cursor
        node {
          id
          verifiedEmail
          id
          tags
          numberOfOrders
          displayName
          email
        }
      }
    }
  }`;
      const query = JSON.stringify({
      query: _query
    });
    const response = await fetch(`https://${shopName}/admin/api/2023-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "X-Shopify-Access-Token": accessToken,
      },
      body: query
    })
  
  
  
    const responseJson = await response.json();
    return responseJson;
  }catch(err){  
console.log(err)
  }
 
};

module.exports= { GetAllCustomers };
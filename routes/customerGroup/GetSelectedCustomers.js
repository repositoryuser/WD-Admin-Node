const fetch = require("node-fetch");
const config = require("../../config/index");

const GetSelectedCustomers = async ( shopName, accessToken, limit, searchQuery, nextUrl ) => {
  var _query=`{ customers(first: ${limit},query:"*${searchQuery}*") {`;
  if(nextUrl !="")
  {
    _query=`{ customers(first: ${limit},after: "${nextUrl}",query:"*${searchQuery}*") {`;
  }
  _query+= `edges {
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
  }
  `;
    const query = JSON.stringify({
    query: _query
  });

  const response = await fetch(`https://${shopName}/admin/api/${config.API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "X-Shopify-Access-Token": accessToken,
    },
    body: query
  })

  const responseJson = await response.json();
  return responseJson;
};

module.exports= {GetSelectedCustomers};

const totalCollectionproductCount = async (shopify,collectionIdproduct) => {
    let collectionId = collectionIdproduct;
    try {
        let collection = await shopify.collection.get(collectionId);
        let productCount = collection.products_count;
         return {valid:true,collectioncount:productCount};
     } catch (error) {
         return {valid:false,error:error};
     }

}


module.exports = { totalCollectionproductCount };
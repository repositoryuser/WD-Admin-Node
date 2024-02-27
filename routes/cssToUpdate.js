const cssToUpdate = function(reqBody){
    var cssObject = `
    /*LATEST UPDATED*/
    .ac_table1,
    .ac_table2,
    .ac_table3,
    .ac_table4 {
      margin: 20px 0;
      border-collapse: collapse;
      border: 1px solid black;
      line-height: 1.5;
      width: 100%;
      color: black;
      text-align: ${reqBody.CssSettings.textAlign} !important;
      text-transform: ${reqBody.CssSettings.thTextTransform} !important;
    }
    .ac_table1 .ac__th,
    .ac_table2 .ac__th,
    .ac_table3 .ac__th {
      border: 1px solid black !important;
      background-color: ${reqBody.CssSettings.thBgColor} !important;
      padding: 10px !important;
      line-height: 1.5;
      color: ${reqBody.CssSettings.thTextFontColor} !important;
      font-size: ${reqBody.CssSettings.thFontSize}px !important;
      width: 50%;
      text-align: ${reqBody.CssSettings.textAlign} !important;
      font-weight: ${reqBody.CssSettings.thFontWeight} !important;
      word-break: break-all;
    }
    .ac_table1 .ac__td,
    .ac_table2 .ac__td,
    .ac_table3 .ac__td,
    .ac_table4 .ac__td {
      border: 1px solid black;
      background-color: ${reqBody.CssSettings.tbBgcolor} !important;
      padding: 10px !important;
      line-height: 1.5;
      color: ${reqBody.CssSettings.tbTextFontColor} !important;
      font-size: ${reqBody.CssSettings.tbFontSize}px !important;
      width: 50%;
      text-align: ${reqBody.CssSettings.textAlign} !important;
      font-weight: ${reqBody.CssSettings.tbFontWeight} !important;
      word-break: break-all;
    }
    
    .ac_table1 .ac__th:after,
    .ac_table2 .ac__th:after,
    .ac_table3 .ac__th:after,
    .ac_table4 .ac__td:after {
      content: none;
    }
    
    /* Quantity Range Grid */
    .ac_table2 .ac__th {
      width: 33.33%;
    }
    .ac_table2 .ac__td {
      width: 33.33%;
    }
    
    /* Detailed Grid  */
    .ac_table3 .ac__th {
      width: 33.33%;
    }
    .ac_table3 .ac__td {
      width: 33.33%;
    }
    
    /* Simple Message  */
    .ac_table4 {
      border: transparent !important;
    }
    .ac_table4 .ac__td {
      width: 100%;
      border: transparent !important;
      text-align: ${reqBody.CssSettings.textAlign} !important;
    }
    #saved-banner {
        color: ${reqBody.NotificationSettings.bodyTextColor} !important;
        font-weight: ${reqBody.NotificationSettings.FontWeight} !important;
        font-size: ${reqBody.NotificationSettings.textFontSize}px !important;
    }
    `;
    return cssObject;
    }
    
    module.exports = cssToUpdate;
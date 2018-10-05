module.exports = function(bundler) {
    bundler.addAssetType('hbs', require.resolve('./HandlebarsAsset.js'));    
    bundler.addAssetType('chk', require.resolve('./JSChickenAsset.js'));    
}
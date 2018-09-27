module.exports = function(bundler) {
    bundler.addAssetType('jsc', require.resolve('./JSChickenAsset.js'));    
}
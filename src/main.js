module.exports = function(bundler) {
    bundler.addAssetType('chk', require.resolve('./JSChickenAsset.js'));    
}
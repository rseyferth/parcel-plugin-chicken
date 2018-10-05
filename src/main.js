module.exports = function(bundler) {
    bundler.addAssetType('hbs', require.resolve('./HandlebarsAsset.js'));
 }
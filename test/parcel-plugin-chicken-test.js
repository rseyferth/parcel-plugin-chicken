const assertBundleTree = require('parcel-assert-bundle-tree');
const path = require('path');
const Bundler = require('parcel-bundler');
const ChickenPlugin = require('../src/main');

describe('Parcel Chicken plugin', function() {
    it('should create a basic Chicken JS bundle', async function() {
      
      // Init bundler
      const bundler = new Bundler(path.join(__dirname, './Sample/index.js'), {
        outDir: path.join(__dirname, 'dist'),
        watch: false,
        cache: false,
        hmr: false,
        logLevel: 3
      });

      // Registers the plugins asset types
      await ChickenPlugin(bundler);

      // Bundle the code
      const bundle = await bundler.bundle();
  
      // Compare bundle to expected
      assertBundleTree(bundle, {
        type: 'js',
        assets: ['Component.chk', 'index.js']
      });
    });
  });
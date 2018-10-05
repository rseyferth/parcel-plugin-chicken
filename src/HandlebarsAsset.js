const { Asset } = require('parcel-bundler');
const HTMLAsset = require('parcel-bundler/lib/assets/HTMLAsset');
const isURL = require('parcel-bundler/lib/utils/is-url');
const urlJoin = require('parcel-bundler/lib/utils/urlJoin');
const objectHash = require('parcel-bundler/lib/utils/objectHash');


const ATTRS = {
    src: ['script', 'img', 'audio', 'video', 'source', 'track', 'iframe', 'embed'],
    href: ['link', 'a', 'use'],
    srcset: ['img', 'source'],
    poster: ['video'],
    'xlink:href': ['use'],
    content: ['meta'],
    data: ['object']
};

const OPTIONS = {
    a: {
      href: {
        entry: true
      }
    },
    iframe: {
      src: {
        entry: true
      }
    }
  };

class HandlebarsAsset extends HTMLAsset {

    constructor(name, pkg, options) {
        super(name, pkg, options);  
        this.type = 'html';

        this.assetMap = new Map();

    }

    async generate() {        
        return [];
    }

    collectDependencies() {
        let {ast} = this;
    
        // Add bundled dependencies from plugins like posthtml-extend or posthtml-include, if any
        if (ast.messages) {
          ast.messages.forEach(message => {
            if (message.type === 'dependency') {
              this.addDependency(message.file, {
                includedInParent: true
              });
            }
          });
        }
    
        ast.walk(node => {
            
            if (node === undefined) return;

          if (node.attrs) {
            if (node.tag === 'meta') {
              if (
                !Object.keys(node.attrs).some(attr => {
                  let values = META[attr];
    
                  return (
                    values &&
                    values.includes(node.attrs[attr]) &&
                    node.attrs.content !== ''
                  );
                })
              ) {
                return node;
              }
            }
    
            for (let attr in node.attrs) {
              let elements = ATTRS[attr];
              // Check for virtual paths
              if (node.tag === 'a' && node.attrs[attr].lastIndexOf('.') < 1) {
                continue;
              }
    
              if (elements && elements.includes(node.tag)) {
                let depHandler = this.getAttrDepHandler(attr);
                let options = OPTIONS[node.tag];
                node.attrs[attr] = depHandler.call(
                  this,
                  node.attrs[attr],
                  options && options[attr]
                );
                this.isAstDirty = true;
              }
            }
          }
    
          return node;
        });
      }
    
    async transform() {
        
    }


    processSingleDependency(path, opts) {
        
        // Handlebars in there?
        if (/\{\{/.test(path)) return path;
        
        let assetPath = this.addURLDependency(path, opts);        
        if (!isURL(assetPath)) {
          assetPath = urlJoin(this.options.publicURL, assetPath);
        }

        // Store in asset map
        this.assetMap.set(path, assetPath);

        return assetPath;
      }
    

    async postProcess(generated) {

        // Do a replace for each asset
        let code = this.contents;
        this.assetMap.forEach((asset, path) => {
            
            code = code.replace(new RegExp(`"${path}"`), `"${asset}"`);
            
        })
        
        // Remove extra spaces
        code = code.replace(/[\n\r]+/g, '');
        code = code.replace(/[\s]{2,}/g, ' ').trim();

        return [{
            type: 'html',
            value: code,
            map: null
        }];
    }


}

module.exports = HandlebarsAsset;
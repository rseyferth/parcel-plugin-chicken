const { Asset } = require('parcel-bundler');
const { kebabCase } = require('lodash');
const TemplateRegex = new RegExp('<\s*template([^>]*)>((.|[\n\r])*?)<\s*/\s*template>', 'igm');
const AttributeRegex = /(\w+)\s*=\s*((["'])(.*?)\3|([^>\s]*)(?=\s|\/>))(?=[^<]*)/g;

class JSChickenAssets extends Asset {

    constructor(name, pkg, options) {
        super(name, pkg, options);
        this.type = 'js';
    }

    async generate() {

        // Find and replace any <template></template>
        let js = this.contents;
        let templates = '';
        let match;

        while (match = TemplateRegex.exec(js)) {
            
            // Template
            let str = match[2];
            str = str.replace(/[\n\r]+/g, '');
            str = str.replace(/[\s]{2,}/g, '').trim();

            // Key?
            let attrs = match[1];
            let attr;
            let templateKey = false;
            while (attrs && (attr = AttributeRegex.exec(attrs))) {
                
                let [, key,,, value] = attr;
                if (key.toLowerCase() === 'key') {
                    templateKey = value; 
                    break;
                }

            }

            // No template key?
            if (!templateKey) {

                // Use path
                let parts = this.name.replace(/\.jsc$/i, '').split(/\//);
                templateKey = kebabCase(parts[parts.length - 1]);

            }

            // Add to template
            templates += `Chicken.Dom.View.TemplateCache.set('${templateKey}', \`${str}\`);`;
            
        }

        // Remove it from original
        js = js.replace(TemplateRegex, '');


        // Prepend templates
        js = templates + js;

        return [
            {
                type: 'js',
                value: js
            }
        ]


    }

    

}

module.exports = JSChickenAssets;
const { Asset } = require('parcel-bundler');
const objectHash = require('parcel-bundler/lib/utils/objectHash');
const HandlebarsAsset = require('./HandlebarsAsset');

const { kebabCase } = require('lodash');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('parcel-bundler/lib/utils/fs');
const nativeFs = require('fs');
const xml2js = require('xml2js');
const { each } = require('lodash');

const TemplateRegex = new RegExp('<\s*(Template|Script)([^>]*)>((.|[\n\r])*?)<\s*/\s*(Template|Script)>', 'igm');
const TemplateSelfClosingRegex = new RegExp('<\s*template([^>]*)/>', 'igm');
const AttributeRegex = /(\w+)\s*=\s*((["'])(.*?)\3|([^>\s]*)(?=\s|\/>))(?=[^<]*)/g;

class JSChickenAssets extends Asset {

    constructor(name, pkg, options) {
        super(name, pkg, options);  
        this.type = 'js';
    }

    async generate() {

        // Load config
        let customConfig = (await this.getConfig(['.chickenrc'])) || {};
        const config = Object.assign({
            templateRoot: 'templates'
        }, customConfig);


         // Find and replace any <template></template> and <template src/>
         let js = this.contents;
         let map = this.contents;
         let templates = '';
         let script = '';
         let match;
 
         // Self-closing templates
         while (match = TemplateSelfClosingRegex.exec(js)) {
 
             // Key and source?
             let attrs = match[1];
             let attr;
             let templateKey = false;
             let templateSource = false;
             while (attrs && (attr = AttributeRegex.exec(attrs))) {
                 
                 let [, key,,, value] = attr;
                 if (key.toLowerCase() === 'key') {
                     templateKey = value; 
                 } else if (key.toLowerCase() === 'src') {
                     templateSource = value;
                 }
 
             }
 
             // No source?
             if (!templateSource) continue;
 
             // No template key?
             if (!templateKey) {
 
                 // Use path
                 let parts = templateSource.replace(/\.hbs$/i, '').split(/\//);
 
                 // Add on until we reach root
                 let keyParts = [];
                 while (parts.length > 0) {
                     let p = parts.pop();
                     if (p === config.templateRoot) break;
                     keyParts.unshift(kebabCase(p));                    
                 }
                 
                 templateKey = keyParts.join('.');
                 
 
             }
 
             // Load template
             templates += await this.loadTemplate(templateSource, templateKey)
             
 
        }

        // Remove it from original
        js = js.replace(TemplateSelfClosingRegex, '');

        // Find all top-level tags
        while (match = TemplateRegex.exec(js)) {

            // Which one
            let [complete, tag, attrs, code] = match;
            switch (tag) {

                case 'Template':

                    // Template
                    code = await this.processTemplate(code)

                    // Key?
                    let $ = cheerio(complete);
                    let templateKey = $.attr('key');
                    
                    // No template key?
                    if (!templateKey) {

                        // Use path
                        let parts = this.name.replace(/\.chk$/i, '').split(/\//);
                        templateKey = kebabCase(parts[parts.length - 1]);

                    }
                    
                    // Add to template
                    templates += `Chicken.Dom.View.TemplateCache.set('${templateKey}', \`${code}\`);`;
                    break;

                case 'Script':
                    script += code;
                    break;

            }


        }

        return [{
            type: 'js',
            value: script + templates,
            map: script + templates
        }]


       

    }


    async loadTemplate(uri, templateKey) {
        
        
        // Resovle path
        var templatePath = path.resolve(path.dirname(this.name), uri);
        if (!/\.hbs$/.test(templatePath)) templatePath = `${templatePath}.hbs`;
        
        // Add dependency
        this.addDependency(templatePath, {
             includedInParent: true
        });

        // Read file
        let str = await fs.readFile(templatePath, this.encoding);

        // Template
        str = await this.processTemplate(str, templatePath);

        // Add to template
        return `Chicken.Dom.View.TemplateCache.set('${templateKey}', \`${str}\`);`;

    }    

    async processTemplate(str, url = this.name) {

        
        // As HTML
        let html = new HandlebarsAsset(url, this.options);
        html.contents = str;

        // Inject and replace assets
        await html.process();
        let result = await html.postProcess([]);
        str = result[0].value;
        
        html.dependencies.forEach((dep, key) => {

            this.dependencies.set(key, dep);

        });
        
        // Remove extra spaces
        str = str.replace(/[\n\r]+/g, '');
        str = str.replace(/[\s]{2,}/g, ' ').trim();


        return str;

    }

    generateHash() {
        return objectHash(this.generated);
    }
    

}

module.exports = JSChickenAssets;
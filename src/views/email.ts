import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';

const renderTemplate = (templateName: string, data: object): string => {
  const filePath = path.join(__dirname, `./templates/${templateName}.hbs`);
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);
  return template(data);
};

export default renderTemplate;
import * as turkey from 'turkey-neighbourhoods';
import fs from 'fs';
fs.writeFileSync('output.json', JSON.stringify(Object.keys(turkey), null, 2));

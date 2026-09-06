const fs = require('fs');
let content = fs.readFileSync('pages/HizliSatis.tsx', 'utf8');

// I need to find the `</button>` for `Bekleyenler` and add a `</div>` after it.
const searchStr = `             )}
          </button>
        </div>`;
const replaceStr = `             )}
          </button>
          </div>
        </div>`;

content = content.replace(searchStr, replaceStr);

fs.writeFileSync('pages/HizliSatis.tsx', content);
console.log("Patched HizliSatis.tsx for missing div");

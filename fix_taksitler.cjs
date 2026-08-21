const fs = require('fs');
let code = fs.readFileSync('components/Taksitler.tsx', 'utf8');
code = code.replace(
    /\{\!inst\.isPaid && \([\s]*<button[\s\S]*?Yapılandır[\s]*<\/button>[\s]*\)\}[\s]*\)\}/,
    (match) => {
        // wait, the closing is )\}
        // Actually, just find `{!inst.isPaid && (` and replace with `{!inst.isPaid && (<>`
        // and find the closing `)}` and replace with `</>)}`
        return match;
    }
);

const fs = require('fs');
const path = './components/LocationSearch.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { createPortal }")) {
    code = code.replace("import { useState, useEffect, useRef } from 'react';", "import { useState, useEffect, useRef } from 'react';\nimport { createPortal } from 'react-dom';");
}

code = code.replace("{isModalOpen && (", "{isModalOpen && typeof document !== 'undefined' && createPortal(");
code = code.replace("        </div>\n      )}\n    </div>\n  );\n}", "        </div>\n      ), document.body)}\n    </div>\n  );\n}");

fs.writeFileSync(path, code);

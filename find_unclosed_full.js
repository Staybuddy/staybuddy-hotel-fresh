const fs = require('fs');
const code = fs.readFileSync('app/hotels/[id]/page.tsx', 'utf8');

// A simple stack-based tag matcher for JSX
const stack = [];
const regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
let match;
let lastIndex = 0;

while ((match = regex.exec(code)) !== null) {
  const fullTag = match[0];
  const tagName = match[1];
  
  if (fullTag.endsWith('/>')) {
    continue;
  }
  // count lines up to match.index
  const strBefore = code.substring(lastIndex, match.index);
  const newLines = (strBefore.match(/\n/g) || []).length;
  
  if (fullTag.startsWith('</')) {
    if (stack.length === 0) {
      console.log(`Closing tag ${fullTag} at index ${match.index} with no open tag.`);
    } else {
      const top = stack.pop();
      if (top.tagName !== tagName) {
        console.log(`Mismatched tag: expected </${top.tagName}> but got ${fullTag}`);
      }
    }
  } else {
    stack.push({ tagName, fullTag, index: match.index });
  }
}

console.log('Unclosed tags remaining on stack:');
stack.forEach(item => {
  const linesBefore = code.substring(0, item.index).split('\n').length;
  console.log(`<${item.tagName}> at line ${linesBefore}`);
});

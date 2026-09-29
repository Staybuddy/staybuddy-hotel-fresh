const fs = require('fs');
const code = fs.readFileSync('test_inner.tsx', 'utf8');

// A simple stack-based tag matcher for JSX
const stack = [];
const regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
let match;
let lineNumber = 1;

while ((match = regex.exec(code)) !== null) {
  const fullTag = match[0];
  const tagName = match[1];
  
  if (fullTag.endsWith('/>')) {
    continue;
  }
  
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
  console.log(`<${item.tagName}> at index ${item.index}`);
});

type Block =
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; text: string };

function parseReport(markdown: string): Block[] {
  const blocks: Block[] = [];
  let listBuffer: string[] = [];
  let paragraphBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length) {
      blocks.push({ type: 'list', items: listBuffer });
      listBuffer = [];
    }
  }

  function flushParagraph() {
    if (paragraphBuffer.length) {
      blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ') });
      paragraphBuffer = [];
    }
  }

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      flushParagraph();
    } else if (line.startsWith('#')) {
      flushList();
      flushParagraph();
      blocks.push({ type: 'heading', text: line.replace(/^#+\s*/, '') });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();
      listBuffer.push(line.slice(2).trim());
    } else {
      flushList();
      paragraphBuffer.push(line);
    }
  }
  flushList();
  flushParagraph();

  return blocks;
}

export default function AiReport({ markdown }: { markdown: string }) {
  const blocks = parseReport(markdown);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <h3 key={i} className="text-xl font-semibold text-blue-400 pt-2">
              {block.text}
            </h3>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="list-disc list-inside space-y-1 text-gray-300">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-gray-300 leading-relaxed">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

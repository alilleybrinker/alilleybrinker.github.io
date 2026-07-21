const routes: Record<string, string> = {
  '@/about.md': '/about/',
  '@/blog/_index.md': '/blog/',
  '@/mini/_index.md': '/blog/',
  '@/talks/index.md': '/talks/',
};

function legacyRoute(path: string) {
  if (routes[path]) return routes[path];
  const match = path.match(/^@\/(blog|mini)\/(?:\d{4}-\d{2}-\d{2}-)?(.+)\.md$/);
  return match ? `/blog/${match[2]}/` : undefined;
}

export default function remarkLegacyLinks() {
  return (tree: { children?: Array<{ type?: string; url?: string; children?: unknown[] }> }) => {
    const visit = (nodes: Array<{ type?: string; url?: string; children?: unknown[] }>) => {
      for (const node of nodes) {
        if (node.type === 'link' && node.url) {
          const [path, hash = ''] = node.url.split('#');
          const route = legacyRoute(path);
          if (route) node.url = `${route}${hash ? `#${hash}` : ''}`;
        }
        if (Array.isArray(node.children)) visit(node.children as Array<{ type?: string; url?: string; children?: unknown[] }>);
      }
    };
    if (tree.children) visit(tree.children);
  };
}

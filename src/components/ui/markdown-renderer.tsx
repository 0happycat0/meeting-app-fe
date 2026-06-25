import React from "react";
import Markdown from "markdown-to-jsx";

interface MarkdownRendererProps {
  content: string | null | undefined;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      <Markdown
        options={{
          overrides: {
            h1: {
              component: ({ children, ...props }: any) => (
                <h1 {...props} className="text-2xl font-bold mb-3 text-neutral-900">{children}</h1>
              ),
            },
            h2: {
              component: ({ children, ...props }: any) => (
                <h2 {...props} className="text-xl font-bold mt-5 mb-2.5 text-neutral-900 border-b border-neutral-200 pb-1">{children}</h2>
              ),
            },
            h3: {
              component: ({ children, ...props }: any) => (
                <h3 {...props} className="text-lg font-bold mt-4 mb-2 text-neutral-900">{children}</h3>
              ),
            },
            ul: {
              component: ({ children, ...props }: any) => (
                <ul {...props} className="list-disc pl-6 my-3 space-y-1 text-neutral-700">{children}</ul>
              ),
            },
            ol: {
              component: ({ children, ...props }: any) => (
                <ol {...props} className="list-decimal pl-6 my-3 space-y-1 text-neutral-700">{children}</ol>
              ),
            },
            li: {
              component: ({ children, ...props }: any) => (
                <li {...props} className="text-neutral-700">{children}</li>
              ),
            },
            blockquote: {
              component: ({ children, ...props }: any) => (
                <blockquote {...props} className="border-l-4 border-primary/50 bg-neutral-50 px-4 py-2 my-4 italic text-neutral-700 rounded-r-md">{children}</blockquote>
              ),
            },
            p: {
              component: ({ children, ...props }: any) => (
                <p {...props} className="my-2.5 text-neutral-700 leading-relaxed">{children}</p>
              ),
            },
            strong: {
              component: ({ children, ...props }: any) => (
                <strong {...props} className="font-bold text-neutral-900">{children}</strong>
              ),
            },
            table: {
              component: ({ children, ...props }: any) => (
                <div className="overflow-x-auto my-4 border border-neutral-200 rounded-lg">
                  <table {...props} className="min-w-full divide-y divide-neutral-200">{children}</table>
                </div>
              ),
            },
            thead: {
              component: ({ children, ...props }: any) => (
                <thead {...props} className="bg-neutral-50">{children}</thead>
              ),
            },
            tbody: {
              component: ({ children, ...props }: any) => (
                <tbody {...props} className="divide-y divide-neutral-200 bg-white">{children}</tbody>
              ),
            },
            tr: {
              component: ({ children, ...props }: any) => (
                <tr {...props} className="hover:bg-neutral-50/50">{children}</tr>
              ),
            },
            th: {
              component: ({ children, ...props }: any) => (
                <th {...props} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 border-b border-neutral-200">{children}</th>
              ),
            },
            td: {
              component: ({ children, ...props }: any) => (
                <td {...props} className="px-4 py-3 text-sm text-neutral-700 whitespace-pre-wrap">{children}</td>
              ),
            },
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

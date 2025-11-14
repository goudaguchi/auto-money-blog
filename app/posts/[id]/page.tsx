// app/posts/[id]/page.tsx
import { getAllPostIds, getPostData } from "../../../lib/posts";

type PageProps = {
  // Next.js 16 では params が Promise で渡ってくる
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const ids = getAllPostIds();
  return ids.map((id) => ({ id }));
}

export default async function PostPage({ params }: PageProps) {
  // Promise になっている params を await でほどく
  const { id } = await params;

  const post = await getPostData(id);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <article>
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <p className="text-sm text-gray-500">{post.date}</p>
        {post.one_liner && (
          <p className="mt-2 italic text-gray-700">{post.one_liner}</p>
        )}
        <div
          className="mt-6 space-y-3"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </main>
  );
}
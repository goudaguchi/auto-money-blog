// app/page.tsx
import Link from "next/link";
import { getSortedPostsData } from "../lib/posts";

export default async function HomePage() {
  const posts = getSortedPostsData();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">お金の思考ラボ</h1>
      <p className="text-gray-600 mb-8">
        ユダヤの教え / AI時代 / マネーの捉え方を、ゆるく言語化していくブログ。
      </p>

      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.id}>
            <h2 className="text-xl font-semibold">
              <Link href={`/posts/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-gray-500">{post.date}</p>
            {post.one_liner && (
              <p className="text-gray-700 mt-1">{post.one_liner}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
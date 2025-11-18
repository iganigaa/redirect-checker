import { notFound } from 'next/navigation';
import { client, urlFor } from '@/lib/sanity';
import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import Link from 'next/link';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  mainImage?: any;
  body: any;
  author?: {
    name: string;
    image?: any;
  };
}

async function getPost(slug: string): Promise<Post | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    mainImage,
    body,
    author-> {
      name,
      image
    }
  }`;
  
  return await client.fetch(query, { slug });
}

export default async function PostPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  // Await params (Next.js 15+)
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium"
        >
          ← Назад к блогу
        </Link>

        {/* Article */}
        <article className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Main Image */}
          {post.mainImage && (
            <div className="relative w-full h-96">
              <Image
                src={urlFor(post.mainImage).width(1200).height(630).url()}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
              {/* Author */}
              {post.author && (
                <div className="flex items-center gap-3">
                  {post.author.image && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={urlFor(post.author.image).width(48).height(48).url()}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="font-medium text-gray-900">
                    {post.author.name}
                  </span>
                </div>
              )}

              {/* Date */}
              <span className="text-gray-500">
                {new Date(post.publishedAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Body */}
            <div className="prose prose-lg max-w-none">
              <PortableText value={post.body} />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

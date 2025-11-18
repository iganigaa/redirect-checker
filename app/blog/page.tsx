import Link from 'next/link';
import Image from 'next/image';
import { client, urlFor } from '@/lib/sanity';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt?: string;
  mainImage?: any;
}

async function getPosts(): Promise<Post[]> {
  const query = `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage
  }`;
  
  return await client.fetch(query);
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f9f9f9', margin: 0, padding: 0, color: '#333' }}>
      <header style={{ maxWidth: '1100px', margin: 'auto', padding: '20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Блог</h1>
        <nav style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#666' }}>Главная</Link> → Блог
        </nav>
      </header>

      <main style={{ maxWidth: '1100px', margin: 'auto', padding: '20px' }}>
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {posts.map((post) => (
            <article key={post._id} style={{
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Изображение */}
              {post.mainImage ? (
                <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                  <Image
                    src={urlFor(post.mainImage).width(600).height(400).url()}
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  height: '180px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.5rem'
                }}>
                  📝
                </div>
              )}

              {/* Контент */}
              <div style={{
                padding: '15px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 10px', color: '#0066cc' }}>
                  <Link href={`/blog/${post.slug.current}`} style={{ textDecoration: 'none', color: '#0066cc' }}>
                    {post.title}
                  </Link>
                </h2>
                
                <p style={{ flex: 1, fontSize: '0.95rem', marginBottom: '10px', color: '#333' }}>
                  {post.excerpt || 'Читайте статью полностью...'}
                </p>

                <div style={{
                  fontSize: '0.8rem',
                  color: '#777',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                  <span style={{ color: '#f39c12' }}>★★★★★</span>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Пустое состояние */}
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <p>Статьи пока не опубликованы</p>
          </div>
        )}
      </main>

      <footer style={{ maxWidth: '1100px', margin: 'auto', padding: '20px', textAlign: 'center', color: '#999' }}>
        <p>© 2025 SEO Блог</p>
      </footer>
    </div>
  );
}

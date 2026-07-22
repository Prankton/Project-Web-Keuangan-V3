import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // 1. Inisialisasi response object
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Buat Supabase Client khusus untuk Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Ambil data user dari Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Logika Keamanan (Proteksi Halaman)
  // Jika belum login dan mencoba buka halaman selain /login -> Arahkan ke /login
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Jika sudah login dan mencoba buka halaman /login -> Arahkan ke Dashboard (/)
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// 5. KONFIGURASI MATCHER (Sangat Penting untuk mencegah Error 500 di Vercel)
export const config = {
  matcher: [
    /*
     * Middleware hanya akan berjalan di halaman web, KECUALI file statis di bawah ini:
     * - _next/static (file sistem)
     * - _next/image (optimasi gambar)
     * - favicon.ico (ikon web)
     * - Semua file berekstensi gambar/vektor
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
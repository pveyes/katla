import Container from "../components/Container";
import Header from "../components/Header";
import Link from "../components/Link";

export default function NotFound() {
  return (
    <Container>
      <Header title="Katla | Halaman tidak ditemukan" />
      <div className="px-4 mx-auto max-w-lg w-full pt-2 pb-4 text-center">
        <h2 className="text-2xl font-semibold mb-4">404</h2>
        <p className="mb-2">Halaman yang kamu cari tidak ditemukan.</p>
        <Link href="/">Kembali ke beranda</Link>
      </div>
    </Container>
  );
}

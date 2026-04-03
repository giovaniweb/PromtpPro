export default function AdminGalleryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Gestão de Catálogo</h1>
      <p className="text-gray-400 text-sm mb-10">Edite, desative ou exclua estilos da galeria pública.</p>

      <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/10 text-center">
        <div className="text-5xl mb-4">🗂️</div>
        <p className="text-lg font-medium text-gray-300">Em breve</p>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Esta tela permitirá editar nomes, categorias, desativar ou excluir estilos
          diretamente da galeria pública sem precisar de SQL.
        </p>
      </div>
    </main>
  );
}

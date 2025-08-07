import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="pt-24 pb-10 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Termos de Uso</h1>

      <p className="text-gray-700 mb-4">
        Ao utilizar a plataforma InfraWatch, você concorda com os seguintes termos e condições:
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">1. Uso Permitido</h2>
      <p className="text-gray-700 mb-4">
        O uso da plataforma é permitido exclusivamente para fins autorizados. Qualquer uso indevido pode resultar na suspensão ou remoção do acesso.
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">2. Responsabilidade</h2>
      <p className="text-gray-700 mb-4">
        A InfraWatch não se responsabiliza por danos causados por uso indevido das informações fornecidas no sistema.
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">3. Alterações nos Termos</h2>
      <p className="text-gray-700 mb-4">
        Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações serão comunicadas via sistema ou e-mail.
      </p>

      <p className="text-sm text-gray-500 mt-6">Última atualização: Agosto de 2025</p>

      <div className="mt-10">
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
        >
          Voltar à página inicial
        </Link>
      </div>
    </div>
  );
}

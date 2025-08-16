import { Bell, HelpCircle, Search } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function TopBar() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between w-full p-4 bg-[#0B1440]">
      
      {/* Barra de pesquisa ocupa o espaço máximo possível */}
      <div className="flex items-center bg-white rounded-full px-4 py-2 flex-1 max-w-2xl shadow-md">
        <Search className="text-gray-500 w-5 h-5 mr-2" />
        <input
          type="text"
          placeholder={t('navigation.search') || 'Pesquisar...'}
          className="flex-1 outline-none text-gray-700"
        />
      </div>

      {/* Ícones e avatar no canto direito */}
      <div className="flex items-center space-x-4 ml-4">
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
          <Bell className="text-white w-5 h-5" />
        </button>
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20">
          <HelpCircle className="text-white w-5 h-5" />
        </button>
        <img
          src="/profile.jpg" // coloca sua imagem na pasta public
          alt="Perfil"
          className="w-10 h-10 rounded-full border-2 border-white"
        />
      </div>
    </div>
  );
}

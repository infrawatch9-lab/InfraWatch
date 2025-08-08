import {
	Home,
	Users,
	FileBarChart2,
	Settings,
	Bell,
	Server,
	LogOut,
	Menu,
	X,
  } from "lucide-react";
  import { NavLink, Link } from "react-router-dom";
  import { useState } from "react";
  import { useAuth } from "./AuthContext";
  
  const navItems = [
	{ label: "Dashboard", icon: Home, to: "/dashboard" },
	{ label: "Relatórios", icon: FileBarChart2, to: "/reports" },
	{ label: "Usuários", icon: Users, to: "/users" },
	{ label: "Sistemas", icon: Server, to: "/systems" },
	{ label: "Notificações", icon: Bell, to: "/notifications" },
	{ label: "Configurações", icon: Settings, to: "/settings" },
  ];
  
  export default function SideNav() {
	const [open, setOpen] = useState(false);
	const { logout } = useAuth();

	const user = {
	  name: "João Silva",
	  role: "Administrador",
	  avatar: "/img/user_avatar.jpg",
	};
  
	return (
	  <>
		<div className={`md:hidden fixed top-4 left-4 z-50 ${open && 'hidden'}`}>
		  <button
			onClick={() => setOpen(true)}
			className="bg-blue-700 text-white p-2 rounded-lg shadow-lg"
		  >
			<Menu className="w-6 h-6" />
		  </button>
		</div>
  
		<aside
		  className={`fixed top-0 left-0 z-40 bg-[#0A0F1E] text-gray-200 w-64 h-screen p-4 shadow-lg flex flex-col justify-between transition-transform duration-300 ease-in-out
			${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
		>
		  <div className="flex flex-col justify-between h-full">
			<div>
			  <div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-3">
				  <img
					src={'/img/logo.png'}
					className="w-12 h-12 shadow-md"
				  />
				  <div>
					<h1 className="text-lg font-bold text-white">{user.name}</h1>
					<p className="text-sm text-blue-400">{user.role}</p>
				  </div>
				</div>
  
				<button
				  onClick={() => setOpen(false)}
				  className="md:hidden text-gray-400 hover:text-white transition"
				>
				  <X className="w-5 h-5" />
				</button>
			  </div>
  
			  <nav className="space-y-1">
				{navItems.map(({ label, icon: Icon, to }) => (
				  <NavLink
					key={label}
					to={to}
					onClick={() => setOpen(false)}
					className={({ isActive }) =>
					  `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition
					  ${
						isActive
						  ? "bg-blue-600 text-white"
						  : "hover:bg-[#131B33] text-gray-300"
					  }`
					}
				  >
					<Icon className="w-5 h-5" />
					{label}
				  </NavLink>
				))}
			  </nav>
			</div>
 
			<div className="space-y-4 px-2">

			  <button
				onClick={logout}
				className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition"
			  >
				<LogOut className="w-5 h-5" />
				Sair
			  </button>
  
			  <footer className="text-xs text-gray-500 text-center">
				<p className="font-semibold text-gray-400">
				  InfraWatch &copy; {new Date().getFullYear()}
				</p>
				<div className="flex flex-col gap-1 mt-2">
				  <Link
					to="/privacy"
					className="hover:text-blue-400 transition"
				  >
					Privacidade
				  </Link>
				  <Link to="/terms" className="hover:text-blue-400 transition">
					Termos
				  </Link>
				  <Link to="/contact" className="hover:text-blue-400 transition">
					Contato
				  </Link>
				</div>
			  </footer>
			</div>
		  </div>
		</aside>
	  </>
	);
  }
  
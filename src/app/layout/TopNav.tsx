import logo from "../../assets/ModuServ_Version2.png";
import "./TopNav.css";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

type Props = {
  onMenuToggle: () => void;
};

export function TopNav({ onMenuToggle }: Props) {
  return (
    <header className="ms-topnav">
      <button
        className="ms-topnav__hamburger"
        onClick={onMenuToggle}
        aria-label="Toggle navigation"
      >
        <Menu size={22} />
      </button>
      <Link to="/dashboard" className="ms-topnav__brand" aria-label="Go to dashboard">
        <img src={logo} alt="ModuServ" className="ms-topnav__logo" />
      </Link>
    </header>
  );
}

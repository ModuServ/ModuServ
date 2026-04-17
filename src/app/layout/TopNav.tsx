import logo from "../../assets/ModuServ_Version2.png";
import "./TopNav.css";
import { Link } from "react-router-dom";

export function TopNav() {
  return (
    <header className="ms-topnav">
      <Link to="/dashboard" className="ms-topnav__brand" aria-label="Go to dashboard">
        <img src={logo} alt="ModuServ" className="ms-topnav__logo" />
      </Link>
    </header>
  );
}

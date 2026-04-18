import "./Login.css";
import logo from "../../../assets/ModuServ_Version2.png";
import { useState } from "react";
import { Eye, EyeOff, Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? { text: "Good Morning",   icon: <Sun     size={28} color="#f59e0b" /> } :
    hour < 17 ? { text: "Good Afternoon", icon: <CloudSun size={28} color="#0ea5e9" /> } :
    hour < 21 ? { text: "Good Evening",   icon: <Sunset  size={28} color="#f97316" /> } :
                { text: "Good Night",     icon: <Moon    size={28} color="#6366f1" /> };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(username.trim(), password);

      if (!result.success) {
        setError(result.error || "Invalid credentials");
        return;
      }

      navigate("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ms-login">
      <section className="ms-login__panel">
        <div className="ms-login__brand">
  <div className="ms-login__brand-copy">
  <img src={logo} alt="ModuServ Logo" className="ms-login__logo" />
</div>
</div>

        <div className="ms-login__content">
          <div className="ms-login__header">
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
              {greeting.text}
              <span style={{ display: "flex", alignItems: "center" }}>{greeting.icon}</span>
            </h1>
            <p>Sign in to your account to continue.</p>
          </div>

          <form className="ms-login__form" onSubmit={handleSubmit}>
            <div className="ms-login__field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            <div className="ms-login__field">
              <label htmlFor="password">Password</label>
              <div className="ms-login__password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="ms-login__password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="ms-login__error">{error}</div>

            <button type="submit" className="ms-login__submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Login"}
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}





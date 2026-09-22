import React, { useEffect, useState } from "react";
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiSmartphone } from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { loginUser, logoutUser } from "../../../features/auth/authThunks";

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location=useLocation();
  const { loading, error, user, token } = useAppSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;
    const destinations: Record<string, string> = {
      admin: "/admin",
      barber: "/barber",
      receptionist: "/receptionist",
      platform_admin: "/platform",
      customer: "/booking",
    };
    const role=String(user.role || "").toLowerCase();
    const destination = role==='admin'&&!user.subscription?.canOperate?'/admin?view=package':destinations[role];
    if (destination) {
      const from=location.state?.from;
      navigate(typeof from==='string'&&(from===destination||from.startsWith(destination+'?'))?from:destination, { replace: true });
      return;
    }
    setAccessError("This account does not have a Mirror page to open.");
    dispatch(logoutUser());
  }, [dispatch, navigate, token, user, location.state]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAccessError(null);
    dispatch(loginUser({ identifier: identifier.trim(), password }));
  };

  return (
    <main className="workspace-login-page">
      <div className="workspace-login-shell">
        <section className="workspace-login-panel">
          <Link className="workspace-login-brand" to="/" aria-label="Mirror public site"><span><img src="/mirror.svg" alt=""/></span><strong>Mirror</strong></Link>
          <div className="workspace-login-copy"><p className="admin-eyebrow">YOUR MIRROR PAGE</p><h1>Welcome back</h1><p>Enter your phone or email and password. Mirror opens the right page for you.</p></div>

          <form className="workspace-login-form" onSubmit={handleSubmit}>
            {(error || accessError) && <div className="workspace-login-error" role="alert">{accessError || error}</div>}
            <label className="workspace-login-field"><span>Phone number or email</span><div><FiSmartphone /><input type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="0912345678 or you@example.com" autoComplete="username" required /></div><small>Staff use their phone number. Shop and platform owners can use their email.</small></label>
            <label className="workspace-login-field"><span>Password</span><div><FiLock /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>
            <button className="workspace-login-submit" type="submit" disabled={loading}><span>{loading ? "Signing in…" : "Sign in"}</span>{!loading && <FiArrowRight />}</button>
          </form>

          <p className="workspace-login-help">Do you own a salon or shop? <Link to="/signup">Start 7 days free</Link>. Staff can ask the owner to make their account.</p>
          <Link className="workspace-login-back" to="/"><FiArrowLeft /> Back to Mirror website</Link>
        </section>

        <aside className="workspace-login-visual" aria-hidden="true">
          <div className="workspace-login-orb workspace-login-orb-one" /><div className="workspace-login-orb workspace-login-orb-two" />
          <div className="workspace-login-visual-content"><span className="workspace-login-visual-icon"><img src="/mirror.svg" alt=""/></span><p>ONE SIMPLE SYSTEM</p><h2>Keep your shop day clear.</h2><div className="workspace-login-benefits"><span><FiCheckCircle /> See your staff and money</span><span><FiCheckCircle /> Manage reception easily</span><span><FiCheckCircle /> See each stylist’s customers</span></div></div>
          <div className="workspace-login-preview"><div className="workspace-login-preview-top"><span /><span /><span /></div><div className="workspace-login-preview-body"><div className="workspace-login-preview-nav" /><div className="workspace-login-preview-main"><span /><div><i /><i /><i /></div><b /><b /></div></div></div>
        </aside>
      </div>
    </main>
  );
};

export default LoginPage;

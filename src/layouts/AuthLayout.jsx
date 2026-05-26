function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-wrapper">
      <div className="glass-container">
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;

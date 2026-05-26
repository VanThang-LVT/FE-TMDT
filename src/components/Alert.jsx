function Alert({ type = 'success', message }) {
  if (!message) 
    return null;
  const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
  
  return (
    <div className={`alert ${alertClass}`}>
      {message}
    </div>
  );
}

export default Alert;

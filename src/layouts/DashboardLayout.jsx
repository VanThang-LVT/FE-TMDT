import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function DashboardLayout({ brandName, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '80px' }}>
      <Navbar brandName={brandName} />
      
      <main className="dashboard-wrapper" style={{ flex: 1, marginTop: '20px', minHeight: 'calc(100vh - 350px)' }}>
        {children}
      </main>
      
      <Footer />
    </div>
  );
}

export default DashboardLayout;

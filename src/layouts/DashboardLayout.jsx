import Navbar from '../components/Navbar';

function DashboardLayout({ brandName, children }) {
  return (
    <div className="dashboard-wrapper">
      <Navbar brandName={brandName} />
      <main>
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;

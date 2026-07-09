import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminReconciliationApi } from '../../services/reconciliation.service';
import AdminLayout from '../../layouts/AdminLayout';
import './AdminPage.css';

const formatVND = (amount) => {
  if (amount == null) return '0 ₫';
  return Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

const formatMonth = (m) => {
  if (!m) return '';
  if (m.startsWith('w-')) {
    const dayIndex = parseInt(m.split('-')[1]);
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    return dayNames[dayIndex] || m;
  }
  if (m.startsWith('m-')) {
    const day = m.split('-')[1];
    return `Ngày ${day}`;
  }
  if (m.startsWith('y-')) {
    const month = m.split('-')[1];
    return `Tháng ${month}`;
  }
  const parts = m.split('-');
  return `Tháng ${parts[1]}/${parts[0]}`;
};

// ==========================================
// BEAUTIFUL INTERACTIVE SVG CHART COMPONENT
// ==========================================
function ReconciliationChart({ monthlyDetails, period, setPeriod }) {
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar'
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!monthlyDetails || monthlyDetails.length === 0) {
    return (
      <div className="recon-chart-card" style={{ height: '320px', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1' }}>bar_chart</span>
          <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px' }}>Chưa có dữ liệu biểu đồ</p>
        </div>
      </div>
    );
  }

  // Display chronologically from past to present (already ordered by backend)
  const sortedData = [...monthlyDetails];

  const maxVal = Math.max(
    ...sortedData.map(d => Number(d.sellerPayout) || 0),
    100000
  );

  // Calculate a nice, clean step interval for Y axis ticks
  const rawStep = (maxVal * 1.15) / 4;
  const order = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / order;
  let roundedNormalized;
  if (normalized <= 1) roundedNormalized = 1;
  else if (normalized <= 2) roundedNormalized = 2;
  else if (normalized <= 2.5) roundedNormalized = 2.5;
  else if (normalized <= 5) roundedNormalized = 5;
  else roundedNormalized = 10;

  const step = roundedNormalized * order;
  const roundedMax = step * 4;

  const svgWidth = 1100;
  const svgHeight = 320;
  const paddingLeft = 70;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index) => {
    const spacing = chartWidth / sortedData.length;
    return paddingLeft + spacing * (index + 0.5);
  };

  const getY = (value) => {
    return svgHeight - paddingBottom - (Number(value) / roundedMax) * chartHeight;
  };

  // Generate grid values for Y-axis (4 divisions)
  const yTicks = [];
  for (let i = 0; i <= 4; i++) {
    yTicks.push((roundedMax * i) / 4);
  }

  const makePath = (key) => {
    return sortedData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] || 0)}`).join(' ');
  };

  const makeAreaPath = (key) => {
    const linePath = makePath(key);
    if (!linePath) return '';
    const startX = getX(0);
    const endX = getX(sortedData.length - 1);
    const bottomY = svgHeight - paddingBottom;
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Scale X percentage to find nearest index
    const xSvg = x * (svgWidth / rect.width);
    const spacing = chartWidth / sortedData.length;
    let idx = Math.round((xSvg - paddingLeft - spacing / 2) / spacing);
    idx = Math.max(0, Math.min(sortedData.length - 1, idx));

    setHoveredIndex(idx);

    setTooltipPos({
      x: getX(idx) * (rect.width / svgWidth),
      y: getY(sortedData[idx].sellerPayout) * (rect.height / svgHeight) - 100
    });
  };

  return (
    <div className="recon-chart-card">
      <div className="recon-chart-header">
        <div className="recon-chart-title-group">
          <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>monitoring</span>
          <h3 className="recon-chart-title">Xu Hướng Thu Nhập Thực Nhận Của Seller</h3>
        </div>
        <div className="recon-chart-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>


          <div className="recon-chart-tabs">
            <button
              className={`recon-chart-tab ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>show_chart</span>
              Đường
            </button>
            <button
              className={`recon-chart-tab ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bar_chart</span>
              Cột
            </button>
          </div>
        </div>
      </div>

      <div className="recon-chart-svg-container" style={{ height: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="recon-chart-svg"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="grad-payout" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis values */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} className="recon-chart-grid-line" />
                <text x={paddingLeft - 12} y={y + 4} textAnchor="end" className="recon-chart-text">
                  {tick >= 1000000 ? (tick / 1000000).toLocaleString('vi-VN') + 'Tr' : tick >= 1000 ? (tick / 1000).toLocaleString('vi-VN') + 'k' : tick.toLocaleString('vi-VN')}
                </text>
              </g>
            );
          })}

          {/* X Axis month titles */}
          {sortedData.map((d, i) => (
            <text key={i} x={getX(i)} y={svgHeight - paddingBottom + 22} textAnchor="middle" className="recon-chart-text" style={{ fontWeight: 600 }}>
              {formatMonth(d.month).replace('Thứ ', 'T').replace('Chủ Nhật', 'CN').replace('Ngày ', '').replace('Tháng ', 'T')}
            </text>
          ))}

          {/* Axis line borders */}
          <line x1={paddingLeft} y1={svgHeight - paddingBottom} x2={svgWidth - paddingRight} y2={svgHeight - paddingBottom} className="recon-chart-axis-line" />
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={svgHeight - paddingBottom} className="recon-chart-axis-line" />

          {/* Line view */}
          {chartType === 'line' && (
            <>
              <path d={makeAreaPath('sellerPayout')} fill="url(#grad-payout)" className="recon-chart-area" />
              <path d={makePath('sellerPayout')} stroke="#ea580c" className="recon-chart-line" />

              {sortedData.map((d, i) => (
                <g key={i}>
                  <circle cx={getX(i)} cy={getY(d.sellerPayout)} r={hoveredIndex === i ? 6 : 4} fill="#ffffff" stroke="#ea580c" className="recon-chart-point" />
                </g>
              ))}
            </>
          )}

          {/* Bar view */}
          {chartType === 'bar' && (
            <g>
              {sortedData.map((d, idx) => {
                const groupCenterX = getX(idx);
                const barWidth = sortedData.length > 1 ? (chartWidth / sortedData.length) * 0.4 : 60;
                const startX = groupCenterX - barWidth / 2;
                const yPay = getY(d.sellerPayout);
                const zeroY = svgHeight - paddingBottom;

                return (
                  <g key={idx} opacity={hoveredIndex !== null && hoveredIndex !== idx ? 0.35 : 1} style={{ transition: 'opacity 0.2s' }}>
                    <rect x={startX} y={yPay} width={barWidth} height={Math.max(0, zeroY - yPay)} fill="#ea580c" rx={4} className="recon-chart-bar" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Vertical guidline */}
          {hoveredIndex !== null && chartType === 'line' && (
            <line x1={getX(hoveredIndex)} y1={paddingTop} x2={getX(hoveredIndex)} y2={svgHeight - paddingBottom} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" />
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="recon-chart-tooltip"
            style={{
              left: `${tooltipPos.x + 16}px`,
              top: `${Math.max(10, Math.min(180, tooltipPos.y))}px`
            }}
          >
            <div className="recon-tooltip-title">{formatMonth(sortedData[hoveredIndex].month)}</div>
            <div className="recon-tooltip-row">
              <span><span className="recon-tooltip-dot" style={{ backgroundColor: '#16a34a' }} />Doanh thu:</span>
              <span style={{ fontWeight: 700 }}>{formatVND(sortedData[hoveredIndex].revenue)}</span>
            </div>
            <div className="recon-tooltip-row">
              <span><span className="recon-tooltip-dot" style={{ backgroundColor: '#7c3aed' }} />Hoa hồng:</span>
              <span style={{ fontWeight: 700 }}>{formatVND(sortedData[hoveredIndex].commission)}</span>
            </div>
            <div className="recon-tooltip-row">
              <span><span className="recon-tooltip-dot" style={{ backgroundColor: '#ea580c' }} />Thực nhận:</span>
              <span style={{ fontWeight: 700 }}>{formatVND(sortedData[hoveredIndex].sellerPayout)}</span>
            </div>
            <div className="recon-tooltip-row" style={{ borderTop: '1px solid #334155', paddingTop: '6px', marginTop: '2px' }}>
              <span>Số đơn hàng:</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{Number(sortedData[hoveredIndex].orderCount).toLocaleString()} đơn</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN ADMIN RECONCILIATION PAGE
// ==========================================
function AdminReconciliationPage() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shopSearch, setShopSearch] = useState('');
  const [period, setPeriod] = useState('month'); // 'week' | 'month' | 'year'
  const [shopPage, setShopPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminReconciliationApi(token, period);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login');
      else if (!isAdmin()) navigate('/');
      else fetchData();
    }
  }, [user, authLoading, isAdmin, navigate, fetchData]);

  if (authLoading || !user || !isAdmin()) return null;

  const filteredShops = (data?.shopDetails || []).filter(s =>
    s.shopName?.toLowerCase().includes(shopSearch.toLowerCase())
  );

  const shopsPerPage = 5;
  const totalShopPages = Math.ceil(filteredShops.length / shopsPerPage);
  const currentShops = filteredShops.slice((shopPage - 1) * shopsPerPage, shopPage * shopsPerPage);

  // Compute Top 5 Shops by completed revenue volume
  const topShops = [...(data?.shopDetails || [])]
    .sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0))
    .slice(0, 5);

  const maxShopRevenue = topShops[0]?.totalRevenue || 1;

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Đối Soát Tài Chính</h2>
          <p className="admin-page-desc">Thống kê doanh thu, hoa hồng và dòng tiền toàn sàn</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="recon-chart-tabs header-tabs">
            <button
              className={`recon-chart-tab ${period === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              Tuần
            </button>
            <button
              className={`recon-chart-tab ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              Tháng
            </button>
            <button
              className={`recon-chart-tab ${period === 'year' ? 'active' : ''}`}
              onClick={() => setPeriod('year')}
            >
              Năm
            </button>
          </div>
          <button className="admin-category-header-btn" onClick={fetchData}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
            Làm mới
          </button>
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-state">
          <div className="admin-loading-container" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <div className="spinner"></div> Đang tải dữ liệu đối soát...
          </div>
        </div>
      ) : data && (
        <>
          <div className="recon-cards-grid">
            <div className="recon-card recon-card--blue">
              <div className="recon-card__body">
                <p className="recon-card__label">Tổng đơn hàng</p>
                <p className="recon-card__value">{Number(data.totalOrders).toLocaleString('vi-VN')}</p>
                <div className="recon-card__sub">
                  <span className="recon-badge recon-badge--green">✓ {Number(data.completedOrders).toLocaleString()} hoàn thành</span>
                  <span className="recon-badge recon-badge--yellow">⏳ {Number(data.pendingOrders).toLocaleString()} đang xử lý</span>
                  <span className="recon-badge recon-badge--red">✗ {Number(data.cancelledOrders).toLocaleString()} huỷ</span>
                </div>
              </div>
            </div>

            <div className="recon-card recon-card--green">
              <div className="recon-card__body">
                <p className="recon-card__label">Doanh thu sàn (đơn HOÀN THÀNH)</p>
                <p className="recon-card__value">{formatVND(data.totalRevenue)}</p>
                <p className="recon-card__note">Tổng giá trị hàng hoá đã giao dịch thành công</p>
              </div>
            </div>

            <div className="recon-card recon-card--purple">
              <div className="recon-card__body">
                <p className="recon-card__label">Hoa hồng sàn nhận</p>
                <p className="recon-card__value">{formatVND(data.totalCommission)}</p>
                <p className="recon-card__note">Phí dịch vụ thu từ Seller theo % danh mục</p>
              </div>
            </div>

            <div className="recon-card recon-card--red" style={{ '--card-accent': '#dc2626' }}>
              <div className="recon-card__body">
                <p className="recon-card__label">Chi phí trợ giá Voucher</p>
                <p className="recon-card__value" style={{ color: '#dc2626' }}>{formatVND(data.totalVoucherDiscount)}</p>
                <p className="recon-card__note">Tổng số tiền sàn trợ giá khuyến mãi cho người mua</p>
              </div>
            </div>

            <div className="recon-card recon-card--green" style={{ '--card-accent': '#16a34a' }}>
              <div className="recon-card__body">
                <p className="recon-card__label">Lợi nhuận ròng của sàn</p>
                <p className="recon-card__value" style={{ color: '#16a34a' }}>{formatVND(data.netPlatformRevenue)}</p>
                <p className="recon-card__note">Lợi nhuận thực tế sau khi khấu trừ chi phí Voucher</p>
              </div>
            </div>

            <div className="recon-card recon-card--orange">
              <div className="recon-card__body">
                <p className="recon-card__label">Thực nhận của Seller</p>
                <p className="recon-card__value">{formatVND(data.totalSellerPayout)}</p>
                <p className="recon-card__note">Tiền chuyển hoặc chuẩn bị chuyển về ví Seller</p>
              </div>
            </div>

            <div className="recon-card recon-card--red">
              <div className="recon-card__body">
                <p className="recon-card__label">Đang giữ hộ Seller</p>
                <p className="recon-card__value">{formatVND(data.pendingSettlement)}</p>
                <p className="recon-card__note">Tiền từ đơn chưa hoàn thành (đang trong quy trình)</p>
              </div>
            </div>
          </div>

          <div className="recon-dashboard-row">
            <ReconciliationChart monthlyDetails={data.monthlyDetails} period={period} setPeriod={setPeriod} />

            <div className="recon-top-shops-card">
              <div className="recon-top-shops-header">
                <span className="material-symbols-outlined" style={{ color: '#ffb020' }}>military_tech</span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Top 5 Gian Hàng Doanh Thu</h3>
              </div>
              <div className="recon-top-shops-list">
                {topShops.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>Chưa có doanh số</p>
                ) : (
                  topShops.map((shop, idx) => {
                    const pct = maxShopRevenue > 0 ? (Number(shop.totalRevenue) / Number(maxShopRevenue)) * 100 : 0;
                    const barColors = [
                      { start: '#3b82f6', end: '#1d4ed8' },
                      { start: '#10b981', end: '#047857' },
                      { start: '#8b5cf6', end: '#6d28d9' },
                      { start: '#f59e0b', end: '#b45309' },
                      { start: '#64748b', end: '#475569' }
                    ];
                    const color = barColors[idx] || barColors[4];

                    return (
                      <div className="recon-shop-stat-item" key={shop.shopId}>
                        <div className="recon-shop-stat-info">
                          <span className="recon-shop-stat-name">{idx + 1}. {shop.shopName}</span>
                          <span className="recon-shop-stat-val">{formatVND(shop.totalRevenue)}</span>
                        </div>
                        <div className="recon-progress-container">
                          <div
                            className="recon-progress-fill"
                            style={{
                              width: `${pct}%`,
                              '--bar-color-start': color.start,
                              '--bar-color-end': color.end
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="admin-table-card recon-table-card">
            <div className="recon-table-header">
              <div className="recon-table-title">
                <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>storefront</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Đối Soát Theo Gian Hàng</h3>
              </div>
              <div className="recon-table-search">
                <span className="material-symbols-outlined recon-table-search-icon">search</span>
                <input
                  type="text"
                  className="admin-category-form-input"
                  placeholder="Tìm gian hàng..."
                  value={shopSearch}
                  onChange={(e) => {
                    setShopSearch(e.target.value);
                    setShopPage(1);
                  }}
                  style={{ width: '220px', paddingLeft: '36px', margin: 0, height: '38px' }}
                />
              </div>
            </div>
            <div className="admin-table-container" style={{ marginTop: '16px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Gian hàng</th>
                    <th style={{ textAlign: 'right' }}>Tổng đơn</th>
                    <th style={{ textAlign: 'right' }}>Hoàn thành</th>
                    <th style={{ textAlign: 'right' }}>Doanh thu</th>
                    <th style={{ textAlign: 'right' }}>Hoa hồng</th>
                    <th style={{ textAlign: 'right' }}>Seller nhận</th>
                    <th style={{ textAlign: 'right' }}>Đang giữ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.length === 0 ? (
                    <tr><td colSpan="7" className="admin-empty-state">
                      <div className="empty-content">
                        <span className="material-symbols-outlined empty-icon">storefront</span>
                        <p>Không tìm thấy gian hàng nào</p>
                      </div>
                    </td></tr>
                  ) : (
                    currentShops.map((s) => (
                      <tr key={s.shopId}>
                        <td>
                          <div className="admin-shop-info">
                            <div className="admin-shop-avatar">{s.shopName?.substring(0, 2).toUpperCase()}</div>
                            <div>
                              <p className="admin-shop-name">{s.shopName}</p>
                              <p className="admin-shop-time">ID: {s.shopId}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{Number(s.totalOrders).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="admin-status-badge" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            {Number(s.completedOrders).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{formatVND(s.totalRevenue)}</td>
                        <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 600 }}>{formatVND(s.totalCommission)}</td>
                        <td style={{ textAlign: 'right', color: '#ea580c', fontWeight: 600 }}>{formatVND(s.sellerPayout)}</td>
                        <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>{formatVND(s.pendingAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalShopPages > 1 && (
              <div className="admin-pagination-container justify-center bg-light">
                <button
                  className="admin-pagination-arrow-btn"
                  disabled={shopPage === 1}
                  onClick={() => setShopPage(prev => Math.max(prev - 1, 1))}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                </button>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                  Trang {shopPage} / {totalShopPages}
                </span>
                <button
                  className="admin-pagination-arrow-btn"
                  disabled={shopPage >= totalShopPages}
                  onClick={() => setShopPage(prev => Math.min(prev + 1, totalShopPages))}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default AdminReconciliationPage;

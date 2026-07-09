import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSellerReconciliationApi } from '../../services/reconciliation.service';
import SellerLayout from '../../layouts/SellerLayout';
import '../admin/AdminPage.css';

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

function ReconciliationChart({ monthlyDetails, period, setPeriod }) {
  const [chartType, setChartType] = useState('line');
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

  const sortedData = [...monthlyDetails];

  const maxVal = Math.max(
    ...sortedData.map(d => Number(d.sellerPayout) || 0),
    100000
  );
  const rawStep = (maxVal * 1.15) / 4;
  const order = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / order;
  let roundedNormalized;
  if (normalized <= 1)
    roundedNormalized = 1;
  else if (normalized <= 2)
    roundedNormalized = 2;
  else if (normalized <= 2.5)
    roundedNormalized = 2.5;
  else if (normalized <= 5)
    roundedNormalized = 5;
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
          <h3 className="recon-chart-title">Biểu Đồ Xu Hướng Thu Nhập Thực Nhận</h3>
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

          {sortedData.map((d, i) => (
            <text key={i} x={getX(i)} y={svgHeight - paddingBottom + 22} textAnchor="middle" className="recon-chart-text" style={{ fontWeight: 600 }}>
              {formatMonth(d.month).replace('Thứ ', 'T').replace('Chủ Nhật', 'CN').replace('Ngày ', '').replace('Tháng ', 'T')}
            </text>
          ))}

          <line x1={paddingLeft} y1={svgHeight - paddingBottom} x2={svgWidth - paddingRight} y2={svgHeight - paddingBottom} className="recon-chart-axis-line" />
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={svgHeight - paddingBottom} className="recon-chart-axis-line" />

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

          {hoveredIndex !== null && chartType === 'line' && (
            <line x1={getX(hoveredIndex)} y1={paddingTop} x2={getX(hoveredIndex)} y2={svgHeight - paddingBottom} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" />
          )}
        </svg>

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
              <span><span className="recon-tooltip-dot" style={{ backgroundColor: '#16a34a' }} />Giá trị đơn:</span>
              <span style={{ fontWeight: 700 }}>{formatVND(sortedData[hoveredIndex].revenue)}</span>
            </div>
            <div className="recon-tooltip-row">
              <span><span className="recon-tooltip-dot" style={{ backgroundColor: '#dc2626' }} />Phí hoa hồng:</span>
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

function SellerReconciliationPage() {
  const { user, token, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('month');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSellerReconciliationApi(token, period);
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
      else if (!isSeller()) navigate('/');
      else fetchData();
    }
  }, [user, authLoading, isSeller, navigate, fetchData]);

  if (authLoading || !user || !isSeller()) return null;

  const filteredOrders = (data?.orderDetails || []).filter(o =>
    String(o.shopOrderId).includes(orderSearch.trim())
  );

  const ordersPerPage = 10;
  const totalOrderPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const currentOrders = filteredOrders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage);

  return (
    <SellerLayout>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Đối Soát Tài Chính</h2>
          <p className="admin-page-desc">
            {data?.shopName ? `Gian hàng: ${data.shopName}` : 'Thống kê doanh thu và thu nhập của bạn'}
          </p>
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
          <div className="recon-cards-grid recon-cards-grid--5cols">
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
                <p className="recon-card__label">Tổng giá trị đơn hoàn thành</p>
                <p className="recon-card__value">{formatVND(data.totalRevenue)}</p>
                <p className="recon-card__note">Giá trị hàng hoá đơn đã giao thành công</p>
              </div>
            </div>

            <div className="recon-card recon-card--red" style={{ '--card-accent': '#dc2626' }}>
              <div className="recon-card__body">
                <p className="recon-card__label">Phí hoa hồng đã trả sàn</p>
                <p className="recon-card__value" style={{ color: '#dc2626' }}>{formatVND(data.totalCommission)}</p>
                <p className="recon-card__note">Chi phí dịch vụ tính theo % danh mục sản phẩm</p>
              </div>
            </div>

            <div className="recon-card recon-card--green" style={{ '--card-accent': '#ea580c' }}>
              <div className="recon-card__body">
                <p className="recon-card__label">Thu nhập thực nhận</p>
                <p className="recon-card__value" style={{ color: '#ea580c' }}>{formatVND(data.totalSellerPayout)}</p>
                <p className="recon-card__note">Doanh thu sau khi trừ phí hoa hồng</p>
              </div>
            </div>

            <div className="recon-card recon-card--orange">
              <div className="recon-card__body">
                <p className="recon-card__label">Đang chờ thanh toán</p>
                <p className="recon-card__value">{formatVND(data.pendingSettlement)}</p>
                <p className="recon-card__note">Tiền từ đơn đang xử lý, chưa hoàn tất</p>
              </div>
            </div>
          </div>

          <ReconciliationChart monthlyDetails={data.monthlyDetails} period={period} setPeriod={setPeriod} />

          <div className="admin-table-card recon-table-card">
            <div className="recon-table-header">
              <div className="recon-table-title">
                <span className="material-symbols-outlined" style={{ color: '#ea580c' }}>receipt_long</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Danh Sách Đơn Hàng Đối Soát</h3>
              </div>
              <div className="recon-table-search">
                <span className="material-symbols-outlined recon-table-search-icon">search</span>
                <input
                  type="text"
                  className="admin-category-form-input"
                  placeholder="Tìm mã đơn hàng..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrderPage(1);
                  }}
                  style={{ width: '220px', paddingLeft: '36px', margin: 0, height: '38px' }}
                />
              </div>
            </div>
            <div className="admin-table-container" style={{ marginTop: '16px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Ngày Đặt</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Trước Hoa Hồng</th>
                    <th style={{ textAlign: 'right' }}>Phí Hoa Hồng</th>
                    <th style={{ textAlign: 'right' }}>Thực Nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="admin-empty-state">
                        <div className="empty-content">
                          <span className="material-symbols-outlined empty-icon">receipt_long</span>
                          <p>Không tìm thấy đơn hàng nào</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentOrders.map((order) => {
                      const statusMap = {
                        PENDING: { text: 'Chờ xác nhận', cls: 'pending' },
                        CONFIRMED: { text: 'Đã xác nhận', cls: 'active' },
                        SHIPPING: { text: 'Đang giao', cls: 'active' },
                        DELIVERED: { text: 'Đã giao', cls: 'active' },
                        COMPLETED: { text: 'Hoàn thành', cls: 'active' },
                        CANCELLED: { text: 'Đã hủy', cls: 'rejected' },
                        RETURNED: { text: 'Trả hàng', cls: 'rejected' },
                      };
                      const sInfo = statusMap[order.status] || { text: order.status, cls: 'pending' };

                      return (
                        <tr key={order.shopOrderId}>
                          <td style={{ fontWeight: 600, color: '#ea580c' }}>#{order.shopOrderId}</td>
                          <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                          <td>
                            <span className={`admin-status-badge ${sInfo.cls}`}>{sInfo.text}</span>
                          </td>
                          <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{formatVND(order.subtotalAmount)}</td>
                          <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>{formatVND(order.commissionAmount)}</td>
                          <td style={{ textAlign: 'right', color: '#ea580c', fontWeight: 600 }}>{formatVND(order.sellerAmount)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalOrderPages > 1 && (
              <div className="admin-pagination-container justify-center bg-light">
                <button
                  className="admin-pagination-arrow-btn"
                  disabled={orderPage === 1}
                  onClick={() => setOrderPage(prev => Math.max(prev - 1, 1))}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                </button>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                  Trang {orderPage} / {totalOrderPages}
                </span>
                <button
                  className="admin-pagination-arrow-btn"
                  disabled={orderPage >= totalOrderPages}
                  onClick={() => setOrderPage(prev => Math.min(prev + 1, totalOrderPages))}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </SellerLayout>
  );
}

export default SellerReconciliationPage;

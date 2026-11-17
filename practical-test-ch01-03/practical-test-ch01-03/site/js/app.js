// Câu 2: viết JavaScript tại đây

// Địa chỉ gốc của mock API (đề cho sẵn)
const API_URL = 'http://localhost:4000';

// Hàm có sẵn: đổi giờ UTC sang giờ Việt Nam, vd "08:00 12/09/2026"
const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', // ép về múi giờ Việt Nam (UTC+7)
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

// ---------- Câu 2a: định dạng số chỗ ----------
// Nhận vào 1 sự kiện, trả về chuỗi hiển thị số chỗ
const formatSeats = (event) => {
  // Số chỗ còn lại = sức chứa - số người đã đăng ký
  const remaining = event.capacity - event.registeredCount;
  // Còn chỗ (> 0) thì ghi "Còn x/y chỗ", ngược lại ghi "Hết chỗ"
  return remaining > 0 ? `Còn ${remaining}/${event.capacity} chỗ` : 'Hết chỗ';
};

// ---------- Câu 2b: vẽ danh sách card ----------
// Tạo 1 card (<article>) cho 1 sự kiện, bằng DOM API (không dùng innerHTML)
const createEventCard = (event) => {
  // Khung ngoài của card
  const article = document.createElement('article');
  article.className = 'card';

  // Ảnh minh hoạ; alt mô tả ảnh (cần cho trình đọc màn hình)
  const img = document.createElement('img');
  img.setAttribute('src', 'img/event.svg');
  img.setAttribute('alt', `Minh hoạ sự kiện ${event.name}`);
  img.setAttribute('width', '320');   // khai báo kích thước để trang không bị nhảy khi ảnh tải xong
  img.setAttribute('height', '180');

  // Phần chữ của card
  const body = document.createElement('div');
  body.className = 'card-body';

  // Tên sự kiện là liên kết sang trang chi tiết kèm id
  const h2 = document.createElement('h2');
  const link = document.createElement('a');
  // encodeURIComponent: mã hoá id cho an toàn khi đưa vào URL
  link.setAttribute('href', `event-detail.html?id=${encodeURIComponent(event.id)}`);
  link.textContent = event.name; // textContent: dữ liệu server chỉ là chữ, không bị hiểu thành HTML
  h2.append(link);

  // Giờ diễn ra: thẻ <time> có datetime (máy đọc) và chữ hiển thị (người đọc)
  const pTime = document.createElement('p');
  const time = document.createElement('time');
  time.setAttribute('datetime', event.startTime);
  time.textContent = formatDateTime(event.startTime);
  pTime.append(time);

  // Địa điểm
  const pLocation = document.createElement('p');
  pLocation.textContent = event.location;

  // Số chỗ: hết chỗ thì bọc trong nhãn <span> để CSS tô nền đỏ
  const pSeats = document.createElement('p');
  const seatsText = formatSeats(event);
  if (seatsText === 'Hết chỗ') {
    const badge = document.createElement('span');
    badge.className = 'badge-full';
    badge.textContent = seatsText;
    pSeats.append(badge);
  } else {
    pSeats.textContent = seatsText;
  }

  // Ráp các phần lại: body gồm 4 dòng, card gồm ảnh + body
  body.append(h2, pTime, pLocation, pSeats);
  article.append(img, body);
  return article;
};

// Vẽ cả danh sách ra trang
const renderEvents = (events) => {
  const list = document.querySelector('#event-list');
  // events.map(...) tạo mảng card; dấu ... trải mảng thành từng đối số.
  // replaceChildren xoá nội dung cũ và đặt card mới vào một lần
  list.replaceChildren(...events.map(createEventCard));
};

// ---------- Câu 2c: gọi API ----------
// Dòng chữ trạng thái (Đang tải, Tìm thấy..., báo lỗi...)
const statusEl = document.querySelector('#status');

// async: hàm bất đồng bộ, bên trong dùng được await.
// keyword = '' : nếu không truyền thì mặc định là rỗng (lấy tất cả)
const loadEvents = async (keyword = '') => {
  // URLSearchParams tự ghép và mã hoá tham số: pageSize=50 (&q=...)
  const params = new URLSearchParams({ pageSize: '50' });
  if (keyword !== '') params.set('q', keyword); // chỉ thêm q khi có từ khoá

  statusEl.textContent = 'Đang tải…';
  try {
    // await: chờ server trả lời mà không làm đứng trang
    const response = await fetch(`${API_URL}/api/events?${params}`);
    // fetch chỉ báo lỗi khi mất mạng; lỗi 404/500 vẫn "thành công",
    // nên phải tự kiểm tra response.ok và ném lỗi để nhảy xuống catch
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json(); // đọc nội dung JSON

    renderEvents(data.items);
    // Không có kết quả thì báo "không khớp", có thì báo số lượng
    statusEl.textContent = data.items.length === 0
      ? 'Không có sự kiện nào khớp từ khoá.'
      : `Tìm thấy ${data.totalCount} sự kiện`;
  } catch (error) {
    // Vào đây khi mất kết nối hoặc server trả lỗi
    console.error(error); // in lỗi ra Console (F12) để tiện kiểm tra
    statusEl.textContent = 'Không tải được dữ liệu, vui lòng thử lại.';
  }
};

// Khi gửi form tìm kiếm
document.querySelector('#search-form').addEventListener('submit', (e) => {
  e.preventDefault(); // chặn trình duyệt tải lại trang
  // trim(): cắt khoảng trắng đầu/cuối từ khoá rồi gọi tìm
  loadEvents(document.querySelector('#keyword').value.trim());
});

// Tải danh sách ngay khi mở trang
loadEvents();
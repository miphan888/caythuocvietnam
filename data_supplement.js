/* ================================================================
   DATA_SUPPLEMENT.JS  — v2 (fixed)
   Bổ sung 47 vị thuốc cho 21 chứng bệnh
   Tương thích hoàn toàn với app.js (patch sau DOMContentLoaded)
   ================================================================

   ĐẶT FILE NÀY SAU app.js:
     <script src="data.js"></script>
     <script src="app.js"></script>
     <script src="data_supplement.js"></script>

   ================================================================ */

(function () {
  'use strict';

  /* ── HELPER: chuyển tên có dấu → không dấu ──────────────────── */
  function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  /* ================================================================
     1. DỮ LIỆU CÂY THUỐC BỔ SUNG
     Đầy đủ tất cả fields mà app.js cần:
     ten_co_dau, ten_khong_dau, ten_anh, ten_khoa_hoc,
     tac_dung, tac_dung_list, page_start, page_end, chuong
     (page_start/page_end = 0 → không hiển thị ảnh sách, chỉ wiki)
     ================================================================ */
  var SUPPLEMENT_PLANTS = [

    /* ── VIÊM PHỔI / HÔ HẤP ──────────────────────────────────── */
    {
      id: 'sup_001',
      ten_co_dau: 'Xạ Can',
      ten_khong_dau: 'Xa Can',
      ten_anh: 'Blackberry Lily / Leopard Flower',
      ten_khoa_hoc: 'Belamcanda chinensis (L.) DC.',
      chuong: 'XXIV. Vị thuốc bổ sung – Hô hấp',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt giải độc, lợi yết hầu, tiêu đàm. Chữa viêm phổi, viêm họng, viêm amidan, ho có đờm, khó thở do đàm nhiệt. Có tác dụng kháng khuẩn, kháng viêm, chống ho.',
      tac_dung_list: ['viêm phổi', 'ho có đờm', 'viêm họng', 'viêm amidan', 'khó thở', 'thanh nhiệt giải độc'],
      mo_ta: 'Cây thảo lâu năm, cao 50–100 cm, lá hình kiếm mọc 2 dãy. Hoa màu vàng cam có đốm đỏ nâu. Thân rễ màu vàng nâu.',
      cach_dung: 'Thân rễ phơi khô, ngày dùng 6–12 g sắc uống. Dùng ngoài giã tươi đắp hoặc ngậm nước sắc.',
    },
    {
      id: 'sup_002',
      ten_co_dau: 'Bách Bộ',
      ten_khong_dau: 'Bach Bo',
      ten_anh: 'Stemona Root',
      ten_khoa_hoc: 'Stemona tuberosa Lour.',
      chuong: 'XXIV. Vị thuốc bổ sung – Hô hấp',
      page_start: 0, page_end: 0,
      tac_dung: 'Nhuận phế, chỉ khái, sát trùng. Chữa ho lâu ngày, ho lao, viêm phổi mãn, ho gà. Diệt ký sinh trùng đường ruột.',
      tac_dung_list: ['viêm phổi', 'ho lâu ngày', 'ho lao', 'ho gà', 'nhuận phế', 'bổ phổi'],
      mo_ta: 'Cây leo, rễ củ mập, nhiều củ mọc thành chùm. Lá hình tim, gân lá song song nổi rõ.',
      cach_dung: 'Rễ củ thái lát, sao vàng hoặc tẩm mật sao. Ngày dùng 10–20 g sắc uống.',
    },
    {
      id: 'sup_003',
      ten_co_dau: 'Tỳ Bà Diệp (Lá Nhót Tây)',
      ten_khong_dau: 'Ty Ba Diep La Nhot Tay',
      ten_anh: 'Loquat Leaf',
      ten_khoa_hoc: 'Eriobotrya japonica (Thunb.) Lindl.',
      chuong: 'XXIV. Vị thuốc bổ sung – Hô hấp',
      page_start: 0, page_end: 0,
      tac_dung: 'Nhuận phế, chỉ khái, hòa vị, giáng nghịch. Chữa viêm phổi, ho khan, ho có đàm vàng, nôn mửa do vị nhiệt.',
      tac_dung_list: ['viêm phổi', 'ho khan', 'ho đàm vàng', 'nhuận phế', 'nôn mửa'],
      mo_ta: 'Cây gỗ nhỏ thường xanh, cao 5–10 m. Lá to, dày, mặt dưới có lông mịn màu vàng nâu. Quả chín màu vàng cam.',
      cach_dung: 'Lá khô cạo lông, tẩm mật ong sao vàng. Ngày dùng 10–15 g sắc uống.',
    },
    {
      id: 'sup_004',
      ten_co_dau: 'Mạch Môn',
      ten_khong_dau: 'Mach Mon',
      ten_anh: 'Dwarf Lilyturf / Ophiopogon',
      ten_khoa_hoc: 'Ophiopogon japonicus (L. f.) Ker Gawl.',
      chuong: 'XXIV. Vị thuốc bổ sung – Hô hấp',
      page_start: 0, page_end: 0,
      tac_dung: 'Dưỡng âm nhuận phế, thanh tâm, ích vị. Chữa viêm phổi, ho khan do phế âm hư, miệng khô khát, mất ngủ, tim hồi hộp do hư nhiệt.',
      tac_dung_list: ['viêm phổi', 'ho khan', 'phế âm hư', 'tim hồi hộp', 'mất ngủ', 'dưỡng âm'],
      mo_ta: 'Cây thảo nhỏ, lá hẹp dài như cỏ, màu xanh đậm. Rễ có củ nhỏ hình thoi màu trắng vàng, vị ngọt hơi đắng.',
      cach_dung: 'Củ rễ phơi khô, ngày dùng 10–20 g sắc uống hoặc hãm trà.',
    },

    /* ── VIÊM LOÉT DẠ DÀY ────────────────────────────────────── */
    {
      id: 'sup_005',
      ten_co_dau: 'Ô Tặc Cốt (Mai Mực)',
      ten_khong_dau: 'O Tac Cot Mai Muc',
      ten_anh: 'Cuttlefish Bone / Sepia',
      ten_khoa_hoc: 'Sepia esculenta Hoyle',
      chuong: 'XXV. Vị thuốc bổ sung – Tiêu hóa',
      page_start: 0, page_end: 0,
      tac_dung: 'Liễm thấp, chế axit, cầm máu, thu liễm sinh cơ. Chữa viêm loét dạ dày – tá tràng, ợ chua nhiều, đau dạ dày, xuất huyết tiêu hóa.',
      tac_dung_list: ['viêm loét dạ dày', 'ợ chua', 'đau dạ dày', 'xuất huyết tiêu hóa', 'tá tràng'],
      mo_ta: 'Xương (mai) của con mực nang. Chất liệu cứng, nhẹ, màu trắng. Vị mặn, tính ôn.',
      cach_dung: 'Nung hoặc sao vàng, tán bột mịn. Ngày uống 6–12 g bột, chia 3 lần sau ăn.',
    },
    {
      id: 'sup_006',
      ten_co_dau: 'Khổ Sâm',
      ten_khong_dau: 'Kho Sam',
      ten_anh: 'Shrubby Sophora / Lightyellow Sophora',
      ten_khoa_hoc: 'Sophora flavescens Aiton',
      chuong: 'XXV. Vị thuốc bổ sung – Tiêu hóa',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt táo thấp, sát khuẩn, chữa lỵ. Chữa viêm loét dạ dày do H. pylori, viêm đại tràng, kiết lỵ, âm ngứa do thấp nhiệt. Kháng khuẩn H. pylori hiệu quả.',
      tac_dung_list: ['viêm loét dạ dày', 'H. pylori', 'viêm đại tràng', 'kiết lỵ', 'thấp nhiệt'],
      mo_ta: 'Cây bụi hoặc gỗ nhỏ, cao 1–2 m. Rễ hình trụ, thịt vàng nhạt, vị rất đắng.',
      cach_dung: 'Rễ thái lát phơi khô. Ngày dùng 6–12 g sắc uống. Không dùng khi tỳ vị hư hàn.',
    },
    {
      id: 'sup_007',
      ten_co_dau: 'Hoàng Kỳ',
      ten_khong_dau: 'Hoang Ky',
      ten_anh: 'Astragalus / Milkvetch Root',
      ten_khoa_hoc: 'Astragalus membranaceus (Fisch.) Bunge',
      chuong: 'XXV. Vị thuốc bổ sung – Tiêu hóa',
      page_start: 0, page_end: 0,
      tac_dung: 'Bổ khí cố biểu, lợi thủy tiêu thũng, thác độc sinh cơ. Chữa viêm loét dạ dày mãn tính, tỳ vị hư nhược, suy nhược cơ thể, tăng cường miễn dịch.',
      tac_dung_list: ['viêm loét dạ dày', 'suy nhược', 'tăng cường miễn dịch', 'bổ khí', 'tỳ vị hư', 'bổ khí huyết'],
      mo_ta: 'Cây thảo lâu năm, cao 50–150 cm. Rễ hình trụ dài, thịt màu trắng vàng, vị ngọt nhạt.',
      cach_dung: 'Rễ thái phiến, sao mật ong. Ngày dùng 10–30 g sắc uống hoặc nấu cháo, hầm gà.',
    },

    /* ── TIM HỒI HỘP / CĂNG THẲNG ──────────────────────────── */
    {
      id: 'sup_008',
      ten_co_dau: 'Toan Táo Nhân',
      ten_khong_dau: 'Toan Tao Nhan',
      ten_anh: 'Sour Jujube Seed / Ziziphus Seed',
      ten_khoa_hoc: 'Ziziphus jujuba Mill. var. spinosa (Bunge) Hu',
      chuong: 'XXVI. Vị thuốc bổ sung – Tim mạch & Thần kinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Dưỡng tâm an thần, liễm hãn. Chữa tim hồi hộp, mất ngủ, lo âu, căng thẳng thần kinh, hay quên, ra mồ hôi trộm. Là vị thuốc an thần hàng đầu trong đông y.',
      tac_dung_list: ['tim hồi hộp', 'mất ngủ', 'căng thẳng', 'lo âu', 'an thần', 'ra mồ hôi trộm'],
      mo_ta: 'Hạt nhân của quả táo gai. Hạt dẹt hình bầu dục, vỏ cứng màu nâu đỏ, nhân màu trắng ngà. Vị ngọt, tính bình.',
      cach_dung: 'Hạt rang thơm, tán bột hoặc sắc uống. Ngày dùng 10–20 g.',
    },
    {
      id: 'sup_009',
      ten_co_dau: 'Bá Tử Nhân',
      ten_khong_dau: 'Ba Tu Nhan',
      ten_anh: 'Arborvitae Seed / Biota Seed',
      ten_khoa_hoc: 'Platycladus orientalis (L.) Franco',
      chuong: 'XXVI. Vị thuốc bổ sung – Tim mạch & Thần kinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Dưỡng tâm an thần, nhuận tràng. Chữa tim hồi hộp, mất ngủ, căng thẳng, hay quên, táo bón ở người cao tuổi và người gầy yếu.',
      tac_dung_list: ['tim hồi hộp', 'mất ngủ', 'căng thẳng', 'hay quên', 'táo bón', 'dưỡng tâm'],
      mo_ta: 'Hạt của cây trắc bá diệp. Hạt hình trứng, vỏ mỏng màu nâu, nhân màu trắng vàng, nhiều dầu, thơm nhẹ.',
      cach_dung: 'Hạt bỏ màng ngoài, sao vàng. Ngày dùng 10–15 g sắc uống hoặc tán bột làm viên.',
    },
    {
      id: 'sup_010',
      ten_co_dau: 'Đan Sâm',
      ten_khong_dau: 'Dan Sam',
      ten_anh: 'Red Sage / Danshen',
      ten_khoa_hoc: 'Salvia miltiorrhiza Bunge',
      chuong: 'XXVI. Vị thuốc bổ sung – Tim mạch & Thần kinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Hoạt huyết hóa ứ, thông kinh, dưỡng tâm an thần. Chữa tim hồi hộp, đau thắt ngực, rối loạn nhịp tim, kinh nguyệt không đều, đau bụng kinh.',
      tac_dung_list: ['tim hồi hộp', 'đau thắt ngực', 'rối loạn nhịp tim', 'kinh nguyệt không đều', 'hoạt huyết', 'bổ khí huyết'],
      mo_ta: 'Cây thảo lâu năm cao 30–80 cm. Rễ to, mặt ngoài màu đỏ nâu, thịt màu tím hồng.',
      cach_dung: 'Rễ thái phiến, sao rượu. Ngày dùng 10–15 g sắc uống. Phụ nữ có thai không dùng.',
    },
    {
      id: 'sup_011',
      ten_co_dau: 'Viễn Chí',
      ten_khong_dau: 'Vien Chi',
      ten_anh: 'Thinleaf Milkwort Root / Polygala',
      ten_khoa_hoc: 'Polygala tenuifolia Willd.',
      chuong: 'XXVI. Vị thuốc bổ sung – Tim mạch & Thần kinh',
      page_start: 0, page_end: 0,
      tac_dung: 'An thần ích trí, tiêu đàm, thông khai tâm khiếu. Chữa căng thẳng, mất ngủ, hay quên, tim hồi hộp, trầm cảm nhẹ. Tốt cho người lao lực trí óc nhiều.',
      tac_dung_list: ['căng thẳng', 'mất ngủ', 'hay quên', 'tim hồi hộp', 'trầm cảm', 'an thần', 'ích trí'],
      mo_ta: 'Cây thảo nhỏ cao 20–40 cm. Rễ hình trụ dài, mặt ngoài màu vàng xám. Vị đắng, tính ôn.',
      cach_dung: 'Rễ bỏ lõi, tẩm cam thảo sao. Ngày dùng 6–10 g sắc uống.',
    },

    /* ── CHÓNG MẶT / HUYỄN VẬN ──────────────────────────────── */
    {
      id: 'sup_012',
      ten_co_dau: 'Thiên Ma',
      ten_khong_dau: 'Thien Ma',
      ten_anh: 'Gastrodia Tuber / Tall Gastrodia',
      ten_khoa_hoc: 'Gastrodia elata Blume',
      chuong: 'XXVI. Vị thuốc bổ sung – Tim mạch & Thần kinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Bình can tức phong, thông lạc chỉ thống. Chữa chóng mặt, đau đầu do can phong, huyết áp cao, động kinh, tê liệt nửa người. Được mệnh danh là "thần dược" chữa chóng mặt.',
      tac_dung_list: ['chóng mặt', 'đau đầu', 'huyết áp cao', 'can phong', 'động kinh', 'bình can'],
      mo_ta: 'Cây thảo ký sinh không có diệp lục. Thân rễ hình con suốt, màu vàng nâu, thịt màu trắng ngà.',
      cach_dung: 'Thân rễ thái lát mỏng, sấy khô. Ngày dùng 6–10 g sắc uống.',
    },
    {
      id: 'sup_013',
      ten_co_dau: 'Câu Đằng',
      ten_khong_dau: 'Cau Dang',
      ten_anh: 'Gambir Plant / Uncaria',
      ten_khoa_hoc: 'Uncaria rhynchophylla (Miq.) Miq. ex Havil.',
      chuong: 'XXVI. Vị thuốc bổ sung – Tim mạch & Thần kinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt bình can, tức phong chỉ kinh. Chữa chóng mặt, đau đầu, huyết áp cao, trẻ em co giật sốt cao, căng thẳng thần kinh. Hạ áp hiệu quả và an toàn.',
      tac_dung_list: ['chóng mặt', 'đau đầu', 'huyết áp cao', 'co giật', 'căng thẳng', 'bình can'],
      mo_ta: 'Cây leo to, thân hóa gỗ. Móc câu mọc đối ở kẽ lá, cứng, cong hình móc câu.',
      cach_dung: 'Móc câu sắc không lâu (chỉ đun sôi 10–15 phút sau). Ngày dùng 10–15 g.',
    },

    /* ── VIÊM KHỚP / THOÁI HÓA KHỚP ────────────────────────── */
    {
      id: 'sup_014',
      ten_co_dau: 'Độc Hoạt',
      ten_khong_dau: 'Doc Hoat',
      ten_anh: 'Pubescent Angelica Root / Du Huo',
      ten_khoa_hoc: 'Angelica pubescens Maxim. f. biserrata Shan et Yuan',
      chuong: 'XXVII. Vị thuốc bổ sung – Xương khớp',
      page_start: 0, page_end: 0,
      tac_dung: 'Khu phong thấp, chỉ thống. Chữa viêm khớp phong thấp, đau nhức xương khớp, đau thắt lưng, tê bì chân tay. Tác dụng giảm đau, kháng viêm tốt.',
      tac_dung_list: ['viêm khớp', 'thoái hóa khớp', 'đau nhức xương khớp', 'thấp khớp', 'tê bì', 'đau lưng', 'phong thấp'],
      mo_ta: 'Cây thảo lớn cao 1–2 m. Rễ hình trụ to, vỏ ngoài màu nâu xám, mùi thơm đặc biệt.',
      cach_dung: 'Rễ thái phiến, sao hoặc tẩm rượu sao. Ngày dùng 6–12 g sắc uống.',
    },
    {
      id: 'sup_015',
      ten_co_dau: 'Tần Giao',
      ten_khong_dau: 'Tan Giao',
      ten_anh: 'Large Leaf Gentian Root',
      ten_khoa_hoc: 'Gentiana macrophylla Pall.',
      chuong: 'XXVII. Vị thuốc bổ sung – Xương khớp',
      page_start: 0, page_end: 0,
      tac_dung: 'Khu phong thấp, thư cân hoạt lạc, thanh thấp nhiệt, chỉ thống. Chữa viêm khớp dạng thấp, đau khớp có sưng đỏ nóng, đau thần kinh tọa, vàng da do thấp nhiệt.',
      tac_dung_list: ['viêm khớp', 'thoái hóa khớp', 'viêm khớp dạng thấp', 'đau thần kinh tọa', 'sưng đau khớp', 'vàng da'],
      mo_ta: 'Cây thảo, rễ to hình trụ hoặc hình thoi, mặt ngoài vàng nâu. Vị đắng, tính bình.',
      cach_dung: 'Rễ thái phiến. Ngày dùng 6–12 g sắc uống.',
    },
    {
      id: 'sup_016',
      ten_co_dau: 'Cốt Toái Bổ',
      ten_khong_dau: 'Cot Toai Bo',
      ten_anh: 'Drynaria Rhizome / Fortune\'s Drynaria',
      ten_khoa_hoc: 'Drynaria fortunei (Kunze ex Mett.) J.Sm.',
      chuong: 'XXVII. Vị thuốc bổ sung – Xương khớp',
      page_start: 0, page_end: 0,
      tac_dung: 'Bổ thận cường gân cốt, hoạt huyết tán ứ, chỉ thống. Chữa thoái hóa khớp, loãng xương, đau xương khớp, gãy xương lâu liền, đau thắt lưng do thận hư. Rất tốt cho người cao tuổi.',
      tac_dung_list: ['thoái hóa khớp', 'loãng xương', 'đau lưng', 'gãy xương', 'bổ thận', 'cường gân cốt'],
      mo_ta: 'Dương xỉ bì lớn bám trên đá hoặc thân cây. Thân rễ to, phủ vảy màu nâu vàng dày.',
      cach_dung: 'Thân rễ cạo vảy, thái lát, sao vàng. Ngày dùng 10–15 g sắc uống.',
    },
    {
      id: 'sup_017',
      ten_co_dau: 'Ngưu Tất',
      ten_khong_dau: 'Nguu Tat',
      ten_anh: 'Achyranthes Root / Ox Knee',
      ten_khoa_hoc: 'Achyranthes bidentata Blume',
      chuong: 'XXVII. Vị thuốc bổ sung – Xương khớp',
      page_start: 0, page_end: 0,
      tac_dung: 'Bổ can thận, cường gân cốt, hoạt huyết thông kinh, lợi niệu thông lâm. Chữa viêm khớp, thoái hóa khớp, đau lưng gối, huyết áp cao, kinh nguyệt không đều.',
      tac_dung_list: ['viêm khớp', 'thoái hóa khớp', 'đau lưng gối', 'huyết áp cao', 'kinh nguyệt không đều', 'bổ can thận'],
      mo_ta: 'Cây thảo cao 50–100 cm, thân vuông, có đốt phình to giống đầu gối trâu bò.',
      cach_dung: 'Rễ thái phiến, tẩm rượu sao hoặc sao muối. Ngày dùng 10–15 g sắc uống.',
    },

    /* ── NẤM DA / DA LIỄU ───────────────────────────────────── */
    {
      id: 'sup_018',
      ten_co_dau: 'Thổ Phục Linh',
      ten_khong_dau: 'Tho Phuc Linh',
      ten_anh: 'Glabrous Greenbrier Rhizome / Sarsaparilla',
      ten_khoa_hoc: 'Smilax glabra Roxb.',
      chuong: 'XXVIII. Vị thuốc bổ sung – Da liễu',
      page_start: 0, page_end: 0,
      tac_dung: 'Giải độc, trừ thấp, thông lợi quan tiết. Chữa nấm da, viêm da mãn tính, eczema, loét da khó lành. Thuốc thanh lọc máu, giải độc rất tốt.',
      tac_dung_list: ['nấm da', 'viêm da', 'eczema', 'giải độc', 'da liễu', 'loét da'],
      mo_ta: 'Cây leo, thân hóa gỗ, không có gai. Thân rễ to, vỏ ngoài nâu đỏ, thịt màu trắng hồng.',
      cach_dung: 'Thân rễ thái lát, phơi khô. Ngày dùng 15–30 g sắc uống. Có thể sắc đặc rửa vùng da bệnh.',
    },
    {
      id: 'sup_019',
      ten_co_dau: 'Khổ Luyện Bì (Vỏ Xoan)',
      ten_khong_dau: 'Kho Luyen Bi Vo Xoan',
      ten_anh: 'Chinaberry Bark / Persian Lilac Bark',
      ten_khoa_hoc: 'Melia azedarach L.',
      chuong: 'XXVIII. Vị thuốc bổ sung – Da liễu',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt táo thấp, sát trùng, trừ phong. Chữa nấm da, hắc lào, lang ben, ghẻ ngứa, giun đũa, giun móc. Chủ yếu dùng ngoài da rất hiệu quả.',
      tac_dung_list: ['nấm da', 'hắc lào', 'lang ben', 'ghẻ ngứa', 'ký sinh trùng da', 'sát trùng da'],
      mo_ta: 'Cây gỗ to, vỏ cây màu xám nâu. Hoa nhỏ màu tím nhạt, thơm. Trồng phổ biến khắp Việt Nam.',
      cach_dung: 'Vỏ rễ sắc đặc rửa ngoài da. Ngày dùng ngoài: sắc 30–50 g ngâm rửa. Uống trong cần thận trọng.',
    },
    {
      id: 'sup_020',
      ten_co_dau: 'Bạch Tiên Bì',
      ten_khong_dau: 'Bach Tien Bi',
      ten_anh: 'Dictamnus Root Bark / Gas Plant',
      ten_khoa_hoc: 'Dictamnus dasycarpus Turcz.',
      chuong: 'XXVIII. Vị thuốc bổ sung – Da liễu',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt táo thấp, khu phong giải độc, chỉ dương. Chữa nấm da, eczema, mề đay, ngứa da do thấp nhiệt. Rất hiệu quả cho các bệnh ngứa da.',
      tac_dung_list: ['nấm da', 'eczema', 'mề đay', 'ngứa da', 'da liễu', 'thấp nhiệt da'],
      mo_ta: 'Vỏ rễ cây bạch tiên. Mảnh vỏ cuộn hình ống, mặt ngoài màu vàng xám. Vị đắng, tính hàn.',
      cach_dung: 'Vỏ rễ phơi khô. Ngày dùng 6–10 g sắc uống, hoặc sắc đặc rửa ngoài.',
    },

    /* ── GAN MẬT / VÀNG DA ──────────────────────────────────── */
    {
      id: 'sup_021',
      ten_co_dau: 'Nhân Trần',
      ten_khong_dau: 'Nhan Tran',
      ten_anh: 'Adenosma / Vietnamese Capillary Wormwood',
      ten_khoa_hoc: 'Adenosma indiana (Lour.) Merr.',
      chuong: 'XXIX. Vị thuốc bổ sung – Gan mật',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt lợi thấp, lợi mật, thoái hoàng. Chữa vàng da do viêm gan, xơ gan, sỏi mật, viêm túi mật. Là vị thuốc truyền thống số một trong điều trị vàng da của Việt Nam.',
      tac_dung_list: ['vàng da', 'viêm gan', 'xơ gan', 'sỏi mật', 'viêm túi mật', 'gan mật', 'lợi mật'],
      mo_ta: 'Cây thảo sống hàng năm, cao 30–60 cm, có nhiều lông. Toàn cây thơm đặc trưng. Mọc hoang ở bờ ruộng, ven suối.',
      cach_dung: 'Toàn cây phơi khô. Ngày dùng 20–40 g sắc uống. Rất an toàn, có thể dùng lâu dài.',
    },
    {
      id: 'sup_022',
      ten_co_dau: 'Chi Tử (Dành Dành)',
      ten_khong_dau: 'Chi Tu Danh Danh',
      ten_anh: 'Cape Jasmine Fruit / Gardenia',
      ten_khoa_hoc: 'Gardenia jasminoides J.Ellis',
      chuong: 'XXIX. Vị thuốc bổ sung – Gan mật',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt tả hỏa, lương huyết, lợi thấp thoái hoàng. Chữa vàng da, viêm gan virus, viêm túi mật, chảy máu cam, tiểu tiện đỏ đau rát. Dùng ngoài chữa bong gân.',
      tac_dung_list: ['vàng da', 'viêm gan', 'viêm túi mật', 'chảy máu cam', 'gan mật', 'bong gân'],
      mo_ta: 'Cây bụi thường xanh, cao 1–3 m, hoa trắng thơm. Quả hình bầu dục có 6–8 cạnh dọc, khi chín màu vàng đỏ.',
      cach_dung: 'Quả phơi khô, sao vàng. Ngày dùng 6–12 g sắc uống.',
    },
    {
      id: 'sup_023',
      ten_co_dau: 'Uất Kim (Nghệ Tím)',
      ten_khong_dau: 'Uat Kim Nghe Tim',
      ten_anh: 'Turmeric Root / Curcuma',
      ten_khoa_hoc: 'Curcuma longa L. / Curcuma aromatica Salisb.',
      chuong: 'XXIX. Vị thuốc bổ sung – Gan mật',
      page_start: 0, page_end: 0,
      tac_dung: 'Hoạt huyết hành khí, thanh tâm giải uất, lợi mật chỉ thống. Chữa viêm gan, vàng da, sỏi mật, đau hạ sườn phải, kinh nguyệt không đều.',
      tac_dung_list: ['vàng da', 'viêm gan', 'sỏi mật', 'gan mật', 'đau hạ sườn', 'kinh nguyệt không đều', 'hoạt huyết'],
      mo_ta: 'Thân rễ (củ) hình trụ hay hình trứng, mặt ngoài màu vàng nâu, thịt màu vàng cam.',
      cach_dung: 'Thân rễ thái lát mỏng, phơi khô. Ngày dùng 6–12 g sắc uống.',
    },
    {
      id: 'sup_024',
      ten_co_dau: 'Diệp Hạ Châu (Chó Đẻ Thân Xanh)',
      ten_khong_dau: 'Diep Ha Chau Cho De Than Xanh',
      ten_anh: 'Phyllanthus / Stonebreaker',
      ten_khoa_hoc: 'Phyllanthus amarus Schumach. & Thonn.',
      chuong: 'XXIX. Vị thuốc bổ sung – Gan mật',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt giải độc, lợi thủy tiêu thũng, sơ can minh mục. Chữa viêm gan B, vàng da, bảo vệ tế bào gan, sỏi thận. Nghiên cứu hiện đại xác nhận tác dụng kháng virus viêm gan B.',
      tac_dung_list: ['vàng da', 'viêm gan B', 'gan mật', 'bảo vệ gan', 'sỏi thận', 'giải độc gan'],
      mo_ta: 'Cây thảo nhỏ, cao 20–60 cm, thân xanh. Quả nhỏ tròn xếp dưới lá như hạt châu. Mọc hoang khắp nơi.',
      cach_dung: 'Cả cây phơi khô. Ngày dùng 20–40 g sắc uống. Rất an toàn, có thể dùng lâu dài.',
    },

    /* ── BÉO PHÌ / GIẢM CÂN ────────────────────────────────── */
    {
      id: 'sup_025',
      ten_co_dau: 'Hà Diệp (Lá Sen)',
      ten_khong_dau: 'Ha Diep La Sen',
      ten_anh: 'Lotus Leaf / Sacred Lotus Leaf',
      ten_khoa_hoc: 'Nelumbo nucifera Gaertn.',
      chuong: 'XXX. Vị thuốc bổ sung – Béo phì & Nội tiết',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh thử lợi thấp, giảm lipid máu, hòa huyết chỉ huyết. Chữa béo phì, mỡ máu cao. Nghiên cứu hiện đại xác nhận giảm cân hiệu quả.',
      tac_dung_list: ['béo phì', 'giảm cân', 'mỡ máu cao', 'lipid máu', 'hạ mỡ máu'],
      mo_ta: 'Lá sen tươi hoặc phơi khô. Lá to tròn, màu xanh, có gân toả tròn. Vị đắng nhạt, tính bình.',
      cach_dung: 'Lá tươi hoặc khô sắc nước uống thay trà. Ngày dùng 10–20 g.',
    },
    {
      id: 'sup_026',
      ten_co_dau: 'Trạch Tả',
      ten_khong_dau: 'Trach Ta',
      ten_anh: 'Oriental Water Plantain / Alisma',
      ten_khoa_hoc: 'Alisma plantago-aquatica L.',
      chuong: 'XXX. Vị thuốc bổ sung – Béo phì & Nội tiết',
      page_start: 0, page_end: 0,
      tac_dung: 'Lợi thủy thấm thấp, tiết nhiệt hóa trọc. Chữa béo phì, tiểu ít, phù thũng, mỡ máu cao, viêm thận, sỏi tiết niệu. Giảm hấp thu lipid và cholesterol.',
      tac_dung_list: ['béo phì', 'mỡ máu cao', 'cholesterol', 'phù thũng', 'tiểu ít', 'sỏi tiết niệu', 'lợi tiểu'],
      mo_ta: 'Cây thảo thủy sinh, cao 30–100 cm. Thân rễ hình cầu, mặt ngoài trắng hoặc vàng nhạt.',
      cach_dung: 'Thân rễ thái lát, sao muối. Ngày dùng 10–15 g sắc uống.',
    },
    {
      id: 'sup_027',
      ten_co_dau: 'Quyết Minh Tử (Hạt Muồng)',
      ten_khong_dau: 'Quyet Minh Tu Hat Muong',
      ten_anh: 'Sicklepod Seed / Cassia Seed',
      ten_khoa_hoc: 'Senna obtusifolia (L.) H.S.Irwin & Barneby',
      chuong: 'XXX. Vị thuốc bổ sung – Béo phì & Nội tiết',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh can minh mục, nhuận trường thông tiện, giảm lipid máu. Chữa béo phì, mỡ máu cao, táo bón, đau mắt đỏ. Sao thơm dùng hàng ngày thay trà.',
      tac_dung_list: ['béo phì', 'mỡ máu cao', 'táo bón', 'đau mắt đỏ', 'lipid máu', 'giảm cân', 'hạ mỡ máu'],
      mo_ta: 'Hạt cây muồng ngủ. Hạt hình thoi, màu nâu bóng, cứng. Vị ngọt đắng, tính lạnh.',
      cach_dung: 'Hạt rang thơm, sắc uống hoặc hãm trà. Ngày dùng 10–20 g.',
    },

    /* ── TUYẾN GIÁP ─────────────────────────────────────────── */
    {
      id: 'sup_028',
      ten_co_dau: 'Hải Tảo',
      ten_khong_dau: 'Hai Tao',
      ten_anh: 'Sargassum Seaweed',
      ten_khoa_hoc: 'Sargassum fusiforme (Harv.) Setch.',
      chuong: 'XXX. Vị thuốc bổ sung – Béo phì & Nội tiết',
      page_start: 0, page_end: 0,
      tac_dung: 'Tiêu đàm nhuyễn kiên, lợi thủy tiêu thũng. Chữa bướu cổ tuyến giáp, u hạch bạch huyết, phù thũng. Hàm lượng iod cao giúp điều hòa tuyến giáp thiếu iod.',
      tac_dung_list: ['tuyến giáp', 'bướu cổ', 'u hạch', 'phù thũng', 'tiêu đàm', 'thiếu iod'],
      mo_ta: 'Tảo biển màu nâu vàng, dài 20–40 cm, có nhiều nhánh và túi khí hình cầu nhỏ.',
      cach_dung: 'Phơi khô, sắc uống. Ngày dùng 10–15 g. Cần thận trọng ở người cường giáp.',
    },
    {
      id: 'sup_029',
      ten_co_dau: 'Côn Bố (Rong Mơ)',
      ten_khong_dau: 'Con Bo Rong Mo',
      ten_anh: 'Kelp / Ecklonia',
      ten_khoa_hoc: 'Ecklonia kurome Okam.',
      chuong: 'XXX. Vị thuốc bổ sung – Béo phì & Nội tiết',
      page_start: 0, page_end: 0,
      tac_dung: 'Tiêu đàm nhuyễn kiên, lợi thủy. Chữa bướu cổ tuyến giáp, u hạch bạch huyết cổ, thiểu năng giáp. Hàm lượng iod hữu cơ và fucoidan cao có tác dụng điều hòa miễn dịch.',
      tac_dung_list: ['tuyến giáp', 'bướu cổ', 'thiểu năng giáp', 'u hạch cổ', 'tăng cường miễn dịch', 'iod'],
      mo_ta: 'Tảo biển lớn màu nâu xanh, dài 1–2 m. Có nhiều iod hữu cơ và khoáng chất.',
      cach_dung: 'Phơi khô, sắc uống hoặc nấu ăn. Ngày dùng 10–15 g.',
    },
    {
      id: 'sup_030',
      ten_co_dau: 'Hạ Khô Thảo',
      ten_khong_dau: 'Ha Kho Thao',
      ten_anh: 'Self-Heal Spike / Prunella',
      ten_khoa_hoc: 'Prunella vulgaris L.',
      chuong: 'XXX. Vị thuốc bổ sung – Béo phì & Nội tiết',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh can hỏa, tán kết tiêu thũng. Chữa bướu tuyến giáp, u hạch bạch huyết, viêm tuyến vú, cao huyết áp do can hỏa vượng, đau mắt đỏ. Rất tốt cho các u cục vùng cổ.',
      tac_dung_list: ['tuyến giáp', 'bướu tuyến giáp', 'u hạch', 'huyết áp cao', 'viêm tuyến vú', 'đau mắt đỏ'],
      mo_ta: 'Cây thảo nhỏ, cao 15–30 cm. Bông hoa màu tím. Vị đắng cay, tính hàn. Mọc hoang ở vùng núi cao mát.',
      cach_dung: 'Bông hoa phơi khô. Ngày dùng 10–15 g sắc uống hoặc hãm trà.',
    },

    /* ── SUY NHƯỢC / TĂNG CƯỜNG MIỄN DỊCH ──────────────────── */
    {
      id: 'sup_031',
      ten_co_dau: 'Linh Chi',
      ten_khong_dau: 'Linh Chi',
      ten_anh: 'Reishi Mushroom / Ganoderma',
      ten_khoa_hoc: 'Ganoderma lucidum (Curtis) P. Karst.',
      chuong: 'XXXI. Vị thuốc bổ sung – Bổ dưỡng & Miễn dịch',
      page_start: 0, page_end: 0,
      tac_dung: 'Bổ khí an thần, tăng cường miễn dịch, chống lão hóa. Chữa suy nhược cơ thể, mất ngủ, tim hồi hộp, hỗ trợ ung thư, viêm gan, cao huyết áp. Vua của các loại thuốc bổ.',
      tac_dung_list: ['suy nhược', 'tăng cường miễn dịch', 'mất ngủ', 'chống lão hóa', 'tim hồi hộp', 'bổ khí'],
      mo_ta: 'Nấm gỗ hình tán quạt, mặt trên bóng như sơn mài, màu đỏ nâu bóng. Cuống dài màu nâu bóng.',
      cach_dung: 'Tai nấm sắc uống hoặc ngâm rượu. Ngày dùng 5–15 g sắc uống. Có thể dùng lâu dài an toàn.',
    },
    {
      id: 'sup_032',
      ten_co_dau: 'Đông Trùng Hạ Thảo',
      ten_khong_dau: 'Dong Trung Ha Thao',
      ten_anh: 'Caterpillar Fungus / Cordyceps',
      ten_khoa_hoc: 'Cordyceps sinensis (Berk.) Sacc.',
      chuong: 'XXXI. Vị thuốc bổ sung – Bổ dưỡng & Miễn dịch',
      page_start: 0, page_end: 0,
      tac_dung: 'Bổ phế ích thận, chỉ huyết hóa đàm, tăng cường miễn dịch. Chữa suy nhược toàn thân, ho lâu ngày, liệt dương, di tinh, thận hư. Tăng cường sức đề kháng vượt trội.',
      tac_dung_list: ['suy nhược', 'tăng cường miễn dịch', 'ho lâu ngày', 'liệt dương', 'thận hư', 'bổ phổi', 'bổ thận'],
      mo_ta: 'Phức hợp nấm ký sinh trên sâu non. Phần thảo màu nâu vàng mọc ra từ đầu sâu. Có mùi đặc biệt, vị ngọt nhạt.',
      cach_dung: 'Hấp với vịt hoặc gà, hoặc ngâm rượu. Ngày dùng 3–6 g.',
    },
    {
      id: 'sup_033',
      ten_co_dau: 'Nhân Sâm',
      ten_khong_dau: 'Nhan Sam',
      ten_anh: 'Asian Ginseng',
      ten_khoa_hoc: 'Panax ginseng C.A.Mey.',
      chuong: 'XXXI. Vị thuốc bổ sung – Bổ dưỡng & Miễn dịch',
      page_start: 0, page_end: 0,
      tac_dung: 'Đại bổ nguyên khí, phục mạch cố thoát, bổ tỳ ích phế, sinh tân chỉ khát, an thần ích trí. Chữa suy nhược nặng, căng thẳng, tiểu đường, tăng cường miễn dịch. Vua của các vị thuốc bổ.',
      tac_dung_list: ['suy nhược', 'tăng cường miễn dịch', 'căng thẳng', 'tiểu đường', 'bổ khí huyết', 'an thần', 'tỳ vị hư'],
      mo_ta: 'Rễ củ hình người, vỏ ngoài màu vàng nâu nhạt, thịt màu trắng ngà. Mùi thơm đặc trưng, vị ngọt hơi đắng.',
      cach_dung: 'Ngậm, hầm, sắc hoặc tán bột. Ngày dùng 3–9 g. Không dùng cùng lê lô, ngũ linh chi, tạo giác.',
    },
    {
      id: 'sup_034',
      ten_co_dau: 'Câu Kỷ Tử',
      ten_khong_dau: 'Cau Ky Tu',
      ten_anh: 'Wolfberry / Goji Berry',
      ten_khoa_hoc: 'Lycium barbarum L.',
      chuong: 'XXXI. Vị thuốc bổ sung – Bổ dưỡng & Miễn dịch',
      page_start: 0, page_end: 0,
      tac_dung: 'Tư bổ can thận, ích tinh minh mục. Chữa suy nhược, mắt mờ, đau lưng gối, tiểu đêm, tăng cường miễn dịch, chống lão hóa, bổ dưỡng. Quả đỏ dinh dưỡng cao.',
      tac_dung_list: ['suy nhược', 'tăng cường miễn dịch', 'mắt mờ', 'đau lưng gối', 'tiểu đêm', 'chống lão hóa', 'bổ khí huyết', 'bổ mắt'],
      mo_ta: 'Quả chín màu đỏ cam hình bầu dục, vị ngọt, thịt mềm. Cây bụi nhỏ, lá mọc so le.',
      cach_dung: 'Quả ăn trực tiếp hoặc sắc uống. Ngày dùng 6–15 g. Có thể ngâm rượu, nấu cháo.',
    },

    /* ── BẠCH ĐỚI / PHỤ KHOA ───────────────────────────────── */
    {
      id: 'sup_035',
      ten_co_dau: 'Bạch Quả (Ngân Hạnh)',
      ten_khong_dau: 'Bach Qua Ngan Hanh',
      ten_anh: 'Ginkgo Nut / Maidenhair Tree',
      ten_khoa_hoc: 'Ginkgo biloba L.',
      chuong: 'XXXII. Vị thuốc bổ sung – Phụ khoa & Sau sinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Thu sáp, cố tinh, chỉ đới. Chữa bạch đới khí hư nhiều, di tinh, tiểu không tự chủ, suyễn. Lá bạch quả tốt cho tuần hoàn não, trí nhớ.',
      tac_dung_list: ['bạch đới', 'khí hư', 'di tinh', 'tiểu không tự chủ', 'trí nhớ', 'tuần hoàn não'],
      mo_ta: 'Quả và hạt cây ngân hạnh. Hạt hình bầu dục, vỏ cứng màu trắng, nhân màu xanh nhạt.',
      cach_dung: 'Hạt đã nấu chín, ngày dùng 5–10 hạt. Không ăn sống, không dùng quá nhiều.',
    },
    {
      id: 'sup_036',
      ten_co_dau: 'Phục Linh',
      ten_khong_dau: 'Phuc Linh',
      ten_anh: 'Poria Mushroom / Fu Ling',
      ten_khoa_hoc: 'Wolfiporia cocos (F.A.Wolf) Ryvarden & Gilb.',
      chuong: 'XXXII. Vị thuốc bổ sung – Phụ khoa & Sau sinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Lợi thủy thấm thấp, kiện tỳ hòa vị, an thần. Chữa bạch đới do tỳ hư thấp thịnh, phù thũng, tiêu chảy, mất ngủ, tim hồi hộp, suy nhược.',
      tac_dung_list: ['bạch đới', 'khí hư', 'phù thũng', 'tiêu chảy', 'mất ngủ', 'suy nhược', 'kiện tỳ'],
      mo_ta: 'Thể nấm hình cầu, bên ngoài màu nâu đen thô ráp, bên trong màu trắng hoặc hồng nhạt. Vị ngọt nhạt.',
      cach_dung: 'Thái lát mỏng hoặc tán bột. Ngày dùng 10–15 g sắc uống hoặc nấu cháo.',
    },
    {
      id: 'sup_037',
      ten_co_dau: 'Hoàng Bá',
      ten_khong_dau: 'Hoang Ba',
      ten_anh: 'Amur Cork-tree Bark / Phellodendron',
      ten_khoa_hoc: 'Phellodendron amurense Rupr.',
      chuong: 'XXXII. Vị thuốc bổ sung – Phụ khoa & Sau sinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt táo thấp, tả hỏa giải độc. Chữa bạch đới vàng xanh hôi do thấp nhiệt, viêm âm đạo, tiêu chảy, vàng da, đau nhức xương về đêm do âm hư hỏa vượng.',
      tac_dung_list: ['bạch đới', 'viêm âm đạo', 'khí hư vàng', 'thấp nhiệt phụ khoa', 'vàng da'],
      mo_ta: 'Vỏ thân cây hoàng bá. Mảnh vỏ dạng bản, mặt trong màu vàng tươi, vị rất đắng. Chứa nhiều berberin.',
      cach_dung: 'Vỏ thái phiến, sao muối hoặc sao rượu. Ngày dùng 6–12 g sắc uống.',
    },

    /* ── SAU SINH / BỔ KHÍ HUYẾT ───────────────────────────── */
    {
      id: 'sup_038',
      ten_co_dau: 'Ích Mẫu (Sung Úy)',
      ten_khong_dau: 'Ich Mau Sung Uy',
      ten_anh: 'Motherwort / Leonurus',
      ten_khoa_hoc: 'Leonurus japonicus Houtt.',
      chuong: 'XXXII. Vị thuốc bổ sung – Phụ khoa & Sau sinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Hoạt huyết điều kinh, lợi thủy tiêu thũng. Chữa sau sinh máu xấu không ra hết, đau bụng sau sinh, kinh nguyệt không đều, bế kinh, phù thũng sau sinh.',
      tac_dung_list: ['sau sinh', 'kinh nguyệt không đều', 'bế kinh', 'đau bụng sau sinh', 'phù thũng sau sinh', 'hoạt huyết', 'bổ khí huyết'],
      mo_ta: 'Cây thảo cao 60–120 cm, thân vuông phân nhánh. Hoa nhỏ màu tím hồng mọc vòng quanh thân.',
      cach_dung: 'Toàn cây phơi khô. Ngày dùng 10–20 g sắc uống. Phụ nữ có thai không dùng.',
    },
    {
      id: 'sup_039',
      ten_co_dau: 'Thục Địa',
      ten_khong_dau: 'Thuc Dia',
      ten_anh: 'Prepared Rehmannia Root',
      ten_khoa_hoc: 'Rehmannia glutinosa (Gaertn.) DC.',
      chuong: 'XXXII. Vị thuốc bổ sung – Phụ khoa & Sau sinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Bổ huyết tư âm, ích tinh bổ tủy. Chữa huyết hư sau sinh, thiếu máu, kinh nguyệt ít màu nhạt, đau lưng gối do can thận âm hư. Vị thuốc bổ huyết số một.',
      tac_dung_list: ['sau sinh', 'bổ khí huyết', 'thiếu máu', 'kinh nguyệt ít', 'huyết hư', 'bổ huyết', 'âm hư'],
      mo_ta: 'Rễ củ cây địa hoàng đã qua chín (đồ 9 lần phơi 9 lần). Bên ngoài màu đen bóng, chất dẻo, vị ngọt đậm.',
      cach_dung: 'Thái lát mỏng, sắc uống. Ngày dùng 10–20 g. Hay dùng trong Tứ vật thang.',
    },
    {
      id: 'sup_040',
      ten_co_dau: 'Đương Quy',
      ten_khong_dau: 'Duong Quy',
      ten_anh: 'Chinese Angelica / Dong Quai',
      ten_khoa_hoc: 'Angelica sinensis (Oliv.) Diels',
      chuong: 'XXXII. Vị thuốc bổ sung – Phụ khoa & Sau sinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Bổ huyết hoạt huyết, điều kinh chỉ thống, nhuận trường. Chữa huyết hư sau sinh, thiếu máu, kinh nguyệt không đều, đau bụng kinh, táo bón do huyết hư.',
      tac_dung_list: ['sau sinh', 'bổ khí huyết', 'bổ huyết', 'thiếu máu', 'kinh nguyệt không đều', 'đau bụng kinh', 'điều kinh'],
      mo_ta: 'Rễ củ mập, chia đầu thân và nhiều rễ nhánh, mặt ngoài màu nâu vàng. Mùi thơm đặc trưng, vị ngọt cay đắng.',
      cach_dung: 'Rễ thái phiến, sao rượu. Ngày dùng 6–12 g sắc uống. Hay dùng trong Tứ vật thang, Bát trân thang.',
    },
    {
      id: 'sup_041',
      ten_co_dau: 'Xuyên Khung',
      ten_khong_dau: 'Xuyen Khung',
      ten_anh: 'Szechuan Lovage / Ligusticum',
      ten_khoa_hoc: 'Ligusticum striatum DC.',
      chuong: 'XXXII. Vị thuốc bổ sung – Phụ khoa & Sau sinh',
      page_start: 0, page_end: 0,
      tac_dung: 'Hoạt huyết hành khí, khu phong chỉ thống. Chữa đau đầu, đau bụng kinh, ứ huyết sau sinh, phong thấp đau khớp. Phối hợp Đương quy trong Tứ vật thang bổ huyết điều kinh.',
      tac_dung_list: ['sau sinh', 'bổ khí huyết', 'đau đầu', 'đau bụng kinh', 'ứ huyết', 'phong thấp', 'điều kinh'],
      mo_ta: 'Thân rễ hình cầu dẹt, mặt ngoài vàng nâu nhăn nheo. Mùi thơm mạnh, vị đắng cay.',
      cach_dung: 'Thân rễ thái phiến, sao rượu. Ngày dùng 6–10 g sắc uống.',
    },

    /* ── VIÊM MẮT ───────────────────────────────────────────── */
    {
      id: 'sup_042',
      ten_co_dau: 'Mật Mông Hoa',
      ten_khong_dau: 'Mat Mong Hoa',
      ten_anh: 'Pale Butterflybush Flower / Buddleia',
      ten_khoa_hoc: 'Buddleja officinalis Maxim.',
      chuong: 'XXXIII. Vị thuốc bổ sung – Tai Mũi Họng & Mắt',
      page_start: 0, page_end: 0,
      tac_dung: 'Thanh nhiệt bổ can, minh mục thoái ế. Chữa đau mắt đỏ, mắt mờ do can nhiệt, mắt nhiều dỉ, màng mắt, nhìn mờ do can huyết hư. Là vị thuốc chuyên dụng cho bệnh mắt.',
      tac_dung_list: ['viêm mắt', 'đau mắt đỏ', 'mắt mờ', 'màng mắt', 'dỉ mắt nhiều', 'minh mục', 'bổ mắt'],
      mo_ta: 'Nụ hoa chưa nở của cây mật mông. Hoa nhỏ, dày đặc, màu trắng vàng có lông mịn màu vàng phủ bên ngoài.',
      cach_dung: 'Nụ hoa phơi khô, tẩm mật ong sao. Ngày dùng 6–10 g sắc uống.',
    },
    {
      id: 'sup_043',
      ten_co_dau: 'Cốc Tinh Thảo',
      ten_khong_dau: 'Coc Tinh Thao',
      ten_anh: 'Pipewort Flower Head / Eriocaulon',
      ten_khoa_hoc: 'Eriocaulon buergerianum Körn.',
      chuong: 'XXXIII. Vị thuốc bổ sung – Tai Mũi Họng & Mắt',
      page_start: 0, page_end: 0,
      tac_dung: 'Khu phong tán nhiệt, minh mục thoái ế. Chữa đau mắt đỏ do phong nhiệt, màng mắt, nhìn mờ, nhức mắt. Phối hợp tốt với Mật mông hoa, Quyết minh tử điều trị bệnh mắt.',
      tac_dung_list: ['viêm mắt', 'đau mắt đỏ', 'màng mắt', 'nhức mắt', 'minh mục', 'phong nhiệt mắt', 'thị lực'],
      mo_ta: 'Đầu hoa hình cầu nhỏ màu trắng xám, cuống dài mảnh. Vị ngọt nhạt, tính bình. Mọc ở ruộng nước.',
      cach_dung: 'Đầu hoa phơi khô. Ngày dùng 6–10 g sắc uống.',
    },

    /* ── VIÊM TAI ───────────────────────────────────────────── */
    {
      id: 'sup_044',
      ten_co_dau: 'Thương Nhĩ Tử (Ké Đầu Ngựa)',
      ten_khong_dau: 'Thuong Nhi Tu Ke Dau Ngua',
      ten_anh: 'Xanthium Fruit / Cocklebur',
      ten_khoa_hoc: 'Xanthium strumarium L.',
      chuong: 'XXXIII. Vị thuốc bổ sung – Tai Mũi Họng & Mắt',
      page_start: 0, page_end: 0,
      tac_dung: 'Tán phong hàn, thông tỳ khiếu, trừ thấp chỉ thống. Chữa viêm tai giữa, viêm xoang, ngạt mũi, đau đầu, phong thấp đau khớp, mề đay ngứa. Vị thuốc chuyên khoa tai mũi họng.',
      tac_dung_list: ['viêm tai', 'viêm xoang', 'ngạt mũi', 'đau đầu', 'mề đay', 'phong thấp', 'thông tỳ khiếu'],
      mo_ta: 'Quả hình bầu dục có nhiều gai móc, màu vàng nâu. Cây mọc hoang phổ biến ở Việt Nam.',
      cach_dung: 'Quả sao vàng, tán bột. Ngày dùng 6–12 g sắc uống. Có độc nhẹ, không dùng quá liều.',
    },
    {
      id: 'sup_045',
      ten_co_dau: 'Bào Phụ Tử',
      ten_khong_dau: 'Bao Phu Tu',
      ten_anh: 'Prepared Aconite Root / Fu Zi',
      ten_khoa_hoc: 'Aconitum carmichaelii Debeaux',
      chuong: 'XXXIII. Vị thuốc bổ sung – Tai Mũi Họng & Mắt',
      page_start: 0, page_end: 0,
      tac_dung: 'Hồi dương cứu nghịch, bổ hỏa trợ dương, tán hàn chỉ thống, ôn thông kinh lạc. Chữa viêm tai giữa mãn tính do hàn thấp, đau khớp lạnh, suy thận dương, tay chân lạnh.',
      tac_dung_list: ['viêm tai mãn', 'đau khớp lạnh', 'thận dương hư', 'tay chân lạnh', 'trợ dương', 'hàn thấp'],
      mo_ta: 'Rễ củ phụ của cây ô đầu, đã qua chế biến kỹ. Vị cay ngọt, tính nóng mạnh.',
      cach_dung: 'Chỉ dùng loại đã chế (chế phụ tử). Ngày dùng 3–10 g, sắc trước 30–60 phút. Cần có thầy thuốc hướng dẫn.',
    },

    /* ── VIÊM XOANG ─────────────────────────────────────────── */
    {
      id: 'sup_046',
      ten_co_dau: 'Tân Di (Hoa Mộc Lan)',
      ten_khong_dau: 'Tan Di Hoa Moc Lan',
      ten_anh: 'Magnolia Flower Bud',
      ten_khoa_hoc: 'Magnolia biondii Pamp.',
      chuong: 'XXXIII. Vị thuốc bổ sung – Tai Mũi Họng & Mắt',
      page_start: 0, page_end: 0,
      tac_dung: 'Tán phong hàn, thông tỳ khiếu. Chữa viêm xoang, ngạt mũi, chảy nước mũi, đau đầu vùng trán, polyp mũi. Là vị thuốc chuyên dụng và hiệu quả nhất cho viêm xoang trong đông y.',
      tac_dung_list: ['viêm xoang', 'ngạt mũi', 'chảy nước mũi', 'đau đầu trán', 'polyp mũi', 'thông mũi'],
      mo_ta: 'Nụ hoa mộc lan chưa nở, hình thoi, phủ lông màu vàng xám bên ngoài. Vị cay, tính ôn.',
      cach_dung: 'Nụ hoa phơi khô, sắc uống. Ngày dùng 6–10 g. Cũng có thể dùng nụ hoa tươi xông hơi qua mũi.',
    },
    {
      id: 'sup_047',
      ten_co_dau: 'Bạch Chỉ',
      ten_khong_dau: 'Bach Chi',
      ten_anh: 'Dahurian Angelica Root',
      ten_khoa_hoc: 'Angelica dahurica (Fisch. ex Hoffm.) Benth. & Hook.f.',
      chuong: 'XXXIII. Vị thuốc bổ sung – Tai Mũi Họng & Mắt',
      page_start: 0, page_end: 0,
      tac_dung: 'Giải biểu tán hàn, thông tỳ khiếu, tiêu thũng bài nùng, chỉ thống. Chữa viêm xoang, đau đầu vùng trán, ngạt mũi, nước mũi trắng đục, đau răng, lang ben ngoài da.',
      tac_dung_list: ['viêm xoang', 'đau đầu trán', 'ngạt mũi', 'nước mũi đục', 'đau răng', 'lang ben'],
      mo_ta: 'Rễ hình trụ to, mặt ngoài màu trắng vàng, có vết nứt ngang. Mùi thơm đặc biệt, vị cay đắng.',
      cach_dung: 'Rễ thái lát, phơi hoặc sấy khô. Ngày dùng 6–12 g sắc uống.',
    }

  ]; // end SUPPLEMENT_PLANTS


  /* ================================================================
     2. TỪ KHÓA BỆNH BỔ SUNG
     ================================================================ */
  var SUPPLEMENT_KEYWORDS = {
    'viêm phổi':           ['sup_001', 'sup_002', 'sup_003', 'sup_004'],
    'ho có đờm':           ['sup_001', 'sup_002'],
    'ho khan':             ['sup_003', 'sup_004'],
    'ho lâu ngày':         ['sup_002', 'sup_032'],
    'ho gà':               ['sup_002'],
    'nhuận phế':           ['sup_002', 'sup_003', 'sup_004'],
    'bổ phổi':             ['sup_002', 'sup_032'],
    'phế âm hư':           ['sup_004'],
    'viêm loét dạ dày':    ['sup_005', 'sup_006', 'sup_007'],
    'ợ chua':              ['sup_005'],
    'đau dạ dày':          ['sup_005', 'sup_006'],
    'tá tràng':            ['sup_005'],
    'xuất huyết tiêu hóa': ['sup_005'],
    'tim hồi hộp':         ['sup_004', 'sup_008', 'sup_009', 'sup_010', 'sup_011', 'sup_031'],
    'căng thẳng':          ['sup_008', 'sup_009', 'sup_011', 'sup_012', 'sup_013', 'sup_033'],
    'mất ngủ':             ['sup_004', 'sup_008', 'sup_009', 'sup_011', 'sup_031', 'sup_036'],
    'lo âu':               ['sup_008', 'sup_011'],
    'an thần':             ['sup_008', 'sup_009', 'sup_011', 'sup_031', 'sup_036'],
    'trầm cảm':            ['sup_011'],
    'hay quên':            ['sup_009', 'sup_011'],
    'đau thắt ngực':       ['sup_010'],
    'rối loạn nhịp tim':   ['sup_010'],
    'chóng mặt':           ['sup_012', 'sup_013'],
    'huyết áp cao':        ['sup_012', 'sup_013', 'sup_017', 'sup_030'],
    'động kinh':           ['sup_012'],
    'viêm khớp':           ['sup_014', 'sup_015', 'sup_017'],
    'thoái hóa khớp':      ['sup_014', 'sup_015', 'sup_016', 'sup_017'],
    'đau nhức xương khớp': ['sup_014', 'sup_015', 'sup_016', 'sup_017'],
    'thấp khớp':           ['sup_014', 'sup_015'],
    'phong thấp':          ['sup_014', 'sup_015', 'sup_041', 'sup_044'],
    'đau lưng':            ['sup_016', 'sup_017'],
    'loãng xương':         ['sup_016'],
    'tê bì chân tay':      ['sup_014'],
    'nấm da':              ['sup_018', 'sup_019', 'sup_020'],
    'hắc lào':             ['sup_019'],
    'lang ben':            ['sup_019', 'sup_047'],
    'ghẻ ngứa':            ['sup_019'],
    'eczema':              ['sup_018', 'sup_020'],
    'mề đay':              ['sup_020', 'sup_044'],
    'ngứa da':             ['sup_020'],
    'viêm da':             ['sup_018'],
    'da liễu':             ['sup_018', 'sup_019', 'sup_020'],
    'vàng da':             ['sup_021', 'sup_022', 'sup_023', 'sup_024'],
    'viêm gan':            ['sup_021', 'sup_022', 'sup_023', 'sup_024'],
    'viêm gan b':          ['sup_024'],
    'xơ gan':              ['sup_021'],
    'sỏi mật':             ['sup_021', 'sup_022', 'sup_023'],
    'viêm túi mật':        ['sup_021', 'sup_022'],
    'gan mật':             ['sup_021', 'sup_022', 'sup_023', 'sup_024'],
    'bảo vệ gan':          ['sup_024'],
    'giải độc gan':        ['sup_024'],
    'lợi mật':             ['sup_021', 'sup_023'],
    'béo phì':             ['sup_025', 'sup_026', 'sup_027'],
    'giảm cân':            ['sup_025', 'sup_027'],
    'mỡ máu cao':          ['sup_025', 'sup_026', 'sup_027'],
    'hạ mỡ máu':           ['sup_025', 'sup_026', 'sup_027'],
    'cholesterol':         ['sup_026'],
    'lipid máu':           ['sup_025', 'sup_026', 'sup_027'],
    'tuyến giáp':          ['sup_028', 'sup_029', 'sup_030'],
    'bướu cổ':             ['sup_028', 'sup_029', 'sup_030'],
    'thiểu năng giáp':     ['sup_028', 'sup_029'],
    'u hạch':              ['sup_028', 'sup_029', 'sup_030'],
    'suy nhược':           ['sup_007', 'sup_031', 'sup_032', 'sup_033', 'sup_034', 'sup_036'],
    'tăng cường miễn dịch':['sup_007', 'sup_029', 'sup_031', 'sup_032', 'sup_033', 'sup_034'],
    'chống lão hóa':       ['sup_031', 'sup_034'],
    'bổ khí':              ['sup_007', 'sup_033'],
    'bổ khí huyết':        ['sup_007', 'sup_010', 'sup_034', 'sup_038', 'sup_039', 'sup_040'],
    'bạch đới':            ['sup_035', 'sup_036', 'sup_037'],
    'khí hư':              ['sup_035', 'sup_036', 'sup_037'],
    'viêm âm đạo':         ['sup_037'],
    'khí hư vàng':         ['sup_037'],
    'sau sinh':            ['sup_038', 'sup_039', 'sup_040', 'sup_041'],
    'bổ huyết':            ['sup_039', 'sup_040'],
    'thiếu máu':           ['sup_039', 'sup_040'],
    'kinh nguyệt không đều':['sup_010', 'sup_017', 'sup_023', 'sup_038', 'sup_040', 'sup_041'],
    'đau bụng kinh':       ['sup_040', 'sup_041'],
    'điều kinh':           ['sup_038', 'sup_040', 'sup_041'],
    'huyết hư':            ['sup_039', 'sup_040'],
    'bế kinh':             ['sup_038'],
    'viêm mắt':            ['sup_042', 'sup_043'],
    'đau mắt đỏ':          ['sup_027', 'sup_030', 'sup_042', 'sup_043'],
    'mắt mờ':              ['sup_042', 'sup_043'],
    'bổ mắt':              ['sup_034', 'sup_042'],
    'minh mục':            ['sup_042', 'sup_043'],
    'màng mắt':            ['sup_042', 'sup_043'],
    'thị lực':             ['sup_034', 'sup_042'],
    'viêm tai':            ['sup_044', 'sup_045'],
    'viêm tai giữa':       ['sup_044', 'sup_045'],
    'ù tai':               ['sup_044'],
    'viêm xoang':          ['sup_044', 'sup_046', 'sup_047'],
    'ngạt mũi':            ['sup_044', 'sup_046', 'sup_047'],
    'chảy nước mũi':       ['sup_046', 'sup_047'],
    'polyp mũi':           ['sup_046'],
    'thông mũi':           ['sup_046', 'sup_047'],
    'đau đầu trán':        ['sup_046', 'sup_047'],
    'nước mũi đục':        ['sup_047'],
  };


  /* ================================================================
     3. TỪ KHÓA TRA NHANH BỔ SUNG
     ================================================================ */
  var SUPPLEMENT_QUICK_FILTERS = [
    'viêm phổi', 'viêm loét dạ dày', 'tim hồi hộp', 'căng thẳng',
    'chóng mặt', 'viêm khớp', 'thoái hóa khớp', 'nấm da',
    'vàng da', 'viêm gan', 'béo phì', 'giảm cân', 'mỡ máu cao',
    'tuyến giáp', 'bướu cổ', 'suy nhược', 'tăng cường miễn dịch',
    'bạch đới', 'sau sinh', 'bổ khí huyết',
    'viêm mắt', 'đau mắt đỏ', 'viêm tai', 'viêm xoang', 'ngạt mũi',
    'mất ngủ', 'đau bụng kinh', 'thiếu máu',
  ];


  /* ================================================================
     4. HÀM PATCH — Chạy sau khi app.js đã khởi tạo xong
     Dùng setTimeout để đảm bảo DOMContentLoaded của app.js đã chạy
     ================================================================ */
  function applyPatch() {

    /* 4a. Thêm cây vào CAY_THUOC_DATA */
    if (typeof CAY_THUOC_DATA !== 'undefined' && Array.isArray(CAY_THUOC_DATA)) {
      var existingIds = new Set(CAY_THUOC_DATA.map(function (p) { return p.id; }));
      var added = 0;
      SUPPLEMENT_PLANTS.forEach(function (plant) {
        if (!existingIds.has(plant.id)) {
          CAY_THUOC_DATA.push(plant);
          added++;
        }
      });
      console.log('[Supplement] Đã thêm ' + added + ' vị thuốc. Tổng: ' + CAY_THUOC_DATA.length);
    }

    /* 4b. Patch QUICK_FILTERS (là const Array nên ta push trực tiếp) */
    if (typeof QUICK_FILTERS !== 'undefined' && Array.isArray(QUICK_FILTERS)) {
      SUPPLEMENT_QUICK_FILTERS.forEach(function (kw) {
        if (QUICK_FILTERS.indexOf(kw) === -1) QUICK_FILTERS.push(kw);
      });
    }

    /* 4c. Patch DISEASE_EXTRA_KEYWORDS (const Object — ta thêm key mới) */
    if (typeof DISEASE_EXTRA_KEYWORDS !== 'undefined') {
      Object.keys(SUPPLEMENT_KEYWORDS).forEach(function (kw) {
        if (!DISEASE_EXTRA_KEYWORDS[kw]) {
          DISEASE_EXTRA_KEYWORDS[kw] = [];
        }
        SUPPLEMENT_KEYWORDS[kw].forEach(function (id) {
          if (DISEASE_EXTRA_KEYWORDS[kw].indexOf(id) === -1) {
            DISEASE_EXTRA_KEYWORDS[kw].push(id);
          }
        });
      });
    }

    /* 4d. Re-render trang hiện tại để hiển thị dữ liệu mới */
    if (typeof navigate === 'function' && typeof STATE !== 'undefined') {
      navigate(STATE.currentPage);
    }

    console.log('[Supplement] Patch hoàn tất.');
  }

  /* Chạy sau khi toàn bộ DOM + scripts đã load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatch);
  } else {
    applyPatch();
  }

})();

// =========================================================================
// TC NEXUS 2570 - NEXT-GEN SMART ADMISSION & LIVE DIGITAL TWIN PLATFORM
// วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
// =========================================================================

const DEPARTMENTS = [
    { id: 'MECH', code: '01', name: 'ช่างยนต์ (เทคนิคเครื่องกล)', quota: 40, color: '#ef4444' },
    { id: 'PROD', code: '02', name: 'ช่างกลโรงงาน (เทคนิคการผลิต)', quota: 35, color: '#f97316' },
    { id: 'WELD', code: '03', name: 'ช่างเชื่อมโลหะ', quota: 30, color: '#f59e0b' },
    { id: 'ELEC', code: '04', name: 'ช่างไฟฟ้ากำลัง', quota: 45, color: '#06b6d4' },
    { id: 'ELTR', code: '05', name: 'ช่างอิเล็กทรอนิกส์', quota: 35, color: '#3b82f6' },
    { id: 'MECA', code: '06', name: 'เมคคาทรอนิกส์และหุ่นยนต์', quota: 30, color: '#8b5cf6' },
    { id: 'ACCT', code: '07', name: 'การบัญชี', quota: 40, color: '#10b981' },
    { id: 'DBIZ', code: '08', name: 'เทคโนโลยีธุรกิจดิจิทัล', quota: 45, color: '#14b8a6' },
    { id: 'LOGI', code: '09', name: 'การจัดการโลจิสติกส์และซัพพลายเชน', quota: 35, color: '#ec4899' }
];

const STORAGE_KEY = 'TC_ADMISSION_2570_DB';
const NOTIFY_LOG_KEY = 'TC_ADMISSION_2570_LOGS';
const STAFF_AUTH_KEY = 'TC_ADMISSION_2570_STAFF_SESSION';

let currentUploadedFiles = {
    photo: null,
    transcript: null,
    idcard: null,
    cert: null
};

let currentSignatureDataUrl = null;
let activeApplicantIdForPdf = null;
let currentPdfMode = 'application';
let isLiveTwinVisible = true;
let pendingProtectedTab = null;

let deptChartInstance = null;
let levelChartInstance = null;
let channelChartInstance = null;
let schoolChartInstance = null;
let provinceChartInstance = null;
let adminDeptChartInstance = null;
let adminChannelChartInstance = null;

// แปลงเลขอารบิกเป็นเลขไทย
function toThaiDigits(input) {
    if (input === null || input === undefined || input === '') return '';
    const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return String(input).replace(/[0-9]/g, d => thaiNums[parseInt(d, 10)]);
}

// สร้าง SVG QR Code สำหรับตรวจสอบสถานะใบสมัครบนมุมกระดาษ A4
function generateMiniQrSvg(seedText) {
    const hash = Array.from(String(seedText || 'TC2570')).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    let cells = '';
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            const isCorner = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
            const on = isCorner || ((hash + r * 7 + c * 13) % 3 === 0);
            if (on) {
                cells += `<rect x="${c * 4}" y="${r * 4}" width="3.5" height="3.5" fill="#000"/>`;
            }
        }
    }
    return `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" class="border border-black p-0.5 bg-white">${cells}</svg>`;
}

// ข้อมูลตัวอย่างเริ่มต้น 8 คน
function getInitialDemoApplicants() {
    return [
        {
            id: 'Q70-0001',
            studentCode: '7020104001',
            citizenId: '1139900451234',
            prefix: 'นาย',
            firstName: 'ธนภัทร',
            lastName: 'เจริญสุข',
            birthDay: '14',
            birthMonth: 'พฤษภาคม',
            birthYear: '2554',
            fatherName: 'นายสมศักดิ์ เจริญสุข',
            fatherAge: '46',
            fatherJob: 'ช่างซ่อมบำรุง',
            motherName: 'นางวิภา เจริญสุข',
            motherAge: '43',
            motherJob: 'ค้าขาย',
            addrNo: '89/2',
            addrMoo: '4',
            addrSoi: '-',
            addrRoad: 'พหลโยธิน',
            addrSubdistrict: 'ท่าหลวง',
            addrDistrict: 'ท่าเรือ',
            addrProvince: 'พระนครศรีอยุธยา',
            addrZip: '13130',
            phone: '0891234567',
            currentGrade: 'ม.3',
            schoolName: 'ท่าเรือ "นิตยานุกูล"',
            schoolNo: '112',
            schoolSubdistrict: 'ท่าเรือ',
            schoolDistrict: 'ท่าเรือ',
            schoolProvince: 'พระนครศรีอยุธยา',
            gpax: '3.45',
            oldMajor: 'วิทย์-คณิต',
            applyLevel: 'ปวช.',
            deptChoice1: 'ช่างไฟฟ้ากำลัง',
            deptChoice2: 'ช่างอิเล็กทรอนิกส์',
            referralChannel: 'ครูแนะแนวประจำโรงเรียน',
            status: 'มอบตัวแล้ว',
            appliedDate: '5 พฤศจิกายน 2569',
            applyDay: '5',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: 'รบ.1_ธนภัทร.pdf', idcard: 'บัตรประชาชน_ธนภัทร.jpg', cert: 'เกียรติบัตรทักษะวิชาชีพ.pdf' },
            signature: null,
            enrollment: {
                guardianName: 'นายสมศักดิ์ เจริญสุข',
                guardianRelation: 'บิดา',
                guardianPhone: '0819988776',
                witnessName: 'อ.พงศ์ศักดิ์ วิชาการ',
                enrolledDate: '6 พฤศจิกายน 2569'
            }
        },
        {
            id: 'Q70-0002',
            studentCode: '7030107001',
            citizenId: '1199900321456',
            prefix: 'นางสาว',
            firstName: 'กมลชนก',
            lastName: 'ศรีสวัสดิ์',
            birthDay: '22',
            birthMonth: 'สิงหาคม',
            birthYear: '2551',
            fatherName: 'นายประเสริฐ ศรีสวัสดิ์',
            fatherAge: '50',
            fatherJob: 'พนักงานบริษัท',
            motherName: 'นางกัลยา ศรีสวัสดิ์',
            motherAge: '48',
            motherJob: 'รับราชการ',
            addrNo: '45',
            addrMoo: '2',
            addrSoi: 'เทศบาล 3',
            addrRoad: '-',
            addrSubdistrict: 'บ้านหมอ',
            addrDistrict: 'บ้านหมอ',
            addrProvince: 'สระบุรี',
            addrZip: '18130',
            phone: '0923456789',
            currentGrade: 'ปวช.3',
            schoolName: 'วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์',
            schoolNo: '99',
            schoolSubdistrict: 'บ้านครัว',
            schoolDistrict: 'บ้านหมอ',
            schoolProvince: 'สระบุรี',
            gpax: '3.78',
            oldMajor: 'การบัญชี',
            applyLevel: 'ปวส. (สายตรง)',
            deptChoice1: 'การบัญชี',
            deptChoice2: '',
            referralChannel: 'รุ่นพี่ / ศิษย์เก่าแนะนำ',
            status: 'มอบตัวแล้ว',
            appliedDate: '5 พฤศจิกายน 2569',
            applyDay: '5',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: 'รบ.1_กมลชนก.pdf', idcard: 'สำเนาบัตร_กมลชนก.pdf', cert: null },
            signature: null,
            enrollment: {
                guardianName: 'นางกัลยา ศรีสวัสดิ์',
                guardianRelation: 'มารดา',
                guardianPhone: '0894455667',
                witnessName: 'อ.นันทนา ทะเบียน',
                enrolledDate: '6 พฤศจิกายน 2569'
            }
        },
        {
            id: 'Q70-0003',
            studentCode: '',
            citizenId: '1190200887654',
            prefix: 'นาย',
            firstName: 'พีรพัฒน์',
            lastName: 'วงศ์สุวรรณ',
            birthDay: '9',
            birthMonth: 'มกราคม',
            birthYear: '2554',
            fatherName: 'นายมานพ วงศ์สุวรรณ',
            fatherAge: '44',
            fatherJob: 'เกษตรกร',
            motherName: 'นางสุดา วงศ์สุวรรณ',
            motherAge: '41',
            motherJob: 'เกษตรกร',
            addrNo: '19/1',
            addrMoo: '7',
            addrSoi: '-',
            addrRoad: '-',
            addrSubdistrict: 'หนองโดน',
            addrDistrict: 'หนองโดน',
            addrProvince: 'สระบุรี',
            addrZip: '18190',
            phone: '0845678901',
            currentGrade: 'ม.3',
            schoolName: 'หนองโดนวิทยา',
            schoolNo: '55',
            schoolSubdistrict: 'หนองโดน',
            schoolDistrict: 'หนองโดน',
            schoolProvince: 'สระบุรี',
            gpax: '3.12',
            oldMajor: 'สามัญ',
            applyLevel: 'ปวช.',
            deptChoice1: 'ช่างยนต์ (เทคนิคเครื่องกล)',
            deptChoice2: 'ช่างเชื่อมโลหะ',
            referralChannel: 'ครูแนะแนวประจำโรงเรียน',
            status: 'ผ่านการคัดเลือก',
            appliedDate: '6 พฤศจิกายน 2569',
            applyDay: '6',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: 'รบ.1_พีรพัฒน์.jpg', idcard: 'บัตร_พีรพัฒน์.jpg', cert: null },
            signature: null,
            enrollment: null
        },
        {
            id: 'Q70-0004',
            studentCode: '',
            citizenId: '1160100998877',
            prefix: 'นางสาว',
            firstName: 'ชลธิชา',
            lastName: 'อินทร์จันทร์',
            birthDay: '3',
            birthMonth: 'พฤศจิกายน',
            birthYear: '2551',
            fatherName: 'นายวิชัย อินทร์จันทร์',
            fatherAge: '49',
            fatherJob: 'ค้าขาย',
            motherName: 'นางมาลี อินทร์จันทร์',
            motherAge: '47',
            motherJob: 'ค้าขาย',
            addrNo: '204',
            addrMoo: '1',
            addrSoi: '-',
            addrRoad: 'สุวรรณศร',
            addrSubdistrict: 'เสาไห้',
            addrDistrict: 'เสาไห้',
            addrProvince: 'สระบุรี',
            addrZip: '18160',
            phone: '0956781234',
            currentGrade: 'ม.6',
            schoolName: 'เสาไห้ "วิมลวิทยานุกูล"',
            schoolNo: '88',
            schoolSubdistrict: 'เสาไห้',
            schoolDistrict: 'เสาไห้',
            schoolProvince: 'สระบุรี',
            gpax: '3.60',
            oldMajor: 'ศิลป์-คำนวณ',
            applyLevel: 'ปวส. (ม.6/ปวช. ต่างสาขา)',
            deptChoice1: 'เทคโนโลยีธุรกิจดิจิทัล',
            deptChoice2: '',
            referralChannel: 'เพจ Facebook / โซเชียลมีเดีย',
            status: 'ผ่านการคัดเลือก',
            appliedDate: '6 พฤศจิกายน 2569',
            applyDay: '6',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: 'รบ1_ชลธิชา.pdf', idcard: 'บัตรประชาชน_ชลธิชา.pdf', cert: 'เกียรติบัตรคอมพิวเตอร์.pdf' },
            signature: null,
            enrollment: null
        },
        {
            id: 'Q70-0005',
            studentCode: '',
            citizenId: '1130500112233',
            prefix: 'นาย',
            firstName: 'ณัฐวุฒิ',
            lastName: 'ทองดี',
            birthDay: '19',
            birthMonth: 'เมษายน',
            birthYear: '2554',
            fatherName: 'นายบุญมี ทองดี',
            fatherAge: '52',
            fatherJob: 'รับจ้างทั่วไป',
            motherName: 'นางสมพร ทองดี',
            motherAge: '49',
            motherJob: 'แม่บ้าน',
            addrNo: '77/3',
            addrMoo: '6',
            addrSoi: '-',
            addrRoad: '-',
            addrSubdistrict: 'บ้านครัว',
            addrDistrict: 'บ้านหมอ',
            addrProvince: 'สระบุรี',
            addrZip: '18270',
            phone: '0812349876',
            currentGrade: 'ม.3',
            schoolName: 'เทพศิรินทร์ พุแค',
            schoolNo: '42',
            schoolSubdistrict: 'พุแค',
            schoolDistrict: 'เฉลิมพระเกียรติ',
            schoolProvince: 'สระบุรี',
            gpax: '2.95',
            oldMajor: 'สามัญ',
            applyLevel: 'ปวช.',
            deptChoice1: 'เมคคาทรอนิกส์และหุ่นยนต์',
            deptChoice2: 'ช่างไฟฟ้ากำลัง',
            referralChannel: 'ครูแนะแนวประจำโรงเรียน',
            status: 'รอตรวจสอบ',
            appliedDate: '7 พฤศจิกายน 2569',
            applyDay: '7',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: 'ใบเกรด_ณัฐวุฒิ.jpg', idcard: 'บัตร_ณัฐวุฒิ.jpg', cert: null },
            signature: null,
            enrollment: null
        },
        {
            id: 'Q70-0006',
            studentCode: '',
            citizenId: '1190400556677',
            prefix: 'นาย',
            firstName: 'กิตติพงศ์',
            lastName: 'แสนทวี',
            birthDay: '28',
            birthMonth: 'กุมภาพันธ์',
            birthYear: '2551',
            fatherName: 'นายสุรชัย แสนทวี',
            fatherAge: '47',
            fatherJob: 'ช่างกลโรงงาน',
            motherName: 'นางอรทัย แสนทวี',
            motherAge: '45',
            motherJob: 'พนักงานฝ่ายผลิต',
            addrNo: '15',
            addrMoo: '3',
            addrSoi: '-',
            addrRoad: '-',
            addrSubdistrict: 'ดอนพุด',
            addrDistrict: 'ดอนพุด',
            addrProvince: 'สระบุรี',
            addrZip: '18210',
            phone: '0867788990',
            currentGrade: 'ปวช.3',
            schoolName: 'วิทยาลัยเทคนิคสระบุรี',
            schoolNo: '101',
            schoolSubdistrict: 'ปากเพรียว',
            schoolDistrict: 'เมืองสระบุรี',
            schoolProvince: 'สระบุรี',
            gpax: '3.32',
            oldMajor: 'ช่างกลโรงงาน',
            applyLevel: 'ปวส. (สายตรง)',
            deptChoice1: 'ช่างกลโรงงาน (เทคนิคการผลิต)',
            deptChoice2: '',
            referralChannel: 'ผู้ปกครองแนะนำ',
            status: 'รอตรวจสอบ',
            appliedDate: '7 พฤศจิกายน 2569',
            applyDay: '7',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: 'รบ1_กิตติพงศ์.pdf', idcard: 'บัตร_กิตติพงศ์.jpg', cert: null },
            signature: null,
            enrollment: null
        },
        {
            id: 'Q70-0007',
            studentCode: '',
            citizenId: '1130700665544',
            prefix: 'นางสาว',
            firstName: 'ปนัดดา',
            lastName: 'รุ่งเรือง',
            birthDay: '11',
            birthMonth: 'ตุลาคม',
            birthYear: '2551',
            fatherName: 'นายสมหมาย รุ่งเรือง',
            fatherAge: '48',
            fatherJob: 'ขับรถขนส่ง',
            motherName: 'นางยุพา รุ่งเรือง',
            motherAge: '44',
            motherJob: 'ค้าขาย',
            addrNo: '62',
            addrMoo: '9',
            addrSoi: '-',
            addrRoad: '-',
            addrSubdistrict: 'นครหลวง',
            addrDistrict: 'นครหลวง',
            addrProvince: 'พระนครศรีอยุธยา',
            addrZip: '13260',
            phone: '0911223344',
            currentGrade: 'ม.6',
            schoolName: 'นครหลวง "อุดมรัชต์วิทยา"',
            schoolNo: '39',
            schoolSubdistrict: 'นครหลวง',
            schoolDistrict: 'นครหลวง',
            schoolProvince: 'พระนครศรีอยุธยา',
            gpax: '3.20',
            oldMajor: 'วิทย์-คณิต',
            applyLevel: 'ปวส. (ม.6/ปวช. ต่างสาขา)',
            deptChoice1: 'การจัดการโลจิสติกส์และซัพพลายเชน',
            deptChoice2: '',
            referralChannel: 'เพจ Facebook / โซเชียลมีเดีย',
            status: 'เอกสารไม่ครบ',
            statusRemark: 'กรุณาแนบสำเนาใบแสดงผลการเรียน (รบ.1) หน้าหลังให้ชัดเจน',
            appliedDate: '7 พฤศจิกายน 2569',
            applyDay: '7',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: null, idcard: 'บัตร_ปนัดดา.jpg', cert: null },
            signature: null,
            enrollment: null
        },
        {
            id: 'Q70-0008',
            studentCode: '',
            citizenId: '1190100778899',
            prefix: 'นาย',
            firstName: 'ศุภกร',
            lastName: 'เพชรรัตน์',
            birthDay: '25',
            birthMonth: 'ธันวาคม',
            birthYear: '2554',
            fatherName: 'นายดำรง เพชรรัตน์',
            fatherAge: '43',
            fatherJob: 'ช่างเชื่อม',
            motherName: 'นางสายฝน เพชรรัตน์',
            motherAge: '40',
            motherJob: 'รับจ้าง',
            addrNo: '108',
            addrMoo: '5',
            addrSoi: '-',
            addrRoad: '-',
            addrSubdistrict: 'พระพุทธบาท',
            addrDistrict: 'พระพุทธบาท',
            schoolName: 'สวนกุหลาบวิทยาลัย สระบุรี',
            addrProvince: 'สระบุรี',
            addrZip: '18120',
            phone: '0833445566',
            currentGrade: 'ม.3',
            schoolNo: '90',
            schoolSubdistrict: 'ธารเกษม',
            schoolDistrict: 'พระพุทธบาท',
            schoolProvince: 'สระบุรี',
            gpax: '3.50',
            oldMajor: 'สามัญ',
            applyLevel: 'ปวช.',
            deptChoice1: 'ช่างไฟฟ้ากำลัง',
            deptChoice2: 'เมคคาทรอนิกส์และหุ่นยนต์',
            referralChannel: 'เว็บไซต์วิทยาลัย / ป้ายประชาสัมพันธ์',
            status: 'ผ่านการคัดเลือก',
            appliedDate: '7 พฤศจิกายน 2569',
            applyDay: '7',
            applyMonth: 'พฤศจิกายน',
            applyYear: '2569',
            files: { photo: null, transcript: 'รบ1_ศุภกร.pdf', idcard: 'บัตร_ศุภกร.pdf', cert: null },
            signature: null,
            enrollment: null
        }
    ];
}

// =========================================================================
// DATABASE HELPERS
// =========================================================================
function getApplicants() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const seed = getInitialDemoApplicants();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        return seed;
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        return getInitialDemoApplicants();
    }
}

function saveApplicants(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    updateAdminBadge();
}

function addNotificationLog(message) {
    const logs = JSON.parse(localStorage.getItem(NOTIFY_LOG_KEY) || '[]');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logs.unshift(`[${timeStr}] ${message}`);
    localStorage.setItem(NOTIFY_LOG_KEY, JSON.stringify(logs.slice(0, 30)));
    renderNotifyLogs();
}

// =========================================================================
// INITIALIZATION & DIGITAL SIGNATURE PAD
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    populateFormSelects();
    initSignaturePad();
    getApplicants();
    updateAdminBadge();
    updateStaffAuthUI();
    updateLiveTwinAndProgress();
    initCosmicStarfield();
    addNotificationLog('⚡ TC NEXUS 2570 Online — เชื่อมต่อระบบออกใบสมัคร Live Digital Twin และ LINE OA แล้ว');

    // Keyboard shortcut Ctrl+K for Command Palette
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openCommandPalette();
        } else if (e.key === 'Escape') {
            closeCommandPalette();
        }
    });
});

// =========================================================================
// COSMIC STARFIELD & SHOOTING STARS (METEORS) BACKGROUND ENGINE (BLUE & GOLD)
// =========================================================================
function initCosmicStarfield() {
    const canvas = document.getElementById('starfieldCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const starColors = ['#ffffff', '#fef08a', '#facc15', '#93c5fd', '#60a5fa', '#38bdf8'];
    const stars = Array.from({ length: 135 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.7 + 0.4,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: (Math.random() * 0.018 + 0.004) * (Math.random() < 0.5 ? 1 : -1),
        color: starColors[Math.floor(Math.random() * starColors.length)]
    }));

    const meteors = [];

    function spawnMeteor() {
        const isGold = Math.random() < 0.58;
        const startX = Math.random() * (width * 1.15) + width * 0.1;
        const startY = Math.random() * (height * 0.45) - 40;
        const speed = Math.random() * 7 + 8;
        const angle = (Math.PI / 180) * (142 + Math.random() * 10); // ~145 deg (top-right to bottom-left)
        meteors.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            len: Math.random() * 110 + 90,
            alpha: 1,
            headColor: isGold ? '#fef08a' : '#e0f2fe',
            tailColor: isGold ? 'rgba(250, 204, 21,' : 'rgba(56, 189, 248,'
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        const isLight = document.documentElement.classList.contains('light');
        const visibilityFactor = isLight ? 0.18 : 1;

        // Draw twinkling stars
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            s.alpha += s.twinkleSpeed;
            if (s.alpha > 1 || s.alpha < 0.15) s.twinkleSpeed *= -1;

            ctx.save();
            ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha)) * visibilityFactor;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Occasionally spawn a shooting star
        if (Math.random() < 0.032 && meteors.length < 4) {
            spawnMeteor();
        }

        // Draw shooting stars (meteors)
        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.alpha -= 0.012;

            if (m.alpha <= 0 || m.x < -200 || m.y > height + 200) {
                meteors.splice(i, 1);
                continue;
            }

            const mag = Math.hypot(m.vx, m.vy) || 1;
            const tailX = m.x - (m.vx / mag) * m.len;
            const tailY = m.y - (m.vy / mag) * m.len;

            ctx.save();
            ctx.globalAlpha = m.alpha * visibilityFactor;
            const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
            grad.addColorStop(0, m.headColor);
            grad.addColorStop(0.3, `${m.tailColor} 0.75)`);
            grad.addColorStop(1, `${m.tailColor} 0)`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            // Glowing meteor head
            ctx.fillStyle = m.headColor;
            ctx.shadowColor = m.headColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(m.x, m.y, 2.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        requestAnimationFrame(animate);
    }

    spawnMeteor();
    animate();
}

// =========================================================================
// STAFF / ADMIN AUTHENTICATION SYSTEM (TOP-RIGHT LOGIN)
// =========================================================================
function getStaffSession() {
    try {
        const raw = localStorage.getItem(STAFF_AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function isStaffAuthenticated() {
    return Boolean(getStaffSession());
}

function updateStaffAuthUI() {
    const session = getStaffSession();
    const btnLogin = document.getElementById('btnTopStaffLogin');
    const badgeLoggedIn = document.getElementById('staffLoggedInBadge');
    const displayName = document.getElementById('staffDisplayName');
    const lockIcon = document.getElementById('nav-admin-lock');
    const activeUserLabel = document.getElementById('adminActiveUserLabel');

    if (session) {
        if (btnLogin) btnLogin.classList.add('hidden');
        if (badgeLoggedIn) {
            badgeLoggedIn.classList.remove('hidden');
            badgeLoggedIn.classList.add('flex');
        }
        if (displayName) displayName.textContent = session.role || session.username;
        if (lockIcon) lockIcon.classList.add('hidden');
        if (activeUserLabel) activeUserLabel.textContent = `ผู้ใช้งาน: ${session.username} (${session.role})`;
    } else {
        if (btnLogin) btnLogin.classList.remove('hidden');
        if (badgeLoggedIn) {
            badgeLoggedIn.classList.add('hidden');
            badgeLoggedIn.classList.remove('flex');
        }
        if (lockIcon) lockIcon.classList.remove('hidden');
    }
    lucide.createIcons();
}

function openStaffLoginModal(targetTab = 'admin') {
    pendingProtectedTab = targetTab;
    const errEl = document.getElementById('staffLoginError');
    if (errEl) errEl.classList.add('hidden');
    document.getElementById('staffLoginModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeStaffLoginModal() {
    document.getElementById('staffLoginModal').classList.add('hidden');
}

function fillDemoAdminCredentials() {
    document.getElementById('staffUsernameInput').value = 'admin';
    document.getElementById('staffPasswordInput').value = '2570';
}

function handleStaffLoginSubmit(event) {
    event.preventDefault();
    const username = document.getElementById('staffUsernameInput').value.trim();
    const password = document.getElementById('staffPasswordInput').value.trim();
    const role = document.getElementById('staffRoleInput').value;

    const validUsers = ['admin', 'registrar', 'staff', 'teacher'];
    if (validUsers.includes(username.toLowerCase()) && (password === '2570' || password === '1234' || password === 'admin')) {
        const sessionData = {
            username,
            role,
            loginTime: new Date().toLocaleTimeString('th-TH')
        };
        localStorage.setItem(STAFF_AUTH_KEY, JSON.stringify(sessionData));
        closeStaffLoginModal();
        updateStaffAuthUI();
        addNotificationLog(`🔐 เจ้าหน้าที่ [${username} - ${role}] เข้าสู่ระบบจัดการผู้ดูแลระบบสำเร็จ`);

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `เข้าสู่ระบบสำเร็จ (${role})`,
            showConfirmButton: false,
            timer: 2200
        });

        switchTab(pendingProtectedTab || 'admin');
    } else {
        document.getElementById('staffLoginError').classList.remove('hidden');
    }
}

function handleStaffLogout() {
    localStorage.removeItem(STAFF_AUTH_KEY);
    updateStaffAuthUI();
    addNotificationLog('🔒 เจ้าหน้าที่ออกจากระบบจัดการผู้ดูแลระบบแล้ว');
    switchTab('apply');
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'ออกจากระบบเจ้าหน้าที่เรียบร้อยแล้ว',
        showConfirmButton: false,
        timer: 2000
    });
}

function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const start = (e) => {
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const move = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const end = () => {
        if (!drawing) return;
        drawing = false;
        currentSignatureDataUrl = canvas.toDataURL('image/png');
        updateLiveTwinAndProgress();
    };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
}

function clearSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentSignatureDataUrl = null;
    updateLiveTwinAndProgress();
}

function populateFormSelects() {
    const birthDaySelect = document.getElementById('birthDay');
    if (birthDaySelect) {
        birthDaySelect.innerHTML = '';
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `วันที่ ${i}`;
            birthDaySelect.appendChild(opt);
        }
    }

    const dept1 = document.getElementById('deptChoice1');
    const dept2 = document.getElementById('deptChoice2');
    const adminDept = document.getElementById('adminFilterDept');

    DEPARTMENTS.forEach(d => {
        if (dept1) {
            const o1 = document.createElement('option');
            o1.value = d.name;
            o1.textContent = `แผนกวิชา${d.name}`;
            dept1.appendChild(o1);
        }
        if (dept2) {
            const o2 = document.createElement('option');
            o2.value = d.name;
            o2.textContent = `แผนกวิชา${d.name}`;
            dept2.appendChild(o2);
        }
        if (adminDept) {
            const o3 = document.createElement('option');
            o3.value = d.name;
            o3.textContent = d.name;
            adminDept.appendChild(o3);
        }
    });
}

function updateAdminBadge() {
    const list = getApplicants();
    const pendingCount = list.filter(a => a.status === 'รอตรวจสอบ' || a.status === 'เอกสารไม่ครบ').length;
    const badge = document.getElementById('admin-badge');
    if (badge) badge.textContent = pendingCount;
}

// =========================================================================
// THEME TOGGLE, COMMAND PALETTE & AI ADVISOR
// =========================================================================
function toggleThemeMode() {
    const html = document.documentElement;
    if (html.classList.contains('light')) {
        html.classList.remove('light');
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
        html.classList.add('light');
    }

    // Re-render charts so Chart.js labels and grid lines match the active theme
    const dashView = document.getElementById('view-dashboard');
    if (dashView && !dashView.classList.contains('hidden')) {
        renderDashboard();
    }
    const adminView = document.getElementById('view-admin');
    if (adminView && !adminView.classList.contains('hidden')) {
        renderAdminTable();
    }
}

function toggleLiveTwinPanel() {
    const twinCol = document.getElementById('liveTwinColumn');
    const formCol = document.getElementById('formColumnContainer');
    isLiveTwinVisible = !isLiveTwinVisible;

    if (isLiveTwinVisible) {
        twinCol.classList.remove('hidden');
        formCol.className = 'xl:col-span-7 space-y-6';
    } else {
        twinCol.classList.add('hidden');
        formCol.className = 'xl:col-span-12 space-y-6';
    }
}

function openAiAdvisorModal() {
    document.getElementById('aiAdvisorModal').classList.remove('hidden');
}

function closeAiAdvisorModal() {
    document.getElementById('aiAdvisorModal').classList.add('hidden');
}

function applyAiRecommendation(dept1, dept2, reason) {
    document.getElementById('deptChoice1').value = dept1;
    if (document.querySelector('input[name="applyLevel"]:checked')?.value === 'ปวช.') {
        document.getElementById('deptChoice2').value = dept2;
    }
    closeAiAdvisorModal();
    updateLiveTwinAndProgress();

    Swal.fire({
        icon: 'success',
        title: `AI เลือกแผนก "${dept1}" ให้คุณแล้ว`,
        text: reason,
        confirmButtonColor: '#06b6d4',
        timer: 2800
    });
}

function openCommandPalette() {
    document.getElementById('commandPaletteModal').classList.remove('hidden');
    const input = document.getElementById('cmdSearchInput');
    input.value = '';
    input.focus();
    renderCommandPaletteResults();
}

function closeCommandPalette() {
    document.getElementById('commandPaletteModal').classList.add('hidden');
}

function renderCommandPaletteResults() {
    const q = (document.getElementById('cmdSearchInput')?.value || '').trim().toLowerCase();
    const list = getApplicants();
    const matched = list.filter(a =>
        !q ||
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.citizenId.includes(q) ||
        a.deptChoice1.toLowerCase().includes(q)
    ).slice(0, 5);

    const container = document.getElementById('cmdResultsList');
    container.innerHTML = `
        <div class="px-2 py-1 text-[10px] font-mono uppercase text-cyan-400">คำสั่งด่วน (Quick Actions)</div>
        <button onclick="closeCommandPalette(); switchTab('apply'); triggerSmartOcrScan();" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 flex items-center justify-between">
            <span>⚡ จำลองสแกนบัตรประชาชนกรอกฟอร์มอัตโนมัติ (AI Smart OCR)</span>
            <span class="text-[10px] font-mono text-cyan-400">Action</span>
        </button>
        <button onclick="closeCommandPalette(); switchTab('dashboard');" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 flex items-center justify-between">
            <span>📊 เปิดแดชบอร์ดสถิติแยกแผนกวิชา (Analytics Center)</span>
            <span class="text-[10px] font-mono text-emerald-400">View</span>
        </button>
        <button onclick="closeCommandPalette(); exportToCSV();" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 flex items-center justify-between">
            <span>📥 ดาวน์โหลดไฟล์รายชื่อผู้สมัครมาตรฐาน ศธ.02 (CSV)</span>
            <span class="text-[10px] font-mono text-amber-400">Export</span>
        </button>
        <div class="px-2 pt-2 pb-1 text-[10px] font-mono uppercase text-cyan-400">รายชื่อผู้สมัครในระบบ (${matched.length})</div>
        ${matched.map(a => `
            <button onclick="closeCommandPalette(); openPdfPreviewModal('${a.id}', 'application');" class="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 flex items-center justify-between">
                <span><strong>${a.id}</strong> — ${a.prefix}${a.firstName} ${a.lastName} (${a.deptChoice1})</span>
                <span class="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded">เปิด PDF</span>
            </button>
        `).join('')}
    `;
}

// =========================================================================
// NAVIGATION & TAB SWITCHING
// =========================================================================
function switchTab(tabName) {
    // ตรวจสอบสิทธิ์การเข้าถึงส่วนสำหรับเจ้าหน้าที่ (Back-End)
    if (tabName === 'admin' && !isStaffAuthenticated()) {
        openStaffLoginModal('admin');
        return;
    }

    document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-pill').forEach(btn => btn.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.remove('hidden');

    const targetBtn = document.getElementById(`nav-${tabName}`);
    if (targetBtn) targetBtn.classList.add('active');

    if (tabName === 'status') {
        searchApplicantStatus();
    } else if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'admin') {
        renderAdminTable();
    }

    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

// =========================================================================
// REAL-TIME DIGITAL TWIN PAPER SYNC & FORM COMPLETION PROGRESS
// =========================================================================
function getDraftApplicantFromForm() {
    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const now = new Date();

    return {
        id: 'Q70-LIVE',
        studentCode: '',
        citizenId: document.getElementById('citizenId')?.value || '',
        prefix: document.getElementById('prefix')?.value || 'นาย',
        firstName: document.getElementById('firstName')?.value || '',
        lastName: document.getElementById('lastName')?.value || '',
        birthDay: document.getElementById('birthDay')?.value || '1',
        birthMonth: document.getElementById('birthMonth')?.value || 'มกราคม',
        birthYear: document.getElementById('birthYear')?.value || '2554',
        fatherName: document.getElementById('fatherName')?.value || '',
        fatherAge: document.getElementById('fatherAge')?.value || '',
        fatherJob: document.getElementById('fatherJob')?.value || '',
        motherName: document.getElementById('motherName')?.value || '',
        motherAge: document.getElementById('motherAge')?.value || '',
        motherJob: document.getElementById('motherJob')?.value || '',
        addrNo: document.getElementById('addrNo')?.value || '',
        addrMoo: document.getElementById('addrMoo')?.value || '',
        addrSoi: document.getElementById('addrSoi')?.value || '',
        addrRoad: document.getElementById('addrRoad')?.value || '',
        addrSubdistrict: document.getElementById('addrSubdistrict')?.value || '',
        addrDistrict: document.getElementById('addrDistrict')?.value || '',
        addrProvince: document.getElementById('addrProvince')?.value || '',
        addrZip: document.getElementById('addrZip')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        currentGrade: document.getElementById('currentGrade')?.value || 'ม.3',
        schoolName: document.getElementById('schoolName')?.value || '',
        schoolNo: document.getElementById('schoolNo')?.value || '',
        schoolSubdistrict: document.getElementById('schoolSubdistrict')?.value || '',
        schoolDistrict: document.getElementById('schoolDistrict')?.value || '',
        schoolProvince: document.getElementById('schoolProvince')?.value || '',
        gpax: document.getElementById('gpax')?.value || '',
        oldMajor: document.getElementById('oldMajor')?.value || '',
        applyLevel: document.querySelector('input[name="applyLevel"]:checked')?.value || 'ปวช.',
        deptChoice1: document.getElementById('deptChoice1')?.value || '',
        deptChoice2: document.getElementById('deptChoice2')?.value || '',
        applyDay: String(now.getDate()),
        applyMonth: thaiMonths[now.getMonth()],
        applyYear: String(now.getFullYear() + 543),
        files: currentUploadedFiles,
        signature: currentSignatureDataUrl
    };
}

function updateLiveTwinAndProgress() {
    const draft = getDraftApplicantFromForm();
    const liveContainer = document.getElementById('live-twin-paper');
    if (liveContainer) {
        liveContainer.innerHTML = buildOfficialQuotaFormHtml(draft);
    }

    // Calculate completion percentage
    const requiredFields = [
        draft.deptChoice1,
        draft.citizenId.length === 13 ? 'ok' : '',
        draft.firstName,
        draft.lastName,
        draft.fatherName,
        draft.motherName,
        draft.addrNo,
        draft.addrSubdistrict,
        draft.addrDistrict,
        draft.addrProvince,
        draft.addrZip.length === 5 ? 'ok' : '',
        draft.phone.length === 10 ? 'ok' : '',
        draft.schoolName,
        draft.schoolDistrict,
        draft.schoolProvince,
        draft.gpax
    ];
    const filledCount = requiredFields.filter(v => String(v).trim().length > 0).length;
    const pct = Math.max(10, Math.round((filledCount / requiredFields.length) * 100));

    const bar = document.getElementById('formProgressBar');
    const txt = document.getElementById('formProgressText');
    if (bar && txt) {
        bar.style.width = `${pct}%`;
        txt.textContent = pct === 100 ? '100% ข้อมูลครบถ้วน พร้อมบันทึก!' : `${pct}% กำลังกรอกข้อมูล`;
    }
}

function previewCurrentDraftInFullModal() {
    const draft = getDraftApplicantFromForm();
    activeApplicantIdForPdf = 'DRAFT';
    currentPdfMode = 'application';
    updateDocTypeButtons();
    document.getElementById('a4-paper-content').innerHTML = buildOfficialQuotaFormHtml(draft);
    document.getElementById('pdfModal').classList.remove('hidden');
    lucide.createIcons();
}

// =========================================================================
// FORM VALIDATION & AI SMART ID CARD OCR SIMULATION
// =========================================================================
function handleLevelChange() {
    const selected = document.querySelector('input[name="applyLevel"]:checked')?.value || 'ปวช.';
    const dept2Container = document.getElementById('dept2-container');
    const labelDept1 = document.getElementById('label-dept-1');
    const currentGradeSelect = document.getElementById('currentGrade');

    if (selected === 'ปวช.') {
        dept2Container.classList.remove('opacity-40', 'pointer-events-none');
        labelDept1.innerHTML = 'สาขาวิชาลำดับที่ 1 (ระดับ ปวช.) <span class="text-rose-400">*</span>';
        currentGradeSelect.value = 'ม.3';
    } else {
        dept2Container.classList.add('opacity-40', 'pointer-events-none');
        document.getElementById('deptChoice2').value = '';
        labelDept1.innerHTML = `สาขาวิชาที่ต้องการสมัคร (${selected}) <span class="text-rose-400">*</span>`;
        currentGradeSelect.value = selected.includes('สายตรง') ? 'ปวช.3' : 'ม.6';
    }
}

function validateCitizenIdInput(input) {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 13);
    const len = input.value.length;
    const statusEl = document.getElementById('cid-status');
    const errEl = document.getElementById('cid-error');

    statusEl.textContent = `${len}/13`;
    if (len === 13) {
        statusEl.className = 'absolute right-3 top-2.5 text-xs font-mono font-bold text-emerald-400';
        errEl.classList.add('hidden');
    } else {
        statusEl.className = 'absolute right-3 top-2.5 text-xs font-mono text-amber-400';
    }
}

function validatePhoneInput(input) {
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
}

function handleFileUpload(input, fileKey) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
        Swal.fire({
            icon: 'warning',
            title: 'ขนาดไฟล์ใหญ่เกินกำหนด',
            text: 'กรุณาเลือกไฟล์ขนาดไม่เกิน 2.5 MB',
            confirmButtonColor: '#06b6d4'
        });
        input.value = '';
        return;
    }

    const statusSpan = document.getElementById(`status-${fileKey}`);
    if (statusSpan) {
        statusSpan.textContent = `✓ ${file.name.slice(0, 18)}`;
        statusSpan.classList.remove('hidden');
    }

    if (fileKey === 'photo' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
            currentUploadedFiles.photo = e.target.result;
            const previewBox = document.getElementById('preview-photo-box');
            previewBox.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover" alt="รูปถ่ายผู้สมัคร">`;
            updateLiveTwinAndProgress();
        };
        reader.readAsDataURL(file);
    } else {
        currentUploadedFiles[fileKey] = file.name;
        updateLiveTwinAndProgress();
    }
}

function resetUploads() {
    currentUploadedFiles = { photo: null, transcript: null, idcard: null, cert: null };
    ['photo', 'transcript', 'idcard', 'cert'].forEach(k => {
        const el = document.getElementById(`status-${k}`);
        if (el) el.classList.add('hidden');
    });
    document.getElementById('preview-photo-box').innerHTML = `<i data-lucide="camera" class="w-6 h-6 text-cyan-400"></i>`;
    lucide.createIcons();
}

// จำลองการสแกนบัตรประชาชนด้วย AI OCR แล้วเติมลงในฟอร์มพร้อมอัปเดตกระดาษ A4 สดทันที
function triggerSmartOcrScan() {
    Swal.fire({
        title: 'กำลังสแกนบัตรประชาชนด้วย AI OCR...',
        html: '<div class="text-xs text-slate-500">ระบบกำลังอ่านข้อมูลเลขบัตร 13 หลัก ชื่อ-สกุล วันเกิด และที่อยู่ตามทะเบียนบ้านอัตโนมัติ</div>',
        timer: 950,
        timerProgressBar: true,
        didOpen: () => Swal.showLoading()
    }).then(() => {
        document.querySelector('input[name="applyLevel"][value="ปวช."]').checked = true;
        handleLevelChange();

        document.getElementById('deptChoice1').value = 'ช่างไฟฟ้ากำลัง';
        document.getElementById('deptChoice2').value = 'เมคคาทรอนิกส์และหุ่นยนต์';
        document.getElementById('citizenId').value = '1199900765432';
        validateCitizenIdInput(document.getElementById('citizenId'));
        document.getElementById('prefix').value = 'นาย';
        document.getElementById('firstName').value = 'ภูริภัทร';
        document.getElementById('lastName').value = 'รัตนมงคล';
        document.getElementById('birthDay').value = '18';
        document.getElementById('birthMonth').value = 'กรกฎาคม';
        document.getElementById('birthYear').value = '2554';

        document.getElementById('fatherName').value = 'นายเกรียงไกร รัตนมงคล';
        document.getElementById('fatherAge').value = '45';
        document.getElementById('fatherJob').value = 'ช่างเทคนิค';
        document.getElementById('motherName').value = 'นางสุภาพร รัตนมงคล';
        document.getElementById('motherAge').value = '42';
        document.getElementById('motherJob').value = 'ค้าขาย';

        document.getElementById('addrNo').value = '128/9';
        document.getElementById('addrMoo').value = '3';
        document.getElementById('addrSoi').value = 'ร่วมใจ';
        document.getElementById('addrRoad').value = 'พหลโยธิน';
        document.getElementById('addrSubdistrict').value = 'ท่าหลวง';
        document.getElementById('addrDistrict').value = 'ท่าเรือ';
        document.getElementById('addrProvince').value = 'พระนครศรีอยุธยา';
        document.getElementById('addrZip').value = '13130';
        document.getElementById('phone').value = '0898765432';

        document.getElementById('currentGrade').value = 'ม.3';
        document.getElementById('schoolName').value = 'ท่าเรือ "นิตยานุกูล"';
        document.getElementById('schoolNo').value = '112';
        document.getElementById('schoolSubdistrict').value = 'ท่าเรือ';
        document.getElementById('schoolDistrict').value = 'ท่าเรือ';
        document.getElementById('schoolProvince').value = 'พระนครศรีอยุธยา';
        document.getElementById('gpax').value = '3.58';
        document.getElementById('oldMajor').value = 'วิทย์-คณิต';

        updateLiveTwinAndProgress();

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'AI OCR ดึงข้อมูลลงฟอร์มและเขียนใบสมัคร A4 สดเรียบร้อย!',
            showConfirmButton: false,
            timer: 3000
        });
    });
}

// =========================================================================
// SUBMIT APPLICATION & LAUNCH CONFETTI + OFFICIAL PDF
// =========================================================================
function handleApplicationSubmit(event) {
    event.preventDefault();

    const citizenId = document.getElementById('citizenId').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (citizenId.length !== 13) {
        document.getElementById('cid-error').classList.remove('hidden');
        Swal.fire({ icon: 'error', title: 'เลขบัตรประชาชนไม่ถูกต้อง', text: 'กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก' });
        return;
    }

    if (phone.length !== 10) {
        Swal.fire({ icon: 'error', title: 'เบอร์โทรศัพท์ไม่ครบ 10 หลัก', text: 'กรุณาตรวจสอบหมายเลขโทรศัพท์ให้ถูกต้อง' });
        return;
    }

    const list = getApplicants();
    const nextNumber = list.length + 1;
    const newId = `Q70-${String(nextNumber).padStart(4, '0')}`;

    const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const now = new Date();
    const applyDay = String(now.getDate());
    const applyMonth = thaiMonths[now.getMonth()];
    const applyYear = String(now.getFullYear() + 543);

    const newApplicant = {
        id: newId,
        academicYear: '2570',
        studentCode: '',
        citizenId,
        prefix: document.getElementById('prefix').value,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        birthDay: document.getElementById('birthDay').value,
        birthMonth: document.getElementById('birthMonth').value,
        birthYear: document.getElementById('birthYear').value.trim(),
        fatherName: document.getElementById('fatherName').value.trim(),
        fatherAge: document.getElementById('fatherAge').value.trim() || '-',
        fatherJob: document.getElementById('fatherJob').value.trim() || '-',
        motherName: document.getElementById('motherName').value.trim(),
        motherAge: document.getElementById('motherAge').value.trim() || '-',
        motherJob: document.getElementById('motherJob').value.trim() || '-',
        addrNo: document.getElementById('addrNo').value.trim(),
        addrMoo: document.getElementById('addrMoo').value.trim() || '-',
        addrSoi: document.getElementById('addrSoi').value.trim() || '-',
        addrRoad: document.getElementById('addrRoad').value.trim() || '-',
        addrSubdistrict: document.getElementById('addrSubdistrict').value.trim(),
        addrDistrict: document.getElementById('addrDistrict').value.trim(),
        addrProvince: document.getElementById('addrProvince').value.trim(),
        addrZip: document.getElementById('addrZip').value.trim(),
        phone,
        currentGrade: document.getElementById('currentGrade').value,
        schoolName: document.getElementById('schoolName').value.trim(),
        schoolNo: document.getElementById('schoolNo').value.trim() || '-',
        schoolSubdistrict: document.getElementById('schoolSubdistrict').value.trim() || '-',
        schoolDistrict: document.getElementById('schoolDistrict').value.trim(),
        schoolProvince: document.getElementById('schoolProvince').value.trim(),
        gpax: parseFloat(document.getElementById('gpax').value).toFixed(2),
        oldMajor: document.getElementById('oldMajor').value.trim() || '-',
        applyLevel: document.querySelector('input[name="applyLevel"]:checked').value,
        deptChoice1: document.getElementById('deptChoice1').value,
        deptChoice2: document.getElementById('deptChoice2').value || '-',
        referralChannel: document.getElementById('referralChannel').value,
        status: 'รอตรวจสอบ',
        appliedDate: `${applyDay} ${applyMonth} ${applyYear}`,
        applyDay,
        applyMonth,
        applyYear,
        files: {
            photo: currentUploadedFiles.photo,
            transcript: currentUploadedFiles.transcript || 'แนบไฟล์รบ.1แล้ว.pdf',
            idcard: currentUploadedFiles.idcard || 'แนบสำเนาบัตรแล้ว.pdf',
            cert: currentUploadedFiles.cert || null
        },
        signature: currentSignatureDataUrl,
        enrollment: null
    };

    list.unshift(newApplicant);
    saveApplicants(list);

    addNotificationLog(`🔔 มีผู้สมัครใหม่ [${newApplicant.id}] ${newApplicant.prefix}${newApplicant.firstName} ${newApplicant.lastName} สมัคร ${newApplicant.applyLevel} สาขา${newApplicant.deptChoice1}`);

    if (typeof confetti === 'function') {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }

    document.getElementById('applicationForm').reset();
    resetUploads();
    clearSignaturePad();
    updateLiveTwinAndProgress();

    openSuccessTicketModal(newApplicant);
}

function openSuccessTicketModal(app) {
    document.getElementById('ticketAppId').textContent = app.id;
    document.getElementById('ticketAppName').textContent = `${app.prefix}${app.firstName} ${app.lastName} (${app.deptChoice1})`;

    const btnPdf = document.getElementById('ticketBtnDownloadPdf');
    btnPdf.onclick = () => {
        closeSuccessTicketModal();
        openPdfPreviewModal(app.id, 'application');
    };

    const btnPrint = document.getElementById('ticketBtnPrint');
    btnPrint.onclick = () => {
        closeSuccessTicketModal();
        openPdfPreviewModal(app.id, 'application');
        setTimeout(() => window.print(), 350);
    };

    document.getElementById('successTicketModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeSuccessTicketModal() {
    document.getElementById('successTicketModal').classList.add('hidden');
}

function openReuploadModal(applicantId) {
    document.getElementById('reuploadAppId').value = applicantId;
    document.getElementById('reuploadFileInput').value = '';
    document.getElementById('reuploadDocModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeReuploadModal() {
    document.getElementById('reuploadDocModal').classList.add('hidden');
}

function submitReuploadDocument() {
    const appId = document.getElementById('reuploadAppId').value;
    const docType = document.getElementById('reuploadDocType').value;
    const fileInput = document.getElementById('reuploadFileInput');
    const file = fileInput.files[0];

    if (!file) {
        Swal.fire({ icon: 'warning', title: 'กรุณาเลือกไฟล์เอกสาร', text: 'โปรดเลือกไฟล์ที่ต้องการอัปโหลดแก้ไข' });
        return;
    }

    const list = getApplicants();
    const idx = list.findIndex(a => a.id === appId);
    if (idx !== -1) {
        if (!list[idx].files) list[idx].files = {};
        list[idx].files[docType] = file.name;
        list[idx].status = 'รอตรวจสอบ';
        list[idx].statusRemark = 'ผู้สมัครอัปโหลดเอกสารแก้ไขเพิ่มเติมแล้ว (' + file.name + ')';
        saveApplicants(list);
        addNotificationLog(`📎 ผู้สมัคร [${appId}] อัปโหลดไฟล์แก้ไขเพิ่มเติม: ${file.name}`);
    }

    closeReuploadModal();
    searchApplicantStatus();
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'ส่งเอกสารแก้ไขเรียบร้อย สถานะเปลี่ยนเป็น "รอตรวจสอบ"',
        showConfirmButton: false,
        timer: 2500
    });
}

// =========================================================================
// OFFICIAL THAI A4 PDF GENERATOR (EXACT REPLICA OF UPLOADED FORM)
// =========================================================================
function buildOfficialQuotaFormHtml(app) {
    const isPwsDirect = app.applyLevel === 'ปวส. (สายตรง)';
    const isPwsOther = app.applyLevel === 'ปวส. (ม.6/ปวช. ต่างสาขา)';
    const isPwc = app.applyLevel === 'ปวช.';

    const pwsMajorText = (isPwsDirect || isPwsOther) ? app.deptChoice1 : '';
    const pwcMajor1Text = isPwc ? app.deptChoice1 : '';
    const pwcMajor2Text = (isPwc && app.deptChoice2 && app.deptChoice2 !== '-') ? app.deptChoice2 : '';

    const photoHtml = app.files?.photo
        ? `<img src="${app.files.photo}" style="width:100%;height:100%;object-fit:cover;" alt="รูปถ่าย 1 นิ้ว">`
        : `<div class="text-center leading-snug">รูปถ่าย<br>ขนาด ๑ นิ้ว</div>`;

    const signatureDisplay = app.signature
        ? `<img src="${app.signature}" style="height:26px;object-fit:contain;display:inline-block;vertical-align:bottom;" alt="ลายเซ็น">`
        : `${app.firstName || ''} ${app.lastName || ''}`;

    const fullNameText = (app.firstName || app.lastName)
        ? `${app.prefix}${app.firstName}  ${app.lastName}`
        : '';

    return `
        <!-- แถบข้อมูลอ้างอิงดิจิทัลมุมบน -->
        <div class="flex justify-between items-center text-[11px] text-slate-600 mb-1">
            <span>เลขที่ใบสมัคร: <strong>${app.id || 'Q70-XXXX'}</strong> ${app.studentCode ? `| รหัสนักศึกษา: <strong>${app.studentCode}</strong>` : ''}</span>
            <div class="flex items-center gap-2">
                <span>เลขประจำตัวประชาชน: <strong>${toThaiDigits(app.citizenId || '.............')}</strong></span>
                ${generateMiniQrSvg(app.id || app.citizenId)}
            </div>
        </div>

        <!-- ส่วนหัวกระดาษ: โลโก้วิทยาลัย + ชื่อแบบฟอร์ม + กรอบรูปถ่าย ๑ นิ้ว -->
        <div class="relative flex items-start justify-between pt-1 pb-2">
            <div class="w-24 flex-shrink-0 flex justify-start">
                <img src="logo.png" alt="ตราวิทยาลัย" class="w-20 h-20 object-contain">
            </div>

            <div class="text-center flex-grow px-2 pt-3">
                <h1 class="text-[18px] font-bold tracking-tight text-black leading-relaxed">
                    ใบสมัครเข้ารับคัดเลือกเพื่อศึกษาต่อเป็นกรณีพิเศษ (โควตา)
                </h1>
                <h2 class="text-[17.5px] font-bold tracking-tight text-black leading-relaxed">
                    วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐
                </h2>
            </div>

            <div class="w-[28mm] h-[34mm] border border-black flex items-center justify-center text-[13px] flex-shrink-0 overflow-hidden bg-white">
                ${photoHtml}
            </div>
        </div>

        <!-- ตัวเลือก Checkbox ระดับชั้น 3 ตัวเลือกตรงกลาง -->
        <div class="flex justify-center my-2">
            <div class="space-y-1.5 text-[15px] font-semibold">
                <div class="flex items-center">
                    <span class="checkbox-box">${isPwsDirect ? '✓' : ''}</span>
                    <span>ระดับ ปวส. ( สายตรง )</span>
                </div>
                <div class="flex items-center">
                    <span class="checkbox-box">${isPwsOther ? '✓' : ''}</span>
                    <span>ระดับ ปวส. ( ม.๖/ปวช. ต่างสาขา )</span>
                </div>
                <div class="flex items-center">
                    <span class="checkbox-box">${isPwc ? '✓' : ''}</span>
                    <span>ระดับ ปวช.</span>
                </div>
            </div>
        </div>

        <!-- รายละเอียดข้อ ๑ ถึง ข้อ ๖ ตามแบบฟอร์มใบสมัครจริง -->
        <div class="mt-3 space-y-2.5 text-[15px] leading-[1.82]">
            <!-- ข้อ ๑ -->
            <div class="flex flex-wrap items-baseline">
                <span class="font-semibold mr-1">๑. ชื่อ-นามสกุล</span>
                <span class="dotted-line flex-grow min-w-[190px]">${fullNameText}</span>
                <span class="ml-1">เกิดวันที่</span>
                <span class="dotted-line w-[55px]">${toThaiDigits(app.birthDay)}</span>
                <span class="ml-1">เดือน</span>
                <span class="dotted-line w-[115px]">${app.birthMonth}</span>
                <span class="ml-1">พ.ศ.</span>
                <span class="dotted-line w-[75px]">${toThaiDigits(app.birthYear)}</span>
            </div>

            <!-- ข้อ ๒ -->
            <div class="flex flex-wrap items-baseline">
                <span class="font-semibold mr-1">๒. ชื่อ-สกุลบิดา</span>
                <span class="dotted-line flex-grow min-w-[210px]">${app.fatherName}</span>
                <span class="ml-1">อายุ</span>
                <span class="dotted-line w-[60px]">${toThaiDigits(app.fatherAge)}</span>
                <span class="ml-1">ปี อาชีพ</span>
                <span class="dotted-line w-[180px]">${app.fatherJob}</span>
            </div>

            <!-- ข้อ ๓ -->
            <div class="flex flex-wrap items-baseline">
                <span class="font-semibold mr-1">๓. ชื่อ-สกุลมารดา</span>
                <span class="dotted-line flex-grow min-w-[200px]">${app.motherName}</span>
                <span class="ml-1">อายุ</span>
                <span class="dotted-line w-[60px]">${toThaiDigits(app.motherAge)}</span>
                <span class="ml-1">ปี อาชีพ</span>
                <span class="dotted-line w-[180px]">${app.motherJob}</span>
            </div>

            <!-- ข้อ ๔ (บรรทัด 1) -->
            <div class="flex flex-wrap items-baseline">
                <span class="font-semibold mr-1">๔. ที่อยู่ปัจจุบันที่สามารถติดต่อได้ บ้านเลขที่</span>
                <span class="dotted-line w-[75px]">${toThaiDigits(app.addrNo)}</span>
                <span class="ml-1">หมู่</span>
                <span class="dotted-line w-[50px]">${toThaiDigits(app.addrMoo)}</span>
                <span class="ml-1">ซอย</span>
                <span class="dotted-line w-[115px]">${toThaiDigits(app.addrSoi)}</span>
                <span class="ml-1">ถนน</span>
                <span class="dotted-line flex-grow min-w-[100px]">${app.addrRoad}</span>
            </div>

            <!-- ข้อ ๔ (บรรทัด 2) -->
            <div class="flex flex-wrap items-baseline pl-5">
                <span>ตำบล</span>
                <span class="dotted-line w-[155px]">${app.addrSubdistrict}</span>
                <span class="ml-1">อำเภอ</span>
                <span class="dotted-line w-[155px]">${app.addrDistrict}</span>
                <span class="ml-1">จังหวัด</span>
                <span class="dotted-line flex-grow min-w-[140px]">${app.addrProvince}</span>
            </div>

            <!-- ข้อ ๔ (บรรทัด 3) -->
            <div class="flex flex-wrap items-baseline pl-5">
                <span>รหัสไปรษณีย์</span>
                <span class="dotted-line w-[120px]">${toThaiDigits(app.addrZip)}</span>
                <span class="ml-1">หมายเลขโทรศัพท์</span>
                <span class="dotted-line w-[240px]">${toThaiDigits(app.phone)}</span>
            </div>

            <!-- ข้อ ๕ (บรรทัด 1) -->
            <div class="flex flex-wrap items-baseline">
                <span class="font-semibold mr-1">๕. กำลังศึกษาอยู่ในระดับชั้น</span>
                <span class="dotted-line w-[125px]">${toThaiDigits(app.currentGrade)}</span>
                <span class="ml-1">โรงเรียน</span>
                <span class="dotted-line flex-grow min-w-[220px]">${app.schoolName}</span>
            </div>

            <!-- ข้อ ๕ (บรรทัด 2) -->
            <div class="flex flex-wrap items-baseline pl-5">
                <span>ตั้งอยู่เลขที่</span>
                <span class="dotted-line w-[80px]">${toThaiDigits(app.schoolNo)}</span>
                <span class="ml-1">ตำบล</span>
                <span class="dotted-line w-[130px]">${app.schoolSubdistrict}</span>
                <span class="ml-1">อำเภอ</span>
                <span class="dotted-line w-[130px]">${app.schoolDistrict}</span>
                <span class="ml-1">จังหวัด</span>
                <span class="dotted-line flex-grow min-w-[110px]">${app.schoolProvince}</span>
            </div>

            <!-- ข้อ ๕ (บรรทัด 3) -->
            <div class="flex flex-wrap items-baseline pl-5">
                <span>ผลการเรียนเฉลี่ยสะสม</span>
                <span class="dotted-line w-[135px]">${toThaiDigits(app.gpax)}</span>
                <span class="ml-1">สาขาวิชา</span>
                <span class="dotted-line flex-grow min-w-[200px]">${app.oldMajor}</span>
            </div>

            <!-- ข้อ ๖ -->
            <div class="flex flex-wrap items-baseline pt-1">
                <span class="font-semibold mr-1">๖. ต้องการสมัครเข้าเรียน ระดับ ปวส. สาขาวิชา</span>
                <span class="dotted-line flex-grow min-w-[260px]">${pwsMajorText}</span>
            </div>
            <div class="flex flex-wrap items-baseline pl-[138px]">
                <span class="font-semibold mr-1">ระดับ ปวช. สาขาวิชาลำดับที่ ๑.</span>
                <span class="dotted-line flex-grow min-w-[240px]">${pwcMajor1Text}</span>
            </div>
            <div class="flex flex-wrap items-baseline pl-[214px]">
                <span class="font-semibold mr-1">สาขาวิชาลำดับที่ ๒.</span>
                <span class="dotted-line flex-grow min-w-[240px]">${pwcMajor2Text}</span>
            </div>
        </div>

        <!-- หลักฐานประกอบการสมัคร -->
        <div class="mt-5 pl-4 text-[14.5px] leading-[1.8]">
            <div class="flex items-start">
                <span class="font-bold w-[160px] flex-shrink-0">หลักฐานประกอบการสมัคร</span>
                <div class="space-y-1">
                    <div>๑. เอกสารแสดงผลการเรียนเฉลี่ยสะสม ๕ ภาคเรียน จำนวน ๑ ฉบับ</div>
                    <div>๒. สำเนาบัตรประชาชน / สำเนาทะเบียนบ้าน จำนวน ๑ ฉบับ</div>
                    <div>๓. สำเนาเกียรติบัตร/ใบรับรองความสามารถพิเศษ/ใบประกาศ (ถ้ามี)</div>
                </div>
            </div>
        </div>

        <!-- ส่วนลงชื่อผู้สมัคร มุมขวาล่าง -->
        <div class="mt-9 flex justify-end pr-6 text-[15px]">
            <div class="text-center space-y-2 w-[290px]">
                <div class="flex items-baseline justify-center">
                    <span>ลงชื่อ</span>
                    <span class="dotted-line w-[195px]">${signatureDisplay}</span>
                    <span>ผู้สมัคร</span>
                </div>
                <div class="flex items-baseline justify-center">
                    <span>(</span>
                    <span class="dotted-line w-[220px]">${fullNameText}</span>
                    <span>)</span>
                </div>
                <div class="flex items-baseline justify-center pt-1">
                    <span>วันที่</span>
                    <span class="dotted-line w-[45px]">${toThaiDigits(app.applyDay)}</span>
                    <span>เดือน</span>
                    <span class="dotted-line w-[105px]">${app.applyMonth}</span>
                    <span>พ.ศ.</span>
                    <span class="dotted-line w-[60px]">${toThaiDigits(app.applyYear)}</span>
                </div>
            </div>
        </div>
    `;
}

function openPdfPreviewModal(applicantId, mode = 'application') {
    const list = getApplicants();
    const app = list.find(a => a.id === applicantId);
    if (!app) return;

    activeApplicantIdForPdf = applicantId;
    currentPdfMode = mode;

    updateDocTypeButtons();
    renderA4Document(app, mode);

    document.getElementById('pdfModal').classList.remove('hidden');
    lucide.createIcons();
}

function closePdfModal() {
    document.getElementById('pdfModal').classList.add('hidden');
}

function switchDocumentMode(mode) {
    currentPdfMode = mode;
    updateDocTypeButtons();
    const app = activeApplicantIdForPdf === 'DRAFT'
        ? getDraftApplicantFromForm()
        : getApplicants().find(a => a.id === activeApplicantIdForPdf);
    if (app) renderA4Document(app, mode);
}

function updateDocTypeButtons() {
    const btnApp = document.getElementById('btnDocTypeApp');
    const btnEnroll = document.getElementById('btnDocTypeEnroll');
    if (currentPdfMode === 'application') {
        btnApp.className = 'px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold transition';
        btnEnroll.className = 'px-3 py-1.5 rounded-lg text-slate-300 hover:text-white font-medium transition';
    } else {
        btnEnroll.className = 'px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold transition';
        btnApp.className = 'px-3 py-1.5 rounded-lg text-slate-300 hover:text-white font-medium transition';
    }
}

function renderA4Document(app, mode) {
    const container = document.getElementById('a4-paper-content');
    if (mode === 'application') {
        container.innerHTML = buildOfficialQuotaFormHtml(app);
    } else {
        const photoHtml = app.files?.photo
            ? `<img src="${app.files.photo}" style="width:100%;height:100%;object-fit:cover;" alt="รูปถ่าย 1 นิ้ว">`
            : `<div class="text-center leading-snug">รูปถ่าย<br>ขนาด ๑ นิ้ว</div>`;

        const enroll = app.enrollment || {
            guardianName: app.fatherName || app.motherName,
            guardianRelation: 'บิดา/มารดา',
            guardianPhone: app.phone,
            witnessName: 'เจ้าหน้าที่งานทะเบียน',
            enrolledDate: app.appliedDate || '7 พฤศจิกายน 2569'
        };

        container.innerHTML = `
            <div class="flex justify-between items-center text-xs text-slate-600 mb-2 border-b pb-2">
                <span>เลขที่ใบสมัคร: <strong>${app.id}</strong></span>
                <span>สถานะ: <strong>${app.status || 'ร่างเอกสาร'}</strong></span>
                <span>รหัสนักศึกษา: <strong>${app.studentCode || 'รอออกรหัสเมื่อมอบตัว'}</strong></span>
            </div>

            <div class="relative flex items-start justify-between pt-2 pb-4">
                <div class="w-24 flex-shrink-0">
                    <img src="logo.png" alt="ตราวิทยาลัย" class="w-20 h-20 object-contain">
                </div>
                <div class="text-center flex-grow px-2 pt-2">
                    <h1 class="text-[19px] font-bold text-black">ใบมอบตัวนักศึกษาใหม่ รอบโควตาพิเศษ</h1>
                    <h2 class="text-[17px] font-bold text-black">วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ประจำปีการศึกษา ๒๕๗๐</h2>
                    <p class="text-[14px] mt-1 font-semibold">ระดับการศึกษา: ${app.applyLevel} | แผนกวิชา: ${app.deptChoice1}</p>
                </div>
                <div class="w-[28mm] h-[34mm] border border-black flex items-center justify-center text-[13px] flex-shrink-0 overflow-hidden">
                    ${photoHtml}
                </div>
            </div>

            <div class="space-y-3 text-[15px] leading-[1.9] mt-2">
                <div class="p-3 border border-black rounded-lg">
                    <div class="grid grid-cols-2 gap-2">
                        <div><strong>รหัสนักศึกษาประจำตัว:</strong> ${app.studentCode || '...........................................'}</div>
                        <div><strong>เลขประจำตัวประชาชน:</strong> ${toThaiDigits(app.citizenId)}</div>
                        <div><strong>ชื่อ-นามสกุลผู้มอบตัว:</strong> ${app.prefix}${app.firstName} ${app.lastName}</div>
                        <div><strong>วันเดือนปีเกิด:</strong> ${toThaiDigits(app.birthDay)} ${app.birthMonth} พ.ศ. ${toThaiDigits(app.birthYear)}</div>
                        <div><strong>จบจากสถานศึกษา:</strong> โรงเรียน${app.schoolName}</div>
                        <div><strong>เกรดเฉลี่ยสะสม (GPAX):</strong> ${toThaiDigits(app.gpax)}</div>
                    </div>
                </div>

                <h3 class="font-bold text-[16px] pt-2 underline">คำรับรองของผู้ปกครองและนักศึกษาในการมอบตัว</h3>
                <div class="flex flex-wrap items-baseline">
                    <span>ข้าพเจ้า (ชื่อผู้ปกครอง)</span>
                    <span class="dotted-line w-[240px]">${enroll.guardianName}</span>
                    <span>มีความเกี่ยวข้องเป็น</span>
                    <span class="dotted-line w-[120px]">${enroll.guardianRelation}</span>
                </div>
                <div class="flex flex-wrap items-baseline">
                    <span>เบอร์โทรศัพท์ผู้ปกครอง</span>
                    <span class="dotted-line w-[180px]">${toThaiDigits(enroll.guardianPhone)}</span>
                    <span>ที่อยู่ติดต่อได้ บ้านเลขที่ ${toThaiDigits(app.addrNo)} หมู่ ${toThaiDigits(app.addrMoo)} ต.${app.addrSubdistrict} อ.${app.addrDistrict} จ.${app.addrProvince}</span>
                </div>
                <p class="indent-8 text-justify pt-1">
                    ขอมอบตัว <strong>${app.prefix}${app.firstName} ${app.lastName}</strong> เข้าเป็นนักเรียน/นักศึกษาของวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ ในระดับ <strong>${app.applyLevel}</strong> แผนกวิชา <strong>${app.deptChoice1}</strong> และขอรับรองว่าจะปกครองดูแลให้นักเรียน/นักศึกษาประพฤติตนตามระเบียบข้อบังคับของวิทยาลัยทุกประการ
                </p>

                <div class="grid grid-cols-2 gap-8 pt-12 text-center">
                    <div class="space-y-2">
                        <div>ลงชื่อ <span class="dotted-line w-[170px]">${app.firstName} ${app.lastName}</span> นักศึกษา</div>
                        <div>( ${app.prefix}${app.firstName} ${app.lastName} )</div>
                    </div>
                    <div class="space-y-2">
                        <div>ลงชื่อ <span class="dotted-line w-[170px]">${enroll.guardianName}</span> ผู้ปกครอง</div>
                        <div>( ${enroll.guardianName} )</div>
                    </div>
                    <div class="space-y-2 pt-6 col-span-2">
                        <div>ลงชื่อ <span class="dotted-line w-[190px]">${enroll.witnessName}</span> เจ้าหน้าที่รับมอบตัว/พยาน</div>
                        <div>วันที่มอบตัว: <span class="dotted-line w-[180px]">${toThaiDigits(enroll.enrolledDate)}</span></div>
                    </div>
                </div>
            </div>
        `;
    }
}

function downloadApplicantPDF() {
    const app = activeApplicantIdForPdf === 'DRAFT'
        ? getDraftApplicantFromForm()
        : getApplicants().find(a => a.id === activeApplicantIdForPdf);
    if (!app) return;

    const element = document.getElementById('a4-paper-content');
    const docTitle = currentPdfMode === 'application' ? 'ใบสมัครโควตา2570' : 'ใบมอบตัวนักศึกษา2570';
    const filename = `${docTitle}_${app.id || 'DRAFT'}_${app.firstName || 'ผู้สมัคร'}.pdf`;

    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, scrollX: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}

function printApplicantDocument() {
    window.print();
}

// =========================================================================
// VIEW 2: VISUAL TIMELINE STATUS TRACKER
// =========================================================================
function getStepProgressIndex(status) {
    if (status === 'รอตรวจสอบ') return 1;
    if (status === 'เอกสารไม่ครบ') return 2;
    if (status === 'ผ่านการคัดเลือก') return 3;
    if (status === 'มอบตัวแล้ว') return 4;
    return 1;
}

function searchApplicantStatus() {
    const query = (document.getElementById('searchQueryInput')?.value || '').trim().toLowerCase();
    const list = getApplicants();
    const container = document.getElementById('statusResultsContainer');

    const filtered = query
        ? list.filter(a =>
            a.citizenId.includes(query) ||
            a.firstName.toLowerCase().includes(query) ||
            a.lastName.toLowerCase().includes(query) ||
            a.id.toLowerCase().includes(query)
        )
        : list.slice(0, 5);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 bg-slate-900/50 rounded-2xl border border-dashed border-white/15">
                <p class="text-white font-semibold">ไม่พบข้อมูลผู้สมัครที่ตรงกับ "${query}"</p>
                <p class="text-xs text-slate-400 mt-1">กรุณาตรวจสอบเลขประจำตัวประชาชน 13 หลัก หรือชื่อ-นามสกุลอีกครั้ง</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(app => {
        const badgeStyle = getStatusBadgeClass(app.status);
        const stepIdx = getStepProgressIndex(app.status);

        return `
            <div class="p-6 rounded-2xl border border-white/15 bg-slate-900/60 hover:border-cyan-400/50 transition space-y-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="space-y-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-md">${app.id}</span>
                            ${app.studentCode ? `<span class="text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-md">รหัส นศ. ${app.studentCode}</span>` : ''}
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeStyle}">${app.status}</span>
                            <span class="text-xs text-slate-400">ยื่นสมัคร: ${app.appliedDate}</span>
                        </div>
                        <h4 class="text-lg font-extrabold text-white">${app.prefix}${app.firstName} ${app.lastName} <span class="text-xs font-mono font-normal text-slate-400">(${maskCitizenId(app.citizenId)})</span></h4>
                        <p class="text-xs text-slate-300">
                            ระดับ: <strong class="text-cyan-300">${app.applyLevel}</strong> |
                            แผนกวิชาอันดับ 1: <strong class="text-amber-300">${app.deptChoice1}</strong>
                            ${app.deptChoice2 && app.deptChoice2 !== '-' ? ` | อันดับ 2: ${app.deptChoice2}` : ''}
                        </p>
                        ${app.statusRemark ? `<p class="text-xs text-rose-300 bg-rose-500/20 border border-rose-400/30 px-3 py-1.5 rounded-lg inline-block mt-1">⚠️ แจ้งเตือนจากเจ้าหน้าที่: ${app.statusRemark}</p>` : ''}
                    </div>

                    <div class="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button onclick="openReuploadModal('${app.id}')" class="inline-flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition">
                            <i data-lucide="upload-cloud" class="w-4 h-4"></i>
                            <span>อัปโหลดเอกสารแก้ไข</span>
                        </button>
                        <button onclick="openPdfPreviewModal('${app.id}', 'application')" class="inline-flex items-center space-x-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                            <span>พิมพ์ใบสมัครโควตา (PDF)</span>
                        </button>
                        <button onclick="openPdfPreviewModal('${app.id}', 'enrollment')" class="inline-flex items-center space-x-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 px-4 py-2.5 rounded-xl text-xs font-bold transition">
                            <i data-lucide="award" class="w-4 h-4"></i>
                            <span>ใบมอบตัว (PDF)</span>
                        </button>
                    </div>
                </div>

                <!-- 4-Step Visual Progress Timeline -->
                <div class="grid grid-cols-4 gap-2 pt-3 border-t border-white/10 text-center text-[11px]">
                    <div class="p-2 rounded-xl ${stepIdx >= 1 ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold' : 'bg-white/5 text-slate-500'}">
                        1. ส่งใบสมัครสำเร็จ
                    </div>
                    <div class="p-2 rounded-xl ${app.status === 'เอกสารไม่ครบ' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : (stepIdx >= 2 ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold' : 'bg-white/5 text-slate-500')}">
                        2. ตรวจสอบเอกสาร
                    </div>
                    <div class="p-2 rounded-xl ${stepIdx >= 3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'bg-white/5 text-slate-500'}">
                        3. ผ่านการคัดเลือก
                    </div>
                    <div class="p-2 rounded-xl ${stepIdx === 4 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold' : 'bg-white/5 text-slate-500'}">
                        4. มอบตัว & ออกรหัส นศ.
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function maskCitizenId(cid) {
    if (!cid || cid.length < 13) return cid;
    return `${cid.slice(0, 3)}-xxxx-xx${cid.slice(9, 12)}-${cid.slice(12)}`;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'รอตรวจสอบ':
            return 'bg-amber-500/20 text-amber-300 border border-amber-400/30';
        case 'เอกสารไม่ครบ':
            return 'bg-rose-500/20 text-rose-300 border border-rose-400/30';
        case 'ผ่านการคัดเลือก':
            return 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
        case 'มอบตัวแล้ว':
            return 'bg-purple-500/20 text-purple-300 border border-purple-400/30';
        default:
            return 'bg-slate-700 text-slate-200';
    }
}

// =========================================================================
// VIEW 3: DASHBOARD & REAL-TIME ANALYTICS BY DEPARTMENT
// =========================================================================
function renderDashboard() {
    const allApplicants = getApplicants();
    const yearFilter = document.getElementById('dashFilterYear')?.value || 'ALL';
    const levelFilter = document.getElementById('dashFilterLevel')?.value || 'ALL';

    const list = allApplicants.filter(a => {
        const appYear = a.academicYear || '2570';
        const matchYear = yearFilter === 'ALL' || appYear === yearFilter;
        const matchLevel = levelFilter === 'ALL' ||
            (levelFilter === 'ปวช.' ? a.applyLevel === 'ปวช.' : a.applyLevel.startsWith('ปวส.'));
        return matchYear && matchLevel;
    });

    const total = list.length;
    const pwcCount = list.filter(a => a.applyLevel === 'ปวช.').length;
    const pwsCount = total - pwcCount;
    const pending = list.filter(a => a.status === 'รอตรวจสอบ' || a.status === 'เอกสารไม่ครบ').length;
    const approved = list.filter(a => a.status === 'ผ่านการคัดเลือก' || a.status === 'มอบตัวแล้ว').length;
    const enrolled = list.filter(a => a.status === 'มอบตัวแล้ว').length;

    const avgGpax = total > 0
        ? (list.reduce((sum, a) => sum + (parseFloat(a.gpax) || 0), 0) / total).toFixed(2)
        : '0.00';

    document.getElementById('kpi-total').textContent = total;
    document.getElementById('kpi-level-split').textContent = `ปวช. ${pwcCount} คน | ปวส. ${pwsCount} คน`;
    document.getElementById('kpi-pending').textContent = pending;
    document.getElementById('kpi-approved').textContent = approved;
    document.getElementById('kpi-enrolled').textContent = enrolled;
    document.getElementById('kpi-gpax-avg').textContent = `GPAX เฉลี่ยรวม: ${avgGpax}`;

    const isLight = document.documentElement.classList.contains('light');
    const chartTextColor = isLight ? '#1e293b' : '#cbd5e1';
    const chartGridColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    const sliceBorderColor = isLight ? '#ffffff' : '#0f172a';

    Chart.defaults.color = chartTextColor;
    Chart.defaults.borderColor = chartGridColor;
    Chart.defaults.font.family = "'Prompt', sans-serif";

    // 1. กราฟแท่งเปรียบเทียบแผนกวิชา (สาขาวิชา)
    const deptLabels = DEPARTMENTS.map(d => d.name.split(' ')[0]);
    const deptPwcData = DEPARTMENTS.map(d => list.filter(a => a.deptChoice1 === d.name && a.applyLevel === 'ปวช.').length);
    const deptPwsData = DEPARTMENTS.map(d => list.filter(a => a.deptChoice1 === d.name && a.applyLevel.startsWith('ปวส.')).length);

    const ctxDept = document.getElementById('chartByDepartment').getContext('2d');
    if (deptChartInstance) deptChartInstance.destroy();
    deptChartInstance = new Chart(ctxDept, {
        type: 'bar',
        data: {
            labels: deptLabels,
            datasets: [
                {
                    label: 'ระดับ ปวช.',
                    data: deptPwcData,
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                },
                {
                    label: 'ระดับ ปวส.',
                    data: deptPwsData,
                    backgroundColor: '#facc15',
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { color: chartTextColor } } },
            scales: {
                x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
                y: { beginAtZero: true, ticks: { stepSize: 1, color: chartTextColor }, grid: { color: chartGridColor } }
            }
        }
    });

    // 2. กราฟวงกลมสัดส่วนระดับชั้น
    const cPwc = list.filter(a => a.applyLevel === 'ปวช.').length;
    const cPwsDirect = list.filter(a => a.applyLevel === 'ปวส. (สายตรง)').length;
    const cPwsOther = list.filter(a => a.applyLevel === 'ปวส. (ม.6/ปวช. ต่างสาขา)').length;

    const ctxLevel = document.getElementById('chartByLevel').getContext('2d');
    if (levelChartInstance) levelChartInstance.destroy();
    levelChartInstance = new Chart(ctxLevel, {
        type: 'doughnut',
        data: {
            labels: ['ระดับ ปวช.', 'ปวส. (สายตรง)', 'ปวส. (ม.6/ต่างสาขา)'],
            datasets: [{
                data: [cPwc, cPwsDirect, cPwsOther],
                backgroundColor: ['#3b82f6', '#facc15', '#06b6d4'],
                borderColor: sliceBorderColor,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: chartTextColor } } }
        }
    });

    document.getElementById('levelLegendSummary').innerHTML = `
        <div class="flex justify-between"><span>• ระดับ ปวช.</span><strong class="text-cyan-400 font-mono">${cPwc} คน</strong></div>
        <div class="flex justify-between"><span>• ระดับ ปวส. (สายตรง)</span><strong class="text-rose-400 font-mono">${cPwsDirect} คน</strong></div>
        <div class="flex justify-between"><span>• ระดับ ปวส. (ม.6/ต่างสาขา)</span><strong class="text-amber-400 font-mono">${cPwsOther} คน</strong></div>
    `;

    // 3. กราฟแยกตามโรงเรียนเดิม (Top 5 Schools)
    const schoolMap = {};
    list.forEach(a => {
        const sc = (a.schoolName || 'ไม่ระบุ').trim();
        schoolMap[sc] = (schoolMap[sc] || 0) + 1;
    });
    const sortedSchools = Object.entries(schoolMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ctxSchool = document.getElementById('chartBySchool')?.getContext('2d');
    if (ctxSchool) {
        if (schoolChartInstance) schoolChartInstance.destroy();
        schoolChartInstance = new Chart(ctxSchool, {
            type: 'bar',
            data: {
                labels: sortedSchools.map(s => s[0].slice(0, 18)),
                datasets: [{
                    label: 'ผู้สมัคร (คน)',
                    data: sortedSchools.map(s => s[1]),
                    backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'],
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1, color: chartTextColor }, grid: { color: chartGridColor } },
                    y: { ticks: { color: chartTextColor }, grid: { display: false } }
                }
            }
        });
    }

    // 4. กราฟแยกตามจังหวัดภูมิลำเนา
    const provMap = {};
    list.forEach(a => {
        const pv = (a.addrProvince || a.schoolProvince || 'ไม่ระบุ').trim();
        provMap[pv] = (provMap[pv] || 0) + 1;
    });
    const sortedProvs = Object.entries(provMap).sort((a, b) => b[1] - a[1]);
    const ctxProvince = document.getElementById('chartByProvince')?.getContext('2d');
    if (ctxProvince) {
        if (provinceChartInstance) provinceChartInstance.destroy();
        provinceChartInstance = new Chart(ctxProvince, {
            type: 'pie',
            data: {
                labels: sortedProvs.map(p => `จ.${p[0]}`),
                datasets: [{
                    data: sortedProvs.map(p => p[1]),
                    backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'],
                    borderColor: sliceBorderColor,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: chartTextColor } } }
            }
        });
    }

    // 5. กราฟช่องทางรู้จักวิทยาลัย (ผู้แนะนำแนะแนว)
    const channels = [
        'ครูแนะแนวประจำโรงเรียน',
        'เพจ Facebook / โซเชียลมีเดีย',
        'รุ่นพี่ / ศิษย์เก่าแนะนำ',
        'ผู้ปกครองแนะนำ',
        'เว็บไซต์วิทยาลัย / ป้ายประชาสัมพันธ์'
    ];
    const channelCounts = channels.map(ch => list.filter(a => a.referralChannel === ch).length);

    const ctxChannel = document.getElementById('chartByChannel').getContext('2d');
    if (channelChartInstance) channelChartInstance.destroy();
    channelChartInstance = new Chart(ctxChannel, {
        type: 'bar',
        data: {
            labels: ['ครูแนะแนว รร.', 'เพจ Facebook', 'รุ่นพี่/ศิษย์เก่า', 'ผู้ปกครอง', 'เว็บไซต์/ป้าย'],
            datasets: [{
                label: 'จำนวนผู้สมัคร (คน)',
                data: channelCounts,
                backgroundColor: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1, color: chartTextColor }, grid: { color: chartGridColor } },
                y: { ticks: { color: chartTextColor }, grid: { display: false } }
            }
        }
    });

    // 6. ตารางสรุปยอดรายแผนกวิชา
    const tbody = document.getElementById('deptSummaryTableBody');
    tbody.innerHTML = DEPARTMENTS.map(d => {
        const pwc = list.filter(a => a.deptChoice1 === d.name && a.applyLevel === 'ปวช.').length;
        const pws = list.filter(a => a.deptChoice1 === d.name && a.applyLevel.startsWith('ปวส.')).length;
        const sum = pwc + pws;
        const pct = Math.min(100, Math.round((sum / d.quota) * 100));

        return `
            <tr class="hover:bg-white/5 transition">
                <td class="py-2.5 px-3 font-semibold text-white">${d.name}</td>
                <td class="py-2.5 px-2 text-center font-mono text-cyan-300">${pwc}</td>
                <td class="py-2.5 px-2 text-center font-mono text-rose-300">${pws}</td>
                <td class="py-2.5 px-2 text-center font-mono font-bold text-amber-300">${sum}</td>
                <td class="py-2.5 px-3">
                    <div class="flex items-center space-x-2">
                        <div class="flex-grow h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div class="h-full rounded-full" style="width:${Math.max(pct, 8)}%; background-color:${d.color}"></div>
                        </div>
                        <span class="text-xs font-mono text-slate-400">${sum}/${d.quota}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// VIEW 4: ADMIN BACK-END KPI SUMMARY, CHARTS, TABLE & ENROLLMENT
// =========================================================================
function renderAdminAnalytics(sourceList) {
    const list = Array.isArray(sourceList) ? sourceList : getApplicants();

    const totalCount = list.length;
    const pendingCount = list.filter(a => a.status === 'รอตรวจสอบ' || a.status === 'เอกสารไม่ครบ').length;
    const approvedCount = list.filter(a => a.status === 'ผ่านการคัดเลือก').length;
    const enrolledCount = list.filter(a => a.status === 'มอบตัวแล้ว').length;

    const elTotal = document.getElementById('admin-kpi-total');
    const elPending = document.getElementById('admin-kpi-pending');
    const elApproved = document.getElementById('admin-kpi-approved');
    const elEnrolled = document.getElementById('admin-kpi-enrolled');

    if (elTotal) elTotal.textContent = totalCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elApproved) elApproved.textContent = approvedCount;
    if (elEnrolled) elEnrolled.textContent = enrolledCount;

    const isLight = document.documentElement.classList.contains('light');
    const chartTextColor = isLight ? '#1e293b' : '#e2e8f0';
    const chartMutedColor = isLight ? '#475569' : '#94a3b8';
    const chartGridColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    const sliceBorderColor = isLight ? '#ffffff' : '#0f172a';

    // 1. กราฟโดนัท: ยอดผู้สมัครแยกตามสาขาวิชา (Left Chart)
    const deptCountsMap = {};
    list.forEach(a => {
        const dName = a.deptChoice1 || 'ไม่ระบุสาขา';
        deptCountsMap[dName] = (deptCountsMap[dName] || 0) + 1;
    });

    const deptEntries = Object.entries(deptCountsMap).sort((a, b) => b[1] - a[1]);
    const deptLabels = deptEntries.length > 0 ? deptEntries.map(e => e[0]) : ['ยังไม่มีข้อมูลผู้สมัคร'];
    const deptData = deptEntries.length > 0 ? deptEntries.map(e => e[1]) : [1];
    const themePalette = [
        '#2563eb', // Royal Blue
        '#facc15', // Golden Yellow
        '#3b82f6', // Electric Blue
        '#f59e0b', // Amber Gold
        '#06b6d4', // Cyber Cyan
        '#fde047', // Bright Yellow
        '#1d4ed8', // Deep Sapphire
        '#10b981', // Emerald
        '#8b5cf6'  // Violet
    ];

    const canvasDept = document.getElementById('adminChartDept');
    if (canvasDept) {
        const ctxAdminDept = canvasDept.getContext('2d');
        if (adminDeptChartInstance) adminDeptChartInstance.destroy();
        adminDeptChartInstance = new Chart(ctxAdminDept, {
            type: 'doughnut',
            data: {
                labels: deptLabels,
                datasets: [{
                    data: deptData,
                    backgroundColor: deptEntries.length > 0 ? themePalette.slice(0, deptLabels.length) : ['#64748b'],
                    borderColor: sliceBorderColor,
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '52%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: chartTextColor,
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 14,
                            font: { family: "'Prompt', sans-serif", size: 12, weight: '500' }
                        }
                    }
                }
            }
        });
    }

    // 2. กราฟแท่งแนวตั้ง: สถิติช่องทางประชาสัมพันธ์ (Right Chart)
    const channelMap = {};
    list.forEach(a => {
        const ch = a.referralChannel || 'ไม่ระบุช่องทาง';
        channelMap[ch] = (channelMap[ch] || 0) + 1;
    });
    const channelEntries = Object.entries(channelMap).sort((a, b) => b[1] - a[1]);
    const channelLabels = channelEntries.map(e => e[0]);
    const channelValues = channelEntries.map(e => e[1]);

    const canvasChannel = document.getElementById('adminChartChannel');
    if (canvasChannel) {
        const ctxAdminChannel = canvasChannel.getContext('2d');
        if (adminChannelChartInstance) adminChannelChartInstance.destroy();
        adminChannelChartInstance = new Chart(ctxAdminChannel, {
            type: 'bar',
            data: {
                labels: channelLabels,
                datasets: [{
                    label: 'จำนวนผู้สมัคร (คน)',
                    data: channelValues,
                    backgroundColor: ['#3b82f6', '#facc15', '#2563eb', '#f59e0b', '#06b6d4'],
                    hoverBackgroundColor: '#fde047',
                    borderRadius: 8,
                    maxBarThickness: 64
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: {
                            color: chartMutedColor,
                            maxRotation: 12,
                            minRotation: 5,
                            font: { family: "'Prompt', sans-serif", size: 11 }
                        },
                        grid: { color: chartGridColor }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: chartMutedColor,
                            font: { family: "'JetBrains Mono', monospace", size: 11 }
                        },
                        grid: { color: chartGridColor }
                    }
                }
            }
        });
    }
}

function renderAdminTable() {
    const list = getApplicants();
    const q = (document.getElementById('adminSearch')?.value || '').trim().toLowerCase();
    const yearFilter = document.getElementById('adminFilterYear')?.value || 'ALL';
    const levelFilter = document.getElementById('adminFilterLevel')?.value || 'ALL';
    const deptFilter = document.getElementById('adminFilterDept')?.value || 'ALL';
    const statusFilter = document.getElementById('adminFilterStatus')?.value || 'ALL';

    const filtered = list.filter(a => {
        const appYear = a.academicYear || '2570';
        const matchQ = !q ||
            a.firstName.toLowerCase().includes(q) ||
            a.lastName.toLowerCase().includes(q) ||
            a.citizenId.includes(q) ||
            a.id.toLowerCase().includes(q) ||
            (a.studentCode && a.studentCode.includes(q)) ||
            a.schoolName.toLowerCase().includes(q);

        const matchYear = yearFilter === 'ALL' || appYear === yearFilter;
        const matchLevel = levelFilter === 'ALL' || a.applyLevel === levelFilter;
        const matchDept = deptFilter === 'ALL' || a.deptChoice1 === deptFilter;
        const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;

        return matchQ && matchYear && matchLevel && matchDept && matchStatus;
    });

    // อัปเดตการ์ดสรุป 4 ใบ และกราฟ 2 ตัวด้านบนสุดของหน้า Back-End
    renderAdminAnalytics(filtered);

    const tbody = document.getElementById('adminTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400">ไม่พบรายการผู้สมัครที่ตรงกับเงื่อนไขการกรอง</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(app => {
        const badgeClass = getStatusBadgeClass(app.status);
        const docCount = [app.files?.transcript, app.files?.idcard, app.files?.cert].filter(Boolean).length;
        const appYear = app.academicYear || '2570';

        return `
            <tr class="hover:bg-white/5 transition">
                <td class="py-3.5 px-4">
                    <div class="font-mono font-bold text-cyan-300 text-xs">${app.id}</div>
                    ${app.studentCode
                        ? `<div class="text-[11px] font-mono text-purple-300 font-semibold">รหัส นศ.: ${app.studentCode}</div>`
                        : `<div class="text-[11px] text-slate-500">รอออกรหัสนักศึกษา</div>`
                    }
                </td>
                <td class="py-3.5 px-4">
                    <div class="font-bold text-white">${app.prefix}${app.firstName} ${app.lastName}</div>
                    <div class="text-xs text-slate-400 font-mono">บัตรฯ: ${app.citizenId} | โทร: ${app.phone}</div>
                </td>
                <td class="py-3.5 px-4">
                    <div class="flex items-center gap-1.5 mb-0.5">
                        <span class="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded">ปี ${appYear}</span>
                        <span class="text-[10px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">${app.applyLevel}</span>
                    </div>
                    <div class="text-xs font-bold text-slate-200">${app.deptChoice1}</div>
                </td>
                <td class="py-3.5 px-3 text-center">
                    <div class="text-xs font-medium text-slate-200">${app.schoolName}</div>
                    <span class="text-[11px] font-mono text-emerald-400 font-bold">GPAX ${app.gpax} | จ.${app.addrProvince || app.schoolProvince}</span>
                </td>
                <td class="py-3.5 px-3 text-center">
                    <button onclick="openAttachmentViewerModal('${app.id}')" class="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border ${docCount >= 2 ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'} text-xs font-mono font-bold transition">
                        <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                        <span>ดูไฟล์แนบ (${docCount})</span>
                    </button>
                </td>
                <td class="py-3.5 px-3 text-center">
                    <select onchange="quickChangeApplicantStatus('${app.id}', this.value)" class="cyber-input rounded-xl px-2.5 py-1.5 text-xs font-bold ${badgeClass}">
                        <option value="รอตรวจสอบ" ${app.status === 'รอตรวจสอบ' ? 'selected' : ''}>รอตรวจสอบ</option>
                        <option value="เอกสารไม่ครบ" ${app.status === 'เอกสารไม่ครบ' ? 'selected' : ''}>เอกสารไม่ครบ</option>
                        <option value="ผ่านการคัดเลือก" ${app.status === 'ผ่านการคัดเลือก' ? 'selected' : ''}>ผ่านการคัดเลือก</option>
                        <option value="มอบตัวแล้ว" ${app.status === 'มอบตัวแล้ว' ? 'selected' : ''}>มอบตัวแล้ว</option>
                    </select>
                </td>
                <td class="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button onclick="openAdminManageModal('${app.id}')" class="inline-flex items-center space-x-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 px-3 py-1.5 rounded-xl text-xs font-bold transition">
                        <i data-lucide="user-check" class="w-3.5 h-3.5 text-purple-300"></i>
                        <span>ออกรหัส/มอบตัว</span>
                    </button>
                    <button onclick="openPdfPreviewModal('${app.id}', 'application')" class="inline-flex items-center space-x-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow">
                        <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                        <span>PDF</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function quickChangeApplicantStatus(applicantId, newStatus) {
    const list = getApplicants();
    const idx = list.findIndex(a => a.id === applicantId);
    if (idx === -1) return;

    const app = list[idx];
    app.status = newStatus;

    // หากเปลี่ยนเป็น "มอบตัวแล้ว" และยังไม่มีรหัสนักศึกษา ให้ออกรหัสนักศึกษาอัตโนมัติทันที
    if (newStatus === 'มอบตัวแล้ว' && !app.studentCode) {
        const deptObj = DEPARTMENTS.find(d => d.name === app.deptChoice1) || { code: '01' };
        const levelDigit = app.applyLevel === 'ปวช.' ? '2' : '3';
        const seqNum = app.id.split('-')[1] || '0001';
        app.studentCode = `70${levelDigit}01${deptObj.code}${seqNum.slice(-3)}`;
        if (!app.enrollment) {
            app.enrollment = {
                guardianName: app.fatherName || app.motherName,
                guardianRelation: 'บิดา/มารดา',
                guardianPhone: app.phone,
                witnessName: getStaffSession()?.role || 'เจ้าหน้าที่งานทะเบียน',
                enrolledDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
            };
        }
    }

    saveApplicants(list);
    renderAdminTable();

    addNotificationLog(`📢 [LINE OA & Email] แจ้งเตือนผู้สมัคร [${app.id}] ${app.prefix}${app.firstName} -> สถานะเปลี่ยนเป็น "${newStatus}" ${app.studentCode ? `(รหัส นศ. ${app.studentCode})` : ''}`);

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `เปลี่ยนสถานะ ${app.firstName} เป็น "${newStatus}" และส่งแจ้งเตือน LINE/Email แล้ว`,
        showConfirmButton: false,
        timer: 2500
    });
}

function openAttachmentViewerModal(applicantId) {
    const app = getApplicants().find(a => a.id === applicantId);
    if (!app) return;

    document.getElementById('attachmentModalSubtitle').textContent = `รหัสผู้สมัคร: ${app.id} — ${app.prefix}${app.firstName} ${app.lastName} (${app.deptChoice1})`;

    const items = [
        { key: 'photo', title: '1. รูปถ่ายหน้าตรงขนาด 1 นิ้ว', val: app.files?.photo ? 'แนบรูปถ่ายออนไลน์แล้ว' : null, isPhoto: Boolean(app.files?.photo) },
        { key: 'transcript', title: '2. ใบแสดงผลการเรียน (รบ.1) 5 ภาคเรียน', val: app.files?.transcript },
        { key: 'idcard', title: '3. สำเนาบัตรประจำตัวประชาชน / ทะเบียนบ้าน', val: app.files?.idcard },
        { key: 'cert', title: '4. สำเนาเกียรติบัตร / ความสามารถพิเศษ', val: app.files?.cert }
    ];

    const body = document.getElementById('attachmentViewerBody');
    body.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            ${items.map(item => `
                <div class="p-4 rounded-2xl border ${item.val ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-slate-900/60'} flex flex-col justify-between gap-2">
                    <div>
                        <div class="text-xs font-bold text-white">${item.title}</div>
                        <div class="text-xs font-mono mt-1 ${item.val ? 'text-emerald-300' : 'text-rose-400'}">
                            ${item.val ? `✓ ไฟล์: ${item.isPhoto ? 'photo_1inch.jpg' : item.val}` : '✗ ยังไม่ได้แนบเอกสาร'}
                        </div>
                    </div>
                    ${item.isPhoto ? `<img src="${app.files.photo}" class="w-20 h-24 object-cover rounded-lg border border-white/20 mt-2">` : ''}
                    <div class="pt-2 border-t border-white/10 flex justify-between items-center text-[11px]">
                        <span class="text-slate-400">สถานะไฟล์: ${item.val ? 'พร้อมตรวจสอบ' : 'ขาดเอกสาร'}</span>
                        ${item.val ? `<button onclick="Swal.fire({icon:'info', title:'จำลองการเปิดไฟล์แนบ', text:'ไฟล์ ${item.isPhoto ? 'รูปถ่าย 1 นิ้ว' : item.val} ผ่านการสแกนไวรัสและพร้อมตรวจสอบแล้ว'})" class="text-cyan-400 hover:underline font-bold">พรีวิวไฟล์</button>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="flex items-center justify-between pt-4 border-t border-white/10">
            <button onclick="closeAttachmentViewerModal(); quickChangeApplicantStatus('${app.id}', 'เอกสารไม่ครบ');" class="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 text-xs font-bold">
                แจ้งเตือน "เอกสารไม่ครบ"
            </button>
            <div class="flex gap-2">
                <button onclick="closeAttachmentViewerModal()" class="px-4 py-2 rounded-xl border border-white/15 text-xs text-slate-300">ปิด</button>
                <button onclick="closeAttachmentViewerModal(); quickChangeApplicantStatus('${app.id}', 'ผ่านการคัดเลือก');" class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold">
                    อนุมัติ "ผ่านการคัดเลือก"
                </button>
            </div>
        </div>
    `;

    document.getElementById('attachmentViewerModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeAttachmentViewerModal() {
    document.getElementById('attachmentViewerModal').classList.add('hidden');
}

function openAdminManageModal(applicantId) {
    const list = getApplicants();
    const app = list.find(a => a.id === applicantId);
    if (!app) return;

    const deptObj = DEPARTMENTS.find(d => d.name === app.deptChoice1) || { code: '01' };
    const levelDigit = app.applyLevel === 'ปวช.' ? '2' : '3';
    const seqNum = app.id.split('-')[1] || '0001';
    const suggestedStudentCode = app.studentCode || `70${levelDigit}01${deptObj.code}${seqNum.slice(-3)}`;

    const enroll = app.enrollment || {
        guardianName: app.fatherName || app.motherName,
        guardianRelation: 'บิดา/มารดา',
        guardianPhone: app.phone,
        witnessName: getStaffSession()?.role || 'เจ้าหน้าที่งานทะเบียน',
        enrolledDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    const body = document.getElementById('adminManageModalBody');
    body.innerHTML = `
        <div class="p-4 rounded-2xl bg-slate-900/80 border border-white/15 flex items-center justify-between">
            <div>
                <span class="text-xs font-mono font-bold text-cyan-400">${app.id}</span>
                <h4 class="text-base font-bold text-white">${app.prefix}${app.firstName} ${app.lastName}</h4>
                <p class="text-xs text-slate-400">${app.applyLevel} — สาขา${app.deptChoice1} (GPAX: ${app.gpax})</p>
            </div>
            <button onclick="closeAdminManageModal(); openPdfPreviewModal('${app.id}', 'application')" class="text-xs bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl font-bold">
                เปิดใบสมัคร PDF
            </button>
        </div>

        <div class="space-y-2">
            <h5 class="text-xs font-mono uppercase text-cyan-400">1. ตรวจสอบเอกสารหลักฐาน</h5>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div class="p-3 rounded-xl border ${app.files?.transcript ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}">
                    <strong>ใบ รบ.1 (5 ภาคเรียน):</strong><br>${app.files?.transcript || 'ไม่ได้แนบไฟล์'}
                </div>
                <div class="p-3 rounded-xl border ${app.files?.idcard ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}">
                    <strong>สำเนาบัตร/ทะเบียนบ้าน:</strong><br>${app.files?.idcard || 'ไม่ได้แนบไฟล์'}
                </div>
                <div class="p-3 rounded-xl border border-white/15 bg-slate-900/50 text-slate-300">
                    <strong>เกียรติบัตร:</strong><br>${app.files?.cert || '- ไม่มี -'}
                </div>
            </div>
        </div>

        <div class="space-y-3 pt-3 border-t border-white/10">
            <h5 class="text-xs font-mono uppercase text-cyan-400">2. ปรับสถานะการคัดเลือก & แจ้งเตือนอัตโนมัติ</h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs text-slate-300 mb-1">สถานะผู้สมัคร</label>
                    <select id="modalStatusSelect" class="cyber-input w-full rounded-xl px-3 py-2 text-sm font-semibold">
                        <option value="รอตรวจสอบ" ${app.status === 'รอตรวจสอบ' ? 'selected' : ''}>รอตรวจสอบ</option>
                        <option value="เอกสารไม่ครบ" ${app.status === 'เอกสารไม่ครบ' ? 'selected' : ''}>เอกสารไม่ครบ (แจ้งแก้ไข)</option>
                        <option value="ผ่านการคัดเลือก" ${app.status === 'ผ่านการคัดเลือก' ? 'selected' : ''}>ผ่านการคัดเลือก</option>
                        <option value="มอบตัวแล้ว" ${app.status === 'มอบตัวแล้ว' ? 'selected' : ''}>มอบตัวแล้ว (ออกรหัสนักศึกษา)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs text-slate-300 mb-1">หมายเหตุแจ้งผู้สมัคร (ส่งเข้า LINE / อีเมล)</label>
                    <input type="text" id="modalStatusRemark" value="${app.statusRemark || ''}" placeholder="เช่น กรุณาอัปโหลดใบ รบ.1 เพิ่มเติม" class="cyber-input w-full rounded-xl px-3 py-2 text-sm">
                </div>
            </div>
        </div>

        <div class="space-y-3 pt-3 border-t border-white/10 bg-purple-500/10 p-4 rounded-2xl border border-purple-500/30">
            <div class="flex items-center justify-between">
                <h5 class="text-xs font-mono font-bold uppercase text-purple-300">3. ระบบออกรหัสประจำตัวและจัดการการมอบตัว</h5>
                <span class="text-[10px] font-mono bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded">Auto Student ID</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs text-slate-300 mb-1">รหัสนักศึกษา (กำหนดอัตโนมัติตามสาขา)</label>
                    <input type="text" id="modalStudentCode" value="${suggestedStudentCode}" class="cyber-input w-full rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-purple-300">
                </div>
                <div>
                    <label class="block text-xs text-slate-300 mb-1">วันที่มอบตัว</label>
                    <input type="text" id="modalEnrolledDate" value="${enroll.enrolledDate}" class="cyber-input w-full rounded-xl px-3 py-1.5 text-sm">
                </div>
                <div>
                    <label class="block text-xs text-slate-300 mb-1">ชื่อ-สกุลผู้ปกครอง</label>
                    <input type="text" id="modalGuardianName" value="${enroll.guardianName}" class="cyber-input w-full rounded-xl px-3 py-1.5 text-sm">
                </div>
                <div>
                    <label class="block text-xs text-slate-300 mb-1">ความเกี่ยวข้อง / เบอร์โทรผู้ปกครอง</label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" id="modalGuardianRelation" value="${enroll.guardianRelation || 'ผู้ปกครอง'}" placeholder="บิดา/มารดา" class="cyber-input w-full rounded-xl px-2.5 py-1.5 text-xs">
                        <input type="text" id="modalGuardianPhone" value="${enroll.guardianPhone}" placeholder="เบอร์โทร" class="cyber-input w-full rounded-xl px-2.5 py-1.5 text-xs font-mono">
                    </div>
                </div>
                <div class="sm:col-span-2">
                    <label class="block text-xs text-slate-300 mb-1">ชื่อพยาน / เจ้าหน้าที่รับมอบตัว</label>
                    <input type="text" id="modalWitnessName" value="${enroll.witnessName}" class="cyber-input w-full rounded-xl px-3 py-1.5 text-sm">
                </div>
            </div>
        </div>

        <div class="flex items-center justify-between pt-2">
            <button onclick="deleteApplicantRecord('${app.id}')" class="text-xs text-rose-400 hover:underline font-medium">ลบรายชื่อนี้</button>
            <div class="flex items-center space-x-2">
                <button onclick="closeAdminManageModal()" class="px-4 py-2 rounded-xl border border-white/15 text-xs font-semibold text-slate-300">ยกเลิก</button>
                <button onclick="saveAdminApplicantChanges('${app.id}')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-extrabold shadow-lg">
                    บันทึกผลการตรวจสอบ & ส่งแจ้งเตือน
                </button>
            </div>
        </div>
    `;

    document.getElementById('adminManageModal').classList.remove('hidden');
}

function closeAdminManageModal() {
    document.getElementById('adminManageModal').classList.add('hidden');
}

function saveAdminApplicantChanges(applicantId) {
    const list = getApplicants();
    const idx = list.findIndex(a => a.id === applicantId);
    if (idx === -1) return;

    const newStatus = document.getElementById('modalStatusSelect').value;
    const remark = document.getElementById('modalStatusRemark').value.trim();
    const studentCode = document.getElementById('modalStudentCode').value.trim();

    list[idx].status = newStatus;
    list[idx].statusRemark = remark;

    if (newStatus === 'มอบตัวแล้ว') {
        list[idx].studentCode = studentCode;
        list[idx].enrollment = {
            guardianName: document.getElementById('modalGuardianName').value.trim(),
            guardianRelation: document.getElementById('modalGuardianRelation')?.value.trim() || 'ผู้ปกครอง',
            guardianPhone: document.getElementById('modalGuardianPhone').value.trim(),
            witnessName: document.getElementById('modalWitnessName').value.trim(),
            enrolledDate: document.getElementById('modalEnrolledDate')?.value.trim() || new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
        };
    }

    saveApplicants(list);
    closeAdminManageModal();
    renderAdminTable();

    addNotificationLog(`📢 [LINE Notify & Email] แจ้งเตือนผู้สมัคร [${list[idx].id}] ${list[idx].firstName} -> สถานะ "${newStatus}" ${list[idx].studentCode ? `(รหัส นศ. ${list[idx].studentCode})` : ''}`);

    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `อัปเดตสถานะเป็น "${newStatus}" และส่งแจ้งเตือนแล้ว`,
        showConfirmButton: false,
        timer: 2500
    });
}

function deleteApplicantRecord(applicantId) {
    Swal.fire({
        icon: 'warning',
        title: 'ยืนยันการลบข้อมูลผู้สมัคร?',
        text: `ต้องการลบข้อมูลรหัส ${applicantId} ออกจากระบบหรือไม่`,
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'ลบข้อมูล',
        cancelButtonText: 'ยกเลิก'
    }).then(res => {
        if (res.isConfirmed) {
            const list = getApplicants().filter(a => a.id !== applicantId);
            saveApplicants(list);
            closeAdminManageModal();
            renderAdminTable();
        }
    });
}

// =========================================================================
// EXPORT DATA TO EXCEL / CSV (ศธ.02)
// =========================================================================
function exportToCSV() {
    const list = getApplicants();
    const headers = [
        'เลขที่ใบสมัคร',
        'รหัสนักศึกษา',
        'เลขบัตรประจำตัวประชาชน',
        'คำนำหน้า',
        'ชื่อ',
        'นามสกุล',
        'วันเดือนปีเกิด',
        'ระดับชั้นที่สมัคร',
        'สาขาวิชาอันดับ1',
        'สาขาวิชาอันดับ2',
        'โรงเรียนเดิม',
        'จังหวัดโรงเรียนเดิม',
        'GPAX',
        'เบอร์โทรศัพท์',
        'ชื่อบิดา',
        'ชื่อมารดา',
        'ที่อยู่ปัจจุบัน',
        'สถานะการสมัคร',
        'วันที่สมัคร'
    ];

    const rows = list.map(a => [
        a.id,
        a.studentCode || '',
        `"${a.citizenId}"`,
        a.prefix,
        a.firstName,
        a.lastName,
        `${a.birthDay} ${a.birthMonth} ${a.birthYear}`,
        a.applyLevel,
        a.deptChoice1,
        a.deptChoice2 || '',
        a.schoolName,
        a.schoolProvince,
        a.gpax,
        `"${a.phone}"`,
        a.fatherName,
        a.motherName,
        `${a.addrNo} ม.${a.addrMoo} ต.${a.addrSubdistrict} อ.${a.addrDistrict} จ.${a.addrProvince} ${a.addrZip}`,
        a.status,
        a.appliedDate
    ]);

    const csvContent = '\uFEFF' + [
        headers.join(','),
        ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายชื่อผู้สมัครเรียน_ศธ02_เทคนิคท่าหลวง_2570.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotificationLog(`📥 ส่งออกไฟล์ CSV มาตรฐานงานทะเบียน (ศธ.02) จำนวน ${list.length} รายการ`);
}

function resetDemoDatabase() {
    Swal.fire({
        icon: 'question',
        title: 'รีเซ็ตข้อมูลตัวอย่างเริ่มต้น?',
        text: 'ข้อมูลผู้สมัครจะกลับเป็นชุดข้อมูลตัวอย่าง 8 คนของวิทยาลัย',
        showCancelButton: true,
        confirmButtonText: 'รีเซ็ตข้อมูล',
        cancelButtonText: 'ยกเลิก'
    }).then(r => {
        if (r.isConfirmed) {
            localStorage.removeItem(STORAGE_KEY);
            getApplicants();
            renderAdminTable();
            renderDashboard();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'รีเซ็ตข้อมูลเรียบร้อยแล้ว', showConfirmButton: false, timer: 2000 });
        }
    });
}

// =========================================================================
// NOTIFICATION CONFIG & LOGS
// =========================================================================
function openNotificationConfigModal() {
    renderNotifyLogs();
    document.getElementById('notifyModal').classList.remove('hidden');
}

function closeNotificationConfigModal() {
    document.getElementById('notifyModal').classList.add('hidden');
}

function renderNotifyLogs() {
    const logs = JSON.parse(localStorage.getItem(NOTIFY_LOG_KEY) || '[]');
    const container = document.getElementById('notifyLogsContainer');
    if (!container) return;
    container.innerHTML = logs.map(l => `<div>${l}</div>`).join('');
}

function testSendLineNotify() {
    const list = getApplicants();
    addNotificationLog(`✅ [TEST LINE OA] สรุปยอดผู้สมัครโควตา 2570 ปัจจุบันรวม ${list.length} คน (ส่งเข้ากลุ่มงานทะเบียนสำเร็จ)`);
}

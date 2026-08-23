/**
 * Default Mock Data for Teacher E-Portfolio & Performance Appraisal App
 * Realistic Thai Teacher Portfolio Dataset (โรงเรียนวัดบางปูน)
 */

const DEFAULT_PORTFOLIO_DATA = {
  settings: {
    pin: "1234",
    appName: "KRUSOS E-PORTFOLIO",
    schoolName: "โรงเรียนวัดบางปูน",
    affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสิงห์บุรี",
    currentAcademicYear: "2568",
    availableYears: ["2566", "2567", "2568", "2569"],
    evaluationStatus: "พร้อมรับการประเมิน", // 'พร้อมรับการประเมิน' | 'ยังไม่เริ่มประเมิน / เตรียมการ' | 'ประเมินเสร็จสิ้น'
    dashboardUpdateLayout: "cards" // 'cards' | 'timeline' | 'spotlight'
  },
  
  profile: {
    fullName: "ครูวิมลรัตน์ ปัญญาสว่าง (ครูซอส)",
    position: "ครู อันดับ คศ.1",
    academicStanding: "ครูชำนาญการ (กำลังดำเนินการขอรับการประเมิน)",
    positionNumber: "123456",
    subjectGroup: "กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม",
    appointmentDate: "1 พฤษภาคม 2564",
    yearsOfService: "4 ปี 10 เดือน",
    school: "โรงเรียนวัดบางปูน",
    affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสิงห์บุรี",
    motto: "“มุ่งมั่นพัฒนาผู้เรียนด้วยนวัตกรรมดิจิทัล สร้างแรงบันดาลใจสู่การเรียนรู้ตลอดชีวิต”",
    bio: "ข้าราชการครูผู้มุ่งมั่นในการนำเทคโนโลยีสารสนเทศ นวัตกรรมการเรียนรู้ดิจิทัล (EdTech) และกระบวนการ Active Learning มาประยุกต์ใช้ในการจัดกิจกรรมการเรียนรู้ เพื่อส่งเสริมทักษะในศตวรรษที่ 21 ของผู้เรียนให้เต็มตามศักยภาพ",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    coverUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80",
    phone: "089-123-4567",
    email: "wimonrat.bangpun@gmail.com",
    lineId: "kru_sauce",
    schoolAddress: "ตำบลชีน้ำร้าย อำเภออินทร์บุรี จังหวัดสิงห์บุรี 16110",
    
    education: [
      {
        degree: "ปริญญาโท ศึกษาศาสตรมหาบัณฑิต (ศษ.ม.)",
        major: "สาขาวิชาเทคโนโลยีและสื่อสารการศึกษา",
        institution: "มหาวิทยาลัยนเรศวร",
        year: "2565",
        gpa: "3.92 (เกียรตินิยมดีมาก)"
      },
      {
        degree: "ปริญญาตรี ครุศาสตรบัณฑิต (ค.บ.)",
        major: "สาขาวิชาคอมพิวเตอร์ศึกษา (วิชาโทวิทยาศาสตร์)",
        institution: "มหาวิทยาลัยราชภัฏเทพสตรี",
        year: "2561",
        gpa: "3.85 (เกียรตินิยมอันดับหนึ่ง)"
      }
    ],

    workExperience: [
      {
        period: "2566 - ปัจจุบัน",
        position: "ครู อันดับ คศ.1",
        workplace: "โรงเรียนวัดบางปูน สพป.สิงห์บุรี",
        description: "ปฏิบัติหน้าที่การสอนกลุ่มสาระวิทยาศาสตร์และเทคโนโลยี และหัวหน้างานสารสนเทศและสื่อการเรียนรู้"
      },
      {
        period: "2564 - 2566",
        position: "ครูผู้ช่วย",
        workplace: "โรงเรียนวัดบางปูน สพป.สิงห์บุรี",
        description: "ผ่านการเตรียมความพร้อมและพัฒนาอย่างเข้มตามเกณฑ์ ก.ค.ศ. (คะแนนเฉลี่ย 96.50%)"
      }
    ],

    teachingDuties: [
      {
        subjectCode: "ว14101",
        subjectName: "วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ)",
        grade: "ชั้นประถมศึกษาปีที่ 4",
        hoursPerWeek: 2,
        studentsCount: 32
      },
      {
        subjectCode: "ว15101",
        subjectName: "วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ)",
        grade: "ชั้นประถมศึกษาปีที่ 5",
        hoursPerWeek: 2,
        studentsCount: 30
      },
      {
        subjectCode: "ว16101",
        subjectName: "วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ)",
        grade: "ชั้นประถมศึกษาปีที่ 6",
        hoursPerWeek: 2,
        studentsCount: 28
      },
      {
        subjectCode: "ว21103",
        subjectName: "การออกแบบและเทคโนโลยี 1",
        grade: "ชั้นมัธยมศึกษาปีที่ 1",
        hoursPerWeek: 2,
        studentsCount: 25
      },
      {
        subjectCode: "กจ201",
        subjectName: "กิจกรรมพัฒนาผู้เรียน (ลูกเสือ-เนตรนารี / ชุมนุมหุ่นยนต์)",
        grade: "ป.4 - ม.3",
        hoursPerWeek: 4,
        studentsCount: 65
      }
    ],

    specialAssignments: [
      "หัวหน้ากลุ่มงานเทคโนโลยีสารสนเทศและคอมพิวเตอร์ (ICT Director)",
      "ครูผู้รับผิดชอบระบบสารสนเทศเพื่อการบริหารการศึกษา (DMC / EMIS / CCT)",
      "ครูที่ปรึกษานักเรียนชั้นประถมศึกษาปีที่ 6",
      "กรรมการบริหารหลักสูตรและงานวิชาการโรงเรียนวัดบางปูน",
      "ผู้ดูแลเว็บไซต์และเพจประชาสัมพันธ์โรงเรียนวัดบางปูน"
    ]
  },

  // 3. การประเมินครูผู้ช่วย 4 ครั้ง
  intensivePrep: [
    // ครั้งที่ 1
    {
      id: "ip-1-1",
      round: 1,
      category: "การปฏิบัติตน",
      subCategory: "1.1 วินัยและการรักษาวินัย",
      title: "รายงานผลการประเมินวินัย จรรยาบรรณ และการปฏิบัติตน",
      description: "เอกสารสรุปการตรงต่อเวลา การรักษาวินัยข้าราชการ การเคารพกฎหมาย และการปฏิบัติงานตามระเบียบ",
      score: "48/50",
      academicYear: "2564",
      date: "31 ตุลาคม 2564",
      coverUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    {
      id: "ip-1-2",
      round: 1,
      category: "การปฏิบัติงาน",
      subCategory: "2.1 การจัดการเรียนรู้",
      title: "รายงานการออกแบบและจัดทำแผนการจัดการเรียนรู้ Active Learning",
      description: "โครงสร้างหลักสูตร แผนการจัดการเรียนรู้ และบันทึกหลังแผน ภาคเรียนที่ 1/2564",
      score: "47/50",
      academicYear: "2564",
      date: "31 ตุลาคม 2564",
      coverUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    // ครั้งที่ 2
    {
      id: "ip-2-1",
      round: 2,
      category: "การปฏิบัติตน",
      subCategory: "1.4 การดำรงชีวิตตามหลักปรัชญาของเศรษฐกิจพอเพียง",
      title: "การน้อมนำหลักปรัชญาของเศรษฐกิจพอเพียงมาประยุกต์ใช้ในการจัดการเรียนรู้",
      description: "บูรณาการฐานการเรียนรู้โคกหนองนาโมเดลและการออมทรัพย์ในชั้นเรียน",
      score: "49/50",
      academicYear: "2564",
      date: "30 เมษายน 2565",
      coverUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    {
      id: "ip-2-2",
      round: 2,
      category: "การปฏิบัติงาน",
      subCategory: "2.4 การใช้สื่อ นวัตกรรม เทคโนโลยี และแหล่งเรียนรู้",
      title: "รายงานการพัฒนาสื่อนวัตกรรมดิจิทัลเพื่อการเรียนรู้ (Coding Game)",
      description: "ชุดสื่อการสอนบอร์ดเกมและการเขียนโปรแกรมแบบบล็อกสำหรับนักเรียนระดับประถมศึกษา",
      score: "50/50",
      academicYear: "2564",
      date: "30 เมษายน 2565",
      coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    // ครั้งที่ 3
    {
      id: "ip-3-1",
      round: 3,
      category: "การปฏิบัติตน",
      subCategory: "1.5 จิตวิญญาณความเป็นครู",
      title: "รายงานการดูแลช่วยเหลือนักเรียนรายบุคคลและการเยี่ยมบ้าน 100%",
      description: "ระบบดูแลช่วยเหลือนักเรียน การคัดกรอง ทุนการศึกษา และการพัฒนาพฤติกรรมเชิงบวก",
      score: "49/50",
      academicYear: "2565",
      date: "31 ตุลาคม 2565",
      coverUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    {
      id: "ip-3-2",
      round: 3,
      category: "การปฏิบัติงาน",
      subCategory: "2.3 การพัฒนาตนเองและพัฒนาวิชาชีพ (PLC)",
      title: "สรุปผลการเข้าร่วมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) และการอบรม OBEC",
      description: "บันทึกการประชุม PLC 50 ชั่วโมง และเกียรติบัตรการพัฒนาตนเองสายงานวิชาชีพครู",
      score: "48/50",
      academicYear: "2565",
      date: "31 ตุลาคม 2565",
      coverUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    // ครั้งที่ 4
    {
      id: "ip-4-1",
      round: 4,
      category: "การปฏิบัติตน",
      subCategory: "1.6 จิตสำนึกความรับผิดชอบในวิชาชีพครู",
      title: "สรุปภาพรวมการปฏิบัติตน 6 ด้าน ตลอดระยะเวลา 2 ปี (ครูผู้ช่วย)",
      description: "เอกสารสรุปความพร้อม คุณธรรม จรรยาบรรณ และการอุทิศเวลาเพื่อราชการและผู้เรียน",
      score: "50/50",
      academicYear: "2565",
      date: "30 เมษายน 2566",
      coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    {
      id: "ip-4-2",
      round: 4,
      category: "การปฏิบัติงาน",
      subCategory: "2.6 การปฏิบัติงานอื่นที่ได้รับมอบหมาย",
      title: "รายงานการดำเนินโครงการพัฒนาห้องเรียนอัจฉริยะ (Smart Classroom)",
      description: "ผลสัมฤทธิ์โครงการพิเศษ การติดตั้งโครงข่ายสัญญาณ และการพัฒนาสื่อดิจิทัลโรงเรียนวัดบางปูน",
      score: "50/50",
      academicYear: "2565",
      date: "30 เมษายน 2566",
      coverUrl: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    }
  ],

  // 4. การประเมิน วPA (Performance Agreement)
  paRecords: [
    {
      id: "pa-2567",
      fiscalYear: "2567",
      academicYear: "2567",
      targetPosition: "ครูชำนาญการ",
      roundTitle: "รอบการประเมิน วPA ประจำปีงบประมาณ พ.ศ. 2567 (1 ต.ค. 2566 - 30 ก.ย. 2567)",
      challengeTitle: "การพัฒนาผลสัมฤทธิ์ทางการเรียนวิชาวิทยาการคำนวณ เรื่อง การเขียนโปรแกรมแบบบล็อก (Block-based Programming) ด้วยบทเรียนคอมพิวเตอร์ช่วยสอนออนไลน์ (Web Application) สำหรับนักเรียนชั้นประถมศึกษาปีที่ 6",
      challengeObjective: "1. เพื่อยกระดับผลสัมฤทธิ์ทางการเรียนวิชาวิทยาการคำนวณของนักเรียนชั้น ป.6 ให้ผ่านเกณฑ์ร้อยละ 80\n2. เพื่อพัฒนาทักษะการคิดเชิงคำนวณ (Computational Thinking) และการแก้ปัญหาอย่างเป็นระบบ",
      challengeMethod: "ออกแบบบทเรียน Interactive Web App ร่วมกับกระบวนการจัดการเรียนรู้แบบ 5E และการประเมินตามสภาพจริง",
      challengeResult: "นักเรียนชั้นประถมศึกษาปีที่ 6 จำนวน 28 คน มีผลสัมฤทธิ์ทางการเรียนหลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติ และผ่านเกณฑ์ร้อยละ 85.71",
      youtubeVideoId: "",
      youtubeUrl: "",
      pa1DocUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // ข้อตกลง PA-1/ส
      pa2DocUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // รายงานผล PA-2/ส
      pa3DocUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // แบบประเมิน PA-3/ส
      coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
      status: "พร้อมรับการประเมิน",
      totalScore: "",
      isVisible: true,
      indicators: [
        { 
          standard: "ด้านที่ 1 ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด)", 
          shortTitle: "ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด)",
          detail: "สร้างและพัฒนาหลักสูตร, ออกแบบหน่วยการเรียนรู้, จัดกิจกรรมเชิงรุก (Active Learning), สร้างสื่อ/นวัตกรรม, วัดและประเมินผล", 
          score: "", 
          docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          evidenceDetails: "ดำเนินการจัดทำแผนการจัดการเรียนรู้เชิงรุก (Active Learning) ร่วมกับสื่อบทเรียน Web Application วิชาวิทยาการคำนวณ พร้อมเครื่องมือวัดและประเมินผลตามสภาพจริง และบันทึกหลังการสอนครบถ้วน",
          images: [
            { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", caption: "ภาพการจัดกิจกรรมการเรียนรู้เชิงรุก (Active Learning) ในชั้นเรียน" },
            { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80", caption: "การใช้สื่อบทเรียนออนไลน์ Web Application ประกอบการสอน" },
            { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80", caption: "นักเรียนนำเสนอผลงานการเขียนโปรแกรมและชิ้นงานนวัตกรรม" }
          ],
          items: [
            {
              code: "1.1",
              title: "การสร้างและหรือพัฒนาหลักสูตร",
              details: "วิเคราะห์หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน และหลักสูตรสถานศึกษา จัดทำโครงสร้างรายวิชาและหน่วยการเรียนรู้วิทยาการคำนวณ ป.6 ที่สอดคล้องกับมาตรฐานการเรียนรู้",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", caption: "การประชุมวิเคราะห์หลักสูตรและจัดทำคำอธิบายรายวิชา" },
                { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80", caption: "เอกสารหลักสูตรสถานศึกษาและโครงสร้างรายวิชาวิทยาการคำนวณ" }
              ]
            },
            {
              code: "1.2",
              title: "การออกแบบการจัดการเรียนรู้",
              details: "ออกแบบหน่วยการเรียนรู้เรื่อง การเขียนโปรแกรมแบบบล็อก (Block-based Programming) โดยเน้นผู้เรียนเป็นสำคัญ พัฒนาทักษะการคิดเชิงคำนวณและสมรรถนะสำคัญ",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80", caption: "ผังมโนทัศน์หน่วยการเรียนรู้และแผนการจัดการเรียนรู้เชิงรุก" }
              ]
            },
            {
              code: "1.3",
              title: "การจัดกิจกรรมการเรียนรู้",
              details: "จัดกิจกรรมการเรียนรู้เชิงรุก (Active Learning) บูรณาการเกมมิฟิเคชัน (Gamification) ฝึกทักษะการคิดแก้ปัญหาและการทำงานร่วมกันเป็นทีม",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80", caption: "บรรยากาศการจัดกิจกรรม Active Learning ในห้องปฏิบัติการคอมพิวเตอร์" }
              ]
            },
            {
              code: "1.4",
              title: "การสร้างและหรือพัฒนาสื่อ นวัตกรรม เทคโนโลยี และแหล่งเรียนรู้",
              details: "พัฒนาสื่อบทเรียนเว็บแอปพลิเคชัน (Web Application) และแบบฝึกทักษะการเขียนโปรแกรมเชิงโต้ตอบ ช่วยให้นักเรียนฝึกปฏิบัติได้ทุกที่ทุกเวลา",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80", caption: "หน้าจอสื่อการสอน Web Application สำหรับฝึกเขียนโปรแกรม" }
              ]
            },
            {
              code: "1.5",
              title: "การวัดและประเมินผลการเรียนรู้",
              details: "วัดและประเมินผลตามสภาพจริง (Authentic Assessment) ด้วยเครื่องมือที่หลากหลาย เช่น รูบริกส์ประเมินชิ้นงาน, แบบทดสอบออนไลน์ และการประเมินตนเอง",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80", caption: "เครื่องมือวัดผลและเกณฑ์การประเมินรูบริกส์ (Rubrics)" }
              ]
            },
            {
              code: "1.6",
              title: "การศึกษา วิเคราะห์ และสังเคราะห์ เพื่อแก้ไขปัญหาหรือพัฒนาการเรียนรู้",
              details: "ทำวิจัยในชั้นเรียนเพื่อแก้ปัญหาทักษะการคิดเชิงตรรกะและการเขียนโปรแกรมของนักเรียนชั้น ป.6 ด้วยบทเรียนช่วยสอนออนไลน์",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80", caption: "รายงานการวิจัยในชั้นเรียนและผลการวิเคราะห์ทางสถิติ" }
              ]
            },
            {
              code: "1.7",
              title: "การจัดบรรยากาศที่ส่งเสริมและพัฒนาผู้เรียน",
              details: "จัดสภาพแวดล้อมห้องปฏิบัติการคอมพิวเตอร์ให้ปลอดภัย ทันสมัย และเอื้อต่อการเรียนรู้ ส่งเสริมให้ผู้เรียนกล้าคิดและทดลองสร้างสรรค์",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", caption: "การจัดมุมสืบค้นและป้ายนิเทศให้ความรู้ด้านเทคโนโลยี" }
              ]
            },
            {
              code: "1.8",
              title: "การอบรมและพัฒนาคุณลักษณะที่ดีของผู้เรียน",
              details: "ปลูกฝังคุณธรรม จริยธรรม ค่านิยมอันพึงประสงค์ และส่งเสริมความเป็นพลเมืองดิจิทัลที่มีคุณภาพ (Digital Citizenship)",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80", caption: "กิจกรรมโฮมรูมและการให้ความรู้เรื่องความปลอดภัยบนโลกไซเบอร์" }
              ]
            }
          ]
        },
        { 
          standard: "ด้านที่ 2 ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้ (4 ตัวชี้วัด)", 
          shortTitle: "ด้านการส่งเสริมและสนับสนุน (4 ตัวชี้วัด)",
          detail: "จัดทำข้อมูลสารสนเทศนักเรียน, ดำเนินการตามระบบดูแลช่วยเหลือ, ปฏิบัติงานวิชาการและงานสถานศึกษา", 
          score: "", 
          docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          evidenceDetails: "จัดทำระบบสารสนเทศ ปพ.5 ออนไลน์ บันทึกการเยี่ยมบ้านนักเรียนครบ 100% ประสานความร่วมมือกับผู้ปกครอง และปฏิบัติงานกลุ่มบริหารวิชาการของโรงเรียน",
          images: [
            { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80", caption: "การจัดทำระบบสารสนเทศและการดูแลช่วยเหลือนักเรียน" },
            { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80", caption: "การประสานความร่วมมือกับผู้ปกครองและงานสถานศึกษา" }
          ],
          items: [
            {
              code: "2.1",
              title: "การจัดทำข้อมูลสารสนเทศของผู้เรียนและรายวิชา",
              details: "จัดทำระบบสารสนเทศ ปพ.5 ออนไลน์ บันทึกคะแนนเก็บ สถิติการเข้าเรียน และรายงานผลการพัฒนาคุณภาพผู้เรียนอย่างเป็นปัจจุบัน",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80", caption: "แดชบอร์ดสารสนเทศผลสัมฤทธิ์และสถิติการเข้าเรียนออนไลน์" }
              ]
            },
            {
              code: "2.2",
              title: "การดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน",
              details: "ออกเยี่ยมบ้านนักเรียนครบ 100% คัดกรองนักเรียนรายบุคคล ให้คำปรึกษาและประสานงานช่วยเหลือนักเรียนกลุ่มเสี่ยง",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80", caption: "ภาพการลงพื้นที่ออกเยี่ยมบ้านนักเรียนและพูดคุยกับผู้ปกครอง" }
              ]
            },
            {
              code: "2.3",
              title: "การปฏิบัติงานวิชาการ และงานอื่นๆ ของสถานศึกษา",
              details: "ปฏิบัติหน้าที่หัวหน้างานเทคโนโลยีและสารสนเทศโรงเรียน และงานวัดผลประเมินผล ร่วมพัฒนาคุณภาพการศึกษาของสถานศึกษา",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80", caption: "การปฏิบัติหน้าที่งานวิชาการและระบบเครือข่ายโรงเรียน" }
              ]
            },
            {
              code: "2.4",
              title: "การประสานความร่วมมือกับผู้ปกครอง ภาคีเครือข่าย และหรือสถานประกอบการ",
              details: "จัดตั้งกลุ่ม Line ผู้ปกครองเพื่อสื่อสารพัฒนาการของนักเรียน และจัดประชุมผู้ปกครองชั้นเรียนอย่างต่อเนื่อง",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80", caption: "ภาพการประชุมผู้ปกครองและการสื่อสารผ่านเครือข่ายออนไลน์" }
              ]
            }
          ]
        },
        { 
          standard: "ด้านที่ 3 ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด)", 
          shortTitle: "ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด)",
          detail: "พัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง, มีส่วนร่วมในชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC), นำผลมาพัฒนาผู้เรียน", 
          score: "", 
          docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          evidenceDetails: "เข้ารับการอบรมพัฒนาตนเองด้าน AI และวิทยาการคำนวณ 30+ ชั่วโมง จัดตั้งกลุ่ม PLC เพื่อยกระดับทักษะการคิดเชิงคำนวณ และนำผลการพัฒนามาประยุกต์ใช้ในการจัดกิจกรรม",
          images: [
            { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80", caption: "การอบรมพัฒนาวิชาชีพและการแลกเปลี่ยนเรียนรู้ PLC" },
            { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80", caption: "เกียรติบัตรการพัฒนาตนเองและผลงานวิชาชีพ" }
          ],
          items: [
            {
              code: "3.1",
              title: "การพัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง",
              details: "เข้ารับการอบรมพัฒนาทักษะด้านปัญญาประดิษฐ์ (AI in Education) และนวัตกรรมการจัดการเรียนรู้เชิงรุก รวมกว่า 30 ชั่วโมง",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80", caption: "เกียรติบัตรการผ่านการอบรมหลักสูตรพัฒนาวิชาชีพครู" }
              ]
            },
            {
              code: "3.2",
              title: "การมีส่วนร่วมในการแลกเปลี่ยนเรียนรู้ทางวิชาชีพ (PLC)",
              details: "ร่วมจัดตั้งและเป็นผู้นำกลุ่ม PLC ครูผู้สอนกลุ่มสาระวิทยาศาสตร์และเทคโนโลยี แลกเปลี่ยนแนวทางแก้ปัญหาการจัดการเรียนรู้",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80", caption: "บันทึกการประชุมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) และภาพกิจกรรม" }
              ]
            },
            {
              code: "3.3",
              title: "การนำความรู้ ความสามารถ ทักษะที่ได้จากการพัฒนาตนเองมาใช้ในการจัดการเรียนรู้",
              details: "นำเครื่องมือ AI และเทคนิคการสอนเชิงรุกที่ได้จากการอบรมมาปรับปรุงสื่อการสอน บทเรียนออนไลน์ และกิจกรรมในห้องเรียน",
              docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
              images: [
                { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80", caption: "การนำสื่อและนวัตกรรมที่พัฒนามาประยุกต์ใช้ในการสอนนักเรียนจริง" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "pa-2566",
      fiscalYear: "2566",
      academicYear: "2566",
      targetPosition: "ครู คศ.1",
      roundTitle: "รอบการประเมิน วPA ประจำปีงบประมาณ พ.ศ. 2566 (1 ต.ค. 2565 - 30 ก.ย. 2566)",
      challengeTitle: "การจัดการเรียนรู้เชิงรุก (Active Learning) ด้วยบอร์ดเกมการศึกษา (Unplugged Coding) เพื่อพัฒนาทักษะการแก้ปัญหาของนักเรียนชั้นประถมศึกษาปีที่ 4",
      challengeObjective: "เพื่อพัฒนาทักษะการคิดเชิงตรรกะและการเขียนโปรแกรมโดยไม่ใช้คอมพิวเตอร์ (Unplugged Coding)",
      challengeMethod: "ใช้บอร์ดเกมการศึกษาฝึกการจัดลำดับคำสั่ง (Sequence) และเงื่อนไข (Condition)",
      challengeResult: "นักเรียนร้อยละ 90 มีความพึงพอใจและมีทักษะการคิดแก้ปัญหาทางตรรกะในระดับ ดีมาก",
      youtubeVideoId: "",
      youtubeUrl: "",
      pa1DocUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      pa2DocUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      pa3DocUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      coverUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
      status: "พร้อมรับการประเมิน",
      totalScore: "",
      isVisible: true,
      indicators: [
        { 
          standard: "ด้านที่ 1 ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด)", 
          shortTitle: "ด้านการจัดการเรียนรู้ (8 ตัวชี้วัด)",
          detail: "การออกแบบแผนการสอน Unplugged Coding และประเมินผลตามสภาพจริง", 
          score: "", 
          docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          evidenceDetails: "ออกแบบกิจกรรมการเรียนรู้แบบ Unplugged Coding เสริมสร้างทักษะการคิดเชิงตรรกะโดยไม่ใช้คอมพิวเตอร์",
          images: ["https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"]
        },
        { 
          standard: "ด้านที่ 2 ด้านการส่งเสริมและสนับสนุนการจัดการเรียนรู้ (4 ตัวชี้วัด)", 
          shortTitle: "ด้านการส่งเสริมและสนับสนุน (4 ตัวชี้วัด)",
          detail: "ระบบสารสนเทศและการดูแลช่วยเหลือนักเรียนรายบุคคล", 
          score: "", 
          docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          evidenceDetails: "ดำเนินการเยี่ยมบ้านนักเรียนและจัดทำข้อมูลสารสนเทศรายบุคคล",
          images: ["https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80"]
        },
        { 
          standard: "ด้านที่ 3 ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด)", 
          shortTitle: "ด้านการพัฒนาตนเองและวิชาชีพ (3 ตัวชี้วัด)",
          detail: "อบรมหลักสูตรคุรุพัฒนาและแลกเปลี่ยนเรียนรู้ PLC", 
          score: "", 
          docUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          evidenceDetails: "เข้าร่วมกิจกรรมแลกเปลี่ยนเรียนรู้ทางวิชาชีพ PLC ภายในโรงเรียน",
          images: ["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"]
        }
      ]
    }
  ],

  // 5. แผนการจัดการเรียนรู้ (Lesson Plans)
  lessonPlans: [
    {
      id: "lp-1",
      code: "ว16101",
      title: "แผนการจัดการเรียนรู้ วิทยาการคำนวณ ป.6",
      subject: "วิทยาศาสตร์และเทคโนโลยี",
      grade: "ประถมศึกษาปีที่ 6",
      semester: "ภาคเรียนที่ 1",
      academicYear: "2568",
      unitsCount: "12 แผน (20 ชั่วโมง)",
      description: "หน่วยการเรียนรู้ที่ 1 การแก้ปัญหาด้วยเหตุผลเชิงตรรกะ และหน่วยที่ 2 การเขียนโปรแกรมด้วย Scratch 3.0",
      coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      driveUrl: "https://drive.google.com",
      isVisible: true
    },
    {
      id: "lp-2",
      code: "ว15101",
      title: "แผนการจัดการเรียนรู้ วิทยาการคำนวณ ป.5",
      subject: "วิทยาศาสตร์และเทคโนโลยี",
      grade: "ประถมศึกษาปีที่ 5",
      semester: "ภาคเรียนที่ 1",
      academicYear: "2568",
      unitsCount: "10 แผน (20 ชั่วโมง)",
      description: "หน่วยการเรียนรู้การค้นหาข้อมูลทางอินเทอร์เน็ตอย่างปลอดภัยและการเขียนโปรแกรมแบบมีเงื่อนไข",
      coverUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      driveUrl: "https://drive.google.com",
      isVisible: true
    },
    {
      id: "lp-3",
      code: "ว14101",
      title: "แผนการจัดการเรียนรู้ วิทยาการคำนวณ ป.4",
      subject: "วิทยาศาสตร์และเทคโนโลยี",
      grade: "ประถมศึกษาปีที่ 4",
      semester: "ภาคเรียนที่ 1",
      academicYear: "2568",
      unitsCount: "10 แผน (20 ชั่วโมง)",
      description: "เน้นการเรียนรู้แบบ Unplugged Coding และการใช้โปรแกรมประมวลผลคำอย่างมีจริยธรรม",
      coverUrl: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      driveUrl: "https://drive.google.com",
      isVisible: true
    },
    {
      id: "lp-4",
      code: "ว21103",
      title: "แผนการจัดการเรียนรู้ การออกแบบและเทคโนโลยี ม.1",
      subject: "วิทยาศาสตร์และเทคโนโลยี",
      grade: "มัธยมศึกษาปีที่ 1",
      semester: "ภาคเรียนที่ 2",
      academicYear: "2567",
      unitsCount: "14 แผน (20 ชั่วโมง)",
      description: "กระบวนการออกแบบเชิงวิศวกรรม (Engineering Design Process) และการสร้างสิ่งประดิษฐ์เพื่อชุมชน",
      coverUrl: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      driveUrl: "https://drive.google.com",
      isVisible: true
    }
  ],

  // 6. เอกสารทางราชการ (Official Documents)
  officialDocs: [
    {
      id: "doc-1",
      category: "คำสั่งโรงเรียน",
      docNumber: "คำสั่ง รร.วัดบางปูน ที่ 45/2568",
      title: "คำสั่งแต่งตั้งคณะกรรมการจัดทำระบบสารสนเทศและการประเมินผลการเรียนรู้",
      academicYear: "2568",
      issueDate: "15 พฤษภาคม 2568",
      description: "ปฏิบัติหน้าที่หัวหน้างานระบบสารสนเทศและดูแลระบบเครือข่ายอินเทอร์เน็ตของโรงเรียน",
      coverUrl: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    {
      id: "doc-2",
      category: "เกียรติบัตร/วุฒิบัตร",
      docNumber: "สพฐ. ที่ 1892/2567",
      title: "วุฒิบัตรผ่านการอบรมเชิงปฏิบัติการ การจัดการเรียนรู้ด้วย AI สำหรับครูยุคใหม่",
      academicYear: "2567",
      issueDate: "12 กรกฎาคม 2567",
      description: "หลักสูตรพัฒนาครูแกนนำด้านปัญญาประดิษฐ์ทางการศึกษา (AI in Education) จำนวน 20 ชั่วโมง",
      coverUrl: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    {
      id: "doc-3",
      category: "ตารางสอน/ตารางกิจกรรม",
      docNumber: "ตารางสอน ภาคเรียนที่ 1/2568",
      title: "ตารางการสอนและตารางการปฏิบัติงาน ประจำภาคเรียนที่ 1 ปีการศึกษา 2568",
      academicYear: "2568",
      issueDate: "1 พฤษภาคม 2568",
      description: "ภาระงานสอน 20 คาบ/สัปดาห์ พร้อมตารางเวรประจำวันและงานดูแลนักเรียน",
      coverUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    },
    {
      id: "doc-4",
      category: "คำสั่งโรงเรียน",
      docNumber: "คำสั่ง รร.วัดบางปูน ที่ 12/2567",
      title: "คำสั่งแต่งตั้งครูที่ปรึกษาและครูประจำชั้นประถมศึกษาปีที่ 6",
      academicYear: "2567",
      issueDate: "16 พฤษภาคม 2567",
      description: "ปฏิบัติหน้าที่ครูประจำชั้น ควบคุมดูแลระเบียบวินัย และระบบดูแลช่วยเหลือนักเรียน",
      coverUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      isVisible: true
    }
  ],

  // 7. ผลงานและรางวัลที่ภูมิใจ (Achievements & Awards)
  achievements: [
    {
      id: "ach-1",
      type: "teacher", // 'teacher' | 'student'
      title: "รางวัลชนะเลิศ 'ครูผู้สอนดีเด่น ด้านนวัตกรรมการจัดการเรียนรู้ดิจิทัล'",
      level: "ระดับชาติ",
      organization: "กระทรวงศึกษาธิการ ร่วมกับ สมาคมเทคโนโลยีทางการศึกษา",
      academicYear: "2567",
      date: "16 มกราคม 2567",
      description: "ผลงานส่งประกวด: นวัตกรรมแอปพลิเคชันส่งเสริมทักษะการเขียนโปรแกรมสำหรับเด็กประถม",
      coverUrl: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&w=600&q=80",
      certificateUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      badgeColor: "bg-amber-500",
      isVisible: true
    },
    {
      id: "ach-2",
      type: "teacher",
      title: "รางวัลเหรียญทอง ครูผู้สอนยอดเยี่ยม ด้านการบริหารจัดการชั้นเรียน Active Learning",
      level: "ระดับภาค",
      organization: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษา ภาคกลาง",
      academicYear: "2566",
      date: "20 สิงหาคม 2566",
      description: "การแข่งขันมหกรรมวิชาการและนวัตกรรมการศึกษา ภาคกลาง ประจำปี 2566",
      coverUrl: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=600&q=80",
      certificateUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      badgeColor: "bg-blue-600",
      isVisible: true
    },
    {
      id: "ach-3",
      type: "student",
      title: "รางวัลชนะเลิศ เหรียญทอง การแข่งขันหุ่นยนต์และระบบอัตโนมัติ (Robotics)",
      level: "ระดับชาติ",
      organization: "งานศิลปหัตถกรรมนักเรียน ระดับชาติ ครั้งที่ 71",
      academicYear: "2566",
      date: "25 ธันวาคม 2566",
      description: "ครูผู้ฝึกสอนนักเรียนทีมตัวแทนโรงเรียนวัดบางปูน ได้รับรางวัลชนะเลิศอันดับ 1 ระดับประเทศ",
      coverUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
      certificateUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      badgeColor: "bg-emerald-600",
      isVisible: true
    },
    {
      id: "ach-4",
      type: "student",
      title: "รางวัลรองชนะเลิศอันดับ 1 การแข่งขันการสร้างเกมสร้างสรรค์จากคอมพิวเตอร์ (Scratch)",
      level: "ระดับเขตพื้นที่",
      organization: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสิงห์บุรี",
      academicYear: "2567",
      date: "15 พฤศจิกายน 2567",
      description: "นักเรียนชั้นประถมศึกษาปีที่ 6 โรงเรียนวัดบางปูน ได้รับคะแนน 92.50%",
      coverUrl: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=600&q=80",
      certificateUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      badgeColor: "bg-purple-600",
      isVisible: true
    }
  ],

  // 8. ภาพกิจกรรมต่าง ๆ (Activity Gallery)
  gallery: [
    {
      id: "act-1",
      title: "กิจกรรมค่ายวิทยาศาสตร์และหุ่นยนต์ AI & Coding Camp 2024",
      category: "วิชาการ",
      academicYear: "2567",
      date: "18-19 มกราคม 2567",
      location: "หอประชุมโรงเรียนวัดบางปูน",
      description: "จัดกิจกรรมค่ายเพื่อส่งเสริมทักษะการเขียนโปรแกรมและการประกอบหุ่นยนต์สำหรับนักเรียนระดับชั้น ป.4-ม.3",
      coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
      ],
      isVisible: true
    },
    {
      id: "act-2",
      title: "การจัดประชุมและร่วมกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC ประจำสัปดาห์)",
      category: "พัฒนาวิชาชีพ",
      academicYear: "2567",
      date: "ตลอดปีการศึกษา 2567",
      location: "ห้องประชุมวิชาการ โรงเรียนวัดบางปูน",
      description: "แลกเปลี่ยนเรียนรู้การแก้ปัญหาการอ่านไม่ออกเขียนไม่ได้และการพัฒนาทักษะดิจิทัลร่วมกับคณะครู",
      coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80"
      ],
      isVisible: true
    },
    {
      id: "act-3",
      title: "กิจกรรมส่งเสริมคุณธรรม จริยธรรม และวันสำคัญทางพระพุทธศาสนา",
      category: "กิจกรรมพัฒนาผู้เรียน",
      academicYear: "2567",
      date: "20 กรกฎาคม 2567",
      location: "วัดบางปูน จังหวัดสิงห์บุรี",
      description: "นำนักเรียนเข้าร่วมกิจกรรมทำบุญตักบาตรและเวียนเทียนเนื่องในวันอาสาฬหบูชาและวันเข้าพรรษา",
      coverImage: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80"
      ],
      isVisible: true
    },
    {
      id: "act-4",
      title: "การลงพื้นที่เยี่ยมบ้านนักเรียน 100% ประจำภาคเรียนที่ 1/2567",
      category: "ดูแลช่วยเหลือนักเรียน",
      academicYear: "2567",
      date: "1-30 มิถุนายน 2567",
      location: "เขตพื้นที่บริการโรงเรียนวัดบางปูน",
      description: "พบปะผู้ปกครอง สอบถามความเป็นอยู่ และส่งมอบทุนการศึกษาสำหรับนักเรียนยากจนพิเศษ",
      coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
      images: [
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=800&q=80"
      ],
      isVisible: true
    }
  ],

  // 9. ข้อมูลอัปเดตหน้าแรก (Recent Updates / Highlights & Duties)
  recentUpdates: [
    {
      id: "upd-1",
      title: "ได้รับรางวัลชนะเลิศ 'ครูผู้สอนดีเด่น ด้านนวัตกรรมการจัดการเรียนรู้ดิจิทัล' ระดับชาติ",
      category: "รางวัลและผลงานเด่น",
      date: "16 มกราคม 2568",
      academicYear: "2568",
      description: "เข้ารับโล่รางวัลและเกียรติบัตรเชิดชูเกียรติระดับประเทศ ในงานวันครูแห่งชาติ ประจำปี 2568",
      coverUrl: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&w=800&q=80",
      linkUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      badgeColor: "bg-amber-500",
      badgeText: "รางวัลระดับชาติ",
      isVisible: true
    },
    {
      id: "upd-2",
      title: "ปฏิบัติหน้าที่วิทยากรบรรยาย 'การประยุกต์ใช้ AI เพื่อพัฒนาการเรียนรู้สังคมศึกษา'",
      category: "การไปทำหน้าที่ / วิทยากร",
      date: "25 มกราคม 2568",
      academicYear: "2568",
      description: "ร่วมเป็นวิทยากรบรรยายเชิงปฏิบัติการแก่คณะครูในสังกัด สพป.สิงห์บุรี จำนวนกว่า 80 ท่าน",
      coverUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      linkUrl: "",
      badgeColor: "bg-blue-600",
      badgeText: "วิทยากร",
      isVisible: true
    },
    {
      id: "upd-3",
      title: "จัดกิจกรรมค่ายประวัติศาสตร์ท้องถิ่นและคุณธรรมนำความรู้ สำหรับนักเรียนชั้น ป.4-ป.6",
      category: "กิจกรรมการเรียนรู้",
      date: "10 กุมภาพันธ์ 2568",
      academicYear: "2568",
      description: "นำนักเรียนศึกษาแหล่งเรียนรู้ทางประวัติศาสตร์และภูมิปัญญาท้องถิ่นเมืองสิงห์บุรี",
      coverUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
      linkUrl: "",
      badgeColor: "bg-emerald-600",
      badgeText: "กิจกรรม",
      isVisible: true
    }
  ]
};

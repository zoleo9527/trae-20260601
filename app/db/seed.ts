import bcrypt from "bcryptjs";

export async function seedData(pool: any) {
  const hashedPassword = await bcrypt.hash("123456", 10);
  
  const users = [
    { username: "registrar", password_hash: hashedPassword, role: "registrar", name: "报名员小王" },
    { username: "coach", password_hash: hashedPassword, role: "coach", name: "李教练" },
    { username: "safety", password_hash: hashedPassword, role: "safety_officer", name: "张安全员" },
  ];

  const students = [
    { name: "张三", id_card: "110101199001011234", phone: "13800138001", enrollment_date: "2024-01-15" },
    { name: "李四", id_card: "110101199202022345", phone: "13800138002", enrollment_date: "2024-01-16" },
    { name: "王五", id_card: "110101199503033456", phone: "13800138003", enrollment_date: "2024-01-17" },
    { name: "赵六", id_card: "110101199804044567", phone: "13800138004", enrollment_date: "2024-01-18" },
    { name: "钱七", id_card: "110101200005055678", phone: "13800138005", enrollment_date: "2024-01-19" },
  ];

  for (const user of users) {
    await pool.query(
      "INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING",
      [user.username, user.password_hash, user.role, user.name]
    );
  }

  for (const student of students) {
    await pool.query(
      "INSERT INTO students (name, id_card, phone, enrollment_date) VALUES ($1, $2, $3, $4) ON CONFLICT (id_card) DO NOTHING",
      [student.name, student.id_card, student.phone, student.enrollment_date]
    );
  }
}
